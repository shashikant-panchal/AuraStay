import React, { useState, useRef, useEffect } from 'react';
import aavasaLogo from '../assets/aavasa-logo.jpg';
import { useDashboard } from '../context/DashboardContext';
import {
  Menu,
  Sun,
  Moon,
  Search,
  Building2,
  Languages,
  Bell,
  User,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Compass,
  SlidersHorizontal,
  BookOpen,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  LogOut,
  Calendar,
  Plus,
  Wrench,
  Receipt,
  Utensils,
  PartyPopper,
  Package,
  Layers,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  CarTaxiFront,
  X
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
    setIsCreateReservationModalOpen,
    setIsCreateRoomModalOpen,
    setIsCreateRoomTypeModalOpen,
    subModuleTitle,
    isLiveConnected,
    currentHotel,
    logout,
    workingDate,
    showNotification
  } = useDashboard();

  const { property } = data;

  const [isQuickLinksOpen, setIsQuickLinksOpen] = useState(false);
  const quickLinksRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (quickLinksRef.current && !quickLinksRef.current.contains(e.target)) {
        setIsQuickLinksOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'GOOD MORNING', isNight: false };
    if (hour < 17) return { text: 'GOOD AFTERNOON', isNight: false };
    return { text: 'GOOD EVENING', isNight: true };
  };
  const greeting = getGreeting();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs select-none">
      {/* Top Navbar */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        
        {/* Left: Quick Links & Greeting */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigateTo('dashboard')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Aavasa Dashboard"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Client Property Brand Logo */}
          <div
            onClick={() => navigateTo('dashboard')}
            className="flex items-center cursor-pointer pr-1 transition hover:opacity-90"
            title={currentHotel?.name || 'Property Dashboard'}
          >
            <img
              src={currentHotel?.logoUrl || aavasaLogo || "./aavasa-logo.jpg"}
              alt={currentHotel?.name || 'Property Logo'}
              className="h-8 sm:h-9 w-auto max-w-[140px] object-contain rounded"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = aavasaLogo || './aavasa-logo.jpg';
              }}
            />
          </div>

          {/* Exceed Software Quick Links Mega Dropdown */}
          <div className="relative" ref={quickLinksRef}>
            <button
              onClick={() => setIsQuickLinksOpen(!isQuickLinksOpen)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center space-x-1.5 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Quick Links</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isQuickLinksOpen ? 'rotate-180' : ''}`} />
            </button>

            {isQuickLinksOpen && (
              <div className="absolute left-0 top-11 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50 text-xs font-medium text-slate-700 animate-in fade-in duration-150">
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Exceed Quick Actions
                </div>
                
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsQuickLinksOpen(false);
                      setIsCreateReservationModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-indigo-50 hover:text-indigo-900 flex items-center space-x-2.5 transition"
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold">New Reservation</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsQuickLinksOpen(false);
                      setIsCreateRoomModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-indigo-50 hover:text-indigo-900 flex items-center space-x-2.5 transition"
                  >
                    <Building2 className="w-4 h-4 text-sky-600" />
                    <span>Add Room Number (Exceed Master)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsQuickLinksOpen(false);
                      setIsCreateRoomTypeModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-indigo-50 hover:text-indigo-900 flex items-center space-x-2.5 transition"
                  >
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Create Room Category (Exceed Master)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsQuickLinksOpen(false);
                      setIsCreateReservationModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-indigo-50 hover:text-indigo-900 flex items-center space-x-2.5 transition"
                  >
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Walk-In Check-In</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsQuickLinksOpen(false);
                      navigateTo('restaurant-pos');
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-indigo-50 hover:text-indigo-900 flex items-center space-x-2.5 transition"
                  >
                    <Utensils className="w-4 h-4 text-amber-600" />
                    <span>Open POS Billing</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsQuickLinksOpen(false);
                      navigateTo('banquet-events');
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-indigo-50 hover:text-indigo-900 flex items-center space-x-2.5 transition"
                  >
                    <PartyPopper className="w-4 h-4 text-purple-600" />
                    <span>Banquet & Event Booking</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsQuickLinksOpen(false);
                      navigateTo('stock-management');
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-indigo-50 hover:text-indigo-900 flex items-center space-x-2.5 transition"
                  >
                    <Package className="w-4 h-4 text-teal-600" />
                    <span>Stock Requisition & Purchase</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsQuickLinksOpen(false);
                      navigateTo('cab-booking');
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-indigo-50 hover:text-indigo-900 flex items-center space-x-2.5 transition"
                  >
                    <CarTaxiFront className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold">Book Cab (Travel Desk)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsQuickLinksOpen(false);
                      navigateTo('account-finance');
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-indigo-50 hover:text-indigo-900 flex items-center space-x-2.5 transition"
                  >
                    <Receipt className="w-4 h-4 text-rose-600" />
                    <span>Customer Receipt & Voucher</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center space-x-2 pl-2">
            <div className="text-xs font-bold text-slate-800 leading-tight flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{currentHotel?.name || 'Hotel Admin'}</span>
              <span className="text-slate-400 font-normal">({currentHotel?.city || 'India'})</span>
            </div>
          </div>
        </div>

        {/* Right: Operational Date, Property Selector, Search, Avatar */}
        <div className="flex items-center space-x-3 sm:space-x-3.5">
          
          {/* Exceed Operational Date Badge */}
          <div
            onClick={() => navigateTo('dashboard')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 cursor-pointer transition shadow-xs"
            title="Current Working Date (Click to open Night Audit)"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>{workingDate || new Date().toISOString().split('T')[0]}</span>
          </div>

          {/* Search bar */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 transition"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Quick Search</span>
            <kbd className="bg-white text-slate-400 text-[10px] px-1.5 py-0.5 rounded border border-slate-200 font-mono shadow-xs">
              Ctrl+K
            </kbd>
          </button>

          {/* Active Client Property Badge (Tenant-Isolated) */}
          <div
            className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-xs text-xs font-bold text-slate-800"
            title={`${currentHotel?.name || 'Property'} • Tenant Isolated`}
          >
            <Building2 className="w-4 h-4 text-[#0e4860]" />
            <span className="max-w-[150px] truncate">{currentHotel?.name || 'Hotel Admin'}</span>
          </div>

          {/* User Profile Avatar & Logout */}
          <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
            <div 
              className="w-8 h-8 rounded-full bg-[#0b2b48] text-white flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer ring-2 ring-indigo-100"
              title={currentHotel?.name || 'Hotel Admin'}
            >
              <User className="w-4 h-4" />
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Breadcrumb Sub-Bar */}
      {currentView !== 'dashboard' && (
        <div className="px-6 py-2 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <button onClick={() => navigateTo('dashboard')} className="hover:text-indigo-600 font-semibold">
              Live Room Matrix
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              {currentView.replace(/-/g, ' ')}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{currentHotel?.name || 'AuraStay Property'} ({currentHotel?.city || 'Bengaluru'})</span>
          </div>
        </div>
      )}

    </header>
  );
}
