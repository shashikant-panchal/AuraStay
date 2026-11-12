import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Aiosell Webhook Authentication Credentials (Set in Supabase Secrets or default to Sandbox)
const AIOSELL_USERNAME = Deno.env.get("AIOSELL_WEBHOOK_USERNAME") || "aiosell";
const AIOSELL_PASSWORD = Deno.env.get("AIOSELL_WEBHOOK_PASSWORD") || "AIOsell@123";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://pdsfctfixxfazchamznm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders, status: 200 });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use POST." }), {
      headers: corsHeaders,
      status: 405
    });
  }

  // 2. Validate HTTP Basic Auth Header
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Basic ")) {
    return new Response(JSON.stringify({ success: false, message: "Missing Authorization: Basic header." }), {
      headers: corsHeaders,
      status: 401
    });
  }

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

  // 3. Parse JSON Body
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
  const bookingId = payload.bookingId || payload.cmBookingId || `OTA-${Date.now()}`;
  const channel = payload.channel || "OTA Channel";
  const hotelCode = payload.hotelCode || "sandbox-pms";

  console.log(`[Aiosell Webhook] Received ${action} for booking ${bookingId} from channel ${channel}`);

  try {
    // -------------------------------------------------------------
    // ACTION: CANCEL
    // -------------------------------------------------------------
    if (action === "cancel") {
      // 1. Fetch reservation to find the locked room
      const { data: existingRes } = await supabase
        .from("reservations")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle();

      // 2. Mark reservation CANCELLED
      await supabase
        .from("reservations")
        .update({
          status: "CANCELLED",
          notes: `Cancelled by guest on ${channel} (via Aiosell Webhook at ${new Date().toISOString()})`
        })
        .eq("id", bookingId);

      // 3. Unlock physical room if one was assigned
      const assignedRoom = existingRes?.room_number || existingRes?.room?.match(/\\b(\\d+)\\b/)?.[1];
      if (assignedRoom) {
        await supabase
          .from("rooms")
          .update({
            status: "VACANT_READY",
            guest: null,
            booking_id: null,
            check_out: null,
            updated_at: new Date().toISOString()
          })
          .eq("room_number", assignedRoom);
        
        console.log(`[Aiosell Webhook] Unlocked room ${assignedRoom} due to cancellation.`);
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Reservation Cancelled Successfully"
      }), {
        headers: corsHeaders,
        status: 200
      });
    }

    // -------------------------------------------------------------
    // ACTION: BOOK or MODIFY
    // -------------------------------------------------------------
    if (action === "book" || action === "modify") {
      const guest = payload.guest || {};
      const guestName = [guest.firstName, guest.lastName].filter(Boolean).join(" ").trim() ||
        payload.rooms?.[0]?.guestName ||
        `Guest (${channel})`;

      const firstRoom = payload.rooms?.[0] || {};
      const rawRoomCode = String(firstRoom.roomCode || "executive").toLowerCase();
      
      // Map Aiosell room code to PMS Room Category
      let pmsRoomType = "Deluxe Room";
      if (rawRoomCode.includes("suite")) pmsRoomType = "Suite";
      else if (rawRoomCode.includes("exec")) pmsRoomType = "Executive Room";
      else if (rawRoomCode.includes("std") || rawRoomCode.includes("standard")) pmsRoomType = "Standard Room";

      const checkIn = payload.checkin;
      const checkOut = payload.checkout;

      // Rule 10: pah flag (true = collect at hotel, false = prepaid)
      const isPayAtHotel = Boolean(payload.pah);
      const totalAmount = Number(payload.amount?.amountAfterTax) || Number(payload.amount?.amountBeforeTax) || 0;
      const paidAmount = isPayAtHotel ? 0 : totalAmount;

      // Rule 12: specialRequests is plain text
      const specialRequests = typeof payload.specialRequests === "string"
        ? payload.specialRequests
        : (payload.specialRequests ? JSON.stringify(payload.specialRequests) : null);

      // -----------------------------------------------------------
      // AUTOMATIC PHYSICAL ROOM ALLOCATION & LOCKING
      // -----------------------------------------------------------
      let allocatedRoomNumber = "";
      
      // Step A: Find an available vacant physical room matching the room category
      const { data: availableRooms } = await supabase
        .from("rooms")
        .select("*")
        .or(`type.ilike.%${pmsRoomType}%,type.ilike.%${rawRoomCode}%`)
        .eq("status", "VACANT_READY")
        .order("room_number", { ascending: true })
        .limit(1);

      if (availableRooms && availableRooms.length > 0) {
        allocatedRoomNumber = availableRooms[0].room_number;
      } else {
        // Fallback: search any vacant room if primary category full
        const { data: anyVacant } = await supabase
          .from("rooms")
          .select("*")
          .eq("status", "VACANT_READY")
          .order("room_number", { ascending: true })
          .limit(1);
        if (anyVacant && anyVacant.length > 0) {
          allocatedRoomNumber = anyVacant[0].room_number;
        }
      }

      // Step B: Lock the physical room in the database
      if (allocatedRoomNumber) {
        await supabase
          .from("rooms")
          .update({
            status: "OCCUPIED",
            guest: guestName,
            booking_id: bookingId,
            check_out: checkOut,
            updated_at: new Date().toISOString()
          })
          .eq("room_number", allocatedRoomNumber);

        console.log(`[Aiosell Webhook] LOCKED room ${allocatedRoomNumber} for booking ${bookingId} (${guestName})`);
      }

      // Step C: Upsert reservation record into reservations table
      const reservationRecord = {
        id: bookingId,
        hotel_id: "hotel_aurastay_01",
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
        notes: `Channel Booking ID: ${bookingId}. Channel: ${channel}. PAH: ${isPayAtHotel}. Auto-locked room: ${allocatedRoomNumber || "None"}.`,
        updated_at: new Date().toISOString()
      };

      const { error: upsertErr } = await supabase
        .from("reservations")
        .upsert(reservationRecord);

      if (upsertErr) {
        console.error("[Aiosell Webhook] Database upsert error:", upsertErr);
      }

      const responseMessage = action === "modify"
        ? "Reservation Modified Successfully"
        : "Reservation Updated Successfully";

      return new Response(JSON.stringify({
        success: true,
        message: responseMessage,
        allocatedRoom: allocatedRoomNumber || null
      }), {
        headers: corsHeaders,
        status: 200
      });
    }

    return new Response(JSON.stringify({
      success: false,
      message: `Unsupported action '${action}'. Expected book, modify, or cancel.`
    }), {
      headers: corsHeaders,
      status: 400
    });
  } catch (err: any) {
    console.error("[Aiosell Webhook Exception]:", err);
    return new Response(JSON.stringify({
      success: false,
      message: err.message || "Internal server error processing Aiosell webhook."
    }), {
      headers: corsHeaders,
      status: 500
    });
  }
});
