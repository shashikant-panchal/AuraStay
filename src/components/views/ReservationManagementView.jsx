import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  Building2,
  Search,
  Plus,
  RotateCcw,
  Filter,
  CreditCard,
  Calendar,
  Bed,
  Moon,
  LogOut,
  Info,
  Play,
  Trophy,
  User,
  ChevronDown,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  CalendarDays,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  CalendarPlus,
  UserCheck,
  Printer
} from 'lucide-react';
import BookingPaymentsModal from '../modals/BookingPaymentsModal';
import FolioBillingModal from '../modals/FolioBillingModal';
import CheckInModal from '../modals/CheckInModal';
import CollectPaymentModal from '../modals/CollectPaymentModal';
import BookingVoucher from '../common/BookingVoucher';
import BookARoomView from './BookARoomView';

export default function ReservationManagementView({ isSubTab = false }) {
  const {
    setIsTourOpen,
    showNotification,
    navigateTo,
    reservations: contextReservations = [],
    setReservations,
    addReservation,
    updateReservationPayment,
    checkOutReservation,
    currentHotel,
    rooms = []
  } = useDashboard();

  // Mode: 'list' or 'book-a-room'
  const [viewMode, setViewMode] = useState('list');
  const [isFolioModalOpen, setIsFolioModalOpen] = useState(false);
  const [folioActiveRsvn, setFolioActiveRsvn] = useState(null);

  const fmtTimeOnly = (ts) => {
    if (!ts) return '';
    try {
      const normalized = String(ts).includes(' ') && !String(ts).includes('T') ? String(ts).replace(' ', 'T') : String(ts);
      const d = new Date(normalized);
      if (Number.isNaN(d.getTime())) return String(ts);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return String(ts);
    }
  };

  const fmtDateTimeShort = (ts) => {
    if (!ts) return '';
    try {
      const normalized = String(ts).includes(' ') && !String(ts).includes('T') ? String(ts).replace(' ', 'T') : String(ts);
      const d = new Date(normalized);
      if (Number.isNaN(d.getTime())) return String(ts);
      return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return String(ts);
    }
  };

  const reservations = (contextReservations || []).map(r => {
    const totalAmount = Number(r.amount) || 2000;
    const isPaid = r.payment === 'PAID';
    const paidVal = r.paid !== undefined ? Number(r.paid) : (isPaid ? totalAmount : 0);
    const dueVal = r.due !== undefined ? Number(r.due) : Math.max(0, totalAmount - paidVal);
    const cIn = r.checkIn || r.check_in || 'Today';
    const cOut = r.checkOut || r.check_out || 'Tomorrow';
    const roomNum = r.room_number || (String(r.room || '').match(/\b(\d+)\b/)?.[1] || '101');
    const createdIso = r.createdAt || r.created_at || '';

    return {
      ...r,
      id: r.id,
      hash: r.hash || `AST-B-${r.id || Date.now()}`,
      guest: r.guest,
      guestType: r.source || 'Direct',
      source: r.source || 'Direct',
      phone: r.guestPhone || r.guest_phone || r.phone || '—',
      guestPhone: r.guestPhone || r.guest_phone || r.phone || '',
      email: r.guestEmail || r.guest_email || r.email || '',
      checkIn: cIn,
      check_in: cIn,
      checkOut: cOut,
      check_out: cOut,
      actualCheckInTime: r.actualCheckInTime || r.actual_check_in_time || '',
      actual_check_in_time: r.actualCheckInTime || r.actual_check_in_time || '',
      actualCheckOutTime: r.actualCheckOutTime || r.actual_check_out_time || '',
      actual_check_out_time: r.actualCheckOutTime || r.actual_check_out_time || '',
      createdAt: createdIso ? String(createdIso).slice(0, 10) : cIn,
      createdTime: createdIso ? fmtTimeOnly(createdIso) : 'Direct Booking',
      stayPeriod: `${cIn} — ${cOut}`,
      checkInOut: `${cIn} → ${cOut}`,
      roomType: r.room_type || r.room || 'Standard Room',
      ratePlan: r.ratePlan || r.rate_plan || 'EP PLAN',
      room_number: roomNum,
      rooms: [r.room || roomNum],
      status: String(r.status || 'CONFIRMED').toUpperCase(),
      payment: isPaid ? 'PAID' : (paidVal > 0 ? 'PARTIAL' : 'PENDING'),
      amount: totalAmount,
      total: totalAmount,
      paid: paidVal,
      due: dueVal,
      note: r.notes || r.note || null,
      highlight: false,
      invoiceNumber: r.id ? `INV-${r.id}` : null
    };
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('Recent');

  // Selected reservation for Booking Payments Modal
  const [selectedPaymentReservation, setSelectedPaymentReservation] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Inspection modal
  const [inspectedReservation, setInspectedReservation] = useState(null);

  // Invoice modal
  const [invoiceModalData, setInvoiceModalData] = useState(null);

  // Check In & Front Desk Payment Modals
  const [checkInModalRes, setCheckInModalRes] = useState(null);
  const [collectPaymentModalRes, setCollectPaymentModalRes] = useState(null);

  const handleOpenPayments = (res) => {
    setSelectedPaymentReservation(res);
    setIsPaymentModalOpen(true);
  };

  const handleUpdatePayment = (resId, newPaid, newDue) => {
    if (updateReservationPayment) {
      updateReservationPayment(resId, {
        paid: newPaid,
        due: newDue,
        paymentStatus: newDue <= 0 ? 'PAID' : 'PENDING'
      });
    } else if (setReservations) {
      setReservations(prev => prev.map(r => {
        if (r.id === resId) {
          return {
            ...r,
            paid: newPaid,
            due: newDue,
            payment: newDue <= 0 ? 'PAID' : 'PENDING',
            status: newDue === 0 && r.status === 'CONFIRMED' ? 'CONFIRMED' : r.status
          };
        }
        return r;
      }));
    }
  };

  const handleResetFilters = () => {
    setSearchKeyword('');
    setSearchType('ALL');
    setFilterCategory('Recent');
    showNotification('Search and filters reset to default');
  };

  const handleSaveNewReservation = (newRsvn) => {
    if (addReservation) {
      addReservation(newRsvn);
    } else if (setReservations) {
      setReservations(prev => [newRsvn, ...prev]);
    }
  };

  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      // Filter tab
      const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const nowD = new Date();
      const todayIso = new Date(nowD.getTime() - nowD.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      if (filterCategory === "Today's Arrival") {
        const matches = (r.checkIn && r.checkIn === todayIso) || (r.stayPeriod && r.stayPeriod.includes(todayStr));
        if (!matches) return false;
      }
      if (filterCategory === "In House" && !['CHECKED_IN', 'CHECKEDIN', 'OCCUPIED'].includes(r.status)) return false;
      if (filterCategory === "Today's Departure") {
        const matches = (r.checkOut && r.checkOut === todayIso) || (r.stayPeriod && r.stayPeriod.includes(todayStr));
        if (!matches) return false;
      }
      if (filterCategory === "Future") {
        const isFuture = (r.checkIn && r.checkIn > todayIso) || ['CONFIRMED', 'PENDING', 'RESERVED'].includes(r.status);
        if (!isFuture) return false;
      }
      if (filterCategory === "Maintenance") return false;

      // Keyword search
      if (!searchKeyword.trim()) return true;
      const q = searchKeyword.toLowerCase();
      if (searchType === 'BOOKING_ID') return r.id.toLowerCase().includes(q);
      if (searchType === 'GUEST_NAME') return r.guest.toLowerCase().includes(q);
      if (searchType === 'ROOM') return r.rooms.some(rm => rm.includes(q)) || r.roomType.toLowerCase().includes(q);

      return (
        r.id.toLowerCase().includes(q) ||
        r.guest.toLowerCase().includes(q) ||
        (r.hash && r.hash.toLowerCase().includes(q)) ||
        r.roomType.toLowerCase().includes(q) ||
        r.rooms.some(rm => rm.includes(q))
      );
    });
  }, [reservations, filterCategory, searchKeyword, searchType]);

  // If in Book A Room mode (Screenshots 2, 3, 4, 5)
  if (viewMode === 'book-a-room') {
    return (
      <BookARoomView
        onBack={() => setViewMode('list')}
        onSaveReservation={handleSaveNewReservation}
      />
    );
  }

  // LIST VIEW (Screenshot 1)
  return (
    <div className="space-y-4 animate-in fade-in duration-200">

      {/* 1. Top Breadcrumb (Exact match with Screenshot 1) */}
      {!isSubTab && (
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 pb-1 border-b border-slate-200">
          <span
            onClick={() => navigateTo('master-service-home')}
            className="hover:text-slate-900 cursor-pointer transition flex items-center gap-1"
          >
            🏠 Home
          </span>
          <span>/</span>
          <span className="font-semibold text-slate-900">
            Reservation Management
          </span>
        </div>
      )}

      {/* 2. Title Row & Action Buttons (Screenshot 1: Reset & Create Reservation) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-300 px-2 py-0.5 rounded tracking-wider">
              AURASTAY PMS
            </span>
            <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> MASTERY: 0%
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Reservations
            </h1>
            <button
              onClick={() => setIsTourOpen(true)}
              className="flex items-center space-x-1 text-xs font-bold text-sky-600 hover:text-sky-800 transition"
            >
              <Play className="w-3 h-3 fill-sky-600 text-sky-600" />
              <span>Tour</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive booking tracking and management.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Reset button (Exact text & icon from Screenshot 1) */}
          <button
            onClick={handleResetFilters}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Create Reservation button (Exact Screenshot 1: Calendar/Plus Icon) */}
          <button
            onClick={() => setViewMode('book-a-room')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Create Reservation</span>
          </button>
        </div>
      </div>

      {/* 3. Five Top Metric Cards (Exact Screenshot 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">

        {/* Card 1: TODAY'S UNALLOCATED */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              TODAY'S UNALLOCATED <Info className="w-3 h-3 text-slate-400" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-500">
            {contextReservations.filter(r => r.status === 'PENDING').length}
          </div>
          <div className="flex items-center space-x-1 text-xs font-semibold text-slate-500 mt-2">
            <Bed className="w-3.5 h-3.5 text-slate-400" />
            <span>{contextReservations.filter(r => r.status === 'PENDING').length} Rooms</span>
          </div>
        </div>

        {/* Card 2: TODAY'S ARRIVAL */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
              TODAY'S ARRIVAL <Info className="w-3 h-3 text-emerald-600/70" />
            </span>
            <div className="text-emerald-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {contextReservations.filter(r => r.status === 'CONFIRMED').length}
          </div>
          <div className="flex items-center space-x-1 text-xs font-semibold text-slate-500 mt-2">
            <Bed className="w-3.5 h-3.5 text-slate-400" />
            <span>{contextReservations.filter(r => r.status === 'CONFIRMED').length} Rooms</span>
          </div>
        </div>

        {/* Card 3: IN HOUSE */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1">
              IN HOUSE <Info className="w-3 h-3 text-sky-600/70" />
            </span>
            <div className="text-sky-600">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {rooms.filter(r => r.status === 'OCCUPIED').length}
          </div>
          <div className="flex items-center space-x-1 text-xs font-semibold text-slate-500 mt-2">
            <Bed className="w-3.5 h-3.5 text-slate-400" />
            <span>{rooms.filter(r => r.status === 'OCCUPIED').length} Rooms</span>
          </div>
        </div>

        {/* Card 4: TODAY'S STAY OVER */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
              TODAY'S STAY OVER <Info className="w-3 h-3 text-purple-600/70" />
            </span>
            <div className="text-purple-600">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {rooms.filter(r => r.status === 'DIRTY').length}
          </div>
          <div className="flex items-center space-x-1 text-xs font-semibold text-slate-500 mt-2">
            <Bed className="w-3.5 h-3.5 text-slate-400" />
            <span>{rooms.filter(r => r.status === 'DIRTY').length} Rooms</span>
          </div>
        </div>

        {/* Card 5: TODAY'S DEPARTURES */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
              TODAY'S DEPARTURES <Info className="w-3 h-3 text-rose-600/70" />
            </span>
            <div className="text-rose-600">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {rooms.filter(r => r.checkOut && r.checkOut <= new Date().toISOString().split('T')[0]).length}
          </div>
          <div className="flex items-center space-x-1 text-xs font-semibold text-slate-500 mt-2">
            <Bed className="w-3.5 h-3.5 text-slate-400" />
            <span>{rooms.filter(r => r.checkOut && r.checkOut <= new Date().toISOString().split('T')[0]).length} Rooms</span>
          </div>
        </div>

      </div>

      {/* 4. FIND BOOKING BY: Card (Screenshot 1) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
        <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-2">
          FIND BOOKING BY:
        </label>
        <div className="max-w-xs">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
          >
            <option value="ALL">Select Search Type</option>
            <option value="BOOKING_ID">Booking ID</option>
            <option value="GUEST_NAME">Guest Name</option>
            <option value="ROOM">Room / Category</option>
          </select>
        </div>
      </div>

      {/* 5. Main Reservation Table Card (Screenshots 1, 2, 3) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">

        {/* Table Search & Tab Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">

          {/* Keyword Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search keyword"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {['Recent', "Today's Arrival", 'In House', "Today's Departure", 'Future', 'Maintenance'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg transition ${filterCategory === cat
                  ? 'bg-[#0e4860] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                {cat}
              </button>
            ))}

            <button
              onClick={() => showNotification('Advanced filter drawer opened')}
              className="p-1.5 ml-1 border border-teal-200 text-teal-600 hover:bg-teal-50 rounded-lg transition"
              title="Filter settings"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px] select-none bg-slate-50/50">
                <th className="py-3 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-slate-900">
                    <span>BOOKING ID</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-slate-900">
                    <span>GUEST NAME</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                {/* Mint Green Highlighted Header (Screenshot 2) */}
                <th className="py-3 px-4 bg-[#e6f7f2] text-teal-900 border-x border-teal-100">
                  <div className="flex items-center space-x-1 cursor-pointer font-extrabold">
                    <span>CREATED AT</span>
                    <span className="text-xs text-teal-600 font-black">⇅</span>
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-slate-900">
                    <span>STAY PERIOD</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-slate-900">
                    <span>CHECK-IN/OUT</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-slate-900">
                    <span>DETAILS</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-slate-900">
                    <span>STATUS</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-slate-900">
                    <span>TOTAL</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-slate-900">
                    <span>OUTSTANDING</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-center">
                  <span>ACTIONS</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredReservations.map((res) => {
                const isHighlight = res.highlight;

                return (
                  <tr
                    key={res.id}
                    className={`transition ${isHighlight
                      ? 'bg-rose-50/40 border-l-4 border-l-rose-500 hover:bg-rose-50/70'
                      : 'hover:bg-slate-50/80'
                      }`}
                  >
                    {/* 1. BOOKING ID */}
                    <td className="py-3.5 px-4 align-top">
                      <div
                        onClick={() => setInspectedReservation(res)}
                        className="font-bold text-sky-800 hover:text-sky-950 cursor-pointer hover:underline"
                      >
                        {res.id}
                      </div>
                      {res.hash && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          HASH: {res.hash}
                        </div>
                      )}
                    </td>

                    {/* 2. GUEST NAME */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span
                            onClick={() => setInspectedReservation(res)}
                            className="font-bold text-slate-900 hover:text-sky-800 cursor-pointer"
                          >
                            {res.guest}
                          </span>
                          <div className="flex items-center space-x-1 text-[10.5px] text-slate-400 mt-0.5">
                            <span className="font-semibold">{res.guestType}</span>
                            <span>🚶</span>
                          </div>

                          {/* Yellow Note (Screenshot 2: Hiten Palreja, Mr Manoj) */}
                          {res.note && (
                            <div className="mt-1.5 inline-flex items-center space-x-1 bg-amber-50 border border-amber-200/90 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                              <span>📒 NOTE:</span>
                              <span className="font-medium">{res.note}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 3. CREATED AT */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap bg-teal-50/20 border-x border-teal-50">
                      <div className="font-bold text-slate-800">{res.createdAt}</div>
                      <div className="text-[10.5px] text-slate-400">{res.createdTime}</div>
                    </td>

                    {/* 4. STAY PERIOD */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <span className="font-semibold text-slate-700">{res.stayPeriod}</span>
                    </td>

                    {/* 5. CHECK-IN/OUT TIMINGS */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap text-[11px] text-slate-600">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-800">{res.checkInOut}</div>
                        {res.actualCheckInTime ? (
                          <div className="text-[10px] font-bold text-emerald-700">
                            In: {fmtDateTimeShort(res.actualCheckInTime)}
                          </div>
                        ) : (
                          <div className="text-[10px] font-medium text-violet-600">
                            In: Pending Check-In
                          </div>
                        )}
                        {res.actualCheckOutTime && (
                          <div className="text-[10px] font-bold text-sky-700">
                            Out: {fmtDateTimeShort(res.actualCheckOutTime)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 6. DETAILS */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-800">{res.roomType}</div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded text-[10px]">
                            {res.ratePlan}
                          </span>
                          {res.rooms.map(rm => (
                            <span
                              key={rm}
                              className="bg-[#0e4860] text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-0.5"
                            >
                              <span className="text-[9px] text-sky-200">R</span>
                              <span>{rm}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* 7. STATUS */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <div>
                        {(res.status === 'CHECKED_IN' || res.status === 'CHECKEDIN' || res.status === 'OCCUPIED') && (
                          <span className="inline-flex items-center space-x-1 bg-indigo-100 text-indigo-800 font-black px-2.5 py-0.5 rounded-full text-[10px] tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                            <span>OCCUPIED</span>
                          </span>
                        )}
                        {(res.status === 'CONFIRMED' || res.status === 'PENDING' || res.status === 'RESERVED') && (
                          <span className="inline-flex items-center space-x-1 bg-violet-100 text-violet-800 font-black px-2.5 py-0.5 rounded-full text-[10px] tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                            <span>RESERVED</span>
                          </span>
                        )}
                        {res.status === 'CHECKOUT DUE' && (
                          <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 font-black px-2.5 py-0.5 rounded-full text-[10px] tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            <span>CHECKOUT DUE</span>
                          </span>
                        )}
                        {(res.status === 'CHECKED_OUT' || res.status === 'CHECKEDOUT') && (
                          <span className="inline-flex items-center space-x-1 bg-slate-200 text-slate-700 font-black px-2.5 py-0.5 rounded-full text-[10px] tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <span>CHECKED OUT</span>
                          </span>
                        )}
                        {res.status === 'CANCELLED' && (
                          <span className="inline-flex items-center space-x-1 bg-rose-100 text-rose-700 font-black px-2.5 py-0.5 rounded-full text-[10px] tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>CANCELLED</span>
                          </span>
                        )}

                        {/* Booking Invoice link */}
                        {res.invoiceNumber && (
                          <div
                            onClick={() => setInvoiceModalData(res)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer mt-1"
                          >
                            {res.invoiceNumber}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 8. TOTAL - CLICKABLE TO OPEN BOOKING PAYMENTS MODAL */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <button
                        onClick={() => handleOpenPayments(res)}
                        className="group flex items-center space-x-1.5 px-2 py-1 -mx-2 rounded-lg hover:bg-sky-50 text-slate-900 transition text-left"
                        title="Click to view & collect payments"
                      >
                        <span className="font-black text-xs text-slate-900 group-hover:text-sky-700">
                          ₹{res.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <CreditCard className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition" />
                      </button>
                    </td>

                    {/* 9. OUTSTANDING */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      {res.due > 0 ? (
                        <span className="font-bold text-xs text-rose-600">
                          ₹{res.due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">₹0.00</span>
                      )}
                    </td>

                    {/* 10. FRONT DESK ACTIONS (Check-In, Check-Out, Folio & Booking Invoice) */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {(['CONFIRMED', 'PENDING', 'RESERVED'].includes(res.status)) && (
                          <button
                            onClick={() => setCheckInModalRes(res)}
                            className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10.5px] font-bold flex items-center space-x-1 transition shadow-xs cursor-pointer"
                            title="Check In Guest with Room & Time (Marks Room Occupied)"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Check In</span>
                          </button>
                        )}
                        {(['CHECKEDIN', 'CHECKED_IN', 'OCCUPIED'].includes(res.status)) && (
                          <>
                            <button
                              onClick={() => {
                                setFolioActiveRsvn(res);
                                setIsFolioModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-[10.5px] font-bold flex items-center space-x-1 transition shadow-xs cursor-pointer"
                              title="Open Room Folio & Billing"
                            >
                              <span>Folio</span>
                            </button>
                            <button
                              onClick={() => checkOutReservation && checkOutReservation(res.id)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10.5px] font-bold flex items-center space-x-1 transition shadow-xs cursor-pointer"
                              title="Check Out Guest & Capture Departure Time"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>Check Out</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setCollectPaymentModalRes(res)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10.5px] font-bold flex items-center space-x-1 transition border border-indigo-200 cursor-pointer"
                          title="Collect Front Desk Payment"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Collect ₹</span>
                        </button>

                        <button
                          onClick={() => setInvoiceModalData(res)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10.5px] font-bold flex items-center space-x-1 transition border border-slate-300 cursor-pointer"
                          title="View & Print Official Booking Invoice"
                        >
                          <Printer className="w-3 h-3 text-slate-600" />
                          <span>Booking Invoice</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Pagination & Controls (Exact Screenshot 3) */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing 1 to {filteredReservations.length} of {filteredReservations.length} entries
          </div>

          <div className="flex items-center space-x-1 font-semibold">
            <button className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-400 disabled:opacity-50">
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-400 disabled:opacity-50">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="px-3 py-1 rounded border border-sky-300 bg-sky-50 text-sky-800 font-bold">
              1
            </button>
            <button className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-400 disabled:opacity-50">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-400 disabled:opacity-50">
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>

            <div className="ml-2 flex items-center border border-slate-200 rounded px-2 py-1 bg-white">
              <span className="text-slate-700">10</span>
              <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
            </div>
          </div>
        </div>

      </div>

      {/* 6. Bottom Bar (Screenshot 3 & 4) */}
      <div className="rounded-xl bg-[#091b29] text-white p-3.5 flex items-center justify-between shadow-xs">

        <div className="flex items-center space-x-2 text-xs">
          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#091b29] font-black text-[10px]">
            b
          </div>
          <span className="font-semibold text-slate-300">
            Powered by <strong className="text-white">Dama Digital</strong>
          </span>
        </div>
      </div>

      {/* BOOKING PAYMENTS MODAL */}
      <BookingPaymentsModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        reservation={selectedPaymentReservation}
        onUpdatePayment={handleUpdatePayment}
      />

      {/* RESERVATION INSPECTOR MODAL */}
      {inspectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-[#0e4860] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Reservation Details</h3>
                <p className="text-xs text-sky-200 font-mono">#{inspectedReservation.id}</p>
              </div>
              <button
                onClick={() => setInspectedReservation(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-medium block">Guest Name</span>
                  <span className="font-bold text-slate-900 text-sm">{inspectedReservation.guest}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Phone</span>
                  <span className="font-bold text-slate-900">{inspectedReservation.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Stay Period</span>
                  <span className="font-bold text-slate-800">{inspectedReservation.stayPeriod}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Room Assigned</span>
                  <span className="font-bold text-slate-800">
                    {inspectedReservation.rooms.length > 0
                      ? inspectedReservation.rooms.join(', ')
                      : 'Unassigned'} ({inspectedReservation.roomType})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900">
                <div>
                  <span className="font-bold block">Folio Balance: ₹{inspectedReservation.total.toLocaleString()}</span>
                  <span className="text-[11px] text-sky-700">Paid: ₹{inspectedReservation.paid.toLocaleString()} | Due: ₹{inspectedReservation.due.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFolioActiveRsvn(inspectedReservation);
                      setIsFolioModalOpen(true);
                      setInspectedReservation(null);
                    }}
                    className="px-3 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg font-bold text-xs shadow-2xs"
                  >
                    Open Folio & Ledger
                  </button>
                  <button
                    onClick={() => {
                      setInspectedReservation(null);
                      handleOpenPayments(inspectedReservation);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs"
                  >
                    Collect Payment
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setInspectedReservation(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL BOOKING INVOICE MODAL */}
      {invoiceModalData && (
        <BookingVoucher
          currentHotel={currentHotel}
          reservation={invoiceModalData}
          room={{
            room_number: invoiceModalData.room_number || (invoiceModalData.rooms && invoiceModalData.rooms[0]) || invoiceModalData.room || '101',
            category: invoiceModalData.roomType || invoiceModalData.room_type || 'Standard Room'
          }}
          voucherType="BOOKING INVOICE"
          onClose={() => setInvoiceModalData(null)}
        />
      )}

      {/* Interactive Folio & Ledger Modal */}
      {isFolioModalOpen && folioActiveRsvn && (
        <FolioBillingModal
          isOpen={isFolioModalOpen}
          onClose={() => {
            setIsFolioModalOpen(false);
            setFolioActiveRsvn(null);
          }}
          room={rooms.find(r => String(r.roomNumber || r.room_number) === String(folioActiveRsvn.room_number) || (folioActiveRsvn.rooms && folioActiveRsvn.rooms.includes(r.roomNumber))) || {
            room_number: folioActiveRsvn.room_number || folioActiveRsvn.rooms?.[0] || '101',
            price: Number(folioActiveRsvn.total) || 2500,
            guest: folioActiveRsvn.guest
          }}
          reservation={{
            ...folioActiveRsvn,
            id: folioActiveRsvn.id,
            guest: folioActiveRsvn.guest,
            phone: folioActiveRsvn.phone,
            email: folioActiveRsvn.email,
            check_in: folioActiveRsvn.checkIn || 'Today',
            check_out: folioActiveRsvn.checkOut || 'Upcoming',
            actualCheckInTime: folioActiveRsvn.actualCheckInTime,
            actualCheckOutTime: folioActiveRsvn.actualCheckOutTime,
            price: Number(folioActiveRsvn.total) || 2500,
            paid: Number(folioActiveRsvn.paid) || 0,
            payment: folioActiveRsvn.due <= 0 ? 'PAID' : 'PENDING',
            rate_plan: folioActiveRsvn.ratePlan || 'EP - European Plan'
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
