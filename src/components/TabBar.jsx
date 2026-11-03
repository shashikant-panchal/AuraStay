import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { 
  LayoutDashboard, 
  CalendarClock, 
  PieChart, 
  Target, 
  TrendingUp, 
  Split
} from 'lucide-react';

export default function TabBar() {
  const { activeTab, setActiveTab } = useDashboard();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'pickup-pace', label: 'Pickup & Pace', icon: CalendarClock },
    { id: 'segmentation', label: 'Segmentation', icon: PieChart },
    { id: 'budget-forecast', label: 'Budget & Forecast', icon: Target },
    { id: 'demand-forecast', label: 'Demand Forecast', icon: TrendingUp },
    { id: 'displacement', label: 'Displacement', icon: Split },
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-6 sticky top-[97px] z-20 shadow-xs">
      <div className="flex space-x-1 md:space-x-4 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3.5 px-3 md:px-4 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

