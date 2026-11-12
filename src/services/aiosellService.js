/**
 * Aiosell Channel Manager API Service for AuraStay HMS
 * Strictly implements the specification from https://apidocs.aiosell.com
 * Base URL: https://live.aiosell.com/api/v2/cm
 */

export const DEFAULT_AIOSELL_CONFIG = {
  username: 'aiosell',
  password: 'AIOsell@123',
  hotelCode: 'sandbox-pms',
  partnerId: 'sample-pms',
  baseUrl: 'https://live.aiosell.com/api/v2/cm',
  isSandbox: true,
  autoSync: false,
  webhookUrl: 'https://pdsfctfixxfazchamznm.supabase.co/functions/v1/aiosell-webhook'
};

const STORAGE_KEY = 'aurastay_aiosell_config';

/**
 * Retrieve saved Aiosell configuration from localStorage or default
 */
export function getAiosellConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_AIOSELL_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Could not read Aiosell config from storage:', err);
  }
  return { ...DEFAULT_AIOSELL_CONFIG };
}

/**
 * Persist Aiosell configuration
 */
export function saveAiosellConfig(config) {
  try {
    const updated = { ...getAiosellConfig(), ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Could not save Aiosell config:', err);
    return config;
  }
}

/**
 * Generates HTTP Basic Auth header
 */
export function getBasicAuthHeader(username, password) {
  const token = typeof btoa !== 'undefined'
    ? btoa(`${username}:${password}`)
    : Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${token}`;
}

/**
 * Common request handler with HTTP Basic Auth and error surfacing
 */
async function makeRequest(endpoint, options = {}, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const url = endpoint.startsWith('http') ? endpoint : `${config.baseUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': getBasicAuthHeader(config.username, config.password),
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
 * @param {Array} updates - array of { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', rooms: [{ roomCode, available }] }
 */
export async function pushInventory(updates, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/update/${encodeURIComponent(config.partnerId)}`;
  const body = {
    hotelCode: config.hotelCode,
    updates
  };
  return await makeRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  }, config);
}

/**
 * 3. Rate Push
 * POST /update-rates/{partnerId}
 * @param {Array} updates - array of { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', rates: [{ roomCode, rateplanCode, rate }] }
 */
export async function pushRates(updates, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/update-rates/${encodeURIComponent(config.partnerId)}`;
  const body = {
    hotelCode: config.hotelCode,
    updates
  };
  return await makeRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  }, config);
}

/**
 * 4. Inventory Restrictions Push
 * POST /update/{partnerId}
 * @param {Array} toChannels - array of channel strings (e.g. ['agoda', 'booking.com'])
 * @param {Array} updates - array of { startDate, endDate, rooms: [{ roomCode, restrictions }] }
 */
export async function pushInventoryRestrictions(toChannels, updates, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/update/${encodeURIComponent(config.partnerId)}`;
  const body = {
    hotelCode: config.hotelCode,
    toChannels,
    updates
  };
  return await makeRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  }, config);
}

/**
 * 5. Rate Restrictions Push
 * POST /update-rates/{partnerId}
 * @param {Array} toChannels - array of channel strings
 * @param {Array} updates - array of { startDate, endDate, rates: [{ roomCode, rateplanCode, restrictions }] }
 */
export async function pushRateRestrictions(toChannels, updates, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/update-rates/${encodeURIComponent(config.partnerId)}`;
  const body = {
    hotelCode: config.hotelCode,
    toChannels,
    updates
  };
  return await makeRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  }, config);
}

/**
 * 6. Mark No Show
 * POST /marknoshow/{partnerId}
 * @param {string} bookingId
 * @param {string} channel - 'booking.com' | 'gommt'
 */
