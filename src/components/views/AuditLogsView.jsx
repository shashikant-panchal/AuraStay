import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Share2,
  Calendar,
  Eye,
  X,
  Code,
  Trophy,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

// Sample Realistic Channel Manager Audit Logs
const INITIAL_LOGS = [
  {
    id: 'LOG-9401',
    timestamp: '05 Nov 2026, 17:18:14',
    channel: 'Booking.com',
    channelColor: 'bg-blue-600',
    event: 'ARI Rate & Inventory Push',
    type: 'ARI_PUSH',
    actor: 'Auto-Sync Scheduler',
    responseCode: '200 OK',
    latency: '142ms',
    status: 'SUCCESS',
    details: 'Successfully pushed 15-day rate matrix and room availability for 7 room types.',
    requestPayload: {
      action: 'OTA_HotelRateAmountNotifRQ',
      hotel_code: 'BSE-865',
      rate_plans: ['EP', 'CP', 'MAP'],
      date_range: '2026-11-05 to 2026-11-19',
      rooms_affected: 28
    },
    responsePayload: {
      status: 'SUCCESS',
      acknowledgement: 'BCOM-ACK-992144',
      message: 'Rates and allotments updated without errors.'
    }
  },
  {
    id: 'LOG-9402',
    timestamp: '05 Nov 2026, 17:15:02',
    channel: 'MakeMyTrip',
    channelColor: 'bg-rose-600',
    event: 'Inbound Reservation Webhook',
    type: 'BOOKING_INBOUND',
    actor: 'MMT Webhook API',
    responseCode: '201 Created',
    latency: '310ms',
    status: 'SUCCESS',
    details: 'Received new confirmed booking MMT-98114 for Deluxe AC (Room 204).',
    requestPayload: {
      ota_ref: 'MMT-98114',
      guest: 'Rohan Sharma',
      room_type: 'Deluxe AC',
      check_in: '2026-11-05',
      check_out: '2026-11-07',
      total_amount: 5000,
      commission_cut: 900
    },
    responsePayload: {
      pms_booking_id: 'BSE-B-866',
      assigned_room: 'Room 204',
      status: 'CONFIRMED'
    }
  },
  {
    id: 'LOG-9403',
    timestamp: '05 Nov 2026, 17:02:40',
    channel: 'Agoda',
    channelColor: 'bg-emerald-600',
    event: 'Stop-Sell Inventory Restriction',
    type: 'RESTRICTION',
    actor: 'User: Twinkle Bagh',
    responseCode: '200 OK',
    latency: '185ms',
    status: 'SUCCESS',
    details: 'Applied Stop-Sell on Banquet Hall for 07 Nov 2026 due to private event reservation.',
    requestPayload: {
      action: 'OTA_HotelAvailNotifRQ',
      restriction: 'STOP_SELL',
      room_type: 'Banquet Hall',
      dates: ['2026-11-07']
    },
    responsePayload: {
      status: 'SUCCESS',
      inventory_closed: true
    }
  },
  {
    id: 'LOG-9404',
    timestamp: '05 Nov 2026, 16:48:19',
    channel: 'Expedia',
    channelColor: 'bg-amber-600',
    event: 'Rate Parity Verification Ping',
    type: 'PARITY_CHECK',
    actor: 'VARO AI Yield Engine',
    responseCode: '200 OK',
    latency: '220ms',
    status: 'SUCCESS',
    details: 'Verified +5% markup rule parity against Direct engine base rate.',
    requestPayload: {
      check: 'RATE_PARITY',
      channel: 'EXPEDIA_PARTNER',
      standard_base: 2500,
      expedia_display: 2625
    },
    responsePayload: {
      parity_breach: false,
      markup_verified: true
    }
  },
  {
    id: 'LOG-9405',
    timestamp: '05 Nov 2026, 16:30:11',
    channel: 'Airbnb',
    channelColor: 'bg-pink-600',
    event: 'Calendar iCal & Webhook Sync',
    type: 'CALENDAR_SYNC',
    actor: 'Sync Daemon',
    responseCode: '200 OK',
    latency: '412ms',
    status: 'SUCCESS',
    details: 'Synchronized Family Suite AC availability calendar and minimum 2-night stay policy.',
    requestPayload: {
      calendar_feed: 'ICal_Export_V2',
      property: 'Family Suite AC',
      min_los: 2
    },
    responsePayload: {
      synced_blocks: 6,
      status: 'UP_TO_DATE'
    }
  },
  {
    id: 'LOG-9406',
    timestamp: '05 Nov 2026, 15:55:04',
    channel: 'Booking.com',
    channelColor: 'bg-blue-600',
    event: 'Rate Plan Discrepancy Retry',
    type: 'RETRY',
    actor: 'Retry Engine',
    responseCode: '200 OK (Resolved)',
    latency: '298ms',
    status: 'WARNING',
    details: 'Initial timeout on rate push was automatically resolved on second retry attempt.',
    requestPayload: {
      retry_attempt: 2,
      hotel_id: 'BSE-865',
      channel: 'Booking.com'
    },
    responsePayload: {
      status: 'RESOLVED',
      code: 'SUCCESS'
    }
  },
  {
    id: 'LOG-9407',
    timestamp: '05 Nov 2026, 14:20:50',
    channel: 'Goibibo',
    channelColor: 'bg-orange-600',
    event: 'Promotion / Deal Sync',
    type: 'PROMO_SYNC',
    actor: 'User: Twinkle Bagh',
    responseCode: '200 OK',
    latency: '190ms',
    status: 'SUCCESS',
    details: 'Pushed Flash Weekend Deal (10% discount on Executive AC rooms).',
    requestPayload: {
      deal_code: 'FLASH10',
      discount_pct: 10,
      validity: '2026-11-06 to 2026-11-08'
    },
    responsePayload: {
      deal_active: true,
      channels_updated: ['Goibibo', 'MakeMyTrip']
    }
  }
];

