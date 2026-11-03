import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar, 
  Sparkles, 
  Activity, 
  Layers, 
  ShieldCheck, 
  Check, 
  RotateCcw,
  Sliders,
  Info
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import '../../utils/chartSetup';

export default function DemandForecastTab() {
  const { 
    data, 
    addForecastOverride, 
    setIsMonitoringModalOpen 
  } = useDashboard();

  const { demandForecast } = data;
  const { 
    period, 
    modelInfo, 
    accuracy, 
    demandSignals, 
    occupancyForecast, 
    weeklyRevenueForecast, 
    manualOverrides 
  } = demandForecast;

  // Manual Override Form State
  const [fromDate, setFromDate] = useState('2026-11-10');
  const [toDate, setToDate] = useState('2026-11-15');
  const [adjustedOccupancy, setAdjustedOccupancy] = useState('35');
  const [reason, setReason] = useState('Local Event');
  const [customReason, setCustomReason] = useState('');

  const handleApplyOverride = (e) => {
    e.preventDefault();
    const finalReason = reason === 'Other' ? customReason : reason;
    addForecastOverride({
      fromDate,
      toDate,
      adjustedOccupancy: Number(adjustedOccupancy),
      reason: finalReason
    });
  };

  // 90-Day Occupancy Forecast Chart
  const sampleDates = occupancyForecast.map(item => {
    const parts = item.date.split('-');
    return `${parts[2]}/${parts[1]}`;
  });

  const forecastChartData = {
    labels: sampleDates,
    datasets: [
      {
        label: 'Upper Band (80th Percentile)',
        data: occupancyForecast.map(i => i.upperBand),
        borderColor: 'transparent',
        backgroundColor: 'rgba(79, 70, 229, 0.12)',
        fill: '+1',
        pointRadius: 0
      },
      {
        label: 'Lower Band (20th Percentile)',
        data: occupancyForecast.map(i => i.lowerBand),
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        fill: false,
        pointRadius: 0
      },
      {
        label: 'Deterministic Forecast (%)',
        data: occupancyForecast.map(i => i.forecast),
        borderColor: '#4f46e5',
        backgroundColor: '#4f46e5',
        borderWidth: 2.5,
        tension: 0.25,
        fill: false,
        pointRadius: (ctx) => (ctx.dataIndex % 7 === 0 ? 3 : 0),
        pointHoverRadius: 6
      },
      {
        label: 'On-Books Rooms (%)',
        data: occupancyForecast.map(i => i.onBooks),
        borderColor: '#06b6d4',
        borderDash: [4, 4],
        borderWidth: 1.8,
        tension: 0.2,
        fill: false,
        pointRadius: 0
      }
    ]
  };

  const forecastChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          filter: (legendItem) => legendItem.text.includes('Forecast') || legendItem.text.includes('On-Books') || legendItem.text.includes('Upper Band'),
          boxWidth: 12,
          font: { size: 10 }
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw).toFixed(1)}%`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 14, font: { size: 10 } }
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (val) => `${val}%`,
          font: { size: 10 }
        },
        min: 0,
        max: 60
      }
    }
  };

  // Weekly Revenue Forecast (W1 to W12)
  const weeklyLabels = weeklyRevenueForecast.map(w => w.week);
  const weeklyChartData = {
    labels: weeklyLabels,
    datasets: [
      {
        label: 'Confirmed Room Revenue (₹)',
        data: weeklyRevenueForecast.map(w => w.revenue),
        backgroundColor: '#4f46e5',
        borderRadius: 4
      }
    ]
  };

  const weeklyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Revenue: ₹${Number(ctx.raw).toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (val) => `₹${(val / 1000).toFixed(0)}k`
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 90-Day Occupancy Forecast Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                90-Day Occupancy Forecast
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {period}
            </p>
          </div>

          <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-900">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Method {modelInfo.method} · {modelInfo.historicalDays} historical inventory days ({modelInfo.historicalRange})</span>
          </div>
        </div>

        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-xs text-slate-600 leading-relaxed">
          {modelInfo.description}
        </div>

        <div className="h-80 mt-5">
          <Line data={forecastChartData} options={forecastChartOptions} />
        </div>
      </div>

      {/* Grid: Forecast Accuracy & Monitoring Trials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Forecast Accuracy */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Forecast Accuracy — Completed Stay Dates
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Compares immutable nightly forecast snapshots with the first available completed-date occupancy, frozen when evaluated. Results are separated by lead time so a same-day forecast is not mixed with a D-60 forecast. This evidence does not automatically change factor weights or rates.
            </p>
          </div>

          {/* 4 Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="text-2xl font-extrabold text-slate-900">
                {accuracy.snapshotsEvaluated}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Estimator snapshots evaluated
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="text-2xl font-extrabold text-slate-900">
                {accuracy.manualOverridesEvaluated}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Manual overrides evaluated separately
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="text-2xl font-extrabold text-indigo-600">
                {accuracy.mae} pts
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Estimator mean absolute error
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="text-2xl font-extrabold text-emerald-600">
                {accuracy.insideBandPercent}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Inside empirical band (6)
              </div>
            </div>
          </div>

          {/* Accuracy Table */}
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase text-[11px] font-sans border-b border-slate-200">
                  <th className="py-2.5 px-3 font-bold">Lead time</th>
                  <th className="py-2.5 px-3 font-bold text-right">Evaluated</th>
                  <th className="py-2.5 px-3 font-bold text-right">MAE</th>
                  <th className="py-2.5 px-3 font-bold text-right">Inside range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accuracy.leadTimeBuckets.map(b => (
                  <tr key={b.bucket} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                      {b.bucket}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      {b.evaluated}
                    </td>
                    <td className="py-2.5 px-3 text-right text-indigo-600 font-bold">
                      {b.mae} pts
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                      {b.insideRange}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Forecast Monitoring Trials */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Forecast Monitoring Trials
                </h3>
              </div>
              <button
                onClick={() => setIsMonitoringModalOpen(true)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 transition"
              >
                Monitoring
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Records an RM-declared previous weight against the verified current saved property-wide factor weight, then monitors immutable forecast error at one exact lead day. A flag is raised only after the configured minimum evidence and consecutive-date breach rules are both met.
            </p>

            <div className="mt-3 p-3 bg-amber-50/70 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
              This is association monitoring, not causal proof. It never changes, dampens or restores a factor or rate. Room-specific monitoring is unavailable until room-level forecast snapshots exist.
            </div>

            <div className="mt-6 p-6 border-2 border-dashed border-slate-200 rounded-xl text-center">
              <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-600">
                No monitoring trials have been recorded.
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Configure factor trials to monitor accuracy deltas over upcoming seasons.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: On-books Stay Revenue & Demand Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* On-books stay revenue */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              On-books stay revenue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Next 12 weeks · Nov 3, 2026 – Jan 25, 2027
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Confirmed room revenue spread across occupied stay nights. This is not a statistical forecast.
            </p>
          </div>

          <div className="h-64 mt-4">
            <Bar data={weeklyChartData} options={weeklyChartOptions} />
          </div>
        </div>

        {/* Demand Signals */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Demand Signals
              </h3>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                {demandSignals.length} Active Signals
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {demandSignals.map(sig => (
                <div 
                  key={sig.id}
                  className={`p-3.5 rounded-xl border ${
                    sig.severity === 'MEDIUM' 
                      ? 'bg-amber-50/50 border-amber-200' 
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {sig.icon === 'trending_down' ? (
                        <TrendingDown className="w-4 h-4 text-rose-500" />
                      ) : (
                        <Calendar className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="text-xs font-bold text-slate-900">
                        {sig.type}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      sig.severity === 'MEDIUM' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {sig.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    {sig.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Manual Override Form */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            Forecast Manual Override
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manual overrides will adjust the forecast for the selected date range. Changes are logged for audit purposes.
          </p>
        </div>

        <form onSubmit={handleApplyOverride} className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              From Date
            </label>
            <input 
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              To Date
            </label>
            <input 
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adjusted Occupancy %
            </label>
            <input 
              type="number"
              min="0"
              max="100"
              value={adjustedOccupancy}
              onChange={(e) => setAdjustedOccupancy(e.target.value)}
              placeholder="e.g. 35"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Local Event">Local Event</option>
              <option value="Wedding Season">Wedding Season</option>
              <option value="Corporate Conference">Corporate Conference</option>
              <option value="Property Renovation">Property Renovation</option>
              <option value="Competitor Rate War">Competitor Rate War</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition"
            >
              Apply Override
            </button>
          </div>
        </form>

        {/* Audit Log of Manual Overrides */}
        {manualOverrides && manualOverrides.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Active Manual Overrides ({manualOverrides.length})
            </h4>
            <div className="space-y-2">
              {manualOverrides.map(ovr => (
                <div key={ovr.id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{ovr.adjustedOccupancy}% Occupancy</span>
                    <span className="text-slate-500 mx-2">·</span>
                    <span className="font-mono text-slate-700">{ovr.fromDate} to {ovr.toDate}</span>
                    <span className="text-slate-500 mx-2">·</span>
                    <span className="text-indigo-600 font-medium">{ovr.reason}</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold uppercase">
                    Active Override
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

