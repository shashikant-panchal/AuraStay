-- ============================================================================
-- Aavasa Enterprise PMS: Atomic Room Edit RPC (admin_update_room)
-- Allows hotel admins to edit pre-entered room details (room number, category,
-- floor, bed type, tariff, RFID key card, phone extension, smoking, cleanliness)
-- strictly scoped by hotel_id, without consuming creation quota and while
-- preserving active OCCUPIED / RESERVED stay statuses and cascading renamed room numbers.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_update_room(
    p_hotel_id TEXT,
    p_original_room_number TEXT,
    p_new_room_number TEXT,
    p_target_room_id UUID DEFAULT NULL,
    p_room_type_id TEXT DEFAULT NULL,
    p_floor TEXT DEFAULT NULL,
    p_type TEXT DEFAULT NULL,
    p_bed TEXT DEFAULT NULL,
    p_price NUMERIC DEFAULT NULL,
    p_key_card_no TEXT DEFAULT NULL,
    p_is_smoking BOOLEAN DEFAULT NULL,
    p_phone_extension TEXT DEFAULT NULL,
    p_housekeeping TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_interconnecting_room TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hotel_id TEXT := NULLIF(BTRIM(p_hotel_id), '');
    v_orig_num TEXT := NULLIF(BTRIM(p_original_room_number), '');
    v_new_num TEXT := NULLIF(BTRIM(p_new_room_number), '');
    v_room public.rooms%ROWTYPE;
    v_updated public.rooms%ROWTYPE;
    v_old_num TEXT;
    v_resolved_rt_id TEXT;
    v_next_status TEXT;
    v_hk_clean TEXT := NULLIF(BTRIM(p_housekeeping), '');
    v_status_req TEXT := UPPER(NULLIF(BTRIM(p_status), ''));
BEGIN
    IF v_hotel_id IS NULL THEN
        RAISE EXCEPTION 'Hotel ID is required to update a room.';
    END IF;

    IF v_new_num IS NULL THEN
        RAISE EXCEPTION 'Room Number is required.';
    END IF;

    IF p_price IS NOT NULL AND p_price <= 0 THEN
        RAISE EXCEPTION 'Tariff per night must be greater than zero.';
    END IF;

    IF p_target_room_id IS NOT NULL THEN
        SELECT * INTO v_room
        FROM public.rooms
        WHERE id = p_target_room_id
          AND hotel_id = v_hotel_id
        LIMIT 1;
    END IF;

    IF NOT FOUND AND v_orig_num IS NOT NULL THEN
        SELECT * INTO v_room
        FROM public.rooms
        WHERE hotel_id = v_hotel_id
          AND (
              room_number = v_orig_num
              OR regexp_replace(room_number, '^Room\s*', '', 'i') = regexp_replace(v_orig_num, '^Room\s*', '', 'i')
          )
        LIMIT 1;
    END IF;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room #% was not found for this property.', COALESCE(v_orig_num, v_new_num);
    END IF;

    v_old_num := v_room.room_number;

    IF v_new_num <> v_old_num THEN
        IF EXISTS (
            SELECT 1
            FROM public.rooms
            WHERE hotel_id = v_hotel_id
              AND room_number = v_new_num
              AND id <> v_room.id
        ) THEN
            RAISE EXCEPTION 'Room #% already exists in inventory.', v_new_num;
        END IF;
    END IF;

    v_resolved_rt_id := NULLIF(BTRIM(p_room_type_id), '');
    IF v_resolved_rt_id IS NULL AND NULLIF(BTRIM(p_type), '') IS NOT NULL THEN
        SELECT id INTO v_resolved_rt_id
        FROM public.room_types
        WHERE hotel_id = v_hotel_id
          AND LOWER(BTRIM(name)) = LOWER(BTRIM(p_type))
        LIMIT 1;
    END IF;

    -- Preserve active stay occupancy (OCCUPIED / RESERVED) while allowing metadata & tariff edits
    IF UPPER(COALESCE(v_room.status, '')) IN ('OCCUPIED', 'RESERVED') THEN
        v_next_status := v_room.status;
    ELSIF v_status_req IN ('VACANT_READY', 'RESERVED', 'OCCUPIED', 'DIRTY', 'MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED') THEN
        v_next_status := v_status_req;
    ELSIF v_hk_clean IS NOT NULL THEN
        IF LOWER(v_hk_clean) = 'dirty' THEN
            v_next_status := 'DIRTY';
        ELSIF LOWER(v_hk_clean) = 'maintenance' THEN
            v_next_status := 'MAINTENANCE';
        ELSE
            v_next_status := 'VACANT_READY';
        END IF;
    ELSE
        v_next_status := COALESCE(v_room.status, 'VACANT_READY');
    END IF;

    UPDATE public.rooms
    SET room_number = v_new_num,
        room_type_id = COALESCE(v_resolved_rt_id, room_type_id),
        floor = COALESCE(NULLIF(BTRIM(p_floor), ''), floor),
        type = COALESCE(NULLIF(BTRIM(p_type), ''), type),
        bed = COALESCE(NULLIF(BTRIM(p_bed), ''), bed),
        price = COALESCE(p_price, price),
        key_card_no = CASE
            WHEN p_key_card_no IS NULL THEN key_card_no
            ELSE NULLIF(BTRIM(p_key_card_no), '')
        END,
        is_smoking = COALESCE(p_is_smoking, is_smoking),
        phone_extension = CASE
            WHEN p_phone_extension IS NULL THEN phone_extension
            ELSE NULLIF(BTRIM(p_phone_extension), '')
        END,
        interconnecting_room = CASE
            WHEN p_interconnecting_room IS NULL THEN interconnecting_room
            ELSE NULLIF(BTRIM(p_interconnecting_room), '')
        END,
        housekeeping = COALESCE(v_hk_clean, housekeeping),
        status = v_next_status,
        updated_at = NOW()
    WHERE id = v_room.id
      AND hotel_id = v_hotel_id
    RETURNING * INTO v_updated;

    IF v_new_num IS DISTINCT FROM v_old_num THEN
        UPDATE public.reservations
        SET room_number = v_new_num,
            room = 'Room ' || v_new_num,
            updated_at = NOW()
        WHERE hotel_id = v_hotel_id
          AND (
              room_number = v_old_num
              OR room = 'Room ' || v_old_num
              OR room = v_old_num
          );

        UPDATE public.housekeeping_tasks
        SET room_number = v_new_num,
            updated_at = NOW()
        WHERE hotel_id = v_hotel_id
          AND room_number = v_old_num;

        UPDATE public.restaurant_tables
        SET room_number = v_new_num,
            updated_at = NOW()
        WHERE hotel_id = v_hotel_id
          AND room_number = v_old_num;

        UPDATE public.financial_invoices
        SET room_number = v_new_num,
            updated_at = NOW()
        WHERE hotel_id = v_hotel_id
          AND room_number = v_old_num;

        UPDATE public.lost_and_found_items
        SET room_number = v_new_num,
            updated_at = NOW()
        WHERE hotel_id = v_hotel_id
          AND room_number = v_old_num;

        UPDATE public.cab_bookings
        SET room_number = v_new_num,
            updated_at = NOW()
        WHERE hotel_id = v_hotel_id
          AND room_number = v_old_num;
    END IF;

    RETURN to_jsonb(v_updated);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_room(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, BOOLEAN, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_room(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, BOOLEAN, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
