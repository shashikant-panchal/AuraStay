import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Search, 
  X, 
  LayoutDashboard, 
  CalendarClock, 
  PieChart, 
  Target, 
  TrendingUp, 
  Split, 
  BookOpen, 
  SlidersHorizontal, 
  RotateCw, 
  RotateCcw,
  Compass
} from 'lucide-react';

export default function QuickSearchModal() {
  const { 
    isSearchOpen, 
    setIsSearchOpen, 
    setActiveTab, 
    setIsGlossaryOpen, 
    setIsConfigOpen, 
    setIsSetBudgetModalOpen, 
    setIsEvaluateGroupModalOpen,
    setIsTourOpen,
    refreshData,
    resetToDefaults,
    data
  } = useDashboard();

  const [query, setQuery] = useState('');

  if (!isSearchOpen) return null;

  const quickNav = [
    { label: 'Go to Overview Dashboard', category: 'Navigation', icon: LayoutDashboard, action: () => { setActiveTab('overview'); setIsSearchOpen(false); } },
    { label: 'Go to Pickup & Pace', category: 'Navigation', icon: CalendarClock, action: () => { setActiveTab('pickup-pace'); setIsSearchOpen(false); } },
    { label: 'Go to Segmentation & Accounts', category: 'Navigation', icon: PieChart, action: () => { setActiveTab('segmentation'); setIsSearchOpen(false); } },
    { label: 'Go to Budget & Forecast', category: 'Navigation', icon: Target, action: () => { setActiveTab('budget-forecast'); setIsSearchOpen(false); } },
    { label: 'Go to Demand Forecast (90-Day)', category: 'Navigation', icon: TrendingUp, action: () => { setActiveTab('demand-forecast'); setIsSearchOpen(false); } },
    { label: 'Go to Group Displacement', category: 'Navigation', icon: Split, action: () => { setActiveTab('displacement'); setIsSearchOpen(false); } },
    { label: 'Open VARO Configuration (Readiness)', category: 'Actions', icon: SlidersHorizontal, action: () => { setIsConfigOpen(true); setIsSearchOpen(false); } },
    { label: 'Open Revenue Glossary (35 Terms)', category: 'Actions', icon: BookOpen, action: () => { setIsGlossaryOpen(true); setIsSearchOpen(false); } },
    { label: 'Evaluate New Group Opportunity', category: 'Actions', icon: Split, action: () => { setIsEvaluateGroupModalOpen(true); setIsSearchOpen(false); } },
    { label: 'Set Monthly Budgets', category: 'Actions', icon: Target, action: () => { setIsSetBudgetModalOpen(true); setIsSearchOpen(false); } },
    { label: 'Launch Guided Product Tour', category: 'Actions', icon: Compass, action: () => { setIsTourOpen(true); setIsSearchOpen(false); } },
    { label: 'Refresh Dashboard Records', category: 'System', icon: RotateCw, action: () => { refreshData(); setIsSearchOpen(false); } },
    { label: 'Reset Demo Data to Defaults', category: 'System', icon: RotateCcw, action: () => { resetToDefaults(); setIsSearchOpen(false); } },
  ];

  const filtered = quickNav.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-xs p-4 pt-20 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, screen, or action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400 font-medium"
          />
          <kbd className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded border border-slate-300 font-mono">
            ESC
          </kbd>
          <button
            onClick={() => setIsSearchOpen(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No matching actions found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={item.action}
                    className="w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between hover:bg-indigo-50/80 transition group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-md bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center transition">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-900 transition">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with mouse or keyboard</span>
          <span>Aavasa Navigation</span>
        </div>
      </div>
    </div>
  );
}

