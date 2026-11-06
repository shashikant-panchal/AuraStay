-- =========================================================================
-- AuraStay Multi-Tenant SaaS Master Database Migration
-- Supports:
--   1. AuraStay Super Admin (Tenant creation, credentials & hotel management)
--   2. AuraStay Hotel Admin (PMS, Room management, Operations)
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

-- 3. Update / Create Rooms Table with hotel_id
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id TEXT NOT NULL DEFAULT 'hotel_aurastay_01',
    room_number TEXT NOT NULL,
    floor TEXT NOT NULL DEFAULT '1st Floor',
    type TEXT NOT NULL DEFAULT 'Standard Room',
    bed TEXT NOT NULL DEFAULT 'King Bed',
    status TEXT NOT NULL DEFAULT 'VACANT_READY' CHECK (status IN ('VACANT_READY', 'OCCUPIED', 'DIRTY', 'MAINTENANCE')),
    price NUMERIC(10, 2) NOT NULL DEFAULT 2000.00,
    guest TEXT,
    booking_id TEXT,
    check_out DATE,
    amenities TEXT[] DEFAULT ARRAY['Free High-Speed Wi-Fi', 'Air Conditioning', 'Flat-screen Smart TV', 'Private Bathroom', 'Daily Housekeeping'],
    image_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT rooms_hotel_room_unique UNIQUE (hotel_id, room_number)
);

-- If rooms table already existed without hotel_id, add columns safely:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'hotel_id'
    ) THEN
        ALTER TABLE rooms ADD COLUMN hotel_id TEXT DEFAULT 'hotel_aurastay_01';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'amenities'
    ) THEN
        ALTER TABLE rooms ADD COLUMN amenities TEXT[] DEFAULT ARRAY['Free High-Speed Wi-Fi', 'Air Conditioning', 'Flat-screen Smart TV', 'Private Bathroom', 'Daily Housekeeping'];
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE rooms ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- 4. Update / Create Reservations Table with hotel_id
CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    hotel_id TEXT NOT NULL DEFAULT 'hotel_aurastay_01',
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
    special_requests TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If reservations table already existed without hotel_id, add columns safely:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' AND column_name = 'hotel_id'
    ) THEN
        ALTER TABLE reservations ADD COLUMN hotel_id TEXT DEFAULT 'hotel_aurastay_01';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' AND column_name = 'special_requests'
    ) THEN
        ALTER TABLE reservations ADD COLUMN special_requests TEXT;
    END IF;
END $$;

-- 5. F&B Orders Table
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

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fnb_orders' AND column_name = 'hotel_id'
    ) THEN
        ALTER TABLE fnb_orders ADD COLUMN hotel_id TEXT DEFAULT 'hotel_aurastay_01';
    END IF;
END $$;

-- 6. Guest Users Table (for AuraStayBooking authenticated guests)
CREATE TABLE IF NOT EXISTS guest_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable Realtime Publications for all 3 applications
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE hotels;
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
        ALTER PUBLICATION supabase_realtime ADD TABLE fnb_orders;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE guest_users;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 8. Enable Row Level Security (RLS) & Public Access
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fnb_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read/write hotels') THEN
        CREATE POLICY "Public read/write hotels" ON hotels FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read/write super_admins') THEN
        CREATE POLICY "Public read/write super_admins" ON super_admins FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read/write rooms') THEN
        CREATE POLICY "Public read/write rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read/write reservations') THEN
        CREATE POLICY "Public read/write reservations" ON reservations FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read/write fnb_orders') THEN
        CREATE POLICY "Public read/write fnb_orders" ON fnb_orders FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read/write guest_users') THEN
        CREATE POLICY "Public read/write guest_users" ON guest_users FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 9. Seed Default Super Admin and Primary Hotel
INSERT INTO super_admins (id, name, email, password, role)
VALUES ('sa_01', 'Master Super Admin', 'superadmin@aurastay.com', 'super123', 'PLATFORM_OWNER')
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotels (id, slug, name, short_name, logo_url, owner_name, email, password, mobile, address, city, total_rooms, currency, currency_symbol, status, plan)
VALUES (
    'hotel_aurastay_01',
    'aurastay-suite',
    'AuraStay Suite',
    'AST',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=200&q=80',
    'AuraStay Admin',
    'admin@aurastay.com',
    'admin123',
    '7978578046',
    'DLF Cyber City, Patia, Bhubaneswar, Odisha, India - 751024',
    'Bhubaneswar',
    28,
    'INR',
    '₹',
    'ACTIVE',
    'Enterprise'
)
ON CONFLICT (id) DO NOTHING;
