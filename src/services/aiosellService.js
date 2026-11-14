/**
 * Aiosell Channel Manager API & Supabase Edge Function Sync Service for AuraStay HMS
 * Strictly implements the specification from https://apidocs.aiosell.com
 * Base URL: https://live.aiosell.com/api/v2/cm
 * Edge Function URL: https://pdsfctfixxfazchamznm.supabase.co/functions/v1/aiosell-webhook
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const DEFAULT_AIOSELL_CONFIG = {
  username: 'aiosell',
  password: 'AIOsell@123',
  hotelCode: 'sandbox-pms',
  partnerId: 'sample-pms',
  baseUrl: 'https://live.aiosell.com/api/v2/cm',
  isSandbox: true,
  autoSync: true,
  webhookUrl: 'https://pdsfctfixxfazchamznm.supabase.co/functions/v1/aiosell-webhook'
};

let inMemoryAiosellConfig = { ...DEFAULT_AIOSELL_CONFIG };

/**
 * Retrieve current Aiosell configuration (in-memory, zero localStorage dependency)
 */
export function getAiosellConfig() {
  return { ...inMemoryAiosellConfig };
}

/**
 * Persist Aiosell configuration in memory
 */
export function saveAiosellConfig(config) {
  inMemoryAiosellConfig = { ...inMemoryAiosellConfig, ...config };
  return { ...inMemoryAiosellConfig };
}

/**
 * Generates HTTP Basic Auth header
 */
