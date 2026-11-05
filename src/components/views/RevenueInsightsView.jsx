import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  TrendingUp,
  Share2,
  Calendar,
  Download,
  Filter,
  DollarSign,
  Percent,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Building2,
  PieChart,
  BarChart3,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye
} from 'lucide-react';

export default function RevenueInsightsView() {
  const { navigateTo, showNotification } = useDashboard();

  const [dateRange, setDateRange] = useState('Nov 2026');
  const [selectedChannel, setSelectedChannel] = useState('ALL');

  // Channel Revenue Data (Real-time live defaults)
  const channelData = [
    {
      id: 'booking-com',
      name: 'Booking.com',
      logoText: 'B.',
      color: 'bg-blue-600',
      revenue: 0,
      share: 0,
      bookings: 0,
      roomNights: 0,
      adr: 0,
      commissionPct: 15,
      commissionAmount: 0,
      netRevenue: 0,
      avgLeadTime: '—',
      cancellationRate: '0%',
      parityStatus: 'In Parity'
    },
    {
      id: 'agoda',
      name: 'Agoda',
      logoText: 'Ag',
      color: 'bg-emerald-600',
      revenue: 0,
      share: 0,
      bookings: 0,
      roomNights: 0,
      adr: 0,
      commissionPct: 14,
      commissionAmount: 0,
      netRevenue: 0,
      avgLeadTime: '—',
      cancellationRate: '0%',
      parityStatus: 'In Parity'
    },
    {
      id: 'makemytrip',
      name: 'MakeMyTrip',
      logoText: 'MMT',
      color: 'bg-rose-600',
      revenue: 0,
      share: 0,
      bookings: 0,
      roomNights: 0,
      adr: 0,
      commissionPct: 18,
      commissionAmount: 0,
      netRevenue: 0,
      avgLeadTime: '—',
      cancellationRate: '0%',
      parityStatus: 'In Parity'
    },
    {
      id: 'expedia',
      name: 'Expedia',
      logoText: 'Exp',
      color: 'bg-amber-600',
      revenue: 0,
      share: 0,
      bookings: 0,
      roomNights: 0,
      adr: 0,
      commissionPct: 16,
      commissionAmount: 0,
      netRevenue: 0,
      avgLeadTime: '—',
      cancellationRate: '0%',
      parityStatus: 'In Parity'
    },
    {
      id: 'airbnb',
      name: 'Airbnb',
      logoText: 'Ab',
      color: 'bg-pink-600',
      revenue: 0,
      share: 0,
      bookings: 0,
      roomNights: 0,
      adr: 0,
      commissionPct: 12,
      commissionAmount: 0,
      netRevenue: 0,
      avgLeadTime: '—',
      cancellationRate: '0%',
      parityStatus: 'In Parity'
    },
    {
      id: 'direct-engine',
      name: 'Direct Booking Engine',
      logoText: 'Dir',
      color: 'bg-sky-600',
      revenue: 0,
      share: 0,
      bookings: 0,
      roomNights: 0,
      adr: 0,
      commissionPct: 0,
      commissionAmount: 0,
      netRevenue: 0,
      avgLeadTime: '—',
      cancellationRate: '0%',
      parityStatus: 'Best Available'
    }
  ];

  const totalGrossRevenue = channelData.reduce((acc, c) => acc + c.revenue, 0);
  const totalCommission = channelData.reduce((acc, c) => acc + c.commissionAmount, 0);
  const totalNetRevenue = channelData.reduce((acc, c) => acc + c.netRevenue, 0);
  const blendedCommissionRate = ((totalCommission / totalGrossRevenue) * 100).toFixed(1);
  const totalBookings = channelData.reduce((acc, c) => acc + c.bookings, 0);
  const totalRoomNights = channelData.reduce((acc, c) => acc + c.roomNights, 0);
  const overallAdr = Math.round(totalGrossRevenue / totalRoomNights);

  const filteredChannels = selectedChannel === 'ALL'
    ? channelData
    : channelData.filter(c => c.id === selectedChannel);

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
          Revenue Insights
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
            Revenue Insights & Yield Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor OTA revenue contribution, commission leakage, net yield margins, and distribution pace.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="Nov 2026">November 2026 (MTD)</option>
              <option value="Oct 2026">October 2026</option>
              <option value="Q4 2026">Q4 2026 Forecast</option>
              <option value="FY 2026-27">Full Financial Year</option>
            </select>
          </div>

          {/* Export Report */}
          <button
            onClick={() => showNotification('Exporting Revenue Insights summary to CSV...')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Sync Channels */}
          <button
            onClick={() => navigateTo('channel-manager')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Channel Manager</span>
          </button>
        </div>
      </div>

      {/* 3. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Gross Revenue */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              GROSS CHANNEL REVENUE
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{totalGrossRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% vs last month
          </div>
        </div>

        {/* Commission Paid */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              COMMISSION LEAKAGE
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">
            ₹{totalCommission.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
            Blended Commission: <strong className="text-slate-800">{blendedCommissionRate}%</strong>
          </div>
        </div>

        {/* Net Take-Home Revenue */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              NET REVENUE (TAKE-HOME)
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-800 mt-1">
            ₹{totalNetRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-sky-600 font-semibold flex items-center gap-1 mt-1">
            Net Yield Margin: <strong>{((totalNetRevenue / totalGrossRevenue) * 100).toFixed(1)}%</strong>
          </div>
        </div>

        {/* Blended ADR */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              OVERALL ADR / ROOM NIGHTS
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{overallAdr.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
            {totalRoomNights} nights across {totalBookings} bookings
          </div>
        </div>
      </div>

      {/* 4. Channel Share Progress Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Channel Revenue Distribution Share</span>
          <span className="text-slate-400 font-normal">100% of ₹{totalGrossRevenue.toLocaleString()}</span>
        </div>

        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {channelData.map(c => (
            <div
              key={c.id}
              className={`${c.color} transition-all duration-300 relative group`}
              style={{ width: `${c.share}%` }}
              title={`${c.name}: ${c.share}% (₹${c.revenue.toLocaleString()})`}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px]">
          {channelData.map(c => (
            <div key={c.id} className="flex items-center space-x-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
              <span className="font-semibold text-slate-700">{c.name}</span>
              <span className="text-slate-400">({c.share}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Detailed Channel Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-[#0e4860]" />
            <h2 className="text-sm font-bold text-slate-900">
              Channel Contribution & Commission Breakdown
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Filter Channel:</span>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All Channels</option>
              {channelData.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3">CHANNEL NAME</th>
                <th className="p-3 text-right">GROSS REVENUE</th>
                <th className="p-3 text-right">SHARE %</th>
                <th className="p-3 text-center">BOOKINGS</th>
                <th className="p-3 text-center">ROOM NIGHTS</th>
                <th className="p-3 text-right">ADR</th>
                <th className="p-3 text-right">COMMISSION %</th>
                <th className="p-3 text-right">COMMISSION (₹)</th>
                <th className="p-3 text-right">NET REVENUE</th>
                <th className="p-3 text-center">PARITY RULE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChannels.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3">
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-7 h-7 rounded-lg ${c.color} text-white flex items-center justify-center font-bold text-[10px] shadow-2xs`}>
                        {c.logoText}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block leading-tight">{c.name}</span>
                        <span className="text-[10px] text-slate-400">Lead Time: {c.avgLeadTime}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right font-black text-slate-900">
                    ₹{c.revenue.toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-800 text-[10.5px]">
                      {c.share}%
                    </span>
                  </td>
                  <td className="p-3 text-center font-semibold text-slate-700">
                    {c.bookings}
                  </td>
                  <td className="p-3 text-center text-slate-600">
                    {c.roomNights}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-800">
                    ₹{c.adr.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-bold text-rose-600">
                    {c.commissionPct}%
                  </td>
                  <td className="p-3 text-right font-bold text-rose-700">
                    ₹{c.commissionAmount.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-black text-emerald-700">
                    ₹{c.netRevenue.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      c.parityStatus === 'In Parity' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : c.parityStatus === 'Best Available'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {c.parityStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                <td className="p-3">TOTAL / BLENDED</td>
                <td className="p-3 text-right">₹{totalGrossRevenue.toLocaleString()}</td>
                <td className="p-3 text-right">100%</td>
                <td className="p-3 text-center">{totalBookings}</td>
                <td className="p-3 text-center">{totalRoomNights}</td>
                <td className="p-3 text-right">₹{overallAdr.toLocaleString()}</td>
                <td className="p-3 text-right text-rose-600">{blendedCommissionRate}%</td>
                <td className="p-3 text-right text-rose-700">₹{totalCommission.toLocaleString()}</td>
                <td className="p-3 text-right text-emerald-800">₹{totalNetRevenue.toLocaleString()}</td>
                <td className="p-3 text-center">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 6. AI Yield Recommendations Card */}
      <div className="bg-linear-to-r from-sky-900 to-[#0e4860] text-white rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              VARO Revenue Optimization Advice
            </span>
          </div>
          <h3 className="text-sm font-bold">
            {totalGrossRevenue > 0
              ? 'Real-Time Commission Optimization Active'
              : 'Channel Distribution Engine Ready'}
          </h3>
          <p className="text-xs text-sky-200 leading-relaxed">
            {totalGrossRevenue > 0
              ? 'Shift 15% of high-demand inventory from higher-commission OTAs to Direct Booking Engine with a promo code.'
              : 'Connect OTAs and start recording reservations to receive automated real-time margin optimization recommendations.'}
          </p>
        </div>

        <button
          onClick={() => {
            showNotification('Optimized channel multipliers applied to rate plan strategies.');
            navigateTo('rate-plans');
          }}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-lg transition shadow-xs shrink-0"
        >
          Adjust Channel Multipliers
        </button>
      </div>
    </div>
  );
}

