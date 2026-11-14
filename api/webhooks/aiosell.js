/**
 * Aiosell Inbound Reservation & Live Sync Webhook Endpoint
 * Methods: GET (live state sync), POST ('book', 'modify', 'cancel', 'sync')
 * URL: /api/webhooks/aiosell
 */

import { createClient } from '@supabase/supabase-js';

const AIOSELL_USERNAME = process.env.AIOSELL_WEBHOOK_USERNAME || 'aiosell';
const AIOSELL_PASSWORD = process.env.AIOSELL_WEBHOOK_PASSWORD || 'AIOsell@123';

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://pdsfctfixxfazchamznm.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_qbJiyQ6eiAtwvQA17pG9cg_8bHn3uWi';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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

  if (req.method === 'GET') {
    if (!supabase) return res.status(500).json({ success: false, message: 'Supabase not configured' });
    const [roomsRes, resRes, rtRes, fnbRes, hotelsRes] = await Promise.all([
      supabase.from('rooms').select('*').order('room_number', { ascending: true }),
      supabase.from('reservations').select('*').order('created_at', { ascending: false }),
      supabase.from('room_types').select('*').order('name', { ascending: true }),
      supabase.from('fnb_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('hotels').select('*').order('created_at', { ascending: false })
    ]);
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

  // Validate HTTP Basic Authentication or Bearer / apikey
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const apiKeyHeader = req.headers.apikey || '';
  if (authHeader.startsWith('Basic ')) {
    const credentials = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString('utf8');
    const [user, pass] = credentials.split(':');
    if (user !== AIOSELL_USERNAME || pass !== AIOSELL_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Invalid Aiosell Webhook credentials.' });
    }
  } else if (!authHeader.startsWith('Bearer ') && !apiKeyHeader) {
    return res.status(401).json({ success: false, message: 'Missing Authorization header.' });
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
          .select('*')
          .eq('id', bookingId)
          .maybeSingle();

        assignedRoom = existingRes?.room_number || existingRes?.room?.match(/\b(\d+)\b/)?.[1] || null;

        await supabase
          .from('reservations')
          .update({ status: 'CANCELLED', notes: `Cancelled via Aiosell webhook (${channel})` })
          .eq('id', bookingId);

        if (assignedRoom) {
          await supabase
            .from('rooms')
            .update({ status: 'VACANT_READY', guest: null, booking_id: null, check_out: null })
            .eq('room_number', assignedRoom);
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
          .select('*')
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
