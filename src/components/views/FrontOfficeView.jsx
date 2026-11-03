import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Building2, 
  BedDouble, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Wrench, 
  Plus, 
  Filter, 
  Search,
  User,
  ArrowRight
} from 'lucide-react';

export default function FrontOfficeView() {
  const { 
    rooms, 
    updateRoomStatus, 
    setIsCreateReservationModalOpen, 
    navigateTo 
  } = useDashboard();

  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoomModal, setActiveRoomModal] = useState(null);

  const floors = ['ALL', '1st', '2nd', '3rd', '4th'];
  const statuses = ['ALL', 'VACANT_READY', 'OCCUPIED', 'DIRTY', 'MAINTENANCE'];

  const filteredRooms = rooms.filter(room => {
    if (selectedFloor !== 'ALL' && room.floor !== selectedFloor) return false;
    if (selectedStatus !== 'ALL' && room.status !== selectedStatus) return false;
    if (searchQuery && !room.roomNumber.includes(searchQuery) && !room.type.toLowerCase().includes(searchQuery.toLowerCase()) && !(room.guest && room.guest.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VACANT_READY':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Vacant Ready</span>;
      case 'OCCUPIED':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Occupied</span>;
      case 'DIRTY':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Dirty (HK)</span>;
      case 'MAINTENANCE':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Maintenance</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Accommodation & Front Office Dashboard
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time room occupancy grid, floor plans, and housekeeping status for AuraStay Suite.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCreateReservationModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Reservation</span>
          </button>

          <button
            onClick={() => navigateTo('reservation-management')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition"
          >
            <span>Reservations List</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1">
            <span className="font-semibold text-slate-500">Floor:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {floors.map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFloor(f)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    selectedFloor === f ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f === 'ALL' ? 'All Floors' : f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <span className="font-semibold text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="VACANT_READY">Vacant Ready</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="DIRTY">Dirty</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search room no or guest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredRooms.map(room => (
          <div 
            key={room.roomNumber}
            onClick={() => setActiveRoomModal(room)}
            className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition p-4 cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-base text-slate-900 font-mono">
                  Room {room.roomNumber}
                </span>
                {getStatusBadge(room.status)}
              </div>

              <div className="text-xs text-slate-600 font-semibold mt-1">
                {room.type}
              </div>

              <div className="text-[11px] text-slate-400 mt-0.5">
                {room.floor} Floor · {room.bed} Bed
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 font-mono">₹{room.price.toLocaleString('en-IN')}<span className="text-[10px] text-slate-400 font-normal">/night</span></span>

              {room.guest ? (
                <div className="text-right">
                  <div className="font-semibold text-indigo-700 truncate max-w-[120px]">{room.guest}</div>
                  <div className="text-[10px] text-slate-400">Out: {room.checkOut}</div>
                </div>
              ) : (
                <span className="text-[11px] text-emerald-600 font-semibold">Available</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Room Status Modal */}
      {activeRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-base text-slate-900">
                Update Room {activeRoomModal.roomNumber}
              </h3>
              <button onClick={() => setActiveRoomModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              Current Status: <b>{activeRoomModal.status}</b> ({activeRoomModal.type})
            </p>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Change Status:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => { updateRoomStatus(activeRoomModal.roomNumber, 'VACANT_READY'); setActiveRoomModal(null); }}
                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg border border-emerald-200"
                >
                  Vacant Ready
                </button>
                <button
                  onClick={() => { updateRoomStatus(activeRoomModal.roomNumber, 'DIRTY'); setActiveRoomModal(null); }}
                  className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-lg border border-amber-200"
                >
                  Dirty (HK)
                </button>
                <button
                  onClick={() => { updateRoomStatus(activeRoomModal.roomNumber, 'OCCUPIED'); setActiveRoomModal(null); }}
                  className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold rounded-lg border border-blue-200"
                >
                  Occupied
                </button>
                <button
                  onClick={() => { updateRoomStatus(activeRoomModal.roomNumber, 'MAINTENANCE'); setActiveRoomModal(null); }}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold rounded-lg border border-rose-200"
                >
                  Maintenance
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveRoomModal(null)}
              className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

