import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  Globe,
  Share2,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Plus,
  SlidersHorizontal,
  FileText,
  TrendingUp,
  Lock,
  ExternalLink,
  X,
  AlertCircle,
  Trophy,
  Zap,
  Clock
} from 'lucide-react';

const INITIAL_CHANNELS = [
  {
    id: 'booking-com',
    name: 'Booking.com',
    code: 'BCOM',
    logoText: 'B.',
    color: 'bg-blue-600',
    status: 'ACTIVE',
    syncStatus: 'Fully Synced',
    lastSync: 'Just now (17:18)',
    mappedRooms: 0,
    activeBookings: 0,
    commission: '15.0%',
    rateRule: 'Direct Parity (0%)',
    syncRates: true,
    syncAvailability: true,
    syncBookings: true
  },
  {
    id: 'agoda',
    name: 'Agoda',
    code: 'AGD',
    logoText: 'Ag',
    color: 'bg-emerald-600',
    status: 'ACTIVE',
    syncStatus: 'Fully Synced',
    lastSync: '2 mins ago (17:16)',
    mappedRooms: 0,
    activeBookings: 0,
    commission: '14.0%',
    rateRule: 'Direct Parity (0%)',
    syncRates: true,
    syncAvailability: true,
    syncBookings: true
  },
  {
    id: 'makemytrip',
    name: 'MakeMyTrip',
    code: 'MMT',
    logoText: 'MMT',
    color: 'bg-rose-600',
    status: 'ACTIVE',
    syncStatus: 'Fully Synced',
    lastSync: '4 mins ago (17:14)',
    mappedRooms: 0,
    activeBookings: 0,
    commission: '18.0%',
    rateRule: 'Direct Parity (0%)',
    syncRates: true,
    syncAvailability: true,
    syncBookings: true
  },
  {
    id: 'expedia',
    name: 'Expedia Partner',
    code: 'EXP',
    logoText: 'Exp',
    color: 'bg-amber-600',
    status: 'ACTIVE',
    syncStatus: 'Fully Synced',
    lastSync: '6 mins ago (17:12)',
    mappedRooms: 0,
    activeBookings: 0,
    commission: '16.0%',
    rateRule: '+5% Dynamic Markup',
    syncRates: true,
    syncAvailability: true,
    syncBookings: true
  },
  {
    id: 'airbnb',
    name: 'Airbnb Global',
    code: 'ABNB',
    logoText: 'Ab',
    color: 'bg-pink-600',
    status: 'ACTIVE',
    syncStatus: 'Fully Synced',
    lastSync: '10 mins ago (17:08)',
    mappedRooms: 0,
    activeBookings: 0,
    commission: '12.0%',
    rateRule: '+8% Dynamic Markup',
    syncRates: true,
    syncAvailability: true,
    syncBookings: true
  },
  {
    id: 'goibibo',
    name: 'Goibibo B2C',
    code: 'GOI',
    logoText: 'Goi',
    color: 'bg-orange-600',
    status: 'ACTIVE',
    syncStatus: 'Fully Synced',
    lastSync: '12 mins ago (17:06)',
    mappedRooms: 0,
    activeBookings: 0,
    commission: '15.0%',
    rateRule: 'Direct Parity (0%)',
    syncRates: true,
    syncAvailability: true,
    syncBookings: true
  }
];

