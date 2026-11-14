import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  X,
  UserCheck,
  Calendar,
  Clock,
  CreditCard,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  ShieldCheck,
  DollarSign
} from 'lucide-react';

export default function CheckInModal({ isOpen, onClose, reservation }) {
  const { rooms = [], checkInReservation, showNotification } = useDashboard();

  const getLocalTodayStr = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  };
  const getCurrentTimeStr = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const todayStr = getLocalTodayStr();
  const rawRoom = String(reservation?.room_number || reservation?.room || '').replace(/\D/g, '');
  const checkOutDefault = String(reservation?.check_out || reservation?.checkOut || todayStr).slice(0, 10);

  const [assignedRoom, setAssignedRoom] = useState(rawRoom || (rooms[0]?.roomNumber || '101'));
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkInTime, setCheckInTime] = useState(getCurrentTimeStr());
  const [checkOutDate, setCheckOutDate] = useState(checkOutDefault);
  const [checkOutTime, setCheckOutTime] = useState('11:00');

  // KYC
  const [idType, setIdType] = useState(reservation?.idType || reservation?.guest_id_type || 'Aadhaar Card');
  const [idNumber, setIdNumber] = useState(reservation?.idNumber || reservation?.guest_id_number || '');
  const [idCity, setIdCity] = useState(reservation?.idCity || reservation?.city || 'Bengaluru');

  // Payment
  const totalTariff = Number(reservation?.amount || reservation?.price || 0);
  const alreadyPaid = Number(reservation?.paid || 0);
  const remainingDue = Math.max(0, totalTariff - alreadyPaid);

  const [collectNow, setCollectNow] = useState(remainingDue > 0);
  const [paymentAmount, setPaymentAmount] = useState(remainingDue > 0 ? String(remainingDue) : '0');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (!isOpen || !reservation) return;
    const tToday = getLocalTodayStr();
    const rRoom = String(reservation.room_number || reservation.room || '').replace(/\D/g, '');
    const tTotal = Number(reservation.amount || reservation.price || 0);
    const tPaid = Number(reservation.paid || 0);
    const tDue = Math.max(0, tTotal - tPaid);

    setAssignedRoom(rRoom || (rooms[0]?.roomNumber || '101'));
    setCheckInDate(tToday);
    setCheckInTime(getCurrentTimeStr());
    setCheckOutDate(String(reservation.check_out || reservation.checkOut || tToday).slice(0, 10));
    setCheckOutTime('11:00');
    setIdType(reservation.idType || reservation.guest_id_type || 'Aadhaar Card');
    setIdNumber(reservation.idNumber || reservation.guest_id_number || '');
    setIdCity(reservation.idCity || reservation.city || 'Bengaluru');
    setCollectNow(tDue > 0);
    setPaymentAmount(tDue > 0 ? String(tDue) : '0');
    setPaymentRef('');
  }, [isOpen, reservation?.id]);

  if (!isOpen || !reservation) return null;

  // Available rooms for check-in (exclude OCCUPIED/BLOCKED, allow RESERVED room assigned to this booking)
  const vacantRooms = rooms.filter(
    r => !['OCCUPIED', 'OUT_OF_ORDER', 'MAINTENANCE', 'BLOCKED'].includes(String(r.status || '').toUpperCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assignedRoom) {
      showNotification('Please select or assign a room number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedCheckIn = new Date(`${checkInDate}T${checkInTime}:00`);
      const fullCheckInTimestamp = Number.isNaN(parsedCheckIn.getTime())
        ? new Date().toISOString()
        : parsedCheckIn.toISOString();
      const fullCheckOutTimestamp = `${checkOutDate} ${checkOutTime}:00`;

      await checkInReservation(reservation.id, {
        roomNumber: assignedRoom,
        actualCheckInTime: fullCheckInTimestamp,
        expectedCheckOutTime: fullCheckOutTimestamp,
        idType,
        idNumber: idNumber.trim(),
        idCity: idCity.trim(),
        collectedAmount: collectNow ? Number(paymentAmount) : 0,
        paymentMode,
        paymentRef: paymentRef.trim()
      });

      onClose();
    } catch (err) {
      console.error('Check-In error:', err);
      showNotification('Failed to process check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Front Desk Guest Check-In
              </h2>
              <p className="text-xs text-slate-500">
                Booking ID: <strong className="text-indigo-600 font-mono">#{reservation.id}</strong> • Source: {reservation.source || 'Direct Walk-In'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest Summary Card */}
        <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Guest Name</span>
            <p className="font-bold text-slate-900 mt-0.5 truncate">{reservation.guest || 'Valued Guest'}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Contact Phone</span>
            <p className="font-mono text-slate-800 mt-0.5">{reservation.guest_phone || reservation.phone || 'N/A'}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Category</span>
            <p className="font-semibold text-indigo-700 mt-0.5">{reservation.room_type || reservation.roomType || 'Deluxe Room'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          
          {/* Room Assignment */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-slate-700 font-bold flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Physical Room Assignment</span>
              </span>
              <span className="text-[11px] font-normal text-emerald-600">
                {vacantRooms.length} Vacant Rooms Ready
              </span>
            </label>
            <select
              value={assignedRoom}
              onChange={e => setAssignedRoom(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
              required
            >
              <option value="">-- Choose Physical Room Number --</option>
              {rooms.map(r => {
                const num = r.roomNumber || r.room_number || r.number;
                const st = String(r.status || 'VACANT_READY').toUpperCase();
                const isOcc = (st === 'OCCUPIED' || st === 'RESERVED') && String(num) !== String(rawRoom);
                return (
                  <option key={num} value={num} disabled={isOcc}>
                    Room {num} ({r.type || 'Standard'}) — {r.status} {isOcc ? `(${st === 'RESERVED' ? 'Reserved' : 'Already Occupied'})` : '✓'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Check-In & Check-Out Timestamps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
              <label className="block text-slate-700 font-bold flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Actual Check-In Time</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={checkInDate}
                  onChange={e => setCheckInDate(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
                  required
                />
                <input
                  type="time"
                  value={checkInTime}
                  onChange={e => setCheckInTime(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
              <label className="block text-slate-700 font-bold flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Expected Check-Out Time</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={e => setCheckOutDate(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
                  required
                />
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={e => setCheckOutTime(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* ID Proof / KYC Details */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2.5">
            <label className="block text-slate-700 font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>Guest Identity Verification (KYC)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block mb-1">ID Type</span>
                <select
                  value={idType}
                  onChange={e => setIdType(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Other Govt ID">Other Govt ID</option>
                </select>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block mb-1">ID Number</span>
                <input
                  type="text"
                  placeholder="e.g. 5482 1234 9876"
                  value={idNumber}
                  onChange={e => setIdNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block mb-1">City / State</span>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru"
                  value={idCity}
                  onChange={e => setIdCity(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Front Desk Payment Collection at Check-In */}
          <div className="p-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-2xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800">Front Desk Payment Collection</span>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={collectNow}
                  onChange={e => setCollectNow(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-700">Collect Advance Now</span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center bg-white p-2.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Tariff</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5">₹{totalTariff.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Already Paid</span>
                <p className="font-mono font-bold text-emerald-600 mt-0.5">₹{alreadyPaid.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Balance Due</span>
                <p className="font-mono font-bold text-rose-600 mt-0.5">₹{remainingDue.toLocaleString()}</p>
              </div>
            </div>

            {collectNow && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1">Amount to Collect (₹)</span>
                  <input
                    type="number"
                    min="1"
                    max={remainingDue > 0 ? remainingDue : 100000}
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-800 focus:outline-none"
                    required={collectNow}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1">Payment Method</span>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option value="UPI">UPI / QR (GPay, PhonePe)</option>
                    <option value="CASH">Cash at Desk</option>
                    <option value="CARD">Credit / Debit Card (POS)</option>
                    <option value="NET_BANKING">Net Banking / NEFT</option>
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1">Txn / UTR / Note</span>
                  <input
                    type="text"
                    placeholder="e.g. UPI-984210"
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Checking In...' : 'Confirm Check-In & Mark Occupied'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

