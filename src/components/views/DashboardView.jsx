import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  Search,
  Filter,
  Plus,
  Moon,
  ClipboardList,
  BedDouble,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  User,
  Phone,
  Calendar,
  CreditCard,
  Receipt,
  ArrowRight,
  ShieldAlert,
  Wrench,
  Check,
  RefreshCw,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Star,
  DollarSign,
  Utensils,
  Trash2,
  FileText
} from 'lucide-react';

import ShiftRoomModal from '../modals/ShiftRoomModal';
import ExtendStayModal from '../modals/ExtendStayModal';
import QuickBalanceModal from '../modals/QuickBalanceModal';
import Guest360Modal from '../modals/Guest360Modal';
import FolioBillingModal from '../modals/FolioBillingModal';
import NightAuditModal from '../modals/NightAuditModal';
import BlockRoomModal from '../modals/BlockRoomModal';
import FrontDeskTasksDrawer from '../modals/FrontDeskTasksDrawer';
import RoomActionsModal from '../modals/RoomActionsModal';
import TodayGlanceRevenueCard from '../dashboard/TodayGlanceRevenueCard';

export default function DashboardView() {
  const {
    rooms = [],
    reservations = [],
    workingDate,
    showNotification,
    setIsCreateReservationModalOpen,
    setIsCreateRoomModalOpen,
    requestDeleteRoom,
    updateHousekeepingCleanliness,
    checkoutRoom,
    frontDeskTasks = []
  } = useDashboard();

  // Active filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | OCCUPIED | VACANT | DIRTY | BLOCKED
  const [viewDensity, setViewDensity] = useState('3D'); // '3D' | 'COMPACT'

  // Accordion collapsed state
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Room Actions Modal State
  const [actionModalRoom, setActionModalRoom] = useState(null);

  // Modal active targets
  const [modalRoom, setModalRoom] = useState(null);
  const [modalRes, setModalRes] = useState(null);

  // Modals Visibility
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isQuickBalanceOpen, setIsQuickBalanceOpen] = useState(false);
  const [isGuest360Open, setIsGuest360Open] = useState(false);
  const [isFolioModalOpen, setIsFolioModalOpen] = useState(false);
  const [isNightAuditOpen, setIsNightAuditOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isTasksDrawerOpen, setIsTasksDrawerOpen] = useState(false);



  // Helper to find active reservation for a room
  const getActiveReservation = (room) => {
    const rNum = String(room.room_number || room.roomNumber || room.number || room.id);
    return reservations.find(r => {
      if (r.status === 'CANCELLED' || r.status === 'CHECKED_OUT') return false;
      const matchNum = String(r.room).match(/\b(\d+)\b/);
      if (matchNum && matchNum[1] === rNum) return true;
      if (String(r.room_number) === rNum) return true;
      if (room.booking_id && String(r.id) === String(room.booking_id)) return true;
      return false;
    });
  };

  // Enriched rooms list
  const enrichedRooms = useMemo(() => {
    return rooms.map(r => {
      const activeRes = getActiveReservation(r);
      const isOccupied = r.status === 'OCCUPIED' || r.status === 'Occupied' || !!activeRes;
      const isBlocked = r.status === 'MAINTENANCE' || r.status === 'Blocked';
      const isDirty = r.status === 'DIRTY' || r.housekeeping === 'Dirty';

      let effectiveStatus = 'VACANT';
      if (isOccupied) effectiveStatus = 'OCCUPIED';
      else if (isBlocked) effectiveStatus = 'BLOCKED';
      else if (isDirty) effectiveStatus = 'DIRTY';

      const roomNum = String(r.room_number || r.roomNumber || r.id);
      const floor = r.floor ? (String(r.floor).startsWith('Floor') ? r.floor : `Floor ${r.floor}`) : 'Floor 1';
      const category = r.type || r.category || 'Standard Room';

      return {
        ...r,
        roomNumber: roomNum,
        category,
        floor,
        effectiveStatus,
        activeReservation: activeRes,
        guestName: activeRes?.guest || activeRes?.name || r.guest || (isOccupied ? 'In-House Guest' : null),
        stayDates: activeRes ? `${activeRes.check_in || 'Today'} → ${activeRes.check_out || 'Tomorrow'}` : null,
        tariff: Number(r.price || r.tariff || activeRes?.price || 2500),
        balanceDue: activeRes ? Math.max(0, (Number(activeRes.amount) || 4500) - (Number(activeRes.paid) || 0)) : 0
      };
    });
  }, [rooms, reservations]);

  // Dynamic filter options
  const uniqueFloors = useMemo(() => {
    const set = new Set(enrichedRooms.map(r => r.floor).filter(Boolean));
    return ['ALL', ...Array.from(set).sort()];
  }, [enrichedRooms]);

  const uniqueCategories = useMemo(() => {
    const set = new Set(enrichedRooms.map(r => r.category).filter(Boolean));
    return ['ALL', ...Array.from(set).sort()];
  }, [enrichedRooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return enrichedRooms.filter(r => {
      // Floor filter
      if (selectedFloor !== 'ALL' && r.floor !== selectedFloor) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;

      // Status filter
      if (statusFilter !== 'ALL' && r.effectiveStatus !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNum = r.roomNumber.toLowerCase().includes(q);
        const matchesGuest = r.guestName && r.guestName.toLowerCase().includes(q);
        const matchesCat = r.category.toLowerCase().includes(q);
        if (!matchesNum && !matchesGuest && !matchesCat) return false;
      }

      return true;
    });
  }, [enrichedRooms, selectedFloor, selectedCategory, statusFilter, searchQuery]);

  // Group rooms by category
  const groupedRooms = useMemo(() => {
    const groups = {};
    filteredRooms.forEach(room => {
      const cat = room.category || 'Standard Room';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(room);
    });
    return groups;
  }, [filteredRooms]);

  // Top KPI calculations
  const totalCount = enrichedRooms.length;
  const occupiedCount = enrichedRooms.filter(r => r.effectiveStatus === 'OCCUPIED').length;
  const vacantCount = enrichedRooms.filter(r => r.effectiveStatus === 'VACANT').length;
  const blockedCount = enrichedRooms.filter(r => r.effectiveStatus === 'BLOCKED').length;
  const dirtyCount = enrichedRooms.filter(r => r.effectiveStatus === 'DIRTY').length;

  const occupancyRate = totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0;
  const totalRevenue = enrichedRooms
    .filter(r => r.effectiveStatus === 'OCCUPIED')
    .reduce((sum, r) => sum + r.tariff, 0);

  const pendingTasksCount = frontDeskTasks.filter(t => !t.completed).length;

  // Toggle category accordion
  const toggleCategory = (cat) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Quick Action Handler for Room
  const handleRoomAction = (room, action) => {
    setActionModalRoom(null);
    setModalRoom(room);
    setModalRes(room.activeReservation || null);

    switch (action) {
      case 'shift':
        setIsShiftModalOpen(true);
        break;
      case 'extend':
        setIsExtendModalOpen(true);
        break;
      case 'balance':
        setIsQuickBalanceOpen(true);
        break;
      case 'guest360':
        setIsGuest360Open(true);
        break;
      case 'folio':
        setIsFolioModalOpen(true);
        break;
      case 'block':
        setIsBlockModalOpen(true);
        break;
      case 'clean':
        updateHousekeepingCleanliness(room.roomNumber, 'VACANT_READY');
        break;
      case 'dirty':
        updateHousekeepingCleanliness(room.roomNumber, 'DIRTY');
        break;
      case 'checkout':
        checkoutRoom(room.roomNumber, room.activeReservation?.id || room.booking_id);
        break;
      case 'book':
        setIsCreateReservationModalOpen(true);
        break;
      case 'delete':
        requestDeleteRoom(room.id || room.roomNumber);
        break;
      case 'fnb':
        showNotification(`Digital Room Service Menu link copied for Room #${room.roomNumber}. Sent to guest via SMS/WhatsApp.`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-3xl p-5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-200/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Live Room Overview & Front Desk Matrix</h1>
            <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>LIVE SYSTEM</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            DEMO HOTEL Operational PMS • Real-time room status, reservation synchronization, and guest billing ledger
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Working Date & Night Audit */}
          <button
            onClick={() => setIsNightAuditOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:to-indigo-900 text-white text-xs font-bold shadow-md shadow-indigo-950/20 flex items-center space-x-2 transition-all hover:scale-[1.02]"
          >
            <Moon className="w-4 h-4 text-indigo-300" />
            <span>Night Audit ({workingDate})</span>
          </button>

          {/* Front Desk Tasks Drawer */}
          <button
            onClick={() => setIsTasksDrawerOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs flex items-center space-x-2 transition-all"
          >
            <ClipboardList className="w-4 h-4 text-amber-600" />
            <span>Shift Tasks</span>
            {pendingTasksCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">
                {pendingTasksCount}
              </span>
            )}
          </button>

          {/* New Reservation */}
          <button
            onClick={() => setIsCreateReservationModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center space-x-1.5 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Stat Counters (Modern Light 3D Theme Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">

        {/* Total Rooms */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer bg-white rounded-3xl p-4 border transition-all duration-300 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_15px_30px_-8px_rgba(0,0,0,0.08)] ${statusFilter === 'ALL' ? 'ring-2 ring-indigo-900 border-indigo-900' : 'border-slate-200/80 hover:border-slate-300'
            }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Rooms</span>
            <BedDouble className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono">{totalCount}</span>
            <span className="text-[11px] font-bold text-slate-500">{occupancyRate}% Occ.</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${occupancyRate}%` }}></div>
          </div>
        </div>

        {/* Occupied Rooms (Soft Indigo Glow) */}
        <div
          onClick={() => setStatusFilter('OCCUPIED')}
          className={`cursor-pointer bg-white rounded-3xl p-4 border transition-all duration-300 shadow-[0_10px_25px_-5px_rgba(99,102,241,0.08)] hover:-translate-y-1 hover:shadow-[0_15px_30px_-8px_rgba(99,102,241,0.15)] ${statusFilter === 'OCCUPIED' ? 'ring-2 ring-indigo-600 border-indigo-600' : 'border-indigo-100 hover:border-indigo-300'
            }`}
        >
          <div className="flex items-center justify-between text-indigo-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Occupied</span>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50"></span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-900 font-mono">{occupiedCount}</span>
            <span className="text-[11px] font-bold text-indigo-600">In-House</span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-2">₹{totalRevenue.toLocaleString('en-IN')} Day Revenue</p>
        </div>

        {/* Vacant Rooms (Soft Emerald Mint Glow) */}
        <div
          onClick={() => setStatusFilter('VACANT')}
          className={`cursor-pointer bg-white rounded-3xl p-4 border transition-all duration-300 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.08)] hover:-translate-y-1 hover:shadow-[0_15px_30px_-8px_rgba(16,185,129,0.15)] ${statusFilter === 'VACANT' ? 'ring-2 ring-emerald-600 border-emerald-600' : 'border-emerald-100 hover:border-emerald-300'
            }`}
        >
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[10px] font-black uppercase tracking-wider">Vacant Clean</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-900 font-mono">{vacantCount}</span>
            <span className="text-[11px] font-bold text-emerald-700">Ready</span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-2">Available for Walk-ins</p>
        </div>

        {/* Dirty / Turnover (Soft Amber Honey Glow) */}
        <div
          onClick={() => setStatusFilter('DIRTY')}
          className={`cursor-pointer bg-white rounded-3xl p-4 border transition-all duration-300 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.08)] hover:-translate-y-1 hover:shadow-[0_15px_30px_-8px_rgba(245,158,11,0.15)] ${statusFilter === 'DIRTY' ? 'ring-2 ring-amber-600 border-amber-600' : 'border-amber-100 hover:border-amber-300'
            }`}
        >
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[10px] font-black uppercase tracking-wider">Dirty Turnover</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-900 font-mono">{dirtyCount}</span>
            <span className="text-[11px] font-bold text-amber-700">Needs Cleaning</span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-2">Housekeeping Queue</p>
        </div>

        {/* Blocked / Maintenance (Soft Rose Crimson Glow) */}
        <div
          onClick={() => setStatusFilter('BLOCKED')}
          className={`cursor-pointer bg-white rounded-3xl p-4 border transition-all duration-300 shadow-[0_10px_25px_-5px_rgba(244,63,94,0.08)] hover:-translate-y-1 hover:shadow-[0_15px_30px_-8px_rgba(244,63,94,0.15)] ${statusFilter === 'BLOCKED' ? 'ring-2 ring-rose-600 border-rose-600' : 'border-rose-100 hover:border-rose-300'
            }`}
        >
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-[10px] font-black uppercase tracking-wider">Out of Order</span>
            <Wrench className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-900 font-mono">{blockedCount}</span>
            <span className="text-[11px] font-bold text-rose-700">Blocked</span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-2">Under Maintenance</p>
        </div>

        {/* Expected Departures / Checkouts */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Due Checkouts</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {enrichedRooms.filter(r => r.effectiveStatus === 'OCCUPIED').slice(0, 3).length}
            </span>
            <span className="text-[11px] font-bold text-slate-500">Departing</span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-2">Pending Bill Settlement</p>
        </div>

      </div>

      {/* 3. Filter & Control Bar */}
      <div className="bg-white rounded-3xl p-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)] border border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-3">

        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search room number, guest name, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-900/10 focus:border-indigo-900 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Floor Selector, Category Selector, Density Toggle */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Floor selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs">
            <span className="text-slate-400 font-bold text-[10px] uppercase">Floor:</span>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer text-xs"
            >
              {uniqueFloors.map(fl => (
                <option key={fl} value={fl}>{fl === 'ALL' ? 'All Floors' : fl}</option>
              ))}
            </select>
          </div>

          {/* Category selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs">
            <span className="text-slate-400 font-bold text-[10px] uppercase">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer text-xs max-w-[150px] truncate"
            >
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat === 'ALL' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>

          {/* Density Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewDensity('3D')}
              title="3D Card View"
              className={`p-1.5 rounded-xl transition-all ${viewDensity === '3D' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewDensity('COMPACT')}
              title="Compact Matrix View"
              className={`p-1.5 rounded-xl transition-all ${viewDensity === 'COMPACT' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Reset Filters button if active */}
          {(statusFilter !== 'ALL' || selectedFloor !== 'ALL' || selectedCategory !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSelectedFloor('ALL');
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all"
            >
              Reset Filters
            </button>
          )}

        </div>
      </div>

      {/* 4. Room Categories & 3D Cards */}
      <div className="space-y-6">
        {Object.keys(groupedRooms).length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <BedDouble className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No rooms match your filter criteria</h3>
            <p className="text-xs text-slate-500">Try adjusting your search terms or filter selection.</p>
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSelectedFloor('ALL');
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-indigo-900 text-white font-bold text-xs"
            >
              Show All Rooms
            </button>
          </div>
        ) : (
          Object.entries(groupedRooms).map(([category, roomsList]) => {
            const isCollapsed = collapsedCategories[category];
            const catOccupied = roomsList.filter(r => r.effectiveStatus === 'OCCUPIED').length;
            const catTotal = roomsList.length;

            return (
              <div key={category} className="space-y-3">
                {/* Category Accordion Header */}
                <div
                  onClick={() => toggleCategory(category)}
                  className="cursor-pointer bg-white/80 hover:bg-white rounded-2xl px-5 py-3 border border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex items-center justify-between transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#b4832c]"></div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">{category}</h3>
                    <span className="text-xs font-bold text-slate-400">
                      ({catTotal} Room{catTotal > 1 ? 's' : ''})
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {catOccupied} Occupied • {catTotal - catOccupied} Available
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400">
                    <span className="text-xs font-bold">{isCollapsed ? 'Expand' : 'Collapse'}</span>
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </div>
                </div>

                {/* Rooms Grid */}
                {!isCollapsed && (
                  <div className={
                    viewDensity === '3D'
                      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                      : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5'
                  }>
                    {roomsList.map(room => {
                      const isOccupied = room.effectiveStatus === 'OCCUPIED';
                      const isVacant = room.effectiveStatus === 'VACANT';
                      const isDirty = room.effectiveStatus === 'DIRTY';
                      const isBlocked = room.effectiveStatus === 'BLOCKED';

                      if (viewDensity === 'COMPACT') {
                        // Compact matrix box
                        return (
                          <div
                            key={room.roomNumber}
                            onClick={() => setActionModalRoom(room)}
                            className={`cursor-pointer rounded-2xl p-3 border transition-all text-center relative overflow-hidden group shadow-xs hover:shadow-md hover:-translate-y-0.5 ${isOccupied
                              ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
                              : isVacant
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                : isDirty
                                  ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                                  : 'bg-rose-50/60 border-rose-200 text-rose-950'
                              }`}
                          >
                            <p className="font-black text-lg font-mono">#{room.roomNumber}</p>
                            <p className="text-[10px] font-bold uppercase truncate mt-0.5">
                              {isOccupied ? room.guestName || 'Occupied' : isVacant ? 'Available' : isDirty ? 'Dirty' : 'Blocked'}
                            </p>
                          </div>
                        );
                      }

                      // Modern 3D Room Card View
                      return (
                        <div
                          key={room.roomNumber}
                          className={`group relative bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.06),0_8px_10px_-6px_rgba(0,0,0,0.04)] hover:-translate-y-1.5 hover:shadow-[0_20px_35px_-8px_rgba(0,0,0,0.12),0_10px_10px_-5px_rgba(0,0,0,0.04)] ${isOccupied
                            ? 'border-indigo-100 hover:border-indigo-300'
                            : isVacant
                              ? 'border-emerald-100 hover:border-emerald-300'
                              : isDirty
                                ? 'border-amber-100 hover:border-amber-300'
                                : 'border-rose-100 hover:border-rose-300'
                            }`}
                        >
                          {/* Top 3D Embossed Bar */}
                          <div className={`p-4 border-b flex items-center justify-between ${isOccupied
                            ? 'bg-gradient-to-r from-indigo-50/90 to-purple-50/50 border-indigo-100/70'
                            : isVacant
                              ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/50 border-emerald-100/70'
                              : isDirty
                                ? 'bg-gradient-to-r from-amber-50/90 to-orange-50/50 border-amber-100/70'
                                : 'bg-gradient-to-r from-rose-50/90 to-red-50/50 border-rose-100/70'
                            }`}>
                            <div className="flex items-center space-x-2">
                              {/* 3D Room Number Badge */}
                              <div className="w-10 h-10 rounded-2xl bg-white shadow-[0_4px_10px_rgba(0,0,0,0.06)] border border-slate-200/90 flex items-center justify-center font-black text-slate-900 font-mono text-base">
                                {room.roomNumber}
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">
                                  {room.floor}
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-wider mt-0.5 inline-block px-1.5 py-0.2 rounded-md ${isOccupied
                                  ? 'text-indigo-800 bg-indigo-100/70'
                                  : isVacant
                                    ? 'text-emerald-800 bg-emerald-100/70'
                                    : isDirty
                                      ? 'text-amber-800 bg-amber-100/70'
                                      : 'text-rose-800 bg-rose-100/70'
                                  }`}>
                                  {isOccupied ? 'Occupied' : isVacant ? 'Ready' : isDirty ? 'Dirty' : 'Blocked'}
                                </span>
                              </div>
                            </div>

                            {/* 3-Dot Quick Action Modal Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionModalRoom(room);
                              }}
                              className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/80 flex items-center justify-center shadow-xs transition-colors"
                              title="Room Operations & Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Middle Card Details */}
                          <div className="p-4 space-y-3 flex-1">
                            {isOccupied ? (
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-xs font-black text-slate-900 leading-snug truncate max-w-[170px]">
                                      {room.guestName}
                                    </p>
                                    <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                                      <Calendar className="w-3 h-3 text-slate-400" />
                                      <span>{room.stayDates || 'In-House'}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="pt-1 flex items-center justify-between text-xs">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Tariff:</span>
                                  <span className="font-mono font-bold text-slate-800">₹{room.tariff.toLocaleString('en-IN')}/n</span>
                                </div>

                                <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">Folio:</span>
                                  <span className={`font-mono font-black text-[11px] ${room.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                                    }`}>
                                    {room.balanceDue > 0 ? `Due ₹${room.balanceDue.toLocaleString('en-IN')}` : 'Settled ✓'}
                                  </span>
                                </div>
                              </div>
                            ) : isVacant ? (
                              <div className="space-y-2 py-1">
                                <div>
                                  <p className="text-xs font-bold text-emerald-800">Vacant & Inspected</p>
                                  <p className="text-[11px] text-slate-500">Ready for check-in</p>
                                </div>
                                <div className="bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-xl">
                                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Daily Tariff</span>
                                  <span className="text-sm font-black text-emerald-950 font-mono mt-0.5 block">
                                    ₹{room.tariff.toLocaleString('en-IN')} <span className="text-[10px] font-normal text-slate-500">/ night</span>
                                  </span>
                                </div>
                              </div>
                            ) : isDirty ? (
                              <div className="space-y-2 py-1">
                                <div>
                                  <p className="text-xs font-bold text-amber-800">Turnover Required</p>
                                  <p className="text-[11px] text-slate-500">Guest checked out</p>
                                </div>
                                <div className="bg-amber-50/70 border border-amber-100 p-2.5 rounded-xl">
                                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Housekeeping</span>
                                  <span className="text-xs font-bold text-amber-950 mt-0.5 block">
                                    Linen replacement & sanitize
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2 py-1">
                                <div>
                                  <p className="text-xs font-bold text-rose-800">Under Maintenance</p>
                                  <p className="text-[11px] text-slate-500">Room blocked</p>
                                </div>
                                <div className="bg-rose-50/70 border border-rose-100 p-2.5 rounded-xl">
                                  <span className="text-[10px] font-bold text-rose-800 uppercase block">Reason</span>
                                  <span className="text-xs font-bold text-rose-950 mt-0.5 block truncate">
                                    {room.housekeeping || 'HVAC / Maintenance'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Bottom Action Footer Button */}
                          <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                            {isOccupied ? (
                              <div className="w-full flex space-x-1.5">
                                <button
                                  onClick={() => handleRoomAction(room, 'folio')}
                                  className="flex-1 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-900 text-slate-700 text-[11px] font-bold transition-all shadow-xs flex items-center justify-center space-x-1"
                                >
                                  <Receipt className="w-3 h-3 text-indigo-600" />
                                  <span>Folio</span>
                                </button>
                                <button
                                  onClick={() => handleRoomAction(room, 'checkout')}
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-all"
                                >
                                  Checkout
                                </button>
                              </div>
                            ) : isVacant ? (
                              <button
                                onClick={() => handleRoomAction(room, 'book')}
                                className="w-full py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-[11px] font-bold transition-all shadow-xs flex items-center justify-center space-x-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Book Room</span>
                              </button>
                            ) : isDirty ? (
                              <button
                                onClick={() => handleRoomAction(room, 'clean')}
                                className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-[11px] font-bold transition-all shadow-xs flex items-center justify-center space-x-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mark Clean</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRoomAction(room, 'block')}
                                className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold transition-all shadow-xs flex items-center justify-center space-x-1"
                              >
                                <Wrench className="w-3.5 h-3.5 text-rose-300" />
                                <span>Unblock Room</span>
                              </button>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Today At A Glance Revenue & Yield Overview Card */}
      <TodayGlanceRevenueCard enrichedRooms={enrichedRooms} />

      {/* 5. Modals Mounted Dynamically */}
      <RoomActionsModal
        isOpen={!!actionModalRoom}
        onClose={() => setActionModalRoom(null)}
        room={actionModalRoom}
        onAction={handleRoomAction}
      />

      <ShiftRoomModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        sourceRoom={modalRoom}
      />

      <ExtendStayModal
        isOpen={isExtendModalOpen}
        onClose={() => setIsExtendModalOpen(false)}
        room={modalRoom}
        reservation={modalRes}
      />

      <QuickBalanceModal
        isOpen={isQuickBalanceOpen}
        onClose={() => setIsQuickBalanceOpen(false)}
        room={modalRoom}
        reservation={modalRes}
        onOpenFullFolio={(rm, res) => {
          setModalRoom(rm);
          setModalRes(res);
          setIsFolioModalOpen(true);
        }}
      />

      <Guest360Modal
        isOpen={isGuest360Open}
        onClose={() => setIsGuest360Open(false)}
        room={modalRoom}
        reservation={modalRes}
      />

      <FolioBillingModal
        isOpen={isFolioModalOpen}
        onClose={() => setIsFolioModalOpen(false)}
        room={modalRoom}
        reservation={modalRes}
      />

      <NightAuditModal
        isOpen={isNightAuditOpen}
        onClose={() => setIsNightAuditOpen(false)}
      />

      <BlockRoomModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        room={modalRoom}
      />

      <FrontDeskTasksDrawer
        isOpen={isTasksDrawerOpen}
        onClose={() => setIsTasksDrawerOpen(false)}
      />

    </div>
  );
}
