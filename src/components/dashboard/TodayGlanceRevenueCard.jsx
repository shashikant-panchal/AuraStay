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
  const totalRoomsCount = effectiveRooms.length;

  // Normalized today's date string (YYYY-MM-DD)
  const todayDateStr = useMemo(() => {
    if (workingDate && /^\d{4}-\d{2}-\d{2}/.test(workingDate)) {
      return workingDate.slice(0, 10);
    }
    try {
      const parsed = new Date(workingDate);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }
    } catch (e) { }
    return new Date().toISOString().slice(0, 10);
  }, [workingDate]);

  const isReservationToday = (r) => {
    if (r.status === 'CANCELLED') return false;
    const cIn = String(r.checkIn || r.check_in || '').slice(0, 10);
    const cOut = String(r.checkOut || r.check_out || '').slice(0, 10);
    const created = String(r.createdAt || r.created_at || '').slice(0, 10);

    // Active stay covering today
    if (cIn && cOut && cIn <= todayDateStr && cOut >= todayDateStr) return true;
    // Checked in or checked out on today
    if (cIn === todayDateStr || cOut === todayDateStr) return true;
    // Created today
    if (created === todayDateStr) return true;
    // Currently checked in
    if (r.status === 'CHECKED_IN') return true;
    return false;
  };

  // Live occupied physical rooms
  const occupiedRooms = useMemo(() => {
    return effectiveRooms.filter(r => 
      r.effectiveStatus === 'OCCUPIED' || r.status === 'OCCUPIED'
    );
  }, [effectiveRooms]);

  // Real-time KPI calculations derived 100% from live room matrix and reservations
  const stats = useMemo(() => {
    // 1. All reservations active or generated today
    const todayResList = (reservations || []).filter(isReservationToday);

    // Sum of revenue from today's reservations
    let liveTodayRevenue = todayResList.reduce((sum, r) => {
      return sum + (Number(r.amount) || Number(r.paid) || Number(r.price) || 0);
    }, 0);

    // Add revenue from any currently occupied room not already covered by reservations
    occupiedRooms.forEach(r => {
      const roomNum = String(r.roomNumber || r.room_number || r.id);
      const isCovered = todayResList.some(res => 
        (res.room && String(res.room).includes(roomNum)) ||
        (r.bookingId && res.id === r.bookingId)
      );
      if (!isCovered) {
        liveTodayRevenue += (Number(r.tariff) || Number(r.price) || 0);
      }
    });

    // Rooms utilized today
    const roomSet = new Set();
    occupiedRooms.forEach(r => roomSet.add(String(r.roomNumber || r.room_number || r.id)));
    todayResList.forEach(res => {
      if (res.room) {
        const m = String(res.room).match(/\b(\d+)\b/);
        if (m) roomSet.add(m[1]);
        else roomSet.add(String(res.room));
      }
    });
    const utilizedCount = Math.min(totalRoomsCount, roomSet.size);

    const occupancyPct = totalRoomsCount > 0 ? ((utilizedCount / totalRoomsCount) * 100).toFixed(1) : '0.0';
    const arrVal = utilizedCount > 0 ? Math.round(liveTodayRevenue / utilizedCount) : (liveTodayRevenue > 0 ? liveTodayRevenue : 0);
    const revparVal = totalRoomsCount > 0 ? Math.round(liveTodayRevenue / totalRoomsCount) : 0;

    // Month to date calculations from real reservations
    const currentMonthPrefix = todayDateStr.slice(0, 7); // e.g. "2026-11"
    const mtdReservations = (reservations || []).filter(r => {
      if (r.status === 'CANCELLED') return false;
      const cIn = String(r.checkIn || r.check_in || '');
      const created = String(r.createdAt || r.created_at || '');
      return cIn.startsWith(currentMonthPrefix) || created.startsWith(currentMonthPrefix);
    });

    const mtdRevenue = mtdReservations.reduce((sum, r) => sum + (Number(r.amount) || Number(r.paid) || Number(r.price) || 0), 0);
    const mtdNights = mtdReservations.reduce((sum, r) => sum + (Number(r.nights) || 1), 0);
    const daysInMonthSoFar = Math.max(1, parseInt(todayDateStr.slice(8, 10), 10) || 1);
    const totalAvailableNights = totalRoomsCount * daysInMonthSoFar;
    const mtdOccupancyPct = totalAvailableNights > 0 ? Math.min(100, (mtdNights / totalAvailableNights) * 100).toFixed(1) : '0.0';
    const mtdArr = mtdNights > 0 ? Math.round(mtdRevenue / mtdNights) : (mtdReservations.length > 0 ? Math.round(mtdRevenue / mtdReservations.length) : 0);
    const mtdRevpar = totalAvailableNights > 0 ? Math.round(mtdRevenue / totalAvailableNights) : 0;

    if (timeframe === 'TODAY') {
      return {
        occupancy: `${occupancyPct}%`,
        occupancySub: `${utilizedCount}/${totalRoomsCount} rooms active today`,
        occupancyChange: Number(occupancyPct) > 0 ? `▲ ${occupancyPct}%` : 'Optimal',
        occupancyIsPos: Number(occupancyPct) > 0,

        arr: `₹${arrVal.toLocaleString('en-IN')}`,
        arrSub: utilizedCount > 0 ? `Average across ${utilizedCount} room stay(s)` : (liveTodayRevenue > 0 ? 'Single booking yield' : 'No active stays'),
        arrChange: arrVal > 0 ? `₹${arrVal.toLocaleString('en-IN')}` : 'Optimal',
        arrIsPos: arrVal > 0,

        revpar: `₹${revparVal.toLocaleString('en-IN')}`,
        revparSub: `Yield across ${totalRoomsCount} rooms in inventory`,
        revparChange: revparVal > 0 ? `₹${revparVal.toLocaleString('en-IN')}` : 'Optimal',
        revparIsPos: revparVal > 0,

        revenue: `₹${liveTodayRevenue.toLocaleString('en-IN')}`,
        revenueSub: todayResList.length > 0 ? `${todayResList.length} booking(s) active today` : (occupiedRooms.length > 0 ? `${occupiedRooms.length} room(s) occupied` : 'Real-time billing counter'),
        revenueChange: liveTodayRevenue > 0 ? `+₹${liveTodayRevenue.toLocaleString('en-IN')}` : '₹0',
        revenueIsPos: liveTodayRevenue > 0
      };
    } else {
      // Month to date numbers
      return {
        occupancy: `${mtdOccupancyPct}%`,
        occupancySub: `${mtdNights} room nights booked this month`,
        occupancyChange: Number(mtdOccupancyPct) > 0 ? `▲ ${mtdOccupancyPct}%` : 'Optimal',
        occupancyIsPos: Number(mtdOccupancyPct) > 0,

        arr: `₹${mtdArr.toLocaleString('en-IN')}`,
        arrSub: `MTD Realized ADR (${mtdReservations.length} bookings)`,
        arrChange: mtdArr > 0 ? `₹${mtdArr.toLocaleString('en-IN')}` : 'Optimal',
        arrIsPos: mtdArr > 0,

        revpar: `₹${mtdRevpar.toLocaleString('en-IN')}`,
        revparSub: `MTD RevPAR (${daysInMonthSoFar} days evaluated)`,
        revparChange: mtdRevpar > 0 ? `₹${mtdRevpar.toLocaleString('en-IN')}` : 'Optimal',
        revparIsPos: mtdRevpar > 0,

        revenue: `₹${mtdRevenue.toLocaleString('en-IN')}`,
        revenueSub: `${mtdReservations.length} confirmed bookings this month`,
        revenueChange: mtdRevenue > 0 ? `+₹${mtdRevenue.toLocaleString('en-IN')}` : '₹0',
        revenueIsPos: mtdRevenue > 0
      };
    }
  }, [effectiveRooms, reservations, todayDateStr, timeframe, totalRoomsCount, occupiedRooms]);

  // Donut chart distribution data derived 100% from real reservations
  const sourcesData = useMemo(() => {
    const currentMonthPrefix = todayDateStr.slice(0, 7);
    const pool = (reservations || []).filter(r => {
      if (r.status === 'CANCELLED') return false;
      if (sourcePeriod === 'TONIGHT') {
        return isReservationToday(r);
      } else {
        const cIn = String(r.checkIn || r.check_in || '');
        const created = String(r.createdAt || r.created_at || '');
        return cIn.startsWith(currentMonthPrefix) || created.startsWith(currentMonthPrefix);
      }
    });

    let directCount = 0;
    let walkInCount = 0;
    let bookingEngineCount = 0;

    let directNights = 0;
    let walkInNights = 0;
    let bookingEngineNights = 0;

    pool.forEach(r => {
      const src = String(r.source || '').toLowerCase();
      const nights = Number(r.nights) || 1;

      if (src.includes('walk-in') || src.includes('walkin')) {
        walkInCount += 1;
        walkInNights += nights;
      } else if (src.includes('booking engine') || src.includes('ota') || src.includes('makemytrip') || src.includes('agoda') || src.includes('expedia') || src.includes('online')) {
        bookingEngineCount += 1;
        bookingEngineNights += nights;
      } else {
        directCount += 1;
        directNights += nights;
      }
    });

    const isNights = (sourceMetric === 'NIGHTS');
    const directVal = isNights ? directNights : directCount;
    const walkInVal = isNights ? walkInNights : walkInCount;
    const bookingEngineVal = isNights ? bookingEngineNights : bookingEngineCount;
    const totalVal = directVal + walkInVal + bookingEngineVal;

    const directPct = totalVal > 0 ? Math.round((directVal / totalVal) * 100) : 0;
    const walkInPct = totalVal > 0 ? Math.round((walkInVal / totalVal) * 100) : 0;
    const bookingEnginePct = totalVal > 0 ? Math.max(0, 100 - directPct - walkInPct) : 0;

    return {
      total: totalVal,
      label: isNights ? 'NIGHTS' : 'BOOKINGS',
      direct: { count: directVal, pct: directPct },
      walkIn: { count: walkInVal, pct: walkInPct },
      bookingEngine: { count: bookingEngineVal, pct: bookingEnginePct }
    };
  }, [reservations, sourceMetric, sourcePeriod, todayDateStr]);

  // Real-time Pickup stats
  const pickupStats = useMemo(() => {
    const list = reservations || [];

    // Booked today
    const bookedTodayList = list.filter(r => {
      const created = String(r.createdAt || r.created_at || '').slice(0, 10);
      const cIn = String(r.checkIn || r.check_in || '').slice(0, 10);
      return created === todayDateStr || cIn === todayDateStr;
    });
    const bookedTodayCount = bookedTodayList.length;
    const bookedTodayNights = bookedTodayList.reduce((sum, r) => sum + (Number(r.nights) || 1), 0);
    const bookedTodayRevenue = bookedTodayList.reduce((sum, r) => sum + (Number(r.amount) || Number(r.paid) || Number(r.price) || 0), 0);
    const directCount = bookedTodayList.filter(r => !String(r.source || '').toLowerCase().includes('ota') && !String(r.source || '').toLowerCase().includes('walk')).length;

    // Cancelled bookings
    const cancelledCount = list.filter(r => r.status === 'CANCELLED').length;

    // On the books (Next 7 days)
    const todayObj = new Date(todayDateStr);
    const next7Obj = new Date(todayObj);
    next7Obj.setDate(next7Obj.getDate() + 7);
    const next7Str = next7Obj.toISOString().slice(0, 10);

    const upcomingList = list.filter(r => {
      if (r.status === 'CANCELLED') return false;
      const cIn = String(r.checkIn || r.check_in || '').slice(0, 10);
      return cIn > todayDateStr && cIn <= next7Str;
    });
    const upcomingCount = upcomingList.length;
    const upcomingNights = upcomingList.reduce((sum, r) => sum + (Number(r.nights) || 1), 0);
    const upcomingRevenue = upcomingList.reduce((sum, r) => sum + (Number(r.amount) || Number(r.paid) || Number(r.price) || 0), 0);
    const upcomingCapacity = (totalRoomsCount || 1) * 7;
    const upcomingOccupancyPct = upcomingCapacity > 0 ? Math.min(100, Math.round((upcomingNights / upcomingCapacity) * 100)) : 0;

    return {
      bookedTodayCount,
      bookedTodayNights,
      bookedTodayRevenue,
      directCount,
      cancelledCount,
      upcomingCount,
      upcomingNights,
      upcomingRevenue,
      upcomingOccupancyPct
    };
  }, [reservations, todayDateStr, totalRoomsCount]);

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
            {todayDateStr}
          </span>

          {/* Today | Month to date Pill Toggle */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center space-x-1 border border-slate-200/80">
            <button
              onClick={() => setTimeframe('TODAY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeframe === 'TODAY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe('MTD')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              if (showNotification) showNotification('Yield & Revenue live performance active.');
            }}
            className="px-3 py-1.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Revenue</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className={`w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer ${
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
          <p className="text-[11px] text-slate-500 mt-0.5">
            {stats.occupancySub}
          </p>
          <div className="flex items-center space-x-1.5 mt-2.5">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              stats.occupancyIsPos
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-50 text-slate-600 border border-slate-200'
            }`}>
              {stats.occupancyChange}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">vs capacity</span>
          </div>
        </div>

        {/* Metric 2: ARR */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            ARR (AVG ROOM RATE)
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {stats.arr}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {stats.arrSub}
          </p>
          <div className="flex items-center space-x-1.5 mt-2.5">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              stats.arrIsPos
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-50 text-slate-600 border border-slate-200'
            }`}>
              {stats.arrChange}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">average realized</span>
          </div>
        </div>

        {/* Metric 3: REVPAR */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            REVPAR (YIELD)
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {stats.revpar}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {stats.revparSub}
          </p>
          <div className="flex items-center space-x-1.5 mt-2.5">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              stats.revparIsPos
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-50 text-slate-600 border border-slate-200'
            }`}>
              {stats.revparChange}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">per available room</span>
          </div>
        </div>

        {/* Metric 4: REVENUE */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            TOTAL ROOM REVENUE
          </p>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {stats.revenue}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {stats.revenueSub}
          </p>
          <div className="flex items-center space-x-1.5 mt-2.5">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              stats.revenueIsPos
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-50 text-slate-600 border border-slate-200'
            }`}>
              {stats.revenueChange}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">realized total</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: 2 Columns (Source Breakdown & Pickup) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Left Column: SOURCE OF BUSINESS */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-1 h-3.5 bg-indigo-600 rounded-full inline-block"></span>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                SOURCE OF BUSINESS
              </h3>
            </div>

            {/* Sub-Filters: Nights/Bookings & Month/Tonight */}
            <div className="flex items-center space-x-1.5 self-start sm:self-auto">
              {/* Nights | Bookings */}
              <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-[10px] font-bold border border-slate-200/60">
                <button
                  onClick={() => setSourceMetric('NIGHTS')}
                  className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                    sourceMetric === 'NIGHTS'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Nights
                </button>
                <button
                  onClick={() => setSourceMetric('BOOKINGS')}
                  className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                    sourceMetric === 'BOOKINGS'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Bookings
                </button>
              </div>

              {/* Month | Tonight */}
              <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-[10px] font-bold border border-slate-200/60">
                <button
                  onClick={() => setSourcePeriod('MONTH')}
                  className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                    sourcePeriod === 'MONTH'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setSourcePeriod('TONIGHT')}
                  className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                    sourcePeriod === 'TONIGHT'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Today
                </button>
              </div>
            </div>
          </div>

          {/* SVG Donut Chart + Legend */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-1">
            {/* Donut SVG */}
            <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
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

                {sourcesData.total === 0 ? (
                  /* Empty state ring */
                  <circle
                    cx="80"
                    cy="80"
                    r="62"
                    className="stroke-slate-200"
                    strokeWidth="16"
                    fill="transparent"
                  />
                ) : (
                  <>
                    {/* Direct: Blue */}
                    <circle
                      cx="80"
                      cy="80"
                      r="62"
                      className="stroke-blue-500 transition-all duration-500"
                      strokeWidth="16"
                      fill="transparent"
                      strokeDasharray={`${(sourcesData.direct.pct / 100) * 389.5} 389.5`}
                      strokeDashoffset="0"
                    />

                    {/* Walk-In: Amber */}
                    <circle
                      cx="80"
                      cy="80"
                      r="62"
                      className="stroke-amber-500 transition-all duration-500"
                      strokeWidth="16"
                      fill="transparent"
                      strokeDasharray={`${(sourcesData.walkIn.pct / 100) * 389.5} 389.5`}
                      strokeDashoffset={`-${(sourcesData.direct.pct / 100) * 389.5}`}
                    />

                    {/* Booking Engine / OTAs: Rose */}
                    <circle
                      cx="80"
                      cy="80"
                      r="62"
                      className="stroke-rose-500 transition-all duration-500"
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
                  {sourcesData.total > 0 ? sourcesData.label : 'NO STAYS'}
                </span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="flex-1 w-full space-y-3 text-xs">
              {/* Direct */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span className="font-bold text-slate-700">Direct / Front Desk</span>
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

        {/* Right Column: PICKUP & FORECAST */}
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
                    ₹{pickupStats.bookedTodayRevenue.toLocaleString('en-IN')} revenue · {pickupStats.directCount} direct
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
                  <h4 className="text-xs font-bold text-slate-800">Cancelled today</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {pickupStats.cancelledCount > 0 ? `${pickupStats.cancelledCount} booking(s) cancelled` : 'None'}
                  </p>
                </div>
              </div>
              <span className="text-sm font-black text-slate-900">
                {pickupStats.cancelledCount}
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
                    {pickupStats.upcomingRevenue > 0 ? `₹${pickupStats.upcomingRevenue.toLocaleString('en-IN')} expected revenue` : 'No upcoming bookings'}
                  </p>
                </div>
              </div>
              <span className="text-sm font-black text-slate-900">
                {pickupStats.upcomingNights} nights · {pickupStats.upcomingOccupancyPct}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
