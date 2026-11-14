import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Building2, 
  Home, 
  Clock, 
  ArrowRight, 
  Users, 
  Calendar, 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  Zap, 
  RotateCw, 
  Search, 
  Filter, 
  Wifi, 
  Snowflake, 
  Info, 
  Check, 
  CheckCircle2, 
  Paintbrush, 
  LogOut, 
  X, 
  ArrowLeft, 
  Repeat, 
  FileText, 
  Sliders,
  Shield,
  Layers,
  Sparkles,
  Trash2
} from 'lucide-react';

export default function DayViewOperations() {
  const {
    showNotification,
    setIsCreateReservationModalOpen,
    rooms: contextRooms = [],
    reservations = [],
    setIsCreateRoomModalOpen,
    updateRoomStatus,
    checkoutRoom,
    deleteRoom,
    requestDeleteRoom
  } = useDashboard();

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('ALL');

  // Room Profile Slide-Over Drawer state (Screenshot 5)
  const [activeProfileRoom, setActiveProfileRoom] = useState(null);

  // Device controls within profile drawer
  const [deviceControls, setDeviceControls] = useState({
    electricity: true,
    ac: true,
    wifi: false,
  });

  // Live Rooms Data mapped dynamically from context
  const dayRooms = React.useMemo(() => {
    if (!contextRooms || contextRooms.length === 0) return [];
    const formatArrivalTs = (ts, fallbackDate) => {
      const raw = ts || fallbackDate;
      if (!raw) return 'Scheduled';
      try {
        const normalized = String(raw).includes(' ') && !String(raw).includes('T') ? String(raw).replace(' ', 'T') : String(raw);
        const d = new Date(normalized);
        if (Number.isNaN(d.getTime())) return String(raw);
        if (!ts) return String(raw);
        return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
      } catch {
        return String(raw);
      }
    };

    return contextRooms.map(r => {
      const isOccupied = r.status === 'OCCUPIED';
      const isReserved = r.status === 'RESERVED';
      const rCleanNum = String(r.roomNumber || r.room_number || '').replace(/\D/g, '') || String(r.roomNumber || r.room_number || '');
      const roomBookingId = r.bookingId || r.booking_id || null;
      const matchingBookings = reservations.filter(b => {
        const st = String(b.status || '').toUpperCase();
        if (['CANCELLED', 'CHECKED_OUT', 'CHECKEDOUT', 'NO_SHOW'].includes(st)) return false;
        if (roomBookingId && String(b.id) === String(roomBookingId)) return true;
        const bCleanNum = String(b.room_number || '').replace(/\D/g, '') || String(b.room_number || '');
        return (
          bCleanNum === rCleanNum ||
          b.room === r.roomNumber ||
          String(b.room || '').includes(`Room ${r.roomNumber}`)
        );
      });
      const booking =
        (roomBookingId && matchingBookings.find(b => String(b.id) === String(roomBookingId))) ||
        matchingBookings.find(b => ['CHECKED_IN', 'CHECKEDIN', 'OCCUPIED'].includes(String(b.status || '').toUpperCase())) ||
        matchingBookings[0];
      return {
        id: `R-${r.roomNumber}`,
        roomNumber: String(r.roomNumber),
        type: r.type || 'Standard Room',
        floor: r.floor || '1st Floor',
        floorVal: '1',
        status: r.status || 'VACANT_READY',
        statusLabel: (r.status || 'VACANT_READY').replace(/_/g, ' '),
        statusColor: isOccupied ? 'red' : isReserved ? 'violet' : 'green',
        readyTag: isReserved ? 'Awaiting Check-In' : 'Room Ready',
        occupied: isOccupied,
        reserved: isReserved,
        bookingId: booking?.id ? `AST-B-${booking.id}` : null,
        guest: booking?.guest || r.guest || null,
        checkInTime: formatArrivalTs(booking?.actualCheckInTime || booking?.actual_check_in_time, booking?.checkIn || booking?.check_in),
        stayDuration: `${booking?.nights || 1} night(s)`,
        adults: booking?.adults || 1,
        children: booking?.children || 0,
        amenities: { electricity: true, wifi: true, ac: true }
      };
    });
  }, [contextRooms, reservations]);

  // Handle Checkout using full reservation & timestamp capture
  const handleCheckoutGuest = (roomId) => {
    const roomNumber = roomId.replace('R-', '');
    if (checkoutRoom) {
      checkoutRoom(roomNumber);
    } else if (updateRoomStatus) {
      updateRoomStatus(roomNumber, 'DIRTY');
      showNotification(`Guest checked out of Room ${roomNumber}. Room marked for Housekeeping!`);
    }
  };

  // Filter Rooms
  const filteredRooms = dayRooms.filter(r => {
    if (selectedFloor !== 'ALL' && r.floorVal !== selectedFloor && r.floor !== selectedFloor) return false;
    if (selectedType !== 'ALL' && r.type !== selectedType) return false;
    if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
    if (selectedRoomNumber !== 'ALL' && r.roomNumber !== selectedRoomNumber) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = r.id.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
      const matchGuest = r.guest && r.guest.toLowerCase().includes(q);
      const matchBooking = r.bookingId && r.bookingId.toLowerCase().includes(q);
      return matchName || matchGuest || matchBooking;
    }
    return true;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedFloor('ALL');
    setSelectedType('ALL');
    setSelectedStatus('ALL');
    setSelectedRoomNumber('ALL');
    showNotification(`Filters reset to show all ${contextRooms.length} rooms.`);
  };

  return (
    <div className="space-y-5 select-none relative">
      {/* Title Row (Screenshot 1) */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Accommodation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage rooms, check-ins, and floor operations.
        </p>
      </div>

      {/* Row 1: 7 Core Operations KPI Cards (Exact match with Screenshot 1) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* TOTAL ROOMS */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TOTAL ROOMS</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{contextRooms.length}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">{contextRooms.filter(r => r.status === 'OCCUPIED' || r.status === 'RESERVED').length} Booked ({contextRooms.filter(r => r.status === 'RESERVED').length} Res)</div>
          </div>
        </div>

        {/* AVAILABLE */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Home className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AVAILABLE</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{contextRooms.filter(r => r.status === 'VACANT_READY').length}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Ready to Assign</div>
          </div>
        </div>

        {/* ON-HOLD */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ON-HOLD</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{contextRooms.filter(r => r.status === 'MAINTENANCE').length}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Blocked Rooms</div>
          </div>
        </div>

        {/* CHECK-IN */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CHECK-IN</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{reservations.filter(r => r.status === 'CHECKED_IN' || r.status === 'CHECKEDIN').length}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">{reservations.filter(r => ['CONFIRMED', 'RESERVED', 'PENDING'].includes(r.status)).length} Reserved</div>
          </div>
        </div>

        {/* CHECK-OUT */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CHECK-OUT</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{reservations.filter(r => r.status === 'CHECKED_OUT' || r.status === 'CHECKEDOUT').length}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Completed Stays</div>
          </div>
        </div>

        {/* GUEST IN-HOUSE */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GUEST IN-HOUSE</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{contextRooms.filter(r => r.status === 'OCCUPIED').length}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">{contextRooms.filter(r => r.status === 'RESERVED').length} Reserved · Stays</div>
          </div>
        </div>

        {/* BOOKINGS */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">BOOKINGS</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{reservations.length}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Total Bookings</div>
          </div>
        </div>
      </div>

      {/* Row 2: 3 Financial / Operational Metrics (Screenshot 1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SALES */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">SALES</div>
            <div className="text-2xl font-black text-slate-900">₹{reservations.reduce((acc, r) => acc + (Number(r.amount) || 0), 0).toFixed(2)}</div>
            <div className="text-xs text-slate-500 mt-0.5">Today Gross Revenue</div>
          </div>
        </div>

        {/* EXPENSES */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">EXPENSES</div>
            <div className="text-2xl font-black text-slate-900">₹0.00</div>
            <div className="text-xs text-slate-500 mt-0.5">Today Operational Costs</div>
          </div>
        </div>

        {/* PAYMENTS */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">PAYMENTS</div>
            <div className="text-2xl font-black text-slate-900">₹{reservations.filter(r => r.payment === 'PAID').reduce((acc, r) => acc + (Number(r.amount) || 0), 0).toFixed(2)}</div>
            <div className="text-xs text-slate-500 mt-0.5">Total Collections</div>
          </div>
        </div>
      </div>

      {/* Row 3: Action Buttons (Dashed Buttons from Screenshots 1 & 2) */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => showNotification('Auto-assigned all pending online arrivals to optimal clean rooms.')}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-[#0e4860] border-2 border-dashed border-[#0e4860]/40 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition shadow-2xs cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-[#0e4860] text-[#0e4860]" />
          <span>AUTO-ASSIGN ROOMS</span>
        </button>

        <button
          onClick={() => showNotification('Batch clean dispatched to Housekeeping mobile staff.')}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-[#0e4860] border-2 border-dashed border-[#0e4860]/40 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition shadow-2xs cursor-pointer"
        >
          <RotateCw className="w-4 h-4 text-[#0e4860]" />
          <span>BATCH CLEAN</span>
        </button>
      </div>

      {/* Row 4: Search & Filters Bar (Screenshots 1 & 2) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-3.5">
        {/* Top Search & Legend */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search room or guest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0e4860] focus:bg-white transition"
            />
          </div>

          {/* Status Legend Dots (Screenshot 2) */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Vacant</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Occupied</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
              <span>Reserved</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Cleaning</span>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns Row (Screenshot 2) */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Date Box */}
          <div className="h-9 px-3.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center space-x-2">
            <span>05/11/2026</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Floor Number Dropdown */}
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Floor Number</option>
            <option value="0">GF Floor</option>
            <option value="1">1st Floor</option>
            <option value="2">2nd Floor</option>
            <option value="3">3rd Floor</option>
            <option value="4">4th Floor</option>
          </select>

          {/* Room Type Dropdown */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Room Type</option>
            <option value="Standard Room">Standard Room</option>
            <option value="Deluxe Room">Deluxe Room</option>
            <option value="Super Deluxe Room">Super Deluxe Room</option>
            <option value="Suite Room">Suite Room</option>
            <option value="Banquet Hall">Banquet Hall</option>
            <option value="DayTrip">DayTrip</option>
          </select>

          {/* Room Number Dropdown */}
          <select
            value={selectedRoomNumber}
            onChange={(e) => setSelectedRoomNumber(e.target.value)}
            className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Room Number</option>
            {dayRooms.map(r => (
              <option key={r.id} value={r.roomNumber}>{r.id}</option>
            ))}
          </select>

          {/* Room Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Room Status</option>
            <option value="VACANT_READY">Vacant Ready</option>
            <option value="RESERVED">Reserved (Not Checked In)</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="CHECKING_OUT">Checking Out</option>
            <option value="NOT_READY">Not Ready</option>
            <option value="DIRTY">Dirty</option>
            <option value="CLEANING">Cleaning</option>
          </select>

          {/* Reset Button */}
          <button
            onClick={handleResetFilters}
            className="h-9 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition ml-auto"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Row 5: 4-Column Room Cards Grid (Exact match with Screenshots 2, 3, 4, 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredRooms.map(room => {
          // Color coding of top border stripe matching screenshots
          const topStripeClass = 
            room.statusColor === 'yellow' ? 'border-t-4 border-amber-400' :
            room.statusColor === 'red' ? 'border-t-4 border-rose-500' :
            room.statusColor === 'purple' ? 'border-t-4 border-[#7c63b4]' :
            'border-t-4 border-emerald-600';

          return (
            <div 
              key={room.id}
              className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between space-y-3.5 transition hover:shadow-md ${topStripeClass}`}
            >
              <div>
                {/* Amenities Icons & Room Pill Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                      <Zap className="w-3 h-3 text-slate-500" />
                    </div>
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                      <Wifi className="w-3 h-3 text-slate-500" />
                    </div>
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                      <Snowflake className="w-3 h-3 text-slate-500" />
                    </div>
                  </div>

                  <span className="font-mono font-bold text-xs text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-md">
                    {room.id}
                  </span>
                </div>

                {/* Booking Paid Header if Occupied / Checking out */}
                {room.occupied && (
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                      {room.bookingId} <span>🚶</span>
                    </span>
                    <span className="text-emerald-600 font-bold text-[11px]">
                      Booking Paid
                    </span>
                  </div>
                )}

                {/* Ready Tag Pill */}
                {room.readyTag && !room.occupied && (
                  <div className="inline-block bg-slate-100 text-slate-600 font-bold text-[10px] px-2 py-0.5 rounded mb-1">
                    {room.readyTag}
                  </div>
                )}

                {/* Category & Floor */}
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-slate-900">{room.type}</h3>
                  <span className="text-xs text-slate-500 font-medium">{room.floor}</span>
                </div>

                {/* Status Badge */}
                <div className="mt-2">
                  <span className={`inline-block font-bold text-xs px-2.5 py-1 rounded-md ${
                    room.status === 'NOT_READY' || room.status === 'DIRTY' ? 'bg-amber-400 text-amber-950' :
                    room.status === 'RESERVED' ? 'bg-violet-600 text-white' :
                    room.status === 'OCCUPIED' ? 'bg-[#f87171] text-white' :
                    room.status === 'CHECKING_OUT' ? 'bg-[#7c63b4] text-white' :
                    'bg-[#2e7d32] text-white'
                  }`}>
                    {room.statusLabel}
                  </span>
                </div>

                {/* RESERVED SPECIFIC CONTENT */}
                {room.status === 'RESERVED' && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-violet-900 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-violet-500" /> {room.guest || 'Reserved Guest'}
                      </span>
                      <span className="text-violet-600 font-semibold">Arrival: {room.checkInTime}</span>
                    </div>
                    <div className="text-[11px] text-amber-700 font-semibold">Booked • Not checked in yet</div>
                  </div>
                )}

                {/* OCCUPIED SPECIFIC CONTENT (e.g. R-102) */}
                {room.status === 'OCCUPIED' && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> {room.guest}
                      </span>
                      <span className="text-slate-500">In: {room.checkInTime}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">Stay duration: {room.stayDuration}</div>
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                        👥 {room.adults} Adults
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                        👥 {room.children} Children
                      </span>
                    </div>
                  </div>
                )}

                {/* CHECKING OUT SPECIFIC CONTENT (e.g. R-302) */}
                {room.status === 'CHECKING_OUT' && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="text-rose-600 font-bold text-[11px] flex items-center gap-1 uppercase tracking-wider">
                      <Paintbrush className="w-3.5 h-3.5" /> HOUSEKEEPING NEEDED
                    </div>
                    <div className="flex items-center justify-between bg-rose-50/60 p-2 rounded-lg border border-rose-100">
                      <div>
                        <div className="text-[10px] font-bold text-rose-700 uppercase">DEPARTING TODAY</div>
                        <div className="font-bold text-slate-900 mt-0.5">👤 {room.guest}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-medium">CO: {room.checkOutTime}</div>
                        <button
                          onClick={() => handleCheckoutGuest(room.id)}
                          className="mt-1 bg-[#f43f5e] hover:bg-[#e11d48] text-white text-xs font-bold px-2.5 py-1 rounded-md transition shadow-2xs"
                        >
                          Check Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                {room.status === 'OCCUPIED' && (
                  <button
                    onClick={() => handleCheckoutGuest(room.id)}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 border border-rose-200 transition shadow-2xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Check Out Room</span>
                  </button>
                )}

                {/* Available Action Button if Vacant Ready */}
                {room.status === 'VACANT_READY' && (
                  <button
                    onClick={() => setIsCreateReservationModalOpen(true)}
                    className="w-full py-2 bg-[#e8fbf3] hover:bg-[#d1f7e7] text-[#059669] font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 border border-emerald-200 transition shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>AVAILABLE</span>
                  </button>
                )}

                {/* Not Ready Button for R-101 */}
                {room.status === 'NOT_READY' && (
                  <button
                    onClick={() => {
    const roomNumber = room.id.replace('R-', '');
    if (updateRoomStatus) {
      updateRoomStatus(roomNumber, 'VACANT_READY');
    }
    showNotification(`Room ${roomNumber} marked AVAILABLE.`);
  }}
                    className="w-full py-2 bg-[#e8fbf3] hover:bg-[#d1f7e7] text-[#059669] font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 border border-emerald-200 transition shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>AVAILABLE</span>
                  </button>
                )}

                {/* Details Button */}
                <div className="flex items-center space-x-1.5 pt-1">
                  <button
                    onClick={() => setActiveProfileRoom(room)}
                    className="w-full flex items-center justify-center space-x-1 text-xs font-semibold text-slate-700 hover:text-slate-900 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ROOM PROFILE SLIDE-OVER DRAWER (Exact match with Screenshot 5) */}
      {activeProfileRoom && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setActiveProfileRoom(null)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Dark Teal Header Strip (Screenshot 5) */}
              <div className="bg-[#0e4860] px-6 py-5 text-white flex items-center space-x-3.5 shrink-0">
                <button
                  onClick={() => setActiveProfileRoom(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                  title="Close Profile"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="text-[10px] font-bold text-sky-200 uppercase tracking-widest">
                    ROOM PROFILE
                  </div>
                  <h2 className="text-xl font-black text-white leading-tight">
                    {activeProfileRoom.roomNumber}
                  </h2>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Room Card Title & Badges */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-black text-slate-900">
                    {activeProfileRoom.roomNumber}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center space-x-1 bg-sky-50 text-sky-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-sky-200">
                      <span>▲</span> <span>{activeProfileRoom.type}</span>
                    </span>
                    <span className={`inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                      activeProfileRoom.status === 'OCCUPIED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      activeProfileRoom.status === 'CHECKING_OUT' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      <span>🚪</span> <span>{activeProfileRoom.statusLabel}</span>
                    </span>
                  </div>
                </div>

                {/* Quick Actions (Screenshot 5) */}
                <div>
                  <div className="text-xs font-bold text-slate-800 mb-2.5 uppercase tracking-wider">
                    Quick Actions
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => showNotification(`Generating GRC registration card for ${activeProfileRoom.id}`)}
                      className="p-3 bg-sky-50/60 hover:bg-sky-100/70 border border-sky-100 rounded-xl text-center transition group cursor-pointer"
                    >
                      <FileText className="w-5 h-5 text-sky-700 mx-auto mb-1 group-hover:scale-110 transition" />
                      <span className="text-xs font-bold text-sky-900">GRC Form</span>
                    </button>

                    <button
                      onClick={() => {
                        const next = activeProfileRoom.status === 'VACANT_READY' ? 'OCCUPIED' : 'VACANT_READY';
    const roomNumber = activeProfileRoom.id.replace('R-', '');
    if (updateRoomStatus) {
      updateRoomStatus(roomNumber, next);
    }
    setActiveProfileRoom(prev => ({ ...prev, status: next, statusLabel: next === 'OCCUPIED' ? 'Occupied' : 'Vacant Ready', statusColor: next === 'OCCUPIED' ? 'red' : 'green' }));
    showNotification(`Room ${roomNumber} status updated to ${next}.`);
                      }}
                      className="p-3 bg-sky-50/60 hover:bg-sky-100/70 border border-sky-100 rounded-xl text-center transition group cursor-pointer"
                    >
                      <Repeat className="w-5 h-5 text-sky-700 mx-auto mb-1 group-hover:scale-110 transition" />
                      <span className="text-xs font-bold text-sky-900">Room Status</span>
                    </button>
                  </div>
                </div>

                {/* Control Tab & Device Toggles (Screenshot 5) */}
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/90 space-y-4">
                  <div className="inline-flex items-center space-x-1.5 bg-[#0e4860] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Control</span>
                  </div>

                  {/* Device Toggles List */}
                  <div className="space-y-3.5 text-xs font-bold text-slate-800">
                    {/* Electricity */}
                    <div className="flex items-center justify-between py-2 border-b border-slate-200/80">
                      <div className="flex items-center space-x-2.5">
                        <Zap className="w-4 h-4 text-slate-600" />
                        <span>Electricity</span>
                      </div>
                      <button
                        onClick={() => setDeviceControls(prev => ({ ...prev, electricity: !prev.electricity }))}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                          deviceControls.electricity ? 'bg-[#0e4860] justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                      </button>
                    </div>

                    {/* Air Conditioner */}
                    <div className="flex items-center justify-between py-2 border-b border-slate-200/80">
                      <div className="flex items-center space-x-2.5">
                        <Snowflake className="w-4 h-4 text-slate-600" />
                        <span>Air Conditioner</span>
                      </div>
                      <button
                        onClick={() => setDeviceControls(prev => ({ ...prev, ac: !prev.ac }))}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                          deviceControls.ac ? 'bg-[#0e4860] justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                      </button>
                    </div>

                    {/* Wi-Fi */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-2.5">
                        <Wifi className="w-4 h-4 text-slate-600" />
                        <span>Wi-Fi</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        deviceControls.wifi ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {deviceControls.wifi ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Room Meta */}
                <div className="text-xs space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-600">
                  <div className="flex justify-between">
                    <span>Floor Level:</span>
                    <strong className="text-slate-800">{activeProfileRoom.floor}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Standard Tariff:</span>
                    <strong className="text-slate-800">₹{(activeProfileRoom?.price || 0).toLocaleString('en-IN')}.00 / night</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Cleanliness State:</span>
                    <strong className="text-emerald-700">Sanitized & Inspected</strong>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setActiveProfileRoom(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
