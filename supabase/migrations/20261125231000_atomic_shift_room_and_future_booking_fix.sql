-- ============================================================================
-- Aavasa Enterprise PMS: Atomic Room Shift RPC + Future Booking Status Fix
-- 1. Adds atomic `admin_shift_room` RPC (1 single call, 1 transaction):
--    - Transfers reservation (`room_number`, `room`, `room_type`) + folio (`financial_invoices`)
--    - Marks source (old) room as VACANT_READY (clears guest, booking_id, check_out, OTA lock)
--    - Updates target room to OCCUPIED (if CHECKED_IN today) or RESERVED (if arriving today),
--      and leaves target room VACANT_READY if the shifted reservation is for a future date!
-- 2. Updates reservation -> room triggers & `create_guest_reservation` to use IST
--    business date (`Asia/Kolkata`) and NEVER mark a room OCCUPIED/RESERVED for
--    future upcoming bookings (`check_in > today`).
-- 3. Self-heals any rooms currently stuck as OCCUPIED/RESERVED from past broken
--    shifts, future bookings, or already checked-out/cancelled reservations.
-- ============================================================================

-- 1. Helper: current hotel business date in IST (Asia/Kolkata)
CREATE OR REPLACE FUNCTION public.pms_business_today()
RETURNS DATE
LANGUAGE sql
STABLE
AS $$
    SELECT (NOW() AT TIME ZONE 'Asia/Kolkata')::date;
$$;

