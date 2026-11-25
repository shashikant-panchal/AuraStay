-- ============================================================================
-- Aavasa Enterprise PMS: Restore Mistakenly Checked-Out Future Bookings + Guard
-- 1. Restores any future reservation (check_in > IST today) that was mistakenly
--    marked CHECKED_OUT back to CONFIRMED, clears accidental check-in/out
--    timestamps, and aligns `room` text with its `room_number`.
-- 2. Re-syncs any room that currently has an active CHECKED_IN stay today
--    (e.g. left DIRTY from the prior broken room shift) while keeping rooms
--    with ONLY future bookings as VACANT_READY.
-- 3. Adds a database-level guard preventing future bookings (check_in > today)
--    from being accidentally checked out before their arrival date.
-- ============================================================================

-- 1. Guard in BEFORE trigger: prevent accidentally checking out a future booking
CREATE OR REPLACE FUNCTION public.trg_capture_checkin_checkout_times()
RETURNS TRIGGER AS $$
DECLARE
    now_iso TEXT := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
    v_today DATE := public.pms_business_today();
BEGIN
    IF UPPER(COALESCE(NEW.status, '')) IN ('CHECKED_OUT', 'CHECKEDOUT')
       AND (TG_OP = 'INSERT' OR UPPER(COALESCE(OLD.status, '')) NOT IN ('CHECKED_OUT', 'CHECKEDOUT')) THEN
        IF NEW.check_in IS NOT NULL AND NEW.check_in > v_today AND NEW.actual_check_in_time IS NULL THEN
            RAISE EXCEPTION 'Cannot check out future reservation #% before its check-in date (%).', NEW.id, NEW.check_in;
        END IF;
        IF NEW.actual_check_out_time IS NULL OR BTRIM(NEW.actual_check_out_time::text) = '' THEN
            NEW.actual_check_out_time := now_iso;
        END IF;
    END IF;

    IF UPPER(COALESCE(NEW.status, '')) IN ('CHECKED_IN', 'CHECKEDIN')
       AND (TG_OP = 'INSERT' OR UPPER(COALESCE(OLD.status, '')) NOT IN ('CHECKED_IN', 'CHECKEDIN')) THEN
        IF NEW.actual_check_in_time IS NULL OR BTRIM(NEW.actual_check_in_time::text) = '' THEN
            NEW.actual_check_in_time := now_iso;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Restore mistakenly checked-out FUTURE reservations back to CONFIRMED
DO $$
DECLARE
    v_today DATE := public.pms_business_today();
    v_restored_ids TEXT[];
BEGIN
    WITH restored AS (
        UPDATE public.reservations
        SET status = 'CONFIRMED',
            actual_check_in_time = NULL,
            actual_check_out_time = NULL,
            room = CASE
                WHEN NULLIF(BTRIM(COALESCE(room_number, '')), '') IS NOT NULL
                THEN 'Room ' || BTRIM(room_number)
                ELSE room
            END,
            updated_at = NOW()
        WHERE UPPER(COALESCE(status, '')) IN ('CHECKED_OUT', 'CHECKEDOUT')
          AND check_in > v_today
          AND actual_check_in_time IS NULL
        RETURNING id, hotel_id, room_number
    )
    SELECT array_agg(id) INTO v_restored_ids FROM restored;

    -- Clean up any accidental pending turnover tasks generated from those mistaken future checkouts
    IF v_restored_ids IS NOT NULL AND array_length(v_restored_ids, 1) > 0 THEN
        DELETE FROM public.housekeeping_tasks
        WHERE status = 'PENDING'
          AND (
              notes ILIKE '%5575533083%'
              OR notes ILIKE '%5958208972%'
              OR notes ILIKE '%6385921327%'
              OR (notes ILIKE '%Checkout turnover clean for room #205%' AND created_at >= (NOW() - INTERVAL '24 hours'))
          );
    END IF;

    -- Re-align any room whose active today CHECKED_IN stay was left DIRTY by the prior broken shift
    UPDATE public.rooms r
    SET status = 'OCCUPIED',
        housekeeping = 'Clean',
        guest = res.guest,
        booking_id = res.id,
        check_out = res.check_out,
        updated_at = NOW()
    FROM public.reservations res
    WHERE r.hotel_id = res.hotel_id
      AND regexp_replace(r.room_number, '^Room\s*', '', 'i') = regexp_replace(COALESCE(NULLIF(BTRIM(res.room_number), ''), ''), '^Room\s*', '', 'i')
      AND UPPER(COALESCE(res.status, '')) IN ('CHECKED_IN', 'CHECKEDIN', 'OCCUPIED')
      AND COALESCE(res.check_in, v_today) <= v_today
      AND UPPER(COALESCE(r.status, 'VACANT_READY')) IN ('DIRTY', 'VACANT_READY')
      AND r.booking_id IS NULL;
END $$;
