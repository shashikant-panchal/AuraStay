import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { suiteModules } from '../data/suiteModules';
import { 
  Calendar, 
  UtensilsCrossed, 
  Package, 
  Home, 
  Briefcase, 
  Users, 
  Wallet, 
  Share2, 
  BarChart2, 
  UserCheck, 
  Users2, 
  Tag, 
  Star, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const iconMap = {
  Calendar,
  UtensilsCrossed,
  Package,
  Home,
  Briefcase,
  Users,
  Wallet,
  Share2,
  BarChart2,
  UserCheck,
  Users2,
  Tag,
  Star,
  TrendingUp
};

export default function MasterServiceHome() {
  const { 
    navigateTo, 
    activePopoverModule, 
    setActivePopoverModule,
    setIsCreateReservationModalOpen 
  } = useDashboard();

  const handleOptionClick = (moduleId, optionName) => {
    if (optionName === 'Create Reservation') {
      setIsCreateReservationModalOpen(true);
      return;
    }
    if (moduleId === 'revenue-management') {
      navigateTo('revenue-dashboard', optionName);
      return;
    }
    if (moduleId === 'front-office') {
      if (optionName.includes('Reservation')) {
        navigateTo('reservation-management', optionName);
      } else {
        navigateTo('front-office', optionName);
      }
      return;
    }
    if (moduleId === 'food-beverages') {
      navigateTo('food-beverages', optionName);
      return;
    }
    if (moduleId === 'housekeeping') {
      navigateTo('housekeeping', optionName);
      return;
    }
    if (moduleId === 'channel-manager') {
      navigateTo('channel-manager', optionName);
      return;
    }
    if (moduleId === 'reports') {
      navigateTo('reports', optionName);
      return;
    }
    if (moduleId === 'account-finance') {
      navigateTo('account-finance', optionName);
      return;
    }
    if (moduleId === 'staff-admin') {
      navigateTo('staff-admin', optionName);
      return;
    }
    if (moduleId === 'guest-crm') {
      navigateTo('guest-crm', optionName);
      return;
    }
    // Generic fallback:
    navigateTo(moduleId, optionName);
  };

  const togglePopover = (moduleId, e) => {
    e.stopPropagation();
    setActivePopoverModule(prev => prev === moduleId ? null : moduleId);
  };

  return (
    <div className="space-y-6">
      {/* Grid of 14 Service Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {suiteModules.map(module => {
          const Icon = iconMap[module.icon] || Calendar;
          const isPopoverOpen = activePopoverModule === module.id;

          return (
            <div 
              key={module.id}
              className={`bg-white rounded-xl border ${module.borderColor} shadow-2xs hover:shadow-md transition duration-200 flex flex-col justify-between overflow-visible relative group min-h-[175px]`}
            >
              <div>
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center space-x-2">
                  <Icon className={`w-4 h-4 ${module.textColor}`} />
                  <h2 className={`text-xs font-bold ${module.textColor}`}>
                    {module.title}
                  </h2>
                </div>

                {/* Primary Options List */}
                <div className="divide-y divide-slate-100/90">
                  {module.primaryOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleOptionClick(module.id, opt)}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50/70 transition flex items-center justify-between"
                    >
                      <span>{opt}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition" />
                    </button>
                  ))}
                </div>
              </div>

              {/* View More Trigger */}
              {module.moreOptions && module.moreOptions.length > 0 && (
                <div className="border-t border-slate-100 bg-white rounded-b-xl relative">
                  <button
                    onClick={(e) => togglePopover(module.id, e)}
                    className={`w-full text-center py-2 text-xs font-bold ${module.textColor} hover:opacity-80 flex items-center justify-center space-x-1.5 transition select-none`}
                  >
                    <span>View More</span>
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-current text-[10px]">
                      {isPopoverOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {/* Popover Menu with exact expanded options */}
                  {isPopoverOpen && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-2 right-2 bottom-10 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-56 overflow-y-auto"
                    >
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-100 mb-1">
                        More {module.title} Features
                      </div>
                      <div className="space-y-0.5">
                        {module.moreOptions.map(opt => (
                          <button
                            key={opt}
                            onClick={() => handleOptionClick(module.id, opt)}
                            className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition font-medium"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

