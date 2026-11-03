import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { X, Activity, Sliders, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function MonitoringModal() {
  const { isMonitoringModalOpen, setIsMonitoringModalOpen, showNotification } = useDashboard();
  const [factor, setFactor] = useState('SEASON');
  const [leadDay, setLeadDay] = useState('D7');
  const [declaredWeight, setDeclaredWeight] = useState('1.25');

  if (!isMonitoringModalOpen) return null;

  const handleStartTrial = (e) => {
    e.preventDefault();
    showNotification(`Monitoring trial initiated for factor ${factor} at ${leadDay} (Declared weight: ${declaredWeight}x).`);
    setIsMonitoringModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Forecast Monitoring Trials
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Association monitoring for RM factor weight adjustments
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMonitoringModalOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleStartTrial} className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-900 leading-relaxed">
            Records an RM-declared previous weight against verified current saved property-wide factor weights, then monitors immutable forecast error at one exact lead day.
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Pricing Factor to Monitor
            </label>
            <select
              value={factor}
              onChange={(e) => setFactor(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="SEASON">Season Factor (Active plan)</option>
              <option value="OCCUPANCY_BAND">Occupancy Bands (3 active bands)</option>
              <option value="WEEKEND_HOLIDAY">Weekend / Holiday Rule</option>
              <option value="HISTORIC_YOY">Historic YoY Trend</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Monitored Lead Day Snapshot
            </label>
            <select
              value={leadDay}
              onChange={(e) => setLeadDay(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="D0">D-0 (Same day arrival)</option>
              <option value="D1">D-1 (1 day prior)</option>
              <option value="D7">D-7 (1 week prior)</option>
              <option value="D14">D-14 (2 weeks prior)</option>
              <option value="D30">D-30 (1 month prior)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Declared Prior Multiplier Weight
            </label>
            <input
              type="number"
              step="0.05"
              min="0.5"
              max="3.0"
              value={declaredWeight}
              onChange={(e) => setDeclaredWeight(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
              required
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsMonitoringModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition"
            >
              Record Monitoring Trial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

