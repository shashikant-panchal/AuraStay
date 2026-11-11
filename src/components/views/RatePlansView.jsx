import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  BedDouble,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Search,
  Check,
  X,
  Coffee,
  Utensils,
  Moon,
  ShieldCheck,
  Calendar,
  Percent,
  KeyRound,
  ArrowUpRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import CreateRoomModal from '../modals/CreateRoomModal';
import CreateRoomTypeModal from '../modals/CreateRoomTypeModal';

export default function RatePlansView() {
  const {
    rooms = [],
    roomTypes = [],
    deleteRoom,
    requestDeleteRoom,
    deleteRoomType,
    updateRoomStatus,
    setIsCreateRoomModalOpen,
    setIsCreateRoomTypeModalOpen,
    isCreateRoomModalOpen,
    isCreateRoomTypeModalOpen,
    showNotification,
    navigateTo
  } = useDashboard();

  // Active Tab: 'categories' | 'rooms' | 'pricing-rules'
  const [activeTab, setActiveTab] = useState('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Dynamic Pricing State
  const [weekendMarkup, setWeekendMarkup] = useState(15);
  const [festivalMarkup, setFestivalMarkup] = useState(25);
  const [corporateDiscount, setCorporateDiscount] = useState(10);
  const [minNightsWeekend, setMinNightsWeekend] = useState(2);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const matchFloor = selectedFloor === 'ALL' || r.floor === selectedFloor;
      const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        String(r.roomNumber || r.room_number).toLowerCase().includes(q) ||
        String(r.type || '').toLowerCase().includes(q) ||
        String(r.floor || '').toLowerCase().includes(q);
      return matchFloor && matchStatus && matchSearch;
    });
  }, [rooms, selectedFloor, selectedStatus, searchQuery]);

  // Floors list
  const availableFloors = useMemo(() => {
    const s = new Set();
    rooms.forEach(r => { if (r.floor) s.add(r.floor); });
    return Array.from(s);
  }, [rooms]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      
      {/* 1. Header with Direct "+ Add Room" & "+ Add Room Type" Actions */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-2xs">
              INVENTORY & TARIFF MASTER
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Live Supabase Cloud Sync</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
            Rates, Room Types & Rooms Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Create and manage hotel room categories, individual room numbers, floor allocations, and rate plan meal tiers (EP, CP, MAP, AP).
          </p>
        </div>

        {/* Master Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsCreateRoomTypeModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 font-bold text-xs flex items-center space-x-1.5 transition shadow-xs hover:border-slate-400"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Add Room Type</span>
          </button>

          <button
            onClick={() => setIsCreateRoomModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-md shadow-[#0e4860]/20 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Room</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">TOTAL ROOM TYPES</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{roomTypes.length}</div>
          <span className="text-[11px] font-bold text-emerald-600 mt-1 block">Active on Booking Engine</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">TOTAL PHYSICAL ROOMS</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{rooms.length}</div>
          <span className="text-[11px] font-bold text-sky-700 mt-1 block">Across {availableFloors.length || 1} Floor(s)</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">STARTING BASE TARIFF</span>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
            ₹{roomTypes.length > 0 ? Math.min(...roomTypes.map(t => Number(t.basePrice) || 2000)).toLocaleString() : '0'}
          </div>
          <span className="text-[11px] font-bold text-slate-500 mt-1 block">EP Room Only</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">VACANT & READY</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {rooms.filter(r => r.status === 'VACANT_READY').length}
          </div>
          <span className="text-[11px] font-bold text-emerald-600 mt-1 block">Ready for check-in</span>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'categories'
              ? 'bg-[#0e4860] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Room Types & Plans ({roomTypes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'rooms'
              ? 'bg-[#0e4860] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BedDouble className="w-4 h-4" />
          <span>Rooms Matrix ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing-rules')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'pricing-rules'
              ? 'bg-[#0e4860] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Dynamic Pricing Rules</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ROOM TYPES & RATE PLANS */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Room Categories & Plan Tiers</h2>
              <p className="text-xs text-slate-500">Each room category carries meal plans, guest capacity, and amenities.</p>
            </div>
            <button
              onClick={() => setIsCreateRoomTypeModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Category</span>
            </button>
          </div>

          {roomTypes.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-200 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">No Room Categories Created Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Start by creating room types (e.g. Deluxe Room, Executive Suite, Family Villa). Then assign physical room numbers.
                </p>
              </div>
              <button
                onClick={() => setIsCreateRoomTypeModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs inline-flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Room Type</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {roomTypes.map(rt => {
                const base = Number(rt.basePrice) || 2000;
                const cpRate = base + 350;
                const mapRate = base + 850;
                const apRate = base + 1400;

                return (
                  <div
                    key={rt.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-md transition space-y-5"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-lg font-bold text-slate-900">{rt.name}</h3>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {rt.label || 'Room'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                          <span>🛏️ {rt.beddingType || 'King Bed'}</span>
                          <span>•</span>
                          <span>👥 Max {rt.maxAdults || 2} Adults, {rt.maxChildren || 1} Child</span>
                          {rt.areaSqft && (
                            <>
                              <span>•</span>
                              <span>📐 {rt.areaSqft} sq.ft</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (deleteRoomType) deleteRoomType(rt.id);
                            showNotification(`Removed category ${rt.name}.`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Meal Plan Tariff Tiers */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex justify-between">
                        <span>Rate Plan Tiers</span>
                        <span>Daily Tariff</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 block">EP (Room Only)</span>
                            <span className="text-[10px] text-slate-400">European Plan</span>
                          </div>
                          <span className="font-mono font-black text-slate-900">₹{base.toLocaleString()}</span>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 block">CP (with Breakfast)</span>
                            <span className="text-[10px] text-slate-400">Continental Plan</span>
                          </div>
                          <span className="font-mono font-black text-emerald-700">₹{cpRate.toLocaleString()}</span>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 block">MAP (Half Board)</span>
                            <span className="text-[10px] text-slate-400">Breakfast + Dinner</span>
                          </div>
                          <span className="font-mono font-black text-amber-700">₹{mapRate.toLocaleString()}</span>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 block">AP (Full Board)</span>
                            <span className="text-[10px] text-slate-400">All 3 Meals Included</span>
                          </div>
                          <span className="font-mono font-black text-purple-700">₹{apRate.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-medium">
                        <span>Extra Bed: ₹{rt.extraBedPrice || 800}/night</span>
                        <span>Child Surcharge: ₹{rt.childPrice || 400}/night</span>
                      </div>
                    </div>

                    {/* Amenities Pills */}
                    {rt.amenities && rt.amenities.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">Inclusions & Amenities</span>
                        <div className="flex flex-wrap gap-1.5">
                          {rt.amenities.slice(0, 5).map((am, i) => (
                            <span key={i} className="text-[10.5px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                              {am}
                            </span>
                          ))}
                          {rt.amenities.length > 5 && (
                            <span className="text-[10px] font-bold text-slate-400 self-center">
                              +{rt.amenities.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROOMS MATRIX (PHYSICAL ROOMS LIST) */}
      {/* ========================================================================= */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search rooms by number, category, or floor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="VACANT_READY">Vacant Ready</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="DIRTY">Dirty / Cleaning</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>

              <button
                onClick={() => setIsCreateRoomModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Room</span>
              </button>
            </div>
          </div>

          {filteredRooms.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-200 space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <BedDouble className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">No Hotel Rooms Added Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Add physical room numbers (e.g. 101, 102, 201) to begin managing occupancy, front-desk stays, and housekeeping.
                </p>
              </div>
              <button
                onClick={() => setIsCreateRoomModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs inline-flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Hotel Room</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredRooms.map(r => {
                const rNum = String(r.roomNumber || r.room_number);
                const isOccupied = r.status === 'OCCUPIED';
                const isDirty = r.status === 'DIRTY';
                const isVacant = r.status === 'VACANT_READY';

                return (
                  <div
                    key={r.id || rNum}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                          #{rNum}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                          {r.type || r.category || 'Standard Room'}
                        </div>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        isOccupied 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : isDirty 
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isOccupied ? 'Occupied' : isDirty ? 'Dirty' : 'Vacant'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl text-[11px] text-slate-600 space-y-1.5 border border-slate-200/60 font-medium">
                      <div className="flex justify-between">
                        <span>Floor:</span>
                        <span className="font-bold text-slate-800">{r.floor || 'Floor 1'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bedding:</span>
                        <span className="font-bold text-slate-800">{r.bed || 'King'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Base Tariff:</span>
                        <span className="font-bold text-emerald-700 font-mono">₹{r.price || 2500}/night</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                      <select
                        value={r.status || 'VACANT_READY'}
                        onChange={(e) => {
                          if (updateRoomStatus) updateRoomStatus(rNum, e.target.value);
                          showNotification(`Room #${rNum} set to ${e.target.value}`);
                        }}
                        className="text-[10.5px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none"
                      >
                        <option value="VACANT_READY">Vacant Ready</option>
                        <option value="DIRTY">Mark Dirty</option>
                        <option value="OCCUPIED">Occupied</option>
                        <option value="MAINTENANCE">Maintenance</option>
                      </select>

                      <button
                        onClick={() => {
                          if (requestDeleteRoom) requestDeleteRoom(r);
                          else if (deleteRoom) deleteRoom(r.id || rNum);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Delete Room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DYNAMIC PRICING RULES */}
      {/* ========================================================================= */}
      {activeTab === 'pricing-rules' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Dynamic Pricing & Surcharge Rules</h2>
            <p className="text-xs text-slate-500 mt-0.5">Automate weekend surge pricing, holiday markups, and corporate discounts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-950">Weekend Surge Pricing</h3>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Automatically increase base room tariffs on Friday & Saturday nights to maximize ADR during peak leisure occupancy.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs font-bold text-amber-950">Markup:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weekendMarkup}
                  onChange={(e) => setWeekendMarkup(e.target.value)}
                  className="w-20 px-3 py-1.5 rounded-xl border border-amber-300 font-bold text-xs bg-white text-center font-mono"
                />
                <span className="text-xs font-bold text-amber-950">%</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-indigo-950">Holiday & Event Markup</h3>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                Apply festival surge (Diwali, New Year, Major Expo) across all room categories automatically.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs font-bold text-indigo-950">Markup:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={festivalMarkup}
                  onChange={(e) => setFestivalMarkup(e.target.value)}
                  className="w-20 px-3 py-1.5 rounded-xl border border-indigo-300 font-bold text-xs bg-white text-center font-mono"
                />
                <span className="text-xs font-bold text-indigo-950">%</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => showNotification('Dynamic pricing rules saved successfully.')}
              className="px-5 py-2.5 rounded-xl bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs shadow-md transition"
            >
              Save Pricing Rules
            </button>
          </div>
        </div>
      )}

      {/* Render modals if triggered */}
      {isCreateRoomModalOpen && <CreateRoomModal />}
      {isCreateRoomTypeModalOpen && <CreateRoomTypeModal />}

    </div>
  );
}
