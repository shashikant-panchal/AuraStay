import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/**
 * Dedicated Inbound OTA Webhook Endpoint for Aiosell Channel Manager.
 * Strictly handles OTA events (book / modify / cancel / ping) with mandatory Basic Auth,
 * tenant hotel_id isolation, date-overlap double-booking protection, and minimal responses.
 */

const WEBHOOK_USERNAME = Deno.env.get("AAVASA_WEBHOOK_USERNAME") || "adminaavasa";
const WEBHOOK_PASSWORD = Deno.env.get("AAVASA_WEBHOOK_PASSWORD") || "admin123";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://pdsfctfixxfazchamznm.supabase.co";
const SUPABASE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY") ||
  "sb_publishable_qbJiyQ6eiAtwvQA17pG9cg_8bHn3uWi";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { headers: corsHeaders, status });
}

function validateBasicAuth(req: Request): boolean {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Basic ")) return false;
  try {
    const b64 = authHeader.slice(6).trim();
    const decoded = atob(b64);
    const sepIdx = decoded.indexOf(":");
    if (sepIdx <= 0) return false;
    const user = decoded.slice(0, sepIdx);
    const pass = decoded.slice(sepIdx + 1);
    return user === WEBHOOK_USERNAME && pass === WEBHOOK_PASSWORD;
  } catch {
    return false;
  }
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
    console.warn("[aiosell-webhook] Broadcast warning:", err);
  }
}

async function resolveHotelIdStrict(preferredHotelId?: string, hotelCode?: string): Promise<string | null> {
  const { data: hotels, error } = await supabase
    .from("hotels")
    .select("id, slug, status, aiosell_hotel_code")
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(hotels) || hotels.length === 0) {
    return null;
  }

  const validHotels = hotels.filter(
    (h: any) => String(h.id || "").toLowerCase() !== "hotel_aurastay_01"
  );

  if (preferredHotelId && preferredHotelId.trim()) {
    const pref = preferredHotelId.trim().toLowerCase();
    const byId = validHotels.find(
      (h: any) =>
        String(h.id || "").toLowerCase() === pref ||
        String(h.slug || "").toLowerCase() === pref
    );
    if (byId) return byId.id;
  }

  const codeNorm = String(hotelCode || "").trim().toLowerCase();
  if (codeNorm) {
    // 1. Exact per-hotel Aiosell code / slug / id match
    const matched = validHotels.find(
      (h: any) =>
        String(h.aiosell_hotel_code || "").trim().toLowerCase() === codeNorm ||
        String(h.id || "").trim().toLowerCase() === codeNorm ||
        String(h.slug || "").trim().toLowerCase() === codeNorm
    );
    if (matched) return matched.id;

    // 2. Sandbox convenience ONLY when single active hotel or sandbox-pms default
    if (codeNorm === "sandbox-pms") {
      const activeHotels = validHotels.filter((h: any) => !h.status || h.status === "ACTIVE");
      if (activeHotels.length === 1) {
        return activeHotels[0].id;
      }
    }
  }

  return null;
}

function normalizeCategory(rawRoomCode: string): string {
  const code = String(rawRoomCode || "").toLowerCase();
  if (code.includes("suite")) return "Executive Suite";
  if (code.includes("exec")) return "Executive Room";
  if (code.includes("std") || code.includes("standard")) return "Standard Room";
  if (code.includes("delux") || code.includes("dlx")) return "Deluxe Room";
  return rawRoomCode ? String(rawRoomCode).trim() : "Standard Room";
}

