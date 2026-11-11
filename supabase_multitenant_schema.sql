-- =========================================================================
-- AuraStay Multi-Tenant SaaS Master Database Migration (Exceed HMS Edition)
-- Supports:
--   1. AuraStay Super Admin (Tenant creation, credentials & hotel management)
--   2. AuraStay Hotel Admin (PMS, Room Types, Room Management, Banquets, Folio, Operations)
--   3. AuraStay Booking (Guest-facing booking engine with real-time room lock & guest auth)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Hotels / Tenants Table
CREATE TABLE IF NOT EXISTS hotels (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    short_name TEXT DEFAULT 'AST',
    logo_url TEXT DEFAULT '',
    owner_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL DEFAULT 'admin123',
    mobile TEXT DEFAULT '7978578046',
    address TEXT DEFAULT 'DLF Cyber City, Patia, Bhubaneswar, Odisha, India',
    city TEXT DEFAULT 'Bhubaneswar',
    country TEXT DEFAULT 'India',
    total_rooms INT DEFAULT 20,
    currency TEXT DEFAULT 'INR',
    currency_symbol TEXT DEFAULT '₹',
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
    plan TEXT NOT NULL DEFAULT 'Enterprise' CHECK (plan IN ('Starter', 'Professional', 'Enterprise')),
    commission_rate NUMERIC(5, 2) DEFAULT 10.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Super Admins Table
CREATE TABLE IF NOT EXISTS super_admins (
    id TEXT PRIMARY KEY DEFAULT 'sa_01',
    name TEXT NOT NULL DEFAULT 'Master Super Admin',
    email TEXT UNIQUE NOT NULL DEFAULT 'superadmin@aurastay.com',
    password TEXT NOT NULL DEFAULT 'super123',
    role TEXT DEFAULT 'PLATFORM_OWNER',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Room Types / Categories Table (Exceed HMS /RoomType/Create)
CREATE TABLE IF NOT EXISTS room_types (
    id TEXT PRIMARY KEY,
    hotel_id TEXT NOT NULL DEFAULT 'hotel_aurastay_01',
    name TEXT NOT NULL,
    label TEXT DEFAULT 'Room',
    bedding_type TEXT DEFAULT 'King Bed',
    max_adults INT DEFAULT 2,
    max_extra INT DEFAULT 1,
    max_children INT DEFAULT 1,
    area_sqft NUMERIC(8, 2) DEFAULT 350.00,
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 2500.00,
    extra_bed_price NUMERIC(10, 2) DEFAULT 800.00,
    child_price NUMERIC(10, 2) DEFAULT 400.00,
    amenities TEXT[] DEFAULT ARRAY['Air Conditioning', 'Flat-screen Smart TV', 'Free High-Speed Wi-Fi', 'Private Bathroom', 'Daily Housekeeping', 'Electric Kettle'],
    description TEXT,
    notes TEXT,
    is_booking_engine BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT room_types_hotel_name_unique UNIQUE (hotel_id, name)
);

-- 4. Rooms Table (Exceed HMS Room Numbers Master)
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id TEXT NOT NULL DEFAULT 'hotel_aurastay_01',
    room_number TEXT NOT NULL,
    room_type_id TEXT,
    floor TEXT NOT NULL DEFAULT '1st Floor',
    type TEXT NOT NULL DEFAULT 'Standard Room',
    bed TEXT NOT NULL DEFAULT 'King Bed',
    status TEXT NOT NULL DEFAULT 'VACANT_READY' CHECK (status IN ('VACANT_READY', 'OCCUPIED', 'DIRTY', 'MAINTENANCE')),
    housekeeping TEXT DEFAULT 'Clean',
    price NUMERIC(10, 2) NOT NULL DEFAULT 2000.00,
    key_card_no TEXT,
    is_smoking BOOLEAN DEFAULT FALSE,
    interconnecting_room TEXT,
    phone_extension TEXT,
    guest TEXT,
    booking_id TEXT,
    check_out DATE,
    amenities TEXT[] DEFAULT ARRAY['Free High-Speed Wi-Fi', 'Air Conditioning', 'Flat-screen Smart TV', 'Private Bathroom', 'Daily Housekeeping'],
    image_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT rooms_hotel_room_unique UNIQUE (hotel_id, room_number)
);

-- Safely add columns if rooms table already existed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'hotel_id') THEN
        ALTER TABLE rooms ADD COLUMN hotel_id TEXT DEFAULT 'hotel_aurastay_01';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'room_type_id') THEN
        ALTER TABLE rooms ADD COLUMN room_type_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'housekeeping') THEN
        ALTER TABLE rooms ADD COLUMN housekeeping TEXT DEFAULT 'Clean';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'key_card_no') THEN
        ALTER TABLE rooms ADD COLUMN key_card_no TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'is_smoking') THEN
        ALTER TABLE rooms ADD COLUMN is_smoking BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'interconnecting_room') THEN
        ALTER TABLE rooms ADD COLUMN interconnecting_room TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'phone_extension') THEN
        ALTER TABLE rooms ADD COLUMN phone_extension TEXT;
    END IF;
