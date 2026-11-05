-- ==============================================================================
-- AuraStay Master Hospitality & VARO Revenue Management Database Schema
-- Production Ready Schema (Zero Mock Data / Completely Clean Slate)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP EXISTING TABLES (IF RE-RUNNING TO RESET DATABASE)
DROP TABLE IF EXISTS fnb_orders CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS staff_users CASCADE;
DROP TABLE IF EXISTS ota_channels CASCADE;
DROP TABLE IF EXISTS revenue_kpis CASCADE;
DROP TABLE IF EXISTS revenue_actions CASCADE;
DROP TABLE IF EXISTS budget_forecast CASCADE;
DROP TABLE IF EXISTS property_profile CASCADE;

-- ------------------------------------------------------------------------------
-- 3. PROPERTY PROFILE
-- ------------------------------------------------------------------------------
CREATE TABLE property_profile (
    id TEXT PRIMARY KEY DEFAULT 'AST-PROP-01',
    name TEXT NOT NULL DEFAULT 'AuraStay Suite',
    short_name TEXT NOT NULL DEFAULT 'AST',
    email TEXT DEFAULT 'admin@aurastay.com',
    mobile TEXT DEFAULT '',
    manager_name TEXT DEFAULT 'AuraStay Admin',
    manager_role TEXT DEFAULT 'Property Admin',
    address TEXT DEFAULT '',
    total_rooms INT DEFAULT 0,
    active_room_categories INT DEFAULT 0,
    pricing_ready_categories INT DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    currency_symbol TEXT DEFAULT '₹',
    mastery_percentage INT DEFAULT 0,
    notification_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. ROOMS (FRONT DESK & HOUSEKEEPING)
-- ------------------------------------------------------------------------------
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number TEXT UNIQUE NOT NULL,
    floor TEXT NOT NULL DEFAULT '1st Floor',
    type TEXT NOT NULL DEFAULT 'Standard Room',
    bed TEXT NOT NULL DEFAULT 'King Bed',
    status TEXT NOT NULL DEFAULT 'VACANT_READY' CHECK (status IN ('VACANT_READY', 'OCCUPIED', 'DIRTY', 'MAINTENANCE')),
    price NUMERIC(10, 2) NOT NULL DEFAULT 2000.00,
    guest TEXT,
    booking_id TEXT,
    check_out DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. RESERVATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE reservations (
    id TEXT PRIMARY KEY,
    guest TEXT NOT NULL,
    guest_email TEXT,
    guest_phone TEXT,
    room TEXT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    source TEXT NOT NULL DEFAULT 'Direct Website',
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED')),
    payment TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment IN ('PAID', 'PENDING', 'DIRECT_BILL', 'OTA_VCC')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. FOOD & BEVERAGES ORDERS (POS & KOT)
-- ------------------------------------------------------------------------------
CREATE TABLE fnb_orders (
    id TEXT PRIMARY KEY,
    room_table TEXT NOT NULL,
    guest TEXT NOT NULL,
    items TEXT NOT NULL,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PREPARING', 'DELIVERED', 'BILLED')),
    time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. STAFF & ADMIN DIRECTORY
-- ------------------------------------------------------------------------------
CREATE TABLE staff_users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    department TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. OTA DISTRIBUTION CHANNELS
-- ------------------------------------------------------------------------------
CREATE TABLE ota_channels (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONNECTED' CHECK (status IN ('CONNECTED', 'ACTIVE', 'DISCONNECTED')),
    sync_status TEXT NOT NULL DEFAULT 'Real-time',
    mapped_rooms INT DEFAULT 0,
    active_bookings INT DEFAULT 0,
    commission TEXT DEFAULT '15%',
    last_sync_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. REVENUE KPIS (VARO ENGINE)
-- ------------------------------------------------------------------------------
CREATE TABLE revenue_kpis (
    id SERIAL PRIMARY KEY,
    period TEXT NOT NULL DEFAULT 'Current Cycle',
    revpar NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    adr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    occupancy NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    total_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_revenue_formatted TEXT NOT NULL DEFAULT '₹0.00',
    room_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    non_room_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    room_nights_sold INT NOT NULL DEFAULT 0,
    total_available_nights INT NOT NULL DEFAULT 0,
    goppar NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    average_booking_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_bookings INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. REVENUE ACTIONS (PRICING & EXCEPTIONS)
-- ------------------------------------------------------------------------------
CREATE TABLE revenue_actions (
    id TEXT PRIMARY KEY,
    count INT NOT NULL DEFAULT 0,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('ATTENTION', 'ALERT', 'INFO')),
    status TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW', 'ACCEPTED', 'DISMISSED')),
    evidence JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. BUDGET VS ACTUAL FORECAST
-- ------------------------------------------------------------------------------
CREATE TABLE budget_forecast (
    id SERIAL PRIMARY KEY,
    mtd_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    revenue_target NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    revenue_achievement NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    monthly_comparison JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 12. ENABLE REALTIME REPLICATION FOR WEBSOCKET SYNCHRONIZATION
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE fnb_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE ota_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE revenue_kpis;

-- ==============================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE property_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fnb_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ota_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_forecast ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for all client operations
CREATE POLICY "Public full access property_profile" ON property_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access reservations" ON reservations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access fnb_orders" ON fnb_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access staff_users" ON staff_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access ota_channels" ON ota_channels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access revenue_kpis" ON revenue_kpis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access revenue_actions" ON revenue_actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access budget_forecast" ON budget_forecast FOR ALL USING (true) WITH CHECK (true);

-- (Note: ZERO INSERT statements. Clean database ready for user creation.)
