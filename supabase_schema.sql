-- ==============================================================================
-- AuraStay Master Hospitality & VARO Revenue Management Database Schema
-- Supabase PostgreSQL Migration & Initial Seed Script
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP EXISTING TABLES (IF RE-RUNNING)
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
    mobile TEXT DEFAULT '7978578046',
    manager_name TEXT DEFAULT 'Twinkle Bagh',
    manager_role TEXT DEFAULT 'Property Admin',
    address TEXT DEFAULT 'DLF Cyber City, Patia, Bhubaneswar, Odisha, India - 751024',
    total_rooms INT DEFAULT 28,
    active_room_categories INT DEFAULT 7,
    pricing_ready_categories INT DEFAULT 1,
    currency TEXT DEFAULT 'INR',
    currency_symbol TEXT DEFAULT '₹',
    mastery_percentage INT DEFAULT 0,
    notification_count INT DEFAULT 2,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. ROOMS (FRONT DESK & HOUSEKEEPING)
-- ------------------------------------------------------------------------------
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number TEXT UNIQUE NOT NULL,
    floor TEXT NOT NULL,
    type TEXT NOT NULL,
    bed TEXT NOT NULL,
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
-- 8. CHANNEL MANAGER (OTAS & DISTRIBUTION)
-- ------------------------------------------------------------------------------
CREATE TABLE ota_channels (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONNECTED' CHECK (status IN ('CONNECTED', 'ACTIVE', 'DISCONNECTED')),
    sync_status TEXT NOT NULL DEFAULT 'Real-time',
    mapped_rooms INT DEFAULT 4,
    active_bookings INT DEFAULT 0,
    commission TEXT DEFAULT '15%',
    last_sync_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. REVENUE MANAGEMENT KPIS (VARO ENGINE)
-- ------------------------------------------------------------------------------
CREATE TABLE revenue_kpis (
    id SERIAL PRIMARY KEY,
    period TEXT NOT NULL,
    revpar NUMERIC(10, 2) NOT NULL,
    adr NUMERIC(10, 2) NOT NULL,
    occupancy NUMERIC(5, 2) NOT NULL,
    total_revenue NUMERIC(12, 2) NOT NULL,
    total_revenue_formatted TEXT NOT NULL,
    room_revenue NUMERIC(12, 2) NOT NULL,
    non_room_revenue NUMERIC(12, 2) NOT NULL,
    room_nights_sold INT NOT NULL,
    total_available_nights INT NOT NULL,
    goppar NUMERIC(10, 2) NOT NULL,
    average_booking_value NUMERIC(10, 2) NOT NULL,
    total_bookings INT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. REVENUE ACTIONS (RATE EXCEPTIONS & AUDIT)
-- ------------------------------------------------------------------------------
CREATE TABLE revenue_actions (
    id TEXT PRIMARY KEY,
    count INT DEFAULT 1,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'ATTENTION',
    status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    evidence JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. BUDGET VS ACTUAL FORECAST
-- ------------------------------------------------------------------------------
CREATE TABLE budget_forecast (
    id SERIAL PRIMARY KEY,
    mtd_revenue NUMERIC(12, 2) NOT NULL DEFAULT 896122.68,
    revenue_target NUMERIC(12, 2) NOT NULL DEFAULT 1200000.00,
    revenue_achievement NUMERIC(5, 2) NOT NULL DEFAULT 74.68,
    monthly_comparison JSONB NOT NULL,
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

-- ==============================================================================
-- 14. INITIAL SEED DATA
-- ==============================================================================

-- Property
INSERT INTO property_profile (id, name, short_name, email, mobile, manager_name, manager_role, address, total_rooms)
VALUES ('AST-PROP-01', 'AuraStay Suite', 'AST', 'admin@aurastay.com', '7978578046', 'Twinkle Bagh', 'Property Admin', 'DLF Cyber City, Patia, Bhubaneswar, Odisha, India - 751024', 28)
ON CONFLICT (id) DO NOTHING;

-- Rooms
INSERT INTO rooms (room_number, floor, type, bed, status, price, guest, booking_id, check_out) VALUES
('101', '1st', 'Standard Room', 'King', 'VACANT_READY', 2000.00, NULL, NULL, NULL),
('102', '1st', 'Standard Room', 'King', 'OCCUPIED', 2000.00, 'Shashank Verma', 'AST-B-857', '2026-11-05'),
('103', '1st', 'Standard Room', 'King', 'DIRTY', 2000.00, NULL, NULL, NULL),
('104', '1st', 'Standard Room', 'King', 'VACANT_READY', 2000.00, NULL, NULL, NULL),
('105', '1st', 'Standard Room', 'King', 'MAINTENANCE', 2000.00, NULL, NULL, NULL),
('201', '2nd', 'Deluxe King', 'King', 'OCCUPIED', 3200.00, 'Dr. Alok Mishra (DCC Medical)', 'AST-B-858', '2026-11-06'),
('202', '2nd', 'Deluxe King', 'King', 'VACANT_READY', 3200.00, NULL, NULL, NULL),
('203', '2nd', 'Deluxe King', 'King', 'OCCUPIED', 3200.00, 'Priya Sundaram', 'AST-B-859', '2026-11-04'),
('301', '3rd', 'Executive Suite', 'King + Sofa', 'VACANT_READY', 4500.00, NULL, NULL, NULL),
('302', '3rd', 'Executive Suite', 'King + Sofa', 'OCCUPIED', 4500.00, 'Rajesh Sen (CKS Education)', 'AST-B-860', '2026-11-07'),
('401', '4th', 'Presidential Suite', 'Super King', 'VACANT_READY', 7500.00, NULL, NULL, NULL),
('402', '4th', 'Presidential Suite', 'Super King', 'VACANT_READY', 7500.00, NULL, NULL, NULL)
ON CONFLICT (room_number) DO NOTHING;

-- Reservations
INSERT INTO reservations (id, guest, guest_email, guest_phone, room, check_in, check_out, source, amount, status, payment) VALUES
('AST-B-857', 'Shashank Verma', 'shashank@gmail.com', '+91 98765 43210', '102 (Standard)', '2026-11-03', '2026-11-05', 'Walk-in', 4000.00, 'CONFIRMED', 'PAID'),
('AST-B-858', 'Dr. Alok Mishra', 'alok.mishra@dcc.org', '+91 98123 45678', '201 (Deluxe)', '2026-11-02', '2026-11-06', 'Corporate (DCC Medical)', 12800.00, 'CHECKED_IN', 'DIRECT_BILL'),
('AST-B-859', 'Priya Sundaram', 'priya.s@yahoo.com', '+91 94371 99887', '203 (Deluxe)', '2026-11-01', '2026-11-04', 'Booking.com OTA', 9600.00, 'CHECKED_IN', 'OTA_VCC'),
('AST-B-860', 'Rajesh Sen', 'rajesh.sen@cks.edu', '+91 70082 11223', '302 (Suite)', '2026-11-03', '2026-11-07', 'Corporate (CKS Education)', 18000.00, 'CHECKED_IN', 'PAID'),
('AST-B-861', 'Amitabh Choudhury', 'amitabh.c@outlook.com', '+91 82491 55443', '101 (Standard)', '2026-11-04', '2026-11-06', 'Direct Website', 4000.00, 'CONFIRMED', 'PENDING'),
('AST-B-862', 'Meera Patel', 'meera.p@gmail.com', '+91 99370 77665', '202 (Deluxe)', '2026-11-05', '2026-11-08', 'Agoda', 9600.00, 'CONFIRMED', 'PAID')
ON CONFLICT (id) DO NOTHING;

-- F&B Orders
INSERT INTO fnb_orders (id, room_table, guest, items, total, status, time) VALUES
('AST-O-363', 'Room 102', 'Shashank Verma', 'Paneer Butter Masala (1), Butter Naan (3), Sweet Lassi (2)', 780.00, 'DELIVERED', '8:15 PM'),
('AST-O-364', 'Table 4 (Restaurant)', 'Walk-in Diner', 'Chicken Biryani (2), Raita (2), Masala Coke (2)', 950.00, 'PREPARING', '8:42 PM'),
('AST-O-365', 'Room 302', 'Rajesh Sen', 'Club Sandwich (1), Espresso (2)', 460.00, 'PENDING', '9:05 PM')
ON CONFLICT (id) DO NOTHING;

-- Staff Users
INSERT INTO staff_users (id, name, role, email, phone, department, status) VALUES
(3550, 'Twinkle Bagh', 'Property Admin', 'admin@aurastay.com', '+91 76089 28399', 'Management', 'ACTIVE'),
(3551, 'Samir Nayak', 'Front Desk Manager', 'samir.frontdesk@aurastay.com', '+91 94370 12345', 'Front Office', 'ACTIVE'),
(3552, 'Anita Mohanty', 'Housekeeping Executive', 'anita.hk@aurastay.com', '+91 98610 98765', 'Housekeeping', 'ACTIVE'),
(3553, 'Chef Debabrata', 'Executive Chef', 'fnb.kitchen@aurastay.com', '+91 70081 23456', 'Food & Beverages', 'ACTIVE'),
(3554, 'Bikram Keshari', 'Accounts Lead', 'accounts@aurastay.com', '+91 82490 56789', 'Finance', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- OTA Channels
INSERT INTO ota_channels (name, status, sync_status, mapped_rooms, active_bookings, commission) VALUES
('Booking.com', 'CONNECTED', '2 mins ago', 4, 18, '15%'),
('Agoda', 'CONNECTED', 'Just now', 4, 12, '14%'),
('MakeMyTrip / Goibibo', 'CONNECTED', '5 mins ago', 4, 24, '18%'),
('Expedia', 'CONNECTED', '12 mins ago', 4, 7, '16%'),
('Direct Booking Engine', 'ACTIVE', 'Real-time', 4, 32, '0%')
ON CONFLICT (name) DO NOTHING;

-- Revenue KPIs
INSERT INTO revenue_kpis (id, period, revpar, adr, occupancy, total_revenue, total_revenue_formatted, room_revenue, non_room_revenue, room_nights_sold, total_available_nights, goppar, average_booking_value, total_bookings) VALUES
(1, '5 Oct 2026 – 3 Nov 2026 (inclusive)', 859.56, 3556.81, 24.17, 896122.68, '₹8.96L', 722033.18, 174089.50, 203, 840, 1066.81, 6438.29, 140)
ON CONFLICT (id) DO NOTHING;

-- Revenue Actions
INSERT INTO revenue_actions (id, count, title, description, severity, status, evidence) VALUES
('act-1', 1, 'Rate recommendations need review', '1 recommendation(s) in the next 30 days contain persisted pricing exceptions.', 'ATTENTION', 'PENDING_REVIEW', '{
    "targetDate": "2026-11-12",
    "roomType": "Standard Room",
    "currentRate": 2000,
    "recommendedRate": 2450,
    "reason": "Competitor compression alert in Patia zone (+18% rate surge across Booking.com and MMT).",
    "suggestedAction": "Accept recommended rate to capture transient ADR uplift."
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Budget Forecast
INSERT INTO budget_forecast (id, mtd_revenue, revenue_target, revenue_achievement, monthly_comparison) VALUES
(1, 896122.68, 1200000.00, 74.68, '[
    {"month": "Jul", "budget": 950000, "actual": 912000, "lastYear": 820000, "variance": -38000},
    {"month": "Aug", "budget": 1000000, "actual": 1045000, "lastYear": 890000, "variance": 45000},
    {"month": "Sep", "budget": 1100000, "actual": 1080000, "lastYear": 950000, "variance": -20000},
    {"month": "Oct", "budget": 1250000, "actual": 1290000, "lastYear": 1020000, "variance": 40000},
    {"month": "Nov", "budget": 1200000, "actual": 896123, "lastYear": 980000, "variance": -303877},
    {"month": "Dec", "budget": 1500000, "actual": 0, "lastYear": 1250000, "variance": 0}
]'::jsonb)
ON CONFLICT (id) DO NOTHING;