-- 2. Atomic Shift Room RPC (1 single HTTP request, zero redundant client writes)
CREATE OR REPLACE FUNCTION public.admin_shift_room(
    p_hotel_id TEXT,
    p_source_room_number TEXT,
    p_target_room_number TEXT,
    p_reservation_id TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT 'Guest Request'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hotel_id TEXT := NULLIF(BTRIM(p_hotel_id), '');
    v_src_raw TEXT := NULLIF(BTRIM(p_source_room_number), '');
    v_tgt_raw TEXT := NULLIF(BTRIM(p_target_room_number), '');
    v_res_id_req TEXT := NULLIF(BTRIM(p_reservation_id), '');
    v_today DATE := public.pms_business_today();
    v_src_room public.rooms%ROWTYPE;
    v_tgt_room public.rooms%ROWTYPE;
    v_res public.reservations%ROWTYPE;
    v_other_src_res public.reservations%ROWTYPE;
    v_has_other_src BOOLEAN := FALSE;
    v_res_status TEXT;
    v_covers_today BOOLEAN := FALSE;
    v_target_new_status TEXT;
    v_source_new_status TEXT := 'VACANT_READY';
    v_conflict_exists BOOLEAN := FALSE;
BEGIN
    IF v_hotel_id IS NULL THEN
        RAISE EXCEPTION 'Hotel ID is required to shift a room.';
    END IF;
    IF v_src_raw IS NULL OR v_tgt_raw IS NULL THEN
        RAISE EXCEPTION 'Both source and target room numbers are required.';
    END IF;

    IF COALESCE(auth.role(), '') <> 'service_role' AND NOT public.has_hotel_access(v_hotel_id) THEN
        RAISE EXCEPTION 'Forbidden: Unauthorized tenant access.';
    END IF;

    -- Lock source and target rooms safely
    SELECT * INTO v_src_room
    FROM public.rooms
    WHERE hotel_id = v_hotel_id
      AND (
          room_number = v_src_raw
          OR regexp_replace(room_number, '^Room\s*', '', 'i') = regexp_replace(v_src_raw, '^Room\s*', '', 'i')
      )
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source room #% was not found.', v_src_raw;
    END IF;

    SELECT * INTO v_tgt_room
    FROM public.rooms
    WHERE hotel_id = v_hotel_id
      AND (
          room_number = v_tgt_raw
          OR regexp_replace(room_number, '^Room\s*', '', 'i') = regexp_replace(v_tgt_raw, '^Room\s*', '', 'i')
      )
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target room #% does not exist.', v_tgt_raw;
    END IF;

    IF v_src_room.room_number = v_tgt_room.room_number THEN
        RAISE EXCEPTION 'Target room must be different from the current room.';
    END IF;

    IF UPPER(COALESCE(v_tgt_room.status, 'VACANT_READY')) IN ('MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED') THEN
        RAISE EXCEPTION 'Target room #% is currently blocked for maintenance.', v_tgt_room.room_number;
    END IF;

    -- Resolve the exact active reservation to shift
    IF v_res_id_req IS NOT NULL THEN
        SELECT * INTO v_res
        FROM public.reservations
        WHERE hotel_id = v_hotel_id
          AND id = v_res_id_req
          AND UPPER(COALESCE(status, 'CONFIRMED')) NOT IN ('CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW')
        LIMIT 1
        FOR UPDATE;
    END IF;

    IF NOT FOUND AND v_src_room.booking_id IS NOT NULL THEN
        SELECT * INTO v_res
        FROM public.reservations
        WHERE hotel_id = v_hotel_id
          AND id = v_src_room.booking_id
          AND UPPER(COALESCE(status, 'CONFIRMED')) NOT IN ('CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW')
        LIMIT 1
        FOR UPDATE;
    END IF;

    IF NOT FOUND THEN
        SELECT * INTO v_res
        FROM public.reservations
        WHERE hotel_id = v_hotel_id
          AND UPPER(COALESCE(status, 'CONFIRMED')) NOT IN ('CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW')
          AND (
              room_number = v_src_room.room_number
              OR (NULLIF(BTRIM(COALESCE(room_number, '')), '') IS NULL AND regexp_replace(COALESCE(room, ''), '^Room\s*', '', 'i') = v_src_room.room_number)
          )
        ORDER BY
            CASE WHEN UPPER(COALESCE(status, '')) IN ('CHECKED_IN', 'CHECKEDIN', 'OCCUPIED') THEN 0 ELSE 1 END,
            CASE WHEN COALESCE(check_in, v_today) <= v_today AND COALESCE(check_out, v_today + 1) > v_today THEN 0 ELSE 1 END,
            check_in ASC
        LIMIT 1
        FOR UPDATE;
    END IF;

    -- Check if target room already has an overlapping active reservation (or active checked-in stay)
    IF v_res.id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1
            FROM public.reservations r2
            WHERE r2.hotel_id = v_hotel_id
              AND r2.id <> v_res.id
              AND UPPER(COALESCE(r2.status, 'CONFIRMED')) NOT IN ('CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW')
              AND (
                  r2.room_number = v_tgt_room.room_number
                  OR (NULLIF(BTRIM(COALESCE(r2.room_number, '')), '') IS NULL AND regexp_replace(COALESCE(r2.room, ''), '^Room\s*', '', 'i') = v_tgt_room.room_number)
              )
              AND (
                  (UPPER(COALESCE(r2.status, '')) IN ('CHECKED_IN', 'CHECKEDIN', 'OCCUPIED') AND COALESCE(v_res.check_in, v_today) <= GREATEST(COALESCE(r2.check_out, v_today + 1), v_today))
                  OR (r2.check_in < v_res.check_out AND r2.check_out > v_res.check_in)
              )
        ) INTO v_conflict_exists;

        IF v_conflict_exists THEN
            RAISE EXCEPTION 'Target room #% already has a conflicting booking for these dates.', v_tgt_room.room_number;
        END IF;
    ELSIF UPPER(COALESCE(v_tgt_room.status, 'VACANT_READY')) = 'OCCUPIED' THEN
        RAISE EXCEPTION 'Target room #% is currently occupied.', v_tgt_room.room_number;
    END IF;

    v_res_status := UPPER(COALESCE(v_res.status, ''));
    v_covers_today := (
        v_res.id IS NOT NULL
        AND COALESCE(v_res.check_in, v_today) <= v_today
        AND COALESCE(v_res.check_out, v_today + 1) > v_today
    );

    -- Determine target room status:
    -- Future booking (check_in > today) must NOT mark target room OCCUPIED/RESERVED today!
    IF v_res.id IS NOT NULL THEN
        IF v_res_status IN ('CHECKED_IN', 'CHECKEDIN', 'OCCUPIED') AND COALESCE(v_res.check_in, v_today) <= v_today THEN
            v_target_new_status := 'OCCUPIED';
        ELSIF v_res_status IN ('CONFIRMED', 'PENDING', 'RESERVED') AND v_covers_today THEN
            v_target_new_status := 'RESERVED';
        ELSE
            v_target_new_status := COALESCE(v_tgt_room.status, 'VACANT_READY');
        END IF;
    ELSE
        -- Fallback when shifting an occupied room without a linked reservation row
        v_target_new_status := CASE
            WHEN UPPER(COALESCE(v_src_room.status, '')) = 'RESERVED' THEN 'RESERVED'
            ELSE 'OCCUPIED'
        END;
    END IF;

    -- 1) Update the reservation row (updates BOTH room_number AND room AND room_type!)
    IF v_res.id IS NOT NULL THEN
        UPDATE public.reservations
        SET room_number = v_tgt_room.room_number,
            room = 'Room ' || v_tgt_room.room_number || ' - ' || COALESCE(v_tgt_room.type, 'Standard Room'),
            room_type = COALESCE(v_tgt_room.type, room_type),
            updated_at = NOW()
        WHERE id = v_res.id
          AND hotel_id = v_hotel_id;

        -- Move any saved folio/invoice row to the new room number
        UPDATE public.financial_invoices
        SET room_number = v_tgt_room.room_number,
            updated_at = NOW()
        WHERE hotel_id = v_hotel_id
          AND reservation_id = v_res.id;
    END IF;

    -- 2) Update target room
    IF v_target_new_status IN ('OCCUPIED', 'RESERVED') THEN
        UPDATE public.rooms
        SET status = v_target_new_status,
            housekeeping = 'Clean',
            guest = COALESCE(v_res.guest, v_src_room.guest),
            booking_id = COALESCE(v_res.id, v_src_room.booking_id),
            check_out = COALESCE(v_res.check_out, v_src_room.check_out),
            is_ota_locked = COALESCE(v_src_room.is_ota_locked, FALSE),
            ota_channel = v_src_room.ota_channel,
            updated_at = NOW()
        WHERE id = v_tgt_room.id
          AND hotel_id = v_hotel_id;
    END IF;

    -- 3) Check if source room has any OTHER active booking covering TODAY
    SELECT * INTO v_other_src_res
    FROM public.reservations
    WHERE hotel_id = v_hotel_id
      AND (v_res.id IS NULL OR id <> v_res.id)
      AND UPPER(COALESCE(status, 'CONFIRMED')) NOT IN ('CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW')
      AND room_number = v_src_room.room_number
      AND (
          (UPPER(COALESCE(status, '')) IN ('CHECKED_IN', 'CHECKEDIN', 'OCCUPIED') AND COALESCE(check_in, v_today) <= v_today)
          OR (UPPER(COALESCE(status, '')) IN ('CONFIRMED', 'PENDING', 'RESERVED') AND COALESCE(check_in, v_today) <= v_today AND COALESCE(check_out, v_today + 1) > v_today)
      )
    ORDER BY
        CASE WHEN UPPER(COALESCE(status, '')) IN ('CHECKED_IN', 'CHECKEDIN', 'OCCUPIED') THEN 0 ELSE 1 END,
        check_in ASC
    LIMIT 1;
    v_has_other_src := FOUND;

    -- 4) Release source (old) room -> VACANT_READY (unless another active stay covers today)
    IF v_has_other_src THEN
        v_source_new_status := CASE
            WHEN UPPER(COALESCE(v_other_src_res.status, '')) IN ('CHECKED_IN', 'CHECKEDIN', 'OCCUPIED') THEN 'OCCUPIED'
            ELSE 'RESERVED'
        END;

        UPDATE public.rooms
        SET status = v_source_new_status,
            guest = v_other_src_res.guest,
            booking_id = v_other_src_res.id,
            check_out = v_other_src_res.check_out,
            is_ota_locked = FALSE,
            ota_channel = NULL,
            updated_at = NOW()
        WHERE id = v_src_room.id
          AND hotel_id = v_hotel_id;
    ELSE
        v_source_new_status := 'VACANT_READY';

        UPDATE public.rooms
        SET status = 'VACANT_READY',
            housekeeping = 'Clean',
            guest = NULL,
            booking_id = NULL,
            check_out = NULL,
            is_ota_locked = FALSE,
            ota_channel = NULL,
            updated_at = NOW()
        WHERE id = v_src_room.id
          AND hotel_id = v_hotel_id;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'sourceRoom', v_src_room.room_number,
        'sourceStatus', v_source_new_status,
        'targetRoom', v_tgt_room.room_number,
        'targetType', COALESCE(v_tgt_room.type, 'Standard Room'),
        'targetStatus', v_target_new_status,
        'reservationId', v_res.id,
        'guest', COALESCE(v_res.guest, v_src_room.guest),
        'checkOut', COALESCE(v_res.check_out, v_src_room.check_out),
        'reason', COALESCE(NULLIF(BTRIM(p_reason), ''), 'Guest Request')
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_shift_room(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_shift_room(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- 3. Fix trg_sync_reservation_to_room():
--    - Uses IST business date (`pms_business_today()`)
--    - NEVER marks a room OCCUPIED/RESERVED for future bookings (`check_in > today`)
--    - Releases old room to VACANT_READY if `room_number` changes on UPDATE
--    - Releases room if booking dates move into the future
CREATE OR REPLACE FUNCTION public.trg_sync_reservation_to_room()
RETURNS TRIGGER AS $$
DECLARE
    clean_room_num TEXT;
    old_room_num TEXT;
    v_today DATE := public.pms_business_today();
    v_covers_today BOOLEAN;
    v_new_status TEXT := UPPER(COALESCE(NEW.status, 'CONFIRMED'));
    v_old_status TEXT := CASE WHEN TG_OP = 'UPDATE' THEN UPPER(COALESCE(OLD.status, '')) ELSE '' END;
BEGIN
    IF NEW.hotel_id IS NULL OR LENGTH(TRIM(NEW.hotel_id)) = 0 THEN
        RETURN NEW;
    END IF;

    clean_room_num := COALESCE(
        NULLIF(TRIM(NEW.room_number), ''),
        (regexp_match(COALESCE(NEW.room, ''), '\b(\d+)\b'))[1],
        NULLIF(TRIM(COALESCE(NEW.room, '')), '')
    );

    IF TG_OP = 'UPDATE' THEN
        old_room_num := COALESCE(
            NULLIF(TRIM(OLD.room_number), ''),
            (regexp_match(COALESCE(OLD.room, ''), '\b(\d+)\b'))[1],
            NULLIF(TRIM(COALESCE(OLD.room, '')), '')
        );

        -- If reservation moved to a different room, release old room back to VACANT_READY
        IF old_room_num IS NOT NULL AND clean_room_num IS DISTINCT FROM old_room_num THEN
            UPDATE public.rooms
            SET status = 'VACANT_READY',
                housekeeping = 'Clean',
                guest = NULL,
                booking_id = NULL,
                check_out = NULL,
                is_ota_locked = FALSE,
                ota_channel = NULL,
                updated_at = NOW()
            WHERE hotel_id = NEW.hotel_id
              AND booking_id = NEW.id
              AND regexp_replace(room_number, '^Room\s*', '', 'i') = old_room_num;
        END IF;
    END IF;

    IF clean_room_num IS NOT NULL THEN
        v_covers_today := (
            COALESCE(NEW.check_in, v_today) <= v_today
            AND COALESCE(NEW.check_out, v_today + 1) > v_today
        );

        IF v_new_status IN ('CHECKED_IN', 'CHECKEDIN', 'OCCUPIED') THEN
            -- Only mark room OCCUPIED if stay has actually started (not a future date)
            IF COALESCE(NEW.check_in, v_today) <= v_today THEN
                UPDATE public.rooms
                SET status = 'OCCUPIED',
                    guest = NEW.guest,
                    booking_id = NEW.id,
                    check_out = NEW.check_out,
                    updated_at = NOW()
                WHERE hotel_id = NEW.hotel_id
                  AND (regexp_replace(room_number, '^Room\s*', '', 'i') = clean_room_num
                       OR id::text = COALESCE(NEW.room_number, NEW.room));
            END IF;

        ELSIF v_new_status IN ('CONFIRMED', 'PENDING', 'RESERVED') THEN
            IF v_covers_today THEN
                UPDATE public.rooms
                SET status = 'RESERVED',
                    guest = NEW.guest,
                    booking_id = NEW.id,
                    check_out = NEW.check_out,
                    updated_at = NOW()
                WHERE hotel_id = NEW.hotel_id
                  AND (regexp_replace(room_number, '^Room\s*', '', 'i') = clean_room_num
                       OR id::text = COALESCE(NEW.room_number, NEW.room))
                  AND (
                      COALESCE(status, 'VACANT_READY') NOT IN ('OCCUPIED', 'MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED')
                      OR booking_id = NEW.id
                  );
            ELSE
                -- Future or expired non-checked-in reservation must NOT hold room OCCUPIED/RESERVED today
                UPDATE public.rooms
                SET status = 'VACANT_READY',
                    guest = NULL,
                    booking_id = NULL,
                    check_out = NULL,
                    is_ota_locked = FALSE,
                    ota_channel = NULL,
                    updated_at = NOW()
                WHERE hotel_id = NEW.hotel_id
                  AND booking_id = NEW.id
                  AND COALESCE(status, 'VACANT_READY') IN ('RESERVED', 'OCCUPIED');
            END IF;

        ELSIF v_new_status IN ('CHECKED_OUT', 'CHECKEDOUT') AND (TG_OP = 'INSERT' OR v_old_status NOT IN ('CHECKED_OUT', 'CHECKEDOUT')) THEN
            UPDATE public.rooms
            SET status = 'DIRTY',
                guest = NULL,
                booking_id = NULL,
                check_out = NULL,
                is_ota_locked = FALSE,
                ota_channel = NULL,
                updated_at = NOW()
            WHERE hotel_id = NEW.hotel_id
              AND (booking_id = NEW.id
                   OR regexp_replace(room_number, '^Room\s*', '', 'i') = clean_room_num);

            INSERT INTO public.housekeeping_tasks (id, hotel_id, room_number, task_type, priority, assigned_to, status, notes)
            VALUES (
                'HK-' || floor(random()*90000 + 10000)::text,
                NEW.hotel_id,
                clean_room_num,
                'Full Room Turnover (Departure Clean)',
                'Urgent',
                'Unassigned',
                'PENDING',
                'Automated turnover task generated from guest check-out for ' || COALESCE(NEW.guest, 'Guest')
            )
            ON CONFLICT (id) DO NOTHING;

        ELSIF v_new_status IN ('CANCELLED', 'NO_SHOW') THEN
            UPDATE public.rooms
            SET status = 'VACANT_READY',
                guest = NULL,
                booking_id = NULL,
                check_out = NULL,
                is_ota_locked = FALSE,
                ota_channel = NULL,
                updated_at = NOW()
            WHERE hotel_id = NEW.hotel_id
              AND booking_id = NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Fix handle_ota_booking_room_lock() to use IST business date (`pms_business_today()`)
CREATE OR REPLACE FUNCTION public.handle_ota_booking_room_lock()
RETURNS TRIGGER AS $$
DECLARE
    v_allocated_room TEXT;
    v_today DATE := public.pms_business_today();
    v_covers_today BOOLEAN;
BEGIN
    IF NEW.hotel_id IS NULL OR LENGTH(TRIM(NEW.hotel_id)) = 0 THEN
        RETURN NEW;
    END IF;

    IF (
        NEW.source ILIKE '%Aiosell%'
        OR NEW.source ILIKE '%booking.com%'
        OR NEW.source ILIKE '%MakeMyTrip%'
        OR NEW.source ILIKE '%MMT%'
        OR NEW.source ILIKE '%Agoda%'
        OR NEW.source ILIKE '%Expedia%'
        OR NEW.source ILIKE '%Goibibo%'
        OR NEW.source ILIKE '%Airbnb%'
    ) THEN
        IF UPPER(COALESCE(NEW.status, '')) IN ('CANCELLED', 'NO_SHOW') THEN
            UPDATE public.rooms
            SET status = 'VACANT_READY',
                guest = NULL,
                booking_id = NULL,
                check_out = NULL,
                is_ota_locked = FALSE,
                ota_channel = NULL,
                updated_at = NOW()
            WHERE hotel_id = NEW.hotel_id
              AND booking_id = NEW.id;

            RETURN NEW;
        END IF;

        IF UPPER(COALESCE(NEW.status, '')) IN ('CONFIRMED', 'RESERVED', 'CHECKED_IN') THEN
            v_covers_today := (
                COALESCE(NEW.check_in, v_today) <= v_today
                AND COALESCE(NEW.check_out, v_today + 1) > v_today
            );

            IF NEW.room_number IS NOT NULL AND LENGTH(TRIM(NEW.room_number)) > 0 THEN
                v_allocated_room := TRIM(NEW.room_number);
            ELSE
                SELECT r.room_number INTO v_allocated_room
                FROM public.rooms r
                WHERE r.hotel_id = NEW.hotel_id
                  AND COALESCE(r.status, 'VACANT_READY') NOT IN ('MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED')
                  AND (
                      NOT v_covers_today
                      OR COALESCE(r.status, 'VACANT_READY') NOT IN ('OCCUPIED', 'RESERVED')
                      OR r.booking_id = NEW.id
                  )
                  AND (
                      r.type ILIKE '%' || COALESCE(NEW.room_type, 'Room') || '%'
                      OR COALESCE(NEW.room_type, 'Room') ILIKE '%' || COALESCE(r.type, '') || '%'
                  )
                  AND NOT EXISTS (
                      SELECT 1
                      FROM public.reservations res
                      WHERE res.hotel_id = NEW.hotel_id
                        AND res.id <> NEW.id
                        AND UPPER(COALESCE(res.status, 'CONFIRMED')) NOT IN ('CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW')
                        AND res.check_in < NEW.check_out
                        AND res.check_out > NEW.check_in
                        AND (
                            res.room_number = r.room_number
                            OR (NULLIF(BTRIM(COALESCE(res.room_number, '')), '') IS NULL AND regexp_replace(COALESCE(res.room, ''), '^Room\s*', '', 'i') = r.room_number)
                        )
                  )
                ORDER BY r.room_number ASC
                LIMIT 1;
            END IF;

            IF v_allocated_room IS NOT NULL THEN
                NEW.room_number := v_allocated_room;
                NEW.room := 'Room ' || v_allocated_room;

                IF v_covers_today OR (UPPER(COALESCE(NEW.status, '')) = 'CHECKED_IN' AND COALESCE(NEW.check_in, v_today) <= v_today) THEN
                    UPDATE public.rooms
                    SET status = CASE WHEN UPPER(COALESCE(NEW.status, '')) = 'CHECKED_IN' THEN 'OCCUPIED' ELSE 'RESERVED' END,
                        guest = NEW.guest,
                        booking_id = NEW.id,
                        check_out = NEW.check_out,
                        is_ota_locked = TRUE,
                        ota_channel = NEW.source,
                        updated_at = NOW()
                    WHERE hotel_id = NEW.hotel_id
                      AND room_number = v_allocated_room;
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Update create_guest_reservation to use IST business date (`pms_business_today()`)
CREATE OR REPLACE FUNCTION public.create_guest_reservation(
    p_booking_id TEXT,
    p_hotel_id TEXT,
    p_guest TEXT,
    p_guest_email TEXT,
    p_guest_phone TEXT,
    p_room_category TEXT,
    p_check_in DATE,
    p_check_out DATE,
    p_amount NUMERIC,
    p_adults INT DEFAULT 2,
    p_children INT DEFAULT 0,
    p_preferred_room_number TEXT DEFAULT NULL,
    p_special_requests TEXT DEFAULT NULL,
    p_source TEXT DEFAULT 'Direct Website'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hotel RECORD;
    v_booking_id TEXT := COALESCE(NULLIF(BTRIM(p_booking_id), ''), 'AST-B-' || floor(random() * 9000 + 1000)::text);
    v_cat_clean TEXT := COALESCE(NULLIF(BTRIM(p_room_category), ''), 'Standard Room');
    v_allocated_room TEXT;
    v_allocated_type TEXT;
    v_nights INT;
    v_today DATE := public.pms_business_today();
    v_covers_today BOOLEAN;
    v_final_amount NUMERIC;
    v_room_price NUMERIC;
BEGIN
    IF p_hotel_id IS NULL OR BTRIM(p_hotel_id) = '' THEN
        RAISE EXCEPTION 'Hotel ID is required.';
    END IF;
    IF p_guest IS NULL OR BTRIM(p_guest) = '' THEN
        RAISE EXCEPTION 'Guest name is required.';
    END IF;
    IF p_check_in IS NULL OR p_check_out IS NULL OR p_check_out <= p_check_in THEN
        RAISE EXCEPTION 'Check-out date must be after check-in date.';
    END IF;

    SELECT id, name, status INTO v_hotel
    FROM public.hotels
    WHERE id = BTRIM(p_hotel_id)
    LIMIT 1;

    IF NOT FOUND OR COALESCE(v_hotel.status, 'ACTIVE') <> 'ACTIVE' THEN
        RAISE EXCEPTION 'Property is unavailable for booking.';
    END IF;

    v_nights := GREATEST(1, (p_check_out - p_check_in));
    v_covers_today := (p_check_in <= v_today AND p_check_out > v_today);

    IF p_preferred_room_number IS NOT NULL AND BTRIM(p_preferred_room_number) <> '' THEN
        SELECT r.room_number, r.type, r.price
        INTO v_allocated_room, v_allocated_type, v_room_price
        FROM public.rooms r
        WHERE r.hotel_id = v_hotel.id
          AND r.room_number = BTRIM(p_preferred_room_number)
          AND COALESCE(UPPER(r.status), 'VACANT_READY') NOT IN ('MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED')
          AND (NOT v_covers_today OR COALESCE(UPPER(r.status), 'VACANT_READY') NOT IN ('OCCUPIED', 'RESERVED'))
          AND NOT EXISTS (
              SELECT 1 FROM public.reservations res
              WHERE res.hotel_id = v_hotel.id
                AND COALESCE(UPPER(res.status), 'CONFIRMED') NOT IN ('CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW')
                AND res.check_in < p_check_out
                AND res.check_out > p_check_in
                AND (res.room_number = r.room_number OR (NULLIF(BTRIM(COALESCE(res.room_number, '')), '') IS NULL AND regexp_replace(COALESCE(res.room, ''), '^Room\s*', '', 'i') = r.room_number))
          )
        FOR UPDATE OF r;
    END IF;

    IF v_allocated_room IS NULL THEN
        SELECT r.room_number, r.type, r.price
        INTO v_allocated_room, v_allocated_type, v_room_price
        FROM public.rooms r
        WHERE r.hotel_id = v_hotel.id
          AND COALESCE(UPPER(r.status), 'VACANT_READY') NOT IN ('MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED')
          AND (
              NOT v_covers_today
              OR COALESCE(UPPER(r.status), 'VACANT_READY') NOT IN ('OCCUPIED', 'RESERVED')
          )
          AND (
              LOWER(COALESCE(r.type, '')) = LOWER(v_cat_clean)
              OR LOWER(COALESCE(r.type, '')) LIKE '%' || LOWER(regexp_replace(v_cat_clean, '\s*room$', '', 'i')) || '%'
              OR LOWER(v_cat_clean) LIKE '%' || LOWER(regexp_replace(COALESCE(r.type, ''), '\s*room$', '', 'i')) || '%'
          )
          AND NOT EXISTS (
              SELECT 1 FROM public.reservations res
              WHERE res.hotel_id = v_hotel.id
                AND COALESCE(UPPER(res.status), 'CONFIRMED') NOT IN ('CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW')
                AND res.check_in < p_check_out
                AND res.check_out > p_check_in
                AND (res.room_number = r.room_number OR (NULLIF(BTRIM(COALESCE(res.room_number, '')), '') IS NULL AND regexp_replace(COALESCE(res.room, ''), '^Room\s*', '', 'i') = r.room_number))
          )
        ORDER BY r.room_number ASC
        LIMIT 1
        FOR UPDATE OF r;
    END IF;

    IF v_allocated_room IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'code', 'NO_INVENTORY',
            'message', format('Sorry, all %s units are reserved for %s to %s.', v_cat_clean, p_check_in, p_check_out)
        );
    END IF;

    v_allocated_type := COALESCE(NULLIF(BTRIM(v_allocated_type), ''), v_cat_clean);
    v_final_amount := CASE
        WHEN p_amount IS NOT NULL AND p_amount > 0 THEN p_amount
        ELSE COALESCE(v_room_price, 2500) * v_nights
    END;

    INSERT INTO public.reservations (
        id, hotel_id, guest, guest_email, guest_phone, room, room_number, room_type,
        check_in, check_out, nights, adults, children, amount, paid, advance_paid,
        status, payment, special_requests, source
    )
    VALUES (
        v_booking_id,
        v_hotel.id,
        BTRIM(p_guest),
        NULLIF(BTRIM(p_guest_email), ''),
        NULLIF(BTRIM(p_guest_phone), ''),
        'Room ' || v_allocated_room || ' - ' || v_allocated_type,
        v_allocated_room,
        v_allocated_type,
        p_check_in,
        p_check_out,
        v_nights,
        GREATEST(1, COALESCE(p_adults, 2)),
        GREATEST(0, COALESCE(p_children, 0)),
        v_final_amount,
        0,
        0,
        'CONFIRMED',
        'PENDING',
        NULLIF(BTRIM(p_special_requests), ''),
        COALESCE(NULLIF(BTRIM(p_source), ''), 'Direct Website (' || COALESCE(v_hotel.name, 'Property') || ')')
    );

    IF v_covers_today THEN
        UPDATE public.rooms
        SET status = 'RESERVED',
            guest = BTRIM(p_guest),
            booking_id = v_booking_id,
            check_out = p_check_out,
            updated_at = NOW()
        WHERE hotel_id = v_hotel.id
          AND room_number = v_allocated_room;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'bookingId', v_booking_id,
        'hotelId', v_hotel.id,
        'roomNumber', v_allocated_room,
        'roomType', v_allocated_type,
        'amount', v_final_amount,
        'status', 'CONFIRMED'
    );
END;
$$;

-- 6. Self-healing repair for any rooms currently stuck from future bookings or prior broken shifts
DO $$
DECLARE
    v_today DATE := public.pms_business_today();
BEGIN
    -- 6a. First fix reservations where previous shiftRoom updated `room` ("Room 205") but forgot `room_number`
    UPDATE public.reservations
    SET room_number = (regexp_match(room, '\b(\d+)\b'))[1],
        updated_at = NOW()
    WHERE room IS NOT NULL
      AND (regexp_match(room, '\b(\d+)\b'))[1] IS NOT NULL
      AND room_number IS DISTINCT FROM (regexp_match(room, '\b(\d+)\b'))[1]
      AND UPPER(COALESCE(status, '')) NOT IN ('CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW');

    -- 6b. Release rooms linked to future bookings, checked-out/cancelled bookings, or shifted bookings
    UPDATE public.rooms r
    SET status = 'VACANT_READY',
        housekeeping = 'Clean',
        guest = NULL,
        booking_id = NULL,
        check_out = NULL,
        is_ota_locked = FALSE,
        ota_channel = NULL,
        updated_at = NOW()
    WHERE COALESCE(UPPER(r.status), 'VACANT_READY') IN ('OCCUPIED', 'RESERVED')
      AND r.booking_id IS NOT NULL
      AND EXISTS (
          SELECT 1
          FROM public.reservations res
          WHERE res.hotel_id = r.hotel_id
            AND res.id = r.booking_id
            AND (
                UPPER(COALESCE(res.status, '')) IN ('CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW')
                OR COALESCE(res.check_in, v_today) > v_today
                OR (
                    NULLIF(BTRIM(COALESCE(res.room_number, '')), '') IS NOT NULL
                    AND regexp_replace(res.room_number, '^Room\s*', '', 'i') <> regexp_replace(r.room_number, '^Room\s*', '', 'i')
                )
            )
      )
      AND NOT EXISTS (
          SELECT 1
          FROM public.reservations active_res
          WHERE active_res.hotel_id = r.hotel_id
            AND active_res.id <> r.booking_id
            AND UPPER(COALESCE(active_res.status, '')) NOT IN ('CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW')
            AND regexp_replace(COALESCE(NULLIF(BTRIM(active_res.room_number), ''), active_res.room, ''), '^Room\s*', '', 'i') = regexp_replace(r.room_number, '^Room\s*', '', 'i')
            AND COALESCE(active_res.check_in, v_today) <= v_today
            AND (
                UPPER(COALESCE(active_res.status, '')) IN ('CHECKED_IN', 'CHECKEDIN', 'OCCUPIED')
                OR COALESCE(active_res.check_out, v_today + 1) > v_today
            )
      );
END $$;