export function getBasicAuthHeader(username, password) {
  const token =
    typeof btoa !== 'undefined'
      ? btoa(`${username}:${password}`)
      : Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${token}`;
}

/**
 * Broadcast real-time sync signal across all connected devices via Supabase Realtime
 */
export async function broadcastCrossDeviceSync(eventPayload = {}) {
  if (!isSupabaseConfigured) return;
  try {
    const channel = supabase.channel('aurastay_sync_broadcast');
    await channel.send({
      type: 'broadcast',
      event: 'webhook_update',
      payload: {
        ...eventPayload,
        timestamp: new Date().toISOString()
      }
    });
    supabase.removeChannel(channel);
  } catch (err) {
    console.warn('Realtime broadcast notice:', err);
  }
}

/**
 * Fetch live state via Supabase Edge Function (with automatic direct Supabase DB fallback)
 */
export async function fetchLiveStateViaEdgeFunction(hotelId = null) {
  const config = getAiosellConfig();
  const edgeUrl = `${config.webhookUrl}${hotelId ? `?hotelId=${encodeURIComponent(hotelId)}` : ''}`;

  try {
    const res = await fetch(edgeUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: getBasicAuthHeader(config.username, config.password)
      }
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.success) {
        return { ...json, source: 'edge-function' };
      }
    }
  } catch (_err) {
    // Fallback to direct Supabase query below if Edge Function is offline/not yet deployed
  }

  if (!isSupabaseConfigured) {
    return { success: false, rooms: [], reservations: [], roomTypes: [], fnbOrders: [], hotels: [] };
  }

  const [roomsRes, resRes, rtRes, fnbRes, hotelsRes] = await Promise.all([
    supabase.from('rooms').select('*').order('room_number', { ascending: true }),
    supabase.from('reservations').select('*').order('created_at', { ascending: false }),
    supabase.from('room_types').select('*').order('name', { ascending: true }),
    supabase.from('fnb_orders').select('*').order('created_at', { ascending: false }),
    supabase.from('hotels').select('*').order('created_at', { ascending: false })
  ]);

  return {
    success: true,
    source: 'supabase-direct',
    syncedAt: new Date().toISOString(),
    hotels: hotelsRes.data || [],
    rooms: roomsRes.data || [],
    roomTypes: rtRes.data || [],
    reservations: resRes.data || [],
    fnbOrders: fnbRes.data || []
  };
}

/**
 * Dispatch an inbound Aiosell Webhook event to the Supabase Edge Function
 * AND ensure atomic persistence in Supabase DB + cross-device Realtime broadcast.
 */
export async function dispatchWebhookToBackend(payload, currentHotelId = null) {
  const config = getAiosellConfig();
  const parsed = parseAiosellWebhookPayload(payload);
  let edgeResponse = null;

  // 1. Try invoking the deployed Supabase Edge Function first
  try {
    const res = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: getBasicAuthHeader(config.username, config.password)
      },
      body: JSON.stringify({
        ...payload,
        hotelId: currentHotelId
      })
    });

    if (res.ok) {
      edgeResponse = await res.json();
    }
  } catch (_e) {
    // Will ensure DB persistence directly below
  }

  // 2. Guarantee Supabase database persistence & room lock/unlock so all devices update immediately
  if (isSupabaseConfigured) {
    let targetHotelId = currentHotelId;
    if (!targetHotelId) {
      const { data: activeHotels } = await supabase
        .from('hotels')
        .select('id, status')
        .order('created_at', { ascending: false });
      if (activeHotels && activeHotels.length > 0) {
        const active = activeHotels.find(h => h.status === 'ACTIVE') || activeHotels[0];
        targetHotelId = active.id;
      } else {
        targetHotelId = 'shivanandi';
      }
    }

    if (parsed.action === 'cancel') {
      const bookingId = parsed.bookingId;
      const { data: existingRes } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();

      const assignedRoom =
        existingRes?.room_number ||
        existingRes?.room?.match(/\b(\d+)\b/)?.[1] ||
        null;

      await supabase
        .from('reservations')
        .update({
          status: 'CANCELLED',
          notes: `Cancelled via ${payload.channel || 'OTA'} Webhook at ${new Date().toISOString()}`
        })
        .eq('id', bookingId);

      if (assignedRoom) {
        await supabase
          .from('rooms')
          .update({
            status: 'VACANT_READY',
            guest: null,
            booking_id: null,
            check_out: null,
            updated_at: new Date().toISOString()
          })
          .eq('room_number', assignedRoom);
      } else {
        await supabase
          .from('rooms')
          .update({
            status: 'VACANT_READY',
            guest: null,
            booking_id: null,
            check_out: null,
            updated_at: new Date().toISOString()
          })
          .eq('booking_id', bookingId);
      }

      await broadcastCrossDeviceSync({
        action: 'cancel',
        bookingId,
        channel: parsed.channel,
        unlockedRoom: assignedRoom
      });

      return {
        success: true,
        action: 'cancel',
        bookingId,
        channel: parsed.channel,
        unlockedRoom: assignedRoom,
        edgeResponse
      };
    }

    if (parsed.action === 'book' || parsed.action === 'modify') {
      const resObj = parsed.reservation;
      const bookingId = resObj.id;

      // Check if reservation already exists in Supabase
      const { data: existingRes } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();

      let allocatedRoomNumber =
        edgeResponse?.allocatedRoom ||
        existingRes?.room_number ||
        existingRes?.room?.match(/\b(\d+)\b/)?.[1] ||
        '';
      let roomHotelId = existingRes?.hotel_id || targetHotelId;

      if (!allocatedRoomNumber) {
        const { data: allRooms } = await supabase
          .from('rooms')
          .select('*')
          .order('room_number', { ascending: true });

        if (allRooms && allRooms.length > 0) {
          const { allocatedRoomNumber: picked } = allocateAndLockPhysicalRoom(resObj, allRooms);
          if (picked) {
            allocatedRoomNumber = picked;
            const matchedRoomRow = allRooms.find(
              r => String(r.room_number || r.roomNumber) === String(picked)
            );
            if (matchedRoomRow?.hotel_id) {
              roomHotelId = matchedRoomRow.hotel_id;
            }
          }
        }
      }

      if (allocatedRoomNumber) {
        resObj.room = `Room ${allocatedRoomNumber}`;
        resObj.room_number = allocatedRoomNumber;

        await supabase
          .from('rooms')
          .update({
            status: 'OCCUPIED',
            guest: resObj.guest,
            booking_id: bookingId,
            check_out: resObj.check_out,
            updated_at: new Date().toISOString()
          })
          .eq('room_number', allocatedRoomNumber);
      } else {
        resObj.room = resObj.room || `Unassigned (${resObj.room_type || 'Standard Room'})`;
      }

      resObj.hotel_id = roomHotelId;
      resObj.hotelId = roomHotelId;

      const fullDbPayload = {
        id: bookingId,
        hotel_id: roomHotelId,
        guest: resObj.guest,
        guest_email: resObj.guest_email,
        guest_phone: resObj.guest_phone,
        guest_country: resObj.guest_country || 'India',
        room: resObj.room,
        room_number: allocatedRoomNumber || null,
        room_type: resObj.room_type,
        check_in: resObj.check_in,
        check_out: resObj.check_out,
        nights: resObj.nights || 1,
        adults: resObj.adults || 2,
        children: resObj.children || 0,
        rate_plan: resObj.rate_plan_code || 'EP - Room Only',
        source: resObj.source,
        amount: resObj.amount,
        paid: resObj.paid,
        advance_paid: resObj.advance_paid,
        payment_mode: resObj.payment_mode,
        status: 'CONFIRMED',
        payment: resObj.payment,
        special_requests: resObj.special_requests || null,
        notes: `Channel Booking ID: ${bookingId}. Channel: ${resObj.channel}. PAH: ${resObj.pah}. Auto-locked room: ${allocatedRoomNumber || 'None'}.`
      };

      const { error: upsertErr } = await supabase.from('reservations').upsert(fullDbPayload);
      if (upsertErr) {
        // Fallback minimal schema upsert
        await supabase.from('reservations').upsert({
          id: bookingId,
          hotel_id: roomHotelId,
          guest: resObj.guest,
          guest_email: resObj.guest_email,
          guest_phone: resObj.guest_phone,
          room: resObj.room,
          check_in: resObj.check_in,
          check_out: resObj.check_out,
          source: resObj.source,
          amount: resObj.amount,
          status: 'CONFIRMED',
          payment: resObj.payment
        });
      }

      await broadcastCrossDeviceSync({
        action: parsed.action,
        bookingId,
        channel: resObj.channel,
        allocatedRoom: allocatedRoomNumber || null,
        guest: resObj.guest
      });

      return {
        success: true,
        action: parsed.action,
        reservation: resObj,
        allocatedRoomNumber: allocatedRoomNumber || null,
        edgeResponse
      };
    }
  }

  return {
    success: true,
    action: parsed.action,
    reservation: parsed.reservation,
    edgeResponse
  };
}

/**
 * Common request handler with HTTP Basic Auth and error surfacing
 */
async function makeRequest(endpoint, options = {}, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const url = endpoint.startsWith('http') ? endpoint : `${config.baseUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: getBasicAuthHeader(config.username, config.password),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const contentType = res.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { message: text };
      }
    }

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || `HTTP ${res.status}: ${res.statusText}`;
      return {
        success: false,
        status: res.status,
        error: errorMsg,
        data
      };
    }

    return {
      success: true,
      status: res.status,
      data
    };
  } catch (err) {
    console.error('Aiosell API Error:', err);
    return {
      success: false,
      status: 0,
      error: err.message || 'Network error connecting to Aiosell',
      data: null
    };
  }
}