END $$;

-- 5. Reservations Table (Exceed HMS 113-field complete schema)
CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    hotel_id TEXT NOT NULL DEFAULT 'hotel_aurastay_01',
    guest TEXT NOT NULL,
    guest_email TEXT,
    guest_phone TEXT,
    guest_country TEXT DEFAULT 'India',
    guest_id_type TEXT DEFAULT 'Aadhaar Card',
    guest_id_number TEXT,
    vip_tier TEXT DEFAULT 'Regular',
    room TEXT NOT NULL,
    room_type TEXT,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nights INT DEFAULT 1,
    adults INT DEFAULT 2,
    children INT DEFAULT 0,
    rate_plan TEXT DEFAULT 'EP - Room Only',
    source TEXT NOT NULL DEFAULT 'Direct Website',
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    paid NUMERIC(10, 2) DEFAULT 0.00,
    advance_paid NUMERIC(10, 2) DEFAULT 0.00,
    payment_mode TEXT DEFAULT 'UPI',
    billing_mode TEXT DEFAULT 'Guest Direct',
    organisation TEXT,
    gstin TEXT,
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED')),
    payment TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment IN ('PAID', 'PENDING', 'DIRECT_BILL', 'OTA_VCC')),
    special_requests TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns if reservations table already existed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'hotel_id') THEN
        ALTER TABLE reservations ADD COLUMN hotel_id TEXT DEFAULT 'hotel_aurastay_01';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'guest_id_type') THEN
        ALTER TABLE reservations ADD COLUMN guest_id_type TEXT DEFAULT 'Aadhaar Card';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'guest_id_number') THEN
        ALTER TABLE reservations ADD COLUMN guest_id_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'rate_plan') THEN
        ALTER TABLE reservations ADD COLUMN rate_plan TEXT DEFAULT 'EP - Room Only';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'adults') THEN
        ALTER TABLE reservations ADD COLUMN adults INT DEFAULT 2;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'children') THEN
        ALTER TABLE reservations ADD COLUMN children INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'paid') THEN
        ALTER TABLE reservations ADD COLUMN paid NUMERIC(10, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'payment_mode') THEN
        ALTER TABLE reservations ADD COLUMN payment_mode TEXT DEFAULT 'UPI';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'gstin') THEN
        ALTER TABLE reservations ADD COLUMN gstin TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'notes') THEN
        ALTER TABLE reservations ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'nights') THEN
        ALTER TABLE reservations ADD COLUMN nights INT DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'room_number') THEN
        ALTER TABLE reservations ADD COLUMN room_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'room_type') THEN
        ALTER TABLE reservations ADD COLUMN room_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'special_requests') THEN
        ALTER TABLE reservations ADD COLUMN special_requests TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'advance_paid') THEN
        ALTER TABLE reservations ADD COLUMN advance_paid NUMERIC(10, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'billing_mode') THEN
        ALTER TABLE reservations ADD COLUMN billing_mode TEXT DEFAULT 'Guest Direct';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'organisation') THEN
        ALTER TABLE reservations ADD COLUMN organisation TEXT;
    END IF;
END $$;

