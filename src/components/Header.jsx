import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { 
  Menu,
  Moon, 
  Search, 
  Building2, 
  ChevronDown, 
  Languages, 
  Bell, 
  User, 
  TrendingUp, 
  RotateCcw,
  Sparkles,
  Compass,
  SlidersHorizontal,
  BookOpen,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';

export default function Header() {
  const { 
    data, 
    currentView, 
    navigateTo, 
    setIsGlossaryOpen, 
    setIsConfigOpen, 
    setIsTourOpen, 
    setIsSearchOpen,
    resetToDefaults,
    subModuleTitle 
  } = useDashboard();

  const { property, configuration } = data;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs select-none">
      {/* Top Navbar */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Hamburger & Greeting */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigateTo('master-service-home')}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="AuraStay Master Suite Home"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <Moon className="w-4 h-4 fill-amber-400 text-amber-500" />
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                GOOD EVENING
              </div>
              <div className="text-sm font-bold text-slate-800 leading-tight">
                {property.managerName} <span className="text-slate-400 text-xs font-normal">({property.managerRole})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Search, Property Dropdown, Icons */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Search bar */}
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-3.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 transition"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Search</span>
            <kbd className="bg-white text-slate-400 text-[10px] px-1.5 py-0.5 rounded border border-slate-200 font-mono shadow-xs">
              Ctrl + K
            </kbd>
          </button>

          {/* Property Selector */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-100 transition shadow-xs">
            <Building2 className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-800">{property.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Mini Search Icon */}
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Language Switcher */}
          <button 
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Language: English"
          >
            <Languages className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <div className="relative cursor-pointer p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition">
            <Bell className="w-4 h-4" />
            <span className="absolute 1 top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
              {property.notificationCount || 2}
            </span>
          </div>

          {/* User Profile Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#1b2b48] text-white flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer ring-2 ring-indigo-100">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Secondary Bar if in a specific sub-view or Revenue Dashboard */}
      {currentView !== 'master-service-home' && (
        <div className="px-6 py-2.5 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateTo('master-service-home')}
              className="font-semibold text-slate-500 hover:text-indigo-600 flex items-center space-x-1"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>AuraStay Suite</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-slate-800 capitalize">
              {currentView.replace('-', ' ')}
            </span>
            {subModuleTitle && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {subModuleTitle}
                </span>
              </>
            )}
          </div>

          {currentView.includes('revenue') && (
            <div className="flex items-center space-x-2">
              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                MASTERY: {property.masteryPercentage}%
              </span>
              <button
                onClick={() => setIsTourOpen(true)}
                className="px-2.5 py-0.5 bg-white border border-slate-200 hover:border-indigo-300 rounded-full font-medium text-slate-600 hover:text-indigo-600 text-[11px]"
              >
                Tour
              </button>
              <button
                onClick={() => setIsConfigOpen(true)}
                className="px-2.5 py-0.5 bg-white border border-slate-200 hover:border-indigo-300 rounded-full font-medium text-slate-600 hover:text-indigo-600 text-[11px]"
              >
                Configuration ({configuration.readinessScore}%)
              </button>
              <button
                onClick={() => setIsGlossaryOpen(true)}
                className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full font-bold text-[11px]"
              >
                Glossary (35)
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