export async function markNoShow(bookingId, channel, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/marknoshow/${encodeURIComponent(config.partnerId)}`;
  const body = {
    hotelCode: config.hotelCode,
    bookingId: String(bookingId),
    channel: String(channel).toLowerCase()
  };
  return await makeRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  }, config);
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
  return await makeRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  }, config);
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
  return await makeRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  }, config);
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
  return await makeRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  }, config);
}

/**
 * 10. Channel Multiplier
 * POST /channel_multiplier/{partnerId}
 * @param {number} multiplier - factor, e.g. 1.25 = +25%
 * @param {Array<string>} channels - non-empty list of channels
 */
export async function updateChannelMultiplier(multiplier, channels, customConfig = {}) {
  const config = { ...getAiosellConfig(), ...customConfig };
  const endpoint = `/channel_multiplier/${encodeURIComponent(config.partnerId)}`;
  const body = {
    hotelCode: config.hotelCode,
    multiplier: Number(multiplier),
    channels
  };
  return await makeRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  }, config);
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
  return await makeRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  }, config);
}

/**
 * Process an incoming Aiosell Webhook Payload
 * Handles 'book', 'modify', 'cancel' actions.
 * Strictly adheres to Rules 9, 10, 11, 12:
 * - Rule 9: Modify represents new full state (not a diff).
 * - Rule 10: pah (Pay-At-Hotel) true/false.
 * - Rule 11: guest fields are optional and nullable.
 * - Rule 12: specialRequests is plain text.
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
  const guestName = (guestFirstName + ' ' + guestLastName).trim() ||
    payload.rooms?.[0]?.guestName ||
    `OTA Guest (${channel})`;

  const guestPhone = guest.phone || null;
  const guestEmail = guest.email || null;
  const guestAddress = guest.address ? [
    guest.address.line1,
    guest.address.city,
    guest.address.state,
    guest.address.country,
    guest.address.zipCode
  ].filter(Boolean).join(', ') : null;

  const firstRoom = payload.rooms?.[0] || {};
  const checkIn = payload.checkin || new Date().toISOString().split('T')[0];
  const checkOut = payload.checkout || new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Calculate nights
  const dIn = new Date(checkIn);
  const dOut = new Date(checkOut);
  const nights = Math.max(1, Math.round((dOut - dIn) / (1000 * 60 * 60 * 24))) || 1;

  const totalAmount = Number(payload.amount?.amountAfterTax) ||
    Number(payload.amount?.amountBeforeTax) ||
    0;

  // Rule 10: pah = true means pay at hotel, false means already prepaid
  const isPayAtHotel = Boolean(payload.pah);
  const paidAmount = isPayAtHotel ? 0 : totalAmount;

  // Rule 12: specialRequests is plain text
  const specialRequests = typeof payload.specialRequests === 'string'
    ? payload.specialRequests
    : (payload.specialRequests ? JSON.stringify(payload.specialRequests) : '');

  // Room type mapping fallback
  const rawRoomCode = String(firstRoom.roomCode || 'executive').toLowerCase();
  let mappedRoomType = 'Deluxe Room';
  if (rawRoomCode.includes('suite')) mappedRoomType = 'Suite';
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
    payment_mode: isPayAtHotel ? 'Pay at Hotel (Cash/Card/UPI)' : 'Prepaid (OTA Virtual Card / Direct)',
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
 * @param {Object} reservation
 * @param {Array} rooms
 * @returns {Object} { allocatedRoomNumber, updatedRooms }
 */
export function allocateAndLockPhysicalRoom(reservation, rooms = []) {
  if (!rooms || rooms.length === 0) {
    return { allocatedRoomNumber: null, updatedRooms: rooms };
  }

  const roomTypeTarget = String(reservation.room_type || reservation.room_code || '').toLowerCase();

  // 1. Find a VACANT_READY physical room matching this category
  let targetRoom = rooms.find(r => 
    (r.status === 'VACANT_READY' || !r.status || r.status === 'CLEAN') &&
    (String(r.type || '').toLowerCase().includes(roomTypeTarget) || roomTypeTarget.includes(String(r.type || '').toLowerCase()))
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
  const matching = rooms.filter(r => 
    String(r.type || '').toLowerCase().includes(norm) || norm.includes(String(r.type || '').toLowerCase())
  );
  const total = matching.length;
  const available = matching.filter(r => r.status === 'VACANT_READY' || !r.status || r.status === 'CLEAN').length;
  const occupied = total - available;
  const shouldStopSell = total > 0 && available === 0;

  return {
    total,
    available,
    occupied,
    shouldStopSell
  };
}


