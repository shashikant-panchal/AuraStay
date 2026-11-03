import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Home, CheckCircle, AlertTriangle, Sparkles, Wrench } from 'lucide-react';

export default function HousekeepingView() {
  const { rooms, updateRoomStatus } = useDashboard();

  const dirtyCount = rooms.filter(r => r.status === 'DIRTY').length;
  const readyCount = rooms.filter(r => r.status === 'VACANT_READY').length;
  const occupiedCount = rooms.filter(r => r.status === 'OCCUPIED').length;
  const maintenanceCount = rooms.filter(r => r.status === 'MAINTENANCE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Home className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">
              Housekeeping & Room Hygiene Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time room cleaning turnarounds, inspection statuses, and maintenance logs.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Clean & Ready</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{readyCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Vacant Ready rooms</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dirty (Need Cleaning)</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{dirtyCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Pending housekeeping</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Occupied</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">{occupiedCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Guests in house</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Maintenance (OOO)</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{maintenanceCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Out of Order</div>
        </div>
      </div>

      {/* Room Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 text-xs font-bold text-slate-700">
          All Rooms Housekeeping Schedule
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 font-bold">Room</th>
                <th className="py-3 px-4 font-bold">Category</th>
                <th className="py-3 px-4 font-bold">Floor</th>
                <th className="py-3 px-4 font-bold">Current Status</th>
                <th className="py-3 px-4 font-bold text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map(room => (
                <tr key={room.roomNumber} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    Room {room.roomNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-semibold">
                    {room.type}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {room.floor} Floor
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      room.status === 'VACANT_READY' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : room.status === 'DIRTY'
                        ? 'bg-amber-100 text-amber-800'
                        : room.status === 'OCCUPIED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {room.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {room.status === 'DIRTY' ? (
                      <button
                        onClick={() => updateRoomStatus(room.roomNumber, 'VACANT_READY')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition"
                      >
                        Mark Clean & Ready
                      </button>
                    ) : room.status === 'VACANT_READY' ? (
                      <button
                        onClick={() => updateRoomStatus(room.roomNumber, 'DIRTY')}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition"
                      >
                        Mark Dirty
                      </button>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">In Guest Use</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