function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart < bEnd && aEnd > bStart;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return jsonResponse({ ok: true }, 200);
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { success: false, message: "Method Not Allowed. Only authenticated POST webhook events are accepted." },
      405
    );
  }

  if (!validateBasicAuth(req)) {
    return jsonResponse({ success: false, message: "Unauthorized: Invalid Aiosell Basic Auth credentials." }, 401);
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ success: false, message: "Invalid JSON webhook payload." }, 400);
  }

  const action = String(payload?.action || "").trim().toLowerCase();
  if (!action) {
    return jsonResponse({ success: false, message: "Missing required field: action." }, 400);
  }

  if (action === "ping" || action === "health") {
    return jsonResponse({ success: true, message: "Aiosell webhook endpoint active." }, 200);
  }

  if (!["book", "modify", "cancel"].includes(action)) {
    return jsonResponse(
      { success: false, message: `Unsupported webhook action '${action}'. Expected book, modify, cancel, or ping.` },
      400
    );
  }

  const bookingId = String(payload.bookingId || payload.cmBookingId || `OTA-${Date.now()}`).trim();
  const channel = String(payload.channel || "OTA Channel").trim();
  const hotelCode = String(payload.hotelCode || "").trim();

  try {
    // Check existing reservation first to preserve tenant affinity on modify/cancel
    const { data: existingRes } = await supabase
      .from("reservations")
      .select("id, hotel_id, room_number, room, status, check_in, check_out")
      .eq("id", bookingId)
      .maybeSingle();

    const resolvedHotelId =
      existingRes?.hotel_id ||
      (await resolveHotelIdStrict(payload.hotelId || payload.hotel_id, hotelCode));

    if (!resolvedHotelId) {
      return jsonResponse(
        {
          success: false,
          message: `No property mapped for hotelCode '${hotelCode || "unknown"}'. Configure aiosell_hotel_code in Aavasa Channel Manager.`
        },
        404
      );
    }

    // -------------------------------------------------------------
    // ACTION: CANCEL (Unlocks physical room in that hotel only)
    // -------------------------------------------------------------
    if (action === "cancel") {
      await supabase
        .from("reservations")
        .update({
          status: "CANCELLED",
          notes: `Cancelled via ${channel} webhook (${new Date().toISOString()})`
        })
        .eq("id", bookingId)
        .eq("hotel_id", resolvedHotelId);

      // Unlock only rooms held by THIS booking in THIS hotel
      const { data: unlockedRows } = await supabase
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
        .eq("hotel_id", resolvedHotelId)
        .eq("booking_id", bookingId)
        .select("room_number");

      const unlockedRoom = unlockedRows?.[0]?.room_number || existingRes?.room_number || null;

      await broadcastRealtimeSync({
        action: "cancel",
        hotelId: resolvedHotelId,
        bookingId,
        channel,
        unlockedRoom
      });

      return jsonResponse(
        {
          success: true,
          message: "Reservation Cancelled Successfully",
          bookingId,
          status: "CANCELLED"
        },
        200
      );
    }

    // -------------------------------------------------------------
    // ACTION: BOOK or MODIFY (Strict hotel_id & date overlap check)
    // -------------------------------------------------------------
    const guest = payload.guest || {};
    const guestName =
      [guest.firstName, guest.lastName].filter(Boolean).join(" ").trim() ||
      payload.rooms?.[0]?.guestName ||
      `Guest (${channel})`;

    const firstRoom = payload.rooms?.[0] || {};
    const rawRoomCode = String(firstRoom.roomCode || "Standard Room").trim();
    const pmsRoomType = normalizeCategory(rawRoomCode);

    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const checkIn = String(payload.checkin || payload.checkIn || todayStr).slice(0, 10);
    const checkOut = String(payload.checkout || payload.checkOut || tomorrowStr).slice(0, 10);
    const coversToday = checkIn <= todayStr && checkOut > todayStr;

    const isPayAtHotel = Boolean(payload.pah);
    const totalAmount = Number(payload.amount?.amountAfterTax) || Number(payload.amount?.amountBeforeTax) || 0;
    const paidAmount = isPayAtHotel ? 0 : totalAmount;

    const specialRequests =
      typeof payload.specialRequests === "string"
        ? payload.specialRequests
        : payload.specialRequests
        ? JSON.stringify(payload.specialRequests)
        : null;

    // Query ONLY this hotel's rooms and active overlapping reservations (Free-plan optimal)
    const [{ data: hotelRooms }, { data: hotelReservations }] = await Promise.all([
      supabase
        .from("rooms")
        .select("room_number, type, status, booking_id, check_out")
        .eq("hotel_id", resolvedHotelId)
        .order("room_number", { ascending: true }),
      supabase
        .from("reservations")
        .select("id, room_number, room, status, check_in, check_out")
        .eq("hotel_id", resolvedHotelId)
        .neq("id", bookingId)
        .not("status", "in", "(CANCELLED,CHECKED_OUT,NO_SHOW)")
    ]);

    const roomsList = hotelRooms || [];
    const activeReservations = hotelReservations || [];

    const isRoomFreeForDates = (roomRow: any): boolean => {
      const rNum = String(roomRow.room_number || "").trim();
      const status = String(roomRow.status || "VACANT_READY").toUpperCase();
      if (["MAINTENANCE", "OUT_OF_ORDER", "BLOCKED"].includes(status)) return false;

      // Check overlapping non-cancelled reservations on this physical room
      const hasOverlap = activeReservations.some((res: any) => {
        const resNum =
          String(res.room_number || "").trim() ||
          String(res.room || "").match(/\b(\d+)\b/)?.[1] ||
          "";
        if (resNum !== rNum) return false;
        return datesOverlap(checkIn, checkOut, String(res.check_in).slice(0, 10), String(res.check_out).slice(0, 10));
      });
      if (hasOverlap) return false;

      // If physically OCCUPIED right now without a matching reservation row or overlapping today
      if (status === "OCCUPIED" && String(roomRow.booking_id || "") !== bookingId) {
        if (roomRow.check_out) {
          if (datesOverlap(checkIn, checkOut, todayStr, String(roomRow.check_out).slice(0, 10))) {
            return false;
          }
        } else if (coversToday) {
          return false;
        }
      }
      return true;
    };

    let allocatedRoomNumber =
      existingRes?.room_number ||
      existingRes?.room?.match(/\b(\d+)\b/)?.[1] ||
      "";

    // Re-validate existing room if modify changed dates
    if (allocatedRoomNumber) {
      const matchedExistingRoom = roomsList.find((r: any) => String(r.room_number) === String(allocatedRoomNumber));
      if (matchedExistingRoom && !isRoomFreeForDates(matchedExistingRoom)) {
        allocatedRoomNumber = "";
      }
    }

    if (!allocatedRoomNumber) {
      const catTarget = pmsRoomType.toLowerCase();
      const codeTarget = rawRoomCode.toLowerCase();

      const categoryMatchRoom = roomsList.find((r: any) => {
        const t = String(r.type || "").toLowerCase();
        const typeMatches =
          t === catTarget ||
          t.includes(catTarget) ||
          catTarget.includes(t) ||
          t.includes(codeTarget);
        return typeMatches && isRoomFreeForDates(r);
      });

      const freeRoom = categoryMatchRoom || roomsList.find((r: any) => isRoomFreeForDates(r));
      if (freeRoom) {
        allocatedRoomNumber = String(freeRoom.room_number);
      }
    }

    if (!allocatedRoomNumber) {
      return jsonResponse(
        {
          success: false,
          code: "NO_INVENTORY",
          message: `No available room in '${pmsRoomType}' for ${checkIn} to ${checkOut}.`,
          bookingId
        },
        409
      );
    }

    // Lock room row immediately only when active stay covers today; future bookings remain locked by date range
    if (coversToday) {
      await supabase
        .from("rooms")
        .update({
          status: "OCCUPIED",
          guest: guestName,
          booking_id: bookingId,
          check_out: checkOut,
          is_ota_locked: true,
          ota_channel: channel,
          updated_at: new Date().toISOString()
        })
        .eq("hotel_id", resolvedHotelId)
        .eq("room_number", allocatedRoomNumber);
    }

    const reservationPayload: Record<string, unknown> = {
      id: bookingId,
      hotel_id: resolvedHotelId,
      cm_booking_id: payload.cmBookingId || bookingId,
      guest: guestName,
      guest_email: guest.email || null,
      guest_phone: guest.phone || null,
      guest_country: guest.address?.country || "India",
      room: `Room ${allocatedRoomNumber}`,
      room_number: allocatedRoomNumber,
      room_type: pmsRoomType,
      check_in: checkIn,
      check_out: checkOut,
      adults: Number(firstRoom.occupancy?.adults) || 1,
      children: Number(firstRoom.occupancy?.children) || 0,
      rate_plan: firstRoom.rateplanCode || "EP - Room Only",
      source: `${channel} (Aiosell Channel Manager)`,
      amount: totalAmount,
      paid: paidAmount,
      advance_paid: paidAmount,
      payment_mode: isPayAtHotel ? "Pay at Hotel (Cash/Card/UPI)" : "Prepaid (OTA Virtual Card)",
      payment: isPayAtHotel ? "PENDING" : "PAID",
      status: "CONFIRMED",
      special_requests: specialRequests,
      notes: `OTA Booking ${bookingId} via ${channel} (${checkIn} -> ${checkOut}). Locked Room ${allocatedRoomNumber}.`
    };

    const { error: upsertErr } = await supabase.from("reservations").upsert(reservationPayload);
    if (upsertErr) {
      return jsonResponse({ success: false, message: `Reservation save error: ${upsertErr.message}` }, 500);
    }

    await broadcastRealtimeSync({
      action,
      hotelId: resolvedHotelId,
      bookingId,
      channel,
      allocatedRoom: allocatedRoomNumber,
      checkIn,
      checkOut,
      guestName
    });

    return jsonResponse(
      {
        success: true,
        message: action === "modify" ? "Reservation Modified Successfully" : "Reservation Updated Successfully",
        bookingId,
        allocatedRoom: allocatedRoomNumber,
        status: "CONFIRMED"
      },
      200
    );
  } catch (err: any) {
    console.error("[aiosell-webhook] Error:", err);
    return jsonResponse({ success: false, message: err?.message || "Internal webhook error." }, 500);
  }
});