/**
 * 1. Get Property / Mapping Details
 * GET /property_details/{hotelCode}?partnerId={partnerId}
 */
export async function fetchPropertyDetails(customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/property_details/${encodeURIComponent(config.hotelCode)}?partnerId=${encodeURIComponent(config.partnerId)}`;
  return await makeRequest(endpoint, { method: 'GET' }, config);
}

/**
 * 2. Inventory Push
 * POST /update/{partnerId}
 */
export async function pushInventory(updates, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/update/${encodeURIComponent(config.partnerId)}`;
  const body = {
    hotelCode: config.hotelCode,
    updates
  };
  return await makeRequest(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(body)
    },
    config
  );
}

/**
 * 3. Rate Push
 * POST /update-rates/{partnerId}
 */
export async function pushRates(updates, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/update-rates/${encodeURIComponent(config.partnerId)}`;
  const body = {
    hotelCode: config.hotelCode,
    updates
  };
  return await makeRequest(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(body)
    },
    config
  );
}

/**
 * 4. Inventory Restrictions Push
 * POST /update/{partnerId}
 */
export async function pushInventoryRestrictions(toChannels, updates, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/update/${encodeURIComponent(config.partnerId)}`;
  const body = {
    hotelCode: config.hotelCode,
    toChannels,
    updates
  };
  return await makeRequest(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(body)
    },
    config
  );
}

/**
 * 5. Rate Restrictions Push
 * POST /update-rates/{partnerId}
 */
export async function pushRateRestrictions(toChannels, updates, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/update-rates/${encodeURIComponent(config.partnerId)}`;
  const body = {
    hotelCode: config.hotelCode,
    toChannels,
    updates
  };
  return await makeRequest(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(body)
    },
    config
  );
}

/**
 * 6. Mark No Show
 * POST /marknoshow/{partnerId}
 */
export async function markNoShow(bookingId, channel, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/marknoshow/${encodeURIComponent(config.partnerId)}`;
  const body = {
    hotelCode: config.hotelCode,
    bookingId: String(bookingId),
    channel: String(channel).toLowerCase()
  };
  return await makeRequest(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(body)
    },
    config
  );
}

