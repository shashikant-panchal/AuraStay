import React, { useEffect } from 'react';
import {
  X,
  Receipt,
  CreditCard,
  User,
  ArrowRight,
  Clock,
  BedDouble,
  Plus,
  CheckCircle2,
  Sparkles,
  Wrench,
  Utensils,
  Trash2,
  Calendar,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  DoorOpen,
  UserCheck
} from 'lucide-react';

export default function RoomActionsModal({ isOpen, onClose, room, onAction }) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !room) return null;

  const isOccupied = room.effectiveStatus === 'OCCUPIED';
  const isReserved = room.effectiveStatus === 'RESERVED';
  const isVacant = room.effectiveStatus === 'VACANT';
  const isDirty = room.effectiveStatus === 'DIRTY';
  const isBlocked = room.effectiveStatus === 'BLOCKED';

  const formatCheckInBadge = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) return String(ts);
      return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return String(ts);
    }
  };

  const handleSelectAction = (actionKey) => {
    onClose();
    if (onAction) {
      onAction(room, actionKey);
    }
  };

  // Status configuration
  const statusConfig = {
    RESERVED: {
      badgeBg: 'bg-violet-100 text-violet-800 border-violet-200',
      badgeDot: 'bg-violet-600',
      badgeText: 'Reserved',
      headerGradient: 'from-violet-900 via-purple-950 to-slate-900',
      headerAccent: 'text-violet-300'
    },
    OCCUPIED: {
      badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      badgeDot: 'bg-indigo-600',
      badgeText: 'Occupied',
      headerGradient: 'from-indigo-900 via-slate-900 to-indigo-950',
      headerAccent: 'text-indigo-300'
    },
    VACANT: {
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      badgeDot: 'bg-emerald-500',
      badgeText: 'Vacant & Ready',
      headerGradient: 'from-emerald-900 via-teal-950 to-slate-900',
      headerAccent: 'text-emerald-300'
    },
    DIRTY: {
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      badgeDot: 'bg-amber-500',
      badgeText: 'Turnover / Dirty',
      headerGradient: 'from-amber-950 via-slate-900 to-amber-900',
      headerAccent: 'text-amber-300'
    },
    BLOCKED: {
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
      badgeDot: 'bg-rose-500',
      badgeText: 'Under Maintenance',
      headerGradient: 'from-rose-950 via-slate-900 to-rose-900',
      headerAccent: 'text-rose-300'
    }
  };

  const currentTheme = statusConfig[room.effectiveStatus] || statusConfig.VACANT;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/90 overflow-hidden relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className={`bg-gradient-to-r ${currentTheme.headerGradient} text-white p-6 relative overflow-hidden`}>
          {/* Subtle background decoration */}
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/5 rounded-full pointer-events-none blur-xl"></div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center font-mono font-black text-xl text-white shadow-inner">
                {room.roomNumber}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-black tracking-tight text-white">
                    Room #{room.roomNumber}
                  </h2>
                  <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${currentTheme.badgeBg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${currentTheme.badgeDot}`}></span>
                    <span>{currentTheme.badgeText}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {room.category} • {room.floor} • ₹{Number(room.tariff || room.price || 0).toLocaleString('en-IN')}/night
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Occupied or Reserved Guest Card Quick-View */}
          {(isOccupied || isReserved) && (
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs gap-2">
              <div className="min-w-0">
                <div className="flex items-center space-x-2 truncate mr-3">
                  <User className="w-4 h-4 text-indigo-300 shrink-0" />
                  <span className="font-bold text-white truncate">
                    {room.guestName || (isReserved ? 'Reserved Guest' : 'In-House Guest')}
                  </span>
                  {room.stayDates && (
                    <span className="text-slate-300 text-[11px] hidden sm:inline">
                      ({room.stayDates})
                    </span>
                  )}
                </div>
                {isOccupied && room.actualCheckInTime && (
                  <p className="text-[11px] text-emerald-300 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Checked In: {formatCheckInBadge(room.actualCheckInTime)}</span>
                  </p>
                )}
                {isReserved && (
                  <p className="text-[11px] text-amber-200 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Booked • Awaiting Guest Check-In ({room.bookingSource || 'Direct'})</span>
                  </p>
                )}
              </div>
              <div className="shrink-0">
                <span
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-black ${
                    room.balanceDue > 0
                      ? 'bg-rose-500/25 border border-rose-400/40 text-rose-200'
                      : 'bg-emerald-500/25 border border-emerald-400/40 text-emerald-200'
                  }`}
                >
                  {room.balanceDue > 0
                    ? `Due: ₹${Number(room.balanceDue).toLocaleString('en-IN')}`
                    : 'Folio Settled ✓'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Body */}
        <div className="p-5 max-h-[72vh] overflow-y-auto space-y-5">
          {/* Section: Front Desk Operations */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 mb-2.5">
              Front Desk Operations
            </p>

            {isOccupied ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Folio & Billing */}
                <button
                  onClick={() => handleSelectAction('folio')}
                  className="group p-3 rounded-2xl border border-indigo-100 hover:border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50/80 transition-all text-left flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-900">
                        View Folio & Billing
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Ledger, charges & invoices
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                </button>

                {/* Quick Balance / Settle */}
                <button
                  onClick={() => handleSelectAction('balance')}
                  className="group p-3 rounded-2xl border border-emerald-100 hover:border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/80 transition-all text-left flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">
                        Quick Payment Popover
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Instant UPI/Card/Cash
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
                </button>

                {/* Guest 360 */}
                <button
                  onClick={() => handleSelectAction('guest360')}
                  className="group p-3 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-left flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-slate-800">
                        Guest 360 & ID Proof
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Profile, KYC & statutory docs
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
                </button>

                {/* Shift / Move Room */}
                <button
                  onClick={() => handleSelectAction('shift')}
                  className="group p-3 rounded-2xl border border-violet-100 hover:border-violet-300 bg-violet-50/40 hover:bg-violet-50/80 transition-all text-left flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-violet-900">
                        Shift / Move Room
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Transfer guest to other room
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition" />
                </button>

                {/* Extend Stay */}
                <button
                  onClick={() => handleSelectAction('extend')}
                  className="group p-3 rounded-2xl border border-amber-100 hover:border-amber-300 bg-amber-50/40 hover:bg-amber-50/80 transition-all text-left flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-900">
                        Extend Stay
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Add nights & adjust departure
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
                </button>

                {/* Checkout Room */}
                <button
                  onClick={() => handleSelectAction('checkout')}
                  className="group p-3 rounded-2xl border border-rose-200 hover:border-rose-400 bg-rose-50/60 hover:bg-rose-100/70 transition-all text-left flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <BedDouble className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-rose-950">
                        Checkout This Room
                      </h4>
                      <p className="text-[10px] text-rose-700">
                        Release room & finalize folio
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-400 group-hover:text-rose-700 transition" />
                </button>
              </div>
            ) : isReserved ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Check In Guest */}
                <button
                  onClick={() => handleSelectAction('checkin')}
                  className="sm:col-span-2 group p-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 hover:from-violet-700 hover:to-indigo-800 text-white flex items-center justify-between shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                      <UserCheck className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-black tracking-wide">
                        Check In Guest & Mark Occupied
                      </h4>
                      <p className="text-xs text-violet-100">
                        Verify ID, capture arrival timestamp & transition Room #{room.roomNumber} to OCCUPIED
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/90 shrink-0" />
                </button>

                {/* Booking Invoice */}
                <button
                  onClick={() => handleSelectAction('invoice')}
                  className="group p-3 rounded-2xl border border-indigo-100 hover:border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50/80 transition-all text-left flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-900">
                        Booking Invoice
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        View / Print Booking Invoice
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                </button>

                {/* Collect Payment / Folio */}
                <button
                  onClick={() => handleSelectAction('folio')}
                  className="group p-3 rounded-2xl border border-emerald-100 hover:border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/80 transition-all text-left flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">
                        Folio & Collect Advance
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Ledger, payments & charges
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
                </button>
              </div>
            ) : isVacant ? (
              <button
                onClick={() => handleSelectAction('book')}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white flex items-center justify-between shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-black tracking-wide">
                      Create Reservation / Walk-In
                    </h4>
                    <p className="text-xs text-emerald-100">
                      Book Room #{room.roomNumber} immediately for an arriving guest
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-200" />
              </button>
            ) : isDirty ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">
                      Turnover & Housekeeping Required
                    </h4>
                    <p className="text-[10px] text-amber-700">
                      Mark as clean once sanitized before assigning a new guest
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSelectAction('clean')}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
                >
                  Mark Clean
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-900">
                      Room Currently Blocked
                    </h4>
                    <p className="text-[10px] text-rose-700">
                      {room.housekeeping || 'Maintenance / Service in progress'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSelectAction('block')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition"
                >
                  Unblock
                </button>
              </div>
            )}
          </div>

          {/* Section: Housekeeping & Amenities */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 mb-2.5">
              Housekeeping & Services
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Clean / Dirty Toggle */}
              <button
                onClick={() =>
                  handleSelectAction(room.effectiveStatus === 'DIRTY' ? 'clean' : 'dirty')
                }
                className="group p-3 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-left flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      room.effectiveStatus === 'DIRTY'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {room.effectiveStatus === 'DIRTY' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {room.effectiveStatus === 'DIRTY'
                        ? 'Mark as Ready / Clean'
                        : 'Mark as Dirty'}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {room.effectiveStatus === 'DIRTY'
                        ? 'Inspect & make available'
                        : 'Flag for turnover cleaning'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
              </button>

              {/* Block / Unblock Maintenance */}
              <button
                onClick={() => handleSelectAction('block')}
                className={`group p-3 rounded-2xl border transition-all text-left flex items-center justify-between shadow-2xs ${
                  isBlocked
                    ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60'
                    : 'border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50/40'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      isBlocked ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {isBlocked ? 'Unblock Room' : 'Block for Maintenance'}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {isBlocked ? 'Return to active matrix' : 'Lock for HVAC/repairs'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
              </button>

              {/* Digital Menu QR / URL */}
              <button
                onClick={() => handleSelectAction('fnb')}
                className="group p-3 rounded-2xl border border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50/40 transition-all text-left flex items-center justify-between shadow-2xs sm:col-span-2"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-900">
                      Copy Digital In-Room Menu Link
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Copies digital QR ordering link for Room #{room.roomNumber}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
              </button>
            </div>
          </div>

          {/* Section: Room Administration */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

