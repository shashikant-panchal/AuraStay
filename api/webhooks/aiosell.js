/**
 * Aiosell Inbound Reservation & Live Sync Webhook Endpoint
 * Methods: GET (live state sync), POST ('book', 'modify', 'cancel', 'sync')
 * URL: /api/webhooks/aiosell
 */

import { timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const AIOSELL_USERNAME = process.env.AIOSELL_WEBHOOK_USERNAME || process.env.AAVASA_WEBHOOK_USERNAME || '';
const AIOSELL_PASSWORD = process.env.AIOSELL_WEBHOOK_PASSWORD || process.env.AAVASA_WEBHOOK_PASSWORD || '';

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

function timingSafeEquals(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(String(a), 'utf8');
  const bufB = Buffer.from(String(b), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function verifyWebhookAuth(req) {
  const authHeader = String(req.headers.authorization || req.headers.Authorization || '');
  if (authHeader.startsWith('Bearer ') && supabaseServiceKey) {
    const token = authHeader.slice(7).trim();
    if (timingSafeEquals(token, supabaseServiceKey)) {
      return { ok: true };
    }
    return { ok: false, status: 401, message: 'Invalid Bearer token.' };
  }

  if (!AIOSELL_USERNAME || !AIOSELL_PASSWORD) {
    return {
      ok: false,
      status: 503,
      message: 'Webhook credentials are not configured on server.'
    };
  }

  if (!authHeader.startsWith('Basic ')) {
    return { ok: false, status: 401, message: 'Missing HTTP Basic Authorization header.' };
  }

  try {
    const decoded = Buffer.from(authHeader.slice(6).trim(), 'base64').toString('utf8');
    const sepIdx = decoded.indexOf(':');
    const user = sepIdx >= 0 ? decoded.slice(0, sepIdx) : decoded;
    const pass = sepIdx >= 0 ? decoded.slice(sepIdx + 1) : '';
    if (!timingSafeEquals(user, AIOSELL_USERNAME) || !timingSafeEquals(pass, AIOSELL_PASSWORD)) {
      return { ok: false, status: 401, message: 'Invalid Aiosell Webhook credentials.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 401, message: 'Malformed Basic Authorization header.' };
  }
}

async function broadcastSync(payload) {
  if (!supabase) return;
  try {
    const channel = supabase.channel('aurastay_sync_broadcast');
    await channel.send({
      type: 'broadcast',
      event: 'webhook_update',
      payload: { ...payload, timestamp: new Date().toISOString() }
    });
    supabase.removeChannel(channel);
  } catch (e) {
    // ignore
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  const authCheck = verifyWebhookAuth(req);
  if (!authCheck.ok) {
    return res.status(authCheck.status).json({ success: false, message: authCheck.message });
  }

  if (req.method === 'GET') {
    if (!supabase) return res.status(503).json({ success: false, message: 'Server database service key not configured' });
    const hotelId = typeof req.query?.hotelId === 'string' ? req.query.hotelId.trim() : '';

    let roomsQ = supabase.from('rooms').select('id, hotel_id, room_number, room_type_id, floor, type, bed, status, price, is_ota_locked, ota_channel, check_out').order('room_number', { ascending: true }).limit(250);
    let resQ = supabase.from('reservations').select('id, hotel_id, guest, room, room_number, room_type, check_in, check_out, status, payment, amount, paid, source, created_at').order('created_at', { ascending: false }).limit(200);
    let rtQ = supabase.from('room_types').select('id, hotel_id, name, label, base_price, is_booking_engine').order('name', { ascending: true }).limit(100);
    let fnbQ = supabase.from('fnb_orders').select('id, hotel_id, room_table, guest, total, status, time, created_at').order('created_at', { ascending: false }).limit(100);
    let hotelsQ = supabase.from('hotels').select('id, slug, name, short_name, city, status, total_rooms, aiosell_hotel_code').order('created_at', { ascending: false }).limit(50);

    if (hotelId) {
      roomsQ = roomsQ.eq('hotel_id', hotelId);
      resQ = resQ.eq('hotel_id', hotelId);
      rtQ = rtQ.eq('hotel_id', hotelId);
      fnbQ = fnbQ.eq('hotel_id', hotelId);
      hotelsQ = hotelsQ.eq('id', hotelId);
    }

    const [roomsRes, resRes, rtRes, fnbRes, hotelsRes] = await Promise.all([roomsQ, resQ, rtQ, fnbQ, hotelsQ]);
    return res.status(200).json({
      success: true,
      syncedAt: new Date().toISOString(),
      hotels: hotelsRes.data || [],
      rooms: roomsRes.data || [],
      roomTypes: rtRes.data || [],
      reservations: resRes.data || [],
      fnbOrders: fnbRes.data || []
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed. Use GET or POST.' });
  }

  if (!supabase) {
    return res.status(503).json({ success: false, message: 'Server database service key not configured' });
  }

  const payload = req.body;
  if (!payload || !payload.action) {
    return res.status(400).json({ success: false, message: 'Malformed payload: missing action field.' });
  }

  const action = String(payload.action).toLowerCase();
  const bookingId = payload.bookingId || payload.cmBookingId || `OTA-${Date.now()}`;
  const channel = payload.channel || 'OTA';

  try {
    if (action === 'cancel') {
      let assignedRoom = null;
      if (supabase && bookingId) {
        const { data: existingRes } = await supabase
          .from('reservations')
          .select('id, hotel_id, room, room_number')
          .eq('id', bookingId)
          .maybeSingle();

        assignedRoom = existingRes?.room_number || existingRes?.room?.match(/\b(\d+)\b/)?.[1] || null;

        await supabase
          .from('reservations')
          .update({ status: 'CANCELLED', notes: `Cancelled via Aiosell webhook (${channel})` })
          .eq('id', bookingId);

        if (assignedRoom) {
          let unlockQ = supabase
            .from('rooms')
            .update({ status: 'VACANT_READY', guest: null, booking_id: null, check_out: null })
            .eq('room_number', assignedRoom);
          if (existingRes?.hotel_id) unlockQ = unlockQ.eq('hotel_id', existingRes.hotel_id);
          await unlockQ;
        } else {
          await supabase
            .from('rooms')
            .update({ status: 'VACANT_READY', guest: null, booking_id: null, check_out: null })
            .eq('booking_id', bookingId);
        }
        await broadcastSync({ action: 'cancel', bookingId, unlockedRoom: assignedRoom });
      }

      return res.status(200).json({
        success: true,
        message: 'Reservation Cancelled Successfully',
        unlockedRoom: assignedRoom
      });
    }

    if (action === 'book' || action === 'modify') {
      const guest = payload.guest || {};
      const guestName =
        [guest.firstName, guest.lastName].filter(Boolean).join(' ').trim() ||
        payload.rooms?.[0]?.guestName ||
        `Guest (${channel})`;

      const firstRoom = payload.rooms?.[0] || {};
      const checkIn = payload.checkin;
      const checkOut = payload.checkout;

      const totalAmount = Number(payload.amount?.amountAfterTax) || Number(payload.amount?.amountBeforeTax) || 0;
      const isPayAtHotel = Boolean(payload.pah);
      const paid = isPayAtHotel ? 0 : totalAmount;

      const specialRequests =
        typeof payload.specialRequests === 'string'
          ? payload.specialRequests
          : payload.specialRequests
          ? JSON.stringify(payload.specialRequests)
          : null;

      let allocatedRoomNumber = '';
      let hotelId = payload.hotelId || payload.hotel_id || 'shivanandi';

      if (supabase) {
        const { data: hotels } = await supabase.from('hotels').select('id, status').order('created_at', { ascending: false });
        if (hotels && hotels.length > 0 && !payload.hotelId) {
          const active = hotels.find(h => h.status === 'ACTIVE') || hotels[0];
          if (active?.id) hotelId = active.id;
        }

        const { data: vacantRooms } = await supabase
          .from('rooms')
          .select('id, hotel_id, room_number, type, status')
          .eq('hotel_id', hotelId)
          .eq('status', 'VACANT_READY')
          .order('room_number', { ascending: true })
          .limit(1);

        if (vacantRooms && vacantRooms.length > 0) {
          allocatedRoomNumber = vacantRooms[0].room_number;
          if (vacantRooms[0].hotel_id) hotelId = vacantRooms[0].hotel_id;
          await supabase
            .from('rooms')
            .update({
              status: 'OCCUPIED',
              guest: guestName,
              booking_id: bookingId,
              check_out: checkOut
            })
            .eq('room_number', allocatedRoomNumber);
        }
      }

      const reservationRecord = {
        id: bookingId,
        hotel_id: hotelId,
        guest: guestName,
        guest_email: guest.email || null,
        guest_phone: guest.phone || null,
        source: `${channel} (Aiosell Channel Manager)`,
        room: allocatedRoomNumber ? `Room ${allocatedRoomNumber}` : `Unassigned (${firstRoom.roomCode || 'Standard Room'})`,
        room_number: allocatedRoomNumber || null,
        check_in: checkIn,
        check_out: checkOut,
        room_type: firstRoom.roomCode || 'Standard Room',
        adults: Number(firstRoom.occupancy?.adults) || 1,
        children: Number(firstRoom.occupancy?.children) || 0,
        amount: totalAmount,
        paid: paid,
        advance_paid: paid,
        status: 'CONFIRMED',
        payment: isPayAtHotel ? 'PENDING' : 'PAID',
        notes: specialRequests
      };

      if (supabase && bookingId) {
        const { error } = await supabase.from('reservations').upsert(reservationRecord);
        if (error) {
          await supabase.from('reservations').upsert({
            id: bookingId,
            hotel_id: hotelId,
            guest: guestName,
            guest_email: guest.email || null,
            guest_phone: guest.phone || null,
            room: reservationRecord.room,
            check_in: checkIn,
            check_out: checkOut,
            source: reservationRecord.source,
            amount: totalAmount,
            status: 'CONFIRMED',
            payment: isPayAtHotel ? 'PENDING' : 'PAID'
          });
        }
        await broadcastSync({ action, bookingId, allocatedRoom: allocatedRoomNumber || null });
      }

      const responseMessage =
        action === 'modify' ? 'Reservation Modified Successfully' : 'Reservation Updated Successfully';

      return res.status(200).json({
        success: true,
        message: responseMessage,
        allocatedRoom: allocatedRoomNumber || null
      });
    }

    return res.status(400).json({
      success: false,
      message: `Unsupported action '${action}'. Expected book, modify, or cancel.`
    });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal webhook processing error'
    });
  }
}
