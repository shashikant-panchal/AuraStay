import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  PieChart as PieIcon, 
  Building, 
  Layers, 
  BarChart3, 
  Calendar,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import '../../utils/chartSetup';

export default function SegmentationTab() {
  const { data } = useDashboard();
  const { segmentation } = data;
  const { period, topCorporateAccounts, segmentPerformance, channelContribution } = segmentation;

  // Donut chart data for Market Segment
  const segmentDoughnutData = {
    labels: segmentPerformance.map(s => s.segment),
    datasets: [
      {
        data: segmentPerformance.map(s => s.revenue),
        backgroundColor: ['#4f46e5', '#06b6d4'],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6
      }
    ]
  };

  const segmentDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 12, font: { size: 11 } }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const seg = segmentPerformance[ctx.dataIndex];
            return `${seg.segment}: ₹${seg.revenue.toLocaleString('en-IN')} (${seg.mixPercentage}%)`;
          }
        }
      }
    },
    cutout: '65%'
  };

  // Channel contribution 12 months stacked bar chart
  const channelLabels = channelContribution.map(c => c.month);
  const channelChartData = {
    labels: channelLabels,
    datasets: [
      {
        label: 'Walk-in',
        data: channelContribution.map(c => c.walkIn),
        backgroundColor: '#4f46e5',
        stack: 'channel'
      },
      {
        label: 'Corporate',
        data: channelContribution.map(c => c.corporate),
        backgroundColor: '#06b6d4',
        stack: 'channel'
      },
      {
        label: 'Direct Booking Engine',
        data: channelContribution.map(c => c.direct),
        backgroundColor: '#10b981',
        stack: 'channel'
      },
      {
        label: 'OTA (Online Travel Agencies)',
        data: channelContribution.map(c => c.ota),
        backgroundColor: '#f59e0b',
        stack: 'channel'
      }
    ]
  };

  const channelChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', align: 'end', labels: { boxWidth: 12, font: { size: 10 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        stacked: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (val) => `₹${(val / 1000).toFixed(0)}k`,
          font: { size: 10 }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Grid: Market Segment Donut & Top Corporate Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue by Market Segment */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Revenue by Market Segment
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{period}</p>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded font-medium">
                2 Segments
              </span>
            </div>

            <div className="h-56 mt-4 relative flex items-center justify-center">
              <Doughnut data={segmentDoughnutData} options={segmentDoughnutOptions} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              {segmentPerformance.map(seg => (
                <div key={seg.segment} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-[11px] text-slate-500 font-medium">{seg.segment}</div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                    ₹{seg.revenue.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                    {seg.mixPercentage}% mix · {seg.roomNights} nights
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Corporate Accounts */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Top Corporate Accounts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{period}</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Ranked by Revenue
            </span>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-3 font-bold w-10">#</th>
                  <th className="py-2.5 px-3 font-bold">Account</th>
                  <th className="py-2.5 px-3 font-bold text-right">Room Nights</th>
                  <th className="py-2.5 px-3 font-bold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topCorporateAccounts.map(acc => (
                  <tr key={acc.rank} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-bold text-indigo-600">
                      {acc.rank}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 flex items-center space-x-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{acc.account}</span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 font-mono font-medium">
                      {acc.roomNights}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-900 font-mono font-bold">
                      ₹{acc.revenue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Segment Performance Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">
            Segment Performance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {period} · YoY compares the equivalent prior-year period
          </p>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 font-bold">Segment</th>
                <th className="py-3 px-4 font-bold text-right">Room Nights</th>
                <th className="py-3 px-4 font-bold text-right">ADR</th>
                <th className="py-3 px-4 font-bold text-right">Revenue</th>
                <th className="py-3 px-4 font-bold text-right">% Mix</th>
                <th className="py-3 px-4 font-bold text-right">YoY Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {segmentPerformance.map(seg => (
                <tr key={seg.segment} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-sans font-bold text-slate-900">
                    {seg.segment}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    {seg.roomNights}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    ₹{seg.adr.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    ₹{seg.revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-indigo-600">
                    {seg.mixPercentage}%
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {seg.yoyChange}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Channel Contribution 12 Months Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Channel Contribution
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              12 months through 03/11/2026 (latest month is partial)
            </p>
          </div>
        </div>

        <div className="h-72 mt-4">
          <Bar data={channelChartData} options={channelChartOptions} />
        </div>
      </div>
    </div>
  );
}

