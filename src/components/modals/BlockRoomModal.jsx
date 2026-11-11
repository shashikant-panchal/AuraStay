import React, { useState } from 'react';
import { X, ShieldAlert, Wrench, Check, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export default function BlockRoomModal({ isOpen, onClose, room }) {
  const { blockRoom, unblockRoom, showNotification } = useDashboard();

  const [reason, setReason] = useState('Air Conditioning & HVAC Service');
  const [customNotes, setCustomNotes] = useState('');
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !room) return null;

  const roomNum = String(room.room_number || room.roomNumber || room.number);
  const isCurrentlyBlocked = room.status === 'MAINTENANCE' || room.status === 'Blocked';

  const handleBlock = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const fullReason = customNotes.trim() ? `${reason} - ${customNotes.trim()}` : reason;
      await blockRoom(roomNum, fullReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnblock = async () => {
    setIsSubmitting(true);
    try {
      await unblockRoom(roomNum);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative">
        
        {/* Header */}
        <div className={`text-white px-6 py-5 flex items-center justify-between ${
          isCurrentlyBlocked
            ? 'bg-gradient-to-r from-emerald-800 to-teal-900'
            : 'bg-gradient-to-r from-rose-800 to-rose-950'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
              {isCurrentlyBlocked ? <ShieldCheck className="w-5 h-5 text-emerald-200" /> : <Wrench className="w-5 h-5 text-rose-200" />}
            </div>
            <div>
              <h3 className="text-base font-black tracking-wide">
                {isCurrentlyBlocked ? 'Unblock Room' : 'Block Room for Maintenance'}
              </h3>
              <p className="text-xs text-white/80">Room #{roomNum} • {room.category || room.type || 'Standard'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {isCurrentlyBlocked ? (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-emerald-900 uppercase">Room is Under Maintenance</p>
                <p className="text-xs text-emerald-800">
                  Current reason: <strong>{room.housekeeping || 'Out of Order / Maintenance'}</strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  Unblocking this room will set its status to <strong>VACANT_READY</strong> and make it immediately bookable on both Admin and Guest Booking portals.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnblock}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/20 flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Unblocking...' : 'Unblock & Make Available'}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBlock} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Maintenance Category
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500/30 outline-none"
                >
                  <option value="Air Conditioning & HVAC Service">Air Conditioning & HVAC Service</option>
                  <option value="Bathroom Plumbing & Leakage Repair">Bathroom Plumbing & Leakage Repair</option>
                  <option value="Carpentry & Furniture Repair">Carpentry & Furniture Repair</option>
                  <option value="Deep Steam Carpet & Mattress Cleaning">Deep Steam Carpet & Mattress Cleaning</option>
                  <option value="Electrical & Lighting Maintenance">Electrical & Lighting Maintenance</option>
                  <option value="Wall Painting & Touch-up">Wall Painting & Touch-up</option>
                  <option value="Executive Room Upgrade Refurbishment">Executive Room Upgrade Refurbishment</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Expected Completion Date
                </label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500/30 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Remarks / Engineer Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Technician arriving at 3 PM to replace thermostat valve."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-rose-500/30 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center space-x-1.5"
                >
                  <Wrench className="w-4 h-4" />
                  <span>{isSubmitting ? 'Blocking...' : 'Block Room'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

