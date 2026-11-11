import React, { useState } from 'react';
import { X, ArrowRight, BedDouble, AlertTriangle, ShieldCheck, Check } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export default function ShiftRoomModal({ isOpen, onClose, sourceRoom }) {
  const { rooms = [], shiftRoom, showNotification } = useDashboard();

  const [targetRoomNumber, setTargetRoomNumber] = useState('');
  const [reason, setReason] = useState('Guest Requested Higher Floor');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !sourceRoom) return null;

  const srcNum = String(sourceRoom.room_number || sourceRoom.roomNumber || sourceRoom.number);

  // Available vacant rooms
  const availableTargetRooms = rooms.filter(r => {
    const num = String(r.room_number || r.roomNumber);
    return num !== srcNum && (r.status === 'VACANT_READY' || r.status === 'Available');
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetRoomNumber) {
      showNotification('Please select a target room.', 'error');
      return;
    }

    const finalReason = reason === 'Other' ? (customReason.trim() || 'Room Shift') : reason;

    setIsSubmitting(true);
    try {
      const success = await shiftRoom(srcNum, targetRoomNumber, finalReason);
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
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] tracking-widest uppercase font-bold text-indigo-300">
                Front Office Operations
              </div>
                <h3 className="text-lg font-bold text-white">
                  Shift Room (Room Move)
                </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Source Room Info Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Current Occupied Room</div>
              <div className="text-xl font-bold font-mono text-slate-900 flex items-center gap-2 mt-0.5">
                <span>Room #{srcNum}</span>
                <span className="text-xs font-sans font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  {sourceRoom.type || sourceRoom.category || 'Standard'}
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Guest: <strong className="text-slate-800">{sourceRoom.guest || 'In-House Guest'}</strong>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Target Room Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Select Target Available Room <span className="text-rose-500">*</span>
            </label>
            {availableTargetRooms.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No vacant ready rooms currently available to shift.</span>
              </div>
            ) : (
              <select
                value={targetRoomNumber}
                onChange={(e) => setTargetRoomNumber(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white"
              >
                <option value="">-- Choose destination room --</option>
                {availableTargetRooms.map(r => (
                  <option key={r.id || r.room_number} value={r.room_number || r.roomNumber}>
                    Room #{r.room_number || r.roomNumber} - {r.type || 'Standard'} ({r.floor || 'Floor 1'}) - ₹{r.price || 2000}/night
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Reason for Shift <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white"
            >
              <option value="Guest Requested Higher Floor">Guest Requested Higher Floor</option>
              <option value="AC / Electrical Malfunction">AC / Electrical Malfunction</option>
              <option value="Plumbing / Water Pressure Issue">Plumbing / Water Pressure Issue</option>
              <option value="Complimentary Upgrade to Suite">Complimentary Upgrade to Suite</option>
              <option value="Noise / Disturbance Complaint">Noise / Disturbance Complaint</option>
              <option value="Housekeeping Deep Cleaning Needed">Housekeeping Deep Cleaning Needed</option>
              <option value="Other">Other Reason (Specify below)</option>
            </select>

            {reason === 'Other' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter specific room shift notes..."
                className="w-full mt-2 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                required
              />
            )}
          </div>

          {/* Notice Note */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Moving the room will automatically update the guest's folio, transfer active room billing, and mark Room #{srcNum} as <strong>DIRTY</strong> for housekeeping inspection.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !targetRoomNumber || availableTargetRooms.length === 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition ${!targetRoomNumber || availableTargetRooms.length === 0 || isSubmitting
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30'
                }`}
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Shifting...' : 'Confirm Room Shift'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

