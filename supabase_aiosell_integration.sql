-- ============================================================================
-- AURA STAY HMS - AIOSELL CHANNEL MANAGER PRODUCTION BACKEND INTEGRATION
-- Target Database: Supabase PostgreSQL
-- Project: pdsfctfixxfazchamznm.supabase.co
-- ============================================================================

-- 1. Ensure columns exist on rooms table for lock state and OTA synchronization
ALTER TABLE IF EXISTS rooms 
    ADD COLUMN IF NOT EXISTS room_number TEXT,
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Standard Room',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'VACANT_READY',
    ADD COLUMN IF NOT EXISTS guest TEXT,
    ADD COLUMN IF NOT EXISTS booking_id TEXT,
    ADD COLUMN IF NOT EXISTS check_out DATE,
    ADD COLUMN IF NOT EXISTS is_ota_locked BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ota_channel TEXT;

-- 2. Ensure columns exist on reservations table for Aiosell OTA metadata
ALTER TABLE IF EXISTS reservations
    ADD COLUMN IF NOT EXISTS cm_booking_id TEXT,
    ADD COLUMN IF NOT EXISTS room_number TEXT,
    ADD COLUMN IF NOT EXISTS pah BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ota_commission NUMERIC(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS special_requests TEXT,
    ADD COLUMN IF NOT EXISTS raw_payload JSONB;

-- 3. Stored Procedure: Auto-allocate and LOCK Room on Inbound OTA Booking
CREATE OR REPLACE FUNCTION handle_ota_booking_room_lock()
RETURNS TRIGGER AS $$
DECLARE
    v_allocated_room TEXT;
BEGIN
    -- Only trigger on OTA/Aiosell bookings or when a booking is confirmed
    IF (NEW.source ILIKE '%Aiosell%' OR NEW.source ILIKE '%booking.com%' OR NEW.source ILIKE '%MakeMyTrip%' OR NEW.source ILIKE '%Agoda%' OR NEW.source ILIKE '%Expedia%' OR NEW.source ILIKE '%Goibibo%') THEN
        
        -- Case A: Booking is CANCELLED -> UNLOCK the room
        IF NEW.status = 'CANCELLED' THEN
            UPDATE rooms
            SET status = 'VACANT_READY',
                guest = NULL,
                booking_id = NULL,
                check_out = NULL,
                is_ota_locked = FALSE,
                ota_channel = NULL,
                updated_at = NOW()
            WHERE booking_id = NEW.id 
               OR (NEW.room_number IS NOT NULL AND room_number = NEW.room_number);

            RETURN NEW;
        END IF;

        -- Case B: Booking is ACTIVE (CONFIRMED / CHECKED_IN)
        IF NEW.status IN ('CONFIRMED', 'CHECKED_IN') THEN
            
            -- If reservation already specifies a physical room number, lock that specific room
            IF NEW.room_number IS NOT NULL AND LENGTH(TRIM(NEW.room_number)) > 0 THEN
                v_allocated_room := TRIM(NEW.room_number);
            ELSE
                -- Find the first vacant room matching the room category
                SELECT room_number INTO v_allocated_room
                FROM rooms
                WHERE status = 'VACANT_READY'
                  AND (type ILIKE '%' || COALESCE(NEW.room_type, 'Room') || '%' 
                       OR COALESCE(NEW.room_type, 'Room') ILIKE '%' || type || '%')
                ORDER BY room_number ASC
                LIMIT 1;

                -- Fallback: if primary category full, grab any vacant room
                IF v_allocated_room IS NULL THEN
                    SELECT room_number INTO v_allocated_room
                    FROM rooms
                    WHERE status = 'VACANT_READY'
                    ORDER BY room_number ASC
                    LIMIT 1;
                END IF;
            END IF;

            -- If an available physical room was found, lock it!
            IF v_allocated_room IS NOT NULL THEN
                NEW.room_number := v_allocated_room;
                NEW.room := 'Room ' || v_allocated_room;

                UPDATE rooms
                SET status = 'OCCUPIED',
                    guest = NEW.guest,
                    booking_id = NEW.id,
                    check_out = NEW.check_out,
                    is_ota_locked = TRUE,
                    ota_channel = NEW.source,
                    updated_at = NOW()
                WHERE room_number = v_allocated_room;
            END IF;

        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach Trigger to reservations table (Runs atomically before insert or update)
DROP TRIGGER IF EXISTS trg_ota_booking_room_lock ON reservations;
CREATE TRIGGER trg_ota_booking_room_lock
    BEFORE INSERT OR UPDATE OF status, room_number, check_in, check_out
    ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION handle_ota_booking_room_lock();

-- 5. Create Live Availability Matrix View for Aiosell Inventory Push
CREATE OR REPLACE VIEW aiosell_live_inventory_view AS
SELECT 
    r.type AS room_type,
    COUNT(r.room_number) AS total_rooms,
    COUNT(CASE WHEN r.status = 'VACANT_READY' THEN 1 END) AS available_inventory,
    COUNT(CASE WHEN r.status = 'OCCUPIED' THEN 1 END) AS occupied_rooms,
    COUNT(CASE WHEN r.status = 'DIRTY' THEN 1 END) AS dirty_rooms,
    COUNT(CASE WHEN r.status = 'MAINTENANCE' THEN 1 END) AS maintenance_rooms,
    CASE 
        WHEN COUNT(CASE WHEN r.status = 'VACANT_READY' THEN 1 END) = 0 THEN TRUE 
        ELSE FALSE 
    END AS auto_stop_sell
FROM rooms r
GROUP BY r.type;

