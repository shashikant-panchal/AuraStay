import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { 
  LayoutGrid, 
  Globe, 
  CalendarDays, 
  TrendingUp, 
  Smartphone, 
  CheckCircle, 
  Send, 
  Wallet, 
  Users, 
  Sliders, 
  LogOut 
} from 'lucide-react';

export default function Sidebar() {
  const { currentView, navigateTo, setIsConfigOpen, resetToDefaults } = useDashboard();

  const navItems = [
    { id: 'master-service-home', label: 'Suite Home', icon: LayoutGrid },
    { id: 'front-office', label: 'Front Office', icon: Globe },
    { id: 'reservation-management', label: 'Reservations', icon: CalendarDays },
    { id: 'revenue-dashboard', label: 'Revenue Management (VARO)', icon: TrendingUp },
    { id: 'food-beverages', label: 'Food & Beverages', icon: Smartphone },
    { id: 'housekeeping', label: 'Housekeeping', icon: CheckCircle },
    { id: 'channel-manager', label: 'Channel Manager', icon: Send },
    { id: 'account-finance', label: 'Accounts & Finance', icon: Wallet },
    { id: 'staff-admin', label: 'Staff & Admin', icon: Users },
  ];

  return (
    <aside className="w-16 bg-[#0c1427] flex flex-col items-center py-3 border-r border-slate-800 shrink-0 z-40 select-none">
      {/* AuraStay Logo Icon */}
      <div 
        onClick={() => navigateTo('master-service-home')}
        className="w-10 h-10 mb-5 flex flex-col items-center justify-center cursor-pointer group"
        title="AuraStay Master Suite"
      >
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md">
          <span className="font-extrabold text-white text-base leading-none font-sans">A</span>
        </div>
        <span className="text-[8px] font-bold text-slate-400 group-hover:text-white transition tracking-tight mt-0.5">
          aurastay
        </span>
      </div>

      {/* Nav Icons */}
      <div className="flex-1 flex flex-col space-y-2 w-full px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (item.id === 'revenue-dashboard' && currentView.includes('revenue'));
          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`w-full aspect-square rounded-xl flex items-center justify-center transition group relative ${
                isActive 
                  ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 shadow-xs' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5 transition group-hover:scale-105" />
              {/* Tooltip on hover */}
              <span className="absolute left-16 bg-slate-900 text-white text-[11px] font-semibold px-2 py-1 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition duration-150 z-50">
                {item.label}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => setIsConfigOpen(true)}
          className="w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition group relative"
          title="Configuration"
        >
          <Sliders className="w-5 h-5 transition group-hover:scale-105" />
          <span className="absolute left-16 bg-slate-900 text-white text-[11px] font-semibold px-2 py-1 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition duration-150 z-50">
            Suite Configuration
          </span>
        </button>
      </div>

      {/* Bottom Signout */}
      <div className="mt-auto pt-4 border-t border-slate-800/80 w-full px-2">
        <button
          onClick={resetToDefaults}
          className="w-full aspect-square rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition group relative"
          title="Sign Out / Reset Session"
        >
          <LogOut className="w-5 h-5 transition group-hover:scale-105" />
          <span className="absolute left-16 bg-slate-900 text-white text-[11px] font-semibold px-2 py-1 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition duration-150 z-50">
            Sign Out / Reset Demo
          </span>
        </button>
      </div>
    </aside>
  );
}

