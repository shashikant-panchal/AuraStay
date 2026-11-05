import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  LayoutGrid, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  RefreshCw, 
  Lock, 
  Unlock, 
  AlertCircle,
  Filter,
  Check
} from 'lucide-react';

export default function AriGridView() {
  const { showNotification } = useDashboard();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayOfWeek = d.getDay();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return {
      date: `${yyyy}-${mm}-${dd}`,
      day: dayNames[dayOfWeek],
      label: `${dd} ${monthNames[d.getMonth()]}`,
      weekend: dayOfWeek === 0 || dayOfWeek === 6
    };
  });

  const [gridData, setGridData] = useState([]);

  const toggleStopSell = (catIdx, dayIdx) => {
    setGridData(prev => {
      const copy = [...prev];
      const row = { ...copy[catIdx] };
      row.stopSell = [...row.stopSell];
      row.stopSell[dayIdx] = !row.stopSell[dayIdx];
      copy[catIdx] = row;
      return copy;
    });
    showNotification('Stop Sell status updated.');
  };

  const handleSaveGrid = () => {
    showNotification('ARI Grid synchronization sent to all connected OTAs & Booking Engine.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <LayoutGrid className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">
              ARI Grid (Availability, Rates & Inventory)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-day distribution matrix across all room categories and connected channels.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1 border border-slate-200 text-xs">
            <button className="p-1 hover:bg-white rounded transition text-slate-600">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-slate-800">{days[0]?.label} – {days[6]?.label} {new Date().getFullYear()}</span>
            <button className="p-1 hover:bg-white rounded transition text-slate-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSaveGrid}
            className="flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>Publish ARI Matrix</span>
          </button>
        </div>
      </div>

      {/* Grid Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-3.5 font-bold uppercase tracking-wider text-[11px] w-48 border-r border-slate-800">
                  Room Category / Metrics
                </th>
                {days.map(d => (
                  <th 
                    key={d.date} 
                    className={`p-3 text-center border-r border-slate-800 min-w-[110px] ${
                      d.weekend ? 'bg-indigo-950/70 text-indigo-200' : ''
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold tracking-wider">{d.day}</div>
                    <div className="text-sm font-black">{d.label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridData.length === 0 ? (
                <tr>
                  <td colSpan={days.length + 1} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <LayoutGrid className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="font-bold text-slate-700">No Room Categories Configured</p>
                      <p className="text-xs text-slate-400 mt-0.5">Configure room categories to view and publish your multi-day ARI distribution matrix.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                gridData.map((row, catIdx) => (
                <React.Fragment key={row.category}>
                  {/* Category Header Row */}
                  <tr className="bg-slate-100/80 border-t border-b border-slate-300 font-bold text-slate-800">
                    <td colSpan={days.length + 1} className="px-3.5 py-2 text-xs flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{row.category}</span>
                      <span className="text-[11px] text-slate-500 font-normal">Total Inventory: {row.totalRooms} keys</span>
                    </td>
                  </tr>

                  {/* Available Inventory Row */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/30">
                      Available Rooms
                    </td>
                    {row.avail.map((cnt, dayIdx) => (
                      <td key={dayIdx} className="p-2 text-center border-r border-slate-200">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          cnt === 0 ? 'bg-rose-100 text-rose-700' :
                          cnt <= 2 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {cnt} left
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Base Rate Row */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/30">
                      Base Rate (₹)
                    </td>
                    {row.rates.map((rate, dayIdx) => (
                      <td key={dayIdx} className="p-2 text-center border-r border-slate-200 font-mono font-bold text-slate-900">
                        ₹{rate.toLocaleString('en-IN')}
                      </td>
                    ))}
                  </tr>

                  {/* Min Stay Row */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/30">
                      Min Stay (MLOS)
                    </td>
                    {row.minStay.map((ms, dayIdx) => (
                      <td key={dayIdx} className="p-2 text-center border-r border-slate-200 text-slate-600 font-medium">
                        {ms} {ms === 1 ? 'night' : 'nights'}
                      </td>
                    ))}
                  </tr>

                  {/* Stop Sell Row */}
                  <tr className="border-b-2 border-slate-200 hover:bg-slate-50/50 bg-slate-50/20">
                    <td className="p-3 font-semibold text-slate-700 border-r border-slate-200 bg-slate-50/30">
                      Stop Sell Status
                    </td>
                    {row.stopSell.map((isStopped, dayIdx) => (
                      <td key={dayIdx} className="p-2 text-center border-r border-slate-200">
                        <button
                          onClick={() => toggleStopSell(catIdx, dayIdx)}
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition flex items-center justify-center space-x-1 mx-auto ${
                            isStopped 
                              ? 'bg-rose-600 text-white' 
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          }`}
                        >
                          {isStopped ? <Lock className="w-3 h-3 mr-0.5" /> : <Unlock className="w-3 h-3 mr-0.5" />}
                          <span>{isStopped ? 'STOPPED' : 'OPEN'}</span>
                        </button>
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

