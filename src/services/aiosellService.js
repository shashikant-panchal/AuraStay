/**
 * Aiosell Channel Manager API & Supabase Edge Function Sync Service for AuraStay HMS
 * Strictly implements the specification from https://apidocs.aiosell.com
 * Base URL: https://live.aiosell.com/api/v2/cm
 * Edge Function URL: https://pdsfctfixxfazchamznm.supabase.co/functions/v1/aiosell-webhook
 */

import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../lib/supabase';

export const PMS_API_URL = `${supabaseUrl}/functions/v1/pms-api`;

export const DEFAULT_AIOSELL_CONFIG = {
  username: 'aiosell',
  password: 'AIOsell@123',
  webhookUsername: 'adminaavasa',
  webhookPassword: 'admin123',
  hotelCode: 'sandbox-pms',
  partnerId: 'sample-pms',
  baseUrl: 'https://live.aiosell.com/api/v2/cm',
  isSandbox: true,
  autoSync: true,
  webhookUrl: `${supabaseUrl}/functions/v1/aiosell-webhook`,
  pmsApiUrl: PMS_API_URL
};

function getPmsApiHeaders() {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    'x-aavasa-client': 'aurastay-pms'
  };
}

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
 * Save a hotel's explicit Aiosell hotelCode mapping to Supabase for accurate multi-tenant webhook routing.
 */
export async function saveHotelAiosellCode(hotelId, aiosellHotelCode) {
  if (!isSupabaseConfigured || !hotelId) return { success: false };
  const cleanCode = String(aiosellHotelCode || '').trim();
  const { error } = await supabase
    .from('hotels')
    .update({ aiosell_hotel_code: cleanCode || null, updated_at: new Date().toISOString() })
    .eq('id', hotelId);
  return { success: !error, error: error?.message || null };
}

/**
 * Push live remaining inventory & Stop-Sell flags for a hotel to Aiosell via the secured pms-api endpoint.
 * Shares ONLY availability counts, roomCodes, dates, and stopSell — zero guest PII or internal hotel data.
 */
export async function pushHotelInventoryViaBackend({
  hotelId,
  hotelCode,
  partnerId,
  username,
  password,
  startDate,
  endDate
} = {}) {
  if (!hotelId) return { success: false, message: 'hotelId is required.' };
  const config = getAiosellConfig();
  try {
    const res = await fetch(config.pmsApiUrl || PMS_API_URL, {
      method: 'POST',
      headers: getPmsApiHeaders(),
      body: JSON.stringify({
        action: 'push_ota_inventory',
        hotelId,
        ...(hotelCode ? { hotelCode } : {}),
        ...(partnerId ? { partnerId } : {}),
        ...(username ? { username } : {}),
        ...(password ? { password } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {})
      })
    });
    const json = await res.json().catch(() => ({}));
    return { success: res.ok && json.success !== false, status: res.status, ...json };
  } catch (err) {
    return { success: false, error: err?.message || 'Unable to reach pms-api inventory push.' };
  }
}

/**
 * Lightweight, hotel_id-scoped live state fetch via Supabase direct queries (never fetches passwords or other tenants).
 */
export async function fetchLiveStateViaEdgeFunction(hotelId = null) {
  if (!isSupabaseConfigured || !hotelId) {
    return { success: false, rooms: [], reservations: [], roomTypes: [], fnbOrders: [], hotels: [] };
  }

  const [roomsRes, resRes, rtRes, fnbRes] = await Promise.all([
    supabase.from('rooms').select('*').eq('hotel_id', hotelId).order('room_number', { ascending: true }),
    supabase.from('reservations').select('*').eq('hotel_id', hotelId).order('created_at', { ascending: false }),
    supabase.from('room_types').select('*').eq('hotel_id', hotelId).order('name', { ascending: true }),
    supabase.from('fnb_orders').select('*').eq('hotel_id', hotelId).order('created_at', { ascending: false })
  ]);

  return {
    success: true,
    source: 'supabase-scoped',
    syncedAt: new Date().toISOString(),
    rooms: roomsRes.data || [],
    roomTypes: rtRes.data || [],
    reservations: resRes.data || [],
    fnbOrders: fnbRes.data || []
  };
}

/**
 * Dispatch an inbound Aiosell Webhook event strictly to the dedicated aiosell-webhook Edge Function
 * (Basic Auth verified, date-overlap double-booking protection, hotel_id scoped).
 */
