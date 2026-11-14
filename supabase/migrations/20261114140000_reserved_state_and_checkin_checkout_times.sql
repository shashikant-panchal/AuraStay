-- ==============================================================================
-- Aavasa PMS: RESERVED Room Lifecycle State + Check-In / Check-Out Timestamps
-- ==============================================================================
-- Flow:
-- 1. Booking (OTA / Direct Guest Website / Admin Reservation) -> reservation CONFIRMED,
--    physical room becomes RESERVED (locked against double booking & OTA overbooking).
-- 2. Admin Checks Guest In -> reservation CHECKED_IN, actual_check_in_time captured,
--    physical room transitions RESERVED -> OCCUPIED.
-- 3. Admin Checks Guest Out -> reservation CHECKED_OUT, actual_check_out_time captured,
--    physical room transitions OCCUPIED -> DIRTY + urgent housekeeping task created.
-- ==============================================================================

-- 1. Broaden rooms.status CHECK constraint to support RESERVED & BLOCKED
DO $$
DECLARE
    c RECORD;
BEGIN
    FOR c IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'rooms'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%status%'
    LOOP
        EXECUTE format('ALTER TABLE rooms DROP CONSTRAINT IF EXISTS %I', c.conname);
    END LOOP;
END $$;

ALTER TABLE rooms
    ADD CONSTRAINT rooms_status_check
    CHECK (status IN ('VACANT_READY', 'RESERVED', 'OCCUPIED', 'DIRTY', 'MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED'));

-- 2. Broaden reservations.status CHECK constraint & add check-in/out timestamp columns
DO $$
DECLARE
    c RECORD;
BEGIN
    FOR c IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'reservations'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%status%'
    LOOP
        EXECUTE format('ALTER TABLE reservations DROP CONSTRAINT IF EXISTS %I', c.conname);
    END LOOP;
END $$;

ALTER TABLE reservations
    ADD CONSTRAINT reservations_status_check
    CHECK (status IN ('CONFIRMED', 'PENDING', 'RESERVED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'));

ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS actual_check_in_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS actual_check_out_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS expected_check_out_time TEXT,
    ADD COLUMN IF NOT EXISTS guest_id_city TEXT;

-- 3. BEFORE trigger to automatically capture exact check-in and check-out timestamps
CREATE OR REPLACE FUNCTION trg_capture_checkin_checkout_times()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'CHECKED_IN' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'CHECKED_IN') THEN
        NEW.actual_check_in_time := COALESCE(NEW.actual_check_in_time, NOW());
    END IF;

    IF NEW.status = 'CHECKED_OUT' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'CHECKED_OUT') THEN
        NEW.actual_check_out_time := COALESCE(NEW.actual_check_out_time, NOW());
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reservations_capture_times ON reservations;
CREATE TRIGGER trg_reservations_capture_times
    BEFORE INSERT OR UPDATE OF status ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION trg_capture_checkin_checkout_times();

-- 4. Update reservation -> room sync trigger so un-checked-in bookings set RESERVED
CREATE OR REPLACE FUNCTION trg_sync_reservation_to_room()
RETURNS TRIGGER AS $$
DECLARE
    clean_room_num TEXT;
    v_covers_today BOOLEAN;
BEGIN
    IF NEW.hotel_id IS NULL OR LENGTH(TRIM(NEW.hotel_id)) = 0 THEN
        RETURN NEW;
    END IF;

    IF NEW.room_number IS NOT NULL OR NEW.room IS NOT NULL THEN
        clean_room_num := COALESCE(
            NULLIF(TRIM(NEW.room_number), ''),
            (regexp_match(COALESCE(NEW.room, ''), '\b(\d+)\b'))[1],
            TRIM(COALESCE(NEW.room, ''))
        );

        v_covers_today := (
            COALESCE(NEW.check_in, CURRENT_DATE) <= CURRENT_DATE
            AND COALESCE(NEW.check_out, CURRENT_DATE + 1) > CURRENT_DATE
        );

        IF NEW.status = 'CHECKED_IN' THEN
            UPDATE rooms
            SET status = 'OCCUPIED',
                guest = NEW.guest,
                booking_id = NEW.id,
                check_out = NEW.check_out,
                updated_at = NOW()
            WHERE hotel_id = NEW.hotel_id
              AND (regexp_replace(room_number, '^Room\s*', '', 'i') = clean_room_num
                   OR id::text = COALESCE(NEW.room_number, NEW.room));

        ELSIF NEW.status IN ('CONFIRMED', 'PENDING', 'RESERVED') THEN
            IF v_covers_today THEN
                UPDATE rooms
                SET status = 'RESERVED',
                    guest = NEW.guest,
                    booking_id = NEW.id,
                    check_out = NEW.check_out,
                    updated_at = NOW()
                WHERE hotel_id = NEW.hotel_id
                  AND (regexp_replace(room_number, '^Room\s*', '', 'i') = clean_room_num
                       OR id::text = COALESCE(NEW.room_number, NEW.room))
                  AND COALESCE(status, 'VACANT_READY') NOT IN ('OCCUPIED', 'MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED');
            END IF;

        ELSIF NEW.status = 'CHECKED_OUT' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'CHECKED_OUT') THEN
            UPDATE rooms
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

            INSERT INTO housekeeping_tasks (id, hotel_id, room_number, task_type, priority, assigned_to, status, notes)
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

        ELSIF NEW.status = 'CANCELLED' THEN
            UPDATE rooms
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

