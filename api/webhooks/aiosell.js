/**
 * Aiosell Inbound Reservation Webhook Endpoint
 * Method: POST
 * URL: /api/webhooks/aiosell
 * Strictly handles 'book', 'modify', 'cancel' per https://apidocs.aiosell.com
 */

import { createClient } from '@supabase/supabase-js';

const AIOSELL_USERNAME = process.env.AIOSELL_WEBHOOK_USERNAME || 'aiosell';
const AIOSELL_PASSWORD = process.env.AIOSELL_WEBHOOK_PASSWORD || 'AIOsell@123';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed. Use POST.' });
  }

  // 1. Validate HTTP Basic Authentication
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if (!authHeader.startsWith('Basic ')) {
    return res.status(401).json({ success: false, message: 'Missing Authorization: Basic header.' });
  }

  const credentials = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString('utf8');
  const [user, pass] = credentials.split(':');

  if (user !== AIOSELL_USERNAME || pass !== AIOSELL_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Invalid Aiosell Webhook credentials.' });
  }

  const payload = req.body;
  if (!payload || !payload.action) {
    return res.status(400).json({ success: false, message: 'Malformed payload: missing action field.' });
  }

  const action = String(payload.action).toLowerCase();
  const bookingId = payload.bookingId || payload.cmBookingId;
  const channel = payload.channel || 'OTA';

  try {
    if (action === 'cancel') {
      // Cancel reservation
      if (supabase && bookingId) {
        await supabase
          .from('reservations')
          .update({ status: 'CANCELLED', notes: `Cancelled via Aiosell webhook (${channel})` })
          .eq('id', bookingId);
      }

      return res.status(200).json({
        success: true,
        message: 'Reservation Cancelled Successfully'
      });
    }

    if (action === 'book' || action === 'modify') {
      const guest = payload.guest || {};
      const guestName = [guest.firstName, guest.lastName].filter(Boolean).join(' ').trim() ||
        payload.rooms?.[0]?.guestName ||
        `Guest (${channel})`;

      const firstRoom = payload.rooms?.[0] || {};
      const checkIn = payload.checkin;
      const checkOut = payload.checkout;

      const totalAmount = Number(payload.amount?.amountAfterTax) || Number(payload.amount?.amountBeforeTax) || 0;
      const isPayAtHotel = Boolean(payload.pah);
      const paid = isPayAtHotel ? 0 : totalAmount;

      const specialRequests = typeof payload.specialRequests === 'string'
        ? payload.specialRequests
        : (payload.specialRequests ? JSON.stringify(payload.specialRequests) : null);

      const reservationRecord = {
        id: bookingId,
        guest: guestName,
        guest_email: guest.email || null,
        guest_phone: guest.phone || null,
        source: `${channel} (Aiosell)`,
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
        // Upsert reservation (idempotent on bookingId)
        await supabase.from('reservations').upsert(reservationRecord);
      }

      const responseMessage = action === 'modify'
        ? 'Reservation Modified Successfully'
        : 'Reservation Updated Successfully';

      return res.status(200).json({
        success: true,
        message: responseMessage
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
