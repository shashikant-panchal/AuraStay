import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  AlertCircle, 
  RotateCw, 
  ArrowUpRight, 
  TrendingUp, 
  BedDouble, 
  IndianRupee, 
  Percent, 
  Calendar,
  ExternalLink,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import '../../utils/chartSetup';

export default function OverviewTab() {
  const { 
    data, 
    setIsEvidenceModalOpen, 
    refreshData, 
    isRefreshing 
  } = useDashboard();

  const { kpis, todayActions, revenueTrend30Days, adrOccupancy14Days } = data;

  // Revenue Trend 30 Days Chart
  const revenueLabels = revenueTrend30Days.map(item => {
    const parts = item.date.split('-');
    return `${parts[2]}/${parts[1]}`;
  });

  const revenueChartData = {
    labels: revenueLabels,
    datasets: [
      {
        label: 'Room Revenue (₹)',
        data: revenueTrend30Days.map(i => i.roomRevenue),
        backgroundColor: 'rgba(79, 70, 229, 0.85)',
        borderRadius: 4,
        stack: 'revenue'
      },
      {
        label: 'Non-Room Revenue (₹)',
        data: revenueTrend30Days.map(i => i.nonRoomRevenue),
        backgroundColor: 'rgba(14, 165, 233, 0.75)',
        borderRadius: 4,
        stack: 'revenue'
      }
    ]
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { boxWidth: 12, font: { size: 11 } }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } }
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (val) => `₹${(val / 1000).toFixed(0)}k`,
          font: { size: 10 }
        }
      }
    }
  };

  // ADR vs Occupancy 14 Days Dual Axis Chart
  const trendLabels = adrOccupancy14Days.map(item => {
    const parts = item.date.split('-');
    return `${parts[2]} Oct/Nov`;
  });

  const adrOccData = {
    labels: trendLabels,
    datasets: [
      {
        type: 'line',
        label: 'ADR (₹)',
        data: adrOccupancy14Days.map(i => i.averageDailyRate),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 2.5,
        tension: 0.3,
        yAxisID: 'yAdr',
        pointRadius: 3,
        pointHoverRadius: 6
      },
      {
        type: 'bar',
        label: 'Occupancy (%)',
        data: adrOccupancy14Days.map(i => i.occupancyRate),
        backgroundColor: 'rgba(16, 185, 129, 0.65)',
        borderRadius: 4,
        yAxisID: 'yOcc',
        barThickness: 16
      }
    ]
  };

  const adrOccOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { boxWidth: 12, font: { size: 11 } }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            if (ctx.dataset.yAxisID === 'yAdr') {
              return `ADR: ₹${Number(ctx.raw).toLocaleString('en-IN')}`;
            }
            return `Occupancy: ${Number(ctx.raw).toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } }
      },
      yAdr: {
        type: 'linear',
        position: 'left',
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (val) => `₹${val}`,
          font: { size: 10 }
        }
      },
      yOcc: {
        type: 'linear',
        position: 'right',
        grid: { display: false },
        ticks: {
          callback: (val) => `${val}%`,
          font: { size: 10 }
        },
        min: 0,
        max: 50
      }
    }
  };

  // RevPAR Trend 14 Days
  const revparData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'RevPAR (₹)',
        data: adrOccupancy14Days.map(i => i.revPar),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        fill: true,
        borderWidth: 2,
        tension: 0.35,
        pointBackgroundColor: '#0284c7',
        pointRadius: 3,
        pointHoverRadius: 6
      }
    ]
  };

  const revparOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `RevPAR: ₹${Number(ctx.raw).toFixed(2)}`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (val) => `₹${val}`,
          font: { size: 10 }
        }
      }
    }
  };

  const pendingAction = todayActions.items[0];

  return (
    <div className="space-y-6">
      {/* Today's Revenue Actions Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-white border border-amber-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-900">
                {todayActions.title}
              </h2>
            </div>
            <p className="text-xs text-amber-800/80 mt-0.5">
              {todayActions.subtitle}
            </p>
          </div>

          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-800 text-xs font-semibold rounded-lg border border-amber-300 shadow-xs transition self-start sm:self-auto"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {pendingAction && (
          <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                {pendingAction.status === 'APPROVED' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : '1'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {pendingAction.title}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    pendingAction.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {pendingAction.status || pendingAction.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {pendingAction.description}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEvidenceModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition shrink-0"
            >
              <span>Open evidence</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* KPI Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>KPI period: {kpis.period}</span>
          </div>
          <span className="text-xs text-slate-400">Values calculated net of GST</span>
        </div>

        {/* 6 Key Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* REVPAR */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-indigo-300 transition group">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              REVPAR
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-1 group-hover:text-indigo-600 transition">
              ₹{kpis.revpar.toFixed(2)}
            </div>
            <div className="flex items-center text-[10px] text-emerald-600 font-medium mt-1">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              <span>Yield on 28 rooms</span>
            </div>
          </div>

          {/* ADR */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-indigo-300 transition group">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              ADR
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-1 group-hover:text-indigo-600 transition">
              ₹{kpis.adr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Avg rate / sold room
            </div>
          </div>

          {/* OCCUPANCY */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-indigo-300 transition group">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              OCCUPANCY
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-1 group-hover:text-indigo-600 transition">
              {kpis.occupancy.toFixed(2)}%
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              203 of 840 room nights
            </div>
          </div>

          {/* TOTAL REVENUE */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-indigo-300 transition group">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              TOTAL REVENUE
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-1 group-hover:text-indigo-600 transition">
              {kpis.totalRevenueFormatted}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              ₹{kpis.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* ROOM NIGHTS SOLD */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-indigo-300 transition group">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              ROOM NIGHTS SOLD
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-1 group-hover:text-indigo-600 transition">
              {kpis.roomNightsSold.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              across 140 bookings
            </div>
          </div>

          {/* GOPPAR */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-indigo-300 transition group">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              GOPPAR
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-1 group-hover:text-indigo-600 transition">
              ₹{kpis.goppar.toFixed(2)}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-1">
              Profit / available room
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section 1: Revenue Trend 30 Days */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Revenue Trend — 30 Days
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Returned period: 5 Oct 2026 – 3 Nov 2026
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
            Gross: ₹9.48L · Net: ₹8.96L
          </div>
        </div>
        <div className="h-72 mt-4">
          <Bar data={revenueChartData} options={revenueChartOptions} />
        </div>
      </div>

      {/* Chart Section 2: Dual Grid (ADR vs Occupancy & RevPAR Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ADR vs Occupancy */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ADR vs Occupancy — 14 Days
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  21 Oct 2026 – 3 Nov 2026 (inclusive)
                </p>
              </div>
            </div>
            <div className="h-64 mt-4">
              <Bar data={adrOccData} options={adrOccOptions} />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            Shows daily ADR realizations plotted against daily physical occupancy percentages.
          </div>
        </div>

        {/* RevPAR Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Your RevPAR Trend — 14 Days
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  21 Oct 2026 – 3 Nov 2026
                </p>
              </div>
            </div>
            <div className="h-64 mt-4">
              <Line data={revparData} options={revparOptions} />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-start space-x-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Calculated from the actual ADR × occupancy response for 21 Oct 2026 – 3 Nov 2026. Market comparison is unavailable until a sourced market series is integrated.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