export async function dispatchWebhookToBackend(payload, currentHotelId = null) {
  const config = getAiosellConfig();
  const parsed = parseAiosellWebhookPayload(payload);
  let edgeResponse = null;

  // Send only the Aiosell-standard payload (plus hotelId hint only if simulator overrides mapping)
  const webhookBody = {
    ...payload,
    hotelCode: payload.hotelCode || config.hotelCode || 'sandbox-pms',
    ...(currentHotelId ? { hotelId: currentHotelId } : {})
  };

  try {
    const res = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: getBasicAuthHeader(config.webhookUsername || 'adminaavasa', config.webhookPassword || 'admin123')
      },
      body: JSON.stringify(webhookBody)
    });

    edgeResponse = await res.json().catch(() => null);
    if (res.ok && edgeResponse?.success) {
      return {
        success: true,
        action: parsed.action,
        bookingId: parsed.bookingId || parsed.reservation?.id,
        channel: parsed.channel || parsed.reservation?.channel,
        allocatedRoomNumber: edgeResponse.allocatedRoom || null,
        unlockedRoom: parsed.action === 'cancel' ? (edgeResponse.unlockedRoom || null) : null,
        reservation: parsed.reservation,
        edgeResponse
      };
    }

    // Respect explicit conflict / auth / hotelCode mapping failures from Edge Function
    if (res.status === 401 || res.status === 404 || res.status === 409) {
      return {
        success: false,
        status: res.status,
        action: parsed.action,
        error: edgeResponse?.message || `Webhook rejected (${res.status}).`,
        edgeResponse
      };
    }
  } catch (_e) {
    // Fallback below only if Edge Function network endpoint is unreachable locally
  }

  if (isSupabaseConfigured && currentHotelId) {
    const todayStr = new Date().toISOString().split('T')[0];

    if (parsed.action === 'cancel') {
      const bookingId = parsed.bookingId;
      await supabase
        .from('reservations')
        .update({
          status: 'CANCELLED',
          notes: `Cancelled via ${payload.channel || 'OTA'} Webhook at ${new Date().toISOString()}`
        })
        .eq('id', bookingId)
        .eq('hotel_id', currentHotelId);

      const { data: unlockedRows } = await supabase
        .from('rooms')
        .update({
          status: 'VACANT_READY',
          guest: null,
          booking_id: null,
          check_out: null,
          is_ota_locked: false,
          ota_channel: null,
          updated_at: new Date().toISOString()
        })
        .eq('hotel_id', currentHotelId)
        .eq('booking_id', bookingId)
        .select('room_number');

      const unlockedRoom = unlockedRows?.[0]?.room_number || null;

      await broadcastCrossDeviceSync({
        action: 'cancel',
        hotelId: currentHotelId,
        bookingId,
        channel: parsed.channel,
        unlockedRoom
      });

      return {
        success: true,
        action: 'cancel',
        bookingId,
        channel: parsed.channel,
        unlockedRoom,
        edgeResponse
      };
    }

    if (parsed.action === 'book' || parsed.action === 'modify') {
      const resObj = parsed.reservation;
      const bookingId = resObj.id;

      const [{ data: existingRes }, { data: allRooms }, { data: activeReservations }] = await Promise.all([
        supabase.from('reservations').select('*').eq('id', bookingId).eq('hotel_id', currentHotelId).maybeSingle(),
        supabase.from('rooms').select('*').eq('hotel_id', currentHotelId).order('room_number', { ascending: true }),
        supabase
          .from('reservations')
          .select('id, room_number, room, status, check_in, check_out')
          .eq('hotel_id', currentHotelId)
          .neq('id', bookingId)
          .not('status', 'in', '(CANCELLED,CHECKED_OUT,NO_SHOW)')
      ]);

      let allocatedRoomNumber =
        existingRes?.room_number ||
        existingRes?.room?.match(/\b(\d+)\b/)?.[1] ||
        '';

      if (!allocatedRoomNumber && Array.isArray(allRooms) && allRooms.length > 0) {
        const { allocatedRoomNumber: picked } = allocateAndLockPhysicalRoom(
          resObj,
          allRooms,
          activeReservations || []
        );
        allocatedRoomNumber = picked || '';
      }

      if (!allocatedRoomNumber) {
        return {
          success: false,
          action: parsed.action,
          error: `All rooms in ${resObj.room_type} are already reserved for ${resObj.check_in} to ${resObj.check_out}.`
        };
      }

      const coversToday = resObj.check_in <= todayStr && resObj.check_out > todayStr;
      resObj.room = `Room ${allocatedRoomNumber}`;
      resObj.room_number = allocatedRoomNumber;
      resObj.hotel_id = currentHotelId;

      if (coversToday) {
        await supabase
          .from('rooms')
          .update({
            status: 'RESERVED',
            guest: resObj.guest,
            booking_id: bookingId,
            check_out: resObj.check_out,
            is_ota_locked: true,
            ota_channel: resObj.channel,
            updated_at: new Date().toISOString()
          })
          .eq('hotel_id', currentHotelId)
          .eq('room_number', allocatedRoomNumber);
      }

      await supabase.from('reservations').upsert({
        id: bookingId,
        hotel_id: currentHotelId,
        guest: resObj.guest,
        guest_email: resObj.guest_email,
        guest_phone: resObj.guest_phone,
        room: resObj.room,
        room_number: allocatedRoomNumber,
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
        notes: `OTA Booking ${bookingId} via ${resObj.channel} (${resObj.check_in} -> ${resObj.check_out}). Auto-locked room ${allocatedRoomNumber}.`
      });

      await broadcastCrossDeviceSync({
        action: parsed.action,
        hotelId: currentHotelId,
        bookingId,
        channel: resObj.channel,
        allocatedRoom: allocatedRoomNumber,
        guestName: resObj.guest
      });

      return {
        success: true,
        action: parsed.action,
        reservation: resObj,
        allocatedRoomNumber,
        edgeResponse
      };
    }
  }

  return {
    success: false,
    action: parsed.action,
    error: 'Supabase is not configured or no active hotel session found.'
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
export function allocateAndLockPhysicalRoom(reservation, rooms = [], existingReservations = []) {
  if (!rooms || rooms.length === 0) {
    return { allocatedRoomNumber: null, updatedRooms: rooms };
  }

  const roomTypeTarget = String(reservation.room_type || reservation.room_code || '').toLowerCase();
  const checkIn = String(reservation.check_in || new Date().toISOString().split('T')[0]).slice(0, 10);
  const checkOut = String(reservation.check_out || new Date(Date.now() + 86400000).toISOString().split('T')[0]).slice(0, 10);
  const todayStr = new Date().toISOString().split('T')[0];
  const coversToday = checkIn <= todayStr && checkOut > todayStr;

  const isRoomFree = (r) => {
    const st = String(r.status || 'VACANT_READY').toUpperCase();
    if (['MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED'].includes(st)) return false;
    const rNum = String(r.roomNumber || r.room_number).trim();
    const hasOverlap = (existingReservations || []).some(res => {
      if (['CANCELLED', 'CHECKED_OUT', 'NO_SHOW'].includes(String(res.status || '').toUpperCase())) return false;
      const resNum = String(res.room_number || '').trim() || String(res.room || '').match(/\b(\d+)\b/)?.[1] || '';
      if (resNum !== rNum) return false;
      const rIn = String(res.check_in || res.checkIn || '').slice(0, 10);
      const rOut = String(res.check_out || res.checkOut || '').slice(0, 10);
      return rIn < checkOut && rOut > checkIn;
    });
    if (hasOverlap) return false;
    if (['OCCUPIED', 'RESERVED'].includes(st)) {
      if (r.check_out || r.checkOut) {
        return !(checkIn < String(r.check_out || r.checkOut).slice(0, 10) && checkOut > todayStr);
      }
      if (coversToday) return false;
    }
    return true;
  };

  let targetRoom = rooms.find(
    r =>
      isRoomFree(r) &&
      (String(r.type || '').toLowerCase().includes(roomTypeTarget) ||
        roomTypeTarget.includes(String(r.type || '').toLowerCase()))
  );

  if (!targetRoom) {
    targetRoom = rooms.find(isRoomFree);
  }

  if (!targetRoom) {
    return { allocatedRoomNumber: null, updatedRooms: rooms };
  }

  const allocatedRoomNumber = String(targetRoom.roomNumber || targetRoom.room_number);

  const updatedRooms = rooms.map(r => {
    if (String(r.roomNumber || r.room_number) === allocatedRoomNumber && coversToday) {
      return {
        ...r,
        status: reservation.status === 'CHECKED_IN' ? 'OCCUPIED' : 'RESERVED',
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
