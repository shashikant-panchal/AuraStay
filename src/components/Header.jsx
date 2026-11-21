import React, { useState, useRef, useEffect } from 'react';
import aavasaLogo from '../assets/aavasa-logo.webp';
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
    showNotification,
    reservations = [],
    openReservationDetails,
    playBookingBellSound
  } = useDashboard();

  const { property } = data;

  const [isQuickLinksOpen, setIsQuickLinksOpen] = useState(false);
  const quickLinksRef = useRef(null);

  // Notification center state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [clearedNotifIds, setClearedNotifIds] = useState(() => {
    try {
      const storageKey = `aurastay_cleared_notifs_${currentHotel?.id || 'default'}`;
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Re-sync cleared IDs when hotel changes
  useEffect(() => {
    try {
      const storageKey = `aurastay_cleared_notifs_${currentHotel?.id || 'default'}`;
      const saved = localStorage.getItem(storageKey);
      setClearedNotifIds(saved ? JSON.parse(saved) : []);
    } catch {
      setClearedNotifIds([]);
    }
  }, [currentHotel?.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (quickLinksRef.current && !quickLinksRef.current.contains(e.target)) {
        setIsQuickLinksOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDismissNotif = (resId, e) => {
    if (e) e.stopPropagation();
    if (!resId) return;
    setClearedNotifIds(prev => {
      const updated = Array.from(new Set([...prev, String(resId)]));
      try {
        const storageKey = `aurastay_cleared_notifs_${currentHotel?.id || 'default'}`;
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save dismissed notification:', err);
      }
      return updated;
    });
  };

  const handleClearAllNotifs = (e) => {
    if (e) e.stopPropagation();
    const allIds = activeNotifications.map(n => String(n.id));
    setClearedNotifIds(prev => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      try {
        const storageKey = `aurastay_cleared_notifs_${currentHotel?.id || 'default'}`;
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to clear notifications:', err);
      }
      return updated;
    });
  };

  const todayStr = workingDate || new Date().toISOString().split('T')[0];
  const threeDaysAgoStr = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const activeNotifications = (reservations || []).filter(res => {
    if (!res || !res.id) return false;
    const resId = String(res.id);
    if (clearedNotifIds.includes(resId)) return false;

    const checkOut = String(res.check_out || res.checkOut || '');
    const status = String(res.status || 'CONFIRMED').toUpperCase();

    // Upcoming or In-House stays: shown until stay is over
    if (checkOut >= todayStr || status === 'CONFIRMED' || status === 'RESERVED' || status === 'CHECKED_IN' || status === 'OCCUPIED') {
      return true;
    }

    // Past stays (checkout before today): show only within 3 days, auto-clear older than 3 days
    if (checkOut && checkOut >= threeDaysAgoStr) {
      return true;
    }

    return false;
  });

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
              src={currentHotel?.logoUrl || aavasaLogo || "./aavasa-logo.webp"}
              alt={currentHotel?.name || 'Property Logo'}
              className="h-8 sm:h-9 w-auto max-w-[140px] object-contain rounded"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = aavasaLogo || './aavasa-logo.webp';
              }}
            />
          </div>

          {/* AuraStay Quick Links Mega Dropdown */}
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
                  Quick Actions
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
                    <span>Add Room Number</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsQuickLinksOpen(false);
                      setIsCreateRoomTypeModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-indigo-50 hover:text-indigo-900 flex items-center space-x-2.5 transition"
                  >
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Create Room Category</span>
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
                    <span>Customer Receipt & Invoice</span>
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
          
          {/* Operational Date Badge */}
          <div
            onClick={() => navigateTo('dashboard')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 cursor-pointer transition shadow-xs"
            title="Current Operational Date (View Live Room Matrix)"
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

          {/* Booking Notifications Center */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shadow-xs cursor-pointer border border-slate-200"
              title="Booking Notifications & Alerts"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {activeNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-xs animate-pulse">
                  {activeNotifications.length > 99 ? '99+' : activeNotifications.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 text-xs font-medium text-slate-700 animate-in fade-in duration-150">
                {/* Header */}
                <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-slate-900 text-sm">Notifications</span>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                      {activeNotifications.length} Active
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => playBookingBellSound?.()}
                      className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 rounded-lg text-[10px] font-bold text-slate-600 transition flex items-center space-x-1 cursor-pointer"
                      title="Play 3s chime alert"
                    >
                      <span>🔔 Test Chime</span>
                    </button>
                    {activeNotifications.length > 0 && (
                      <button
                        onClick={handleClearAllNotifs}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        title="Clear all active notifications"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 py-1">
                  {activeNotifications.length === 0 ? (
                    <div className="py-8 px-4 text-center">
                      <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-600 text-xs">No active notifications</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Upcoming bookings and recent stays will appear here.</p>
                    </div>
                  ) : (
                    activeNotifications.slice(0, 50).map((res) => {
                      const resId = res.id || 'N/A';
                      const guestName = res.guest || res.name || 'Valued Guest';
                      const roomNum = res.room_number || (res.rooms && res.rooms[0]) || (String(res.room || '').match(/\b(\d+)\b/)?.[1]) || 'Unassigned';
                      const roomCategory = res.room_type || res.roomType || 'Standard Room';
                      const checkIn = res.check_in || res.checkIn || 'N/A';
                      const checkOut = res.check_out || res.checkOut || 'N/A';
                      const amount = Number(res.amount !== undefined ? res.amount : (res.total || 0));
                      const isUpcoming = checkOut >= todayStr;

                      return (
                        <div
                          key={resId}
                          onClick={() => {
                            setIsNotifOpen(false);
                            openReservationDetails(res);
                          }}
                          className="p-3 hover:bg-slate-50 transition cursor-pointer flex items-start justify-between gap-2 group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1.5 mb-1">
                              <span className={`w-2 h-2 rounded-full ${isUpcoming ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                              <span className="font-bold text-slate-900 truncate text-xs">{guestName}</span>
                              <span className="text-[10px] font-mono text-slate-400">#{resId}</span>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              Room #{roomNum} ({roomCategory})
                            </p>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1 font-mono">
                              <span>{checkIn} → {checkOut}</span>
                              <span>•</span>
                              <span className="font-bold text-slate-800">₹{amount.toLocaleString('en-IN')}</span>
                              <span>•</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                isUpcoming ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {isUpcoming ? 'Upcoming / In-House' : 'Past (3-Day Retention)'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDismissNotif(resId, e)}
                            className="p-1 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-200 transition shrink-0 opacity-80 group-hover:opacity-100"
                            title="Dismiss notification"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Note */}
                <div className="px-4 pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center">
                  Upcoming stays remain active until checkout. Past stays auto-clear in 3 days.
                </div>
              </div>
            )}
          </div>

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
