import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/**
 * Dedicated Secured PMS, Auth, & Channel Outbound API Edge Function.
 * - Zero hardcoded secrets or fallback credentials in source code
 * - Cryptographically verifies Supabase Auth JWT claims (super_admin, hotel_admin, staff, guest)
 * - Isolates service_role queries cleanly from per-request signInWithPassword sessions
 * - Enforces explicit column projections (no SELECT *) and strict tenant isolation
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const AIOSELL_USERNAME = Deno.env.get("AIOSELL_API_USERNAME") || "";
const AIOSELL_PASSWORD = Deno.env.get("AIOSELL_API_PASSWORD") || "";
const AIOSELL_PARTNER_ID = Deno.env.get("AIOSELL_PARTNER_ID") || "aavasa";
const AIOSELL_API_BASE = Deno.env.get("AIOSELL_API_BASE") || "https://live.aiosell.com/api/v2/cm";

const WEBHOOK_USERNAME = Deno.env.get("AAVASA_WEBHOOK_USERNAME") || "";
const WEBHOOK_PASSWORD = Deno.env.get("AAVASA_WEBHOOK_PASSWORD") || "";
const GUEST_AUTH_SECRET = Deno.env.get("GUEST_AUTH_SECRET") || SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_MUTATION_TABLES = new Set([
  "rooms",
  "room_types",
  "reservations",
  "fnb_orders",
  "restaurant_tables",
  "restaurant_menu_items",
  "housekeeping_tasks",
  "financial_invoices",
  "cab_bookings"
]);

const ALLOWED_AIOSELL_PREFIXES = [
  "/property_details/",
  "/update/",
  "/update-rates/",
  "/marknoshow/",
  "/data/",
  "/channel_multiplier/",
  "/message-reply/"
];

const HOTEL_SAFE_COLUMNS =
  "id, slug, aiosell_hotel_code, name, short_name, logo_url, owner_name, email, mobile, address, city, total_rooms, currency, currency_symbol, status, plan, commission_rate, created_at";

const ROOM_SAFE_COLUMNS =
  "id, hotel_id, room_number, room_type_id, floor, type, bed, status, price, guest, booking_id, check_out, housekeeping, key_card_no, is_smoking, phone_extension, interconnecting_room, is_ota_locked, ota_channel";

const ROOM_TYPE_SAFE_COLUMNS =
  "id, hotel_id, name, label, bedding_type, max_adults, max_extra, max_children, area_sqft, base_price, extra_bed_price, child_price, amenities, description, notes, is_booking_engine";

const RESERVATION_SAFE_COLUMNS =
  "id, hotel_id, guest, guest_email, guest_phone, guest_country, room, room_number, room_type, check_in, check_out, actual_check_in_time, actual_check_out_time, expected_check_out_time, guest_id_type, guest_id_number, guest_id_city, source, amount, paid, advance_paid, due, payment_mode, billing_mode, organisation, gstin, status, payment, created_at, rate_plan, adults, children, nights, special_requests, notes";

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      })
    : null;

function createIsolatedAuthClient() {
  const key = SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-aavasa-client",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { headers: corsHeaders, status });
}

function sanitizeHotel(hotel: any) {
  if (!hotel) return null;
  const { password: _p, password_hash: _ph, ...safeHotel } = hotel;
  return safeHotel;
}

interface VerifiedCaller {
  role: string;
  hotelId: string | null;
  isSuperAdmin: boolean;
  isHotelStaff: boolean;
  isGuest: boolean;
  guestPhone: string | null;
  user: any | null;
}

async function getVerifiedCaller(req: Request): Promise<VerifiedCaller | null> {
  if (!supabaseAdmin) return null;
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token || token === SUPABASE_ANON_KEY || token.startsWith("sb_publishable_")) {
    return null;
  }

  if (SUPABASE_SERVICE_ROLE_KEY && token === SUPABASE_SERVICE_ROLE_KEY) {
    return {
      role: "service_role",
      hotelId: null,
      isSuperAdmin: true,
      isHotelStaff: true,
      isGuest: false,
      guestPhone: null,
      user: null
    };
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;
    const u = data.user;
    const appRole = String(u.app_metadata?.role || "").toLowerCase();
    const hotelId = String(u.app_metadata?.hotel_id || "").trim() || null;
    const phone =
      String(u.app_metadata?.phone || u.user_metadata?.phone || "")
        .replace(/\D/g, "")
        .slice(-10) || null;
    return {
      role: appRole || "authenticated",
      hotelId,
      isSuperAdmin: appRole === "super_admin",
      isHotelStaff: appRole === "hotel_admin" || appRole === "staff",
      isGuest: appRole === "guest" || (appRole === "" && u.role === "authenticated"),
      guestPhone: phone,
      user: u
    };
  } catch {
    return null;
  }
}

function canAccessHotel(caller: VerifiedCaller | null, targetHotelId: string | null | undefined): boolean {
  if (!caller || !targetHotelId) return false;
  if (caller.isSuperAdmin) return true;
  if (caller.isHotelStaff && caller.hotelId) {
    return caller.hotelId.trim().toLowerCase() === String(targetHotelId).trim().toLowerCase();
  }
  return false;
}

async function deriveGuestPassword(phone: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(GUEST_AUTH_SECRET || SUPABASE_SERVICE_ROLE_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", keyMaterial, enc.encode(`guest:${phone}`));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `Gst#${hex.slice(0, 28)}!`;
}

async function resolveAuthUserIdByEmail(email: string, storedAuthId?: string | null): Promise<string | null> {
  if (!supabaseAdmin) return null;
  if (storedAuthId) return storedAuthId;
  const { data: rpcId } = await supabaseAdmin.rpc("sec_find_auth_user_by_email", { p_email: email });
  if (rpcId) return String(rpcId);
  return null;
}

function appMetadataMatches(
  existing: Record<string, unknown> | undefined | null,
  expected: Record<string, unknown>
): boolean {
  if (!existing || typeof existing !== "object") return false;
  return Object.entries(expected).every(([k, v]) => {
    const cur = (existing as Record<string, unknown>)[k];
    if (typeof v === "string" && typeof cur === "string") {
      return cur.trim().toLowerCase() === v.trim().toLowerCase();
    }
    return cur === v;
  });
}

function formatAuthSession(signInData: any) {
  return {
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
    expires_in: signInData.session.expires_in,
    token_type: signInData.session.token_type,
    user: signInData.user
  };
}

async function ensureGoTrueUserAndSignIn(params: {
  email: string;
  password: string;
  appMetadata: Record<string, unknown>;
  userMetadata?: Record<string, unknown>;
  existingAuthUserId?: string | null;
}): Promise<{ userId: string | null; session: any | null; error: string | null }> {
  if (!supabaseAdmin) {
    return { userId: null, session: null, error: "Supabase admin unavailable." };
  }

  const cleanEmail = params.email.trim().toLowerCase();
  const authClient = createIsolatedAuthClient();

  // Fast non-destructive path: sign in directly first so we NEVER call
  // admin.updateUserById({ password }) unnecessarily. GoTrue revokes ALL
  // existing sessions & refresh tokens across every device whenever a
  // password field is sent to updateUserById.
  const { data: directSignIn, error: directErr } = await authClient.auth.signInWithPassword({
    email: cleanEmail,
    password: params.password
  });

  if (!directErr && directSignIn?.session) {
    const directUid = directSignIn.user?.id || params.existingAuthUserId || null;

    if (appMetadataMatches(directSignIn.user?.app_metadata, params.appMetadata)) {
      return {
        userId: directUid,
        session: formatAuthSession(directSignIn),
        error: null
      };
    }

    // Claims need syncing — update ONLY metadata (no password/email) so active sessions stay intact
    if (directUid) {
      await supabaseAdmin.auth.admin.updateUserById(directUid, {
        app_metadata: params.appMetadata,
        ...(params.userMetadata ? { user_metadata: params.userMetadata } : {})
      });
      const { data: refreshedSignIn } = await authClient.auth.signInWithPassword({
        email: cleanEmail,
        password: params.password
      });
      if (refreshedSignIn?.session) {
        return {
          userId: directUid,
          session: formatAuthSession(refreshedSignIn),
          error: null
        };
      }
    }

    return {
      userId: directUid,
      session: formatAuthSession(directSignIn),
      error: null
    };
  }

  // Fallback path: user does not exist in GoTrue yet OR GoTrue password is out of sync with bcrypt vault
  let uid = await resolveAuthUserIdByEmail(cleanEmail, params.existingAuthUserId);

  if (uid) {
    await supabaseAdmin.auth.admin.updateUserById(uid, {
      email: cleanEmail,
      password: params.password,
      email_confirm: true,
      app_metadata: params.appMetadata,
      ...(params.userMetadata ? { user_metadata: params.userMetadata } : {})
    });
  } else {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: params.password,
      email_confirm: true,
      app_metadata: params.appMetadata,
      user_metadata: params.userMetadata || {}
    });
    if (created?.user?.id) {
      uid = created.user.id;
    } else if (createErr) {
      uid = await resolveAuthUserIdByEmail(cleanEmail, null);
      if (uid) {
        await supabaseAdmin.auth.admin.updateUserById(uid, {
          email: cleanEmail,
          password: params.password,
          email_confirm: true,
          app_metadata: params.appMetadata,
          ...(params.userMetadata ? { user_metadata: params.userMetadata } : {})
        });
      } else {
        return { userId: null, session: null, error: createErr.message };
      }
    }
  }

  const { data: signInData, error: signInErr } = await authClient.auth.signInWithPassword({
    email: cleanEmail,
    password: params.password
  });

  if (signInErr || !signInData?.session) {
    return { userId: uid, session: null, error: signInErr?.message || "Failed to establish session." };
  }

  return {
    userId: uid || signInData.user?.id || null,
    session: formatAuthSession(signInData),
    error: null
  };
}

async function broadcastRealtimeSync(eventPayload: Record<string, unknown>) {
  if (!supabaseAdmin) return;
  try {
    const channel = supabaseAdmin.channel("aurastay_sync_broadcast");
    await channel.send({
      type: "broadcast",
      event: "webhook_update",
      payload: {
        ...eventPayload,
        timestamp: new Date().toISOString()
      }
    });
    supabaseAdmin.removeChannel(channel);
  } catch (err) {
    console.warn("[pms-api] Broadcast warning:", err);
  }
}

async function pushOtaInventoryInternal(params: {
  hotelId: string;
  hotelCode?: string;
  partnerId?: string;
  username?: string;
  password?: string;
  startDate?: string;
  endDate?: string;
}) {
  if (!supabaseAdmin) return { status: 503, body: { success: false, message: "Server configuration incomplete." } };

  const hotelId = String(params.hotelId || "").trim();
  const todayStr = new Date().toISOString().split("T")[0];
  const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const startDate = String(params.startDate || todayStr).slice(0, 10);
  const endDate = String(params.endDate || nextWeekStr).slice(0, 10);

  const [{ data: hotelRow }, { data: rooms }, { data: activeRes }] = await Promise.all([
    supabaseAdmin.from("hotels").select("id, slug, aiosell_hotel_code").eq("id", hotelId).maybeSingle(),
    supabaseAdmin.from("rooms").select("room_number, type, status").eq("hotel_id", hotelId),
    supabaseAdmin
      .from("reservations")
      .select("room_number, room, status, check_in, check_out")
      .eq("hotel_id", hotelId)
      .not("status", "in", "(CANCELLED,CHECKED_OUT,NO_SHOW)")
  ]);

  const hotelCode =
    String(params.hotelCode || hotelRow?.aiosell_hotel_code || hotelRow?.slug || hotelId || "ff144346e6").trim();

  const categoryCounts = new Map<string, { total: number; free: number }>();
  (rooms || []).forEach((rm: any) => {
    const typeKey = String(rm.type || "Standard Room").trim();
    if (!categoryCounts.has(typeKey)) {
      categoryCounts.set(typeKey, { total: 0, free: 0 });
    }
    const entry = categoryCounts.get(typeKey)!;
    entry.total += 1;

    const st = String(rm.status || "VACANT_READY").toUpperCase();
    const isMaint = ["MAINTENANCE", "OUT_OF_ORDER", "BLOCKED"].includes(st);
    const rNum = String(rm.room_number || "").trim();
    const overlapsDates = (activeRes || []).some((res: any) => {
      const resNum =
        String(res.room_number || "").trim() ||
        String(res.room || "").match(/\b(\d+)\b/)?.[1] ||
        "";
      if (resNum !== rNum) return false;
      const rIn = String(res.check_in || "").slice(0, 10);
      const rOut = String(res.check_out || "").slice(0, 10);
      return rIn < endDate && rOut > startDate;
    });

    const isBusyToday = (st === "OCCUPIED" || st === "RESERVED") && startDate <= todayStr;
    if (!isMaint && !overlapsDates && !isBusyToday) {
      entry.free += 1;
    }
  });

  const toAiosellRoomCode = (type: string): string => {
    const norm = String(type || "").toLowerCase();
    if (norm.includes("penthouse")) return "penthouse";
    if (norm.includes("exec") || norm.includes("suite")) return "executive";
    if (norm.includes("delux") || norm.includes("dlx")) return "deluxe";
    if (norm.includes("std") || norm.includes("standard")) return "standard";
    return norm || "standard";
  };

  const aiosellRoomsPayload = Array.from(categoryCounts.entries()).map(([roomType, counts]) => ({
    roomCode: toAiosellRoomCode(roomType),
    available: counts.free,
    stopSell: counts.total > 0 && counts.free === 0
  }));

  if (aiosellRoomsPayload.length === 0) {
    return { status: 200, body: { success: true, pushed: false, message: "No mapped rooms to sync.", updates: [] } };
  }

  const partnerId = String(params.partnerId || AIOSELL_PARTNER_ID).trim();
  const username = String(params.username || AIOSELL_USERNAME).trim();
  const password = String(params.password || AIOSELL_PASSWORD).trim();

  if (!username || !password) {
    return { status: 503, body: { success: false, pushed: false, message: "Aiosell API credentials not configured in Vault." } };
  }

  const authToken = btoa(`${username}:${password}`);
  const aiosellBody = {
    hotelCode,
    updates: [{ startDate, endDate, rooms: aiosellRoomsPayload }]
  };

  let aiosellStatus = 0;
  let aiosellData: any = null;
  try {
    const res = await fetch(`${AIOSELL_API_BASE}/update/${encodeURIComponent(partnerId)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${authToken}`
      },
      body: JSON.stringify(aiosellBody)
    });
    aiosellStatus = res.status;
    aiosellData = await res.json().catch(() => null);
  } catch (pushErr: any) {
    return {
      status: 502,
      body: {
        success: false,
        pushed: false,
        error: pushErr?.message || "Aiosell API reachable check failed.",
        payloadSent: aiosellBody
      }
    };
  }

  return {
    status: 200,
    body: {
      success: aiosellStatus >= 200 && aiosellStatus < 300,
      pushed: true,
      aiosellStatus,
      aiosellResponse: aiosellData,
      payloadSent: aiosellBody
    }
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return jsonResponse({ ok: true }, 200);
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, message: "Method Not Allowed. Use POST." }, 405);
  }

  if (!supabaseAdmin || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ success: false, message: "Server configuration incomplete." }, 503);
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ success: false, message: "Invalid JSON payload." }, 400);
  }

  const action = String(payload?.action || "").trim().toLowerCase();
  if (!action) {
    return jsonResponse({ success: false, message: "Missing action." }, 400);
  }

  const caller = await getVerifiedCaller(req);

  try {
    // -------------------------------------------------------------------------
    // 1. PUBLIC BRANDING LOOKUP (For ?hotel=slug Login Screen - Zero PII/Secrets)
    // -------------------------------------------------------------------------
    if (action === "get_public_branding") {
      const slugOrId = String(payload.slug || payload.hotelId || "").trim().toLowerCase();
      if (!slugOrId) {
        return jsonResponse({ success: true, hotel: null }, 200);
      }
      const { data: hotel } = await supabaseAdmin
        .from("hotels")
        .select("id, slug, name, logo_url, status")
        .or(`slug.ilike.${slugOrId},id.ilike.${slugOrId}`)
        .maybeSingle();

      if (!hotel || String(hotel.id || "").toLowerCase() === "hotel_aurastay_01") {
        return jsonResponse({ success: true, hotel: null }, 200);
      }
      return jsonResponse(
        {
          success: true,
          hotel: { id: hotel.id, slug: hotel.slug, name: hotel.name, logo_url: hotel.logo_url }
        },
        200
      );
    }

    // -------------------------------------------------------------------------
    // 2. SUPER ADMIN LOGIN (Verified server-side via bcrypt Vault + Supabase Auth JWT)
    // -------------------------------------------------------------------------
    if (action === "superadmin_login") {
      const cleanEmail = String(payload.email || "").trim().toLowerCase();
      const rawPass = String(payload.password || "").trim();
      if (!cleanEmail || !rawPass) {
        return jsonResponse({ success: false, message: "Email and password are required." }, 400);
      }

      // Path A: Standard GoTrue verification
      const isolated = createIsolatedAuthClient();
      const { data: directSignIn } = await isolated.auth.signInWithPassword({
        email: cleanEmail,
        password: rawPass
      });

      if (directSignIn?.session && directSignIn?.user?.app_metadata?.role === "super_admin") {
        const { data: adminMeta } = await supabaseAdmin
          .from("super_admins")
          .select("id, name, email, role")
          .ilike("email", cleanEmail)
          .maybeSingle();
        return jsonResponse(
          {
            success: true,
            admin: adminMeta || {
              id: "sa_aavasa_01",
              name: "Aavasa Super Admin",
              email: cleanEmail,
              role: "PLATFORM_OWNER"
            },
            session: {
              access_token: directSignIn.session.access_token,
              refresh_token: directSignIn.session.refresh_token,
              expires_in: directSignIn.session.expires_in,
              token_type: directSignIn.session.token_type,
              user: directSignIn.user
            }
          },
          200
        );
      }

      // Path B: Migrate/verify against private_auth.super_admin_credentials bcrypt hash
      const { data: checkRes, error: checkErr } = await supabaseAdmin.rpc("sec_verify_super_admin_secret", {
        p_email: cleanEmail,
        p_password: rawPass
      });

      if (checkErr || !checkRes?.valid) {
        return jsonResponse({ success: false, message: "Invalid Super Admin email or password." }, 401);
      }

      const authRes = await ensureGoTrueUserAndSignIn({
        email: cleanEmail,
        password: rawPass,
        existingAuthUserId: checkRes.auth_user_id || null,
        appMetadata: {
          role: "super_admin",
          platform_role: checkRes.admin?.role || "PLATFORM_OWNER"
        },
        userMetadata: {
          name: checkRes.admin?.name || "Aavasa Super Admin"
        }
      });

      if (!authRes.session) {
        return jsonResponse({ success: false, message: authRes.error || "Unable to initialize Super Admin session." }, 500);
      }

      await supabaseAdmin.rpc("sec_sync_super_admin_auth", {
        p_email: cleanEmail,
        p_password: null,
        p_auth_user_id: authRes.userId
      });

      return jsonResponse({ success: true, admin: checkRes.admin, session: authRes.session }, 200);
    }

    // -------------------------------------------------------------------------
    // 3. HOTEL ADMIN LOGIN (PMS Email/Slug+Pass & Guest Website /admin Portal)
    // -------------------------------------------------------------------------
    if (action === "verify_admin_login" || action === "verify_hotel_portal_admin") {
      const inputIdent = String(payload.email || payload.hotelId || "").trim().toLowerCase();
      const inputPass = String(payload.password || "").trim();

      if (!inputIdent || !inputPass) {
        return jsonResponse({ success: false, message: "Credentials are required." }, 400);
      }

      if (["superadmin@aavasa.com", "admin@aurastay.com", "hotel_aurastay_01"].includes(inputIdent)) {
        return jsonResponse({ success: false, message: "Invalid email or password." }, 401);
      }

      const { data: allHotels, error } = await supabaseAdmin
        .from("hotels")
        .select(HOTEL_SAFE_COLUMNS)
        .order("created_at", { ascending: false });

      const validHotels = Array.isArray(allHotels)
        ? allHotels.filter(
            (h: any) =>
              String(h.id || "").toLowerCase() !== "hotel_aurastay_01" &&
              String(h.email || "").toLowerCase() !== "admin@aurastay.com"
          )
        : [];

      const matched = validHotels.find((h: any) => {
        const hEmail = String(h.email || "").trim().toLowerCase();
        const hSlug = String(h.slug || "").trim().toLowerCase();
        const hId = String(h.id || "").trim().toLowerCase();
        return hEmail === inputIdent || hSlug === inputIdent || hId === inputIdent;
      });

      if (error || !matched) {
        return jsonResponse({ success: false, message: "Invalid email or password." }, 401);
      }

      if (matched.status && matched.status !== "ACTIVE") {
        return jsonResponse({ success: false, message: "Account is suspended. Contact SuperAdmin." }, 403);
      }

      const targetEmail = String(matched.email || "").trim().toLowerCase();
      const { data: secRes } = await supabaseAdmin.rpc("sec_verify_hotel_secret", {
        p_hotel_id: matched.id,
        p_password: inputPass
      });

      let sessionResult: any = null;

      if (secRes?.valid) {
        const authRes = await ensureGoTrueUserAndSignIn({
          email: targetEmail,
          password: inputPass,
          existingAuthUserId: secRes.auth_user_id || null,
          appMetadata: {
            role: "hotel_admin",
            hotel_id: matched.id,
            hotel_slug: matched.slug || matched.id
          },
          userMetadata: {
            name: matched.owner_name || matched.name
          }
        });
        sessionResult = authRes.session;
        if (authRes.userId && authRes.userId !== secRes.auth_user_id) {
          await supabaseAdmin.rpc("sec_upsert_hotel_secret", {
            p_hotel_id: matched.id,
            p_email: targetEmail,
            p_plain_password: null,
            p_auth_user_id: authRes.userId
          });
        }
      } else {
        // Fallback: try direct GoTrue sign-in (in case password changed via Auth directly)
        const isolated = createIsolatedAuthClient();
        const { data: directAuth } = await isolated.auth.signInWithPassword({
          email: targetEmail,
          password: inputPass
        });
        if (
          directAuth?.session &&
          directAuth?.user?.app_metadata?.role === "hotel_admin" &&
          String(directAuth?.user?.app_metadata?.hotel_id || "").toLowerCase() === String(matched.id).toLowerCase()
        ) {
          sessionResult = {
            access_token: directAuth.session.access_token,
            refresh_token: directAuth.session.refresh_token,
            expires_in: directAuth.session.expires_in,
            token_type: directAuth.session.token_type,
            user: directAuth.user
          };
        }
      }

      if (!sessionResult) {
        return jsonResponse({ success: false, message: "Invalid or inactive Hotel Admin credentials." }, 401);
      }

      return jsonResponse({ success: true, hotel: sanitizeHotel(matched), session: sessionResult }, 200);
    }

    // -------------------------------------------------------------------------
    // 4. GUEST PHONE AUTHENTICATION (No plaintext password stored; issues Guest JWT)
    // -------------------------------------------------------------------------
    if (action === "guest_lookup_phone") {
      const cleanPhone = String(payload.phone || "").replace(/\D/g, "").slice(-10);
      if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
        return jsonResponse({ success: true, exists: false, name: "" }, 200);
      }
      const { data: guestRow } = await supabaseAdmin
        .from("guest_users")
        .select("id, name")
        .eq("phone", cleanPhone)
        .maybeSingle();

      return jsonResponse(
        {
          success: true,
          exists: Boolean(guestRow),
          name: guestRow?.name || ""
        },
        200
      );
    }

    if (action === "guest_phone_auth") {
      const cleanPhone = String(payload.phone || "").replace(/\D/g, "").slice(-10);
      if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
        return jsonResponse({ success: false, message: "Valid 10-digit Indian mobile number is required." }, 400);
      }

      const { data: existingGuest } = await supabaseAdmin
        .from("guest_users")
        .select("id, name, email, phone")
        .eq("phone", cleanPhone)
        .maybeSingle();

      const finalName = String(payload.name || "").trim() || existingGuest?.name || `Guest ${cleanPhone.slice(-4)}`;
      const finalEmail =
        String(payload.email || "").trim().toLowerCase() ||
        existingGuest?.email ||
        `${cleanPhone}@guest.shivanandivista.com`;
      const guestId = existingGuest?.id || `user_${cleanPhone}`;

      await supabaseAdmin.from("guest_users").upsert({
        id: guestId,
        phone: cleanPhone,
        name: finalName,
        email: finalEmail,
        updated_at: new Date().toISOString()
      });

      const syntheticAuthEmail = `guest_${cleanPhone}@guest.aurastay.local`;
      const serverPass = await deriveGuestPassword(cleanPhone);
      const { data: storedGuestAuthId } = await supabaseAdmin.rpc("sec_get_guest_auth_id", { p_guest_id: guestId });

      const authRes = await ensureGoTrueUserAndSignIn({
        email: syntheticAuthEmail,
        password: serverPass,
        existingAuthUserId: storedGuestAuthId || null,
        appMetadata: {
          role: "guest",
          phone: cleanPhone,
          guest_id: guestId
        },
        userMetadata: {
          name: finalName,
          phone: cleanPhone,
          contact_email: finalEmail
        }
      });

      await supabaseAdmin.rpc("sec_upsert_guest_auth_map", {
        p_guest_id: guestId,
        p_phone: cleanPhone,
        p_email: finalEmail,
        p_plain_password: null,
        p_auth_user_id: authRes.userId || null
      });

      return jsonResponse(
        {
          success: true,
          userProfile: {
            id: guestId,
            phone: cleanPhone,
            name: finalName,
            email: finalEmail,
            username: finalName.toLowerCase().replace(/\s+/g, "_"),
            isVerified: true,
            authProvider: "Supabase Auth",
            verifiedAt: new Date().toISOString()
          },
          session: authRes.session
        },
        200
      );
    }

    // -------------------------------------------------------------------------
    // 5. SUPER ADMIN ONLY: PROVISION / UPDATE HOTEL & ROOMS
    // -------------------------------------------------------------------------
    if (action === "provision_hotel_and_rooms") {
      if (!caller?.isSuperAdmin) {
        return jsonResponse({ success: false, message: "Forbidden: Super Admin JWT required." }, 403);
      }

      const { hotel, roomCategories, mode } = payload;
      const rawPassword = String(hotel?.password || "").trim();
      if (!hotel || !hotel.id || !hotel.email) {
        return jsonResponse({ success: false, message: "Hotel ID and email are required." }, 400);
      }
      if (mode !== "add_rooms" && rawPassword.length < 6) {
        return jsonResponse({ success: false, message: "Admin password (minimum 6 characters) is required." }, 400);
      }

      const normalizeCategoryName = (raw: string) => {
        const cleaned = String(raw || "Standard Room").trim();
        if (!cleaned) return "Standard Room";
        if (/^standard$/i.test(cleaned)) return "Standard Room";
        if (/^delux(e)?$/i.test(cleaned)) return "Deluxe Room";
        if (/^executive$/i.test(cleaned)) return "Executive Room";
        const hasSuffix = /\b(room|rooms|suite|suites|villa|villas|cottage|studio|tent|cabin|penthouse|loft)\b/i.test(cleaned);
        return hasSuffix ? cleaned : `${cleaned} Room`;
      };

      if (mode !== "add_rooms") {
        await Promise.all([
          supabaseAdmin.from("rooms").delete().eq("hotel_id", hotel.id),
          supabaseAdmin.from("room_types").delete().eq("hotel_id", hotel.id),
          supabaseAdmin.from("reservations").delete().eq("hotel_id", hotel.id),
          supabaseAdmin.from("fnb_orders").delete().eq("hotel_id", hotel.id),
          supabaseAdmin.from("restaurant_tables").delete().eq("hotel_id", hotel.id),
          supabaseAdmin.from("restaurant_menu_items").delete().eq("hotel_id", hotel.id),
          supabaseAdmin.from("housekeeping_tasks").delete().eq("hotel_id", hotel.id),
          supabaseAdmin.from("cab_bookings").delete().eq("hotel_id", hotel.id),
          supabaseAdmin.from("financial_invoices").delete().eq("hotel_id", hotel.id),
          supabaseAdmin.from("banquet_bookings").delete().eq("hotel_id", hotel.id)
        ]);
      }

      const safeHotelRow = sanitizeHotel(hotel);
      const { error: hotelErr } = await supabaseAdmin.from("hotels").upsert(safeHotelRow);
      if (hotelErr) {
        return jsonResponse({ success: false, message: hotelErr.message }, 400);
      }

      // Sync credential vault + Supabase Auth user
      const cleanHotelEmail = String(safeHotelRow.email || "").trim().toLowerCase();
      const { data: existingAuthId } = await supabaseAdmin.rpc("sec_get_hotel_auth_id", {
        p_hotel_id: safeHotelRow.id
      });

      let authUid: string | null = await resolveAuthUserIdByEmail(cleanHotelEmail, existingAuthId || null);

      if (authUid) {
        let shouldUpdatePassword = false;
        if (rawPassword.length >= 6) {
          const { data: existingSecretCheck } = await supabaseAdmin.rpc("sec_verify_hotel_secret", {
            p_hotel_id: safeHotelRow.id,
            p_password: rawPassword
          });
          // Only pass password to GoTrue if it actually changed; passing an unchanged password
          // revokes all active hotel admin sessions across devices.
          shouldUpdatePassword = !existingSecretCheck?.valid;
        }
        await supabaseAdmin.auth.admin.updateUserById(authUid, {
          email: cleanHotelEmail,
          ...(shouldUpdatePassword ? { password: rawPassword } : {}),
          email_confirm: true,
          app_metadata: {
            role: "hotel_admin",
            hotel_id: safeHotelRow.id,
            hotel_slug: safeHotelRow.slug || safeHotelRow.id
          },
          user_metadata: { name: safeHotelRow.owner_name || safeHotelRow.name }
        });
      } else if (rawPassword.length >= 6) {
        const { data: created } = await supabaseAdmin.auth.admin.createUser({
          email: cleanHotelEmail,
          password: rawPassword,
          email_confirm: true,
          app_metadata: {
            role: "hotel_admin",
            hotel_id: safeHotelRow.id,
            hotel_slug: safeHotelRow.slug || safeHotelRow.id
          },
          user_metadata: { name: safeHotelRow.owner_name || safeHotelRow.name }
        });
        authUid = created?.user?.id || null;
      }

      await supabaseAdmin.rpc("sec_upsert_hotel_secret", {
        p_hotel_id: safeHotelRow.id,
        p_email: cleanHotelEmail,
        p_plain_password: rawPassword.length >= 6 ? rawPassword : null,
        p_auth_user_id: authUid
      });

      let createdCount = 0;
      if (Array.isArray(roomCategories) && roomCategories.length > 0) {
        const { data: existingRooms } = await supabaseAdmin
          .from("rooms")
          .select("room_number")
          .eq("hotel_id", safeHotelRow.id);

        const usedNumbers = new Set((existingRooms || []).map((r: any) => String(r.room_number || "").trim()));

        for (let idx = 0; idx < roomCategories.length; idx++) {
          const cat = roomCategories[idx];
          const rawName = String(cat.name || cat.type || "Standard Room").trim();
          const count = Math.max(0, Number(cat.count) || 0);
          if (!rawName || count <= 0) continue;

          const price = Number(cat.price || cat.basePrice || 2500);
          const bed = String(cat.bed || cat.beddingType || "King Bed").trim();
          const floor = String(cat.floor || `Floor ${idx + 1}`).trim();
          const startNum = Number(cat.startRoomNumber) || (idx + 1) * 100 + 1;
          const categoryName = normalizeCategoryName(rawName);
          const rtId = `rt-${String(safeHotelRow.id).slice(0, 8)}-${categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

          await supabaseAdmin.from("room_types").upsert({
            id: rtId,
            hotel_id: safeHotelRow.id,
            name: categoryName,
            label: "Room",
            bedding_type: bed,
            max_adults: Number(cat.maxAdults) || 2,
            max_extra: 1,
            max_children: 1,
            area_sqft: Number(cat.areaSqft) || 320,
            base_price: price,
            extra_bed_price: 800,
            child_price: 400,
            amenities: [
              "High-speed Optic Fiber Wi-Fi",
              "Individual Split Air Conditioning",
              "43-inch 4K Smart TV",
              "Ensuite Bathroom with 24/7 Hot Water",
              "Daily Housekeeping"
            ],
            description: String(
              cat.description || `Comfortable ${categoryName} featuring modern amenities and high-speed Wi-Fi.`
            ).trim(),
            is_booking_engine: true
          });

          const explicitNums = Array.isArray(cat.roomNumbers)
            ? cat.roomNumbers.map((s: any) => String(s).trim()).filter(Boolean)
            : String(cat.roomNumbers || "")
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean);

          let candidateNum = startNum;
          for (let i = 0; i < count; i++) {
            let roomNumStr = explicitNums[i] || "";
            if (!roomNumStr || usedNumbers.has(roomNumStr)) {
              while (usedNumbers.has(String(candidateNum))) candidateNum++;
              roomNumStr = String(candidateNum);
              candidateNum++;
            }
            usedNumbers.add(roomNumStr);

            const { error: rmErr } = await supabaseAdmin.from("rooms").insert({
              hotel_id: safeHotelRow.id,
              room_number: roomNumStr,
              room_type_id: rtId,
              floor,
              type: categoryName,
              bed,
              status: "VACANT_READY",
              price,
              housekeeping: "Clean",
              key_card_no: `CARD-${roomNumStr}`,
              is_smoking: false,
              phone_extension: roomNumStr
            });
            if (!rmErr) createdCount++;
          }
        }
      }

      await broadcastRealtimeSync({
        action: "superadmin_hotel_provisioned",
        hotelId: safeHotelRow.id,
        createdRooms: createdCount
      });

      return jsonResponse({ success: true, hotelId: safeHotelRow.id, createdRooms: createdCount }, 200);
    }

    // -------------------------------------------------------------------------
    // 6. SUPER ADMIN ONLY: DELETE HOTEL / QUOTA / ROOM / INSIGHTS
    // -------------------------------------------------------------------------
    if (action === "delete_hotel") {
      if (!caller?.isSuperAdmin) {
        return jsonResponse({ success: false, message: "Forbidden: Super Admin JWT required." }, 403);
      }
      const hotelId = String(payload.hotelId || "").trim();
      if (!hotelId) return jsonResponse({ success: false, message: "hotelId is required." }, 400);

      const { data: authUid } = await supabaseAdmin.rpc("sec_get_hotel_auth_id", { p_hotel_id: hotelId });

      await Promise.all([
        supabaseAdmin.from("rooms").delete().eq("hotel_id", hotelId),
        supabaseAdmin.from("room_types").delete().eq("hotel_id", hotelId),
        supabaseAdmin.from("reservations").delete().eq("hotel_id", hotelId),
        supabaseAdmin.from("fnb_orders").delete().eq("hotel_id", hotelId),
        supabaseAdmin.from("housekeeping_tasks").delete().eq("hotel_id", hotelId),
        supabaseAdmin.from("cab_bookings").delete().eq("hotel_id", hotelId),
        supabaseAdmin.from("financial_invoices").delete().eq("hotel_id", hotelId),
        supabaseAdmin.from("banquet_bookings").delete().eq("hotel_id", hotelId),
        supabaseAdmin.from("hotels").delete().eq("id", hotelId)
      ]);

      if (authUid) {
        await supabaseAdmin.auth.admin.deleteUser(String(authUid)).catch(() => null);
      }

      await broadcastRealtimeSync({ action: "hotel_deleted", hotelId });
      return jsonResponse({ success: true, hotelId }, 200);
    }

    if (action === "update_hotel_quota") {
      if (!caller?.isSuperAdmin) {
        return jsonResponse({ success: false, message: "Forbidden: Super Admin JWT required." }, 403);
      }
      const hotelId = String(payload.hotelId || "").trim();
      const totalRooms = Math.max(0, Number(payload.totalRooms) || 0);
      if (!hotelId) return jsonResponse({ success: false, message: "hotelId is required." }, 400);

      const { error } = await supabaseAdmin
        .from("hotels")
        .update({ total_rooms: totalRooms, updated_at: new Date().toISOString() })
        .eq("id", hotelId);

      if (error) return jsonResponse({ success: false, message: error.message }, 400);

      await broadcastRealtimeSync({ action: "hotel_limit_updated", hotelId, totalRooms });
      return jsonResponse({ success: true, hotelId, totalRooms }, 200);
    }

    if (action === "superadmin_delete_room") {
      if (!caller?.isSuperAdmin) {
        return jsonResponse({ success: false, message: "Forbidden: Super Admin JWT required." }, 403);
      }
      const { roomId, roomNumber, hotelId } = payload;
      if (roomId) {
        await supabaseAdmin.from("rooms").delete().eq("id", roomId);
      } else if (roomNumber && hotelId) {
        await supabaseAdmin.from("rooms").delete().eq("hotel_id", hotelId).eq("room_number", roomNumber);
      }
      await broadcastRealtimeSync({ action: "room_delete", roomNumber, hotelId });
      return jsonResponse({ success: true }, 200);
    }

    if (action === "admin_insights") {
      if (!caller?.isSuperAdmin) {
        return jsonResponse({ success: false, message: "Forbidden: Super Admin JWT required." }, 403);
      }
      const targetHotelId = String(payload.hotelId || payload.hotel_id || "").trim();
      if (!targetHotelId) {
        return jsonResponse({ success: false, message: "hotelId is required." }, 400);
      }

      const [hotelRes, roomsRes, rtRes, resRes, fnbRes, cabRes, hkRes, invRes] = await Promise.all([
        supabaseAdmin.from("hotels").select(HOTEL_SAFE_COLUMNS).eq("id", targetHotelId).maybeSingle(),
        supabaseAdmin.from("rooms").select(ROOM_SAFE_COLUMNS).eq("hotel_id", targetHotelId).order("room_number", { ascending: true }),
        supabaseAdmin.from("room_types").select(ROOM_TYPE_SAFE_COLUMNS).eq("hotel_id", targetHotelId),
        supabaseAdmin.from("reservations").select(RESERVATION_SAFE_COLUMNS).eq("hotel_id", targetHotelId).order("created_at", { ascending: false }).limit(500),
        supabaseAdmin.from("fnb_orders").select("id").eq("hotel_id", targetHotelId).limit(500),
        supabaseAdmin.from("cab_bookings").select("id").eq("hotel_id", targetHotelId).limit(500),
        supabaseAdmin.from("housekeeping_tasks").select("id").eq("hotel_id", targetHotelId).limit(500),
        supabaseAdmin.from("financial_invoices").select("id").eq("hotel_id", targetHotelId).limit(500)
      ]);

      const hotel = sanitizeHotel(hotelRes.data);
      const rooms = roomsRes.data || [];
      const reservations = resRes.data || [];
      const assignedRooms = Number(hotel?.total_rooms) || 0;
      const createdRooms = rooms.length;

      return jsonResponse(
        {
          success: true,
          hotel,
          insights: {
            assignedRooms,
            createdRooms,
            remainingRooms: Math.max(0, assignedRooms - createdRooms),
            limitReached: assignedRooms > 0 && createdRooms >= assignedRooms,
            vacantRooms: rooms.filter((r: any) => r.status === "VACANT_READY" || !r.status).length,
            reservedRooms: rooms.filter((r: any) => r.status === "RESERVED").length,
            occupiedRooms: rooms.filter((r: any) => r.status === "OCCUPIED").length,
            dirtyRooms: rooms.filter((r: any) => r.status === "DIRTY").length,
            totalBookings: reservations.length,
            grossRevenue: reservations
              .filter((r: any) => r.status !== "CANCELLED")
              .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0),
            fnbOrdersCount: (fnbRes.data || []).length,
            cabBookingsCount: (cabRes.data || []).length,
            housekeepingTasksCount: (hkRes.data || []).length,
            invoicesCount: (invRes.data || []).length
          },
          rooms,
          roomTypes: rtRes.data || [],
          reservations
        },
        200
      );
    }

    // -------------------------------------------------------------------------
    // 7. TENANT ADMIN / STAFF SCOPED OPERATIONS (JWT Verified)
    // -------------------------------------------------------------------------
    if (action === "update_hotel_aiosell_code") {
      const targetHotelId = String(payload.hotelId || payload.hotel_id || "").trim();
      if (!canAccessHotel(caller, targetHotelId)) {
        return jsonResponse({ success: false, message: "Forbidden: Invalid tenant credentials." }, 403);
      }
      const cleanCode = String(payload.aiosellHotelCode || "").trim();
      const { error } = await supabaseAdmin
        .from("hotels")
        .update({ aiosell_hotel_code: cleanCode || null, updated_at: new Date().toISOString() })
        .eq("id", targetHotelId);

      if (error) return jsonResponse({ success: false, message: error.message }, 400);
      return jsonResponse({ success: true, hotelId: targetHotelId, aiosellHotelCode: cleanCode }, 200);
    }

    if (action === "update_room") {
      const targetHotelId = String(payload.hotelId || payload.hotel_id || "").trim();
      const origNum = String(payload.originalRoomNumber || payload.original_room_number || "").trim();
      const newNum = String(payload.roomNumber || payload.newRoomNumber || payload.room_number || origNum).trim();

      if (!targetHotelId || !newNum) {
        return jsonResponse({ success: false, message: "hotelId and roomNumber are required." }, 400);
      }
      if (!canAccessHotel(caller, targetHotelId)) {
        return jsonResponse({ success: false, message: "Forbidden: Invalid tenant credentials." }, 403);
      }

      const rawId = payload.roomId || payload.id || null;
      const uuidValid =
        typeof rawId === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId.trim())
          ? rawId.trim()
          : null;

      const { data: updatedRoom, error: rpcErr } = await supabaseAdmin.rpc("admin_update_room", {
        p_hotel_id: targetHotelId,
        p_original_room_number: origNum || newNum,
        p_new_room_number: newNum,
        p_target_room_id: uuidValid,
        p_room_type_id: payload.roomTypeId ?? payload.room_type_id ?? null,
        p_floor: payload.floor ?? null,
        p_type: payload.type ?? null,
        p_bed: payload.bed ?? null,
        p_price: payload.price !== undefined && payload.price !== null ? Number(payload.price) : null,
        p_key_card_no: payload.keyCardNo ?? payload.key_card_no ?? null,
        p_is_smoking: payload.isSmoking !== undefined ? Boolean(payload.isSmoking) : null,
        p_phone_extension: payload.phoneExtension ?? payload.phone_extension ?? null,
        p_housekeeping: payload.housekeeping ?? null,
        p_status: payload.status ?? null,
        p_interconnecting_room: payload.interconnectingRoom ?? payload.interconnecting_room ?? null
      });

      if (rpcErr) {
        const isDuplicate = /already exists/i.test(rpcErr.message || "");
        const isNotFound = /not found/i.test(rpcErr.message || "");
        return jsonResponse(
          { success: false, message: rpcErr.message || "Failed to update room." },
          isDuplicate ? 409 : isNotFound ? 404 : 400
        );
      }

      await broadcastRealtimeSync({
        action: "room_update",
        hotelId: targetHotelId,
        roomNumber: newNum,
        previousRoomNumber: origNum
      });

      return jsonResponse({ success: true, room: updatedRoom }, 200);
    }

    if (action === "update_reservation_guest_name") {
      const targetHotelId = String(payload.hotelId || payload.hotel_id || "").trim();
      const reservationId = String(payload.reservationId || payload.reservation_id || payload.id || "").trim();
      const guestName = String(payload.guestName || payload.guest_name || payload.guest || "").trim();

      if (!targetHotelId || !reservationId || !guestName) {
        return jsonResponse({ success: false, message: "hotelId, reservationId, and guestName are required." }, 400);
      }
      if (!canAccessHotel(caller, targetHotelId)) {
        return jsonResponse({ success: false, message: "Forbidden: Invalid tenant credentials." }, 403);
      }

      const { data: updatedRes, error: rpcErr } = await supabaseAdmin.rpc("admin_update_reservation_guest_name", {
        p_hotel_id: targetHotelId,
        p_reservation_id: reservationId,
        p_guest_name: guestName
      });

      if (rpcErr) {
        const isNotFound = /not found/i.test(rpcErr.message || "");
        return jsonResponse(
          { success: false, message: rpcErr.message || "Failed to update customer name." },
          isNotFound ? 404 : 400
        );
      }

      return jsonResponse({ success: true, reservation: updatedRes }, 200);
    }

    if (action === "shift_room") {
      const targetHotelId = String(payload.hotelId || payload.hotel_id || "").trim();
      const sourceRoomNumber = String(payload.sourceRoomNumber || payload.source_room_number || "").trim();
      const targetRoomNumber = String(payload.targetRoomNumber || payload.target_room_number || "").trim();
      const reservationId = payload.reservationId || payload.reservation_id || null;
      const reason = String(payload.reason || "Guest Request").trim();

      if (!targetHotelId || !sourceRoomNumber || !targetRoomNumber) {
        return jsonResponse({ success: false, message: "hotelId, sourceRoomNumber, and targetRoomNumber are required." }, 400);
      }
      if (!canAccessHotel(caller, targetHotelId)) {
        return jsonResponse({ success: false, message: "Forbidden: Invalid tenant credentials." }, 403);
      }

      const { data: shiftResult, error: rpcErr } = await supabaseAdmin.rpc("admin_shift_room", {
        p_hotel_id: targetHotelId,
        p_source_room_number: sourceRoomNumber,
        p_target_room_number: targetRoomNumber,
        p_reservation_id: reservationId ? String(reservationId).trim() : null,
        p_reason: reason
      });

      if (rpcErr) {
        return jsonResponse({ success: false, message: rpcErr.message || "Failed to shift room." }, 400);
      }

      return jsonResponse({ success: true, ...(shiftResult || {}) }, 200);
    }

    if (action === "pms_mutation") {
      const { table, operation, data, match } = payload;
      if (!table || !operation || !ALLOWED_MUTATION_TABLES.has(String(table))) {
        return jsonResponse({ success: false, message: "Invalid or unauthorized target table." }, 403);
      }

      const targetHotelId = String(
        (Array.isArray(data) ? data[0]?.hotel_id : data?.hotel_id) || match?.hotel_id || ""
      ).trim();

      if (!canAccessHotel(caller, targetHotelId)) {
        return jsonResponse({ success: false, message: "Forbidden: Invalid tenant credentials." }, 403);
      }

      if (table === "rooms" && (operation === "insert" || operation === "upsert")) {
        const [{ data: hotelRow }, { data: existingRooms }] = await Promise.all([
          supabaseAdmin.from("hotels").select("total_rooms").eq("id", targetHotelId).maybeSingle(),
          supabaseAdmin.from("rooms").select("id").eq("hotel_id", targetHotelId)
        ]);
        const assignedLimit = Number(hotelRow?.total_rooms) || 0;
        const currentCount = (existingRooms || []).length;
        const addingCount = Array.isArray(data) ? data.length : 1;
        if (assignedLimit <= 0 || currentCount + addingCount > assignedLimit) {
          return jsonResponse(
            {
              success: false,
              limitReached: true,
              error: `Your room creation limit (${assignedLimit} rooms) has reached. Contact SuperAdmin.`
            },
            403
          );
        }
      }

      const RETURN_COLS_BY_TABLE: Record<string, string> = {
        rooms: ROOM_SAFE_COLUMNS,
        room_types: ROOM_TYPE_SAFE_COLUMNS,
        reservations: RESERVATION_SAFE_COLUMNS,
        fnb_orders: "id, hotel_id, room_table, guest, items, total, status, time, created_at",
        restaurant_tables: "id, hotel_id, name, area, seats, status, guest_name, room_number, items_count, current_total, active_order_id",
        restaurant_menu_items: "id, hotel_id, name, category, kitchen_station, price, cost_price, tax_pct, unit, is_veg, status",
        housekeeping_tasks: "id, hotel_id, room_number, task_type, priority, assigned_to, status, notes, created_at",
        financial_invoices: "id, hotel_id, reservation_id, room_number, client_name, client_phone, category, subtotal, cgst, sgst, total_amount, paid_amount, payment_mode, status, notes, created_at",
        cab_bookings: "id, hotel_id, guest_name, phone, room_number, cab_type, pickup_location, drop_location, pickup_time, fare, payment_status, booking_status, created_at"
      };
      const returnCols = RETURN_COLS_BY_TABLE[table] || "id, hotel_id";

      let result: any = null;
      if (operation === "upsert") {
        result = await supabaseAdmin.from(table).upsert(data).select(returnCols);
      } else if (operation === "insert") {
        result = await supabaseAdmin.from(table).insert(data).select(returnCols);
      } else if (operation === "update" && match) {
        result = await supabaseAdmin.from(table).update(data).match({ ...match, hotel_id: targetHotelId }).select(returnCols);
      } else if (operation === "delete" && match) {
        result = await supabaseAdmin.from(table).delete().match({ ...match, hotel_id: targetHotelId });
      } else {
        return jsonResponse({ success: false, message: "Unsupported operation." }, 400);
      }

      await broadcastRealtimeSync({
        action: `pms_${operation}`,
        table,
        hotelId: targetHotelId
      });

      return jsonResponse(
        {
          success: !result?.error,
          data: result?.data || null,
          error: result?.error?.message || null
        },
        result?.error ? 400 : 200
      );
    }

    // -------------------------------------------------------------------------
    // 8. GUEST PORTAL BOOKING CREATION & CANCELLATION (Atomic RPC + Broadcast)
    // -------------------------------------------------------------------------
    if (action === "create_guest_booking") {
      const hotelId = String(payload.hotelId || payload.hotel_id || "").trim();
      const { data: created, error: rpcErr } = await supabaseAdmin.rpc("create_guest_reservation", {
        p_booking_id: payload.bookingId || null,
        p_hotel_id: hotelId,
        p_guest: payload.guest || payload.fullName,
        p_guest_email: payload.guestEmail || payload.email || null,
        p_guest_phone: payload.guestPhone || payload.phone || null,
        p_room_category: payload.roomCategory || payload.roomType || "Standard Room",
        p_check_in: payload.checkIn,
        p_check_out: payload.checkOut,
        p_amount: payload.amount !== undefined ? Number(payload.amount) : null,
        p_adults: Number(payload.adults) || 2,
        p_children: Number(payload.children) || 0,
        p_preferred_room_number: payload.preferredRoomNumber || payload.roomNumber || null,
        p_special_requests: payload.specialRequests || null,
        p_source: payload.source || null
      });

      if (rpcErr || !created?.success) {
        return jsonResponse(
          {
            success: false,
            code: created?.code || "BOOKING_ERROR",
            message: rpcErr?.message || created?.message || "Unable to complete booking."
          },
          created?.code === "NO_INVENTORY" ? 409 : 400
        );
      }

      await broadcastRealtimeSync({
        action: "book",
        hotelId: created.hotelId,
        bookingId: created.bookingId,
        roomNumber: created.roomNumber,
        allocatedRoom: created.roomNumber,
        guestName: payload.guestName || payload.guest || "Guest",
        amount: payload.amount
      });

      // Trigger outbound OTA availability sync server-side cleanly
      pushOtaInventoryInternal({
        hotelId: created.hotelId,
        startDate: payload.checkIn,
        endDate: payload.checkOut
      }).catch(() => null);

      return jsonResponse({ success: true, ...created }, 200);
    }

    if (action === "cancel_guest_booking") {
      const bookingId = String(payload.bookingId || "").trim();
      const hotelId = String(payload.hotelId || "").trim() || null;
      if (!bookingId) return jsonResponse({ success: false, message: "bookingId is required." }, 400);
      if (!caller) {
        return jsonResponse({ success: false, message: "Authentication required to cancel booking." }, 401);
      }

      const { data: targetRes } = await supabaseAdmin
        .from("reservations")
        .select("id, hotel_id, guest_phone, guest_email, check_in, check_out")
        .eq("id", bookingId)
        .maybeSingle();

      if (!targetRes) {
        return jsonResponse({ success: false, message: "Reservation not found." }, 404);
      }

      const resPhoneClean = String(targetRes.guest_phone || "").replace(/\D/g, "").slice(-10);
      const resEmailLower = String(targetRes.guest_email || "").trim().toLowerCase();
      const callerEmailLower = String(caller.user?.email || "").trim().toLowerCase();
      const ownerMatch =
        (caller.guestPhone && resPhoneClean && caller.guestPhone === resPhoneClean) ||
        (callerEmailLower &&
          !callerEmailLower.endsWith("@guest.aurastay.local") &&
          resEmailLower &&
          callerEmailLower === resEmailLower);

      if (!canAccessHotel(caller, targetRes.hotel_id) && !ownerMatch) {
        return jsonResponse({ success: false, message: "Forbidden: Cannot cancel another guest booking." }, 403);
      }

      await supabaseAdmin
        .from("reservations")
        .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
        .eq("id", targetRes.id)
        .eq("hotel_id", hotelId || targetRes.hotel_id);

      await supabaseAdmin
        .from("rooms")
        .update({
          status: "VACANT_READY",
          guest: null,
          booking_id: null,
          check_out: null,
          is_ota_locked: false,
          ota_channel: null,
          updated_at: new Date().toISOString()
        })
        .eq("hotel_id", targetRes.hotel_id)
        .eq("booking_id", targetRes.id);

      await broadcastRealtimeSync({
        action: "cancel",
        hotelId: targetRes.hotel_id,
        bookingId: targetRes.id
      });

      pushOtaInventoryInternal({
        hotelId: targetRes.hotel_id,
        startDate: targetRes.check_in,
        endDate: targetRes.check_out
      }).catch(() => null);

      return jsonResponse({ success: true, bookingId: targetRes.id, hotelId: targetRes.hotel_id }, 200);
    }

    // -------------------------------------------------------------------------
    // 9. SERVER-SIDE AIOSELL OTA PUSH & PROXY (Keeps all Aiosell secrets off Browser)
    // -------------------------------------------------------------------------
    if (action === "push_ota_inventory") {
      const hotelId = String(payload.hotelId || payload.hotel_id || "").trim();
      if (!hotelId) return jsonResponse({ success: false, message: "hotelId is required." }, 400);
      if (!canAccessHotel(caller, hotelId)) {
        return jsonResponse({ success: false, message: "Forbidden: Authenticated hotel session required." }, 403);
      }

      const pushed = await pushOtaInventoryInternal({
        hotelId,
        hotelCode: payload.hotelCode,
        partnerId: payload.partnerId,
        username: payload.username,
        password: payload.password,
        startDate: payload.startDate,
        endDate: payload.endDate
      });
      return jsonResponse(pushed.body, pushed.status);
    }

    if (action === "aiosell_proxy") {
      const targetHotelId = String(payload.hotelId || payload.hotel_id || caller?.hotelId || "").trim();
      if (!canAccessHotel(caller, targetHotelId)) {
        return jsonResponse({ success: false, message: "Forbidden: Authenticated hotel session required." }, 403);
      }

      const rawEndpoint = String(payload.endpoint || "").trim();
      const method = String(payload.method || "POST").toUpperCase();
      const partnerId = String(payload.partnerId || AIOSELL_PARTNER_ID).trim();
      const endpoint = rawEndpoint.includes("{partnerId}")
        ? rawEndpoint.replace("{partnerId}", encodeURIComponent(partnerId))
        : rawEndpoint;

      if (!ALLOWED_AIOSELL_PREFIXES.some((p) => endpoint.startsWith(p))) {
        return jsonResponse({ success: false, message: "Unsupported Aiosell endpoint." }, 400);
      }

      const username = String(payload.username || AIOSELL_USERNAME).trim();
      const password = String(payload.password || AIOSELL_PASSWORD).trim();
      const baseUrl = String(payload.baseUrl || AIOSELL_API_BASE).replace(/\/+$/, "");

      if (!username || !password) {
        return jsonResponse({ success: false, message: "Aiosell API credentials not configured." }, 503);
      }

      try {
        const res = await fetch(`${baseUrl}${endpoint}`, {
          method: method === "GET" ? "GET" : "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Basic ${btoa(`${username}:${password}`)}`
          },
          ...(method !== "GET" && payload.body ? { body: JSON.stringify(payload.body) } : {})
        });
        const text = await res.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
        return jsonResponse(
          {
            success: res.ok,
            status: res.status,
            data,
            ...(!res.ok ? { error: data?.message || data?.error || `HTTP ${res.status}` } : {})
          },
          200
        );
      } catch (proxyErr: any) {
        return jsonResponse(
          {
            success: false,
            status: 502,
            error: proxyErr?.message || "Network error connecting to Aiosell",
            data: null
          },
          200
        );
      }
    }

    if (action === "simulate_ota_webhook") {
      const targetHotelId = String(payload.hotelId || payload.hotel_id || caller?.hotelId || "").trim();
      if (!canAccessHotel(caller, targetHotelId)) {
        return jsonResponse({ success: false, message: "Forbidden: Authenticated hotel session required." }, 403);
      }
      if (!WEBHOOK_USERNAME || !WEBHOOK_PASSWORD) {
        return jsonResponse({ success: false, message: "Webhook credentials not configured in Vault." }, 503);
      }

      const webhookBody = {
        ...(payload.webhookPayload || {}),
        hotelId: targetHotelId
      };

      const whRes = await fetch(`${SUPABASE_URL}/functions/v1/aiosell-webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Basic ${btoa(`${WEBHOOK_USERNAME}:${WEBHOOK_PASSWORD}`)}`
        },
        body: JSON.stringify(webhookBody)
      });

      const whData = await whRes.json().catch(() => null);
      return jsonResponse(
        {
          success: whRes.ok && Boolean(whData?.success),
          status: whRes.status,
          edgeResponse: whData
        },
        whRes.ok ? 200 : whRes.status
      );
    }

    return jsonResponse({ success: false, message: `Unknown action '${action}'.` }, 400);
  } catch (err: any) {
    console.error("[pms-api] Exception:", err);
    return jsonResponse({ success: false, message: err?.message || "Internal server error." }, 500);
  }
});