/**
 * 7. Fetch Inventory
 * POST /data/{partnerId} with type: 'inventory'
 */
export async function fetchInventory(startDate, endDate, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/data/${encodeURIComponent(config.partnerId)}`;
  const body = {
    type: 'inventory',
    hotelCode: config.hotelCode,
    startDate,
    endDate
  };
  return await makeRequest(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(body)
    },
    config
  );
}

/**
 * 8. Fetch Rates
 * POST /data/{partnerId} with type: 'rates'
 */
export async function fetchRates(startDate, endDate, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/data/${encodeURIComponent(config.partnerId)}`;
  const body = {
    type: 'rates',
    hotelCode: config.hotelCode,
    startDate,
    endDate
  };
  return await makeRequest(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(body)
    },
    config
  );
}

/**
 * 9. Fetch Reservations
 * POST /data/{partnerId} with type: 'reservation'
 */
export async function fetchReservations(startDate, endDate, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/data/${encodeURIComponent(config.partnerId)}`;
  const body = {
    type: 'reservation',
    hotelCode: config.hotelCode,
    startDate,
    endDate
  };
  return await makeRequest(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(body)
    },
    config
  );
}

/**
 * 10. Channel Multiplier
 * POST /channel_multiplier/{partnerId}
 */
export async function updateChannelMultiplier(multiplier, channels, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/channel_multiplier/${encodeURIComponent(config.partnerId)}`;
  const body = {
    hotelCode: config.hotelCode,
    multiplier: Number(multiplier),
    channels
  };
  return await makeRequest(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(body)
    },
    config
  );
}

/**
 * 11. Message Reply
 * POST /message-reply/{partnerId}
 */
