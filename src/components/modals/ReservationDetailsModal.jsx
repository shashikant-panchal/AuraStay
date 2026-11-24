import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  BedDouble,
  Receipt,
  CreditCard,
  Clock,
  Tag,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Edit3,
  Check
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export default function ReservationDetailsModal({
  isOpen,
  onClose,
  reservation,
  onOpenFolio,
  onOpenInvoice
}) {
  const { reservations = [], updateReservationGuestName } = useDashboard();
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsEditingName(false);
      return;
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isEditingName) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isEditingName]);

  if (!isOpen || !reservation) return null;

  const liveReservation = reservation.id
    ? reservations.find(r => String(r.id) === String(reservation.id))
    : null;
  const activeReservation = liveReservation ? { ...reservation, ...liveReservation } : reservation;

  const resId = activeReservation.id || 'N/A';
  const guestName = activeReservation.guest || activeReservation.name || 'Valued Guest';

  const handleSaveGuestName = async (e) => {
    e.preventDefault();
    const cleanName = draftName.trim();
    if (!cleanName) return;
    if (cleanName === guestName) {
      setIsEditingName(false);
      return;
    }
    if (!activeReservation.id || !updateReservationGuestName) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      const result = await updateReservationGuestName(activeReservation.id, cleanName);
      if (result?.success) {
        setIsEditingName(false);
      }
    } finally {
      setIsSavingName(false);
    }
  };
  const phone = reservation.guest_phone || reservation.guestPhone || reservation.phone || 'N/A';
  const email = reservation.guest_email || reservation.guestEmail || reservation.email || 'N/A';
  const roomNum = reservation.room_number || (reservation.rooms && reservation.rooms[0]) || (String(reservation.room || '').match(/\b(\d+)\b/)?.[1]) || 'Unassigned';
  const roomCategory = reservation.room_type || reservation.roomType || 'Standard Room';
  const checkIn = reservation.check_in || reservation.checkIn || 'N/A';
  const checkOut = reservation.check_out || reservation.checkOut || 'N/A';
  const nights = reservation.nights || 1;
  const source = reservation.source || 'Direct Booking';
  const status = String(reservation.status || 'CONFIRMED').toUpperCase();
  const paymentStatus = String(reservation.payment || (Number(reservation.paid) >= Number(reservation.amount) ? 'PAID' : 'PENDING')).toUpperCase();
  const paymentMode = reservation.payment_mode || reservation.paymentMode || 'UPI';

  // Exact backend data - zero synthesized markups
  const totalAmount = Number(reservation.amount !== undefined ? reservation.amount : (reservation.total || 0));
  const paidAmount = Number(reservation.paid !== undefined ? reservation.paid : (reservation.advance_paid || 0));
  const balanceDue = Math.max(0, totalAmount - paidAmount);

  // Formatter
  const fmt = (val) => Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      const normalized = String(ts).includes(' ') && !String(ts).includes('T') ? String(ts).replace(' ', 'T') : String(ts);
      const d = new Date(normalized);
      if (Number.isNaN(d.getTime())) return String(ts);
      return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return String(ts);
    }
  };

  const actualCheckInDisplay = reservation.actual_check_in_time || reservation.actualCheckInTime
    ? formatTimestamp(reservation.actual_check_in_time || reservation.actualCheckInTime)
    : (status === 'CHECKED_IN' || status === 'OCCUPIED' ? 'In-House (Active)' : 'Pending Check-In');

  const actualCheckOutDisplay = reservation.actual_check_out_time || reservation.actualCheckOutTime
    ? formatTimestamp(reservation.actual_check_out_time || reservation.actualCheckOutTime)
    : (status === 'CHECKED_OUT' ? 'Checked Out' : 'Scheduled');

  // Status badge colors
  const statusColors = {
    CONFIRMED: 'bg-sky-100 text-sky-800 border-sky-300',
    RESERVED: 'bg-violet-100 text-violet-800 border-violet-300',
    CHECKED_IN: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    OCCUPIED: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    CHECKED_OUT: 'bg-slate-100 text-slate-800 border-slate-300',
    CANCELLED: 'bg-rose-100 text-rose-800 border-rose-300'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black tracking-wide">Reservation Details</h3>
                <span className="text-[11px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-400/30">
                  #{resId}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[status] || statusColors.CONFIRMED}`}>
                  {status}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">Room #{roomNum} • {guestName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Guest & Property Allocation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Primary Guest</span>
              {isEditingName ? (
                <form onSubmit={handleSaveGuestName} className="flex items-center gap-1.5 mt-1">
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.stopPropagation();
                        setIsEditingName(false);
                      }
                    }}
                    placeholder="Enter real customer name"
                    autoFocus
                    maxLength={150}
                    className="flex-1 min-w-0 px-2.5 py-1 text-xs font-bold text-slate-900 bg-white border border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="submit"
                    disabled={isSavingName || !draftName.trim()}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Check className="w-3 h-3" />
                    <span>{isSavingName ? '...' : 'Save'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="p-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 cursor-pointer shrink-0"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    {guestName}
                  </p>
                  {activeReservation.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftName(guestName);
                        setIsEditingName(true);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold transition cursor-pointer"
                      title="Edit customer real name"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Room & Category</span>
              <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <BedDouble className="w-3.5 h-3.5 text-indigo-600" />
                Room #{roomNum} ({roomCategory})
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Contact Phone</span>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {phone}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Contact Email</span>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {email}
              </p>
            </div>
          </div>

          {/* Stay Timings & Audit Dates */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stay & Check-In / Check-Out Schedule</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block">Check-In Date</span>
                <span className="font-bold text-slate-900">{checkIn}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block">Check-Out Date</span>
                <span className="font-bold text-slate-900">{checkOut}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block">Stay Duration</span>
                <span className="font-bold text-slate-900">{nights} Night(s)</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block">Booking Source</span>
                <span className="font-bold text-slate-900 truncate block">{source}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-slate-200/60">
                <span className="text-slate-500">Actual Check-In:</span>
                <span className="font-semibold text-slate-800">{actualCheckInDisplay}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-slate-200/60">
                <span className="text-slate-500">Actual Check-Out:</span>
                <span className="font-semibold text-slate-800">{actualCheckOutDisplay}</span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown (Exact Backend Data) */}
          <div className="bg-gradient-to-br from-indigo-50/50 via-sky-50/30 to-slate-50 p-4 rounded-2xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-indigo-950 uppercase tracking-wider">
                Financials (From Database)
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                Payment: {paymentStatus} ({paymentMode})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">Booking Total</span>
                <span className="text-base font-black text-slate-900 font-mono">₹{fmt(totalAmount)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">Paid / Advance</span>
                <span className="text-base font-black text-emerald-700 font-mono">₹{fmt(paidAmount)}</span>
              </div>
            </div>
          </div>

          {/* Notes / Special Requests (if present) */}
          {reservation.notes && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes / Requests</span>
              <p className="text-slate-700 italic">{reservation.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            {onOpenFolio && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFolio({ ...activeReservation, guest: guestName });
                }}
                className="px-3.5 py-2 rounded-xl bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-xs"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Open Folio & Ledger</span>
              </button>
            )}
            {onOpenInvoice && (
              <button
                onClick={() => {
                  onClose();
                  onOpenInvoice({ ...activeReservation, guest: guestName });
                }}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center space-x-1.5 transition shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Booking Invoice</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
