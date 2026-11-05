import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  CalendarClock, 
  HelpCircle, 
  TrendingUp, 
  Clock, 
  ArrowUp, 
  Info,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import '../../utils/chartSetup';

export default function PickupPaceTab() {
  const { data } = useDashboard();
  const { pickup14Days, pace28Days, paceSummary, leadTimeDistribution } = data;
  const [showCalculationHelp, setShowCalculationHelp] = useState(false);

  // Lead Time Distribution Chart
  const leadTimeLabels = leadTimeDistribution.buckets.map(b => b.label);
  const leadTimeChartData = {
    labels: leadTimeLabels,
    datasets: [
      {
        label: 'Rooms Booked',
        data: leadTimeDistribution.buckets.map(b => b.rooms),
        backgroundColor: [
          '#4f46e5',
          '#6366f1',
          '#818cf8',
          '#a5b4fc',
          '#c7d2fe',
          '#e0e7ff'
        ],
        borderRadius: 6
      }
    ]
  };

  const leadTimeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const bucket = leadTimeDistribution.buckets[ctx.dataIndex];
            return `${bucket.rooms} rooms (${bucket.percentage}%)`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#f1f5f9' } }
    }
  };

  // Pace 28 days chart
  const paceLabels = [...pace28Days].reverse().map(p => `D-${p.daysBeforeArrival}`);
  const paceChartData = {
    labels: paceLabels,
    datasets: [
      {
        label: 'Current Year (2026)',
        data: [...pace28Days].reverse().map(p => p.currentYearRooms),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 2.5
      },
      {
        label: 'Last Year (2025)',
        data: [...pace28Days].reverse().map(p => p.priorYearRooms),
        borderColor: '#94a3b8',
        borderDash: [5, 5],
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0
      }
    ]
  };

  const paceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', align: 'end' }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } }
    }
  };

  // Format date helper
  const formatDateLabel = (dateStr, idx) => {
    const d = new Date(dateStr);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const isToday = idx === 0;
    return {
      formatted: `${dayName}, ${dayNum} ${month}`,
      isToday
    };
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Active Booking Additions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Active Booking Additions — Next 14 Days
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Next 14 Days Rolling Window
            </p>
          </div>

          <button
            onClick={() => setShowCalculationHelp(!showCalculationHelp)}
            className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition self-start sm:self-auto"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>How is this calculated?</span>
          </button>
        </div>

        {/* Calculation explainer banner */}
        {showCalculationHelp && (
          <div className="my-3 p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-start space-x-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Calculation Methodology:</p>
              <p className="mt-0.5 text-indigo-800">
                Compares current-active room nights created before today against current-active room nights on-books now.
                Historical cancellations cannot be reconstructed without persisted daily snapshots.
              </p>
            </div>
          </div>
        )}

        {/* Table of 14 Days */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 font-bold">DATE</th>
                <th className="py-3 px-4 font-bold text-right">ACTIVE ROB BEFORE TODAY</th>
                <th className="py-3 px-4 font-bold text-right">ACTIVE ROB NOW</th>
                <th className="py-3 px-4 font-bold text-right">NEW ACTIVE ROOMS</th>
                <th className="py-3 px-4 font-bold text-right">CUMULATIVE ADDITIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pickup14Days.map((row, idx) => {
                const dateInfo = formatDateLabel(row.date, idx);
                const hasPickup = row.netPickup > 0;
                return (
                  <tr 
                    key={row.date} 
                    className={`hover:bg-slate-50/80 transition ${dateInfo.isToday ? 'bg-amber-50/40 font-medium' : ''}`}
                  >
                    <td className="py-3 px-4 text-slate-900 flex items-center space-x-2">
                      <span>{dateInfo.formatted}</span>
                      {dateInfo.isToday && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                          Today
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono">
                      {row.roomsOnBooksYesterday}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-900 font-mono font-semibold">
                      {row.roomsOnBooksToday}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {hasPickup ? (
                        <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold text-xs">
                          +{row.netPickup}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-indigo-600">
                      +{row.cumulativePickup || 4}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Booking Pace — Current Year vs Last Year */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            Booking Pace — Current Year vs Last Year
          </h2>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
          {/* Card 1 */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              ROOMS ON BOOKS — NEXT 28 DAYS
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">
                {paceSummary.roomsOnBooks28d}
              </span>
              <span className="text-xs text-slate-500">
                (Current)
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              LY comparable window: <span className="font-semibold text-slate-700">{paceSummary.priorYear28d}</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block font-medium">
              {paceSummary.comparisonStatus}
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              BOOKING VELOCITY — NEXT 28-DAY WINDOW
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-extrabold text-indigo-600">
                {paceSummary.velocity}
              </span>
              <span className="text-xs text-slate-500">
                rooms/day
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Previous week: <span className="font-semibold text-slate-700">{paceSummary.prevWeekVelocity} rooms/day</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 bg-slate-200/60 px-2 py-1 rounded inline-block">
              Comparison unavailable vs previous week
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              LEAD TIME DISTRIBUTION — LAST 12 MONTHS
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-extrabold text-emerald-600">
                {leadTimeDistribution.totalRooms.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">
                bookings analysed
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              <span className="font-bold text-slate-800">91%</span> booked within 0–3 days of arrival
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block font-medium">
              High last-minute walk-in velocity
            </div>
          </div>
        </div>

        {/* Charts: Lead Time Breakdown & Pace Curve */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pt-4 border-t border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Lead Time Distribution (Days in advance)
            </h3>
            <div className="h-60">
              <Bar data={leadTimeChartData} options={leadTimeChartOptions} />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Cumulative Booking Pace Curve (Next 28 Days)
            </h3>
            <div className="h-60">
              <Line data={paceChartData} options={paceChartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

