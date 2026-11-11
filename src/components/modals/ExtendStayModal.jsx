import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, BedDouble, Check, AlertCircle } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export default function ExtendStayModal({ isOpen, onClose, room, reservation }) {
  const { extendStay, showNotification } = useDashboard();

  const [newCheckOutDate, setNewCheckOutDate] = useState('');
  const [additionalTariff, setAdditionalTariff] = useState(0);
  const [reason, setReason] = useState('Guest Requested Extension');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCheckOut = reservation?.check_out || reservation?.checkOut || room?.check_out || new Date().toISOString().split('T')[0];
  const roomPrice = Number(room?.price || room?.tariff || reservation?.price || 2500);

  useEffect(() => {
    if (isOpen && currentCheckOut) {
      // Default to 1 day after current checkout
      const nextDay = new Date(currentCheckOut);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDateStr = nextDay.toISOString().split('T')[0];
      setNewCheckOutDate(nextDateStr);
      setAdditionalTariff(roomPrice);
    }
  }, [isOpen, currentCheckOut, roomPrice]);

  if (!isOpen || !room) return null;

  const roomNum = String(room.room_number || room.roomNumber || room.number);
  const guestName = reservation?.guest || reservation?.name || room.guest || 'In-House Guest';

  const calculateExtraNights = () => {
    if (!currentCheckOut || !newCheckOutDate) return 1;
    const d1 = new Date(currentCheckOut);
    const d2 = new Date(newCheckOutDate);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const extraNights = calculateExtraNights();

  const handleDateChange = (val) => {
    setNewCheckOutDate(val);
    if (!currentCheckOut || !val) return;
    const d1 = new Date(currentCheckOut);
    const d2 = new Date(val);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      setAdditionalTariff(diffDays * roomPrice);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (extraNights <= 0) {
      showNotification('New checkout date must be after current checkout date.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const resId = reservation?.id || room.booking_id;
      const success = await extendStay(resId, roomNum, newCheckOutDate, additionalTariff);
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 to-amber-950 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide">Extend Stay</h3>
              <p className="text-xs text-amber-200/80">Room #{roomNum} â€¢ {guestName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Room info card */}
          <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center font-black text-sm">
                #{roomNum}
              </div>
              <div>
                <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider">Current Departure</p>
                <p className="text-sm font-black text-slate-800">{currentCheckOut}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-200">
                Tariff: â‚¹{roomPrice.toLocaleString('en-IN')}/night
              </span>
            </div>
          </div>

          {/* New Check-out Date */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              New Checkout Date
            </label>
            <div className="relative">
              <input
                type="date"
                min={currentCheckOut}
                value={newCheckOutDate}
                onChange={(e) => handleDateChange(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-sm"
              />
              <Calendar className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {extraNights > 0 && (
              <p className="text-xs font-semibold text-amber-800 flex items-center space-x-1">
                <span>âœ“ Extending by <strong>{extraNights} night{extraNights > 1 ? 's' : ''}</strong></span>
              </p>
            )}
          </div>

          {/* Additional Tariff */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Additional Tariff (â‚¹)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={additionalTariff}
                onChange={(e) => setAdditionalTariff(Number(e.target.value))}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-sm font-mono"
              />
              <span className="text-xs text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 font-bold">INR</span>
            </div>
            <p className="text-[11px] text-slate-500">Auto-calculated: {extraNights} nights Ã— â‚¹{roomPrice.toLocaleString('en-IN')}. Can be modified for discounts.</p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Reason for Extension
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-sm"
            >
              <option value="Guest Requested Extension">Guest Requested Extension</option>
              <option value="Flight / Train Delayed">Flight / Train Delayed</option>
              <option value="Medical / Emergency Stay">Medical / Emergency Stay</option>
              <option value="Business Meeting Extended">Business Meeting Extended</option>
              <option value="Late Checkout Converted to Night">Late Checkout Converted to Full Night</option>
              <option value="Corporate Extension">Corporate Extension</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || extraNights <= 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm shadow-md shadow-amber-600/20 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Extending...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Stay Extension</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

