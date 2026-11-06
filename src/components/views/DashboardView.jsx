import React, { useState, useMemo, useRef } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  Filter,
  Sparkles,
  Plus,
  Check,
  X,
  User,
  Phone,
  Mail,
  CreditCard,
  Printer,
  Share2,
  Clock,
  Building2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  FileText,
  BadgeCheck,
  Send,
  BedDouble,
  Receipt,
  Trash2
} from 'lucide-react';

export default function DashboardView() {
  const { showNotification, reservations = [], rooms = [], addReservation, updateRoomStatus, setIsCreateRoomModalOpen, deleteRoom, requestDeleteRoom } = useDashboard();

  // Dynamic suites mapped directly from real rooms in Supabase / Context
  const suites = useMemo(() => {
    return rooms.map(r => ({
      id: String(r.id || r.room_number || r.roomNumber),
      number: String(r.room_number || r.roomNumber || r.id),
      floor: r.floor ? (String(r.floor).startsWith('Floor') ? r.floor : `Floor ${r.floor}`) : 'Floor 1',
      category: r.type || r.category || 'Standard Room',
      tariff: Number(r.price || r.tariff) || 2000,
      status: r.status === 'OCCUPIED' ? 'Occupied' : r.status === 'MAINTENANCE' ? 'Maintenance' : 'Available',
      housekeeping: r.housekeeping || (r.status === 'DIRTY' ? 'Maintenance' : 'Clean'),
      bookings: []
    }));
  }, [rooms]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Dynamic categories list from real rooms
  const categoryOptions = useMemo(() => {
    const cats = Array.from(new Set(suites.map(s => s.category).filter(Boolean)));
    return [
      { id: 'ALL', label: `All Categories (${suites.length} Rooms)` },
      ...cats.map(c => ({
        id: c,
        label: `${c} (${suites.filter(s => s.category === c).length})`
      }))
    ];
  }, [suites]);

  // Date Navigator state (Base anchored at 04 Nov 2026)
  const [baseDate, setBaseDate] = useState(new Date(2026, 10, 4)); // Nov 4, 2026

  // Modal states
  const [selectedFolioBooking, setSelectedFolioBooking] = useState(null);
  const [selectedFolioSuite, setSelectedFolioSuite] = useState(null);
  const [quickBookingSlot, setQuickBookingSlot] = useState(null); // { suite, date }

  // Quick booking form fields
  const [quickGuestName, setQuickGuestName] = useState('');
  const [quickNights, setQuickNights] = useState(2);
  const [quickSource, setQuickSource] = useState('Direct Walk-in');
  const [quickPhone, setQuickPhone] = useState('');

  // Generate 21 days from baseDate
  const timelineDays = useMemo(() => {
    const days = [];
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const monthShorts = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Fixed anchor reference for TODAY = 06 Nov 2026
    const todayStr = '2026-11-06';

    for (let i = 0; i < 21; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      days.push({
        date: d,
        dateStr,
        dayNum: dd,
        dayName: dayNames[d.getDay()],
        monthName: monthShorts[d.getMonth()],
        isToday: dateStr === todayStr,
        isWeekend: d.getDay() === 0 || d.getDay() === 6
      });
    }
    return days;
  }, [baseDate]);

  // Date range label
  const dateRangeLabel = useMemo(() => {
    if (timelineDays.length === 0) return '';
    const first = timelineDays[0];
    const last = timelineDays[timelineDays.length - 1];
    return `${first.dayNum} ${first.monthName} ${first.date.getFullYear()} - ${last.dayNum} ${last.monthName} ${last.date.getFullYear()}`;
  }, [timelineDays]);

  // Navigation handlers
  const handlePrevDays = () => {
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() - 7);
    setBaseDate(newDate);
    showNotification('Shifted back 7 days');
  };

  const handleNextDays = () => {
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + 7);
    setBaseDate(newDate);
    showNotification('Shifted forward 7 days');
  };

  const handleGoToday = () => {
    setBaseDate(new Date(2026, 10, 4)); // Centers on Nov 06 Today
    showNotification('Navigated to Today (06 Nov 2026)');
  };

  // Combined suites with live reservations from context (if any)
  const combinedSuites = useMemo(() => {
    return suites.map(suite => {
      const contextBookings = (reservations || [])
        .filter(r => (String(r.room) === suite.number || String(r.roomNumber) === suite.number))
        .map(r => ({
          id: r.id ? (String(r.id).startsWith('AURA-') ? r.id : `AURA-${r.id}`) : `AURA-${Math.floor(1000 + Math.random() * 9000)}`,
          guest: r.guest || r.guestName || 'Guest',
          nights: Number(r.nights) || 1,
          checkIn: r.checkIn || r.check_in,
          checkOut: r.checkOut || r.check_out,
          source: r.source || 'Direct Web',
          channelDots: ['#10b981', '#3b82f6'],
          status: r.status === 'CHECKEDIN' ? 'Occupied' : 'Reserved',
          vip: false,
          totalAmount: Number(r.amount) || suite.tariff,
          paidAmount: Number(r.amount) || suite.tariff,
          phone: r.phone || r.guestPhone || '',
          email: r.email || '',
          idType: 'Aadhaar / ID Card'
        }));

      const allBookings = [...suite.bookings, ...contextBookings];
      const hasOccupied = allBookings.some(b => b.status === 'Occupied');
      const hasReserved = allBookings.some(b => b.status === 'Reserved');

      return {
        ...suite,
        status: hasOccupied ? 'Occupied' : hasReserved ? 'Reserved' : suite.status,
        bookings: allBookings
      };
    });
  }, [suites, reservations]);

  // Filtered suites
  const filteredSuites = useMemo(() => {
      return combinedSuites.filter(s => {
        const matchCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
        if (!matchCategory) return false;

        if (!searchQuery.trim()) return true;

        const q = searchQuery.toLowerCase();
        const matchSuite = s.number.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
        const matchBooking = s.bookings.some(b =>
          b.guest.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q) ||
          (b.phone && b.phone.includes(q))
        );

        return matchSuite || matchBooking;
      });
  }, [combinedSuites, selectedCategory, searchQuery]);

  // Quick Housekeeping toggle
  const cycleHousekeeping = (suiteId) => {
    const s = suites.find(item => item.id === suiteId);
    if (!s) return;
    const flow = ['Clean', 'Inspected', 'Turn-Down', 'Maintenance'];
    const curIdx = flow.indexOf(s.housekeeping);
    const nextHk = flow[(curIdx + 1) % flow.length];
    if (updateRoomStatus) {
      updateRoomStatus(s.number, nextHk === 'Clean' ? 'VACANT_READY' : nextHk === 'Maintenance' ? 'MAINTENANCE' : 'DIRTY');
    }
    showNotification(`Suite ${s.number} status updated to ${nextHk}`);
  };

  // Quick Booking Submission
  const handleConfirmQuickBooking = async (e) => {
    e.preventDefault();
    if (!quickBookingSlot || !quickGuestName.trim()) {
      showNotification('Please enter a valid guest name.');
      return;
    }

    const { suite, date } = quickBookingSlot;
    const checkInDate = new Date(date.date);
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + Number(quickNights));

    const yyyy = checkOutDate.getFullYear();
    const mm = String(checkOutDate.getMonth() + 1).padStart(2, '0');
    const dd = String(checkOutDate.getDate()).padStart(2, '0');
    const checkOutStr = `${yyyy}-${mm}-${dd}`;

    const totalAmount = suite.tariff * Number(quickNights) * 1.18;

    if (addReservation) {
      await addReservation({
        guest: quickGuestName.trim(),
        room: suite.number,
        roomNumber: suite.number,
        nights: Number(quickNights),
        checkIn: date.dateStr,
        checkOut: checkOutStr,
        source: quickSource,
        status: 'CONFIRMED',
        payment: 'PAID',
        amount: Math.round(totalAmount),
        phone: quickPhone || '+91 98000 00000',
        email: `${quickGuestName.toLowerCase().replace(/\s+/g, '.')}@guest.com`
      });
    }

    showNotification(`Suite ${suite.number} booked for ${quickGuestName.trim()}!`);
    setQuickBookingSlot(null);
    setQuickGuestName('');
    setQuickPhone('');
  };

  return (
    <div className="space-y-4 select-none pb-12 font-sans">

      {/* =========================================================================
          TOP CONTROL BAR (Exact match to screenshot)
          [ < Today > ] [ 📅 04 Nov 2026 - 24 Nov 2026 ] [ 🔍 Search ] [ Filter All Categories ]
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">

        {/* Left Side: Navigation & Date Range */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* < Today > Buttons */}
          <div className="flex items-center bg-[#fafaf9] border border-slate-200/90 rounded-xl p-1 shadow-2xs">
            <button
              onClick={handlePrevDays}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-xs transition"
              title="Previous 7 Days"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleGoToday}
              className="px-3.5 h-8 rounded-lg text-xs font-bold text-[#3a2f1d] hover:bg-white hover:shadow-xs transition"
              title="Jump to Today (06 Nov 2026)"
            >
              Today
            </button>
            <button
              onClick={handleNextDays}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-xs transition"
              title="Next 7 Days"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Date Range Badge */}
          <div className="h-10 px-4 rounded-xl border border-slate-200/80 bg-[#fbfbfb] flex items-center space-x-2 text-xs font-bold text-slate-800 shadow-2xs">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span className="tracking-wide">{dateRangeLabel}</span>
          </div>
        </div>

        {/* Center: Search Box */}
        <div className="flex-1 max-w-md mx-auto w-full">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guest name or booking code..."
              className="w-full h-10 pl-10 pr-9 rounded-xl border border-slate-200 bg-[#fdfdfd] text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Category Filter Dropdown */}
        <div className="relative self-end lg:self-auto">
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-[#fbfbfb] hover:bg-slate-50 flex items-center space-x-2.5 text-xs font-bold text-slate-800 transition shadow-2xs cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {categoryOptions.find(c => c.id === selectedCategory)?.label || 'All Categories'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFilterDropdownOpen && (
            <div className="absolute right-0 top-12 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-40 space-y-1 animate-in fade-in duration-100">
              {categoryOptions.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setIsFilterDropdownOpen(false);
                    showNotification(`Filtered by ${cat.label}`);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${selectedCategory === cat.id
                    ? 'bg-amber-50 text-amber-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <span>{cat.label}</span>
                  {selectedCategory === cat.id && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          SUB-BAR / LEGEND BAR (Exact match to screenshot)
          SUITE STATES: Available, Occupied, Reserved, Cleaning, Maintenance
          Right: Click vacant slot to book • Click reservation for Live Guest Folio
         ========================================================================= */}
      <div className="bg-[#fcfaf7] border border-[#eee6d9] rounded-xl px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">

        {/* Left: Suite States Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <span className="text-[11px] font-black tracking-wider uppercase text-slate-600">
            SUITE STATES:
          </span>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
            <span className="font-semibold text-slate-700">Available</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
            <span className="font-semibold text-slate-700">Occupied (In-House)</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
            <span className="font-semibold text-slate-700">Reserved (Confirmed)</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
            <span className="font-semibold text-slate-700">Cleaning (Turn-Down)</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]" />
            <span className="font-semibold text-slate-700">Maintenance</span>
          </div>
        </div>

        {/* Right: Golden Instruction Tip */}
        <div className="text-[11.5px] font-medium text-[#9a7638] flex items-center space-x-1 self-start md:self-auto">
          <span>💡 Click vacant slot to book • Click reservation for Live Guest Folio</span>
        </div>
      </div>

      {/* =========================================================================
          MAIN TAPE CHART / TIMELINE GRID
          Sticky Left Column (SUITES & RESIDENCES - 17 UNITS)
          Scrollable Date Columns (WED 04, THU 05, FRI 06 TODAY, etc.)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto relative dark-sidebar-scroll">
          <div className="inline-block min-w-full align-middle">

            {/* TABLE HEADER */}
            <div className="flex border-b border-slate-200 bg-[#fbfaf8]">

              {/* Sticky Suite Header */}
              <div className="w-64 sm:w-72 shrink-0 p-3.5 px-4 bg-[#fbfaf8] border-r border-slate-200 sticky left-0 z-30 flex items-center justify-between">
                <div className="font-serif font-black tracking-wide text-xs text-slate-900 uppercase">
                  SUITES & RESIDENCES
                </div>
                <span className="bg-[#fbf7ee] text-[#8c6b32] border border-[#e8dec8] text-[9.5px] font-extrabold px-2 py-0.5 rounded-md tracking-wider">
                  {filteredSuites.length} UNITS
                </span>
              </div>

              {/* Date Column Headers */}
              <div className="flex divide-x divide-slate-200/70">
                {timelineDays.map(day => (
                  <div
                    key={day.dateStr}
                    className={`w-[110px] shrink-0 py-2.5 px-1 flex flex-col items-center justify-center text-center transition relative ${day.isToday
                      ? 'bg-[#fbf7ee] border-b-2 border-amber-600'
                      : day.isWeekend
                        ? 'bg-slate-50/70'
                        : 'bg-[#fbfaf8]'
                      }`}
                  >
                    <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase leading-none">
                      {day.dayName}
                    </span>
                    <span className={`text-sm font-black mt-1 leading-none ${day.isToday ? 'text-amber-950 font-black' : 'text-slate-800'
                      }`}>
                      {day.dayNum}
                    </span>

                    {/* TODAY Badge under FRI 06 */}
                    {day.isToday && (
                      <span className="bg-[#e8dec8] text-[#5c4a28] text-[8.5px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase mt-1">
                        TODAY
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* TABLE BODY */}
            <div className="divide-y divide-slate-200/80">
              {filteredSuites.length === 0 ? (
                <div className="p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-3">
                  <BedDouble className="w-8 h-8 text-slate-300" />
                  <p className="font-semibold text-slate-700">
                    {suites.length === 0
                      ? 'No rooms created yet. Add rooms to view them on the Stayview timeline.'
                      : 'No suites match the applied search query or category filter.'}
                  </p>
                  {suites.length === 0 && (
                    <button
                      onClick={() => setIsCreateRoomModalOpen && setIsCreateRoomModalOpen(true)}
                      className="px-4 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white text-xs font-bold rounded-xl shadow-xs transition"
                    >
                      + Add First Room
                    </button>
                  )}
                </div>
              ) : (
                filteredSuites.map((suite) => {
                  const dayWidth = 110; // width of each day column in pixels

                  return (
                    <div
                      key={suite.id}
                      className="flex hover:bg-slate-50/30 transition group/row relative min-h-[72px]"
                    >
                      {/* Left Sticky Suite Info Column */}
                      <div className="w-64 sm:w-72 shrink-0 p-3 px-4 bg-white border-r border-slate-200 sticky left-0 z-20 flex items-center justify-between group-hover/row:bg-slate-50/50 shadow-xs">
                        <div className="min-w-0 pr-2">
                          <div className="flex items-baseline space-x-2">
                            <span className="text-sm font-black text-slate-900 tracking-tight">
                              {suite.number}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600">
                              {suite.floor}
                            </span>
                          </div>
                          <div className="text-[11.5px] font-medium text-slate-600 truncate mt-0.5">
                            {suite.category}
                          </div>
                          <div className="text-xs font-bold text-[#b4832c] mt-0.5 font-mono">
                            ₹{suite.tariff.toLocaleString('en-IN')}/nt
                          </div>
                        </div>

                        {/* Status Pills Right */}
                        <div className="flex flex-col items-end space-y-1 shrink-0">
                          {/* Occupancy Pill */}
                          {suite.status === 'Occupied' && (
                            <span className="bg-rose-50 text-rose-600 border border-rose-200/90 text-[10.5px] font-bold px-2 py-0.5 rounded-full">
                              Occupied
                            </span>
                          )}
                          {suite.status === 'Reserved' && (
                            <span className="bg-purple-50 text-purple-600 border border-purple-200/90 text-[10.5px] font-bold px-2 py-0.5 rounded-full">
                              Reserved
                            </span>
                          )}
                          {suite.status === 'Available' && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/90 text-[10.5px] font-bold px-2 py-0.5 rounded-full">
                              Available
                            </span>
                          )}
                          {suite.status === 'Cleaning' && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200/90 text-[10.5px] font-bold px-2 py-0.5 rounded-full">
                              Turn-Down
                            </span>
                          )}
                          {suite.status === 'Maintenance' && (
                            <span className="bg-slate-100 text-slate-600 border border-slate-300 text-[10.5px] font-bold px-2 py-0.5 rounded-full">
                              Maintenance
                            </span>
                          )}

                          <div className="flex items-center space-x-2 pt-0.5">
                            {/* Housekeeping Sub-state Dot (Clickable) */}
                            <button
                              onClick={() => cycleHousekeeping(suite.id)}
                              className="flex items-center space-x-1 text-[10px] font-semibold text-slate-500 hover:text-slate-900 transition cursor-pointer"
                              title="Click to toggle Housekeeping status"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${suite.housekeeping === 'Clean' ? 'bg-emerald-500' :
                                suite.housekeeping === 'Inspected' ? 'bg-teal-500' :
                                  suite.housekeeping === 'Turn-Down' ? 'bg-amber-500' : 'bg-slate-400'
                                }`} />
                              <span>{suite.housekeeping}</span>
                            </button>

                            {/* Delete Room Icon */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (requestDeleteRoom) {
                                  requestDeleteRoom(suite.number);
                                } else {
                                  deleteRoom(suite.number);
                                }
                              }}
                              title={`Delete Room ${suite.number}`}
                              className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right Timeline Days & Bookings Track */}
                      <div className="flex relative divide-x divide-slate-100 flex-1">

                        {/* Background Day Columns (Clickable for booking) */}
                        {timelineDays.map((day) => (
                          <div
                            key={day.dateStr}
                            onClick={() => {
                              setQuickBookingSlot({ suite, date: day });
                              setQuickGuestName('');
                              setQuickNights(2);
                            }}
                            className={`w-[110px] shrink-0 h-full transition relative group/cell cursor-pointer ${day.isToday
                              ? 'bg-[#fbf7ee]/40 hover:bg-amber-100/30'
                              : day.isWeekend
                                ? 'bg-slate-50/40 hover:bg-sky-50/50'
                                : 'hover:bg-sky-50/40'
                              }`}
                            title={`Click to book Suite ${suite.number} on ${day.dayNum} ${day.monthName}`}
                          >
                            {/* Subtle Plus icon on vacant cell hover */}
                            <div className="w-full h-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition duration-150">
                              <span className="w-6 h-6 rounded-full bg-white border border-slate-300 shadow-xs flex items-center justify-center text-slate-400 group-hover/cell:text-amber-600">
                                <Plus className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Foreground Booking Pills (Absolute Positioning across exact days) */}
                        {suite.bookings.map((booking) => {
                          const startIndex = timelineDays.findIndex(d => d.dateStr === booking.checkIn);
                          const endIndex = timelineDays.findIndex(d => d.dateStr === booking.checkOut);

                          // Calculate position in current visible timeline
                          // If starts before visible window:
                          const visibleStart = startIndex >= 0 ? startIndex : 0;
                          // If ends after visible window:
                          const visibleEnd = endIndex >= 0 ? endIndex : timelineDays.length;

                          // Check if booking overlaps visible range at all
                          const isVisible = (startIndex < timelineDays.length && endIndex > 0) ||
                            (startIndex < 0 && endIndex > 0);
                          if (!isVisible) return null;

                          const durationDays = (endIndex >= 0 ? endIndex : timelineDays.length) - visibleStart;
                          const leftPos = visibleStart * dayWidth + 3;
                          const widthPos = Math.max(durationDays * dayWidth - 6, 80);

                          // Search highlight
                          const isSearchHit = searchQuery && (
                            booking.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            booking.id.toLowerCase().includes(searchQuery.toLowerCase())
                          );

                          return (
                            <div
                              key={booking.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFolioBooking(booking);
                                setSelectedFolioSuite(suite);
                              }}
                              style={{
                                left: `${leftPos}px`,
                                width: `${widthPos}px`,
                                top: '10px',
                                bottom: '10px'
                              }}
                              className={`absolute z-10 rounded-2xl border-2 px-3 flex items-center justify-between shadow-xs transition-all duration-200 cursor-pointer overflow-hidden ${isSearchHit
                                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 shadow-md'
                                : booking.vip
                                  ? 'bg-linear-to-r from-purple-50 via-white to-purple-50/50 border-purple-400 text-purple-950 hover:shadow-md hover:border-purple-600'
                                  : 'bg-white border-purple-300 hover:border-purple-500 hover:shadow-md'
                                }`}
                              title={`Click to view Guest Folio for ${booking.guest} (${booking.id})`}
                            >
                              {/* Left Text */}
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center space-x-1.5 truncate">
                                  <span className="font-extrabold text-xs text-slate-900 truncate">
                                    {booking.guest}
                                  </span>
                                  {booking.vip && (
                                    <span className="text-amber-500 text-xs shrink-0" title="VIP Guest">
                                      ✦
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 truncate mt-0.5">
                                  {booking.id} • {booking.nights} nts
                                </div>
                              </div>

                              {/* Right Channel Dots */}
                              {booking.channelDots && booking.channelDots.length > 0 && (
                                <div className="flex items-center space-x-0.5 shrink-0 bg-slate-50/80 px-1.5 py-1 rounded-full border border-slate-200/80">
                                  {booking.channelDots.map((color, idx) => (
                                    <span
                                      key={idx}
                                      style={{ backgroundColor: color }}
                                      className="w-1.5 h-1.5 rounded-full"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: LIVE GUEST FOLIO & STAY DETAILS INSPECTOR
         ========================================================================= */}
      {selectedFolioBooking && selectedFolioSuite && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">

            {/* Modal Header */}
            <div className="bg-[#0b2238] text-white p-5 flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-black tracking-tight text-white">
                    {selectedFolioBooking.guest}
                  </h3>
                  {selectedFolioBooking.vip && (
                    <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                      VIP ELITE
                    </span>
                  )}
                  <span className="bg-sky-500/30 text-sky-200 border border-sky-400/30 text-[10px] font-mono px-2 py-0.5 rounded">
                    {selectedFolioBooking.id}
                  </span>
                </div>
                <p className="text-xs text-sky-200/80 mt-1">
                  Suite {selectedFolioSuite.number} • {selectedFolioSuite.category} ({selectedFolioSuite.floor})
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedFolioBooking(null);
                  setSelectedFolioSuite(null);
                }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

              {/* Stay Dates & Duration Grid */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Check-In</div>
                  <div className="font-extrabold text-slate-900 mt-0.5">{selectedFolioBooking.checkIn}</div>
                  <div className="text-[10px] text-slate-500">From 14:00 hrs</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Check-Out</div>
                  <div className="font-extrabold text-slate-900 mt-0.5">{selectedFolioBooking.checkOut}</div>
                  <div className="text-[10px] text-slate-500">Until 11:00 hrs</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Stay Duration</div>
                  <div className="font-extrabold text-amber-700 mt-0.5">{selectedFolioBooking.nights} Nights</div>
                  <div className="text-[10px] text-slate-500">{selectedFolioBooking.source}</div>
                </div>
              </div>

              {/* Guest Profile & Contact Info */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
                <div className="font-bold text-slate-800 text-xs flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span>Guest Profile & Government Compliance</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">Phone Number</span>
                    <span className="font-semibold text-slate-800">{selectedFolioBooking.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">Email Address</span>
                    <span className="font-semibold text-slate-800 truncate block">{selectedFolioBooking.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">KYC Identification</span>
                    <span className="font-semibold text-emerald-700 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{selectedFolioBooking.idType}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">Booking Source</span>
                    <span className="font-semibold text-slate-800">{selectedFolioBooking.source}</span>
                  </div>
                </div>
              </div>

              {/* Folio Financials Breakdown */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-100/70 px-4 py-2.5 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Receipt className="w-3.5 h-3.5 text-slate-500" />
                    <span>Folio Financial Summary</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Settled / Guaranteed
                  </span>
                </div>

                <div className="p-4 space-y-2 bg-white">
                  <div className="flex justify-between text-slate-600">
                    <span>Suite Tariff ({selectedFolioBooking.nights} nights @ ₹{selectedFolioSuite.tariff.toLocaleString('en-IN')})</span>
                    <span className="font-mono font-medium">₹{(selectedFolioSuite.tariff * selectedFolioBooking.nights).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Statutory Hospitality Taxes (GST 18%)</span>
                    <span className="font-mono font-medium">₹{Math.round(selectedFolioSuite.tariff * selectedFolioBooking.nights * 0.18).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm text-slate-900">
                    <span>Total Folio Amount</span>
                    <span className="font-mono text-[#b4832c]">₹{selectedFolioBooking.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold text-xs pt-1">
                    <span>Paid to Date</span>
                    <span className="font-mono">₹{selectedFolioBooking.paidAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>Balance Due</span>
                    <span className="font-mono font-bold text-slate-800">
                      ₹{(selectedFolioBooking.totalAmount - selectedFolioBooking.paidAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    showNotification(`Folio for ${selectedFolioBooking.id} sent to printer.`);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Folio</span>
                </button>

                <button
                  onClick={() => {
                    showNotification(`WhatsApp confirmation re-sent to ${selectedFolioBooking.phone}`);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center space-x-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp Folio</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const newStatus = selectedFolioBooking.status === 'Occupied' ? 'Reserved' : 'Occupied';
                    setSuites(prev => prev.map(s => {
                      if (s.id !== selectedFolioSuite.id) return s;
                      return {
                        ...s,
                        status: newStatus,
                        bookings: s.bookings.map(b => b.id === selectedFolioBooking.id ? { ...b, status: newStatus } : b)
                      };
                    }));
                    showNotification(`Booking status toggled to ${newStatus}`);
                    setSelectedFolioBooking(null);
                    setSelectedFolioSuite(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0b2238] hover:bg-[#123352] text-white font-bold text-xs transition shadow-sm"
                >
                  {selectedFolioBooking.status === 'Occupied' ? 'Check Out Guest' : 'Check In Guest'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: QUICK SUITE RESERVATION MODAL (Slot Click)
         ========================================================================= */}
      {quickBookingSlot && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-[#0b2238] to-[#143d63] text-white p-5 flex items-start justify-between">
              <div>
                <h3 className="text-base font-black tracking-tight text-white flex items-center space-x-1.5">
                  <BedDouble className="w-4 h-4 text-amber-400" />
                  <span>Book Suite {quickBookingSlot.suite.number}</span>
                </h3>
                <p className="text-xs text-sky-200 mt-1">
                  {quickBookingSlot.suite.category} • Check-in: {quickBookingSlot.date.dayNum} {quickBookingSlot.date.monthName} {quickBookingSlot.date.date.getFullYear()}
                </p>
              </div>
              <button
                onClick={() => setQuickBookingSlot(null)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmQuickBooking} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  value={quickGuestName}
                  onChange={(e) => setQuickGuestName(e.target.value)}
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nights</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={quickNights}
                    onChange={(e) => setQuickNights(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Booking Channel</label>
                  <select
                    value={quickSource}
                    onChange={(e) => setQuickSource(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  >
                    <option value="Direct Walk-in">Direct Walk-in</option>
                    <option value="Direct Web">Direct Web</option>
                    <option value="Booking.com">Booking.com</option>
                    <option value="Agoda">Agoda</option>
                    <option value="MakeMyTrip">MakeMyTrip</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Guest Mobile Number</label>
                <input
                  type="tel"
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-amber-800 font-bold uppercase">Estimated Tariff Total</div>
                  <div className="text-sm font-black text-amber-900 font-mono">
                    ₹{Math.round(quickBookingSlot.suite.tariff * Number(quickNights) * 1.18).toLocaleString('en-IN')}
                  </div>
                </div>
                <span className="text-[10px] text-amber-700 font-medium">Incl. GST 18%</span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickBookingSlot(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0b2238] hover:bg-[#123352] text-white font-bold shadow-sm"
                >
                  Confirm & Reserve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
