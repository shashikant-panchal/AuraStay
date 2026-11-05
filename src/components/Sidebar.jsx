import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { 
  Building2, 
  CalendarCheck, 
  Paintbrush, 
  BarChart3, 
  Tag, 
  LayoutGrid, 
  Moon, 
  Users, 
  ChevronDown, 
  LogOut, 
  Pin, 
  TrendingUp, 
  CalendarClock, 
  PieChart, 
  Target, 
  LineChart, 
  Split, 
  UtensilsCrossed, 
  Package, 
  ConciergeBell, 
  Share2, 
  Compass, 
  Wallet, 
  ShieldCheck, 
  SlidersHorizontal,
  Globe,
  FileText,
  Utensils,
  Archive,
  Warehouse
} from 'lucide-react';

export default function Sidebar() {
  const { 
    currentView, 
    activeTab, 
    navigateTo, 
    setActiveTab, 
    setIsConfigOpen, 
    resetToDefaults, 
    showNotification,
    data,
    setFrontOfficeSubTab
  } = useDashboard();

  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Sections open/collapsed state (PMS, Channel Manager, Restaurant POS are open by default)
  const [openSections, setOpenSections] = useState({
    pms: true,
    channelManager: true,
    restaurantPos: true,
    revenue: false,
    operations: false,
    admin: false,
  });

  const isExpanded = isHovered || isPinned;

  const toggleSection = (sectionKey, e) => {
    if (e) e.stopPropagation();
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleNav = (viewId, tabId = null) => {
    if (viewId === 'front-office' && setFrontOfficeSubTab) {
      setFrontOfficeSubTab('dashboard');
    }
    if (viewId === 'reservation-management' && setFrontOfficeSubTab) {
      setFrontOfficeSubTab('reservations');
    }
    navigateTo(viewId);
    if (tabId && setActiveTab) {
      setActiveTab(tabId);
    }
  };

  // PMS section items exactly as shown in screenshot
  const pmsItems = [
    { id: 'front-office', label: 'Front Office', icon: Building2 },
    { id: 'reservation-management', label: 'Reservations', icon: CalendarCheck },
    { id: 'housekeeping', label: 'Housekeeping', icon: Paintbrush },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'rate-plans', label: 'Rate Plans', icon: Tag },
    { id: 'ari-grid', label: 'ARI Grid', icon: LayoutGrid },
    { id: 'night-audit', label: 'Night Audit', icon: Moon },
    { id: 'guests', label: 'Guests', icon: Users },
  ];

  // CHANNEL MANAGER section items exactly as shown in screenshot
  const channelManagerItems = [
    { id: 'channel-manager', label: 'Channel Manager', icon: Globe },
    { id: 'rate-plans', label: 'Rate Plans', icon: Tag },
    { id: 'ari-grid', label: 'ARI Grid', icon: LayoutGrid },
    { id: 'revenue-insights', label: 'Revenue Insights', icon: TrendingUp },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
  ];

  // RESTAURANT & POS section items exactly as shown in screenshot
  const restaurantPosItems = [
    { id: 'restaurant-pos', label: 'Restaurant POS', icon: Utensils },
    { id: 'product-setup', label: 'Product Setup', icon: Archive },
    { id: 'stock-management', label: 'Stock Management', icon: Warehouse },
  ];

  // Revenue & Analytics (VARO AI)
  const revenueItems = [
    { id: 'revenue-dashboard', tab: 'overview', label: 'VARO Overview', icon: TrendingUp },
    { id: 'revenue-dashboard', tab: 'pickup-pace', label: 'Pickup & Pace', icon: CalendarClock },
    { id: 'revenue-dashboard', tab: 'segmentation', label: 'Market Segments', icon: PieChart },
    { id: 'revenue-dashboard', tab: 'budget-forecast', label: 'Budget & Targets', icon: Target },
    { id: 'revenue-dashboard', tab: 'demand-forecast', label: 'Demand Forecast', icon: LineChart },
    { id: 'revenue-dashboard', tab: 'displacement', label: 'Displacement', icon: Split },
  ];

  // Operations & Outlets
  const operationItems = [
    { id: 'services', label: 'Hotel Services', icon: ConciergeBell },
  ];

  // Admin & Finance
  const adminItems = [
    { id: 'account-finance', label: 'Accounts & Finance', icon: Wallet },
    { id: 'staff-admin', label: 'Staff Management', icon: ShieldCheck },
    { id: 'config', label: 'Suite Configuration', icon: SlidersHorizontal, action: () => setIsConfigOpen(true) },
  ];

  return (
    <>
      {/* Gutter placeholder in document flow so content doesn't jitter when hover-expanding */}
      <div 
        className={`shrink-0 transition-all duration-300 ease-in-out ${
          isPinned ? 'w-72' : 'w-[68px]'
        }`} 
      />

      {/* Main Hover-Expanding Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 bottom-0 left-0 z-50 h-screen bg-[#070e1e] flex flex-col border-r border-slate-800/80 transition-all duration-300 ease-in-out select-none shadow-xl ${
          isExpanded ? 'w-72 shadow-2xl ring-1 ring-black/40' : 'w-[68px]'
        }`}
      >
        {/* Top Header Logo Area (White Background as in Screenshot) */}
        <div className="bg-white h-[74px] border-b border-slate-200/40 px-3 flex items-center justify-between relative shrink-0 overflow-hidden">
          {isExpanded ? (
            <div 
              onClick={() => handleNav('master-service-home')}
              className="flex-1 flex flex-col items-center justify-center cursor-pointer group"
              title="AuraStay - All In One Hospitality Suite"
            >
              {/* aurastay brand logo */}
              <div className="flex items-center space-x-1.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#0284c7] via-[#4f46e5] to-[#7c3aed] flex items-center justify-center shadow-xs">
                  <span className="text-white font-extrabold text-sm leading-none">A</span>
                </div>
                <div className="flex items-baseline tracking-tight font-black">
                  <span className="text-xl text-[#0f172a]">Aura</span>
                  <span className="text-xl text-[#4f46e5]">Stay</span>
                </div>
              </div>
              <div className="text-[8.5px] font-black tracking-[0.22em] text-[#0284c7] uppercase mt-1 leading-none text-center">
                ALL IN ONE HOSPITALITY SUITE
              </div>
            </div>
          ) : (
            <div 
              onClick={() => handleNav('master-service-home')}
              className="w-full flex items-center justify-center cursor-pointer"
              title="AuraStay Hospitality Suite"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0284c7] via-[#4f46e5] to-[#7c3aed] flex items-center justify-center shadow-sm">
                <span className="text-white font-extrabold text-base leading-none">A</span>
              </div>
            </div>
          )}

          {/* Pin Toggle Button */}
          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPinned(!isPinned);
                showNotification(isPinned ? 'Sidebar unpinned (opens on hover)' : 'Sidebar pinned open');
              }}
              className={`p-1.5 rounded-md transition ${
                isPinned 
                  ? 'text-sky-600 bg-sky-50 hover:bg-sky-100' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={isPinned ? 'Unpin sidebar (hover to expand)' : 'Pin sidebar open'}
            >
              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-sky-600' : ''}`} />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-3 dark-sidebar-scroll">
          
          {/* Suite Home Link */}
          {isExpanded ? (
            <button
              onClick={() => handleNav('master-service-home')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition text-left group ${
                currentView === 'master-service-home'
                  ? 'bg-sky-500/15 text-sky-400 font-semibold border-l-2 border-sky-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
              <span className="text-xs font-semibold">Suite Home</span>
              <span className="ml-auto text-[9.5px] font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                Overview
              </span>
            </button>
          ) : (
            <button
              onClick={() => handleNav('master-service-home')}
              className={`w-full aspect-square rounded-xl flex items-center justify-center transition group relative ${
                currentView === 'master-service-home'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Suite Home"
            >
              <LayoutGrid className="w-5 h-5 transition group-hover:scale-105" />
              <span className="absolute left-16 bg-slate-900 border border-slate-700 text-white text-xs font-semibold px-2.5 py-1 rounded shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition duration-150 z-50">
                Suite Home
              </span>
            </button>
          )}

          {/* SECTION 1: PMS (CORE) - EXACT MATCH WITH SCREENSHOT */}
          <div className="space-y-1 pt-1">
            {isExpanded ? (
              <button
                onClick={(e) => toggleSection('pms', e)}
                className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-slate-800/40 transition group"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 shadow-xs shadow-cyan-400/50" />
                  <span className="font-bold text-white text-sm tracking-wide">PMS</span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="bg-[#0092d6] text-white text-[10.5px] font-bold px-2 py-0.5 rounded shadow-xs">
                    Core
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openSections.pms ? 'rotate-180' : ''}`} />
                </div>
              </button>
            ) : (
              <div 
                className="w-full py-1 flex flex-col items-center cursor-pointer"
                title="PMS (Core)"
                onClick={() => setIsHovered(true)}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 mb-0.5 shadow-xs shadow-cyan-400/50" />
                <span className="text-[8.5px] font-black text-cyan-400 tracking-wider">PMS</span>
              </div>
            )}

            {/* PMS Sub-Items */}
            {(!isExpanded || openSections.pms) && (
              <div className="space-y-0.5 pl-1">
                {pmsItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  if (isExpanded) {
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNav(item.id)}
                        className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl transition text-left group ${
                          isActive
                            ? 'bg-sky-500/15 text-sky-400 font-semibold border-l-2 border-sky-400'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 transition group-hover:scale-110 ${
                          isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                        }`} />
                        <span className="text-xs font-medium truncate">{item.label}</span>
                      </button>
                    );
                  }

                  // Collapsed Icon View
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full aspect-square rounded-xl flex items-center justify-center transition group relative ${
                        isActive
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                      title={item.label}
                    >
                      <Icon className="w-4 h-4 transition group-hover:scale-105" />
                      <span className="absolute left-16 bg-slate-900 border border-slate-700 text-white text-xs font-semibold px-2.5 py-1 rounded shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition duration-150 z-50">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: CHANNEL MANAGER - EXACT MATCH WITH SCREENSHOT */}
          <div className="space-y-1 pt-2 border-t border-slate-800/50">
            {isExpanded ? (
              <button
                onClick={(e) => toggleSection('channelManager', e)}
                className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-slate-800/40 transition group"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 shadow-xs shadow-cyan-400/50" />
                  <span className="font-bold text-white text-xs tracking-wider uppercase truncate">
                    CHANNEL MANAGER
                  </span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNav('channel-manager');
                      showNotification('Opening Channel Manager...');
                    }}
                    className="bg-[#00a8cc] hover:bg-[#00bcd4] text-white text-[10.5px] font-bold px-2.5 py-0.5 rounded-md shadow-xs transition cursor-pointer"
                  >
                    Connect
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openSections.channelManager ? 'rotate-180' : ''}`} />
                </div>
              </button>
            ) : (
              <div 
                className="w-full py-1 flex flex-col items-center cursor-pointer"
                title="CHANNEL MANAGER (Connect)"
                onClick={() => setIsHovered(true)}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 mb-0.5 shadow-xs shadow-cyan-400/50" />
                <span className="text-[8px] font-black text-cyan-400 tracking-wider">CM</span>
              </div>
            )}

            {/* Channel Manager Sub-Items */}
            {(!isExpanded || openSections.channelManager) && (
              <div className="space-y-0.5 pl-1">
                {channelManagerItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  if (isExpanded) {
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNav(item.id)}
                        className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl transition text-left group ${
                          isActive
                            ? 'bg-sky-500/15 text-sky-400 font-semibold border-l-2 border-sky-400'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 transition group-hover:scale-110 ${
                          isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                        }`} />
                        <span className="text-xs font-medium truncate">{item.label}</span>
                      </button>
                    );
                  }

                  // Collapsed Icon View
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full aspect-square rounded-xl flex items-center justify-center transition group relative ${
                        isActive
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                      title={item.label}
                    >
                      <Icon className="w-4 h-4 transition group-hover:scale-105" />
                      <span className="absolute left-16 bg-slate-900 border border-slate-700 text-white text-xs font-semibold px-2.5 py-1 rounded shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition duration-150 z-50">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: RESTAURANT & POS - EXACT MATCH WITH SCREENSHOT */}
          <div className="space-y-1 pt-2 border-t border-slate-800/50">
            {isExpanded ? (
              <button
                onClick={(e) => toggleSection('restaurantPos', e)}
                className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-slate-800/40 transition group"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 shadow-xs shadow-orange-500/50" />
                  <span className="font-bold text-white text-xs tracking-wider uppercase truncate">
                    RESTAURANT & POS
                  </span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNav('restaurant-pos');
                      showNotification('Opening Restaurant POS...');
                    }}
                    className="bg-[#ff6d00] hover:bg-[#ff7a1a] text-white text-[10.5px] font-bold px-2.5 py-0.5 rounded-lg shadow-xs transition cursor-pointer"
                  >
                    POS
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openSections.restaurantPos ? 'rotate-180' : ''}`} />
                </div>
              </button>
            ) : (
              <div 
                className="w-full py-1 flex flex-col items-center cursor-pointer"
                title="RESTAURANT & POS"
                onClick={() => setIsHovered(true)}
              >
                <span className="w-2 h-2 rounded-full bg-orange-500 mb-0.5 shadow-xs shadow-orange-500/50" />
                <span className="text-[8px] font-black text-orange-400 tracking-wider">POS</span>
              </div>
            )}

            {/* RESTAURANT & POS Sub-Items */}
            {(!isExpanded || openSections.restaurantPos) && (
              <div className="space-y-0.5 pl-1">
                {restaurantPosItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  if (isExpanded) {
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNav(item.id)}
                        className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl transition text-left group ${
                          isActive
                            ? 'bg-orange-500/15 text-orange-400 font-semibold border-l-2 border-orange-400'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 transition group-hover:scale-110 ${
                          isActive ? 'text-orange-400' : 'text-slate-400 group-hover:text-slate-200'
                        }`} />
                        <span className="text-xs font-medium truncate">{item.label}</span>
                      </button>
                    );
                  }

                  // Collapsed Icon View
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full aspect-square rounded-xl flex items-center justify-center transition group relative ${
                        isActive
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                      title={item.label}
                    >
                      <Icon className="w-4 h-4 transition group-hover:scale-105" />
                      <span className="absolute left-16 bg-slate-900 border border-slate-700 text-white text-xs font-semibold px-2.5 py-1 rounded shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition duration-150 z-50">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 4: REVENUE & YIELD (VARO AI) */}
          <div className="space-y-1 pt-2 border-t border-slate-800/50">
            {isExpanded ? (
              <button
                onClick={(e) => toggleSection('revenue', e)}
                className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-slate-800/40 transition group"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                  <span className="font-bold text-white text-sm tracking-wide">Revenue</span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="bg-purple-600 text-white text-[10.5px] font-bold px-2 py-0.5 rounded shadow-xs">
                    VARO AI
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openSections.revenue ? 'rotate-180' : ''}`} />
                </div>
              </button>
            ) : null}

            {isExpanded && openSections.revenue && (
              <div className="space-y-0.5 pl-1">
                {revenueItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === 'revenue-dashboard' && activeTab === item.tab;
                  return (
                    <button
                      key={item.tab}
                      onClick={() => handleNav(item.id, item.tab)}
                      className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl transition text-left group ${
                        isActive
                          ? 'bg-purple-500/15 text-purple-400 font-semibold border-l-2 border-purple-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition group-hover:scale-110 ${
                        isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`} />
                      <span className="text-xs font-medium truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: OPERATIONS & OUTLETS */}
          <div className="space-y-1 pt-2 border-t border-slate-800/50">
            {isExpanded ? (
              <button
                onClick={(e) => toggleSection('operations', e)}
                className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-slate-800/40 transition group"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="font-bold text-white text-sm tracking-wide">Operations</span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="bg-emerald-600 text-white text-[10.5px] font-bold px-2 py-0.5 rounded shadow-xs">
                    Outlets
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openSections.operations ? 'rotate-180' : ''}`} />
                </div>
              </button>
            ) : null}

            {isExpanded && openSections.operations && (
              <div className="space-y-0.5 pl-1">
                {operationItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl transition text-left group ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 font-semibold border-l-2 border-emerald-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition group-hover:scale-110 ${
                        isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`} />
                      <span className="text-xs font-medium truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>



          {/* SECTION 5: ADMIN & FINANCE */}
          <div className="space-y-1 pt-2 border-t border-slate-800/50">
            {isExpanded ? (
              <button
                onClick={(e) => toggleSection('admin', e)}
                className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-slate-800/40 transition group"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                  <span className="font-bold text-white text-sm tracking-wide">Administration</span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="bg-slate-700 text-white text-[10.5px] font-bold px-2 py-0.5 rounded shadow-xs">
                    Admin
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openSections.admin ? 'rotate-180' : ''}`} />
                </div>
              </button>
            ) : null}

            {isExpanded && openSections.admin && (
              <div className="space-y-0.5 pl-1">
                {adminItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => item.action ? item.action() : handleNav(item.id)}
                      className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl transition text-left group ${
                        isActive
                          ? 'bg-slate-500/20 text-slate-200 font-semibold border-l-2 border-slate-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition group-hover:scale-110 ${
                        isActive ? 'text-slate-200' : 'text-slate-400 group-hover:text-slate-200'
                      }`} />
                      <span className="text-xs font-medium truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM USER PROFILE CARD (EXACT SCREENSHOT MATCH) */}
        <div className="mt-auto pt-2 pb-3 px-2 shrink-0">
          {isExpanded ? (
            <div className="bg-[#060c1d] border border-slate-800/80 rounded-2xl p-2.5 flex items-center justify-between shadow-lg">
              {/* Photo / Avatar & Info */}
              <div className="flex items-center space-x-3 min-w-0">
                {/* Image Squircle Graphic */}
                <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/80 p-0.5 relative overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                  <div className="w-full h-full bg-linear-to-b from-sky-400 to-emerald-600 rounded-lg relative overflow-hidden flex items-center justify-center">
                    {/* Golden Sun */}
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-300 absolute top-1 left-1.5 shadow-xs" />
                    {/* Mountain Hills */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-800" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-emerald-700" />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-bold text-white tracking-wide truncate">
                    Twinkle Bagh
                  </div>
                  <div className="text-[9.5px] font-semibold text-slate-400 tracking-wider uppercase truncate mt-0.5">
                    PROP ADMIN
                  </div>
                </div>
              </div>

              {/* Reddish Logout Button */}
              <button
                onClick={() => {
                  resetToDefaults();
                  showNotification('Signed out / reset demo session.');
                }}
                className="w-9 h-9 rounded-xl bg-[#200e18] hover:bg-[#341123] border border-rose-900/60 text-rose-400 hover:text-rose-300 flex items-center justify-center transition shadow-xs shrink-0 cursor-pointer group"
                title="Sign Out / Reset Demo Session"
              >
                <LogOut className="w-4 h-4 transition group-hover:scale-110" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2 py-1">
              {/* Collapsed Avatar */}
              <div 
                className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 p-0.5 relative overflow-hidden flex items-center justify-center cursor-pointer shadow-sm group"
                title="Twinkle Bagh (PROP ADMIN)"
                onClick={() => setIsHovered(true)}
              >
                <div className="w-full h-full bg-linear-to-b from-sky-400 to-emerald-600 rounded-lg relative overflow-hidden flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-300 absolute top-0.5 left-1 shadow-xs" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-800" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-emerald-700" />
                </div>
              </div>

              {/* Collapsed Logout */}
              <button
                onClick={() => {
                  resetToDefaults();
                  showNotification('Signed out / reset demo session.');
                }}
                className="w-8 h-8 rounded-lg bg-[#200e18] hover:bg-[#341123] border border-rose-900/60 text-rose-400 hover:text-rose-300 flex items-center justify-center transition group relative"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 transition group-hover:scale-110" />
                <span className="absolute left-16 bg-slate-900 border border-slate-700 text-white text-xs font-semibold px-2.5 py-1 rounded shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition duration-150 z-50">
                  Sign Out (Twinkle Bagh)
                </span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
