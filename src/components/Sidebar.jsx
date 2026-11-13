import React, { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import {
  Building2,
  CalendarCheck,
  Paintbrush,
  BarChart3,
  Tag,
  LayoutGrid,
  LayoutDashboard,
  Users,
  ChevronDown,
  LogOut,
  Pin,
  TrendingUp,
  ConciergeBell,
  Wallet,
  ShieldCheck,
  Globe,
  FileText,
  Utensils,
  Archive,
  Warehouse,
  PartyPopper,
  Calendar,
  Clock,
  Moon,
  Receipt,
  Wrench,
  Package,
  Layers,
  HelpCircle,
  Settings,
  CarTaxiFront
} from 'lucide-react';

export default function Sidebar() {
  const {
    currentView,
    navigateTo,
    activeTab,
    setActiveTab,
    showNotification,
    currentHotel,
    logout,
    workingDate
  } = useDashboard();

  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(() => {
    try {
      return localStorage.getItem('aurastay_sidebar_pinned') === 'true';
    } catch (e) {
      return true; // Default pinned for desktop
    }
  });

  // Sections open/collapsed state matching Exceed Software
  const [openSections, setOpenSections] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_sidebar_sections_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return {
      frontOffice: true,
      housekeeping: false,
      pos: false,
      banquet: false,
      stores: false,
      accounts: false,
      channelManager: false,
      admin: false
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('aurastay_sidebar_pinned', String(isPinned));
    } catch (e) { }
  }, [isPinned]);

  useEffect(() => {
    try {
      localStorage.setItem('aurastay_sidebar_sections_v2', JSON.stringify(openSections));
    } catch (e) { }
  }, [openSections]);

  const isExpanded = isHovered || isPinned;

  const toggleSection = (sectionKey, e) => {
    if (e) e.stopPropagation();
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleNav = (viewId, tabId = null) => {
    navigateTo(viewId);
    if (tabId && setActiveTab) {
      setActiveTab(tabId);
    }
  };

  const isSubItemActive = (item, group) => {
    if (currentView !== item.id) return false;
    if (item.subTab) {
      if (!activeTab) {
        return group.items[0]?.subTab === item.subTab;
      }
      return activeTab === item.subTab;
    }
    return true;
  };

  // Section items configuration exactly matching Exceed Software
  const menuGroups = [
    {
      key: 'frontOffice',
      title: 'FRONT OFFICE',
      tag: 'Core',
      tagColor: 'bg-[#0092d6]',
      items: [
        { id: 'dashboard', label: 'Live Room Matrix (3D)', icon: LayoutDashboard },
        { id: 'stay-view-calendar', label: 'Stay Overview (Tape Chart)', icon: Calendar },
        { id: 'reservation-management', label: 'Reservations & Walk-Ins', icon: CalendarCheck },
        { id: 'cab-booking', label: 'Cab Booking & Travel Desk', icon: CarTaxiFront },
        { id: 'guests', label: 'Guest Profiles & KYC', icon: Users },
        { id: 'rate-plans', label: 'Rate Plans & Tariffs', icon: Tag },
        { id: 'reports', label: 'Front Office Reports', icon: BarChart3 }
      ]
    },
    {
      key: 'housekeeping',
      title: 'HOUSEKEEPING',
      tag: 'HK',
      tagColor: 'bg-amber-600',
      items: [
        { id: 'housekeeping', label: 'Room Cleanliness & Turnover', icon: Paintbrush, subTab: 'turnover' },
        { id: 'housekeeping', label: 'Work Orders & Maintenance', icon: Wrench, subTab: 'maintenance' },
        { id: 'housekeeping', label: 'Lost & Found Registry', icon: Archive, subTab: 'lost-found' }
      ]
    },
    {
      key: 'pos',
      title: 'POINT OF SALE (POS)',
      tag: 'F&B',
      tagColor: 'bg-rose-600',
      items: [
        { id: 'restaurant-pos', label: 'Restaurant POS Terminal', icon: Utensils },
        { id: 'food-beverages', label: 'Tables & Kitchen Display (KDS)', icon: Layers },
        { id: 'product-setup', label: 'Menu Rate Plans & Dishes', icon: Tag }
      ]
    },
    {
      key: 'banquet',
      title: 'BANQUET & EVENTS',
      tag: 'MICE',
      tagColor: 'bg-purple-600',
      items: [
        { id: 'banquet-events', label: 'Banquet Bookings & Calendar', icon: PartyPopper, subTab: 'bookings' },
        { id: 'banquet-events', label: 'Venues & Halls Master', icon: Building2, subTab: 'venues' },
        { id: 'banquet-events', label: 'Catering Menus & Event Invoicing', icon: Receipt, subTab: 'menus' }
      ]
    },
    {
      key: 'stores',
      title: 'STORES & INVENTORY',
      tag: 'Stock',
      tagColor: 'bg-emerald-600',
      items: [
        { id: 'stock-management', label: 'Stock Balance & Inventory', icon: Warehouse, subTab: 'inventory' },
        { id: 'stock-management', label: 'Purchase Orders & GRN', icon: Package, subTab: 'po' },
        { id: 'stock-management', label: 'Requisitions & Transfers', icon: Layers, subTab: 'transfers' }
      ]
    },
    {
      key: 'accounts',
      title: 'ACCOUNTS & FINANCE',
      tag: 'Ledger',
      tagColor: 'bg-teal-600',
      items: [
        { id: 'account-finance', label: 'Cash Book & Bank Accounts', icon: Wallet, subTab: 'cash-book' },
        { id: 'account-finance', label: 'General Ledger & Trial Balance', icon: FileText, subTab: 'ledger' },
        { id: 'account-finance', label: 'GST Tax Reports & Balance Sheet', icon: Receipt, subTab: 'tax-reports' }
      ]
    },
    {
      key: 'channelManager',
      title: 'CHANNELS & REVENUE',
      tag: 'OTAs',
      tagColor: 'bg-sky-600',
      items: [
        { id: 'channel-manager', label: 'OTA Channel Manager', icon: Globe },
        { id: 'ari-grid', label: 'ARI Calendar Grid', icon: Calendar },
        { id: 'revenue-insights', label: 'Revenue Insights & VARO', icon: TrendingUp }
      ]
    },
    {
      key: 'admin',
      title: 'ADMINISTRATION',
      tag: 'Setup',
      tagColor: 'bg-slate-600',
      items: [
        { id: 'staff-admin', label: 'Users & Roles Permissions', icon: ShieldCheck },
        { id: 'audit-logs', label: 'Activity & Audit Logs', icon: FileText },
        { id: 'product-setup', label: 'System Configuration', icon: Settings }
      ]
    }
  ];

  return (
    <>
      {/* Gutter placeholder so layout does not jump */}
      <div
        className={`shrink-0 transition-all duration-300 ease-in-out ${
          isPinned ? 'w-72' : 'w-[68px]'
        }`}
      />

      {/* Main Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 bottom-0 left-0 z-50 h-screen bg-[#070e1e] flex flex-col border-r border-slate-800/80 transition-all duration-300 ease-in-out select-none shadow-xl ${
          isExpanded ? 'w-72 shadow-2xl ring-1 ring-black/40' : 'w-[68px]'
        }`}
      >
        {/* Top Header Logo Area */}
        <div className="bg-white h-[74px] border-b border-slate-200/40 px-3 flex items-center justify-between relative shrink-0 overflow-hidden">
          {isExpanded ? (
            <div
              onClick={() => handleNav('dashboard')}
              className="flex-1 flex flex-col items-center justify-center cursor-pointer group py-1"
              title="Aavasa HMS - Shivanandi"
            >
              <img
                src="/aavasa-logo.jpg"
                alt="Aavasa - Hospitality Simplified"
                className="h-12 w-auto max-w-[190px] object-contain transition group-hover:scale-102"
              />
            </div>
          ) : (
            <div
              onClick={() => handleNav('dashboard')}
              className="w-full flex items-center justify-center cursor-pointer py-1"
              title="Aavasa HMS"
            >
              <img
                src="/aavasa-logo.jpg"
                alt="Aavasa"
                className="h-9 w-9 object-contain rounded-md"
              />
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
                isPinned ? 'text-sky-600 bg-sky-50 hover:bg-sky-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
            >
              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-sky-600' : ''}`} />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-2 dark-sidebar-scroll">

          {/* Quick Dashboard Entry */}
          {isExpanded ? (
            <button
              onClick={() => handleNav('dashboard')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition text-left group ${
                currentView === 'dashboard'
                  ? 'bg-sky-500/15 text-sky-400 font-semibold border-l-2 border-sky-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
              <span className="text-xs font-semibold">Live 3D Room Matrix</span>
              <span className="ml-auto text-[9px] font-bold text-sky-300 bg-sky-900/60 px-1.5 py-0.5 rounded border border-sky-700/50">
                LIVE
              </span>
            </button>
          ) : (
            <button
              onClick={() => handleNav('dashboard')}
              className={`w-full aspect-square rounded-xl flex items-center justify-center transition group relative ${
                currentView === 'dashboard'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Live 3D Room Matrix"
            >
              <LayoutDashboard className="w-5 h-5 transition group-hover:scale-105" />
            </button>
          )}

          {/* Exceed Software Functional Modules Accordion */}
          {menuGroups.map(group => {
            const isOpen = openSections[group.key];
            const hasActiveView = group.items.some(item => isSubItemActive(item, group));

            return (
              <div key={group.key} className="space-y-1 pt-1 border-t border-slate-800/40">
                {isExpanded ? (
                  <button
                    onClick={(e) => toggleSection(group.key, e)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-slate-800/40 transition group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full ${hasActiveView ? 'bg-cyan-400 shadow-cyan-400/50' : 'bg-slate-600'} shrink-0 shadow-xs`} />
                      <span className="font-bold text-white text-xs tracking-wider uppercase truncate">
                        {group.title}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className={`${group.tagColor} text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs`}>
                        {group.tag}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setOpenSections(prev => ({ ...prev, [group.key]: true }));
                      setIsHovered(true);
                    }}
                    className={`w-full py-2 rounded-xl flex flex-col items-center justify-center transition group relative cursor-pointer ${
                      hasActiveView
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                        : 'hover:bg-slate-800/60 text-slate-400'
                    }`}
                    title={group.title}
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400 mb-1" />
                    <span className="text-[7.5px] font-black text-cyan-400 tracking-wider uppercase">{group.tag}</span>
                  </button>
                )}

                {/* Sub-Items */}
                {isExpanded && isOpen && (
                  <div className="space-y-0.5 pl-1.5 animate-in fade-in duration-150">
                    {group.items.map((item, idx) => {
                      const Icon = item.icon;
                      const isActive = isSubItemActive(item, group);

                      return (
                        <button
                          key={`${item.id}-${idx}`}
                          onClick={() => handleNav(item.id, item.subTab)}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition text-left group cursor-pointer ${
                            isActive
                              ? 'bg-sky-500/15 text-sky-400 font-semibold border-l-2 border-sky-400'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 shrink-0 transition group-hover:scale-110 ${
                            isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`} />
                          <span className="text-xs font-medium truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

        </div>

        {/* BOTTOM USER PROFILE CARD (EXACT EXCEED / SHIVANANDI MATCH) */}
        <div className="mt-auto pt-2 pb-3 px-2 shrink-0 border-t border-slate-800/80">
          {isExpanded ? (
            <div className="bg-[#060c1d] border border-slate-800/80 rounded-2xl p-2.5 flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-sky-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                  S
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-bold text-white tracking-wide truncate">
                    {currentHotel?.ownerName || 'Shivanandi'}
                  </div>
                  <div className="text-[9px] font-semibold text-slate-400 tracking-wider uppercase truncate mt-0.5">
                    {currentHotel?.name || 'Shivanandi Hotel'}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="w-8 h-8 rounded-xl bg-[#200e18] hover:bg-[#341123] border border-rose-900/60 text-rose-400 hover:text-rose-300 flex items-center justify-center transition shadow-xs shrink-0 cursor-pointer group"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 transition group-hover:scale-110" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2 py-1">
              <button
                onClick={logout}
                className="w-8 h-8 rounded-lg bg-[#200e18] hover:bg-[#341123] border border-rose-900/60 text-rose-400 hover:text-rose-300 flex items-center justify-center transition group relative cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </aside>
    </>
  );
}
