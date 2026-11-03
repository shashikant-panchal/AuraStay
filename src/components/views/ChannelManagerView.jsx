import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Share2, RefreshCw, CheckCircle2, Globe, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ChannelManagerView() {
  const { otaChannels, showNotification, isRefreshing, refreshData } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              Channel Manager — Rates & Availability Distribution
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time two-way synchronization with global OTAs and AuraStay Direct Booking Engine.
          </p>
        </div>

        <button
          onClick={refreshData}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sync All OTAs Now</span>
        </button>
      </div>

      {/* Channel Connections List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {otaChannels.map(ch => (
          <div key={ch.name} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900">{ch.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-100 text-emerald-800">
                  {ch.status}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sync Status:</span>
                  <span className="font-semibold text-slate-800">{ch.syncStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mapped Room Plans:</span>
                  <span className="font-semibold text-slate-800">{ch.mappedRooms} Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Bookings in Period:</span>
                  <span className="font-bold text-indigo-600">{ch.activeBookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Channel Commission:</span>
                  <span className="font-mono text-slate-700">{ch.commission}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => showNotification(`Sync triggered for ${ch.name}`)}
              className="w-full py-2 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
            >
              Push Rates & Availability
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