DROP TRIGGER IF EXISTS trg_reservation_room_sync ON reservations;
CREATE TRIGGER trg_reservation_room_sync
    AFTER INSERT OR UPDATE OF status, room_number, room, check_in, check_out ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION trg_sync_reservation_to_room();

-- 5. Update OTA lock trigger: lock room as RESERVED until guest checks in
CREATE OR REPLACE FUNCTION handle_ota_booking_room_lock()
RETURNS TRIGGER AS $$
DECLARE
    v_allocated_room TEXT;
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
        IF NEW.status = 'CANCELLED' THEN
            UPDATE rooms
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

        IF NEW.status IN ('CONFIRMED', 'RESERVED', 'CHECKED_IN') THEN
            v_covers_today := (
                COALESCE(NEW.check_in, CURRENT_DATE) <= CURRENT_DATE
                AND COALESCE(NEW.check_out, CURRENT_DATE + 1) > CURRENT_DATE
            );

            IF NEW.room_number IS NOT NULL AND LENGTH(TRIM(NEW.room_number)) > 0 THEN
                v_allocated_room := TRIM(NEW.room_number);
            ELSE
                SELECT r.room_number INTO v_allocated_room
                FROM rooms r
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
                      FROM reservations res
                      WHERE res.hotel_id = NEW.hotel_id
                        AND res.id <> NEW.id
                        AND COALESCE(res.status, 'CONFIRMED') NOT IN ('CANCELLED', 'CHECKED_OUT', 'NO_SHOW')
                        AND res.check_in < NEW.check_out
                        AND res.check_out > NEW.check_in
                        AND (
                            res.room_number = r.room_number
                            OR regexp_replace(COALESCE(res.room, ''), '^Room\s*', '', 'i') = r.room_number
                        )
                  )
                ORDER BY r.room_number ASC
                LIMIT 1;
            END IF;

            IF v_allocated_room IS NOT NULL THEN
                NEW.room_number := v_allocated_room;
                NEW.room := 'Room ' || v_allocated_room;

                IF v_covers_today OR NEW.status = 'CHECKED_IN' THEN
                    UPDATE rooms
                    SET status = CASE WHEN NEW.status = 'CHECKED_IN' THEN 'OCCUPIED' ELSE 'RESERVED' END,
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

-- 6. Migrate existing active un-checked-in bookings from OCCUPIED -> RESERVED safely
UPDATE rooms r
SET status = 'RESERVED',
    updated_at = NOW()
FROM reservations res
WHERE r.hotel_id = res.hotel_id
  AND r.booking_id = res.id
  AND r.status = 'OCCUPIED'
  AND res.status IN ('CONFIRMED', 'PENDING', 'RESERVED')
  AND res.actual_check_in_time IS NULL;

-- 7. Update Aiosell live inventory matrix view to track RESERVED alongside OCCUPIED
DROP VIEW IF EXISTS aiosell_live_inventory_view;
CREATE VIEW aiosell_live_inventory_view AS
SELECT
    r.hotel_id,
    r.type AS room_type,
    COUNT(r.room_number) AS total_rooms,
    COUNT(CASE WHEN COALESCE(r.status, 'VACANT_READY') = 'VACANT_READY' THEN 1 END) AS available_inventory,
    COUNT(CASE WHEN r.status = 'RESERVED' THEN 1 END) AS reserved_rooms,
    COUNT(CASE WHEN r.status = 'OCCUPIED' THEN 1 END) AS occupied_rooms,
    COUNT(CASE WHEN r.status = 'DIRTY' THEN 1 END) AS dirty_rooms,
    COUNT(CASE WHEN r.status IN ('MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED') THEN 1 END) AS maintenance_rooms,
    CASE
        WHEN COUNT(CASE WHEN COALESCE(r.status, 'VACANT_READY') = 'VACANT_READY' THEN 1 END) = 0 THEN TRUE
        ELSE FALSE
    END AS auto_stop_sell
FROM rooms r
GROUP BY r.hotel_id, r.type;
