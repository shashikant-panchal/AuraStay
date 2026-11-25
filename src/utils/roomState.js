/**
 * Shared single-source-of-truth room & stay status resolver for AuraStay PMS.
 * Ensures:
 *  1. Upcoming FUTURE bookings (check_in > today) NEVER mark a room OCCUPIED or RESERVED today.
 *  2. Shifted bookings strictly match their current `room_number` so old rooms immediately show VACANT.
 *  3. Stale `rooms.status` / `rooms.booking_id` values linked to future, shifted, cancelled, or
 *     checked-out bookings are safely ignored in the UI.
 */

export function getLocalTodayStr(now = new Date()) {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

export function normalizeRoomNum(val) {
  const raw = String(val ?? '').trim();
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  return digits || raw.toLowerCase();
}

export function extractReservationRoomNum(res) {
  if (!res) return '';
  const explicitNum = String(res.room_number ?? '').trim();
  if (explicitNum) {
    return normalizeRoomNum(explicitNum);
  }
  const roomText = String(res.room ?? '').trim();
  if (!roomText) return '';
  const match = roomText.match(/\b(\d+)\b/);
  return match ? match[1] : normalizeRoomNum(roomText);
}

export function isTerminalReservationStatus(status) {
  const st = String(status || '').toUpperCase();
  return ['CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW'].includes(st);
}

export function isCheckedInStatus(status) {
  const st = String(status || '').toUpperCase();
  return ['CHECKED_IN', 'CHECKEDIN', 'OCCUPIED'].includes(st);
}

export function isReservedStatus(status) {
  const st = String(status || '').toUpperCase();
  return ['CONFIRMED', 'PENDING', 'RESERVED'].includes(st);
}

/**
 * Resolves a physical room's effective status for TODAY (`todayStr`).
 *
 * Returns:
 *  - effectiveStatus: 'BLOCKED' | 'OCCUPIED' | 'RESERVED' | 'DIRTY' | 'VACANT'
 *  - stayViewStatus:  'MAINTENANCE' | 'OCCUPIED' | 'RESERVED' | 'DIRTY' | 'VACANT_READY'
 *  - activeReservation: current checked-in or today's reserved booking (NEVER a future booking)
 *  - upcomingReservation: nearest future booking (check_in > todayStr), if any
 */
export function resolveRoomTodayState(room, reservations = [], todayStr = getLocalTodayStr()) {
  const rNumRaw = String(room?.room_number || room?.roomNumber || room?.number || room?.id || '').trim();
  const rNum = normalizeRoomNum(rNumRaw);
  const stUpper = String(room?.status || 'VACANT_READY').toUpperCase();
  const roomBookingId = room?.booking_id || room?.bookingId || null;

  const isBlocked = ['MAINTENANCE', 'OUT_OF_ORDER', 'BLOCKED'].includes(stUpper);
  const rawDirty = stUpper === 'DIRTY' || String(room?.housekeeping || '').toLowerCase() === 'dirty';

  // Find the exact reservation referenced by room.booking_id (if present in loaded reservations)
  const linkedRes = roomBookingId
    ? (reservations || []).find(r => String(r.id) === String(roomBookingId))
    : null;

  // All non-terminal reservations currently assigned to THIS room
  const roomReservations = (reservations || []).filter(r => {
    if (!r || isTerminalReservationStatus(r.status)) return false;
    const resNum = extractReservationRoomNum(r);
    if (resNum) {
      return resNum === rNum;
    }
    return Boolean(roomBookingId && String(r.id) === String(roomBookingId));
  });

  // 1. Currently checked-in stay on THIS room (must not be a future date!)
  const checkedInRes =
    roomReservations.find(r => {
      if (!isCheckedInStatus(r.status)) return false;
      const ci = String(r.check_in || r.checkIn || '').slice(0, 10);
      return !ci || ci <= todayStr;
    }) || null;

  // 2. Reservation arriving/active TODAY on THIS room (check_in <= today < check_out)
  const todaysReservedRes =
    roomReservations
      .filter(r => {
        if (!isReservedStatus(r.status)) return false;
        const ci = String(r.check_in || r.checkIn || '').slice(0, 10);
        const co = String(r.check_out || r.checkOut || '').slice(0, 10);
        if (!ci) return false;
        return ci <= todayStr && (!co || co > todayStr);
      })
      .sort((a, b) => String(a.check_in || a.checkIn || '').localeCompare(String(b.check_in || b.checkIn || '')))[0] || null;

  // 3. Nearest upcoming FUTURE booking on THIS room (check_in > today)
  //    CRITICAL: Future bookings NEVER mark the room OCCUPIED or RESERVED today!
  const upcomingReservation =
    roomReservations
      .filter(r => {
        const ci = String(r.check_in || r.checkIn || '').slice(0, 10);
        return Boolean(ci && ci > todayStr);
      })
      .sort((a, b) => String(a.check_in || a.checkIn || '').localeCompare(String(b.check_in || b.checkIn || '')))[0] || null;

  // Detect if the DB room row's OCCUPIED/RESERVED status is stale (e.g. linked to a future,
  // shifted, cancelled, or checked-out booking)
  let linkedResIsStaleForToday = false;
  if (linkedRes) {
    const linkedRoomNum = extractReservationRoomNum(linkedRes);
    const linkedCi = String(linkedRes.check_in || linkedRes.checkIn || '').slice(0, 10);
    const linkedCo = String(linkedRes.check_out || linkedRes.checkOut || '').slice(0, 10);
    const shiftedAway = Boolean(linkedRoomNum && linkedRoomNum !== rNum);
    const isTerminal = isTerminalReservationStatus(linkedRes.status);
    const isFuture = Boolean(linkedCi && linkedCi > todayStr);
    const isExpiredUnchecked = isReservedStatus(linkedRes.status) && Boolean(linkedCo && linkedCo <= todayStr);
    linkedResIsStaleForToday = shiftedAway || isTerminal || isFuture || isExpiredUnchecked;
  }

  // Fallback trust of bare DB status ONLY when no contradicting reservation contradicts it
  // (e.g. pagination didn't load an older reservation, or legacy room without reservation row)
  const roomCheckoutDate = String(room?.check_out || room?.checkOut || '').slice(0, 10);
  const hasUnloadedBooking = Boolean(roomBookingId && !linkedRes);
  const dbOccupiedValid =
    stUpper === 'OCCUPIED' &&
    !linkedResIsStaleForToday &&
    (Boolean(checkedInRes) || hasUnloadedBooking || (!roomBookingId && !upcomingReservation));
  const dbReservedValid =
    stUpper === 'RESERVED' &&
    !linkedResIsStaleForToday &&
    (Boolean(todaysReservedRes) ||
      (hasUnloadedBooking && (!roomCheckoutDate || roomCheckoutDate > todayStr)));

  const isOccupied = !isBlocked && (Boolean(checkedInRes) || dbOccupiedValid);
  const isReserved = !isBlocked && !isOccupied && (Boolean(todaysReservedRes) || dbReservedValid);
  const isDirty = !isBlocked && !isOccupied && !isReserved && rawDirty;

  let effectiveStatus = 'VACANT';
  let stayViewStatus = 'VACANT_READY';
  if (isBlocked) {
    effectiveStatus = 'BLOCKED';
    stayViewStatus = 'MAINTENANCE';
  } else if (isOccupied) {
    effectiveStatus = 'OCCUPIED';
    stayViewStatus = 'OCCUPIED';
  } else if (isReserved) {
    effectiveStatus = 'RESERVED';
    stayViewStatus = 'RESERVED';
  } else if (isDirty) {
    effectiveStatus = 'DIRTY';
    stayViewStatus = 'DIRTY';
  }

  const activeReservation = isOccupied
    ? checkedInRes || (dbOccupiedValid ? linkedRes : null)
    : isReserved
      ? todaysReservedRes || (dbReservedValid ? linkedRes : null)
      : null;

  return {
    effectiveStatus,
    stayViewStatus,
    isBlocked,
    isOccupied,
    isReserved,
    isDirty,
    isVacant: effectiveStatus === 'VACANT',
    activeReservation,
    upcomingReservation
  };
}
