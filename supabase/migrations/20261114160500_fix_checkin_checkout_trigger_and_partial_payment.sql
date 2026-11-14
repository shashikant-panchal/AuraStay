-- Fix PostgreSQL type mismatch (42804: COALESCE types text and timestamp with time zone cannot be matched)
-- in trg_capture_checkin_checkout_times(), and allow 'PARTIAL' in reservations.payment CHECK constraint.

CREATE OR REPLACE FUNCTION trg_capture_checkin_checkout_times()
RETURNS TRIGGER AS $$
DECLARE
    now_iso TEXT := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
    IF UPPER(COALESCE(NEW.status, '')) IN ('CHECKED_IN', 'CHECKEDIN')
       AND (TG_OP = 'INSERT' OR UPPER(COALESCE(OLD.status, '')) NOT IN ('CHECKED_IN', 'CHECKEDIN')) THEN
        IF NEW.actual_check_in_time IS NULL OR BTRIM(NEW.actual_check_in_time::text) = '' THEN
            NEW.actual_check_in_time := now_iso;
        END IF;
    END IF;

    IF UPPER(COALESCE(NEW.status, '')) IN ('CHECKED_OUT', 'CHECKEDOUT')
       AND (TG_OP = 'INSERT' OR UPPER(COALESCE(OLD.status, '')) NOT IN ('CHECKED_OUT', 'CHECKEDOUT')) THEN
        IF NEW.actual_check_out_time IS NULL OR BTRIM(NEW.actual_check_out_time::text) = '' THEN
            NEW.actual_check_out_time := now_iso;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure reservations.payment allows 'PARTIAL' alongside existing statuses
DO $$
DECLARE
    c_rec RECORD;
BEGIN
    FOR c_rec IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
          AND t.relname = 'reservations'
          AND c.contype = 'c'
          AND (
              c.conname = 'reservations_payment_check'
              OR pg_get_constraintdef(c.oid) ILIKE '%OTA_VCC%'
          )
    LOOP
        EXECUTE format('ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS %I', c_rec.conname);
    END LOOP;
END $$;

ALTER TABLE public.reservations
    ADD CONSTRAINT reservations_payment_check
    CHECK (payment IN ('PAID', 'PENDING', 'PARTIAL', 'DIRECT_BILL', 'OTA_VCC'));
