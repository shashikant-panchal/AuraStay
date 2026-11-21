import React, { useState, useEffect } from 'react';
import {
  X,
  LogOut,
  Sparkles,
  Calendar,
  BedDouble
} from 'lucide-react';

export default function CheckoutConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  room,
  reservation,
  balanceDue = 0
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyCardReturned, setIsKeyCardReturned] = useState(true);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const roomNum = room?.roomNumber || room?.room_number || reservation?.room_number || 'Room';
  const roomCategory = room?.category || room?.type || reservation?.room_type || 'Standard';
  const guestName = reservation?.guest || room?.guestName || room?.guest || 'Guest';
  const checkInDate = reservation?.check_in || reservation?.checkIn || room?.checkIn || 'N/A';
  const checkOutDate = reservation?.check_out || reservation?.checkOut || room?.checkOut || 'Today';

  const handleConfirmCheckout = async () => {
    setIsSubmitting(true);
    try {
      if (onConfirm) {
        await onConfirm();
      }
      onClose();
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/90 overflow-hidden relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 text-white p-5 relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-200">
                <LogOut className="w-5 h-5 text-rose-300" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-white">
                  Confirm Guest Checkout
                </h3>
                <p className="text-xs text-rose-200/80">
                  Release room & finalize guest departure
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Guest & Room Details Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BedDouble className="w-4 h-4 text-[#0e4860]" />
                <span className="font-mono font-black text-sm text-slate-900">
                  Room #{roomNum}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                  {roomCategory}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Front Desk Departure
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Guest Name
                </span>
                <span className="font-bold text-slate-900 truncate block">
                  {guestName}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Stay Period
                </span>
                <span className="font-semibold text-slate-700 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{checkInDate} → {checkOutDate}</span>
                </span>
              </div>
            </div>
          </div>


          {/* Turnover Checklist */}
          <div className="bg-slate-50/60 rounded-xl p-3 border border-slate-200/60 space-y-2">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isKeyCardReturned}
                onChange={(e) => setIsKeyCardReturned(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 accent-rose-600 cursor-pointer"
              />
              <span className="text-[11px] font-semibold text-slate-700">
                Key card received and guest has vacated room
              </span>
            </label>
            <div className="flex items-center space-x-2 text-[10px] text-slate-500 pl-6">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span>Room will transition to <b>DIRTY</b> for housekeeping turnover.</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmCheckout}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-sm hover:scale-[1.01] cursor-pointer text-xs inline-flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Checking Out...' : 'Confirm Guest Checkout'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