-- 6. Banquet Bookings Table (Exceed HMS MICE & Events)
CREATE TABLE IF NOT EXISTS banquet_bookings (
    id TEXT PRIMARY KEY,
    hotel_id TEXT NOT NULL DEFAULT 'hotel_aurastay_01',
    event_name TEXT NOT NULL,
    event_type TEXT DEFAULT 'Wedding Reception',
    client_name TEXT NOT NULL,
    client_phone TEXT,
    client_email TEXT,
    venue TEXT NOT NULL,
    event_date DATE NOT NULL,
    time_slot TEXT,
    pax INT DEFAULT 100,
    menu_package TEXT,
    total_amount NUMERIC(10, 2) DEFAULT 0.00,
    paid_amount NUMERIC(10, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'CONFIRMED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. F&B Orders Table
CREATE TABLE IF NOT EXISTS fnb_orders (
    id TEXT PRIMARY KEY,
    hotel_id TEXT NOT NULL DEFAULT 'hotel_aurastay_01',
    room_table TEXT NOT NULL,
    guest TEXT NOT NULL,
    items TEXT NOT NULL,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PREPARING', 'DELIVERED', 'BILLED')),
    time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Guest Users Table (for AuraStay Guest Portal login)
CREATE TABLE IF NOT EXISTS guest_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Enable Realtime Publications for all applications
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE hotels;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE room_types;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE banquet_bookings;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 10. Disable RLS to allow seamless sync across Admin, SuperAdmin, and Guest Portals
ALTER TABLE IF EXISTS hotels DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS room_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS banquet_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fnb_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS super_admins DISABLE ROW LEVEL SECURITY;

-- 11. Clean Reset: Clear all old test reservations and reset room inventory
DELETE FROM reservations;
UPDATE rooms SET status = 'VACANT_READY', guest = NULL, booking_id = NULL, check_out = NULL;
DELETE FROM banquet_bookings;
DELETE FROM fnb_orders;

-- 11. Initial Seed Data (Exceed HMS Room Category Master & Demo Property)
INSERT INTO hotels (id, slug, name, short_name, owner_name, email, password, mobile, total_rooms, plan)
VALUES ('hotel_aurastay_01', 'demo-hotel-property-1', 'DEMO HOTEL Property 1', 'DEMO', 'SHIVANANDI', 'shivanandi@aurastay.com', '12345', '7978578046', 20, 'Enterprise')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    owner_name = EXCLUDED.owner_name;

INSERT INTO room_types (id, hotel_id, name, label, bedding_type, max_adults, max_extra, max_children, area_sqft, base_price, extra_bed_price, child_price, amenities, description, is_booking_engine)
VALUES
('rt-deluxe', 'hotel_aurastay_01', 'Deluxe Room', 'Room', 'King Bed', 2, 1, 1, 350.00, 2500.00, 800.00, 400.00, ARRAY['Air Conditioning', 'Flat-screen Smart TV', 'Free High-Speed Wi-Fi', 'Private Bathroom', 'Daily Housekeeping', 'Electric Kettle'], 'Spacious deluxe room featuring plush king bedding, work desk, and ensuite bath.', true),
('rt-exec', 'hotel_aurastay_01', 'Executive Suite', 'Suite', 'Suite', 3, 1, 2, 550.00, 4500.00, 1000.00, 500.00, ARRAY['Air Conditioning', 'Balcony', 'City view', 'Bathtub', 'Flat-screen Smart TV', 'Free High-Speed Wi-Fi', 'Minibar'], 'Luxury executive suite with dedicated living room area and private balcony.', true),
('rt-pres', 'hotel_aurastay_01', 'Presidential Suite', 'Suite', '2 King Bed(s)', 4, 2, 2, 850.00, 8000.00, 1500.00, 800.00, ARRAY['Air Conditioning', 'Balcony', 'City view', 'Bathtub', 'Flat-screen Smart TV', 'Free High-Speed Wi-Fi', 'Minibar', 'Safe', 'Wardrobe or closet'], 'Ultra-premium presidential suite with master bedrooms, private dining, and jacuzzi.', true),
('rt-std', 'hotel_aurastay_01', 'Standard Room', 'Room', 'Twin Beds', 2, 0, 1, 280.00, 1800.00, 600.00, 300.00, ARRAY['Air Conditioning', 'Free High-Speed Wi-Fi', 'Private Bathroom', 'Daily Housekeeping'], 'Cozy standard room ideal for business and leisure travelers.', true)
ON CONFLICT (id) DO NOTHING;
