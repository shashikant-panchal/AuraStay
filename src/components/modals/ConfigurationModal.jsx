import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  X, 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  ExternalLink,
  ShieldCheck,
  Building,
  DollarSign,
  TrendingUp,
  Globe,
  Radio
} from 'lucide-react';

export default function ConfigurationModal() {
  const { 
    isConfigOpen, 
    setIsConfigOpen, 
    data, 
    toggleConfigRequirement, 
    refreshData, 
    isRefreshing 
  } = useDashboard();

  const { configuration } = data;

  if (!isConfigOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  VARO Configuration
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {configuration.readinessScore}% Readiness
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Property-scoped setup evidence and the revenue decisions each item unlocks.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Refresh configuration state"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsConfigOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Readiness Progress Bar Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold tracking-wider text-indigo-300 uppercase">
                CONFIGURATION READINESS
              </div>
              <div className="text-2xl font-extrabold mt-0.5 flex items-baseline space-x-2">
                <span>{configuration.readinessRatio}</span>
                <span className="text-sm font-semibold text-indigo-300">({configuration.readinessScore}%)</span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-1">
                {configuration.subtitle}
              </p>
            </div>

            <div className="w-full sm:w-48 bg-indigo-950/80 p-3 rounded-xl border border-indigo-800/60">
              <div className="flex justify-between text-xs font-semibold mb-1 text-indigo-200">
                <span>Progress</span>
                <span>{configuration.readinessScore}%</span>
              </div>
              <div className="w-full bg-indigo-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${configuration.readinessScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories & Requirements */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/60">
          {configuration.categories.map(cat => (
            <div key={cat.name} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {cat.name}
              </h3>

              <div className="space-y-2.5">
                {cat.items.map(item => {
                  const isConfigured = item.status === 'Configured';
                  return (
                    <div 
                      key={item.title}
                      className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-300 transition"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isConfigured ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {isConfigured ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900">
                              {item.title}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isConfigured 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {item.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 mt-1">
                            {item.detail}
                          </p>

                          <div className="text-[11px] text-indigo-700 font-medium mt-1.5 flex items-center space-x-1">
                            <span className="font-bold text-indigo-900">Unlocks:</span>
                            <span>{item.unlocks}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleConfigRequirement(cat.name, item.title)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition shrink-0 self-start sm:self-center ${
                          isConfigured
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-300'
                        }`}
                      >
                        {isConfigured ? 'Toggle Setup' : 'Open setup'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>Click "Open setup" to simulate configuring and unlocking revenue modules</span>
          <button
            onClick={() => setIsConfigOpen(false)}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

