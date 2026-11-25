import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Home,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Plus,
  Check,
  X,
  Search,
  BedDouble,
  Receipt,
  UserCheck,
  LogOut,
  Clock,
  Edit3,
  BarChart2,
  ChevronsUpDown
} from 'lucide-react';
import FolioBillingModal from '../modals/FolioBillingModal';
import CheckInModal from '../modals/CheckInModal';
import CollectPaymentModal from '../modals/CollectPaymentModal';
import { compareCategoryNames, compareRoomNumbers } from '../../utils/roomSort';
import { resolveRoomTodayState } from '../../utils/roomState';

function toLocalIsoDate(dateObj = new Date()) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseLocalDate(isoStr) {
  if (!isoStr) return null;
  const clean = String(isoStr).slice(0, 10);
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEffectiveRoomStatus(room, reservations = [], todayStr = '') {
  const state = resolveRoomTodayState(room, reservations, todayStr);
  return { status: state.stayViewStatus, activeRes: state.activeReservation };
}

export default function StayViewCalendar() {
  const {
    currentHotel,
    showNotification,
    setIsCreateReservationModalOpen,
    openCreateReservationModal,
    openEditRoomModal,
    updateReservationGuestName,
    checkOutReservation,
    requestCheckout,
    scheduleRealtimeRefresh,
    rooms = [],
    reservations = []
  } = useDashboard();

  // Interactive Controls State
  const [quickActionsActive, setQuickActionsActive] = useState(true);
  const [showMetricsRows, setShowMetricsRows] = useState(true);
  const [isUnallocatedOpen, setIsUnallocatedOpen] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [daysSpan, setDaysSpan] = useState(14); // 7 | 14 | 30
  const [timelineOffset, setTimelineOffset] = useState(-2); // Start 2 days prior to Today

  // Modals State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditingBookingGuest, setIsEditingBookingGuest] = useState(false);
  const [draftBookingGuest, setDraftBookingGuest] = useState('');
  const [isSavingBookingGuest, setIsSavingBookingGuest] = useState(false);
  const [isFolioModalOpen, setIsFolioModalOpen] = useState(false);

  const handleSaveBookingGuestName = async (e) => {
    e.preventDefault();
    const cleanName = draftBookingGuest.trim();
    if (!cleanName || !selectedBooking?.id || !updateReservationGuestName) return;
    if (cleanName === selectedBooking.guest) {
      setIsEditingBookingGuest(false);
      return;
    }
    setIsSavingBookingGuest(true);
    try {
      const result = await updateReservationGuestName(selectedBooking.id, cleanName);
      if (result?.success) {
        setSelectedBooking(prev => (prev ? { ...prev, guest: result.guest || cleanName } : prev));
        setIsEditingBookingGuest(false);
      }
    } finally {
      setIsSavingBookingGuest(false);
    }
  };
  const [folioActiveBooking, setFolioActiveBooking] = useState(null);
  const [checkInModalRes, setCheckInModalRes] = useState(null);
  const [collectPaymentModalRes, setCollectPaymentModalRes] = useState(null);

  // Category collapse states
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const todayStr = toLocalIsoDate(new Date());

  const triggerCreateReservation = (prefill = null) => {
    if (openCreateReservationModal) {
      openCreateReservationModal(prefill);
    } else if (setIsCreateReservationModalOpen) {
      setIsCreateReservationModalOpen(true);
    }
  };

  // Unallocated bookings without an assigned room number
  const unallocatedList = useMemo(() => {
    return (reservations || [])
      .filter(res => {
        const st = String(res.status || '').toUpperCase();
        if (['CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW'].includes(st)) return false;
        const roomStr = String(res.room_number || res.room || '').trim();
        return (
          !roomStr ||
          roomStr === '0' ||
          ['unallocated', 'unassigned', 'pending'].includes(roomStr.toLowerCase())
        );
      })
      .map(res => ({
        id: res.id,
        guest: res.guest || 'Guest',
        source: res.source || 'Direct',
        category: res.room_type || res.roomType || 'Standard Room',
        checkIn: String(res.check_in || res.checkIn || '').slice(0, 10),
        checkOut: String(res.check_out || res.checkOut || '').slice(0, 10),
        amount: `₹ ${Number(res.amount || res.price || 0).toLocaleString('en-IN')}`,
        raw: res
      }));
  }, [reservations]);

  // Top KPI Snapshot Counts across all rooms
  const roomStatusSummary = useMemo(() => {
    let vacant = 0;
    let reserved = 0;
    let occupied = 0;
    let dirty = 0;
    let maintenance = 0;
    (rooms || []).forEach(r => {
      const { status } = getEffectiveRoomStatus(r, reservations, todayStr);
      if (status === 'VACANT_READY') vacant += 1;
      else if (status === 'RESERVED') reserved += 1;
      else if (status === 'OCCUPIED') occupied += 1;
      else if (status === 'DIRTY') dirty += 1;
      else maintenance += 1;
    });
    return {
      total: (rooms || []).length,
      vacant,
      reserved,
      occupied,
      dirty,
      maintenance
    };
  }, [rooms, reservations, todayStr]);

  // Dynamic sorted category filter options (Standard -> Deluxe -> Executive -> others)
  const categoryFilterOptions = useMemo(() => {
    const set = new Set();
    (rooms || []).forEach(r => {
      set.add(String(r.type || r.category || 'Standard Room').trim());
    });
    return ['ALL', ...Array.from(set).sort(compareCategoryNames)];
  }, [rooms]);

  // Timeline Columns (7 / 14 / 30 days) with accurate occupancy & nightly revenue
  const timelineDays = useMemo(() => {
    const baseToday = new Date();
    baseToday.setHours(0, 0, 0, 0);
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    return Array.from({ length: daysSpan }, (_, i) => {
      const d = new Date(baseToday);
      d.setDate(baseToday.getDate() + timelineOffset + i);
      const dayDate = toLocalIsoDate(d);
      const isToday = dayDate === todayStr;
      const weekend = d.getDay() === 0 || d.getDay() === 6;

      // Active reservations occupying a night starting on dayDate
      const activeStaysOnDay = (reservations || []).filter(res => {
        const st = String(res.status || '').toUpperCase();
        if (['CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW'].includes(st)) return false;
        const cIn = String(res.check_in || res.checkIn || '').slice(0, 10);
        const cOut = String(res.check_out || res.checkOut || '').slice(0, 10);
        if (!cIn || !cOut) return false;
        if (cIn === cOut) return cIn === dayDate;
        return cIn <= dayDate && cOut > dayDate;
      });

      const bookedOnDay = activeStaysOnDay.length;
      const availableCount = Math.max(0, (rooms || []).length - bookedOnDay);
      const occupancyRate = (rooms || []).length > 0 ? Math.round((bookedOnDay / rooms.length) * 100) : 0;

      const dayRevenue = activeStaysOnDay.reduce((sum, res) => {
        const dIn = parseLocalDate(res.check_in || res.checkIn);
        const dOut = parseLocalDate(res.check_out || res.checkOut);
        const nights = dIn && dOut ? Math.max(1, Math.round((dOut - dIn) / 86400000)) : Math.max(1, Number(res.nights) || 1);
        const amt = Number(res.amount || res.price || 0);
        return sum + (amt > 0 ? amt / nights : 2500);
      }, 0);

      const adrVal = bookedOnDay > 0 ? Math.round(dayRevenue / bookedOnDay) : 0;

      return {
        date: dayDate,
        month: monthNames[d.getMonth()],
        dayNum: String(d.getDate()),
        dayName: dayNames[d.getDay()],
        weekend,
        isToday,
        availableRooms: availableCount,
        bookedRooms: bookedOnDay,
        occupancy: Math.min(100, occupancyRate),
        revenue: `₹ ${Math.round(dayRevenue).toLocaleString('en-IN')}`,
        adr: `₹ ${adrVal.toLocaleString('en-IN')}`
      };
    });
  }, [timelineOffset, daysSpan, reservations, rooms, todayStr]);

  // Build ordered & filtered categories (Standard -> Deluxe -> Executive -> others)
  const categoryConfig = useMemo(() => {
    if (!rooms || rooms.length === 0 || timelineDays.length === 0) return [];
    const grouped = {};
    const startDate = parseLocalDate(timelineDays[0].date);
    const numDays = timelineDays.length;
    const q = searchQuery.trim().toLowerCase();

    rooms.forEach(r => {
      const type = String(r.type || r.category || 'Standard Room').trim();
      if (selectedCategory !== 'ALL' && type !== selectedCategory) return;

      const { status: effectiveStatus, activeRes } = getEffectiveRoomStatus(r, reservations, todayStr);
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'DIRTY_MAINT') {
          if (effectiveStatus !== 'DIRTY' && effectiveStatus !== 'MAINTENANCE') return;
        } else if (effectiveStatus !== statusFilter) {
          return;
        }
      }

      const rNum = String(r.roomNumber || r.room_number || r.id).trim();
      const rNumDigits = rNum.replace(/\D/g, '') || rNum;

      // Map all matching non-cancelled reservations onto this room's timeline row
      const roomBookings = [];
      (reservations || []).forEach(res => {
        const stUpper = String(res.status || '').toUpperCase();
        if (stUpper === 'CANCELLED' || stUpper === 'NO_SHOW') return;

        const resRoomNumRaw = String(res.room_number || '').trim();
        const resRoomFieldRaw = String(res.room || '').trim();
        const matchNum = resRoomFieldRaw.match(/\b(\d+)\b/);
        const matchesRoom =
          resRoomNumRaw === rNum ||
          (resRoomNumRaw && resRoomNumRaw.replace(/\D/g, '') === rNumDigits) ||
          (matchNum && matchNum[1] === rNum) ||
          resRoomFieldRaw === `Room ${rNum}` ||
          resRoomFieldRaw === rNum;

        if (!matchesRoom) return;

        const checkInStr = String(res.check_in || res.checkIn || '').slice(0, 10);
        const checkOutStr = String(res.check_out || res.checkOut || '').slice(0, 10);
        const resCheckIn = parseLocalDate(checkInStr);
        const resCheckOut = parseLocalDate(checkOutStr);
        if (!resCheckIn || !resCheckOut || !startDate) return;

        const diffInDays = Math.round((resCheckIn - startDate) / 86400000);
        // Same-day stays occupy 1 visual day; overnight stays run [checkIn, checkOut)
        const rawOutDiff = Math.round((resCheckOut - startDate) / 86400000);
        const visualEndIdx = Math.max(diffInDays + 1, rawOutDiff);

        if (visualEndIdx > 0 && diffInDays < numDays) {
          const startIdx = Math.max(0, diffInDays);
          const endIdx = Math.min(numDays, visualEndIdx);
          const span = Math.max(1, endIdx - startIdx);
          const nights = Math.max(1, Math.round((resCheckOut - resCheckIn) / 86400000));

          const isCheckedIn = stUpper === 'CHECKED_IN' || stUpper === 'CHECKEDIN';
          const isCheckedOut = stUpper === 'CHECKED_OUT' || stUpper === 'CHECKEDOUT';

          const barColor = isCheckedIn
            ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-700 text-white'
            : isCheckedOut
              ? 'bg-slate-600 hover:bg-slate-700 border-slate-700 text-white'
              : 'bg-violet-600 hover:bg-violet-700 border-violet-700 text-white';

          const totalAmt = Number(res.amount || res.price || 0);
          const paidAmt = Number(res.paid || res.advance_paid || (res.payment === 'PAID' ? totalAmt : 0));
          const dueAmt = Math.max(0, totalAmt - paidAmt);

          roomBookings.push({
            id: res.id,
            guest: res.guest || 'Guest',
            statusTag: isCheckedOut ? 'Checked Out' : isCheckedIn ? 'Occupied' : 'Reserved',
            shortLabel: res.guest || 'Guest',
            startIdx,
            span,
            nights,
            amount: `₹${totalAmt.toLocaleString('en-IN')}`,
            rawAmount: totalAmt,
            paid: paidAmt,
            dueAmount: dueAmt,
            payment: dueAmt === 0 && totalAmt > 0 ? 'PAID' : (res.payment || 'PENDING'),
            status: res.status || 'CONFIRMED',
            source: res.source || 'Direct',
            roomType: type,
            roomNumber: rNum,
            checkIn: checkInStr,
            checkOut: checkOutStr,
            actualCheckInTime: res.actualCheckInTime || res.actual_check_in_time || null,
            actualCheckOutTime: res.actualCheckOutTime || res.actual_check_out_time || null,
            phone: res.guest_phone || res.phone || 'N/A',
            email: res.guest_email || res.email || 'N/A',
            ratePlan: res.rate_plan || res.ratePlan || 'EP - Room Only',
            color: barColor,
            rawRes: res
          });
        }
      });

      // Apply search filter against room #, floor, category, guest, phone, or booking ID
      if (q) {
        const matchRoom =
          rNum.toLowerCase().includes(q) ||
          type.toLowerCase().includes(q) ||
          String(r.floor || '').toLowerCase().includes(q) ||
          String(activeRes?.guest || r.guest || '').toLowerCase().includes(q);
        const matchBooking = roomBookings.some(
          b =>
            b.guest.toLowerCase().includes(q) ||
            String(b.id).toLowerCase().includes(q) ||
            String(b.phone).toLowerCase().includes(q)
        );
        if (!matchRoom && !matchBooking) return;
      }

      if (!grouped[type]) {
        grouped[type] = {
          id: type,
          name: type,
          inventory: 0,
          dailyStats: timelineDays.map(() => ({ booked: 0, available: 0 })),
          rooms: []
        };
      }

      grouped[type].inventory += 1;

      // Update category per-day booked counters using active stays only
      roomBookings.forEach(b => {
        const stUpper = String(b.status || '').toUpperCase();
        if (stUpper === 'CHECKED_OUT' || stUpper === 'CHECKEDOUT') return;
        for (let d = b.startIdx; d < Math.min(numDays, b.startIdx + b.span); d++) {
          if (grouped[type].dailyStats[d]) {
            grouped[type].dailyStats[d].booked += 1;
          }
        }
      });

      grouped[type].rooms.push({
        id: rNum,
        name: rNum,
        floor: r.floor || 'Floor 1',
        bed: r.bed || 'King Bed',
        price: Number(r.price || r.tariff || 2500),
        effectiveStatus,
        activeGuest: activeRes?.guest || (effectiveStatus === 'OCCUPIED' || effectiveStatus === 'RESERVED' ? r.guest : null),
        bookings: roomBookings,
        rawRoom: r
      });
    });

    Object.values(grouped).forEach(cat => {
      cat.dailyStats.forEach(st => {
        st.available = Math.max(0, cat.inventory - st.booked);
      });
      cat.rooms.sort(compareRoomNumbers);
    });

    return Object.values(grouped).sort((a, b) => compareCategoryNames(a.name, b.name));
  }, [rooms, reservations, timelineDays, searchQuery, selectedCategory, statusFilter, todayStr]);

  const areAllCollapsed =
    categoryConfig.length > 0 && categoryConfig.every(cat => Boolean(collapsedCategories[cat.id]));

  const toggleAllCategories = () => {
    if (areAllCollapsed) {
      setCollapsedCategories({});
    } else {
      const next = {};
      categoryConfig.forEach(cat => {
        next[cat.id] = true;
      });
      setCollapsedCategories(next);
    }
  };

  const toggleCategory = (catId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleAllocateRoom = (booking) => {
    const rawRes = booking.raw || (reservations || []).find(r => r.id === booking.id);
    if (rawRes) {
      setCheckInModalRes(rawRes);
    } else {
      showNotification(`Ready to allocate room for ${booking.guest}`);
    }
    setIsUnallocatedOpen(false);
  };

  const colMinWidthClass =
    daysSpan === 7 ? 'min-w-[140px]' : daysSpan === 14 ? 'min-w-[108px]' : 'min-w-[78px]';

  const statusBadgeMeta = {
    VACANT_READY: {
      label: 'Ready',
      pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500'
    },
    RESERVED: {
      label: 'Reserved',
      pill: 'bg-violet-50 text-violet-700 border-violet-200',
      dot: 'bg-violet-500'
    },
    OCCUPIED: {
      label: 'Occupied',
      pill: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500'
    },
    DIRTY: {
      label: 'Dirty',
      pill: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500'
    },
    MAINTENANCE: {
      label: 'Maint',
      pill: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500'
    }
  };

  return (
    <div className="space-y-4 select-none pb-8">
      {/* 1. Prominent Header Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Stay Overview &amp; Room Timeline
            </h1>
            <span className="text-[11px] font-black uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded-full">
              {currentHotel?.name || 'Property'} • {roomStatusSummary.total} Rooms
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Click any guest bar to inspect folio, check in, or check out — or click any empty date cell to book that room directly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Actions Toggle (Shows 1-click In / Out / ₹ directly on timeline bars) */}
          <button
            type="button"
            onClick={() => {
              setQuickActionsActive(prev => !prev);
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              quickActionsActive
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Show inline Check-In / Check-Out / Payment buttons directly inside stay bars"
          >
            <span>Inline Quick Actions</span>
            <span
              className={`w-7 h-4 flex items-center rounded-full p-0.5 transition ${
                quickActionsActive ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-white shadow-xs" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowMetricsRows(prev => !prev)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showMetricsRows
                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle daily occupancy and revenue summary rows"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{showMetricsRows ? 'Hide Metrics' : 'Show Metrics'}</span>
          </button>

          <button
            type="button"
            onClick={() => triggerCreateReservation(null)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* 2. Clickable Live KPI Strip for Today */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`text-left bg-white rounded-2xl p-3.5 border transition cursor-pointer shadow-2xs ${
            statusFilter === 'ALL'
              ? 'ring-2 ring-slate-900 border-slate-900'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
            <span>All Rooms</span>
            <BedDouble className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-slate-900">{roomStatusSummary.total}</span>
            <span className="text-[11px] font-semibold text-slate-500">Full Matrix</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'VACANT_READY' ? 'ALL' : 'VACANT_READY')}
          className={`text-left bg-white rounded-2xl p-3.5 border transition cursor-pointer shadow-2xs ${
            statusFilter === 'VACANT_READY'
              ? 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50/40'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-emerald-700">
            <span>Vacant Ready</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-emerald-700">{roomStatusSummary.vacant}</span>
            <span className="text-[11px] font-semibold text-emerald-600">Sellable Now</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'RESERVED' ? 'ALL' : 'RESERVED')}
          className={`text-left bg-white rounded-2xl p-3.5 border transition cursor-pointer shadow-2xs ${
            statusFilter === 'RESERVED'
              ? 'ring-2 ring-violet-600 border-violet-600 bg-violet-50/40'
              : 'border-slate-200 hover:border-violet-300'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-violet-700">
            <span>Reserved Today</span>
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-violet-700">{roomStatusSummary.reserved}</span>
            <span className="text-[11px] font-semibold text-violet-600">Awaiting Check-In</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'OCCUPIED' ? 'ALL' : 'OCCUPIED')}
          className={`text-left bg-white rounded-2xl p-3.5 border transition cursor-pointer shadow-2xs ${
            statusFilter === 'OCCUPIED'
              ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/40'
              : 'border-slate-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-indigo-700">
            <span>Occupied</span>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-indigo-700">{roomStatusSummary.occupied}</span>
            <span className="text-[11px] font-semibold text-indigo-600">In-House Guests</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'DIRTY_MAINT' ? 'ALL' : 'DIRTY_MAINT')}
          className={`text-left bg-white rounded-2xl p-3.5 border transition cursor-pointer shadow-2xs col-span-2 sm:col-span-1 ${
            statusFilter === 'DIRTY_MAINT'
              ? 'ring-2 ring-amber-600 border-amber-600 bg-amber-50/40'
              : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-700">
            <span>Dirty / Maint</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-amber-700">
              {roomStatusSummary.dirty + roomStatusSummary.maintenance}
            </span>
            <span className="text-[11px] font-semibold text-amber-600">
              {roomStatusSummary.dirty} Dirty • {roomStatusSummary.maintenance} Maint
            </span>
          </div>
        </button>
      </div>

      {/* 3. Unallocated Bookings Banner (Only highlighted rose when bookings actually need allocation) */}
      <div
        className={`rounded-2xl border px-4 py-3 transition-all shadow-2xs ${
          unallocatedList.length > 0
            ? 'bg-rose-50/80 border-rose-300'
            : 'bg-emerald-50/60 border-emerald-200'
        }`}
      >
        <div
          onClick={() => setIsUnallocatedOpen(!isUnallocatedOpen)}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                unallocatedList.length > 0
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {unallocatedList.length > 0 ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
            <div>
              <div
                className={`font-extrabold text-xs sm:text-sm leading-tight ${
                  unallocatedList.length > 0 ? 'text-rose-900' : 'text-emerald-900'
                }`}
              >
                {unallocatedList.length > 0
                  ? `Unallocated Bookings (${unallocatedList.length} pending room assignment)`
                  : 'All Active Bookings Assigned to Physical Rooms'}
              </div>
              {unallocatedList.length > 0 && (
                <div className="text-[11px] text-rose-700 mt-0.5">
                  Click here to inspect and assign rooms before guest arrival.
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className={`p-1 transition ${
              unallocatedList.length > 0 ? 'text-rose-600 hover:text-rose-800' : 'text-emerald-700 hover:text-emerald-900'
            }`}
            title="Toggle Unallocated Bookings"
          >
            {isUnallocatedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isUnallocatedOpen && (
          <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-2">
            {unallocatedList.length === 0 ? (
              <div className="text-xs text-emerald-800 py-1 font-medium">
                Every active reservation already has an assigned physical room.
              </div>
            ) : (
              unallocatedList.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-3 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="text-xs space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-800">{item.id}</span>
                      <span className="font-bold text-slate-900">{item.guest}</span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {item.source}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      Requested: <strong className="text-slate-700">{item.category}</strong> • Stay:{' '}
                      {item.checkIn} – {item.checkOut} • Total: {item.amount}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAllocateRoom(item)}
                    className="px-3.5 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs rounded-lg shadow-sm transition cursor-pointer"
                  >
                    Allocate Room
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 4. Search, Filters & Timeline Controls Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Left: Search & Category/Status Filters */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[210px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search room #, guest name, booking ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              {categoryFilterOptions.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Room Categories' : cat}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="VACANT_READY">Vacant Ready</option>
              <option value="RESERVED">Reserved (Not Checked In)</option>
              <option value="OCCUPIED">Occupied (Checked In)</option>
              <option value="DIRTY_MAINT">Dirty / Maintenance</option>
            </select>

            {(searchQuery || selectedCategory !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setStatusFilter('ALL');
                }}
                className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Right: Timeline Range & Date Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Day Span Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              {[7, 14, 30].map(spanVal => (
                <button
                  key={spanVal}
                  type="button"
                  onClick={() => setDaysSpan(spanVal)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    daysSpan === spanVal
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {spanVal}D
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setTimelineOffset(prev => prev - Math.min(7, daysSpan))}
              className="px-2.5 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center space-x-1 text-slate-700 font-bold text-xs transition cursor-pointer"
              title="Previous Window"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <button
              type="button"
              onClick={() => setTimelineOffset(-2)}
              className="px-3 h-9 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-900 font-bold text-xs transition cursor-pointer"
              title="Center on Today"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setTimelineOffset(prev => prev + Math.min(7, daysSpan))}
              className="px-2.5 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center space-x-1 text-slate-700 font-bold text-xs transition cursor-pointer"
              title="Next Window"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="h-9 px-2.5 rounded-xl border border-slate-200 bg-white flex items-center space-x-2">
              <span className="text-[11px] font-mono font-bold text-slate-700">
                {timelineDays[0]?.date} → {timelineDays[timelineDays.length - 1]?.date}
              </span>
              <input
                type="date"
                value={timelineDays[0]?.date || ''}
                onChange={e => {
                  const target = parseLocalDate(e.target.value);
                  if (target) {
                    const baseToday = new Date();
                    baseToday.setHours(0, 0, 0, 0);
                    setTimelineOffset(Math.round((target - baseToday) / 86400000));
                  }
                }}
                className="text-xs border-0 bg-transparent cursor-pointer p-0 w-5 opacity-75 hover:opacity-100"
                title="Jump Timeline to Date"
              />
            </div>

            <button
              type="button"
              onClick={toggleAllCategories}
              className="h-9 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              title={areAllCollapsed ? 'Expand all room categories' : 'Collapse all room categories'}
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{areAllCollapsed ? 'Expand' : 'Collapse'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (scheduleRealtimeRefresh) scheduleRealtimeRefresh();
                showNotification('Stay Overview synchronized with latest live room & reservation data.');
              }}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer"
              title="Refresh Stay Overview"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Clear High-Contrast Legend Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-[11px] font-bold text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              <span>Available / Ready</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-violet-600 inline-block" />
              <span>Reserved (Not Checked In)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />
              <span>Occupied (Checked In)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-600 inline-block" />
              <span>Checked Out (History)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
              <span>Dirty / Cleaning</span>
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            Category Order: Standard → Deluxe → Executive
          </span>
        </div>
      </div>

      {/* 5. Interactive Stay Overview Timeline Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-3.5 w-56 min-w-[224px] border-r border-slate-200 font-black text-xs text-slate-700 uppercase tracking-wider sticky left-0 bg-slate-50 z-20">
                  Room &amp; Status
                </th>
                {timelineDays.map(d => (
                  <th
                    key={d.date}
                    className={`p-2.5 text-center border-r border-slate-200 text-xs ${colMinWidthClass} ${
                      d.isToday
                        ? 'bg-sky-100/90 text-sky-950 border-b-2 border-sky-500 font-black'
                        : d.weekend
                          ? 'bg-[#fff8e7] text-amber-900 border-b-2 border-amber-300 font-bold'
                          : 'text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{d.month}</span>
                      {d.isToday && (
                        <span className="text-[9px] font-black uppercase bg-sky-600 text-white px-1.5 py-0.2 rounded">
                          TODAY
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-black mt-0.5">{d.dayNum}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">{d.dayName}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {showMetricsRows && (
                <>
                  {/* SUMMARY ROW 1: Available Rooms */}
                  <tr className="border-b border-slate-200 hover:bg-slate-50/40">
                    <td className="p-3 border-r border-slate-200 font-bold text-xs text-slate-800 sticky left-0 bg-white z-10">
                      <div className="flex items-center space-x-2">
                        <Home className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Available Rooms</span>
                      </div>
                    </td>
                    {timelineDays.map(d => (
                      <td
                        key={d.date}
                        className={`p-2 text-center border-r border-slate-200 ${
                          d.isToday ? 'bg-sky-50/60' : d.weekend ? 'bg-[#fff8e7]/50' : ''
                        }`}
                      >
                        <span className="inline-block bg-emerald-100 text-emerald-800 font-black text-xs px-2.5 py-0.5 rounded-md">
                          {d.availableRooms}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* SUMMARY ROW 2: Occupancy */}
                  <tr className="border-b border-slate-200 hover:bg-slate-50/40">
                    <td className="p-3 border-r border-slate-200 font-bold text-xs text-slate-800 sticky left-0 bg-white z-10">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-sky-600 shrink-0" />
                        <span>Occupancy %</span>
                      </div>
                    </td>
                    {timelineDays.map(d => (
                      <td
                        key={d.date}
                        className={`p-2 text-center border-r border-slate-200 ${
                          d.isToday ? 'bg-sky-50/60' : d.weekend ? 'bg-[#fff8e7]/50' : ''
                        }`}
                      >
                        <div className="text-xs font-black text-sky-900">{d.occupancy}%</div>
                        <div className="w-12 mx-auto bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          {d.occupancy > 0 && (
                            <div
                              className="bg-sky-600 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, d.occupancy)}%` }}
                            />
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* SUMMARY ROW 3: Estimated Room Revenue & ADR */}
                  <tr className="border-b-2 border-slate-300 hover:bg-slate-50/40">
                    <td className="p-3 border-r border-slate-200 font-bold text-xs text-slate-800 sticky left-0 bg-white z-10">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-emerald-600 w-4 text-center">₹</span>
                        <span>Daily Revenue</span>
                      </div>
                    </td>
                    {timelineDays.map(d => (
                      <td
                        key={d.date}
                        className={`p-2 text-center border-r border-slate-200 ${
                          d.isToday ? 'bg-sky-50/60' : d.weekend ? 'bg-[#fff8e7]/50' : ''
                        }`}
                      >
                        <div className="text-xs font-black text-slate-900">{d.revenue}</div>
                        <div className="text-[10px] font-semibold text-slate-400 mt-0.5">ADR {d.adr}</div>
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* ROOM CATEGORIES (Ordered: Standard -> Deluxe -> Executive -> Custom) */}
              {categoryConfig.length === 0 ? (
                <tr>
                  <td colSpan={timelineDays.length + 1} className="py-14 text-center text-slate-500 text-xs space-y-2">
                    <BedDouble className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700 text-sm">
                      {rooms.length === 0
                        ? 'No rooms configured yet'
                        : 'No rooms match your current filters'}
                    </p>
                    <p className="text-slate-400">
                      {rooms.length === 0
                        ? 'Add rooms in Rate Plans & Tariffs or Quick Links to populate Stay Overview.'
                        : 'Clear your search query or status filter to view all rooms.'}
                    </p>
                  </td>
                </tr>
              ) : (
                categoryConfig.map(cat => {
                  const isCollapsed = Boolean(collapsedCategories[cat.id]);

                  return (
                    <React.Fragment key={cat.id}>
                      {/* Category Accordion Bar */}
                      <tr
                        onClick={() => toggleCategory(cat.id)}
                        className="border-b border-slate-200 bg-slate-100/80 hover:bg-slate-200/60 cursor-pointer transition"
                      >
                        <td className="p-3 border-r border-slate-200 sticky left-0 bg-slate-100 z-10">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="text-slate-600 shrink-0">
                                {isCollapsed ? (
                                  <ChevronRight className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </span>
                              <span className="font-black text-xs text-slate-900 uppercase tracking-wide truncate">
                                {cat.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-black text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                              {cat.inventory}
                            </span>
                          </div>
                        </td>

                        {cat.dailyStats.map((st, dayIdx) => {
                          const colDay = timelineDays[dayIdx];
                          return (
                            <td
                              key={dayIdx}
                              className={`p-1.5 text-center border-r border-slate-200 ${
                                colDay?.isToday
                                  ? 'bg-sky-100/50'
                                  : colDay?.weekend
                                    ? 'bg-[#fff8e7]/60'
                                    : ''
                              }`}
                            >
                              <div className="inline-flex items-center gap-1 text-[10px] font-black">
                                <span
                                  className={`px-1.5 py-0.5 rounded ${
                                    st.booked > 0
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : 'bg-slate-200/70 text-slate-500'
                                  }`}
                                  title="Booked"
                                >
                                  {st.booked}B
                                </span>
                                <span
                                  className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800"
                                  title="Available"
                                >
                                  {st.available}A
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Room Rows inside Category */}
                      {!isCollapsed &&
                        cat.rooms.map(room => {
                          const meta = statusBadgeMeta[room.effectiveStatus] || statusBadgeMeta.VACANT_READY;

                          return (
                            <tr
                              key={room.id}
                              className="border-b border-slate-200/80 hover:bg-slate-50/50 transition h-16"
                            >
                              {/* Sticky Room Info Cell */}
                              <td className="px-3 py-2 border-r border-slate-200 sticky left-0 bg-white z-10">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`} />
                                      <span className="font-black text-sm font-mono text-slate-900">
                                        #{room.name}
                                      </span>
                                      <span
                                        className={`text-[9.5px] font-black uppercase px-1.5 py-0.5 rounded border ${meta.pill}`}
                                      >
                                        {meta.label}
                                      </span>
                                    </div>
                                    <div className="text-[11px] font-medium text-slate-500 truncate mt-0.5 max-w-[160px]">
                                      {room.activeGuest
                                        ? room.activeGuest
                                        : `₹${room.price.toLocaleString('en-IN')}/n • ${room.floor}`}
                                    </div>
                                  </div>

                                  {openEditRoomModal && (
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation();
                                        openEditRoomModal(room.rawRoom);
                                      }}
                                      className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-700 transition shrink-0 cursor-pointer"
                                      title={`Edit Room #${room.name}`}
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* Timeline Date Cells */}
                              {timelineDays.map((d, dayIdx) => {
                                const bookingsStartingHere = room.bookings.filter(b => b.startIdx === dayIdx);
                                const bookingStartingHere =
                                  bookingsStartingHere.find(
                                    b => !['CHECKED_OUT', 'CHECKEDOUT'].includes(String(b.status || '').toUpperCase())
                                  ) || bookingsStartingHere[0];

                                const isCoveredByPriorBooking = room.bookings.some(
                                  b => dayIdx > b.startIdx && dayIdx < b.startIdx + b.span
                                );

                                if (isCoveredByPriorBooking) {
                                  return null;
                                }

                                if (bookingStartingHere) {
                                  const stUpper = String(bookingStartingHere.status || '').toUpperCase();
                                  const isCheckedIn = stUpper === 'CHECKED_IN' || stUpper === 'CHECKEDIN';
                                  const isCheckedOut = stUpper === 'CHECKED_OUT' || stUpper === 'CHECKEDOUT';

                                  return (
                                    <td
                                      key={dayIdx}
                                      colSpan={bookingStartingHere.span}
                                      className={`p-1.5 border-r border-slate-200 align-middle ${
                                        d.isToday
                                          ? 'bg-sky-50/50'
                                          : d.weekend
                                            ? 'bg-[#fff8e7]/40'
                                            : ''
                                      }`}
                                    >
                                      <div
                                        onClick={() => setSelectedBooking(bookingStartingHere)}
                                        className={`h-12 rounded-xl border ${bookingStartingHere.color} px-3 flex items-center justify-between gap-2 shadow-sm cursor-pointer transition`}
                                        title={`${bookingStartingHere.guest} • Room #${room.name} • ${bookingStartingHere.checkIn} to ${bookingStartingHere.checkOut}`}
                                      >
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1.5">
                                            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                              <Check className="w-2.5 h-2.5 text-white" />
                                            </span>
                                            <span className="text-xs font-black truncate">
                                              {bookingStartingHere.guest}
                                            </span>
                                            <span className="text-[9px] font-black uppercase bg-black/20 px-1.5 py-0.2 rounded shrink-0">
                                              {bookingStartingHere.statusTag}
                                            </span>
                                          </div>
                                          <div className="text-[10px] font-semibold text-white/90 truncate pl-5 mt-0.5">
                                            {bookingStartingHere.amount} •{' '}
                                            {bookingStartingHere.dueAmount > 0
                                              ? `Due ₹${bookingStartingHere.dueAmount.toLocaleString('en-IN')}`
                                              : 'Paid'}{' '}
                                            • {bookingStartingHere.source}
                                          </div>
                                        </div>

                                        {quickActionsActive && !isCheckedOut && (
                                          <div
                                            className="flex items-center gap-1 shrink-0"
                                            onClick={e => e.stopPropagation()}
                                          >
                                            {!isCheckedIn && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setCheckInModalRes(bookingStartingHere.rawRes || bookingStartingHere)
                                                }
                                                className="px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[10px] font-black transition cursor-pointer"
                                                title="Check In Guest"
                                              >
                                                In
                                              </button>
                                            )}
                                            {isCheckedIn && checkOutReservation && (
                                              <button
                                                type="button"
                                                onClick={() => checkOutReservation(bookingStartingHere.id)}
                                                className="px-2 py-1 rounded-lg bg-rose-500/90 hover:bg-rose-500 text-white text-[10px] font-black transition cursor-pointer"
                                                title="Check Out Guest"
                                              >
                                                Out
                                              </button>
                                            )}
                                            {bookingStartingHere.dueAmount > 0 && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setCollectPaymentModalRes(
                                                    bookingStartingHere.rawRes || bookingStartingHere
                                                  )
                                                }
                                                className="px-2 py-1 rounded-lg bg-emerald-500/90 hover:bg-emerald-500 text-white text-[10px] font-black transition cursor-pointer"
                                                title="Collect Payment"
                                              >
                                                ₹
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  );
                                }

                                // Empty Date Cell -> Click to pre-fill booking for this Room + Date
                                return (
                                  <td
                                    key={dayIdx}
                                    onClick={() =>
                                      triggerCreateReservation({
                                        roomNumber: room.id,
                                        checkIn: d.date
                                      })
                                    }
                                    className={`p-1 border-r border-slate-200 text-center relative group cursor-pointer hover:bg-sky-50 transition ${
                                      d.isToday
                                        ? 'bg-sky-50/40'
                                        : d.weekend
                                          ? 'bg-[#fff8e7]/25'
                                          : ''
                                    }`}
                                    title={`Book Room #${room.name} checking in ${d.date}`}
                                  >
                                    <div className="w-full h-11 rounded-lg border border-dashed border-transparent group-hover:border-sky-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-sky-700 bg-white px-2 py-0.5 rounded-full border border-sky-200 shadow-2xs">
                                        <Plus className="w-3 h-3" />
                                        <span>Book</span>
                                      </span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOOKING DETAILS MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${selectedBooking.color}`} />
                <div className="flex-1 min-w-0">
                  {isEditingBookingGuest ? (
                    <form onSubmit={handleSaveBookingGuestName} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={draftBookingGuest}
                        onChange={(e) => setDraftBookingGuest(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setIsEditingBookingGuest(false);
                        }}
                        autoFocus
                        maxLength={150}
                        placeholder="Real customer name"
                        className="flex-1 min-w-0 px-2.5 py-1 text-xs font-bold text-slate-900 bg-white border border-indigo-500 rounded-lg focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isSavingBookingGuest || !draftBookingGuest.trim()}
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Check className="w-3 h-3" />
                        <span>{isSavingBookingGuest ? '...' : 'Save'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingBookingGuest(false)}
                        className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-base text-slate-900 truncate">{selectedBooking.guest}</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setDraftBookingGuest(selectedBooking.guest || '');
                          setIsEditingBookingGuest(true);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold transition cursor-pointer"
                        title="Edit customer real name"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>Edit Name</span>
                      </button>
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Stay Details &amp; Actions
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditingBookingGuest(false);
                  setSelectedBooking(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Booking ID:</span>
                <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {selectedBooking.id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Allocated Room:</span>
                <span className="font-bold text-slate-900">
                  Room #{selectedBooking.roomNumber} ({selectedBooking.roomType})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Stay Dates:</span>
                <span className="font-semibold text-slate-800">
                  {selectedBooking.checkIn} → {selectedBooking.checkOut} ({selectedBooking.nights} Night
                  {selectedBooking.nights > 1 ? 's' : ''})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Actual Check-In:</span>
                </span>
                <span
                  className={`font-semibold ${
                    selectedBooking.actualCheckInTime ? 'text-emerald-700' : 'text-amber-600'
                  }`}
                >
                  {selectedBooking.actualCheckInTime
                    ? new Date(selectedBooking.actualCheckInTime).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })
                    : 'Pending Check-In'}
                </span>
              </div>
              {selectedBooking.actualCheckOutTime && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Actual Check-Out:</span>
                  </span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedBooking.actualCheckOutTime).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Guest Mobile:</span>
                <span className="font-mono font-bold text-slate-700">{selectedBooking.phone || 'Direct'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Guest Email:</span>
                <span className="font-mono text-slate-700">{selectedBooking.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Rate Plan:</span>
                <span className="font-bold text-indigo-700">{selectedBooking.ratePlan}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Total Tariff:</span>
                <span className="font-mono font-bold text-base text-slate-900">{selectedBooking.amount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Payment Status:</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    selectedBooking.payment === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedBooking.payment}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Stay Status:</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    selectedBooking.status === 'CHECKED_IN' || selectedBooking.status === 'CHECKEDIN'
                      ? 'bg-indigo-100 text-indigo-800'
                      : selectedBooking.status === 'CHECKED_OUT' || selectedBooking.status === 'CHECKEDOUT'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-violet-100 text-violet-800'
                  }`}
                >
                  {selectedBooking.status === 'CHECKED_IN' || selectedBooking.status === 'CHECKEDIN'
                    ? 'OCCUPIED (CHECKED IN)'
                    : selectedBooking.status === 'CHECKED_OUT' || selectedBooking.status === 'CHECKEDOUT'
                      ? 'CHECKED OUT'
                      : 'RESERVED (NOT CHECKED IN)'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {selectedBooking.status !== 'CHECKED_IN' &&
                selectedBooking.status !== 'CHECKEDIN' &&
                selectedBooking.status !== 'CHECKEDOUT' &&
                selectedBooking.status !== 'CHECKED_OUT' && (
                  <button
                    type="button"
                    onClick={() => {
                      const matched = (reservations || []).find(r => r.id === selectedBooking.id);
                      setCheckInModalRes(matched || selectedBooking);
                      setSelectedBooking(null);
                    }}
                    className="flex-1 min-w-[120px] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Check In</span>
                  </button>
                )}

              {(selectedBooking.status === 'CHECKED_IN' || selectedBooking.status === 'CHECKEDIN') && (
                <button
                  type="button"
                  onClick={() => {
                    const rNum = selectedBooking.room_number || selectedBooking.room;
                    const rObj = rooms.find(rm => String(rm.roomNumber || rm.room_number) === String(rNum));
                    if (requestCheckout) {
                      requestCheckout({
                        room: rObj || { roomNumber: rNum, category: selectedBooking.room_type },
                        reservation: selectedBooking,
                        balanceDue: Math.max(0, Number(selectedBooking.amount || 0) - Number(selectedBooking.paid || 0)),
                        onConfirm: async () => {
                          if (checkOutReservation) {
                            await checkOutReservation(selectedBooking.id);
                          }
                          setSelectedBooking(null);
                        }
                      });
                    } else if (checkOutReservation) {
                      checkOutReservation(selectedBooking.id);
                      setSelectedBooking(null);
                    }
                  }}
                  className="flex-1 min-w-[120px] py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Check Out</span>
                </button>
              )}

              {selectedBooking.payment !== 'PAID' && (
                <button
                  type="button"
                  onClick={() => {
                    const matched = (reservations || []).find(r => r.id === selectedBooking.id);
                    setCollectPaymentModalRes(matched || selectedBooking);
                    setSelectedBooking(null);
                  }}
                  className="flex-1 min-w-[120px] py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Collect ₹</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setFolioActiveBooking(selectedBooking);
                  setIsFolioModalOpen(true);
                  setSelectedBooking(null);
                }}
                className="flex-1 min-w-[120px] py-2.5 bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
              >
                Folio &amp; Invoice
              </button>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Folio & Ledger Modal */}
      {isFolioModalOpen && folioActiveBooking && (
        <FolioBillingModal
          isOpen={isFolioModalOpen}
          onClose={() => {
            setIsFolioModalOpen(false);
            setFolioActiveBooking(null);
          }}
          room={
            rooms.find(r => String(r.roomNumber || r.room_number) === String(folioActiveBooking.roomNumber)) || {
              room_number: folioActiveBooking.roomNumber,
              price: Number(String(folioActiveBooking.amount || '').replace(/[^\d.]/g, '')) || 2500,
              guest: folioActiveBooking.guest
            }
          }
          reservation={{
            id: folioActiveBooking.id,
            guest: folioActiveBooking.guest,
            phone: folioActiveBooking.phone,
            email: folioActiveBooking.email,
            room_number: folioActiveBooking.roomNumber,
            status: folioActiveBooking.status,
            check_in: folioActiveBooking.checkIn,
            check_out: folioActiveBooking.checkOut,
            actual_check_in_time: folioActiveBooking.actualCheckInTime,
            actual_check_out_time: folioActiveBooking.actualCheckOutTime,
            amount:
              Number(
                folioActiveBooking.rawAmount ?? String(folioActiveBooking.amount || '').replace(/[^\d.]/g, '')
              ) || 2500,
            price:
              Number(
                folioActiveBooking.rawAmount ?? String(folioActiveBooking.amount || '').replace(/[^\d.]/g, '')
              ) || 2500,
            paid: Number(folioActiveBooking.paid || 0),
            payment: folioActiveBooking.payment,
            rate_plan: folioActiveBooking.ratePlan
          }}
        />
      )}

      {/* Admin Check-In Modal */}
      {checkInModalRes && (
        <CheckInModal
          isOpen={Boolean(checkInModalRes)}
          onClose={() => setCheckInModalRes(null)}
          reservation={checkInModalRes}
        />
      )}

      {/* Admin Collect Payment Modal */}
      {collectPaymentModalRes && (
        <CollectPaymentModal
          isOpen={Boolean(collectPaymentModalRes)}
          onClose={() => setCollectPaymentModalRes(null)}
          reservation={collectPaymentModalRes}
        />
      )}
    </div>
  );
}
