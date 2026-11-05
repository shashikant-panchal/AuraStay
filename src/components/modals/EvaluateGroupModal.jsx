import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  X, 
  Calculator, 
  Split, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertTriangle,
  Building,
  Calendar,
  Save
} from 'lucide-react';

export default function EvaluateGroupModal() {
  const { 
    isEvaluateGroupModalOpen, 
    setIsEvaluateGroupModalOpen, 
    data, 
    saveGroupEvaluation 
  } = useDashboard();

  const { displacement, kpis } = data;
  const { inventoryRooms } = displacement;

  const [groupName, setGroupName] = useState('Tech Mahindra Annual Offsite');
  const [checkIn, setCheckIn] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [rooms, setRooms] = useState(15);
  const [rate, setRate] = useState(2800);
  const [ancillary, setAncillary] = useState(30000);
  const [washRate, setWashRate] = useState(5);
  const [transientAdr, setTransientAdr] = useState(3748);
  const [expectedTransientOcc, setExpectedTransientOcc] = useState(75);

  if (!isEvaluateGroupModalOpen) return null;

  // Calculate nights
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const diffTime = Math.abs(d2 - d1);
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))) || 1;

  // Real-time metrics
  const effectiveRooms = Math.round(rooms * (1 - washRate / 100));
  const groupRoomRevenue = effectiveRooms * rate * nights;
  const totalGroupValue = groupRoomRevenue + Number(ancillary);

  // Transient capacity analysis
  const expectedTransientRooms = Math.round((inventoryRooms * (expectedTransientOcc / 100)));
  const totalDemand = expectedTransientRooms + effectiveRooms;
  const displacedRoomsPerNight = Math.max(0, totalDemand - inventoryRooms);
  const totalDisplacedRooms = displacedRoomsPerNight * nights;
  const displacedTransientRevenue = totalDisplacedRooms * transientAdr;

  const netImpact = totalGroupValue - displacedTransientRevenue;
  const isFavorable = netImpact >= 0;

  const handleSave = (e) => {
    e.preventDefault();
    saveGroupEvaluation({
      groupName,
      checkIn,
      checkOut,
      rooms: Number(rooms),
      rate: Number(rate),
      ancillary: Number(ancillary),
      washRate: Number(washRate),
      transientAdr: Number(transientAdr),
      displacedRooms: totalDisplacedRooms,
      totalGroupValue,
      displacedRevenue: displacedTransientRevenue,
      netImpact,
      decision: isFavorable ? 'ACCEPTED' : 'DECLINED'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Evaluate Group Opportunity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic Group vs Transient Displacement Calculator
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEvaluateGroupModalOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Recommendation Badge */}
        <div className={`px-6 py-3 border-b flex items-center justify-between text-xs font-bold ${
          isFavorable 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-center space-x-2">
            {isFavorable ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>RECOMMENDATION: {isFavorable ? 'COMMERCIALLY FAVORABLE (ACCEPT)' : 'DISPLACEMENT LOSS (REVISE OR DECLINE)'}</span>
          </div>

          <div className="font-mono text-sm">
            Net Impact: {netImpact >= 0 ? '+' : ''}₹{Math.round(netImpact).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Group Proposal Inputs */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              1. Group Proposal Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Group / Corporate Opportunity Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Check-out Date ({nights} Nights)
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contracted Rooms
                </label>
                <input
                  type="number"
                  min="1"
                  max={inventoryRooms}
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quoted Room Rate (₹ / night)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="50"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ancillary Revenue (F&B / Banquets ₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={ancillary}
                  onChange={(e) => setAncillary(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wash Rate Assumption (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={washRate}
                  onChange={(e) => setWashRate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Transient Demand Assumptions */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              2. RM Transient Demand Baseline
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Transient ADR (₹)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="50"
                  value={transientAdr}
                  onChange={(e) => setTransientAdr(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Current property ADR baseline: ₹{(data?.kpis?.adr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Transient Occupancy (%)
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={expectedTransientOcc}
                  onChange={(e) => setExpectedTransientOcc(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Physical capacity: {inventoryRooms} total property rooms
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Financial Synthesis Matrix */}
          <div className="bg-slate-900 text-white p-5 rounded-xl space-y-3 font-mono text-xs">
            <div className="text-slate-400 uppercase tracking-wider text-[11px] font-sans font-bold">
              Displacement Financial Breakdown
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-300">Total Group Gross Value (Rooms + F&B):</span>
              <span className="font-bold text-indigo-300">₹{totalGroupValue.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-300">Displaced Transient Room Nights:</span>
              <span className="font-bold text-amber-300">{totalDisplacedRooms} nights</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-300">Displaced Transient Opportunity Cost:</span>
              <span className="font-bold text-rose-300">-₹{Math.round(displacedTransientRevenue).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between pt-2 text-sm">
              <span className="font-sans font-bold text-white">Net Commercial Value:</span>
              <span className={`font-extrabold ${netImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netImpact >= 0 ? '+' : ''}₹{Math.round(netImpact).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsEvaluateGroupModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Snapshot to Decision Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

