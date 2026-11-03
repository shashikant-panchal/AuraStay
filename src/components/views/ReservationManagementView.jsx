import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  CalendarDays, 
  Search, 
  Plus, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Filter,
  DollarSign,
  Download
} from 'lucide-react';

export default function ReservationManagementView() {
  const { 
    reservations, 
    setIsCreateReservationModalOpen, 
    showNotification 
  } = useDashboard();

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const filtered = reservations.filter(r => {
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (search && !r.guest.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleCheckInToggle = (resId, currentStatus) => {
    const newStatus = currentStatus === 'CONFIRMED' ? 'CHECKED_IN' : 'CHECKED_OUT';
    showNotification(`Reservation ${resId} marked as ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Reservation Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Confirmed guest arrivals, stay dates, folios, and OTA channel vouchers.
          </p>
        </div>

        <button
          onClick={() => setIsCreateReservationModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Reservation</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-500">Filter Status:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {['ALL', 'CONFIRMED', 'CHECKED_IN'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  filterStatus === s ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'ALL' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search by ID or Guest Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 font-bold">Booking ID</th>
                <th className="py-3 px-4 font-bold">Guest</th>
                <th className="py-3 px-4 font-bold">Room</th>
                <th className="py-3 px-4 font-bold">Dates</th>
                <th className="py-3 px-4 font-bold">Channel</th>
                <th className="py-3 px-4 font-bold text-right">Amount</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                    {r.id}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {r.guest}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {r.room}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {r.checkIn} → {r.checkOut}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                      {r.source}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{r.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      r.status === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleCheckInToggle(r.id, r.status)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded text-[11px] font-semibold transition"
                    >
                      {r.status === 'CONFIRMED' ? 'Check In' : 'Folio / Bill'}
                    </button>
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

