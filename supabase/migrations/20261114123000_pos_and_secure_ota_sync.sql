-- ============================================================================
-- AAVASA ENTERPRISE PMS - DYNAMIC HOTEL-SPECIFIC POS & MULTI-TENANT OTA LOCK
-- Target Project: pdsfctfixxfazchamznm.supabase.co
-- ============================================================================

-- 1. Optional per-hotel Aiosell property mapping (e.g. 'sandbox-pms' or live Aiosell code)
ALTER TABLE IF EXISTS hotels
    ADD COLUMN IF NOT EXISTS aiosell_hotel_code TEXT;

CREATE INDEX IF NOT EXISTS idx_hotels_aiosell_code ON hotels (aiosell_hotel_code);

-- 2. Restaurant Dining Tables (100% isolated per hotel_id)
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id TEXT PRIMARY KEY,
    hotel_id TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT 'Main Dining',
    seats INTEGER NOT NULL DEFAULT 4,
    status TEXT NOT NULL DEFAULT 'VACANT', -- VACANT | OCCUPIED | RESERVED
    guest_name TEXT,
    room_number TEXT,
    items_count INTEGER NOT NULL DEFAULT 0,
    current_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    active_order_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hotel_id, name)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_tables_hotel ON restaurant_tables (hotel_id);

-- 3. Restaurant Menu Items / Product Setup Catalog (100% isolated per hotel_id)
CREATE TABLE IF NOT EXISTS restaurant_menu_items (
    id TEXT PRIMARY KEY,
    hotel_id TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Main Course',
    kitchen_station TEXT NOT NULL DEFAULT 'Hot Kitchen (Indian)',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax_pct NUMERIC(5, 2) NOT NULL DEFAULT 5,
    unit TEXT NOT NULL DEFAULT 'Portion',
    is_veg BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE | OUT_OF_STOCK
    prep_time TEXT DEFAULT '15 mins',
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_menu_items_hotel ON restaurant_menu_items (hotel_id);

-- 4. Backfill missing multi-tenant columns on legacy pre-SaaS tables & add Free-Plan composite indexes
ALTER TABLE IF EXISTS room_types ADD COLUMN IF NOT EXISTS hotel_id TEXT;
ALTER TABLE IF EXISTS rooms ADD COLUMN IF NOT EXISTS hotel_id TEXT;
ALTER TABLE IF EXISTS rooms ADD COLUMN IF NOT EXISTS is_ota_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS rooms ADD COLUMN IF NOT EXISTS ota_channel TEXT;
ALTER TABLE IF EXISTS rooms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS reservations ADD COLUMN IF NOT EXISTS hotel_id TEXT;
ALTER TABLE IF EXISTS reservations ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE IF EXISTS reservations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS reservations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS fnb_orders ADD COLUMN IF NOT EXISTS hotel_id TEXT;
ALTER TABLE IF EXISTS fnb_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS housekeeping_tasks ADD COLUMN IF NOT EXISTS hotel_id TEXT;
ALTER TABLE IF EXISTS financial_invoices ADD COLUMN IF NOT EXISTS hotel_id TEXT;
ALTER TABLE IF EXISTS cab_bookings ADD COLUMN IF NOT EXISTS hotel_id TEXT;
ALTER TABLE IF EXISTS staff_users ADD COLUMN IF NOT EXISTS hotel_id TEXT;

CREATE INDEX IF NOT EXISTS idx_rooms_hotel_status ON rooms (hotel_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_hotel_dates ON reservations (hotel_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_fnb_orders_hotel_created ON fnb_orders (hotel_id, created_at DESC);

-- 5. Match existing PMS table RLS configuration and enable Realtime broadcasts
ALTER TABLE IF EXISTS restaurant_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS restaurant_menu_items DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_menu_items;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 6. Fix Trigger A: Strict hotel_id-scoped Reservation <-> Room Sync (Check-in / Check-out / Cancel)
CREATE OR REPLACE FUNCTION trg_sync_reservation_to_room()
RETURNS TRIGGER AS $$
DECLARE
    clean_room_num TEXT;
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

        ELSIF NEW.status = 'CHECKED_OUT' THEN
            UPDATE rooms
            SET status = 'DIRTY',
                guest = NULL,
                booking_id = NULL,
                is_ota_locked = FALSE,
                ota_channel = NULL,
                updated_at = NOW()
            WHERE hotel_id = NEW.hotel_id
              AND (booking_id = NEW.id
                   OR regexp_replace(room_number, '^Room\s*', '', 'i') = clean_room_num);

            INSERT INTO housekeeping_tasks (id, hotel_id, room_number, task_type, priority, assigned_to, status, notes)
            VALUES (
                'HK-' || floor(random()*9000 + 1000)::text,
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

-- 7. Fix Trigger C: Strict hotel_id + Date-Range Overlap Safe OTA Room Lock
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
        -- Case A: Cancelled OTA booking -> unlock only if this booking currently holds the room in this hotel
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

        -- Case B: Active OTA booking -> allocate non-overlapping room in SAME hotel_id
        IF NEW.status IN ('CONFIRMED', 'CHECKED_IN') THEN
            v_covers_today := (COALESCE(NEW.check_in, CURRENT_DATE) <= CURRENT_DATE AND COALESCE(NEW.check_out, CURRENT_DATE + 1) > CURRENT_DATE);

            IF NEW.room_number IS NOT NULL AND LENGTH(TRIM(NEW.room_number)) > 0 THEN
                v_allocated_room := TRIM(NEW.room_number);
            ELSE
                -- Pick first category-matching physical room in SAME hotel without date overlap
                SELECT r.room_number INTO v_allocated_room
                FROM rooms r
                WHERE r.hotel_id = NEW.hotel_id
                  AND COALESCE(r.status, 'VACANT_READY') NOT IN ('MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED')
                  AND (NOT v_covers_today OR COALESCE(r.status, 'VACANT_READY') <> 'OCCUPIED')
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

                -- Only mark physical room status OCCUPIED today if the stay covers today or guest checked in
                IF v_covers_today OR NEW.status = 'CHECKED_IN' THEN
                    UPDATE rooms
                    SET status = 'OCCUPIED',
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

-- 8. Multi-tenant Inventory Matrix View (grouped by hotel_id + type)
DROP VIEW IF EXISTS aiosell_live_inventory_view;
CREATE VIEW aiosell_live_inventory_view AS
SELECT
    r.hotel_id,
    r.type AS room_type,
    COUNT(r.room_number) AS total_rooms,
    COUNT(CASE WHEN COALESCE(r.status, 'VACANT_READY') = 'VACANT_READY' THEN 1 END) AS available_inventory,
    COUNT(CASE WHEN r.status = 'OCCUPIED' THEN 1 END) AS occupied_rooms,
    COUNT(CASE WHEN r.status = 'DIRTY' THEN 1 END) AS dirty_rooms,
    COUNT(CASE WHEN r.status IN ('MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED') THEN 1 END) AS maintenance_rooms,
    CASE
        WHEN COUNT(CASE WHEN COALESCE(r.status, 'VACANT_READY') = 'VACANT_READY' THEN 1 END) = 0 THEN TRUE
        ELSE FALSE
    END AS auto_stop_sell
FROM rooms r
GROUP BY r.hotel_id, r.type;
