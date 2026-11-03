import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { X, Target, Save, RotateCcw, DollarSign } from 'lucide-react';

export default function SetBudgetModal() {
  const { 
    isSetBudgetModalOpen, 
    setIsSetBudgetModalOpen, 
    data, 
    updateMonthlyBudget 
  } = useDashboard();

  const { budgetForecast } = data;
  const [months, setMonths] = useState(() => 
    budgetForecast.monthlyComparison.map(m => ({ ...m }))
  );

  if (!isSetBudgetModalOpen) return null;

  const handleBudgetChange = (monthName, val) => {
    setMonths(prev => prev.map(m => {
      if (m.month === monthName) {
        return { ...m, budget: Number(val) };
      }
      return m;
    }));
  };

  const totalYearBudget = months.reduce((sum, m) => sum + m.budget, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const novBudget = months.find(m => m.month === 'Nov')?.budget || 750000;
    updateMonthlyBudget(months, novBudget);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Set Monthly Budgets — 2026
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure full-year monthly accommodation stay revenue targets.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSetBudgetModalOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Year Summary Bar */}
        <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Total 2026 Budget Target:</span>
          <span className="font-mono font-extrabold text-indigo-300 text-sm">
            ₹{(totalYearBudget / 100000).toFixed(2)} Lakhs (₹{totalYearBudget.toLocaleString('en-IN')})
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {months.map(m => (
              <div 
                key={m.month}
                className={`p-3 rounded-xl border ${m.isCurrent ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-900">{m.month} 2026</span>
                  {m.isCurrent && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 uppercase">
                      Current
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    value={m.budget}
                    onChange={(e) => handleBudgetChange(m.month, e.target.value)}
                    className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="text-[10px] text-slate-500 mt-1.5 flex justify-between">
                  <span>Actual:</span>
                  <span className="font-mono font-semibold">₹{(m.actual / 1000).toFixed(0)}k</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsSetBudgetModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Accommodation Budgets</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

