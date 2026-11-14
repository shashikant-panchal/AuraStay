import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Aiosell Webhook Authentication Credentials (Set in Supabase Secrets or default to Sandbox)
const AIOSELL_USERNAME = Deno.env.get("AIOSELL_WEBHOOK_USERNAME") || "aiosell";
const AIOSELL_PASSWORD = Deno.env.get("AIOSELL_WEBHOOK_PASSWORD") || "AIOsell@123";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://pdsfctfixxfazchamznm.supabase.co";
const SUPABASE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY") ||
  "sb_publishable_qbJiyQ6eiAtwvQA17pG9cg_8bHn3uWi";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Content-Type": "application/json"
};

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
    console.warn("[AuraStay Edge Function] Broadcast notice:", err);
  }
}

async function resolveActiveHotelId(preferredHotelId?: string, hotelCode?: string): Promise<string> {
  if (preferredHotelId && preferredHotelId.trim()) {
    return preferredHotelId.trim();
  }
  try {
    const { data: hotels } = await supabase
      .from("hotels")
      .select("id, slug, status")
      .order("created_at", { ascending: false });

    if (hotels && hotels.length > 0) {
      if (hotelCode) {
        const matched = hotels.find(
          (h: any) =>
            String(h.id).toLowerCase() === String(hotelCode).toLowerCase() ||
            String(h.slug).toLowerCase() === String(hotelCode).toLowerCase()
        );
        if (matched) return matched.id;
      }
      const active = hotels.find((h: any) => h.status === "ACTIVE") || hotels[0];
      if (active?.id) return active.id;
    }
  } catch (_e) {
    // ignore
  }
  return "shivanandi";
}

async function handleLiveStateSync(hotelIdParam?: string | null) {
  const [
    hotelsRes,
    roomsRes,
    resRes,
    rtRes,
    fnbRes,
    cabsRes,
    invoicesRes,
    banquetRes,
    hkRes,
    invRes
  ] = await Promise.all([
    supabase.from("hotels").select("*").order("created_at", { ascending: false }),
    supabase.from("rooms").select("*").order("room_number", { ascending: true }),
    supabase.from("reservations").select("*").order("created_at", { ascending: false }),
    supabase.from("room_types").select("*").order("name", { ascending: true }),
    supabase.from("fnb_orders").select("*").order("created_at", { ascending: false }),
    supabase.from("cab_bookings").select("*").order("created_at", { ascending: false }),
    supabase.from("financial_invoices").select("*").order("created_at", { ascending: false }),
    supabase.from("banquet_bookings").select("*").order("created_at", { ascending: false }),
    supabase.from("housekeeping_tasks").select("*").order("created_at", { ascending: false }),
    supabase.from("inventory_items").select("*").order("created_at", { ascending: false })
  ]);

  return new Response(
    JSON.stringify({
      success: true,
      syncedAt: new Date().toISOString(),
      hotelId: hotelIdParam || null,
      hotels: hotelsRes.data || [],
      rooms: roomsRes.data || [],
      roomTypes: rtRes.data || [],
      reservations: resRes.data || [],
      fnbOrders: fnbRes.data || [],
      cabBookings: cabsRes.data || [],
      financialInvoices: invoicesRes.data || [],
      banquetBookings: banquetRes.data || [],
      housekeepingTasks: hkRes.data || [],
      inventoryItems: invRes.data || []
    }),
    { headers: corsHeaders, status: 200 }
  );
}

serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders, status: 200 });
  }

  const url = new URL(req.url);

  // 2. Handle GET live state fetch (for real-time cross-device sync without refreshing)
  if (req.method === "GET") {
    const hotelId = url.searchParams.get("hotelId");
    return await handleLiveStateSync(hotelId);
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use GET or POST." }), {
      headers: corsHeaders,
      status: 405
    });
  }

  // 3. Validate Auth Header (Accepts Basic Auth from Aiosell OR Bearer/apikey/open from PMS Frontend)
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  if (authHeader.startsWith("Basic ")) {
    try {
      const b64 = authHeader.replace("Basic ", "").trim();
      const decoded = atob(b64);
      const [user, pass] = decoded.split(":");

      if (user !== AIOSELL_USERNAME || pass !== AIOSELL_PASSWORD) {
        return new Response(JSON.stringify({ success: false, message: "Invalid Aiosell Webhook credentials." }), {
          headers: corsHeaders,
          status: 401
        });
      }
    } catch (_e) {
      return new Response(JSON.stringify({ success: false, message: "Malformed Basic Auth token." }), {
        headers: corsHeaders,
        status: 401
      });
    }
  }

  // 4. Parse JSON Body
  let payload: any;
  try {
    payload = await req.json();
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: `Invalid JSON payload: ${err.message}` }), {
      headers: corsHeaders,
      status: 400
    });
  }

  if (!payload || !payload.action) {
    return new Response(JSON.stringify({ success: false, message: "Malformed payload: missing 'action' field." }), {
      headers: corsHeaders,
      status: 400
    });
  }

  const action = String(payload.action).toLowerCase();

  // Support live state sync over POST
  if (action === "sync" || action === "fetch_state") {
    return await handleLiveStateSync(payload.hotelId || payload.hotel_id);
  }

  // Support strict SuperAdmin-provisioned Hotel Admin credential verification
  if (action === "verify_admin_login") {
    const inputIdent = String(payload.email || "").trim().toLowerCase();
    const inputPass = String(payload.password || "").trim();
    if (!inputIdent || !inputPass) {
      return new Response(JSON.stringify({ success: false, message: "Email and password required." }), {
        headers: corsHeaders,
        status: 400
      });
    }

    if (inputIdent === "superadmin@aavasa.com" || inputIdent === "admin@aurastay.com" || inputIdent === "hotel_aurastay_01") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Only Hotel Admin credentials created in Aavasa SuperAdmin can sign in."
        }),
        { headers: corsHeaders, status: 401 }
      );
    }

    const { data: allHotels, error } = await supabase.from("hotels").select("*");
    const validHotels = Array.isArray(allHotels)
      ? allHotels.filter(
          (h: any) =>
            String(h.id || "").toLowerCase() !== "hotel_aurastay_01" &&
            String(h.email || "").toLowerCase() !== "admin@aurastay.com"
        )
      : [];

    if (error || validHotels.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No Hotel Admin credentials exist. Create one in Aavasa SuperAdmin first."
        }),
        { headers: corsHeaders, status: 401 }
      );
    }

    const matched = validHotels.find((h: any) => {
      const hEmail = String(h.email || "").trim().toLowerCase();
      const hSlug = String(h.slug || "").trim().toLowerCase();
      const hId = String(h.id || "").trim().toLowerCase();
      return hEmail === inputIdent || hSlug === inputIdent || hId === inputIdent;
    });

    if (!matched || (matched.status && matched.status !== "ACTIVE") || !matched.password || matched.password !== inputPass) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid or inactive Hotel Admin credentials."
        }),
        { headers: corsHeaders, status: 401 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        hotel: matched
      }),
      { headers: corsHeaders, status: 200 }
    );
  }

  // Support SuperAdmin provisioning of Hotel Admin + Room Categories + Physical Rooms
  if (action === "provision_hotel_and_rooms") {
    const { hotel, roomCategories } = payload;
    if (!hotel || !hotel.id || !hotel.email || !hotel.password) {
      return new Response(
        JSON.stringify({ success: false, message: "Hotel ID, email, and password are required." }),
        { headers: corsHeaders, status: 400 }
      );
    }

    await supabase.from("hotels").upsert(hotel);

    let createdCount = 0;
    if (Array.isArray(roomCategories) && roomCategories.length > 0) {
      const { data: existingRooms } = await supabase
        .from("rooms")
        .select("room_number")
        .eq("hotel_id", hotel.id);
      const usedNumbers = new Set(
        (existingRooms || []).map((r: any) => String(r.room_number || "").trim())
      );

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
          description: `Comfortable ${categoryName} provisioned via Aavasa SuperAdmin.`,
          is_booking_engine: true
        });

        let candidateNum = startNum;
        for (let i = 0; i < count; i++) {
          while (usedNumbers.has(String(candidateNum))) {
            candidateNum++;
          }
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

    return new Response(
      JSON.stringify({
        success: true,
        hotelId: hotel.id,
        createdRooms: createdCount
      }),
      { headers: corsHeaders, status: 200 }
    );
  }

  // Support complete SuperAdmin insights for a specific Hotel Admin
  if (action === "admin_insights") {
    const targetHotelId = String(payload.hotelId || payload.hotel_id || "").trim();
    if (!targetHotelId) {
      return new Response(
        JSON.stringify({ success: false, message: "hotelId is required." }),
        { headers: corsHeaders, status: 400 }
      );
    }

    const [hotelRes, roomsRes, rtRes, resRes, fnbRes, cabRes, hkRes, invRes] = await Promise.all([
      supabase.from("hotels").select("*").eq("id", targetHotelId).maybeSingle(),
      supabase.from("rooms").select("*").eq("hotel_id", targetHotelId).order("room_number", { ascending: true }),
      supabase.from("room_types").select("*").eq("hotel_id", targetHotelId),
      supabase.from("reservations").select("*").eq("hotel_id", targetHotelId).order("created_at", { ascending: false }),
      supabase.from("fnb_orders").select("*").eq("hotel_id", targetHotelId),
      supabase.from("cab_bookings").select("*").eq("hotel_id", targetHotelId),
      supabase.from("housekeeping_tasks").select("*").eq("hotel_id", targetHotelId),
      supabase.from("financial_invoices").select("*").eq("hotel_id", targetHotelId)
    ]);

    const hotel = hotelRes.data;
    const rooms = roomsRes.data || [];
    const reservations = resRes.data || [];
    const assignedRooms = Number(hotel?.total_rooms) || 0;
    const createdRooms = rooms.length;
    const remainingRooms = Math.max(0, assignedRooms - createdRooms);

    return new Response(
      JSON.stringify({
        success: true,
        hotel,
        insights: {
          assignedRooms,
          createdRooms,
          remainingRooms,
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
      }),
      { headers: corsHeaders, status: 200 }
    );
  }

  // Support generic Enterprise PMS table mutation + immediate cross-device broadcast
  if (action === "pms_mutation") {
    const { table, operation, data, match } = payload;
    if (!table || !operation) {
      return new Response(JSON.stringify({ success: false, message: "Missing table or operation." }), {
        headers: corsHeaders,
        status: 400
      });
    }

    // Enforce SuperAdmin room quota when Admin attempts to insert a room
    if (table === "rooms" && (operation === "insert" || operation === "upsert")) {
      const targetHotelId = Array.isArray(data) ? data[0]?.hotel_id : data?.hotel_id;
      if (targetHotelId) {
        const [{ data: hotelRow }, { data: existingRooms }] = await Promise.all([
          supabase.from("hotels").select("total_rooms").eq("id", targetHotelId).maybeSingle(),
          supabase.from("rooms").select("id").eq("hotel_id", targetHotelId)
        ]);
        const assignedLimit = Number(hotelRow?.total_rooms) || 0;
        const currentCount = (existingRooms || []).length;
        const addingCount = Array.isArray(data) ? data.length : 1;
        if (assignedLimit <= 0 || currentCount + addingCount > assignedLimit) {
          return new Response(
            JSON.stringify({
              success: false,
              limitReached: true,
              error: `Your room creation limit (${assignedLimit} rooms) has reached. Contact SuperAdmin.`
            }),
            { headers: corsHeaders, status: 403 }
          );
        }
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
    }
    await broadcastRealtimeSync({
      action: `pms_${operation}`,
      table,
      match: match || null
    });
    return new Response(
      JSON.stringify({
        success: !result?.error,
        data: result?.data || null,
        error: result?.error?.message || null
      }),
      { headers: corsHeaders, status: 200 }
    );
  }

  const bookingId = payload.bookingId || payload.cmBookingId || `OTA-${Date.now()}`;
  const channel = payload.channel || "OTA Channel";
  const hotelCode = payload.hotelCode || "sandbox-pms";
  const resolvedHotelId = await resolveActiveHotelId(payload.hotelId || payload.hotel_id, hotelCode);

  console.log(`[Aiosell Webhook] Received ${action} for booking ${bookingId} from channel ${channel}`);

  try {
    // -------------------------------------------------------------
    // ACTION: CANCEL
    // -------------------------------------------------------------
    if (action === "cancel") {
      const { data: existingRes } = await supabase
        .from("reservations")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle();

      await supabase
        .from("reservations")
        .update({
          status: "CANCELLED",
          notes: `Cancelled by guest on ${channel} (via Aiosell Webhook at ${new Date().toISOString()})`
        })
        .eq("id", bookingId);

      const assignedRoom =
        existingRes?.room_number ||
        existingRes?.room?.match(/\b(\d+)\b/)?.[1] ||
        null;
      const cancelHotelId = existingRes?.hotel_id || resolvedHotelId;

      if (assignedRoom) {
        let unlockQ = supabase
          .from("rooms")
          .update({
            status: "VACANT_READY",
            guest: null,
            booking_id: null,
            check_out: null,
            updated_at: new Date().toISOString()
          })
          .eq("room_number", assignedRoom);
        if (cancelHotelId) {
          unlockQ = unlockQ.eq("hotel_id", cancelHotelId);
        }
        await unlockQ;
      } else {
        await supabase
          .from("rooms")
          .update({
            status: "VACANT_READY",
            guest: null,
            booking_id: null,
            check_out: null,
            updated_at: new Date().toISOString()
          })
          .eq("booking_id", bookingId);
      }

      await broadcastRealtimeSync({
        action: "cancel",
        bookingId,
        channel,
        unlockedRoom: assignedRoom
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Reservation Cancelled Successfully",
          bookingId,
          unlockedRoom: assignedRoom
        }),
        { headers: corsHeaders, status: 200 }
      );
    }

    // -------------------------------------------------------------
    // ACTION: BOOK or MODIFY
    // -------------------------------------------------------------
    if (action === "book" || action === "modify") {
      const guest = payload.guest || {};
      const guestName =
        [guest.firstName, guest.lastName].filter(Boolean).join(" ").trim() ||
        payload.rooms?.[0]?.guestName ||
        `Guest (${channel})`;

      const firstRoom = payload.rooms?.[0] || {};
      const rawRoomCode = String(firstRoom.roomCode || "executive").toLowerCase();

      let pmsRoomType = firstRoom.roomCode || "Deluxe Room";
      if (rawRoomCode.includes("suite")) pmsRoomType = "Executive Suite";
      else if (rawRoomCode.includes("exec")) pmsRoomType = "Executive Room";
      else if (rawRoomCode.includes("std") || rawRoomCode.includes("standard")) pmsRoomType = "Standard Room";
      else if (rawRoomCode.includes("deluxe")) pmsRoomType = "Deluxe Room";

      const checkIn = payload.checkin || new Date().toISOString().split("T")[0];
      const checkOut = payload.checkout || new Date(Date.now() + 86400000).toISOString().split("T")[0];

      const isPayAtHotel = Boolean(payload.pah);
      const totalAmount = Number(payload.amount?.amountAfterTax) || Number(payload.amount?.amountBeforeTax) || 0;
      const paidAmount = isPayAtHotel ? 0 : totalAmount;

      const specialRequests =
        typeof payload.specialRequests === "string"
          ? payload.specialRequests
          : payload.specialRequests
          ? JSON.stringify(payload.specialRequests)
          : null;

      const { data: existingRes } = await supabase
        .from("reservations")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle();

      let allocatedRoomNumber =
        existingRes?.room_number ||
        existingRes?.room?.match(/\b(\d+)\b/)?.[1] ||
        "";
      let roomHotelId = existingRes?.hotel_id || resolvedHotelId;

      if (!allocatedRoomNumber) {
        let matchQuery = supabase
          .from("rooms")
          .select("*")
          .or(`type.ilike.%${pmsRoomType}%,type.ilike.%${rawRoomCode}%`)
          .eq("status", "VACANT_READY")
          .order("room_number", { ascending: true })
          .limit(1);
        if (roomHotelId) matchQuery = matchQuery.eq("hotel_id", roomHotelId);
        const { data: availableRooms } = await matchQuery;

        if (availableRooms && availableRooms.length > 0) {
          allocatedRoomNumber = availableRooms[0].room_number;
          if (availableRooms[0].hotel_id) roomHotelId = availableRooms[0].hotel_id;
        } else {
          let fallbackQuery = supabase
            .from("rooms")
            .select("*")
            .eq("status", "VACANT_READY")
            .order("room_number", { ascending: true })
            .limit(1);
          if (roomHotelId) fallbackQuery = fallbackQuery.eq("hotel_id", roomHotelId);
          const { data: anyVacant } = await fallbackQuery;
          if (anyVacant && anyVacant.length > 0) {
            allocatedRoomNumber = anyVacant[0].room_number;
            if (anyVacant[0].hotel_id) roomHotelId = anyVacant[0].hotel_id;
          }
        }
      }

      if (allocatedRoomNumber) {
        let lockQuery = supabase
          .from("rooms")
          .update({
            status: "OCCUPIED",
            guest: guestName,
            booking_id: bookingId,
            check_out: checkOut,
            updated_at: new Date().toISOString()
          })
          .eq("room_number", allocatedRoomNumber);
        if (roomHotelId) lockQuery = lockQuery.eq("hotel_id", roomHotelId);
        await lockQuery;
      }

      const fullReservationRecord: Record<string, unknown> = {
        id: bookingId,
        hotel_id: roomHotelId,
        guest: guestName,
        guest_email: guest.email || null,
        guest_phone: guest.phone || null,
        guest_country: guest.address?.country || "India",
        room: allocatedRoomNumber ? `Room ${allocatedRoomNumber}` : `Unassigned (${pmsRoomType})`,
        room_number: allocatedRoomNumber || null,
        room_type: pmsRoomType,
        check_in: checkIn,
        check_out: checkOut,
        adults: Number(firstRoom.occupancy?.adults) || 1,
        children: Number(firstRoom.occupancy?.children) || 0,
        rate_plan: firstRoom.rateplanCode || "Room Only (EP)",
        source: `${channel} (Aiosell Channel Manager)`,
        amount: totalAmount,
        paid: paidAmount,
        advance_paid: paidAmount,
        payment_mode: isPayAtHotel ? "Pay at Hotel (Cash/Card/UPI)" : "Prepaid (OTA Virtual Card)",
        payment: isPayAtHotel ? "PENDING" : "PAID",
        status: "CONFIRMED",
        special_requests: specialRequests,
        notes: `Channel Booking ID: ${bookingId}. Channel: ${channel}. PAH: ${isPayAtHotel}. Auto-locked room: ${allocatedRoomNumber || "None"}.`
      };

      const { error: upsertErr } = await supabase.from("reservations").upsert(fullReservationRecord);

      if (upsertErr) {
        await supabase.from("reservations").upsert({
          id: bookingId,
          hotel_id: roomHotelId,
          guest: guestName,
          guest_email: guest.email || null,
          guest_phone: guest.phone || null,
          room: allocatedRoomNumber ? `Room ${allocatedRoomNumber}` : `Unassigned (${pmsRoomType})`,
          check_in: checkIn,
          check_out: checkOut,
          source: `${channel} (Aiosell Channel Manager)`,
          amount: totalAmount,
          status: "CONFIRMED",
          payment: isPayAtHotel ? "PENDING" : "PAID"
        });
      }

      await broadcastRealtimeSync({
        action,
        bookingId,
        channel,
        allocatedRoom: allocatedRoomNumber || null,
        guestName
      });

      const responseMessage =
        action === "modify" ? "Reservation Modified Successfully" : "Reservation Updated Successfully";

      return new Response(
        JSON.stringify({
          success: true,
          message: responseMessage,
          bookingId,
          allocatedRoom: allocatedRoomNumber || null,
          hotelId: roomHotelId
        }),
        { headers: corsHeaders, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: `Unsupported action '${action}'. Expected book, modify, cancel, sync, verify_admin_login, or pms_mutation.`
      }),
      { headers: corsHeaders, status: 400 }
    );
  } catch (err: any) {
    console.error("[Aiosell Webhook Exception]:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message || "Internal server error processing Aiosell webhook."
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});