export default function ChannelManagerView() {
  const { navigateTo, showNotification } = useDashboard();

  const [channels, setChannels] = useState(INITIAL_CHANNELS);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedChannelSettings, setSelectedChannelSettings] = useState(null);

  // New channel connect form
  const [newChannelData, setNewChannelData] = useState({
    name: 'Google Hotel Ads',
    hotelId: 'AST-865',
    apiKey: '',
    commissionPct: 10
  });

  const handleSyncAll = () => {
    setIsSyncingAll(true);
    setTimeout(() => {
      setIsSyncingAll(false);
      showNotification('All 6 OTAs synced successfully with 100% rate parity.');
    }, 800);
  };

  const handleSyncSingle = (channelName) => {
    showNotification(`Rates & availability pushed to ${channelName}.`);
  };

  const toggleToggle = (channelId, field) => {
    setChannels(prev => prev.map(ch => {
      if (ch.id === channelId) {
        const nextVal = !ch[field];
        showNotification(`${ch.name} ${field}: ${nextVal ? 'ON' : 'OFF'}`);
        return { ...ch, [field]: nextVal };
      }
      return ch;
    }));
  };

  const handleAddChannel = (e) => {
    e.preventDefault();
    const created = {
      id: `custom-${Date.now()}`,
      name: newChannelData.name,
      code: 'GHA',
      logoText: 'G.',
      color: 'bg-red-600',
      status: 'ACTIVE',
      syncStatus: 'Fully Synced',
      lastSync: 'Just now',
      mappedRooms: 0,
      activeBookings: 0,
      commission: `${newChannelData.commissionPct}%`,
      rateRule: 'Direct Parity (0%)',
      syncRates: true,
      syncAvailability: true,
      syncBookings: true
    };

    setChannels(prev => [...prev, created]);
    setIsConnectModalOpen(false);
    showNotification(`${newChannelData.name} successfully connected!`);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* 1. Breadcrumb */}
      <div className="flex items-center space-x-1.5 text-xs text-slate-500 pb-1 border-b border-slate-200">
        <span
          onClick={() => navigateTo('master-service-home')}
          className="hover:text-slate-900 cursor-pointer transition flex items-center gap-1"
        >
          🏠 Home
        </span>
        <span>/</span>
        <span className="font-semibold text-slate-900">
          Channel Manager
        </span>
      </div>

      {/* 2. Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-300 px-2 py-0.5 rounded tracking-wider">
              AURASTAY PMS
            </span>
            <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> MASTERY: 0%
            </span>
          </div>

          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Channel Manager — Distribution & OTA Sync Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage two-way live connections with global OTAs, rate multipliers, allotments, and instant synchronization.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick nav to Audit Logs */}
          <button
            onClick={() => navigateTo('audit-logs')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
          </button>

          {/* Quick nav to Revenue Insights */}
          <button
            onClick={() => navigateTo('revenue-insights')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Revenue Insights</span>
          </button>

          {/* Connect New Channel */}
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#00a8cc] hover:bg-[#0092b6] text-white rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect Channel</span>
          </button>

          {/* Push / Sync All */}
          <button
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold shadow-2xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>Sync All OTAs</span>
          </button>
        </div>
      </div>

      {/* 3. 4 Top Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            CONNECTED CHANNELS
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {channels.length} OTAs
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Online & Live
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            SYNC ARCHITECTURE
          </span>
          <div className="text-2xl font-black text-sky-800 mt-1">2-Way</div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Instant webhook push/pull
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            TOTAL ACTIVE BOOKINGS
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {channels.reduce((acc, c) => acc + c.activeBookings, 0)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium block mt-1">
            Direct PMS sync enabled
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            RATE PARITY HEALTH
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">100%</div>
          <span className="text-[11px] text-emerald-600 font-medium block mt-1">
            0 Parity breaches detected
          </span>
        </div>
      </div>

      {/* 4. Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
          >
            {/* Channel Top Header */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-8 h-8 rounded-lg ${ch.color} text-white flex items-center justify-center font-black text-xs shadow-2xs`}>
                    {ch.logoText}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{ch.name}</h3>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {ch.lastSync}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {ch.status}
                </span>
              </div>

              {/* Channel Stats Strip */}
              <div className="mt-3.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">MAPPED ROOMS</span>
                  <span className="font-bold text-slate-800">{ch.mappedRooms} Room Categories</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">COMMISSION</span>
                  <span className="font-bold text-rose-700">{ch.commission}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">RATE STRATEGY</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate block" title={ch.rateRule}>
                    {ch.rateRule}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">ACTIVE BOOKINGS</span>
                  <span className="font-bold text-sky-700">{ch.activeBookings} Stays</span>
                </div>
              </div>

              {/* 3 Two-Way Sync Toggles */}
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Rates Sync (ARI)</span>
                  <button
                    onClick={() => toggleToggle(ch.id, 'syncRates')}
                    className={`w-9 h-5 rounded-full transition relative p-0.5 ${ch.syncRates ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${ch.syncRates ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Availability Allotments</span>
                  <button
                    onClick={() => toggleToggle(ch.id, 'syncAvailability')}
                    className={`w-9 h-5 rounded-full transition relative p-0.5 ${ch.syncAvailability ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${ch.syncAvailability ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Inbound Bookings Webhook</span>
                  <button
                    onClick={() => toggleToggle(ch.id, 'syncBookings')}
                    className={`w-9 h-5 rounded-full transition relative p-0.5 ${ch.syncBookings ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${ch.syncBookings ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
              <button
                onClick={() => handleSyncSingle(ch.name)}
                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Push Rates</span>
              </button>

              <button
                onClick={() => setSelectedChannelSettings(ch)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
                title="Channel Settings"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: CONNECT NEW CHANNEL */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#0e4860] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Connect New OTA Channel</h3>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddChannel} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Select Distribution Partner
                </label>
                <select
                  value={newChannelData.name}
                  onChange={(e) => setNewChannelData({ ...newChannelData, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="Google Hotel Ads">Google Hotel Ads</option>
                  <option value="Tripadvisor Instant Booking">Tripadvisor Instant Booking</option>
                  <option value="Traveloka">Traveloka</option>
                  <option value="Despegar / Decolar">Despegar / Decolar</option>
                  <option value="Trivago Direct Connect">Trivago Direct Connect</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Property Hotel ID on Channel
                </label>
                <input
                  type="text"
                  value={newChannelData.hotelId}
                  onChange={(e) => setNewChannelData({ ...newChannelData, hotelId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  API Secret Key / Channel Token
                </label>
                <input
                  type="password"
                  placeholder="Enter API token..."
                  value={newChannelData.apiKey}
                  onChange={(e) => setNewChannelData({ ...newChannelData, apiKey: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Agreed Commission Percentage (%)
                </label>
                <input
                  type="number"
                  value={newChannelData.commissionPct}
                  onChange={(e) => setNewChannelData({ ...newChannelData, commissionPct: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00a8cc] hover:bg-[#0092b6] text-white rounded-lg text-xs font-bold"
                >
                  Activate Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHANNEL SETTINGS */}
      {selectedChannelSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#0e4860] text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>{selectedChannelSettings.name} Settings</span>
              </h3>
              <button
                onClick={() => setSelectedChannelSettings(null)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">TWO-WAY PROTOCOL</span>
                <span className="font-bold text-slate-800">OTA XML 2014B / JSON Webhook</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Pricing Multiplier / Disparity Offset
                </label>
                <select className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800">
                  <option value="0">0% (Exact Direct Parity)</option>
                  <option value="5">+5% Dynamic Surcharge</option>
                  <option value="8">+8% Dynamic Surcharge</option>
                  <option value="10">+10% Dynamic Surcharge</option>
                  <option value="-5">-5% Promotional Discount</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Automatic Sync Interval
                </label>
                <select className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-800">
                  <option value="instant">Instant Real-Time Webhook Push</option>
                  <option value="5m">Every 5 minutes</option>
                  <option value="15m">Every 15 minutes</option>
                  <option value="hourly">Hourly batch</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedChannelSettings(null)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showNotification(`${selectedChannelSettings.name} configuration updated.`);
                    setSelectedChannelSettings(null);
                  }}
                  className="px-4 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
