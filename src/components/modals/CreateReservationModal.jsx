import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { X, CalendarPlus, BedDouble, AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function CreateReservationModal() {
  const { 
    isCreateReservationModalOpen, 
    setIsCreateReservationModalOpen, 
    addReservation,
    rooms = [],
    reservations = [],
    showNotification
  } = useDashboard();

  const [guest, setGuest] = useState('');
  const [room, setRoom] = useState('');
  const [checkIn, setCheckIn] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [source, setSource] = useState('Direct Walk-in');
  const [amount, setAmount] = useState('2000');
  const [validationError, setValidationError] = useState('');

  const defaultRoomVal = room || (rooms.length > 0 ? `${rooms[0].roomNumber} (${rooms[0].type})` : 'Unassigned Room');

  // Check if a specific room has date conflict or is occupied
  const checkConflict = (roomIdentifier, start, end) => {
    if (!roomIdentifier || !start || !end) return null;
    const roomNumMatch = String(roomIdentifier).match(/\b(\d+)\b/);
    const roomNum = roomNumMatch ? roomNumMatch[1] : String(roomIdentifier);

    // 1. Check if room is in maintenance
    const matchedRoom = rooms.find(r => String(r.roomNumber) === String(roomNum));
    if (matchedRoom && matchedRoom.status === 'MAINTENANCE') {
      return `Room ${roomNum} is currently out of order (Maintenance) and cannot be booked.`;
    }

    // 2. Check overlap with existing active reservations
    const sDate = new Date(start);
    const eDate = new Date(end);

    const conflictingRes = reservations.find(res => {
      if (res.status === 'CANCELLED') return false;
      const resRoomMatch = String(res.room).match(/\b(\d+)\b/);
      const resRoomNum = resRoomMatch ? resRoomMatch[1] : String(res.room);
      if (String(resRoomNum) !== String(roomNum)) return false;

      const rStart = new Date(res.checkIn || res.check_in);
      const rEnd = new Date(res.checkOut || res.check_out);

      // Overlap formula: (start < rEnd) && (end > rStart)
      return sDate < rEnd && eDate > rStart;
    });

    if (conflictingRes) {
      return `Room ${roomNum} is already reserved by ${conflictingRes.guest || 'another guest'} from ${conflictingRes.checkIn || conflictingRes.check_in} to ${conflictingRes.checkOut || conflictingRes.check_out}.`;
    }

    return null;
  };

  // Compute active conflict for current form selection
  const activeConflict = useMemo(() => {
    if (checkIn >= checkOut) {
      return 'Check-out date must be strictly after Check-in date.';
    }
    return checkConflict(defaultRoomVal, checkIn, checkOut);
  }, [defaultRoomVal, checkIn, checkOut, rooms, reservations]);

  if (!isCreateReservationModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!guest.trim()) {
      setValidationError('Please enter guest full name.');
      return;
    }

    if (checkIn >= checkOut) {
      setValidationError('Check-out date must be strictly after Check-in date.');
      return;
    }

    const conflict = checkConflict(defaultRoomVal, checkIn, checkOut);
    if (conflict) {
      setValidationError(conflict);
      showNotification(conflict, 'error');
      return;
    }

    setValidationError('');

    if (addReservation) {
      addReservation({
        guest: guest.trim(),
        room: defaultRoomVal,
        checkIn,
        checkOut,
        source,
        amount: Number(amount) || 2000,
        status: 'CONFIRMED',
        payment: 'PENDING'
      });
    }
    setIsCreateReservationModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-100">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Create Reservation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Front desk guest booking & room allocation
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateReservationModalOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Active Conflict Warning Alert */}
          {(activeConflict || validationError) && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium text-[11px]">
                <strong className="font-bold">Reservation Conflict: </strong>
                {activeConflict || validationError}
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Guest Full Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={guest}
              onChange={(e) => { setGuest(e.target.value); setValidationError(''); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Check-in Date <span className="text-rose-500">*</span></label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => { setCheckIn(e.target.value); setValidationError(''); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Check-out Date <span className="text-rose-500">*</span></label>
              <input
                type="date"
                value={checkOut}
                min={checkIn}
                onChange={(e) => { setCheckOut(e.target.value); setValidationError(''); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Room <span className="text-rose-500">*</span></label>
              <select
                value={defaultRoomVal}
                onChange={(e) => { setRoom(e.target.value); setValidationError(''); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {rooms.length === 0 ? (
                  <option value="Unassigned Room">Unassigned Room (No rooms in inventory)</option>
                ) : (
                  rooms.map(r => {
                    const conflict = checkConflict(r.roomNumber, checkIn, checkOut);
                    return (
                      <option 
                        key={r.roomNumber} 
                        value={`${r.roomNumber} (${r.type})`}
                        disabled={Boolean(conflict)}
                      >
                        Room {r.roomNumber} - {r.type} {conflict ? '⚠️ [Booked / Conflict]' : '✓ [Available]'}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Booking Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Direct Walk-in">Direct Walk-in</option>
                <option value="Booking Engine">Direct Booking Engine</option>
                <option value="Booking.com">Booking.com</option>
                <option value="Agoda">Agoda</option>
                <option value="Corporate Contract">Corporate Contract</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Total Stay Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsCreateReservationModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(activeConflict)}
              className={`px-5 py-2 rounded-lg font-semibold shadow-sm transition flex items-center gap-1.5 ${
                activeConflict 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm Reservation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