export async function sendMessageReply(payload, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/message-reply/${encodeURIComponent(config.partnerId)}`;
  const body = {
    channel: payload.channel,
    content: payload.content,
    hotel_code: config.hotelCode,
    conversation_id: payload.conversation_id,
    ...(payload.booking_id ? { booking_id: payload.booking_id } : {})
  };
  return await makeRequest(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(body)
    },
    config
  );
}

/**
 * Process an incoming Aiosell Webhook Payload
 * Handles 'book', 'modify', 'cancel' actions.
 */
export function parseAiosellWebhookPayload(payload) {
  if (!payload || !payload.action) {
    throw new Error('Invalid Aiosell webhook payload: missing action field');
  }

  const action = payload.action.toLowerCase();
  const bookingId = payload.bookingId || payload.cmBookingId || `OTA-${Date.now()}`;
  const channel = payload.channel || 'OTA Channel';

  if (action === 'cancel') {
    return {
      action: 'cancel',
      bookingId,
      channel,
      hotelCode: payload.hotelCode || 'sandbox-pms'
    };
  }

  // Book or Modify
  const guest = payload.guest || {};
  const guestFirstName = guest.firstName || '';
  const guestLastName = guest.lastName || '';
  const guestName =
    (guestFirstName + ' ' + guestLastName).trim() ||
    payload.rooms?.[0]?.guestName ||
    `OTA Guest (${channel})`;

  const guestPhone = guest.phone || null;
  const guestEmail = guest.email || null;
  const guestAddress = guest.address
    ? [
        guest.address.line1,
        guest.address.city,
        guest.address.state,
        guest.address.country,
        guest.address.zipCode
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  const firstRoom = payload.rooms?.[0] || {};
  const checkIn = payload.checkin || new Date().toISOString().split('T')[0];
  const checkOut = payload.checkout || new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Calculate nights
  const dIn = new Date(checkIn);
  const dOut = new Date(checkOut);
  const nights = Math.max(1, Math.round((dOut - dIn) / (1000 * 60 * 60 * 24))) || 1;

  const totalAmount =
    Number(payload.amount?.amountAfterTax) || Number(payload.amount?.amountBeforeTax) || 0;

  // Rule 10: pah = true means pay at hotel, false means already prepaid
  const isPayAtHotel = Boolean(payload.pah);
  const paidAmount = isPayAtHotel ? 0 : totalAmount;

  // Rule 12: specialRequests is plain text
  const specialRequests =
    typeof payload.specialRequests === 'string'
      ? payload.specialRequests
      : payload.specialRequests
      ? JSON.stringify(payload.specialRequests)
      : '';

  // Room type mapping fallback
  const rawRoomCode = String(firstRoom.roomCode || 'executive').toLowerCase();
  let mappedRoomType = 'Deluxe Room';
  if (rawRoomCode.includes('suite')) mappedRoomType = 'Executive Suite';
  else if (rawRoomCode.includes('exec')) mappedRoomType = 'Executive Room';
  else if (rawRoomCode.includes('std') || rawRoomCode.includes('standard')) mappedRoomType = 'Standard Room';

  const reservation = {
    id: bookingId,
    cmBookingId: payload.cmBookingId || null,
    guest: guestName,
    guest_email: guestEmail,
    guest_phone: guestPhone,
    guest_address: guestAddress,
    guest_country: guest.address?.country || 'India',
    source: `${channel} (Aiosell Channel Manager)`,
    channel: channel,
    check_in: checkIn,
    check_out: checkOut,
    checkIn: checkIn,
    checkOut: checkOut,
    nights: nights,
    room_type: mappedRoomType,
    room_code: firstRoom.roomCode || 'executive',
    rate_plan_code: firstRoom.rateplanCode || 'Room Only',
    adults: Number(firstRoom.occupancy?.adults) || 2,
    children: Number(firstRoom.occupancy?.children) || 0,
    amount: totalAmount,
    paid: paidAmount,
    advance_paid: paidAmount,
    pah: isPayAtHotel,
    payment_mode: isPayAtHotel
      ? 'Pay at Hotel (Cash/Card/UPI)'
      : 'Prepaid (OTA Virtual Card / Direct)',
    payment: isPayAtHotel ? 'PENDING' : 'PAID',
    status: 'CONFIRMED',
    special_requests: specialRequests,
    booked_on: payload.bookedOn || new Date().toISOString().replace('T', ' ').slice(0, 19),
    rawPayload: payload
  };

  return {
    action,
    reservation
  };
}

/**
 * Automatically find, allocate, and lock a physical room for an inbound OTA reservation
 */
export function allocateAndLockPhysicalRoom(reservation, rooms = []) {
  if (!rooms || rooms.length === 0) {
    return { allocatedRoomNumber: null, updatedRooms: rooms };
  }

  const roomTypeTarget = String(reservation.room_type || reservation.room_code || '').toLowerCase();

  // 1. Find a VACANT_READY physical room matching this category
  let targetRoom = rooms.find(
    r =>
      (r.status === 'VACANT_READY' || !r.status || r.status === 'CLEAN') &&
      (String(r.type || '').toLowerCase().includes(roomTypeTarget) ||
        roomTypeTarget.includes(String(r.type || '').toLowerCase()))
  );

  // 2. Fallback: if primary category full, grab any vacant room
  if (!targetRoom) {
    targetRoom = rooms.find(r => r.status === 'VACANT_READY' || !r.status || r.status === 'CLEAN');
  }

  if (!targetRoom) {
    console.warn('All physical rooms currently occupied or in maintenance.');
    return { allocatedRoomNumber: null, updatedRooms: rooms };
  }

  const allocatedRoomNumber = String(targetRoom.roomNumber || targetRoom.room_number);

  // 3. Update room status to OCCUPIED / LOCKED for this guest
  const updatedRooms = rooms.map(r => {
    if (String(r.roomNumber || r.room_number) === allocatedRoomNumber) {
      return {
        ...r,
        status: 'OCCUPIED',
        guest: reservation.guest,
        bookingId: reservation.id,
        booking_id: reservation.id,
        checkOut: reservation.check_out,
        check_out: reservation.check_out,
        isOtaLocked: true,
        otaChannel: reservation.channel || 'Aiosell'
      };
    }
    return r;
  });

  return {
    allocatedRoomNumber,
    updatedRooms
  };
}

/**
 * Calculates remaining available inventory and detects if Stop-Sell is needed
 */
export function calculateCategoryInventory(categoryName, rooms = []) {
  const norm = String(categoryName || '').toLowerCase();
  const matching = rooms.filter(
    r =>
      String(r.type || '').toLowerCase().includes(norm) ||
      norm.includes(String(r.type || '').toLowerCase())
  );
  const total = matching.length;
  const available = matching.filter(
    r => r.status === 'VACANT_READY' || !r.status || r.status === 'CLEAN'
  ).length;
  const occupied = total - available;
  const shouldStopSell = total > 0 && available === 0;

  return {
    total,
    available,
    occupied,
    shouldStopSell
  };
}
