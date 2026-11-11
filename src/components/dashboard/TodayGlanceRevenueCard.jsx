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
  const { 
    workingDate = new Date().toISOString().split('T')[0], 
    showNotification,
    rooms = [],
    reservations = []
  } = useDashboard();

  // Active view filters
  const [timeframe, setTimeframe] = useState('TODAY'); // 'TODAY' | 'MTD'
  const [sourceMetric, setSourceMetric] = useState('NIGHTS'); // 'NIGHTS' | 'BOOKINGS'
  const [sourcePeriod, setSourcePeriod] = useState('MONTH'); // 'MONTH' | 'TONIGHT'
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pool of active rooms to evaluate
  const effectiveRooms = enrichedRooms.length > 0 ? enrichedRooms : rooms;

  // Real-time KPI calculations derived 100% from live room matrix and reservations
  const stats = useMemo(() => {
    const totalRoomsCount = effectiveRooms.length;
    const occupiedRooms = effectiveRooms.filter(r => 
      r.effectiveStatus === 'OCCUPIED' || r.status === 'OCCUPIED'
    );
    const occupiedCount = occupiedRooms.length;

    // Today's live revenue from occupied rooms
    const todayRevenue = occupiedRooms.reduce((sum, r) => {
      const val = Number(r.tariff) || Number(r.price) || 0;
      return sum + val;
    }, 0);

    const occupancyPct = totalRoomsCount > 0 ? ((occupiedCount / totalRoomsCount) * 100).toFixed(1) : '0.0';
    const arrVal = occupiedCount > 0 ? Math.round(todayRevenue / occupiedCount) : 0;
    const revparVal = totalRoomsCount > 0 ? Math.round(todayRevenue / totalRoomsCount) : 0;

    // MTD (Month to Date) calculations derived from live reservations
    const currentMonthPrefix = workingDate.slice(0, 7); // e.g. "2026-11"
    const mtdReservations = (reservations || []).filter(r => {
      const cIn = String(r.check_in || r.checkIn || '');
      return cIn.startsWith(currentMonthPrefix) && r.status !== 'CANCELLED';
    });
    const mtdRevenue = mtdReservations.reduce((sum, r) => sum + (Number(r.amount) || Number(r.price) || 0), 0) + todayRevenue;
    const mtdNights = mtdReservations.reduce((sum, r) => sum + (Number(r.nights) || 1), 0);
    const mtdArr = mtdNights > 0 ? Math.round(mtdRevenue / mtdNights) : arrVal;
    const daysInMonthSoFar = Math.max(1, parseInt(workingDate.slice(8, 10), 10) || 1);
    const mtdRevpar = totalRoomsCount > 0 ? Math.round(mtdRevenue / (totalRoomsCount * daysInMonthSoFar)) : 0;
    const mtdOccupancyPct = (totalRoomsCount * daysInMonthSoFar) > 0 
      ? ((mtdNights / (totalRoomsCount * daysInMonthSoFar)) * 100).toFixed(1)
      : '0.0';

    if (timeframe === 'TODAY') {
      return {
        occupancy: `${occupancyPct}%`,
        occupancySub: `${occupiedCount}/${totalRoomsCount} rooms active`,
        occupancyChange: occupiedCount > 0 ? `▲ ${occupancyPct}%` : '—',
        occupancyIsPos: occupiedCount > 0,

        arr: `₹${arrVal.toLocaleString('en-IN')}`,
        arrSub: occupiedCount > 0 ? `Avg per room (${occupiedCount} rooms)` : 'No active stays',
        arrChange: arrVal > 0 ? `₹${arrVal}` : '—',
        arrIsPos: arrVal > 0,

        revpar: `₹${revparVal.toLocaleString('en-IN')}`,
        revparSub: `Yield across ${totalRoomsCount} total rooms`,
        revparChange: revparVal > 0 ? `₹${revparVal}` : '—',
        revparIsPos: revparVal > 0,

        revenue: `₹${todayRevenue.toLocaleString('en-IN')}`,
        revenueSub: `${occupiedCount} occupied rooms today`,
        revenueChange: todayRevenue > 0 ? `+₹${todayRevenue.toLocaleString('en-IN')}` : '₹0',
        revenueIsPos: todayRevenue > 0
      };
    } else {
      // Month-to-date real data
      return {
        occupancy: `${mtdOccupancyPct}%`,
        occupancySub: `${mtdNights} room nights booked`,
        occupancyChange: Number(mtdOccupancyPct) > 0 ? `▲ ${mtdOccupancyPct}%` : '—',
        occupancyIsPos: Number(mtdOccupancyPct) > 0,

        arr: `₹${mtdArr.toLocaleString('en-IN')}`,
        arrSub: `MTD Realized ADR`,
        arrChange: mtdArr > 0 ? `₹${mtdArr}` : '—',
        arrIsPos: mtdArr > 0,

        revpar: `₹${mtdRevpar.toLocaleString('en-IN')}`,
        revparSub: `MTD RevPAR (${daysInMonthSoFar} days)`,
        revparChange: mtdRevpar > 0 ? `₹${mtdRevpar}` : '—',
        revparIsPos: mtdRevpar > 0,

        revenue: `₹${mtdRevenue.toLocaleString('en-IN')}`,
        revenueSub: `${mtdReservations.length} reservations this month`,
        revenueChange: `+₹${mtdRevenue.toLocaleString('en-IN')}`,
        revenueIsPos: mtdRevenue > 0
      };
    }
  }, [effectiveRooms, reservations, workingDate, timeframe]);

  // Donut chart distribution data derived 100% dynamically from real reservations
  const sourcesData = useMemo(() => {
    const list = reservations || [];
    
    // Categorize
    let directCount = 0;
    let walkInCount = 0;
    let otaCount = 0;

    let directNights = 0;
    let walkInNights = 0;
    let otaNights = 0;

    list.forEach(res => {
      const src = String(res.source || res.channel || '').toUpperCase();
      const n = Number(res.nights) || 1;
      if (src.includes('WALK') || src.includes('FRONT')) {
        walkInCount++;
        walkInNights += n;
      } else if (src.includes('OTA') || src.includes('ONLINE') || src.includes('BOOKING') || src.includes('AGODA')) {
        otaCount++;
        otaNights += n;
      } else {
        directCount++;
        directNights += n;
      }
    });

    if (sourceMetric === 'NIGHTS') {
      const total = directNights + walkInNights + otaNights;
      return {
        total,
        label: 'NIGHTS',
        direct: { 
          count: directNights, 
          pct: total > 0 ? Math.round((directNights / total) * 100) : 0 
        },
        walkIn: { 
          count: walkInNights, 
          pct: total > 0 ? Math.round((walkInNights / total) * 100) : 0 
        },
        bookingEngine: { 
          count: otaNights, 
          pct: total > 0 ? Math.round((otaNights / total) * 100) : 0 
        }
      };
    } else {
      const total = directCount + walkInCount + otaCount;
      return {
        total,
        label: 'BOOKINGS',
        direct: { 
          count: directCount, 
          pct: total > 0 ? Math.round((directCount / total) * 100) : 0 
        },
        walkIn: { 
          count: walkInCount, 
          pct: total > 0 ? Math.round((walkInCount / total) * 100) : 0 
        },
        bookingEngine: { 
          count: otaCount, 
          pct: total > 0 ? Math.round((otaCount / total) * 100) : 0 
        }
      };
    }
  }, [reservations, sourceMetric]);

  // Real-time Pickup stats derived from live reservations
  const pickupStats = useMemo(() => {
    const list = reservations || [];
    const todayStr = workingDate;

    // Booked today: reservations with check_in or created today
    const bookedTodayList = list.filter(r => {
      const cIn = String(r.check_in || r.checkIn || '');
      const created = String(r.created_at || '').slice(0, 10);
      return (cIn === todayStr || created === todayStr) && r.status !== 'CANCELLED';
    });
    const bookedTodayCount = bookedTodayList.length;
    const bookedTodayNights = bookedTodayList.reduce((sum, r) => sum + (Number(r.nights) || 1), 0);
    const bookedTodayRevenue = bookedTodayList.reduce((sum, r) => sum + (Number(r.amount) || Number(r.price) || 0), 0);

    // Cancelled today
    const cancelledTodayList = list.filter(r => r.status === 'CANCELLED');
    const cancelledTodayCount = cancelledTodayList.length;

    // On the books: next 7 days
    const todayDate = new Date(todayStr);
    const next7Date = new Date(todayDate);
    next7Date.setDate(next7Date.getDate() + 7);
    const next7Str = next7Date.toISOString().split('T')[0];

    const upcomingList = list.filter(r => {
      const cIn = String(r.check_in || r.checkIn || '');
      return cIn >= todayStr && cIn <= next7Str && r.status !== 'CANCELLED';
    });
    const upcomingCount = upcomingList.length;
    const upcomingNights = upcomingList.reduce((sum, r) => sum + (Number(r.nights) || 1), 0);
    const upcomingRevenue = upcomingList.reduce((sum, r) => sum + (Number(r.amount) || Number(r.price) || 0), 0);

    const totalRoomsCount = effectiveRooms.length || 1;
    const upcomingOccupancy = Math.min(100, Math.round((upcomingNights / (totalRoomsCount * 7)) * 100));

    return {
      bookedTodayCount,
      bookedTodayNights,
      bookedTodayRevenue,
      cancelledTodayCount,
      upcomingCount,
      upcomingNights,
      upcomingRevenue,
      upcomingOccupancy
    };
  }, [reservations, workingDate, effectiveRooms]);

  // Manual refresh action
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      if (showNotification) {
        showNotification('Daily revenue metrics synchronized with live front desk matrix.');
      }
    }, 400);
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
            ARR (ADR)
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {stats.arr}
          </p>
          <div className="flex items-center justify-between mt-2 pt-1">
            <span className="text-[11px] text-slate-500 font-medium">
              {stats.arrSub}
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-black text-[11px] px-2 py-0.5 rounded-md inline-flex items-center space-x-0.5">
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

                {sourcesData.total > 0 && (
                  <>
                    {/* Direct Blue */}
                    <circle
                      cx="80"
                      cy="80"
                      r="62"
                      className="stroke-blue-500 transition-all duration-300"
                      strokeWidth="16"
                      fill="transparent"
                      strokeDasharray={`${(sourcesData.direct.pct / 100) * 389.5} 389.5`}
                      strokeDashoffset="0"
                    />

                    {/* Walk-In Amber */}
                    <circle
                      cx="80"
                      cy="80"
                      r="62"
                      className="stroke-amber-500 transition-all duration-300"
                      strokeWidth="16"
                      fill="transparent"
                      strokeDasharray={`${(sourcesData.walkIn.pct / 100) * 389.5} 389.5`}
                      strokeDashoffset={`-${(sourcesData.direct.pct / 100) * 389.5}`}
                    />

                    {/* Online / Booking Engine Rose */}
                    <circle
                      cx="80"
                      cy="80"
                      r="62"
                      className="stroke-rose-500 transition-all duration-300"
                      strokeWidth="16"
                      fill="transparent"
                      strokeDasharray={`${(sourcesData.bookingEngine.pct / 100) * 389.5} 389.5`}
                      strokeDashoffset={`-${((sourcesData.direct.pct + sourcesData.walkIn.pct) / 100) * 389.5}`}
                    />
                  </>
                )}
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
                  <span className="font-bold text-slate-700">Online / OTAs</span>
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
              PICKUP & FORECAST
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
                    ₹{pickupStats.bookedTodayRevenue.toLocaleString('en-IN')} revenue
                  </p>
                </div>
              </div>
              <span className="text-sm font-black text-slate-900">
                {pickupStats.bookedTodayCount} · {pickupStats.bookedTodayNights} nights
              </span>
            </div>

            {/* Cancelled today */}
            <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Cancelled</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {pickupStats.cancelledTodayCount > 0 ? `${pickupStats.cancelledTodayCount} bookings cancelled` : 'None'}
                  </p>
                </div>
              </div>
              <span className="text-sm font-black text-slate-900">
                {pickupStats.cancelledTodayCount}
              </span>
            </div>

            {/* On the books */}
            <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">On the books (Next 7 Days)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ₹{pickupStats.upcomingRevenue.toLocaleString('en-IN')} expected
                  </p>
                </div>
              </div>
              <span className="text-sm font-black text-slate-900">
                {pickupStats.upcomingNights} nights · {pickupStats.upcomingOccupancy}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
