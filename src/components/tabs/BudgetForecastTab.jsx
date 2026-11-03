import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Target, 
  Sliders, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  ArrowUpRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import '../../utils/chartSetup';

export default function BudgetForecastTab() {
  const { data, setIsSetBudgetModalOpen } = useDashboard();
  const { budgetForecast } = data;
  const { 
    period, 
    mtdRevenue, 
    revenueTarget, 
    revenueAchievement,
    mtdOccupancy,
    occupancyTarget,
    occupancyAchievement,
    mtdAdr,
    adrTarget,
    adrAchievement,
    varianceLast3Months,
    monthlyComparison 
  } = budgetForecast;

  // Monthly Budget vs Actual Bar Chart
  const monthlyLabels = monthlyComparison.map(m => m.month);
  const monthlyChartData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Budget (₹)',
        data: monthlyComparison.map(m => m.budget),
        backgroundColor: '#cbd5e1',
        borderRadius: 4
      },
      {
        label: 'Actual Stay Revenue (₹)',
        data: monthlyComparison.map(m => m.actual),
        backgroundColor: monthlyComparison.map(m => m.isCurrent ? '#f59e0b' : '#4f46e5'),
        borderRadius: 4
      }
    ]
  };

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', align: 'end' },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ₹${Number(ctx.raw).toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (val) => `₹${(val / 100000).toFixed(1)}L`
        }
      }
    }
  };

  // YTD Cumulative Chart Data
  let cumBudget = 0;
  let cumActual = 0;
  const cumBudgetData = [];
  const cumActualData = [];

  monthlyComparison.forEach(m => {
    cumBudget += m.budget;
    cumBudgetData.push(cumBudget);
    if (m.month !== 'Dec') {
      cumActual += m.actual;
      cumActualData.push(cumActual);
    } else {
      cumActualData.push(null);
    }
  });

  const cumulativeChartData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Cumulative Budget (₹)',
        data: cumBudgetData,
        borderColor: '#94a3b8',
        borderDash: [5, 5],
        borderWidth: 2,
        tension: 0.3,
        fill: false
      },
      {
        label: 'Cumulative Actual (₹)',
        data: cumActualData,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        borderWidth: 2.5,
        tension: 0.3
      }
    ]
  };

  const cumulativeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', align: 'end' }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (val) => `₹${(val / 100000).toFixed(0)}L`
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Set Monthly Budgets Button */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Budget & Forecast
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Set monthly accommodation targets and compare completed periods with actual performance.
          </p>
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1 font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{period}</span>
          </div>
        </div>

        <button
          onClick={() => setIsSetBudgetModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition self-start md:self-auto"
        >
          <Sliders className="w-4 h-4" />
          <span>Set Monthly Budgets</span>
        </button>
      </div>

      {/* 3 Performance Target Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* MTD Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            MTD Revenue
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            ₹{mtdRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            of ₹{(revenueTarget / 100000).toFixed(1)}L full-month target
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-indigo-600">{revenueAchievement}% achieved</span>
              <span className="text-slate-400">Target ₹{(revenueTarget / 100000).toFixed(1)}L</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(revenueAchievement, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* MTD Occupancy */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            MTD Occupancy
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {mtdOccupancy.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            of {occupancyTarget.toFixed(1)}% target
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-emerald-600">{occupancyAchievement.toFixed(1)}% of target</span>
              <span className="text-slate-400">Target {occupancyTarget}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(occupancyAchievement, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* MTD ADR */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            MTD ADR
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            ₹{mtdAdr.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            of ₹{adrTarget.toLocaleString('en-IN')} target
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-indigo-600 font-extrabold">{adrAchievement.toFixed(2)}% of target</span>
              <span className="text-emerald-600 text-[11px] font-semibold">+13.93% outperforming</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: '100%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart: Budget vs Actual Stay Revenue — Monthly */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Budget vs Actual Stay Revenue — Monthly
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nov actual is month-to-date; budget is full-month
            </p>
          </div>
          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
            Active Month: November
          </span>
        </div>

        <div className="h-72 mt-4">
          <Bar data={monthlyChartData} options={monthlyChartOptions} />
        </div>
      </div>

      {/* Grid: Cumulative Stay Revenue + Budget Variance Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cumulative chart */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              YTD Cumulative Stay Revenue — Actual vs Configured Budget
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks cumulative financial achievement through 2026
            </p>
          </div>

          <div className="h-64 mt-4">
            <Line data={cumulativeChartData} options={cumulativeChartOptions} />
          </div>
        </div>

        {/* Budget Variance Table */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Budget Variance — Last 3 Completed Months
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison on completed calendar months
              </p>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[11px] font-sans border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold">Month</th>
                    <th className="py-2.5 px-3 font-bold text-right">Budget</th>
                    <th className="py-2.5 px-3 font-bold text-right">Actual</th>
                    <th className="py-2.5 px-3 font-bold text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {varianceLast3Months.map(v => (
                    <tr key={v.month} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-sans font-bold text-slate-900">
                        {v.month}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 font-medium">
                        {v.budgetFormatted}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {v.actualFormatted}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-bold">
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                          {v.variance}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500">
            Set budgets for completed months to see real variance. Forecast accuracy will remain unavailable until historical forecast snapshots are persisted.
          </div>
        </div>
      </div>
    </div>
  );
}

