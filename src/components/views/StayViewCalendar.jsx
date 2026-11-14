import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  RotateCw, 
  RotateCcw, 
  Minus,
  Maximize2,
  ChevronDown, 
  ChevronUp, 
  Home, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Check, 
  X, 
  Repeat, 
  Sparkles,
  User,
  BedDouble,
  DollarSign,
  Trash2,
  Receipt,
  UserCheck,
  LogOut,
  Clock
} from 'lucide-react';
import FolioBillingModal from '../modals/FolioBillingModal';
import CheckInModal from '../modals/CheckInModal';
import CollectPaymentModal from '../modals/CollectPaymentModal';

export default function StayViewCalendar() {
  const { 
    showNotification, 
    setIsCreateReservationModalOpen,
    deleteRoom,
    requestDeleteRoom,
    checkOutReservation,
    rooms = [],
    reservations = []
  } = useDashboard();

  // Quick Actions toggle
  const [quickActionsActive, setQuickActionsActive] = useState(false);

  // Unallocated bookings banner state
  const [isUnallocatedOpen, setIsUnallocatedOpen] = useState(false);
  
  // Selected booking modal state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isFolioModalOpen, setIsFolioModalOpen] = useState(false);
  const [folioActiveBooking, setFolioActiveBooking] = useState(null);

  // Check In and Payment Modals
  const [checkInModalRes, setCheckInModalRes] = useState(null);
  const [collectPaymentModalRes, setCollectPaymentModalRes] = useState(null);

  // Dynamic unallocated bookings from real reservations without assigned room
  const unallocatedList = React.useMemo(() => {
    return (reservations || []).filter(res => {
      if (res.status === 'CANCELLED' || res.status === 'CHECKED_OUT' || res.status === 'CHECKEDOUT') return false;
      const roomStr = String(res.room_number || res.room || '').trim();
      return !roomStr || roomStr === '0' || roomStr.toLowerCase() === 'unallocated' || roomStr.toLowerCase() === 'unassigned' || roomStr.toLowerCase() === 'pending';
    }).map(res => ({
      id: res.id,
      guest: res.guest || 'Guest',
      source: res.source || 'Website / Direct',
      category: res.room_type || res.roomType || 'Standard Room',
      checkIn: String(res.check_in || res.checkIn || '').slice(0, 10),
      checkOut: String(res.check_out || res.checkOut || '').slice(0, 10),
      amount: `₹ ${Number(res.amount || res.price || 0).toLocaleString('en-IN')}`,
      raw: res
    }));
  }, [reservations]);

  // Category collapse states
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Tooltip for room category override
  const [hoveredRoom203, setHoveredRoom203] = useState(false);

  // Timeline Navigation state: offset in days from today (default -4 so past 4 days are clearly visible)
  const [timelineOffset, setTimelineOffset] = useState(-4);

  // 18-day timeline: starting from (today + timelineOffset), showing past, today, and future
  const timelineDays = React.useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + timelineOffset + i);
      const dayNum = String(d.getDate());
      const dayName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const weekend = d.getDay() === 0 || d.getDay() === 6;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dayDate = `${yyyy}-${mm}-${dayNum.padStart(2, '0')}`;
      const isToday = dayDate === new Date().toISOString().slice(0, 10);

      // Count ALL bookings covering this day (CONFIRMED, CHECKED_IN, and historical stays)
      const staysOnDay = (reservations || []).filter(res => {
        if (res.status === 'CANCELLED') return false;
        const cIn = String(res.check_in || res.checkIn || '').slice(0, 10);
        const cOut = String(res.check_out || res.checkOut || '').slice(0, 10);
        return cIn && cOut && cIn <= dayDate && cOut >= dayDate;
      });

      // Count new reservations booked/created on this specific date
      const createdOnDay = (reservations || []).filter(res => {
        const cr = String(res.createdAt || res.created_at || '').slice(0, 10);
        return cr === dayDate;
      }).length;

      const bookedOnDay = staysOnDay.length;
      const availableCount = Math.max(0, rooms.length - bookedOnDay);
      const occupancyRate = rooms.length > 0 ? Math.round((bookedOnDay / rooms.length) * 100) : 0;

      return {
        date: dayDate,
        month: monthNames[d.getMonth()],
        dayNum,
        dayName,
        weekend,
        isToday,
        availableRooms: availableCount,
        bookedRooms: bookedOnDay,
        createdOnDay,
        occupancy: occupancyRate,
        revenue: `₹ ${(bookedOnDay * 2500).toLocaleString('en-IN')}`,
        adr: bookedOnDay > 0 ? '₹ 2,500' : '₹ 0'
      };
    });
  }, [timelineOffset, reservations, rooms]);

  // Room Categories & sub-rooms setup dynamically from rooms and real reservations
  const categoryConfig = React.useMemo(() => {
    if (!rooms || rooms.length === 0) return [];
    const grouped = {};
    const startDate = new Date(timelineDays[0].date);
    startDate.setHours(0, 0, 0, 0);
    const numDays = timelineDays.length;

    rooms.forEach(r => {
      const type = r.type || 'Standard Room';
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

      const rNum = String(r.roomNumber || r.room_number || r.id);

      // Map real reservations to this room (Never discard historical or checked out bookings)
      const roomBookings = [];
      (reservations || []).forEach(res => {
        if (res.status === 'CANCELLED') return;
        const resRoom = String(res.room_number || res.room || '');
        const matchNum = resRoom.match(/\b(\d+)\b/);
        const matchesRoom = (matchNum && matchNum[1] === rNum) || resRoom === rNum || resRoom.includes(`Room ${rNum}`) || resRoom.includes(rNum);
        if (!matchesRoom) return;

        const checkInStr = String(res.check_in || res.checkIn || '').slice(0, 10);
        const checkOutStr = String(res.check_out || res.checkOut || '').slice(0, 10);
        if (!checkInStr || !checkOutStr) return;

        const resCheckIn = new Date(checkInStr);
        resCheckIn.setHours(0, 0, 0, 0);
        const resCheckOut = new Date(checkOutStr);
        resCheckOut.setHours(0, 0, 0, 0);

        const diffInDays = Math.floor((resCheckIn - startDate) / (1000 * 60 * 60 * 24));
        const diffOutDays = Math.ceil((resCheckOut - startDate) / (1000 * 60 * 60 * 24));

        if (diffOutDays > 0 && diffInDays < numDays) {
          const startIdx = Math.max(0, diffInDays);
          const endIdx = Math.min(numDays, Math.max(diffInDays + 1, diffOutDays));
          const span = Math.max(1, endIdx - startIdx);

          let barColor = 'bg-violet-600 text-white';
          if (res.status === 'CHECKED_IN' || res.status === 'CHECKEDIN') {
            barColor = 'bg-emerald-600 text-white';
          } else if (res.status === 'CHECKED_OUT' || res.status === 'CHECKEDOUT') {
            barColor = 'bg-slate-600 text-white border border-slate-700/60';
          }

          roomBookings.push({
            id: res.id,
            guest: res.guest || 'Guest',
            shortLabel: `${(res.status === 'CHECKED_OUT' || res.status === 'CHECKEDOUT') ? '✓ Out: ' : (res.status === 'CHECKED_IN' || res.status === 'CHECKEDIN') ? 'In: ' : 'Res: '}${res.guest || 'Guest'}`,
            startIdx,
            span,
            amount: `₹ ${Number(res.amount || res.price || 0).toLocaleString('en-IN')}`,
            rawAmount: Number(res.amount || res.price || 0),
            paid: Number(res.paid || res.advance_paid || 0),
            payment: res.payment || 'PENDING',
            status: res.status || 'CONFIRMED',
            roomType: r.type,
            roomNumber: rNum,
            checkIn: checkInStr,
            checkOut: checkOutStr,
            actualCheckInTime: res.actualCheckInTime || res.actual_check_in_time || null,
            actualCheckOutTime: res.actualCheckOutTime || res.actual_check_out_time || null,
            phone: res.guest_phone || res.phone || 'N/A',
            email: res.guest_email || res.email || 'N/A',
            ratePlan: res.rate_plan || res.ratePlan || 'EP - Room Only',
            color: barColor
          });

          for (let d = startIdx; d < Math.min(numDays, startIdx + span); d++) {
            if (grouped[type].dailyStats[d]) {
              grouped[type].dailyStats[d].booked += 1;
            }
          }
        }
      });

      const todayIdx = timelineDays.findIndex(td => td.isToday);
      const isOccupiedToday = roomBookings.some(b => b.startIdx <= todayIdx && (b.startIdx + b.span) > todayIdx && (b.status === 'CHECKED_IN' || b.status === 'CHECKEDIN'));
      const isReservedToday = roomBookings.some(b => b.startIdx <= todayIdx && (b.startIdx + b.span) > todayIdx && ['CONFIRMED', 'PENDING', 'RESERVED'].includes(b.status));

      grouped[type].rooms.push({
        id: rNum,
        name: rNum,
        statusColor: (isOccupiedToday || r.status === 'OCCUPIED')
          ? 'bg-amber-500'
          : (isReservedToday || r.status === 'RESERVED')
            ? 'bg-violet-500'
            : 'bg-emerald-500',
        bookings: roomBookings
      });
    });

    Object.values(grouped).forEach(cat => {
      cat.dailyStats.forEach(stat => {
        stat.available = Math.max(0, cat.inventory - stat.booked);
      });
    });

    return Object.values(grouped);
  }, [rooms, reservations, timelineDays]);

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

  return (
    <div className="space-y-4 select-none">
      {/* Title & Quick Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Stay View Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage room allocations and guest stays across the timeline.
          </p>
        </div>

        {/* Quick Actions Toggle (Top Right from Screenshot 1) */}
        <div className="flex items-center space-x-2.5 self-start sm:self-center">
          <span className="text-xs font-semibold text-slate-600">Quick Actions</span>
          <button
            onClick={() => {
              setQuickActionsActive(!quickActionsActive);
              showNotification(quickActionsActive ? 'Quick Actions disabled' : 'Quick Actions enabled');
            }}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
              quickActionsActive ? 'bg-[#0e4860] justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition" />
          </button>
        </div>
      </div>

      {/* Unallocated Bookings Alert Banner (Exact Match with Screenshot 1) */}
      <div className="bg-rose-50/70 border-2 border-rose-200/90 rounded-2xl p-4 transition-all shadow-2xs">
        <div 
          onClick={() => setIsUnallocatedOpen(!isUnallocatedOpen)}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-black text-sm shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-rose-900 leading-tight">
                Unallocated Bookings
              </div>
              <div className="text-xs text-rose-600 mt-0.5">
                {unallocatedList.length} bookings need room allocation before check-in
              </div>
            </div>
          </div>

          <button 
            className="p-1 text-rose-600 hover:text-rose-800 transition"
            title="Toggle Unallocated Bookings"
          >
            {isUnallocatedOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Expandable Unallocated List */}
        {isUnallocatedOpen && (
          <div className="mt-4 pt-4 border-t border-rose-200/80 space-y-2.5">
            {unallocatedList.length === 0 ? (
              <div className="text-xs text-slate-500 py-2">All active bookings have been allocated to rooms.</div>
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
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        {item.source}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      Requested: <strong className="text-slate-700">{item.category}</strong> • Stay: {item.checkIn} – {item.checkOut} • Total: {item.amount}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAllocateRoom(item)}
                      className="px-3.5 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs rounded-lg shadow-sm transition"
                    >
                      Allocate Room
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Date Controls & Legend Toolbar (Screenshot 1) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        {/* Left: Date Picker Navigator */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setTimelineOffset(prev => prev - 7)}
            className="px-3 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center space-x-1 text-slate-700 font-bold text-xs transition shadow-2xs cursor-pointer"
            title="Previous 7 Days"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev 7 Days</span>
          </button>

          <button 
            onClick={() => setTimelineOffset(-4)}
            className="px-3 h-9 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs transition shadow-2xs cursor-pointer"
            title="Jump to Current Week / Today"
          >
            Today
          </button>

          <button 
            onClick={() => setTimelineOffset(prev => prev + 7)}
            className="px-3 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center space-x-1 text-slate-700 font-bold text-xs transition shadow-2xs cursor-pointer"
            title="Next 7 Days"
          >
            <span className="hidden sm:inline">Next 7 Days</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-9 px-3 rounded-xl border border-slate-200 bg-white flex items-center space-x-2 shadow-2xs">
            <span className="text-xs font-mono font-bold text-slate-800">
              {timelineDays[0]?.date} — {timelineDays[timelineDays.length - 1]?.date}
            </span>
            <input
              type="date"
              value={timelineDays[0]?.date || ''}
              onChange={e => {
                if (e.target.value) {
                  const target = new Date(e.target.value);
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
                  setTimelineOffset(diff);
                }
              }}
              className="text-xs border-0 bg-transparent cursor-pointer p-0 w-5 opacity-70 hover:opacity-100"
              title="Pick a Date to Jump Timeline"
            />
          </div>
        </div>

        {/* Right: Legend & Actions */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" />
              <span>Inventory</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span>Booked</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span>Checked Out (History)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => showNotification('Stayview synchronized with latest room inventory.')}
              className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition shadow-2xs"
              title="Refresh Matrix"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => showNotification('Stayview layout reset to defaults.')}
              className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition shadow-2xs"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => showNotification('Fullscreen zoom toggled.')}
              className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition shadow-2xs"
              title="Toggle Zoom / Compact Mode"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MATRIX TABLE CONTAINER (Exact Match with Screenshots 1, 2, 3, 4, 5) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1300px]">
            {/* Header Dates Row */}
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="p-3 w-48 border-r border-slate-200 font-black text-xs text-slate-700 uppercase tracking-wider sticky left-0 bg-slate-50 z-20">
                  DATE
                </th>
                {timelineDays.map(d => (
                  <th 
                    key={d.date}
                    className={`p-2.5 text-center border-r border-slate-200 text-xs min-w-[70px] ${
                      d.weekend 
                        ? 'bg-[#fff8e7] text-amber-900 border-b-2 border-amber-300 font-bold' 
                        : 'text-slate-600'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{d.month}</div>
                    <div className="text-sm font-black mt-0.5">{d.dayNum}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{d.dayName}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* SUMMARY ROW 1: Available Rooms */}
              <tr className="border-b border-slate-200 hover:bg-slate-50/30">
                <td className="p-3 border-r border-slate-200 font-bold text-xs text-slate-800 flex items-center space-x-2 sticky left-0 bg-white z-10">
                  <Home className="w-4 h-4 text-emerald-600" />
                  <span>Available Rooms</span>
                </td>
                {timelineDays.map(d => (
                  <td 
                    key={d.date} 
                    className={`p-2 text-center border-r border-slate-200 ${d.weekend ? 'bg-[#fff8e7]/50' : ''}`}
                  >
                    <span className="inline-block bg-[#dcfce7] text-[#15803d] font-bold text-xs px-2.5 py-0.5 rounded-md shadow-2xs">
                      {d.availableRooms}
                    </span>
                  </td>
                ))}
              </tr>

              {/* SUMMARY ROW 2: OCCUPANCY */}
              <tr className="border-b border-slate-200 hover:bg-slate-50/30">
                <td className="p-3 border-r border-slate-200 font-bold text-xs text-slate-800 flex items-center space-x-2 sticky left-0 bg-white z-10">
                  <TrendingUp className="w-4 h-4 text-sky-600" />
                  <span>OCCUPANCY</span>
                </td>
                {timelineDays.map(d => (
                  <td 
                    key={d.date} 
                    className={`p-2 text-center border-r border-slate-200 ${d.weekend ? 'bg-[#fff8e7]/50' : ''}`}
                  >
                    <div className="text-xs font-bold text-sky-800">{d.occupancy}%</div>
                    <div className="w-8 mx-auto bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                      {d.occupancy > 0 && (
                        <div 
                          className="bg-sky-500 h-full rounded-full" 
                          style={{ width: `${d.occupancy * 4}%` }}
                        />
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* SUMMARY ROW 3: REVENUE */}
              <tr className="border-b-2 border-slate-300 hover:bg-slate-50/30">
                <td className="p-3 border-r border-slate-200 font-bold text-xs text-slate-800 flex items-center space-x-2 sticky left-0 bg-white z-10">
                  <span className="text-sm font-black text-emerald-600">₹</span>
                  <span>REVENUE</span>
                </td>
                {timelineDays.map(d => (
                  <td 
                    key={d.date} 
                    className={`p-2 text-center border-r border-slate-200 ${d.weekend ? 'bg-[#fff8e7]/50' : ''}`}
                  >
                    <div className="text-xs font-black text-slate-900">{d.revenue}</div>
                    <div className="text-[9.5px] font-semibold text-slate-400 mt-0.5">ADR {d.adr}</div>
                  </td>
                ))}
              </tr>

              {/* ROOM CATEGORIES & ROOM ROWS (Accordion Matrix) */}
              {categoryConfig.length === 0 ? (
                <tr>
                  <td colSpan={timelineDays.length + 1} className="py-12 text-center text-slate-400 font-sans text-xs">
                    No rooms configured yet. Click "+ Add Room" in Room Management to view your visual stay calendar matrix.
                  </td>
                </tr>
              ) : (
                categoryConfig.map(cat => {
                const isCollapsed = collapsedCategories[cat.id];

                return (
                  <React.Fragment key={cat.id}>
                    {/* Category Header Row with 3-Pill Indicators */}
                    <tr 
                      onClick={() => toggleCategory(cat.id)}
                      className="border-b border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer transition"
                    >
                      <td className="p-3 border-r border-slate-200 sticky left-0 bg-slate-50 z-10">
                        <div className="flex items-center space-x-2">
                          <button className="text-slate-500 hover:text-slate-800">
                            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <span className="font-extrabold text-xs text-slate-900">{cat.name}</span>
                        </div>
                      </td>

                      {/* 3-Pill Mini Indicators per date */}
                      {cat.dailyStats.map((st, dayIdx) => {
                        const isWeekend = timelineDays[dayIdx].weekend;
                        return (
                          <td 
                            key={dayIdx} 
                            className={`p-1.5 text-center border-r border-slate-200 ${isWeekend ? 'bg-[#fff8e7]/60' : ''}`}
                          >
                            <div className="flex flex-col items-center justify-center space-y-1">
                              {/* Top Purple Pill: Total Inventory */}
                              <span className="inline-block bg-[#ede9fe] text-[#6d28d9] font-black text-[9.5px] px-1.5 py-0.2 rounded shadow-2xs">
                                {cat.inventory}
                              </span>
                              {/* Bottom: Left Red Pill (Booked), Right Green Pill (Available) */}
                              <div className="flex items-center space-x-1">
                                <span className={`inline-block font-black text-[9px] px-1.5 py-0.2 rounded shadow-2xs ${
                                  st.booked > 0 ? 'bg-[#ffe4e6] text-[#be123c]' : 'bg-[#ffe4e6]/70 text-[#be123c]/80'
                                }`}>
                                  {st.booked}
                                </span>
                                <span className="inline-block bg-[#dcfce7] text-[#15803d] font-black text-[9px] px-1.5 py-0.2 rounded shadow-2xs">
                                  {st.available}
                                </span>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Expanded Individual Room Rows */}
                    {!isCollapsed && cat.rooms.map(room => {
                      return (
                        <tr 
                          key={room.id}
                          className="border-b border-slate-100 hover:bg-slate-50/40 transition h-14"
                        >
                          {/* Room Name Column */}
                          <td className="p-3 border-r border-slate-200 sticky left-0 bg-white z-10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-xs text-slate-800">{room.name}</span>
                                {room.isOverridden && (
                                  <div 
                                    onMouseEnter={() => setHoveredRoom203(true)}
                                    onMouseLeave={() => setHoveredRoom203(false)}
                                    className="relative flex items-center space-x-1 bg-amber-50 text-amber-700 border border-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                                  >
                                    <Repeat className="w-3 h-3 text-amber-600" />
                                    <span>Changed: D...</span>

                                    {/* Tooltip from Screenshot 4 */}
                                    {hoveredRoom203 && (
                                      <div className="absolute left-0 bottom-full mb-2 w-64 bg-[#1e293b] text-white text-[11px] font-medium p-3 rounded-xl shadow-2xl z-50 pointer-events-none leading-relaxed border border-slate-700">
                                        Room category has been modified for this operational date range.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${room.statusColor}`} />
                              </div>
                            </div>
                          </td>

                          {/* 15 Days Grid Cells for this room */}
                          {timelineDays.map((d, dayIdx) => {
                            const isWeekend = d.weekend;

                            // Check if an existing booking covers this day
                            const bookingStartingHere = room.bookings.find(b => b.startIdx === dayIdx);
                            const isCoveredByPriorBooking = room.bookings.some(b => dayIdx > b.startIdx && dayIdx < (b.startIdx + b.span));

                            // If covered by a prior spanning booking, skip rendering separate td
                            if (isCoveredByPriorBooking) {
                              return null;
                            }

                            // If booking starts on this day, render spanning cell
                            if (bookingStartingHere) {
                              return (
                                <td 
                                  key={dayIdx}
                                  colSpan={bookingStartingHere.span}
                                  className={`p-1.5 border-r border-slate-200 align-middle ${isWeekend ? 'bg-[#fff8e7]/40' : ''}`}
                                >
                                  <div 
                                    onClick={() => setSelectedBooking(bookingStartingHere)}
                                    className={`h-9 rounded-lg ${bookingStartingHere.color} text-white px-2.5 flex items-center space-x-1.5 shadow-sm cursor-pointer hover:opacity-95 transition`}
                                    title={`${bookingStartingHere.guest} (${bookingStartingHere.id})`}
                                  >
                                    <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                      <Check className="w-2.5 h-2.5 text-white" />
                                    </div>
                                    <span className="text-xs font-bold truncate">
                                      {bookingStartingHere.shortLabel || bookingStartingHere.guest}
                                    </span>
                                  </div>
                                </td>
                              );
                            }

                            // If room is overridden or N/A
                            if (room.isOverridden || (room.isDeluxeNA && dayIdx === 0)) {
                              return (
                                <td 
                                  key={dayIdx}
                                  className={`p-2 text-center border-r border-slate-200 text-xs text-slate-300 font-semibold ${
                                    isWeekend ? 'bg-[#fff8e7]/30' : ''
                                  }`}
                                >
                                  N/A
                                </td>
                              );
                            }

                            // Empty Cell: Hoverable with (+) button
                            return (
                              <td 
                                key={dayIdx}
                                onClick={() => setIsCreateReservationModalOpen(true)}
                                className={`p-1 border-r border-slate-200 text-center relative group cursor-pointer hover:bg-sky-50/70 transition ${
                                  isWeekend ? 'bg-[#fff8e7]/20' : ''
                                }`}
                              >
                                <div className="w-full h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                  <div className="w-5 h-5 rounded-full border border-sky-400 bg-white text-sky-600 flex items-center justify-center shadow-xs">
                                    <Plus className="w-3 h-3" />
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOOKING DETAILS MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <span className={`w-3.5 h-3.5 rounded-full ${selectedBooking.color}`} />
                <div>
                  <h3 className="font-black text-base text-slate-900">{selectedBooking.guest}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Online Booking Details</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBooking(null)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Booking ID:</span>
                <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">{selectedBooking.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Allocated Room:</span>
                <span className="font-bold text-slate-900">Room #{selectedBooking.roomNumber} ({selectedBooking.roomType})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Stay Dates:</span>
                <span className="font-semibold text-slate-800">{selectedBooking.checkIn} → {selectedBooking.checkOut} ({selectedBooking.span} Nights)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Actual Check-In:</span>
                </span>
                <span className={`font-semibold ${selectedBooking.actualCheckInTime ? 'text-emerald-700' : 'text-amber-600'}`}>
                  {selectedBooking.actualCheckInTime
                    ? new Date(selectedBooking.actualCheckInTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
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
                    {new Date(selectedBooking.actualCheckOutTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
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
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  selectedBooking.payment === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedBooking.payment}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Stay Status:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  selectedBooking.status === 'CHECKED_IN' || selectedBooking.status === 'CHECKEDIN'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedBooking.status === 'CHECKED_OUT' || selectedBooking.status === 'CHECKEDOUT'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-violet-100 text-violet-800'
                }`}>
                  {selectedBooking.status === 'CHECKED_IN' || selectedBooking.status === 'CHECKEDIN'
                    ? 'OCCUPIED (CHECKED IN)'
                    : selectedBooking.status === 'CHECKED_OUT' || selectedBooking.status === 'CHECKEDOUT'
                      ? 'CHECKED OUT'
                      : 'RESERVED (NOT CHECKED IN)'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {selectedBooking.status !== 'CHECKED_IN' && selectedBooking.status !== 'CHECKEDIN' && selectedBooking.status !== 'CHECKEDOUT' && selectedBooking.status !== 'CHECKED_OUT' && (
                <button
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
                  onClick={() => {
                    if (checkOutReservation) {
                      checkOutReservation(selectedBooking.id);
                    }
                    setSelectedBooking(null);
                  }}
                  className="flex-1 min-w-[120px] py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Check Out</span>
                </button>
              )}

              {selectedBooking.payment !== 'PAID' && (
                <button
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
                onClick={() => {
                  setFolioActiveBooking(selectedBooking);
                  setIsFolioModalOpen(true);
                  setSelectedBooking(null);
                }}
                className="flex-1 min-w-[120px] py-2.5 bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
              >
                Folio & Invoice
              </button>

              <button
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
          room={rooms.find(r => String(r.roomNumber || r.room_number) === String(folioActiveBooking.roomNumber)) || {
            room_number: folioActiveBooking.roomNumber,
            price: Number(String(folioActiveBooking.amount || '').replace(/[^\d.]/g, '')) || 2500,
            guest: folioActiveBooking.guest
          }}
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
            price: Number(folioActiveBooking.rawAmount ?? String(folioActiveBooking.amount || '').replace(/[^\d.]/g, '')) || 2500,
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

