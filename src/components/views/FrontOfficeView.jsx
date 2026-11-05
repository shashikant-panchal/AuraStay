import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import StayViewCalendar from './StayViewCalendar';
import DayViewOperations from './DayViewOperations';
import CalendarViewAccommodation from './CalendarViewAccommodation';
import ReservationManagementView from './ReservationManagementView';
import {
  Building2,
  Home,
  LayoutGrid,
  Eye,
  CalendarDays,
  Calendar,
  FileText,
  Trophy,
  Play,
  Download,
  Plus,
  ArrowUpRight,
  AlertTriangle,
  Users,
  ArrowRight,
  CreditCard,
  Receipt,
  Search,
  MessageSquare,
  MoreHorizontal,
  CheckCircle2,
  User,
  Clock,
  BedDouble,
  Filter,
  X,
  Printer,
  Sparkles,
  Send
} from 'lucide-react';

export default function FrontOfficeView() {
  const {
    rooms,
    updateRoomStatus,
    setIsCreateReservationModalOpen,
    setIsTourOpen,
    setIsSearchOpen,
    navigateTo,
    showNotification,
    frontOfficeSubTab,
    setFrontOfficeSubTab
  } = useDashboard();

  // Sub-tabs: 'dashboard', 'stayview', 'dayview', 'calendar'
  const [localSubTab, setLocalSubTab] = useState('dashboard');
  const activeSubTab = frontOfficeSubTab || localSubTab;
  const setActiveSubTab = (tab) => {
    if (setFrontOfficeSubTab) setFrontOfficeSubTab(tab);
    setLocalSubTab(tab);
  };

  // Modals for Front Desk Actions
  const [activeActionModal, setActiveActionModal] = useState(null); // 'grc', 'feedback', 'invoice'
  const [selectedCheckInForAction, setSelectedCheckInForAction] = useState(null);

  // Table Data for Today's Room Availability & BAR (Exact values from Screenshot 2 & 3)
  const roomAvailabilityData = [
    { category: 'DayTrip', bar: 1000.00, toSell: 5, sold: 0, available: 5, occupancy: 0 },
    { category: 'Standard Room', bar: 2000.00, toSell: 5, sold: 1, available: 4, occupancy: 20 },
    { category: 'Deluxe Room', bar: 2500.00, toSell: 5, sold: 0, available: 5, occupancy: 0 },
    { category: 'Super Deluxe Room', bar: 3000.00, toSell: 5, sold: 0, available: 5, occupancy: 0 },
    { category: 'Suite Room', bar: 3500.00, toSell: 5, sold: 0, available: 5, occupancy: 0 },
    { category: 'Banquet Hall', bar: 5000.00, toSell: 2, sold: 0, available: 2, occupancy: 0 },
  ];

  // Recent Check-ins (Exact records from Screenshot 4)
  const recentCheckIns = [
    {
      id: 'BSE-B-864',
      guest: 'Sristi Bhattacharya',
      room: 'Standard Room',
      time: '2 hrs ago',
      amount: 2600.00,
      status: 'CHECKEDIN',
      phone: '+91 98450 44211',
      idProof: 'Aadhaar Verified'
    },
    {
      id: 'BSE-B-861',
      guest: 'Dibyajeeban Nayak',
      room: 'Super Deluxe Room',
      time: '23 hrs ago',
      amount: 3139.50,
      status: 'CHECKEDIN',
      phone: '+91 97110 88299',
      idProof: 'Passport on file'
    },
    {
      id: 'BSE-B-858',
      guest: 'Dr. Alok Mishra',
      room: 'Deluxe Room',
      time: '1 day ago',
      amount: 3200.00,
      status: 'CHECKEDIN',
      phone: '+91 94370 12890',
      idProof: 'Corporate DCC Medical'
    }
  ];

  const handleDownloadReport = () => {
    showNotification('Generating Accommodation Operations Report (CSV / PDF)...');
  };

  const frontDeskActions = [
    {
      label: 'GRC Form',
      icon: FileText,
      onClick: () => setActiveActionModal('grc'),
    },
    {
      label: 'Feedback Form',
      icon: MessageSquare,
      onClick: () => setActiveActionModal('feedback'),
    },
    {
      label: 'Book A Room',
      icon: Home,
      onClick: () => setIsCreateReservationModalOpen(true),
    },
    {
      label: 'Room Enquiry',
      icon: Search,
      onClick: () => setIsSearchOpen(true),
    },
    {
      label: 'Send Registration',
      icon: Calendar,
      onClick: () => showNotification('Digital guest pre-registration link sent via SMS / WhatsApp.'),
    },
    {
      label: 'Booking Invoice',
      icon: Receipt,
      onClick: () => setActiveActionModal('invoice'),
    },
  ];

  return (
    <div className="space-y-5 select-none">
      {/* 1. Breadcrumb (Exact match with Screenshot 1) */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center space-x-1.5">
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <span className="hover:text-slate-800 cursor-pointer" onClick={() => navigateTo('master-service-home')}>Home</span>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-900">Accommodation Dashboard</span>
        </div>

        {/* Quick Actions toggle from Screenshot 1 */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-600">Quick Actions</span>
          <div className="w-10 h-5 bg-slate-200 rounded-full p-0.5 cursor-pointer flex items-center">
            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </div>
        </div>
      </div>

      {/* 2. Sub-navigation Tabs Strip (Exact match with Screenshot 1) */}
      <div className="flex items-center space-x-2 border-b border-slate-200/80 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs ${activeSubTab === 'dashboard'
              ? 'bg-[#0b4d68] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveSubTab('stayview')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${activeSubTab === 'stayview'
              ? 'bg-[#0b4d68] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Eye className="w-4 h-4" />
          <span>Stayview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('dayview')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${activeSubTab === 'dayview'
              ? 'bg-[#0b4d68] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Dayview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('calendar')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${activeSubTab === 'calendar'
              ? 'bg-[#0b4d68] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Calendar View</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reservations')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeSubTab === 'reservations'
              ? 'bg-[#0e4860] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Reservations</span>
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-5">
          {/* 3. Title & Actions Header Row (Screenshot 1) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div>
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-300 px-2 py-0.5 rounded tracking-wider">
                  BOOKONE PMS
                </span>
                <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" /> MASTERY: 0%
                </span>
              </div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Accommodation Dashboard
                </h1>
                <button
                  onClick={() => setIsTourOpen(true)}
                  className="flex items-center space-x-1 text-xs font-bold text-sky-600 hover:text-sky-800 transition"
                >
                  <Play className="w-3 h-3 fill-sky-600 text-sky-600" />
                  <span>Tour</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Manage rooms, check-ins, and floor operations.
              </p>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                onClick={handleDownloadReport}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>
              <button
                onClick={() => setIsCreateReservationModalOpen(true)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Reservation</span>
              </button>
            </div>
          </div>

          {/* 4. Row 1: Priorities & Snapshots Cards (Exact match with Screenshot 1) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: TODAY'S PRIORITIES */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-4 h-4 text-slate-700" />
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  TODAY'S PRIORITIES
                </h3>
              </div>
              <div className="space-y-3.5">
                <div className="flex items-center space-x-3.5">
                  <span className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 border border-amber-200/90 font-black text-xs flex items-center justify-center">
                    0
                  </span>
                  <span className="text-xs font-bold text-slate-700">Pending Arrivals</span>
                </div>
                <div className="flex items-center space-x-3.5">
                  <span className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 border border-rose-200/90 font-black text-xs flex items-center justify-center">
                    1
                  </span>
                  <span className="text-xs font-bold text-slate-700">Pending Checkouts</span>
                </div>
                <div className="flex items-center space-x-3.5">
                  <span className="w-6 h-6 rounded-md bg-sky-50 text-sky-600 border border-sky-200/90 font-black text-xs flex items-center justify-center">
                    1
                  </span>
                  <span className="text-xs font-bold text-slate-700">Rooms to Clean</span>
                </div>
                <div className="flex items-center space-x-3.5">
                  <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200/90 font-black text-xs flex items-center justify-center">
                    0
                  </span>
                  <span className="text-xs font-bold text-slate-700">Payment Pending</span>
                </div>
              </div>
            </div>

            {/* Card 2: PICKUP SNAPSHOT */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  PICKUP SNAPSHOT
                </h3>
                <span className="bg-[#f06565] text-white text-[9.5px] font-bold px-2 py-0.5 rounded shadow-2xs">
                  Coming Soon
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Rooms Sold (Next 7 Days)</div>
                  <div className="flex items-baseline space-x-2 mt-0.5">
                    <span className="text-2xl font-black text-slate-900">142</span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center">
                      <ArrowUpRight className="w-3.5 h-3.5" /> +12
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">ADR Pickup</div>
                  <div className="flex items-baseline space-x-2 mt-0.5">
                    <span className="text-2xl font-black text-slate-900">₹4,250</span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center">
                      <ArrowUpRight className="w-3.5 h-3.5" /> +₹150
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: EXCEPTIONS */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-1.5 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="font-extrabold text-xs uppercase tracking-wider">
                    EXCEPTIONS
                  </h3>
                </div>
                <span className="bg-[#f06565] text-white text-[9.5px] font-bold px-2 py-0.5 rounded shadow-2xs">
                  Coming Soon
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-bold text-slate-800">Overbook Risk</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Jan 02 - Deluxe</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Parity Breach</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Booking.com &lt; Direct</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">OOO Rooms</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Room 304 (AC)</div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Row 2: Four Core Metric KPI Cards (Exact match with Screenshot 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold text-slate-700">Total Revenue</span>
                <span className="text-sm font-bold text-slate-400">₹</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-900 tracking-tight">₹90,442.00</div>
                <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +0% from last month
                </div>
              </div>
            </div>

            {/* Occupancy Rate */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold text-slate-700">Occupancy Rate</span>
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-900 tracking-tight">24%</div>
                <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +0% from last month
                </div>
              </div>
            </div>

            {/* New Bookings */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold text-slate-700">New Bookings</span>
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-900 tracking-tight">+28</div>
                <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +0% from last month
                </div>
              </div>
            </div>

            {/* Active Guests */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold text-slate-700">Active Guests</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-900 tracking-tight">678</div>
                <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +0% from last month
                </div>
              </div>
            </div>
          </div>

          {/* 6. Row 3: Four Quick Operational Status Pills (Exact match with Screenshot 2) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* ARRIVALS */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <ArrowRight className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ARRIVALS</div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-black text-slate-900">1</span>
                  <span className="text-xs font-semibold text-amber-500">0 pending</span>
                </div>
              </div>
            </div>

            {/* DEPARTURES */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ArrowRight className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DEPARTURES</div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-black text-slate-900">6</span>
                  <span className="text-xs font-semibold text-amber-500">1 pending</span>
                </div>
              </div>
            </div>

            {/* IN-HOUSE */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IN-HOUSE</div>
                <div className="text-xl font-black text-slate-900">2</div>
              </div>
            </div>

            {/* DUE PAYMENTS */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DUE PAYMENTS</div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-black text-slate-900">₹0.00</span>
                  <span className="text-xs font-semibold text-amber-500">0 pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Row 4: Today's Room Availability & BAR Table + Front Desk Actions (Exact match with Screenshots 2 & 3) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Left: Availability & BAR Table (3 Columns) */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <Building2 className="w-4 h-4 text-[#0e4860]" />
                  <h3 className="text-sm font-bold text-slate-900">Today's Room Availability & BAR</h3>
                  <span className="bg-sky-100 text-sky-800 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full">
                    4% Occupancy
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  <span className="text-emerald-600 font-bold">27</span>available / <span className="text-sky-600 font-bold">1</span>sold / <span className="text-slate-600 font-bold">28</span>total
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#e6f2f7] text-[#0e4860] font-bold">
                      <th className="py-2.5 px-4 font-bold">Room Category</th>
                      <th className="py-2.5 px-4 font-bold text-right">BAR (₹)</th>
                      <th className="py-2.5 px-4 font-bold text-center">To Sell</th>
                      <th className="py-2.5 px-4 font-bold text-center">Sold</th>
                      <th className="py-2.5 px-4 font-bold text-center">Available</th>
                      <th className="py-2.5 px-4 font-bold w-44">Occupancy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {roomAvailabilityData.map(row => (
                      <tr key={row.category} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-800">{row.category}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{row.bar.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-600">{row.toSell}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                            {row.sold}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                            {row.available}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${row.occupancy}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-600 w-8 text-right">{row.occupancy}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                      <td className="py-3 px-4">Total</td>
                      <td className="py-3 px-4"></td>
                      <td className="py-3 px-4 text-center">28</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                          1
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                          27
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800">4%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Front Desk Actions (1 Column) */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Front Desk Actions</h3>
                <div className="space-y-1.5">
                  {frontDeskActions.map(act => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.label}
                        onClick={act.onClick}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left transition group border border-transparent hover:border-slate-200"
                      >
                        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 group-hover:bg-sky-100 transition">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">{act.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 8. Row 5: Revenue Overview & Room Occupancy by Type (Exact match with Screenshot 3) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Revenue Overview */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Revenue Overview</h3>
                <p className="text-xs text-slate-500 mt-0.5">Daily revenue performance for the current week.</p>
              </div>

              {/* Area Chart matching screenshot curve */}
              <div className="mt-4 h-44 relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 140" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="frontRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0e4860" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#0e4860" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 10,25 Q 60,130 140,128 T 280,130 T 420,132 L 490,132 L 490,140 L 10,140 Z"
                    fill="url(#frontRevGrad)"
                  />
                  <path
                    d="M 10,25 Q 60,130 140,128 T 280,130 T 420,132 L 490,132"
                    fill="none"
                    stroke="#0e4860"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
                {/* Day Labels */}
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mt-2 px-1">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>

            {/* Room Occupancy by Type */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Room Occupancy by Type</h3>
                <p className="text-xs text-slate-500 mt-0.5">Current distribution of occupied rooms.</p>
              </div>

              <div className="space-y-3.5 mt-4">
                {[
                  { name: 'Standard Room', percent: 20 },
                  { name: 'Deluxe Room', percent: 0 },
                  { name: 'Super Deluxe Room', percent: 0 },
                  { name: 'Suite Room', percent: 0 },
                  { name: 'Banquet Hall', percent: 0 },
                ].map(r => (
                  <div key={r.name} className="flex items-center text-xs">
                    <div className="w-36 font-semibold text-slate-700 text-right pr-3 truncate">{r.name}</div>
                    <div className="flex-1 bg-slate-100 rounded h-3 overflow-hidden">
                      {r.percent > 0 && (
                        <div
                          className="bg-[#0e4860] h-full rounded transition-all duration-500"
                          style={{ width: `${r.percent}%` }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 9. Row 6: Recent Check-ins (Exact match with Screenshot 4) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Check-ins</h3>
                <p className="text-xs text-slate-500 mt-0.5">Latest guest arrivals and their status.</p>
              </div>
              <button
                onClick={() => navigateTo('reservation-management')}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition"
              >
                View All
              </button>
            </div>

            <div className="p-4 space-y-3">
              {recentCheckIns.map(chk => (
                <div
                  key={chk.id}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-slate-800">{chk.id}</span>
                        <span className="font-bold text-sm text-slate-900">{chk.guest}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {chk.room} • {chk.time}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 self-end sm:self-center">
                    <button
                      onClick={() => showNotification(`Viewing folios for ${chk.guest}`)}
                      className="bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs px-3.5 py-1.5 rounded-md tracking-wider transition shadow-2xs"
                    >
                      CHECKEDIN
                    </button>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      ₹{chk.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => setSelectedCheckInForAction(chk)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                      title="More Options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STAYVIEW TAB (Exact Match with All 5 Screenshots) */}
      {activeSubTab === 'stayview' && (
        <StayViewCalendar />
      )}

      {/* DAYVIEW TAB (Exact Match with All 5 Screenshots) */}
      {activeSubTab === 'dayview' && (
        <DayViewOperations />
      )}

      {/* CALENDAR VIEW TAB (Exact Match with All 5 Screenshots) */}
      {activeSubTab === 'calendar' && (
        <CalendarViewAccommodation />
      )}

      {/* RESERVATIONS TAB (Exact Match with All 4 Screenshots) */}
      {activeSubTab === 'reservations' && (
        <ReservationManagementView isSubTab={true} />
      )}

      {/* ACTION MODAL: GRC FORM */}
      {activeActionModal === 'grc' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Guest Registration Card (GRC)</h3>
                <p className="text-xs text-slate-500">Official statutory check-in registration format</p>
              </div>
              <button
                onClick={() => setActiveActionModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700">Property:</span>
                <span className="text-slate-900 font-semibold">BookOne Suite (DLF Cyber City, Patia)</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700">Guest Name:</span>
                <span className="text-slate-900 font-semibold">Sristi Bhattacharya</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700">Booking Reference:</span>
                <span className="text-slate-900 font-mono font-bold">BSE-B-864</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700">Allocated Room:</span>
                <span className="text-slate-900 font-semibold">Standard Room (101)</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700">Tariff Realized:</span>
                <span className="text-slate-900 font-bold">₹2,600.00 / night</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">ID / KYC Verification:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aadhaar Verified
                </span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => {
                  showNotification('Printing GRC Card for guest signature...');
                  setActiveActionModal(null);
                }}
                className="flex-1 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official GRC</span>
              </button>
              <button
                onClick={() => setActiveActionModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL: FEEDBACK FORM */}
      {activeActionModal === 'feedback' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Guest Stay Feedback</h3>
                <p className="text-xs text-slate-500">Record departure experience & satisfaction</p>
              </div>
              <button
                onClick={() => setActiveActionModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Guest / Room</label>
                <input
                  type="text"
                  defaultValue="Shashank Verma (Room 102)"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Overall Rating (1 - 5 Stars)</label>
                <div className="flex space-x-2 text-amber-400 text-lg cursor-pointer">
                  {'★★★★★'}
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Comments / Suggestions</label>
                <textarea
                  rows="3"
                  defaultValue="Excellent front desk service and prompt check-in by Twinkle Bagh."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => {
                  showNotification('Guest feedback recorded and added to CRM profile.');
                  setActiveActionModal(null);
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition"
              >
                Submit Feedback
              </button>
              <button
                onClick={() => setActiveActionModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL: BOOKING INVOICE */}
      {activeActionModal === 'invoice' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Tax Invoice & Folio Statement</h3>
                <p className="text-xs text-slate-500">Official GST receipt and stay breakdown</p>
              </div>
              <button
                onClick={() => setActiveActionModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span>Room Tariff (2 nights):</span>
                <span>₹5,200.00</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span>F&B The Spice Pavilion (KOT 363):</span>
                <span>₹780.00</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span>CGST (6%):</span>
                <span>₹358.80</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span>SGST (6%):</span>
                <span>₹358.80</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                <span>Total Amount Due / Paid:</span>
                <span>₹6,697.60</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => {
                  showNotification('Printing official tax invoice...');
                  setActiveActionModal(null);
                }}
                className="flex-1 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Invoice</span>
              </button>
              <button
                onClick={() => setActiveActionModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECK-IN OPTIONS MODAL */}
      {selectedCheckInForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="font-bold text-sm text-slate-900">{selectedCheckInForAction.guest}</div>
              <button onClick={() => setSelectedCheckInForAction(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Booking ID:</span>
                <span className="font-mono font-bold text-slate-800">{selectedCheckInForAction.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Room:</span>
                <span className="font-bold text-slate-800">{selectedCheckInForAction.room}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-mono font-bold text-emerald-700">₹{selectedCheckInForAction.amount.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  showNotification(`Guest folio opened for ${selectedCheckInForAction.guest}`);
                  setSelectedCheckInForAction(null);
                }}
                className="w-full py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Open Folio & Ledger
              </button>
              <button
                onClick={() => {
                  showNotification(`Sending digital invoice to ${selectedCheckInForAction.phone}`);
                  setSelectedCheckInForAction(null);
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
              >
                Send WhatsApp Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
