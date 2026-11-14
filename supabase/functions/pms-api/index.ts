import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/**
 * Dedicated Secured PMS & Channel Outbound Sync API Edge Function.
 * Separated cleanly from the Aiosell inbound webhook endpoint:
 * - Requires project API key / Bearer token
 * - Never exposes plaintext tenant passwords
 * - Handles Admin Auth verification, SuperAdmin provisioning/insights, quota-guarded mutations,
 *   and server-to-server Aiosell inventory pushes.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://pdsfctfixxfazchamznm.supabase.co";
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") || "sb_publishable_qbJiyQ6eiAtwvQA17pG9cg_8bHn3uWi";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || SUPABASE_ANON_KEY;

const AIOSELL_USERNAME = Deno.env.get("AIOSELL_WEBHOOK_USERNAME") || "aiosell";
const AIOSELL_PASSWORD = Deno.env.get("AIOSELL_WEBHOOK_PASSWORD") || "AIOsell@123";
const AIOSELL_PARTNER_ID = Deno.env.get("AIOSELL_PARTNER_ID") || "sample-pms";
const AIOSELL_API_BASE = Deno.env.get("AIOSELL_API_BASE") || "https://live.aiosell.com/api/v2/cm";

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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-aavasa-client",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { headers: corsHeaders, status });
}

function isAuthorizedClient(req: Request): boolean {
  const apiKey = req.headers.get("apikey") || "";
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  const acceptedKeys = new Set(
    [
      SUPABASE_ANON_KEY,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      "sb_publishable_qbJiyQ6eiAtwvQA17pG9cg_8bHn3uWi"
    ].filter(Boolean)
  );

  return acceptedKeys.has(apiKey) || acceptedKeys.has(bearer);
}

function sanitizeHotel(hotel: any) {
  if (!hotel) return null;
  const { password: _removed, ...safeHotel } = hotel;
  return safeHotel;
}

async function broadcastRealtimeSync(eventPayload: Record<string, unknown>) {
  try {
    const channel = supabase.channel("aurastay_sync_broadcast");
    await channel.send({
      type: "broadcast",
      event: "webhook_update",
      payload: {
        ...eventPayload,
        timestamp: new Date().toISOString()
      }
    });
    supabase.removeChannel(channel);
  } catch (err) {
    console.warn("[pms-api] Broadcast warning:", err);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return jsonResponse({ ok: true }, 200);
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, message: "Method Not Allowed. Use POST." }, 405);
  }

  if (!isAuthorizedClient(req)) {
    return jsonResponse({ success: false, message: "Unauthorized API client." }, 401);
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

  try {
    // 1. Hotel Admin Login Verification (Returns sanitized hotel WITHOUT password)
    if (action === "verify_admin_login") {
      const inputIdent = String(payload.email || "").trim().toLowerCase();
      const inputPass = String(payload.password || "").trim();
      if (!inputIdent || !inputPass) {
        return jsonResponse({ success: false, message: "Email and password required." }, 400);
      }

      if (["superadmin@aavasa.com", "admin@aurastay.com", "hotel_aurastay_01"].includes(inputIdent)) {
        return jsonResponse({ success: false, message: "Invalid email or password." }, 401);
      }

      const { data: allHotels, error } = await supabase
        .from("hotels")
        .select("*");

      const validHotels = Array.isArray(allHotels)
        ? allHotels.filter(
            (h: any) =>
              String(h.id || "").toLowerCase() !== "hotel_aurastay_01" &&
              String(h.email || "").toLowerCase() !== "admin@aurastay.com"
          )
        : [];

      if (error || validHotels.length === 0) {
        return jsonResponse({ success: false, message: "Invalid email or password." }, 401);
      }

      const matched = validHotels.find((h: any) => {
        const hEmail = String(h.email || "").trim().toLowerCase();
        const hSlug = String(h.slug || "").trim().toLowerCase();
        const hId = String(h.id || "").trim().toLowerCase();
        return hEmail === inputIdent || hSlug === inputIdent || hId === inputIdent;
      });

      if (!matched || (matched.status && matched.status !== "ACTIVE") || !matched.password || matched.password !== inputPass) {
        return jsonResponse({ success: false, message: "Invalid or inactive Hotel Admin credentials." }, 401);
      }

      return jsonResponse({ success: true, hotel: sanitizeHotel(matched) }, 200);
    }

    // 2. SuperAdmin Provisioning (Hotel Admin + Initial Room Categories/Rooms)
    if (action === "provision_hotel_and_rooms") {
      const { hotel, roomCategories } = payload;
      if (!hotel || !hotel.id || !hotel.email || !hotel.password) {
        return jsonResponse({ success: false, message: "Hotel ID, email, and password are required." }, 400);
      }

      const { error: hotelErr } = await supabase.from("hotels").upsert(hotel);
      if (hotelErr) {
        return jsonResponse({ success: false, message: hotelErr.message }, 400);
      }

      let createdCount = 0;
      if (Array.isArray(roomCategories) && roomCategories.length > 0) {
        const { data: existingRooms } = await supabase
          .from("rooms")
          .select("room_number")
          .eq("hotel_id", hotel.id);

        const usedNumbers = new Set((existingRooms || []).map((r: any) => String(r.room_number || "").trim()));

        for (let idx = 0; idx < roomCategories.length; idx++) {
          const cat = roomCategories[idx];
          const rawName = String(cat.name || cat.type || "Standard Room").trim();
          const count = Math.max(0, Number(cat.count || cat.quantity || 0));
          if (!rawName || count <= 0) continue;

          const price = Number(cat.price || cat.basePrice || 2500);
          const bed = String(cat.bed || cat.beddingType || "King Bed").trim();
          const floor = String(cat.floor || `Floor ${idx + 1}`).trim();
          const startNum = Number(cat.startRoomNumber) || (idx + 1) * 100 + 1;
          const hasSuffix = /\b(room|rooms|suite|suites|villa|villas|cottage|studio|tent|cabin|penthouse|loft)\b/i.test(rawName);
          const categoryName = hasSuffix ? rawName : `${rawName} Room`;
          const rtId = `rt-${hotel.id}-${categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

          await supabase.from("room_types").upsert({
            id: rtId,
            hotel_id: hotel.id,
            name: categoryName,
            label: "Room",
            bedding_type: bed,
            max_adults: Number(cat.maxAdults) || 2,
            area_sqft: Number(cat.areaSqft) || 350,
            base_price: price,
            description: `Comfortable ${categoryName}.`,
            is_booking_engine: true
          });

          let candidateNum = startNum;
          for (let i = 0; i < count; i++) {
            while (usedNumbers.has(String(candidateNum))) candidateNum++;
            const roomNumStr = String(candidateNum);
            usedNumbers.add(roomNumStr);
            candidateNum++;

            await supabase.from("rooms").insert({
              hotel_id: hotel.id,
              room_number: roomNumStr,
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
            createdCount++;
          }
        }
      }

      await broadcastRealtimeSync({
        action: "superadmin_hotel_provisioned",
        hotelId: hotel.id,
        createdRooms: createdCount
      });

      return jsonResponse({ success: true, hotelId: hotel.id, createdRooms: createdCount }, 200);
    }

    // 3. SuperAdmin Insights (strict hotelId scope, password stripped)
    if (action === "admin_insights") {
      const targetHotelId = String(payload.hotelId || payload.hotel_id || "").trim();
      if (!targetHotelId) {
        return jsonResponse({ success: false, message: "hotelId is required." }, 400);
      }

      const [hotelRes, roomsRes, rtRes, resRes, fnbRes, cabRes, hkRes, invRes] = await Promise.all([
        supabase.from("hotels").select("*").eq("id", targetHotelId).maybeSingle(),
        supabase.from("rooms").select("*").eq("hotel_id", targetHotelId).order("room_number", { ascending: true }),
        supabase.from("room_types").select("*").eq("hotel_id", targetHotelId),
        supabase.from("reservations").select("*").eq("hotel_id", targetHotelId).order("created_at", { ascending: false }),
        supabase.from("fnb_orders").select("id").eq("hotel_id", targetHotelId),
        supabase.from("cab_bookings").select("id").eq("hotel_id", targetHotelId),
        supabase.from("housekeeping_tasks").select("id").eq("hotel_id", targetHotelId),
        supabase.from("financial_invoices").select("id").eq("hotel_id", targetHotelId)
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

    // 4. Quota-guarded PMS Mutation for allowlisted operational tables
    if (action === "pms_mutation") {
      const { table, operation, data, match } = payload;
      if (!table || !operation || !ALLOWED_MUTATION_TABLES.has(String(table))) {
        return jsonResponse({ success: false, message: "Invalid or unauthorized target table." }, 403);
      }

      if (table === "rooms" && (operation === "insert" || operation === "upsert")) {
        const targetHotelId = Array.isArray(data) ? data[0]?.hotel_id : data?.hotel_id;
        if (!targetHotelId) {
          return jsonResponse({ success: false, message: "hotel_id is required for room creation." }, 400);
        }
        const [{ data: hotelRow }, { data: existingRooms }] = await Promise.all([
          supabase.from("hotels").select("total_rooms").eq("id", targetHotelId).maybeSingle(),
          supabase.from("rooms").select("id").eq("hotel_id", targetHotelId)
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

      let result: any = null;
      if (operation === "upsert") {
        result = await supabase.from(table).upsert(data).select();
      } else if (operation === "insert") {
        result = await supabase.from(table).insert(data).select();
      } else if (operation === "update" && match) {
        result = await supabase.from(table).update(data).match(match).select();
      } else if (operation === "delete" && match) {
        result = await supabase.from(table).delete().match(match);
      } else {
        return jsonResponse({ success: false, message: "Unsupported operation." }, 400);
      }

      await broadcastRealtimeSync({
        action: `pms_${operation}`,
        table,
        hotelId: (Array.isArray(data) ? data[0]?.hotel_id : data?.hotel_id) || match?.hotel_id || null
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

    // 5. Outbound Aiosell Inventory Push (Pushes ONLY minimal availability/stopSell to Aiosell)
    if (action === "push_ota_inventory") {
      const hotelId = String(payload.hotelId || payload.hotel_id || "").trim();
      if (!hotelId) {
        return jsonResponse({ success: false, message: "hotelId is required." }, 400);
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
      const startDate = String(payload.startDate || todayStr).slice(0, 10);
      const endDate = String(payload.endDate || nextWeekStr).slice(0, 10);

      const [{ data: hotelRow }, { data: rooms }, { data: activeRes }] = await Promise.all([
        supabase.from("hotels").select("id, slug, aiosell_hotel_code").eq("id", hotelId).maybeSingle(),
        supabase.from("rooms").select("room_number, type, status").eq("hotel_id", hotelId),
        supabase
          .from("reservations")
          .select("room_number, room, status, check_in, check_out")
          .eq("hotel_id", hotelId)
          .not("status", "in", "(CANCELLED,CHECKED_OUT,NO_SHOW)")
      ]);

      const hotelCode =
        String(payload.hotelCode || hotelRow?.aiosell_hotel_code || hotelRow?.slug || hotelId || "sandbox-pms").trim();

      // Aggregate category counts for [startDate, endDate) with zero guest PII
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

        const isOccupiedToday = st === "OCCUPIED" && startDate <= todayStr;
        if (!isMaint && !overlapsDates && !isOccupiedToday) {
          entry.free += 1;
        }
      });

      const aiosellRoomsPayload = Array.from(categoryCounts.entries()).map(([roomType, counts]) => ({
        roomCode: roomType,
        available: counts.free,
        stopSell: counts.total > 0 && counts.free === 0
      }));

      if (aiosellRoomsPayload.length === 0) {
        return jsonResponse({ success: true, pushed: false, message: "No mapped rooms to sync.", updates: [] }, 200);
      }

      const partnerId = String(payload.partnerId || AIOSELL_PARTNER_ID).trim();
      const username = String(payload.username || AIOSELL_USERNAME).trim();
      const password = String(payload.password || AIOSELL_PASSWORD).trim();
      const authToken = btoa(`${username}:${password}`);

      const aiosellBody = {
        hotelCode,
        updates: [
          {
            startDate,
            endDate,
            rooms: aiosellRoomsPayload
          }
        ]
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
        return jsonResponse(
          {
            success: false,
            pushed: false,
            error: pushErr?.message || "Aiosell API reachable check failed.",
            payloadSent: aiosellBody
          },
          502
        );
      }

      return jsonResponse(
        {
          success: aiosellStatus >= 200 && aiosellStatus < 300,
          pushed: true,
          aiosellStatus,
          aiosellResponse: aiosellData,
          payloadSent: aiosellBody
        },
        200
      );
    }

    return jsonResponse({ success: false, message: `Unknown action '${action}'.` }, 400);
  } catch (err: any) {
    console.error("[pms-api] Exception:", err);
    return jsonResponse({ success: false, message: err?.message || "Internal server error." }, 500);
  }
});