export default function AuditLogsView() {
  const { navigateTo, showNotification } = useDashboard();

  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPayloadLog, setSelectedPayloadLog] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showNotification('Channel Manager Audit Logs refreshed.');
    }, 600);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChannel = channelFilter === 'ALL' || log.channel === channelFilter;
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;

    return matchesSearch && matchesChannel && matchesStatus;
  });

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
        <span
          onClick={() => navigateTo('channel-manager')}
          className="hover:text-slate-900 cursor-pointer transition"
        >
          Channel Manager
        </span>
        <span>/</span>
        <span className="font-semibold text-slate-900">
          Audit Logs
        </span>
      </div>

      {/* 2. Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-300 px-2 py-0.5 rounded tracking-wider">
              BOOKONE PMS
            </span>
            <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> MASTERY: 0%
            </span>
          </div>

          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Channel Manager Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent, real-time telemetry for rate pushes, inventory syncs, inbound OTA reservations, and webhook payloads.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => showNotification('Audit logs downloaded as CSV.')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => navigateTo('channel-manager')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Channel Manager</span>
          </button>
        </div>
      </div>

      {/* 3. 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            TOTAL SYNC EVENTS (24H)
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">1,428</div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Real-time 2-way sync
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            SUCCESS RATE
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">99.85%</div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            0 critical sync drops
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            WARNINGS / RETRIES
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">2</div>
          <span className="text-[11px] text-emerald-600 font-medium block mt-1">
            All retries resolved
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            AVERAGE API LATENCY
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">210ms</div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Direct socket webhook
          </span>
        </div>
      </div>

      {/* 4. Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search logs by ID, Channel, Event, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-sky-500 font-medium"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Channel Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <span className="text-[11px] font-bold text-slate-400">CHANNEL:</span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All Channels</option>
              <option value="Booking.com">Booking.com</option>
              <option value="Agoda">Agoda</option>
              <option value="MakeMyTrip">MakeMyTrip</option>
              <option value="Expedia">Expedia</option>
              <option value="Airbnb">Airbnb</option>
              <option value="Goibibo">Goibibo</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <span className="text-[11px] font-bold text-slate-400">STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="WARNING">Warning / Retry</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {(searchTerm || channelFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setChannelFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 5. Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3">LOG ID & TIMESTAMP</th>
                <th className="p-3">CHANNEL</th>
                <th className="p-3">EVENT / OPERATION</th>
                <th className="p-3">ORIGIN / ACTOR</th>
                <th className="p-3">DETAILS</th>
                <th className="p-3 text-center">CODE & LATENCY</th>
                <th className="p-3 text-center">STATUS</th>
                <th className="p-3 text-right">PAYLOAD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400 font-semibold">
                    No matching audit logs found for the applied criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{log.id}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {log.timestamp}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold text-white ${log.channelColor} shadow-2xs`}>
                        {log.channel}
                      </span>
                    </td>

                    <td className="p-3 font-bold text-slate-800">
                      {log.event}
                    </td>

                    <td className="p-3 text-slate-600">
                      {log.actor}
                    </td>

                    <td className="p-3 text-slate-600 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>

                    <td className="p-3 text-center">
                      <div className="font-mono text-slate-800 font-bold">{log.responseCode}</div>
                      <div className="text-[10px] text-slate-400">{log.latency}</div>
                    </td>

                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : log.status === 'WARNING'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {log.status}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedPayloadLog(log)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition flex items-center space-x-1 ml-auto"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. INSPECT PAYLOAD MODAL */}
      {selectedPayloadLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#0e4860] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <span>Log Telemetry Inspector</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/20 font-mono">
                    {selectedPayloadLog.id}
                  </span>
                </h3>
                <p className="text-xs text-sky-200 mt-0.5">
                  {selectedPayloadLog.channel} • {selectedPayloadLog.event} ({selectedPayloadLog.timestamp})
                </p>
              </div>

              <button
                onClick={() => setSelectedPayloadLog(null)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Event Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block">STATUS</span>
                  <span className="font-bold text-emerald-700">{selectedPayloadLog.status}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block">HTTP RESPONSE</span>
                  <span className="font-bold text-slate-900">{selectedPayloadLog.responseCode}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block">LATENCY</span>
                  <span className="font-bold text-slate-900">{selectedPayloadLog.latency}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block">TRIGGERED BY</span>
                  <span className="font-bold text-slate-900">{selectedPayloadLog.actor}</span>
                </div>
              </div>

              {/* Request Payload */}
              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">
                  Outbound / Inbound Request Payload
                </span>
                <pre className="bg-slate-900 text-sky-300 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(selectedPayloadLog.requestPayload, null, 2)}
                </pre>
              </div>

              {/* Response Payload */}
              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">
                  Response Payload & Acknowledgement
                </span>
                <pre className="bg-slate-900 text-emerald-300 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(selectedPayloadLog.responsePayload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedPayloadLog(null)}
                className="px-4 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
