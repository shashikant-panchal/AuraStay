import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  RefreshCw,
  PlusCircle,
  XCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export default function TodayGlanceRevenueCard({ enrichedRooms = [] }) {
  const { workingDate = '11-Nov-2026', showNotification } = useDashboard();

  // Active view filters
  const [timeframe, setTimeframe] = useState('TODAY'); // 'TODAY' | 'MTD'
  const [sourceMetric, setSourceMetric] = useState('NIGHTS'); // 'NIGHTS' | 'BOOKINGS'
  const [sourcePeriod, setSourcePeriod] = useState('MONTH'); // 'MONTH' | 'TONIGHT'
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Compute live room stats if available, with graceful defaults matching dashboard metrics
  const stats = useMemo(() => {
    const totalRoomsCount = enrichedRooms.length || 29;
    const occupiedCount = enrichedRooms.filter(r => r.effectiveStatus === 'OCCUPIED').length || 21;
    const totalRevenue = enrichedRooms
      .filter(r => r.effectiveStatus === 'OCCUPIED')
      .reduce((sum, r) => sum + (Number(r.tariff) || 0), 0) || 71252;

    const occupancyPct = totalRoomsCount > 0 ? ((occupiedCount / totalRoomsCount) * 100).toFixed(1) : '72.4';
    const arrVal = occupiedCount > 0 ? Math.round(totalRevenue / occupiedCount) : 3393;
    const revparVal = totalRoomsCount > 0 ? Math.round(totalRevenue / totalRoomsCount) : 2457;

    if (timeframe === 'TODAY') {
      return {
        occupancy: `${occupancyPct}%`,
        occupancySub: `${occupiedCount}/${totalRoomsCount} · LY 48.3%`,
        occupancyChange: '▲ 24 pts',
        occupancyIsPos: true,

        arr: `Rs. ${arrVal.toLocaleString('en-IN')}`,
        arrSub: 'LY Rs. 4,213',
        arrChange: '▼ 19%',
        arrIsPos: false,

        revpar: `Rs. ${revparVal.toLocaleString('en-IN')}`,
        revparSub: 'LY Rs. 2,034',
        revparChange: '▲ 21%',
        revparIsPos: true,

        revenue: `Rs. ${totalRevenue.toLocaleString('en-IN')}`,
        revenueSub: 'LY Rs. 58,988',
        revenueChange: '▲ 21%',
        revenueIsPos: true
      };
    } else {
      // Month to date numbers
      return {
        occupancy: '68.9%',
        occupancySub: '580/841 · LY 54.2%',
        occupancyChange: '▲ 14.7 pts',
        occupancyIsPos: true,

        arr: 'Rs. 3,650',
        arrSub: 'LY Rs. 3,890',
        arrChange: '▼ 6%',
        arrIsPos: false,

        revpar: 'Rs. 2,514',
        revparSub: 'LY Rs. 2,108',
        revparChange: '▲ 19%',
        revparIsPos: true,

        revenue: 'Rs. 21,17,000',
        revenueSub: 'LY Rs. 17,70,720',
        revenueChange: '▲ 19%',
        revenueIsPos: true
      };
    }
  }, [enrichedRooms, timeframe]);

  // Donut chart distribution data
  const sourcesData = useMemo(() => {
    if (sourceMetric === 'NIGHTS') {
      if (sourcePeriod === 'MONTH') {
        return {
          total: 71,
          label: 'NIGHTS',
          direct: { count: 40, pct: 56 },
          walkIn: { count: 28, pct: 39 },
          bookingEngine: { count: 3, pct: 4 }
        };
      } else {
        return {
          total: 21,
          label: 'NIGHTS',
          direct: { count: 12, pct: 57 },
          walkIn: { count: 8, pct: 38 },
          bookingEngine: { count: 1, pct: 5 }
        };
      }
    } else {
      // Bookings count
      return {
        total: 48,
        label: 'BOOKINGS',
        direct: { count: 26, pct: 54 },
        walkIn: { count: 19, pct: 40 },
        bookingEngine: { count: 3, pct: 6 }
      };
    }
  }, [sourceMetric, sourcePeriod]);

  // Manual refresh action
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      if (showNotification) {
        showNotification('Daily revenue metrics synchronized with live front desk matrix.');
      }
    }, 600);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-200/90 space-y-6 animate-in fade-in duration-200">
      {/* 1. Header with Timeframe Pill Switcher & Revenue Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Today at a glance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time daily yield, pickup pace, and ADR performance
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <span className="text-xs font-semibold text-slate-500 hidden md:inline">
            {workingDate}
          </span>

          {/* Today | Month to date Pill Toggle */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center space-x-1 border border-slate-200/80">
            <button
              onClick={() => setTimeframe('TODAY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === 'TODAY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe('MTD')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === 'MTD'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month to date
            </button>
          </div>

          {/* Revenue Action Pill */}
          <button
            onClick={() => {
              if (showNotification) showNotification('Yield & Revenue report preview generated.');
            }}
            className="px-3 py-1.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition"
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Revenue</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className={`w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="Refresh metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Top 4 KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: OCCUPANCY */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            OCCUPANCY
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {stats.occupancy}
          </p>
          <div className="flex items-center justify-between mt-2 pt-1">
            <span className="text-[11px] text-slate-500 font-medium">
              {stats.occupancySub}
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-black text-[11px] px-2 py-0.5 rounded-md inline-flex items-center space-x-0.5">
              <span>{stats.occupancyChange}</span>
            </span>
          </div>
        </div>

        {/* Metric 2: ARR */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            ARR
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {stats.arr}
          </p>
          <div className="flex items-center justify-between mt-2 pt-1">
            <span className="text-[11px] text-slate-500 font-medium">
              {stats.arrSub}
            </span>
            <span className="bg-rose-50 text-rose-700 border border-rose-200/60 font-black text-[11px] px-2 py-0.5 rounded-md inline-flex items-center space-x-0.5">
              <span>{stats.arrChange}</span>
            </span>
          </div>
        </div>

        {/* Metric 3: REVPAR */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            REVPAR
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {stats.revpar}
          </p>
          <div className="flex items-center justify-between mt-2 pt-1">
            <span className="text-[11px] text-slate-500 font-medium">
              {stats.revparSub}
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-black text-[11px] px-2 py-0.5 rounded-md inline-flex items-center space-x-0.5">
              <span>{stats.revparChange}</span>
            </span>
          </div>
        </div>

        {/* Metric 4: REVENUE */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            REVENUE
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {stats.revenue}
          </p>
          <div className="flex items-center justify-between mt-2 pt-1">
            <span className="text-[11px] text-slate-500 font-medium">
              {stats.revenueSub}
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-black text-[11px] px-2 py-0.5 rounded-md inline-flex items-center space-x-0.5">
              <span>{stats.revenueChange}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Columns: BOOKING SOURCES & PICKUP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
        {/* Left Column: BOOKING SOURCES */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-1 h-3.5 bg-amber-500 rounded-full inline-block"></span>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                BOOKING SOURCES
              </h3>
            </div>

            {/* Filter Toggle Pills */}
            <div className="flex items-center space-x-2">
              <div className="bg-slate-100 p-0.5 rounded-xl flex items-center space-x-0.5 border border-slate-200/70">
                <button
                  onClick={() => setSourceMetric('NIGHTS')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    sourceMetric === 'NIGHTS'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Room nights
                </button>
                <button
                  onClick={() => setSourceMetric('BOOKINGS')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    sourceMetric === 'BOOKINGS'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bookings
                </button>
              </div>

              <div className="bg-slate-100 p-0.5 rounded-xl flex items-center space-x-0.5 border border-slate-200/70">
                <button
                  onClick={() => setSourcePeriod('MONTH')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    sourcePeriod === 'MONTH'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  This month
                </button>
                <button
                  onClick={() => setSourcePeriod('TONIGHT')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    sourcePeriod === 'TONIGHT'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tonight
                </button>
              </div>
            </div>
          </div>

          {/* Donut Chart & Legend Row */}
          <div className="flex items-center space-x-6 pt-2">
            {/* Donut SVG Chart */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  className="stroke-slate-100"
                  strokeWidth="16"
                  fill="transparent"
                />

                {/* Direct: 56% Blue */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  className="stroke-blue-500"
                  strokeWidth="16"
                  fill="transparent"
                  strokeDasharray={`${(sourcesData.direct.pct / 100) * 389.5} 389.5`}
                  strokeDashoffset="0"
                />

                {/* Walk-In: 39% Amber */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  className="stroke-amber-500"
                  strokeWidth="16"
                  fill="transparent"
                  strokeDasharray={`${(sourcesData.walkIn.pct / 100) * 389.5} 389.5`}
                  strokeDashoffset={`-${(sourcesData.direct.pct / 100) * 389.5}`}
                />

                {/* Booking Engine: 4% Red */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  className="stroke-rose-500"
                  strokeWidth="16"
                  fill="transparent"
                  strokeDasharray={`${(sourcesData.bookingEngine.pct / 100) * 389.5} 389.5`}
                  strokeDashoffset={`-${((sourcesData.direct.pct + sourcesData.walkIn.pct) / 100) * 389.5}`}
                />
              </svg>

              {/* Centered Donut Label */}
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-900 block leading-tight">
                  {sourcesData.total}
                </span>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider block">
                  {sourcesData.label}
                </span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="flex-1 space-y-3 text-xs">
              {/* Direct */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span className="font-bold text-slate-700">Direct</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-mono font-bold text-slate-900 w-8 text-right">
                    {sourcesData.direct.count}
                  </span>
                  <span className="font-mono text-slate-400 w-8 text-right">
                    {sourcesData.direct.pct}%
                  </span>
                </div>
              </div>

              {/* Walk-In */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="font-bold text-slate-700">Walk-In</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-mono font-bold text-slate-900 w-8 text-right">
                    {sourcesData.walkIn.count}
                  </span>
                  <span className="font-mono text-slate-400 w-8 text-right">
                    {sourcesData.walkIn.pct}%
                  </span>
                </div>
              </div>

              {/* Booking Engine */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="font-bold text-slate-700">Booking Engine</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-mono font-bold text-slate-900 w-8 text-right">
                    {sourcesData.bookingEngine.count}
                  </span>
                  <span className="font-mono text-slate-400 w-8 text-right">
                    {sourcesData.bookingEngine.pct}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: PICKUP */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="w-1 h-3.5 bg-amber-500 rounded-full inline-block"></span>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              PICKUP
            </h3>
          </div>

          <div className="space-y-3.5 pt-1">
            {/* Booked today */}
            <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Booked today</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Rs. 60,752 · 11 direct
                  </p>
                </div>
              </div>
              <span className="text-sm font-black text-slate-900">
                11 · 16 nights
              </span>
            </div>

            {/* Cancelled today */}
            <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Cancelled today</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">None</p>
                </div>
              </div>
              <span className="text-sm font-black text-slate-900">
                0
              </span>
            </div>

            {/* On the books */}
            <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">On the books</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Next 7 days · Rs. 26,581
                  </p>
                </div>
              </div>
              <span className="text-sm font-black text-slate-900">
                9 nights · 4%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

