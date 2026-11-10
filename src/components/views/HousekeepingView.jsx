import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Building, 
  ArrowLeft, 
  RotateCcw, 
  SlidersHorizontal, 
  Calendar, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Bed, 
  Zap, 
  Snowflake, 
  Wifi, 
  FileText, 
  RefreshCw, 
  Check, 
  X, 
  Grid, 
  Layers,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';

// Exact 7-day strip from Screenshots 1 & 2
const WEEK_DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return {
    date: `${dd}-${mm}-${yyyy}`,
    day: dayNames[d.getDay()],
    isToday: i === 0
  };
});

export default function HousekeepingView() {
  const { 
    navigateTo, 
    showNotification, 
    rooms: contextRooms = [], 
    updateRoomStatus, 
    setIsCreateRoomModalOpen 
  } = useDashboard();

  const [deviceOverrides, setDeviceOverrides] = useState({});
  const [selectedDate, setSelectedDate] = useState(WEEK_DAYS[0].date);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Floor accordion open/collapse state
  const [openFloors, setOpenFloors] = useState({
    GF: true,
    '1st': true,
    '2nd': true,
    '3rd': true,
    '4th': true
  });

  // Slide-over drawer state
  const [selectedRoomProfile, setSelectedRoomProfile] = useState(null);

  // Modals state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedFloorDetail, setSelectedFloorDetail] = useState(null);
  const [isGrcModalOpen, setIsGrcModalOpen] = useState(false);

  // Status modal form state
  const [statusChangeRoomId, setStatusChangeRoomId] = useState('');
  const [newStatusValue, setNewStatusValue] = useState('VACANT READY');

  // Category modal form state
  const [categoryChangeRoomId, setCategoryChangeRoomId] = useState('');
  const [newCategoryValue, setNewCategoryValue] = useState('Standard Room');

  // Build floors dynamically from contextRooms
  const floors = useMemo(() => {
    if (!contextRooms || contextRooms.length === 0) return [];
    const grouped = {};
    contextRooms.forEach(r => {
      const fKey = r.floor || 'Ground Floor';
      if (!grouped[fKey]) {
        grouped[fKey] = [];
      }
      const dev = deviceOverrides[String(r.roomNumber)] || {};
      grouped[fKey].push({
        id: String(r.roomNumber),
        name: `Room ${r.roomNumber}`,
        seq: String(r.roomNumber),
        category: (r.type || 'Standard Room').toUpperCase(),
        status: (r.status || 'VACANT READY').replace('_', ' ').toUpperCase(),
        floor: fKey,
        bed: r.bed || 'King',
        price: r.price || 2500,
        power: dev.power !== undefined ? dev.power : true,
        ac: dev.ac !== undefined ? dev.ac : true,
        wifi: dev.wifi !== undefined ? dev.wifi : true
      });
    });

    return Object.keys(grouped).map(floorKey => ({
      floorId: floorKey,
      floorName: floorKey,
      rooms: grouped[floorKey]
    }));
  }, [contextRooms, deviceOverrides]);

  const toggleFloor = (floorId) => {
    setOpenFloors(prev => ({
      ...prev,
      [floorId]: !prev[floorId]
    }));
  };

  const handleOpenRoomProfile = (room) => {
    setSelectedRoomProfile({ ...room });
  };

  const handleToggleDevice = (device) => {
    if (!selectedRoomProfile) return;
    const newVal = !selectedRoomProfile[device];
    const updated = {
      ...selectedRoomProfile,
      [device]: newVal
    };
    setSelectedRoomProfile(updated);
    
    setDeviceOverrides(prev => ({
      ...prev,
      [selectedRoomProfile.id]: {
        ...(prev[selectedRoomProfile.id] || {}),
        [device]: newVal
      }
    }));

    showNotification(`${device.toUpperCase()} set to ${newVal ? 'ON' : 'OFF'} in ${selectedRoomProfile.name}`);
  };

  const handleApplyStatusChange = () => {
    if (!statusChangeRoomId) {
      showNotification('Please select a room to update status.');
      return;
    }

    if (updateRoomStatus) {
      updateRoomStatus(statusChangeRoomId, newStatusValue);
    }

    if (selectedRoomProfile && (selectedRoomProfile.id === statusChangeRoomId || selectedRoomProfile.name === statusChangeRoomId)) {
      setSelectedRoomProfile(prev => ({ ...prev, status: newStatusValue }));
    }

    setIsStatusModalOpen(false);
  };

  const handleApplyCategoryChange = () => {
    if (!categoryChangeRoomId) {
      showNotification('Please select a room.');
      return;
    }

    if (selectedRoomProfile && (selectedRoomProfile.id === categoryChangeRoomId || selectedRoomProfile.name === categoryChangeRoomId)) {
      setSelectedRoomProfile(prev => ({ ...prev, category: newCategoryValue.toUpperCase() }));
    }

    showNotification(`Room category changed to ${newCategoryValue}`);
    setIsCategoryModalOpen(false);
  };

  // Filtered floors & rooms
  const filteredFloors = useMemo(() => {
    if (!searchQuery.trim()) return floors;
    const q = searchQuery.toLowerCase();
    return floors.map(floor => ({
      ...floor,
      rooms: floor.rooms.filter(r => 
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.seq.includes(q)
      )
    })).filter(floor => floor.rooms.length > 0);
  }, [floors, searchQuery]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* 1. Breadcrumb (Exact match with Screenshot 1) */}
      <div className="flex items-center space-x-1.5 text-xs text-slate-500 pb-1 border-b border-slate-200">
        <span 
          onClick={() => navigateTo('master-service-home')}
          className="hover:text-slate-900 cursor-pointer transition flex items-center gap-1"
        >
          🏠 Home
        </span>
        <span>/</span>
        <span className="font-semibold text-slate-900">
          Manage Room
        </span>
      </div>

      {/* 2. Sub-Tab Pill (Screenshot 1: Room Grid) */}
      <div className="flex items-center space-x-2">
        <button
          className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0e4860] text-white shadow-xs"
        >
          <Grid className="w-4 h-4" />
          <span>Room Grid</span>
        </button>
      </div>

      {/* 3. Weekly View Header Row (Screenshot 1) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Back button & Title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigateTo('front-office')}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Weekly View
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Room status, occupancy, and operational readiness
              </p>
            </div>
          </div>

          {/* Top Right Action Buttons (Screenshot 1) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setStatusChangeRoomId(floors[0]?.rooms[0]?.id || '');
                setIsStatusModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold shadow-2xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Room Status Change</span>
            </button>

            <button
              onClick={() => {
                setCategoryChangeRoomId(floors[0]?.rooms[0]?.id || '');
                setIsCategoryModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold shadow-2xs transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Room Category Change</span>
            </button>

            <button
              onClick={() => {
                setSelectedDate(WEEK_DAYS[0].date);
                showNotification(`Switched to Today's View (${WEEK_DAYS[0].date})`);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Today's View</span>
            </button>
          </div>

        </div>

        {/* Date Picker & Search Input Bar (Screenshot 1) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 border-t border-slate-100">
          <div className="relative w-44">
            <input
              type="text"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
            />
          </div>
        </div>

        {/* 4. 7-Day Week Columns Header Strip */}
        <div className="grid grid-cols-7 gap-2 text-center select-none pt-1">
          {WEEK_DAYS.map((dayItem) => {
            const isSelected = selectedDate === dayItem.date;
            return (
              <div
                key={dayItem.date}
                onClick={() => {
                  setSelectedDate(dayItem.date);
                  showNotification(`Housekeeping schedule view for ${dayItem.date} (${dayItem.day})`);
                }}
                className={`rounded-xl border p-2.5 shadow-2xs transition cursor-pointer ${
                  isSelected 
                    ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-400/40' 
                    : dayItem.isToday
                    ? 'bg-white border-slate-300 ring-1 ring-sky-300 hover:bg-slate-50'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`text-[11px] font-bold ${isSelected ? 'text-sky-700' : 'text-slate-500'}`}>
                  {dayItem.date}
                </div>
                <div className={`text-xs font-black mt-0.5 tracking-wider ${isSelected ? 'text-[#0e4860]' : 'text-slate-900'}`}>
                  {dayItem.day} {dayItem.isToday && <span className="text-[10px] text-sky-600">(Today)</span>}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* 5. Floors Accordion List */}
      <div className="space-y-3">
        {filteredFloors.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Rooms in Housekeeping</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No rooms have been added yet. Click Add Room to configure your inventory and track housekeeping operations.
            </p>
            <button
              onClick={() => setIsCreateRoomModalOpen(true)}
              className="mt-4 px-4 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold transition shadow-2xs"
            >
              + Add Room
            </button>
          </div>
        ) : (
          filteredFloors.map((floor) => {
          const isOpen = openFloors[floor.floorId];
          const cleanCount = floor.rooms.filter(r => r.status === 'VACANT READY' || r.status === 'CLEAN' || r.status === 'AVAILABLE').length;
          const occCount = floor.rooms.filter(r => r.status === 'OCCUPIED').length;
          const dirtyCount = floor.rooms.filter(r => r.status === 'DIRTY').length;
          const maintCount = floor.rooms.filter(r => r.status === 'MAINTENANCE').length;

          return (
            <div 
              key={floor.floorId}
              className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden"
            >
              {/* Floor Header Bar */}
              <div 
                onClick={() => toggleFloor(floor.floorId)}
                className="px-4 py-3 bg-slate-50/60 hover:bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between cursor-pointer transition select-none"
              >
                <div className="flex items-center space-x-2.5 text-xs">
                  <div className="text-slate-400">
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <Building className="w-4 h-4 text-slate-600" />
                  <span className="font-extrabold text-slate-900">
                    Floor: {floor.floorId}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-600 font-medium">
                    {floor.floorName}
                  </span>
                </div>

                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  <span className="bg-sky-100 text-sky-800 font-bold px-2.5 py-0.5 rounded-lg text-xs">
                    {floor.rooms.length} {floor.rooms.length === 1 ? 'Room' : 'Rooms'}
                  </span>
                  {cleanCount > 0 && (
                    <span className="hidden sm:inline bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[11px]">
                      {cleanCount} Clean
                    </span>
                  )}
                  {dirtyCount > 0 && (
                    <span className="hidden sm:inline bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md text-[11px]">
                      {dirtyCount} Dirty
                    </span>
                  )}
                  {occCount > 0 && (
                    <span className="hidden sm:inline bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md text-[11px]">
                      {occCount} Occupied
                    </span>
                  )}

                  <button
                    onClick={() => setSelectedFloorDetail(floor)}
                    className="flex items-center space-x-1 px-3 py-1 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold transition shadow-2xs ml-1"
                  >
                    <span>Floor Detail</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dynamic Room Grid (Each Physical Room Displayed Exactly Once) */}
              {isOpen && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                  {floor.rooms.map((room) => {
                    const isVacantReady = room.status === 'VACANT READY' || room.status === 'AVAILABLE' || room.status === 'CLEAN';
                    const isOccupied = room.status === 'OCCUPIED';
                    const isDirty = room.status === 'DIRTY';
                    const isMaintenance = room.status === 'MAINTENANCE';

                    return (
                      <div
                        key={room.id}
                        onClick={() => handleOpenRoomProfile(room)}
                        className={`rounded-2xl p-4 text-center space-y-3 cursor-pointer transition transform hover:-translate-y-1 hover:shadow-lg border-2 ${
                          isVacantReady 
                            ? 'border-emerald-500 bg-white hover:bg-emerald-50/20 shadow-xs' 
                            : isOccupied
                            ? 'border-rose-500 bg-white hover:bg-rose-50/20 shadow-xs'
                            : isDirty
                            ? 'border-amber-500 bg-white hover:bg-amber-50/20 shadow-xs'
                            : 'border-slate-400 bg-white hover:bg-slate-50 shadow-xs'
                        }`}
                      >
                        {/* Category Header & Sequence */}
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 border-b border-slate-100 pb-2">
                          <span className="uppercase tracking-wider text-slate-600 truncate max-w-[130px]" title={room.category}>
                            {room.category}
                          </span>
                          <span className="text-slate-400 font-mono">
                            Seq: {room.seq}
                          </span>
                        </div>

                        {/* Room Badge Pill with Bed icon */}
                        <div className="py-1">
                          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-50 shadow-2xs font-extrabold text-sm text-slate-800">
                            <span>{room.name}</span>
                            <span className="text-slate-300">|</span>
                            <Bed className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-xs font-semibold text-slate-600">{room.bed}</span>
                          </div>
                        </div>

                        {/* Status Pill */}
                        <div>
                          <span className={`inline-block font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider text-white shadow-2xs ${
                            isVacantReady 
                              ? 'bg-emerald-600' 
                              : isOccupied
                              ? 'bg-rose-600'
                              : isDirty
                              ? 'bg-amber-600'
                              : 'bg-slate-600'
                          }`}>
                            ● {room.status}
                          </span>
                        </div>

                        {/* Quick Status Buttons & Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button
                              title="Mark Clean / Ready"
                              onClick={() => updateRoomStatus(room.id, 'VACANT READY')}
                              className={`p-1.5 rounded-md border text-[10px] font-bold transition ${
                                isVacantReady
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                  : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                              }`}
                            >
                              Ready
                            </button>
                            <button
                              title="Mark Dirty / In-Service"
                              onClick={() => updateRoomStatus(room.id, 'DIRTY')}
                              className={`p-1.5 rounded-md border text-[10px] font-bold transition ${
                                isDirty
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                  : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                              }`}
                            >
                              Dirty
                            </button>
                            <button
                              title="Mark Occupied"
                              onClick={() => updateRoomStatus(room.id, 'OCCUPIED')}
                              className={`p-1.5 rounded-md border text-[10px] font-bold transition ${
                                isOccupied
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                  : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                              }`}
                            >
                              Occ
                            </button>
                          </div>

                          <button
                            onClick={() => handleOpenRoomProfile(room)}
                            className="px-2.5 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-md text-[10.5px] font-bold shadow-2xs transition"
                          >
                            ACTIONS
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          );
        }))}
      </div>

      {/* 6. SLIDE-OVER DRAWER: ROOM PROFILE (Exact Screenshot 3) */}
      {selectedRoomProfile && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setSelectedRoomProfile(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity duration-300"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-slate-50 border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              
              {/* Drawer Header (Exact Screenshot 3: Dark Teal Background) */}
              <div className="bg-[#0e4860] text-white p-5 flex items-center space-x-3.5 shrink-0">
                <button
                  onClick={() => setSelectedRoomProfile(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                  title="Close profile"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-sky-200">
                    ROOM PROFILE
                  </div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                    {selectedRoomProfile.name}
                  </h2>
                </div>
              </div>

              {/* Drawer Body (Screenshot 3) */}
              <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                
                {/* Room Info Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
                  
                  {/* Title & Badges */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-base">
                      {selectedRoomProfile.name}
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                        <span>▲</span>
                        <span>{selectedRoomProfile.category === 'DAYTRIP' ? 'DayTrip' : selectedRoomProfile.category}</span>
                      </span>

                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                        <Bed className="w-3.5 h-3.5" />
                        <span>{selectedRoomProfile.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Quick Actions (Screenshot 3) */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800">
                      Quick Actions
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setIsGrcModalOpen(true)}
                        className="p-3 bg-sky-50/50 hover:bg-sky-50 border border-sky-100 rounded-xl text-center space-y-1.5 transition flex flex-col items-center justify-center group"
                      >
                        <FileText className="w-5 h-5 text-sky-700 group-hover:scale-110 transition" />
                        <span className="text-xs font-bold text-slate-800">GRC Form</span>
                      </button>

                      <button
                        onClick={() => {
                          setStatusChangeRoomId(selectedRoomProfile.id);
                          setNewStatusValue(selectedRoomProfile.status);
                          setIsStatusModalOpen(true);
                        }}
                        className="p-3 bg-sky-50/50 hover:bg-sky-50 border border-sky-100 rounded-xl text-center space-y-1.5 transition flex flex-col items-center justify-center group"
                      >
                        <RefreshCw className="w-5 h-5 text-sky-700 group-hover:scale-110 transition" />
                        <span className="text-xs font-bold text-slate-800">Room Status</span>
                      </button>
                    </div>
                  </div>

                  {/* Control Section / IoT (Screenshot 3) */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div>
                      <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0e4860] text-white rounded-lg text-xs font-bold shadow-2xs">
                        <span>☁</span>
                        <span>Control</span>
                      </button>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3.5 space-y-3 bg-white text-xs">
                      
                      {/* Electricity Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 font-bold text-slate-800">
                          <Zap className="w-4 h-4 text-sky-600" />
                          <span>Electricity</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleDevice('electricity')}
                          className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                            selectedRoomProfile.electricity ? 'bg-[#0e4860]' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                              selectedRoomProfile.electricity ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Air Conditioner Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 font-bold text-slate-800">
                          <Snowflake className="w-4 h-4 text-sky-600" />
                          <span>Air Conditioner</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleDevice('ac')}
                          className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                            selectedRoomProfile.ac ? 'bg-[#0e4860]' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                              selectedRoomProfile.ac ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Wi-Fi Status / Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 font-bold text-slate-800">
                          <Wifi className="w-4 h-4 text-sky-600" />
                          <span>Wi-Fi</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${
                            selectedRoomProfile.wifi 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}>
                            {selectedRoomProfile.wifi ? 'Active' : 'Disabled'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleDevice('wifi')}
                            className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                              selectedRoomProfile.wifi ? 'bg-[#0e4860]' : 'bg-slate-300'
                            }`}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                selectedRoomProfile.wifi ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setSelectedRoomProfile(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
                >
                  Close Profile
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 7. ROOM STATUS CHANGE MODAL */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#0e4860] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-bold text-base">Room Status Change</h3>
              </div>
              <button 
                onClick={() => setIsStatusModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Select Room
                </label>
                <select
                  value={statusChangeRoomId}
                  onChange={(e) => setStatusChangeRoomId(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  {floors.flatMap(f => f.rooms).map(rm => (
                    <option key={rm.id} value={rm.id}>
                      {rm.name} ({rm.category}) - Current: {rm.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  New Status
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {['VACANT READY', 'OCCUPIED', 'DIRTY', 'MAINTENANCE'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatusValue(st)}
                      className={`p-2.5 rounded-lg border text-left font-bold transition text-xs ${
                        newStatusValue === st 
                          ? 'border-[#0e4860] bg-sky-50 text-[#0e4860] ring-1 ring-[#0e4860]' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyStatusChange}
                className="px-4 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold"
              >
                Apply Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. ROOM CATEGORY CHANGE MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#0e4860] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5" />
                <h3 className="font-bold text-base">Room Category Change</h3>
              </div>
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Select Room
                </label>
                <select
                  value={categoryChangeRoomId}
                  onChange={(e) => setCategoryChangeRoomId(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  {floors.flatMap(f => f.rooms).map(rm => (
                    <option key={rm.id} value={rm.id}>
                      {rm.name} - Current: {rm.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  New Category
                </label>
                <select
                  value={newCategoryValue}
                  onChange={(e) => setNewCategoryValue(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Standard Room">Standard Room</option>
                  <option value="Deluxe Room">Deluxe Room</option>
                  <option value="Super Deluxe Room">Super Deluxe Room</option>
                  <option value="Suite Room">Suite Room</option>
                  <option value="Banquet Hall">Banquet Hall</option>
                  <option value="DayTrip">DayTrip</option>
                </select>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCategoryChange}
                className="px-4 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold"
              >
                Update Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. FLOOR DETAIL POPUP MODAL */}
      {selectedFloorDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-[#0e4860] text-white flex items-center justify-between">
              <div className="font-bold text-sm">
                Floor Details: {selectedFloorDetail.floorName} ({selectedFloorDetail.floorId})
              </div>
              <button 
                onClick={() => setSelectedFloorDetail(null)}
                className="text-white/80 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Total Operational Units:</span>
                <span className="font-bold text-slate-900">{selectedFloorDetail.rooms.length} Units</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-emerald-700">
                <span>Vacant Ready:</span>
                <span className="font-bold">
                  {selectedFloorDetail.rooms.filter(r => r.status === 'VACANT READY').length}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2 text-rose-700">
                <span>Occupied:</span>
                <span className="font-bold">
                  {selectedFloorDetail.rooms.filter(r => r.status === 'OCCUPIED').length}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2 text-amber-700">
                <span>Dirty / In-Service:</span>
                <span className="font-bold">
                  {selectedFloorDetail.rooms.filter(r => r.status === 'DIRTY').length}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Maintenance (OOO):</span>
                <span className="font-bold">
                  {selectedFloorDetail.rooms.filter(r => r.status === 'MAINTENANCE').length}
                </span>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedFloorDetail(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. GRC FORM MODAL (triggered from Room Profile) */}
      {isGrcModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Guest Registration Card (GRC)</h3>
                <p className="text-xs text-slate-500">Room: {selectedRoomProfile?.name} ({selectedRoomProfile?.category})</p>
              </div>
              <button
                onClick={() => setIsGrcModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700">Property:</span>
                <span className="text-slate-900 font-semibold">AuraStay Suite</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700">Room Name:</span>
                <span className="text-slate-900 font-semibold">{selectedRoomProfile?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700">Category:</span>
                <span className="text-slate-900 font-semibold">{selectedRoomProfile?.category}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700">Status:</span>
                <span className="text-emerald-700 font-bold">{selectedRoomProfile?.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Statutory KYC:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mandatory on Arrival
                </span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => {
                  showNotification(`Printing GRC card for ${selectedRoomProfile?.name}...`);
                  setIsGrcModalOpen(false);
                }}
                className="flex-1 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official GRC</span>
              </button>
              <button
                onClick={() => setIsGrcModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
