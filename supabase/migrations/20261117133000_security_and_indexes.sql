-- ============================================================================
-- Aavasa / AuraStay Enterprise Security, RBAC, Auth Migration & Index Tuning
-- Target DB: PostgreSQL 15+ (Supabase Free-Tier Nano)
-- 100% Idempotent & Backward-Compatible Zero-Downtime Security Overhaul:
--   1. Eliminates plaintext password columns (super_admins, hotels, guest_users)
--      by migrating existing secrets into private_auth.* using pgcrypto bcrypt.
--   2. Locks down ALL public tables & views with strict RLS + JWT claim helpers
--      (super_admin, hotel_admin, staff, guest).
--   3. Preserves public booking availability & guest checkout via zero-PII
--      SECURITY DEFINER RPCs (get_public_hotel_inventory, create_guest_reservation).
--   4. Adds B-Tree indexes across all hotel_id/status/date/FK filters to cut
--      CPU/RAM load and eliminate full sequential table scans.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PRIVATE CREDENTIAL VAULT SCHEMA (Never exposed via PostgREST/API)
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS private_auth;
REVOKE ALL ON SCHEMA private_auth FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private_auth.super_admin_credentials (
    admin_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    auth_user_id UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS private_auth.hotel_credentials (
    hotel_id TEXT PRIMARY KEY REFERENCES public.hotels(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    auth_user_id UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS private_auth.guest_credentials (
    guest_id TEXT PRIMARY KEY,
    phone TEXT,
    email TEXT,
    password_hash TEXT,
    auth_user_id UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

REVOKE ALL ON ALL TABLES IN SCHEMA private_auth FROM PUBLIC, anon, authenticated;

-- Migrate existing plaintext passwords into bcrypt hashes BEFORE dropping columns
DO $$
DECLARE
    has_sa_pass BOOLEAN;
    has_hotel_pass BOOLEAN;
    has_guest_pass BOOLEAN;
    rec RECORD;
    clean_hash_input TEXT;
BEGIN
    -- Hosted Supabase installs pgcrypto in extensions schema; local Postgres uses public
    PERFORM set_config('search_path', 'public,extensions,private_auth', true);

    -- 1a. Super Admins migration
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'super_admins' AND column_name = 'password'
    ) INTO has_sa_pass;

    IF has_sa_pass THEN
        FOR rec IN SELECT id, LOWER(BTRIM(email)) AS email, password FROM public.super_admins LOOP
            IF rec.email IS NOT NULL AND rec.password IS NOT NULL AND BTRIM(rec.password) <> '' THEN
                INSERT INTO private_auth.super_admin_credentials (admin_id, email, password_hash, updated_at)
                VALUES (
                    COALESCE(rec.id, 'sa_aavasa_01'),
                    rec.email,
                    CASE
                        WHEN rec.password LIKE '$2a$%' OR rec.password LIKE '$2b$%' OR rec.password LIKE '$2y$%'
                        THEN rec.password
                        ELSE crypt(rec.password, gen_salt('bf', 10))
                    END,
                    NOW()
                )
                ON CONFLICT (admin_id) DO UPDATE
                SET email = EXCLUDED.email,
                    password_hash = EXCLUDED.password_hash,
                    updated_at = NOW();
            END IF;
        END LOOP;

        ALTER TABLE public.super_admins DROP COLUMN IF EXISTS password;
    END IF;

    -- Ensure at least one default super_admin record metadata exists safely
    IF to_regclass('public.super_admins') IS NOT NULL THEN
        INSERT INTO public.super_admins (id, name, email, role)
        VALUES ('sa_aavasa_01', 'Aavasa Super Admin', 'superadmin@aavasa.com', 'PLATFORM_OWNER')
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- 1b. Hotel Admins migration
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'hotels' AND column_name = 'password'
    ) INTO has_hotel_pass;

    IF has_hotel_pass THEN
        FOR rec IN SELECT id, LOWER(BTRIM(email)) AS email, password FROM public.hotels LOOP
            IF rec.id IS NOT NULL AND rec.email IS NOT NULL AND rec.password IS NOT NULL AND BTRIM(rec.password) <> '' THEN
                INSERT INTO private_auth.hotel_credentials (hotel_id, email, password_hash, updated_at)
                VALUES (
                    rec.id,
                    rec.email,
                    CASE
                        WHEN rec.password LIKE '$2a$%' OR rec.password LIKE '$2b$%' OR rec.password LIKE '$2y$%'
                        THEN rec.password
                        ELSE crypt(rec.password, gen_salt('bf', 10))
                    END,
                    NOW()
                )
                ON CONFLICT (hotel_id) DO UPDATE
                SET email = EXCLUDED.email,
                    password_hash = EXCLUDED.password_hash,
                    updated_at = NOW();
            END IF;
        END LOOP;

        ALTER TABLE public.hotels DROP COLUMN IF EXISTS password;
    END IF;

    -- 1c. Guest Users migration
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'guest_users' AND column_name = 'password'
    ) INTO has_guest_pass;

    IF has_guest_pass THEN
        FOR rec IN SELECT id, phone, LOWER(BTRIM(email)) AS email, password FROM public.guest_users LOOP
            clean_hash_input := NULLIF(BTRIM(regexp_replace(COALESCE(rec.password, ''), '^HASH_', '')), '');
            INSERT INTO private_auth.guest_credentials (guest_id, phone, email, password_hash, updated_at)
            VALUES (
                rec.id,
                rec.phone,
                rec.email,
                CASE
                    WHEN clean_hash_input IS NULL OR clean_hash_input = 'SUPABASE_VERIFIED' THEN NULL
                    WHEN clean_hash_input LIKE '$2a$%' OR clean_hash_input LIKE '$2b$%' OR clean_hash_input LIKE '$2y$%' THEN clean_hash_input
                    ELSE crypt(clean_hash_input, gen_salt('bf', 10))
                END,
                NOW()
            )
            ON CONFLICT (guest_id) DO UPDATE
            SET phone = COALESCE(EXCLUDED.phone, private_auth.guest_credentials.phone),
                email = COALESCE(EXCLUDED.email, private_auth.guest_credentials.email),
                password_hash = COALESCE(EXCLUDED.password_hash, private_auth.guest_credentials.password_hash),
                updated_at = NOW();
        END LOOP;

        ALTER TABLE public.guest_users DROP COLUMN IF EXISTS password;
    END IF;
END $$;

-- ============================================================================
-- 2. SERVICE-ROLE-ONLY CREDENTIAL VERIFICATION & AUTH SYNC RPCS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sec_verify_super_admin_secret(
    p_email TEXT,
    p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private_auth, extensions
AS $$
DECLARE
    v_email TEXT := LOWER(NULLIF(BTRIM(p_email), ''));
    v_cred private_auth.super_admin_credentials%ROWTYPE;
    v_admin RECORD;
BEGIN
    IF v_email IS NULL OR p_password IS NULL OR BTRIM(p_password) = '' THEN
        RETURN jsonb_build_object('valid', FALSE);
    END IF;

    SELECT * INTO v_cred
    FROM private_auth.super_admin_credentials
    WHERE LOWER(BTRIM(email)) = v_email
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', FALSE);
    END IF;

    IF v_cred.password_hash IS NULL OR crypt(p_password, v_cred.password_hash) <> v_cred.password_hash THEN
        RETURN jsonb_build_object('valid', FALSE);
    END IF;

    SELECT id, name, email, role INTO v_admin
    FROM public.super_admins
    WHERE LOWER(BTRIM(email)) = v_email
    LIMIT 1;

    RETURN jsonb_build_object(
        'valid', TRUE,
        'auth_user_id', v_cred.auth_user_id,
        'admin', jsonb_build_object(
            'id', COALESCE(v_admin.id, v_cred.admin_id),
            'name', COALESCE(v_admin.name, 'Aavasa Super Admin'),
            'email', COALESCE(v_admin.email, v_cred.email),
            'role', COALESCE(v_admin.role, 'PLATFORM_OWNER')
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.sec_verify_super_admin_secret(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sec_verify_super_admin_secret(TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.sec_sync_super_admin_auth(
    p_email TEXT,
    p_password TEXT DEFAULT NULL,
    p_auth_user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private_auth, extensions
AS $$
DECLARE
    v_email TEXT := LOWER(BTRIM(p_email));
BEGIN
    IF v_email IS NULL OR v_email = '' THEN
        RETURN;
    END IF;

    UPDATE private_auth.super_admin_credentials
    SET auth_user_id = COALESCE(p_auth_user_id, auth_user_id),
        password_hash = CASE
            WHEN p_password IS NOT NULL AND BTRIM(p_password) <> ''
            THEN crypt(BTRIM(p_password), gen_salt('bf', 10))
            ELSE password_hash
        END,
        updated_at = NOW()
    WHERE LOWER(BTRIM(email)) = v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.sec_sync_super_admin_auth(TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sec_sync_super_admin_auth(TEXT, TEXT, UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.sec_verify_hotel_secret(
    p_hotel_id TEXT,
    p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private_auth, extensions
AS $$
DECLARE
    v_cred private_auth.hotel_credentials%ROWTYPE;
BEGIN
    IF p_hotel_id IS NULL OR BTRIM(p_hotel_id) = '' OR p_password IS NULL OR BTRIM(p_password) = '' THEN
        RETURN jsonb_build_object('valid', FALSE);
    END IF;

    SELECT * INTO v_cred
    FROM private_auth.hotel_credentials
    WHERE hotel_id = BTRIM(p_hotel_id)
    LIMIT 1;

    IF NOT FOUND OR v_cred.password_hash IS NULL THEN
        RETURN jsonb_build_object('valid', FALSE);
    END IF;

    RETURN jsonb_build_object(
        'valid', (crypt(p_password, v_cred.password_hash) = v_cred.password_hash),
        'auth_user_id', v_cred.auth_user_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.sec_verify_hotel_secret(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sec_verify_hotel_secret(TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.sec_upsert_hotel_secret(
    p_hotel_id TEXT,
    p_email TEXT,
    p_plain_password TEXT DEFAULT NULL,
    p_auth_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private_auth, extensions
AS $$
DECLARE
    v_hotel_id TEXT := BTRIM(p_hotel_id);
    v_email TEXT := LOWER(BTRIM(p_email));
    v_existing private_auth.hotel_credentials%ROWTYPE;
    v_out_auth_id UUID;
BEGIN
    SELECT * INTO v_existing
    FROM private_auth.hotel_credentials
    WHERE hotel_id = v_hotel_id;

    IF NOT FOUND THEN
        IF p_plain_password IS NULL OR BTRIM(p_plain_password) = '' THEN
            RAISE EXCEPTION 'Password is required when creating new hotel credentials.';
        END IF;
        INSERT INTO private_auth.hotel_credentials (hotel_id, email, password_hash, auth_user_id, updated_at)
        VALUES (
            v_hotel_id,
            v_email,
            crypt(BTRIM(p_plain_password), gen_salt('bf', 10)),
            p_auth_user_id,
            NOW()
        )
        RETURNING auth_user_id INTO v_out_auth_id;
    ELSE
        UPDATE private_auth.hotel_credentials
        SET email = COALESCE(NULLIF(v_email, ''), email),
            password_hash = CASE
                WHEN p_plain_password IS NOT NULL AND BTRIM(p_plain_password) <> ''
                THEN crypt(BTRIM(p_plain_password), gen_salt('bf', 10))
                ELSE password_hash
            END,
            auth_user_id = COALESCE(p_auth_user_id, auth_user_id),
            updated_at = NOW()
        WHERE hotel_id = v_hotel_id
        RETURNING auth_user_id INTO v_out_auth_id;
    END IF;

    RETURN v_out_auth_id;
END;
$$;

REVOKE ALL ON FUNCTION public.sec_upsert_hotel_secret(TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sec_upsert_hotel_secret(TEXT, TEXT, TEXT, UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.sec_get_hotel_auth_id(p_hotel_id TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private_auth
AS $$
    SELECT auth_user_id FROM private_auth.hotel_credentials WHERE hotel_id = BTRIM(p_hotel_id) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.sec_get_hotel_auth_id(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sec_get_hotel_auth_id(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.sec_find_auth_user_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth
AS $$
    SELECT id FROM auth.users WHERE LOWER(email) = LOWER(BTRIM(p_email)) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.sec_find_auth_user_by_email(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sec_find_auth_user_by_email(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.sec_upsert_guest_auth_map(
    p_guest_id TEXT,
    p_phone TEXT,
    p_email TEXT,
    p_plain_password TEXT DEFAULT NULL,
    p_auth_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private_auth, extensions
AS $$
DECLARE
    v_out_auth_id UUID;
BEGIN
    INSERT INTO private_auth.guest_credentials (guest_id, phone, email, password_hash, auth_user_id, updated_at)
    VALUES (
        BTRIM(p_guest_id),
        NULLIF(BTRIM(p_phone), ''),
        LOWER(NULLIF(BTRIM(p_email), '')),
        CASE
            WHEN p_plain_password IS NOT NULL AND BTRIM(p_plain_password) <> ''
            THEN crypt(BTRIM(p_plain_password), gen_salt('bf', 10))
            ELSE NULL
        END,
        p_auth_user_id,
        NOW()
    )
    ON CONFLICT (guest_id) DO UPDATE
    SET phone = COALESCE(EXCLUDED.phone, private_auth.guest_credentials.phone),
        email = COALESCE(EXCLUDED.email, private_auth.guest_credentials.email),
        password_hash = COALESCE(EXCLUDED.password_hash, private_auth.guest_credentials.password_hash),
        auth_user_id = COALESCE(EXCLUDED.auth_user_id, private_auth.guest_credentials.auth_user_id),
        updated_at = NOW()
    RETURNING auth_user_id INTO v_out_auth_id;

    RETURN v_out_auth_id;
END;
$$;

REVOKE ALL ON FUNCTION public.sec_upsert_guest_auth_map(TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sec_upsert_guest_auth_map(TEXT, TEXT, TEXT, TEXT, UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.sec_get_guest_auth_id(p_guest_id TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private_auth
AS $$
    SELECT auth_user_id FROM private_auth.guest_credentials WHERE guest_id = BTRIM(p_guest_id) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.sec_get_guest_auth_id(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sec_get_guest_auth_id(TEXT) TO service_role;

-- ============================================================================
-- 3. JWT CLAIM HELPERS FOR STRICT TENANT & ROLE RLS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT auth.role() = 'service_role' OR public.current_app_role() = 'super_admin';
$$;

CREATE OR REPLACE FUNCTION public.current_hotel_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(BTRIM(COALESCE(auth.jwt() -> 'app_metadata' ->> 'hotel_id', '')), '');
$$;

CREATE OR REPLACE FUNCTION public.has_hotel_access(p_hotel_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT
        public.is_super_admin()
        OR (
            public.current_app_role() IN ('hotel_admin', 'staff')
            AND NULLIF(BTRIM(COALESCE(p_hotel_id, '')), '') IS NOT NULL
            AND LOWER(BTRIM(p_hotel_id)) = LOWER(COALESCE(public.current_hotel_id(), ''))
        );
$$;

CREATE OR REPLACE FUNCTION public.current_guest_phone()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(
        RIGHT(
            regexp_replace(
                COALESCE(
                    auth.jwt() -> 'app_metadata' ->> 'phone',
                    auth.jwt() -> 'user_metadata' ->> 'phone',
                    ''
                ),
                '\D',
                '',
                'g'
            ),
            10
        ),
        ''
    );
$$;

CREATE OR REPLACE FUNCTION public.current_guest_email()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT LOWER(NULLIF(BTRIM(COALESCE(auth.jwt() ->> 'email', '')), ''));
$$;

CREATE OR REPLACE FUNCTION public.is_guest_record_owner(p_phone TEXT, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT
        auth.role() = 'authenticated'
        AND public.current_app_role() NOT IN ('super_admin', 'hotel_admin', 'staff')
        AND (
            (
                public.current_guest_phone() IS NOT NULL
                AND RIGHT(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g'), 10) = public.current_guest_phone()
            )
            OR (
                public.current_guest_email() IS NOT NULL
                AND public.current_guest_email() NOT LIKE '%@guest.aurastay.local'
                AND LOWER(BTRIM(COALESCE(p_email, ''))) = public.current_guest_email()
            )
        );
$$;

-- ============================================================================
-- 4. DROP ALL LEGACY PERMISSIVE POLICIES & ENABLE RLS ACROSS EVERY PUBLIC TABLE
-- ============================================================================
DO $$
DECLARE
    tbl TEXT;
    pol RECORD;
    target_tables TEXT[] := ARRAY[
        'super_admins',
        'hotels',
        'rooms',
        'room_types',
        'reservations',
        'bookings',
        'banquet_bookings',
        'banquet_venues',
        'cab_bookings',
        'financial_invoices',
        'fnb_orders',
        'guest_users',
        'hotel_expenses',
        'housekeeping_tasks',
        'inventory_items',
        'lost_and_found_items',
        'lost_and_found',
        'material_requisitions',
        'purchase_orders',
        'ota_channels',
        'property_profile',
        'restaurant_tables',
        'restaurant_menu_items',
        'staff_users',
        'revenue_kpis',
        'revenue_actions',
        'budget_forecast'
    ];
BEGIN
    FOREACH tbl IN ARRAY target_tables LOOP
        IF to_regclass('public.' || tbl) IS NOT NULL THEN
            FOR pol IN
                SELECT policyname
                FROM pg_policies
                WHERE schemaname = 'public' AND tablename = tbl
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
            END LOOP;

            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        END IF;
    END LOOP;
END $$;

-- 4a. super_admins: STRICTLY SuperAdmin ONLY
CREATE POLICY "super_admins_super_admin_only"
    ON public.super_admins
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- 4b. hotels: SuperAdmin manages all; Hotel Admin/Staff can ONLY read own tenant row
CREATE POLICY "hotels_read_scoped"
    ON public.hotels
    FOR SELECT
    USING (
        public.is_super_admin()
        OR (
            public.current_app_role() IN ('hotel_admin', 'staff')
            AND LOWER(id) = LOWER(COALESCE(public.current_hotel_id(), ''))
        )
    );

CREATE POLICY "hotels_write_super_admin_only"
    ON public.hotels
    FOR INSERT
    WITH CHECK (public.is_super_admin());

CREATE POLICY "hotels_update_super_admin_only"
    ON public.hotels
    FOR UPDATE
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

CREATE POLICY "hotels_delete_super_admin_only"
    ON public.hotels
    FOR DELETE
    USING (public.is_super_admin());

-- 4c. Publicly readable non-PII room categories (for public booking catalog & admin)
CREATE POLICY "room_types_public_read"
    ON public.room_types
    FOR SELECT
    USING (TRUE);

CREATE POLICY "room_types_tenant_write"
    ON public.room_types
    FOR INSERT
    WITH CHECK (public.has_hotel_access(hotel_id));

CREATE POLICY "room_types_tenant_update"
    ON public.room_types
    FOR UPDATE
    USING (public.has_hotel_access(hotel_id))
    WITH CHECK (public.has_hotel_access(hotel_id));

CREATE POLICY "room_types_tenant_delete"
    ON public.room_types
    FOR DELETE
    USING (public.has_hotel_access(hotel_id));

-- 4d. Tenant-isolated operational PMS tables
DO $$
DECLARE
    tbl TEXT;
    hotel_scoped_tables TEXT[] := ARRAY[
        'rooms',
        'banquet_bookings',
        'banquet_venues',
        'cab_bookings',
        'financial_invoices',
        'fnb_orders',
        'hotel_expenses',
        'housekeeping_tasks',
        'inventory_items',
        'lost_and_found_items',
        'lost_and_found',
        'material_requisitions',
        'purchase_orders',
        'restaurant_tables',
        'restaurant_menu_items',
        'staff_users'
    ];
BEGIN
    FOREACH tbl IN ARRAY hotel_scoped_tables LOOP
        IF to_regclass('public.' || tbl) IS NOT NULL THEN
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR ALL USING (public.has_hotel_access(hotel_id)) WITH CHECK (public.has_hotel_access(hotel_id))',
                tbl || '_tenant_isolation',
                tbl
            );
        END IF;
    END LOOP;
END $$;

-- Optional banquet_venues public read for venue inquiry if used
DO $$
BEGIN
    IF to_regclass('public.banquet_venues') IS NOT NULL THEN
        CREATE POLICY "banquet_venues_public_read"
            ON public.banquet_venues
            FOR SELECT
            USING (TRUE);
    END IF;
END $$;

-- 4e. reservations: Hotel-scoped for PMS + owner-scoped for verified Guest JWT
CREATE POLICY "reservations_tenant_access"
    ON public.reservations
    FOR ALL
    USING (public.has_hotel_access(hotel_id))
    WITH CHECK (public.has_hotel_access(hotel_id));

CREATE POLICY "reservations_guest_own_select"
    ON public.reservations
    FOR SELECT
    USING (public.is_guest_record_owner(guest_phone, guest_email));

CREATE POLICY "reservations_guest_own_cancel"
    ON public.reservations
    FOR UPDATE
    USING (public.is_guest_record_owner(guest_phone, guest_email))
    WITH CHECK (
        public.is_guest_record_owner(guest_phone, guest_email)
        AND status = 'CANCELLED'
    );

-- Optional legacy bookings alias table if present
DO $$
BEGIN
    IF to_regclass('public.bookings') IS NOT NULL THEN
        EXECUTE 'CREATE POLICY "bookings_tenant_access" ON public.bookings FOR ALL USING (public.has_hotel_access(hotel_id)) WITH CHECK (public.has_hotel_access(hotel_id))';
    END IF;
END $$;

-- 4f. guest_users: SuperAdmin / verified Guest owner / Hotel Admin read
CREATE POLICY "guest_users_owner_or_admin_select"
    ON public.guest_users
    FOR SELECT
    USING (
        public.is_super_admin()
        OR public.current_app_role() IN ('hotel_admin', 'staff')
        OR public.is_guest_record_owner(phone, email)
    );

CREATE POLICY "guest_users_owner_or_admin_update"
    ON public.guest_users
    FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.is_guest_record_owner(phone, email)
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.is_guest_record_owner(phone, email)
    );

CREATE POLICY "guest_users_super_admin_insert_delete"
    ON public.guest_users
    FOR INSERT
    WITH CHECK (public.is_super_admin());

CREATE POLICY "guest_users_super_admin_delete"
    ON public.guest_users
    FOR DELETE
    USING (public.is_super_admin());

-- 4g. Global/legacy configuration tables
DO $$
BEGIN
    IF to_regclass('public.ota_channels') IS NOT NULL THEN
        CREATE POLICY "ota_channels_staff_read"
            ON public.ota_channels
            FOR SELECT
            USING (public.is_super_admin() OR public.current_app_role() IN ('hotel_admin', 'staff'));
        CREATE POLICY "ota_channels_admin_write"
            ON public.ota_channels
            FOR ALL
            USING (public.is_super_admin() OR public.current_app_role() = 'hotel_admin')
            WITH CHECK (public.is_super_admin() OR public.current_app_role() = 'hotel_admin');
    END IF;

    IF to_regclass('public.property_profile') IS NOT NULL THEN
        CREATE POLICY "property_profile_admin_access"
            ON public.property_profile
            FOR ALL
            USING (public.is_super_admin() OR public.current_app_role() IN ('hotel_admin', 'staff'))
            WITH CHECK (public.is_super_admin() OR public.current_app_role() = 'hotel_admin');
    END IF;

    IF to_regclass('public.revenue_kpis') IS NOT NULL THEN
        CREATE POLICY "revenue_kpis_admin_access"
            ON public.revenue_kpis
            FOR ALL
            USING (public.is_super_admin() OR public.current_app_role() = 'hotel_admin')
            WITH CHECK (public.is_super_admin() OR public.current_app_role() = 'hotel_admin');
    END IF;
END $$;

-- 4h. Switch view to security_invoker = true so Postgres evaluates caller RLS policies
ALTER VIEW IF EXISTS public.aiosell_live_inventory_view SET (security_invoker = true);

-- ============================================================================
-- 5. ZERO-PII PUBLIC BOOKING ENGINE RPCS (Preserves full guest flows w/ RLS)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_public_hotel_inventory(
    p_hotel_slug_or_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hotel RECORD;
    v_filter TEXT := LOWER(NULLIF(BTRIM(p_hotel_slug_or_id), ''));
    v_room_types JSONB;
    v_rooms JSONB;
    v_booked_windows JSONB;
BEGIN
    IF v_filter IS NOT NULL THEN
        SELECT id, slug, name, short_name, logo_url, mobile, address, city, country,
               currency, currency_symbol, status, aiosell_hotel_code, created_at
        INTO v_hotel
        FROM public.hotels
        WHERE LOWER(id) <> 'hotel_aurastay_01'
          AND (LOWER(slug) = v_filter OR LOWER(id) = v_filter)
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    IF v_hotel IS NULL THEN
        SELECT id, slug, name, short_name, logo_url, mobile, address, city, country,
               currency, currency_symbol, status, aiosell_hotel_code, created_at
        INTO v_hotel
        FROM public.hotels
        WHERE LOWER(id) <> 'hotel_aurastay_01'
        ORDER BY (status = 'ACTIVE') DESC, created_at DESC
        LIMIT 1;
    END IF;

    IF v_hotel IS NULL THEN
        RETURN jsonb_build_object(
            'hotel', NULL,
            'roomTypes', '[]'::jsonb,
            'rooms', '[]'::jsonb,
            'bookedWindows', '[]'::jsonb
        );
    END IF;

    SELECT COALESCE(jsonb_agg(to_jsonb(rt) ORDER BY rt.created_at ASC), '[]'::jsonb)
    INTO v_room_types
    FROM (
        SELECT id, hotel_id, name, label, bedding_type, max_adults, max_extra,
               max_children, area_sqft, base_price, extra_bed_price, child_price,
               amenities, description, notes, is_booking_engine, image_url, created_at
        FROM public.room_types
        WHERE hotel_id = v_hotel.id
          AND COALESCE(is_booking_engine, TRUE) = TRUE
    ) rt;

    -- Explicitly omit guest, booking_id, key_card_no, phone_extension from public room payload
    SELECT COALESCE(jsonb_agg(to_jsonb(rm) ORDER BY rm.room_number ASC), '[]'::jsonb)
    INTO v_rooms
    FROM (
        SELECT id, hotel_id, room_number, room_type_id, floor, type, bed,
               status, price, is_ota_locked, check_out
        FROM public.rooms
        WHERE hotel_id = v_hotel.id
    ) rm;

    -- Zero-PII active booking date windows only (no guest name, phone, email, or amount)
    SELECT COALESCE(jsonb_agg(to_jsonb(bw)), '[]'::jsonb)
    INTO v_booked_windows
    FROM (
        SELECT room_number, room, room_type, check_in, check_out, status
        FROM public.reservations
        WHERE hotel_id = v_hotel.id
          AND COALESCE(UPPER(status), 'CONFIRMED') NOT IN ('CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW')
          AND check_out >= (CURRENT_DATE - INTERVAL '1 day')::date
    ) bw;

    RETURN jsonb_build_object(
        'hotel', jsonb_build_object(
            'id', v_hotel.id,
            'slug', v_hotel.slug,
            'name', v_hotel.name,
            'short_name', v_hotel.short_name,
            'logo_url', v_hotel.logo_url,
            'mobile', v_hotel.mobile,
            'address', v_hotel.address,
            'city', v_hotel.city,
            'country', v_hotel.country,
            'currency', v_hotel.currency,
            'currency_symbol', v_hotel.currency_symbol,
            'status', v_hotel.status,
            'aiosell_hotel_code', v_hotel.aiosell_hotel_code
        ),
        'roomTypes', v_room_types,
        'rooms', v_rooms,
        'bookedWindows', v_booked_windows
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_hotel_inventory(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_hotel_inventory(TEXT) TO anon, authenticated, service_role;

-- Atomic server-side guest reservation creator (prevents double-booking without opening direct writes)
CREATE OR REPLACE FUNCTION public.create_guest_reservation(
    p_booking_id TEXT,
    p_hotel_id TEXT,
    p_guest TEXT,
    p_guest_email TEXT,
    p_guest_phone TEXT,
    p_room_category TEXT,
    p_check_in DATE,
    p_check_out DATE,
    p_amount NUMERIC,
    p_adults INT DEFAULT 2,
    p_children INT DEFAULT 0,
    p_preferred_room_number TEXT DEFAULT NULL,
    p_special_requests TEXT DEFAULT NULL,
    p_source TEXT DEFAULT 'Direct Website'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hotel RECORD;
    v_booking_id TEXT := COALESCE(NULLIF(BTRIM(p_booking_id), ''), 'AST-B-' || floor(random() * 9000 + 1000)::text);
    v_cat_clean TEXT := COALESCE(NULLIF(BTRIM(p_room_category), ''), 'Standard Room');
    v_allocated_room TEXT;
    v_allocated_type TEXT;
    v_nights INT;
    v_covers_today BOOLEAN;
    v_final_amount NUMERIC;
    v_room_price NUMERIC;
BEGIN
    IF p_hotel_id IS NULL OR BTRIM(p_hotel_id) = '' THEN
        RAISE EXCEPTION 'Hotel ID is required.';
    END IF;
    IF p_guest IS NULL OR BTRIM(p_guest) = '' THEN
        RAISE EXCEPTION 'Guest name is required.';
    END IF;
    IF p_check_in IS NULL OR p_check_out IS NULL OR p_check_out <= p_check_in THEN
        RAISE EXCEPTION 'Check-out date must be after check-in date.';
    END IF;

    SELECT id, name, status INTO v_hotel
    FROM public.hotels
    WHERE id = BTRIM(p_hotel_id)
    LIMIT 1;

    IF NOT FOUND OR COALESCE(v_hotel.status, 'ACTIVE') <> 'ACTIVE' THEN
        RAISE EXCEPTION 'Property is unavailable for booking.';
    END IF;

    v_nights := GREATEST(1, (p_check_out - p_check_in));
    v_covers_today := (p_check_in <= CURRENT_DATE AND p_check_out > CURRENT_DATE);

    -- Check preferred room number first if supplied
    IF p_preferred_room_number IS NOT NULL AND BTRIM(p_preferred_room_number) <> '' THEN
        SELECT r.room_number, r.type, r.price
        INTO v_allocated_room, v_allocated_type, v_room_price
        FROM public.rooms r
        WHERE r.hotel_id = v_hotel.id
          AND r.room_number = BTRIM(p_preferred_room_number)
          AND COALESCE(UPPER(r.status), 'VACANT_READY') NOT IN ('MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED')
          AND (NOT v_covers_today OR COALESCE(UPPER(r.status), 'VACANT_READY') NOT IN ('OCCUPIED', 'RESERVED'))
          AND NOT EXISTS (
              SELECT 1 FROM public.reservations res
              WHERE res.hotel_id = v_hotel.id
                AND COALESCE(UPPER(res.status), 'CONFIRMED') NOT IN ('CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW')
                AND res.check_in < p_check_out
                AND res.check_out > p_check_in
                AND (res.room_number = r.room_number OR regexp_replace(COALESCE(res.room, ''), '^Room\s*', '', 'i') = r.room_number)
          )
        FOR UPDATE OF r;
    END IF;

    -- Allocate any free room matching requested category
    IF v_allocated_room IS NULL THEN
        SELECT r.room_number, r.type, r.price
        INTO v_allocated_room, v_allocated_type, v_room_price
        FROM public.rooms r
        WHERE r.hotel_id = v_hotel.id
          AND COALESCE(UPPER(r.status), 'VACANT_READY') NOT IN ('MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED')
          AND (
              NOT v_covers_today
              OR COALESCE(UPPER(r.status), 'VACANT_READY') NOT IN ('OCCUPIED', 'RESERVED')
          )
          AND (
              LOWER(COALESCE(r.type, '')) = LOWER(v_cat_clean)
              OR LOWER(COALESCE(r.type, '')) LIKE '%' || LOWER(regexp_replace(v_cat_clean, '\s*room$', '', 'i')) || '%'
              OR LOWER(v_cat_clean) LIKE '%' || LOWER(regexp_replace(COALESCE(r.type, ''), '\s*room$', '', 'i')) || '%'
          )
          AND NOT EXISTS (
              SELECT 1 FROM public.reservations res
              WHERE res.hotel_id = v_hotel.id
                AND COALESCE(UPPER(res.status), 'CONFIRMED') NOT IN ('CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW')
                AND res.check_in < p_check_out
                AND res.check_out > p_check_in
                AND (res.room_number = r.room_number OR regexp_replace(COALESCE(res.room, ''), '^Room\s*', '', 'i') = r.room_number)
          )
        ORDER BY r.room_number ASC
        LIMIT 1
        FOR UPDATE OF r;
    END IF;

    IF v_allocated_room IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'code', 'NO_INVENTORY',
            'message', format('Sorry, all %s units are reserved for %s to %s.', v_cat_clean, p_check_in, p_check_out)
        );
    END IF;

    v_allocated_type := COALESCE(NULLIF(BTRIM(v_allocated_type), ''), v_cat_clean);
    v_final_amount := CASE
        WHEN p_amount IS NOT NULL AND p_amount > 0 THEN p_amount
        ELSE COALESCE(v_room_price, 2500) * v_nights
    END;

    INSERT INTO public.reservations (
        id, hotel_id, guest, guest_email, guest_phone, room, room_number, room_type,
        check_in, check_out, nights, adults, children, amount, paid, advance_paid,
        status, payment, special_requests, source
    )
    VALUES (
        v_booking_id,
        v_hotel.id,
        BTRIM(p_guest),
        NULLIF(BTRIM(p_guest_email), ''),
        NULLIF(BTRIM(p_guest_phone), ''),
        'Room ' || v_allocated_room || ' - ' || v_allocated_type,
        v_allocated_room,
        v_allocated_type,
        p_check_in,
        p_check_out,
        v_nights,
        GREATEST(1, COALESCE(p_adults, 2)),
        GREATEST(0, COALESCE(p_children, 0)),
        v_final_amount,
        0,
        0,
        'CONFIRMED',
        'PENDING',
        NULLIF(BTRIM(p_special_requests), ''),
        COALESCE(NULLIF(BTRIM(p_source), ''), 'Direct Website (' || COALESCE(v_hotel.name, 'Property') || ')')
    );

    IF v_covers_today THEN
        UPDATE public.rooms
        SET status = 'RESERVED',
            guest = BTRIM(p_guest),
            booking_id = v_booking_id,
            check_out = p_check_out,
            updated_at = NOW()
        WHERE hotel_id = v_hotel.id
          AND room_number = v_allocated_room;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'bookingId', v_booking_id,
        'hotelId', v_hotel.id,
        'roomNumber', v_allocated_room,
        'roomType', v_allocated_type,
        'amount', v_final_amount,
        'status', 'CONFIRMED'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.create_guest_reservation(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, DATE, NUMERIC, INT, INT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_guest_reservation(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, DATE, NUMERIC, INT, INT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- Atomic server-side guest self-cancellation RPC
CREATE OR REPLACE FUNCTION public.cancel_guest_reservation(
    p_booking_id TEXT,
    p_hotel_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_res public.reservations%ROWTYPE;
BEGIN
    SELECT * INTO v_res
    FROM public.reservations
    WHERE id = BTRIM(p_booking_id)
      AND (p_hotel_id IS NULL OR hotel_id = BTRIM(p_hotel_id))
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'message', 'Reservation not found.');
    END IF;

    IF NOT (
        public.has_hotel_access(v_res.hotel_id)
        OR public.is_guest_record_owner(v_res.guest_phone, v_res.guest_email)
    ) THEN
        RAISE EXCEPTION 'Unauthorized to cancel this reservation.';
    END IF;

    UPDATE public.reservations
    SET status = 'CANCELLED',
        updated_at = NOW()
    WHERE id = v_res.id
      AND hotel_id = v_res.hotel_id;

    UPDATE public.rooms
    SET status = 'VACANT_READY',
        guest = NULL,
        booking_id = NULL,
        check_out = NULL,
        is_ota_locked = FALSE,
        ota_channel = NULL,
        updated_at = NOW()
    WHERE hotel_id = v_res.hotel_id
      AND booking_id = v_res.id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'bookingId', v_res.id,
        'hotelId', v_res.hotel_id,
        'checkIn', v_res.check_in,
        'checkOut', v_res.check_out
    );
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_guest_reservation(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_guest_reservation(TEXT, TEXT) TO authenticated, service_role;

-- ============================================================================
-- 6. HARDEN admin_update_room & SYNCHRONIZATION TRIGGERS
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

    IF NOT public.has_hotel_access(v_hotel_id) THEN
        RAISE EXCEPTION 'Forbidden: Invalid tenant credentials for hotel %.', v_hotel_id;
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
          AND (room_number = v_old_num OR room = 'Room ' || v_old_num OR room = v_old_num);

        UPDATE public.housekeeping_tasks SET room_number = v_new_num, updated_at = NOW()
        WHERE hotel_id = v_hotel_id AND room_number = v_old_num;

        UPDATE public.restaurant_tables SET room_number = v_new_num, updated_at = NOW()
        WHERE hotel_id = v_hotel_id AND room_number = v_old_num;

        UPDATE public.financial_invoices SET room_number = v_new_num, updated_at = NOW()
        WHERE hotel_id = v_hotel_id AND room_number = v_old_num;

        UPDATE public.lost_and_found_items SET room_number = v_new_num, updated_at = NOW()
        WHERE hotel_id = v_hotel_id AND room_number = v_old_num;

        UPDATE public.cab_bookings SET room_number = v_new_num, updated_at = NOW()
        WHERE hotel_id = v_hotel_id AND room_number = v_old_num;
    END IF;

    RETURN to_jsonb(v_updated);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_room(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, BOOLEAN, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_room(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, BOOLEAN, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- Make cross-table trigger functions SECURITY DEFINER so RLS stays enforced on direct queries
DO $$
BEGIN
    IF to_regprocedure('public.trg_sync_reservation_to_room()') IS NOT NULL THEN
        ALTER FUNCTION public.trg_sync_reservation_to_room() SECURITY DEFINER SET search_path = public;
    END IF;
    IF to_regprocedure('public.trg_sync_housekeeping_to_room()') IS NOT NULL THEN
        ALTER FUNCTION public.trg_sync_housekeeping_to_room() SECURITY DEFINER SET search_path = public;
    END IF;
    IF to_regprocedure('public.handle_ota_booking_room_lock()') IS NOT NULL THEN
        ALTER FUNCTION public.handle_ota_booking_room_lock() SECURITY DEFINER SET search_path = public;
    END IF;
END $$;

-- ============================================================================
-- 7. PERFORMANCE B-TREE INDEXES (Supabase Free-Tier Nano Optimization)
-- ============================================================================
DO $$
BEGIN
    IF to_regclass('public.hotels') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_hotels_slug_lower ON public.hotels (LOWER(slug));
        CREATE INDEX IF NOT EXISTS idx_hotels_email_lower ON public.hotels (LOWER(email));
        CREATE INDEX IF NOT EXISTS idx_hotels_status_created ON public.hotels (status, created_at DESC);
    END IF;

    IF to_regclass('public.rooms') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_rooms_hotel_room_num ON public.rooms (hotel_id, room_number);
        CREATE INDEX IF NOT EXISTS idx_rooms_hotel_status ON public.rooms (hotel_id, status);
        CREATE INDEX IF NOT EXISTS idx_rooms_room_type_id ON public.rooms (room_type_id);
        CREATE INDEX IF NOT EXISTS idx_rooms_booking_id ON public.rooms (booking_id) WHERE booking_id IS NOT NULL;
    END IF;

    IF to_regclass('public.room_types') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_room_types_hotel_name ON public.room_types (hotel_id, name);
    END IF;

    IF to_regclass('public.reservations') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_reservations_hotel_created ON public.reservations (hotel_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_reservations_hotel_status_created ON public.reservations (hotel_id, status, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_reservations_hotel_dates ON public.reservations (hotel_id, check_in, check_out);
        CREATE INDEX IF NOT EXISTS idx_reservations_room_number ON public.reservations (hotel_id, room_number);
        CREATE INDEX IF NOT EXISTS idx_reservations_guest_phone ON public.reservations (guest_phone);
        CREATE INDEX IF NOT EXISTS idx_reservations_guest_email_lower ON public.reservations (LOWER(guest_email));
    END IF;

    IF to_regclass('public.financial_invoices') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_financial_invoices_hotel_created ON public.financial_invoices (hotel_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_financial_invoices_hotel_status ON public.financial_invoices (hotel_id, status);
        CREATE INDEX IF NOT EXISTS idx_financial_invoices_reservation_id ON public.financial_invoices (reservation_id);
    END IF;

    IF to_regclass('public.fnb_orders') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_fnb_orders_hotel_created ON public.fnb_orders (hotel_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_fnb_orders_hotel_status ON public.fnb_orders (hotel_id, status);
    END IF;

    IF to_regclass('public.banquet_bookings') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_banquet_bookings_hotel_date ON public.banquet_bookings (hotel_id, event_date);
        CREATE INDEX IF NOT EXISTS idx_banquet_bookings_hotel_status ON public.banquet_bookings (hotel_id, status);
    END IF;

    IF to_regclass('public.banquet_venues') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_banquet_venues_hotel ON public.banquet_venues (hotel_id);
    END IF;

    IF to_regclass('public.cab_bookings') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_cab_bookings_hotel_created ON public.cab_bookings (hotel_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_cab_bookings_hotel_status ON public.cab_bookings (hotel_id, booking_status);
    END IF;

    IF to_regclass('public.hotel_expenses') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_hotel_expenses_hotel_created ON public.hotel_expenses (hotel_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_hotel_expenses_hotel_cat ON public.hotel_expenses (hotel_id, category);
    END IF;

    IF to_regclass('public.housekeeping_tasks') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_hotel_status_created ON public.housekeeping_tasks (hotel_id, status, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_room ON public.housekeeping_tasks (hotel_id, room_number);
    END IF;

    IF to_regclass('public.inventory_items') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_inventory_items_hotel_status ON public.inventory_items (hotel_id, status);
        CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON public.inventory_items (hotel_id, sku_code);
    END IF;

    IF to_regclass('public.lost_and_found_items') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_lost_and_found_hotel_status_created ON public.lost_and_found_items (hotel_id, status, created_at DESC);
    END IF;

    IF to_regclass('public.material_requisitions') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_material_req_hotel_status_created ON public.material_requisitions (hotel_id, status, created_at DESC);
    END IF;

    IF to_regclass('public.purchase_orders') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_purchase_orders_hotel_status_created ON public.purchase_orders (hotel_id, status, created_at DESC);
    END IF;

    IF to_regclass('public.staff_users') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_staff_users_hotel_status ON public.staff_users (hotel_id, status);
    END IF;

    IF to_regclass('public.guest_users') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_guest_users_phone ON public.guest_users (phone);
        CREATE INDEX IF NOT EXISTS idx_guest_users_email_lower ON public.guest_users (LOWER(email));
    END IF;
END $$;
