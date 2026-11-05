import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Calendar, 
  RotateCcw, 
  Info, 
  AlertCircle, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  Home, 
  DollarSign, 
  X, 
  ChevronRight, 
  Clock, 
  Sparkles, 
  Check,
  Building2,
  Users
} from 'lucide-react';

export default function CalendarViewAccommodation() {
  const { showNotification, setIsCreateReservationModalOpen } = useDashboard();

  // Mode Switcher: 'operations' | 'revenue' | 'housekeeping'
  const [activeMode, setActiveMode] = useState('operations');

  // Selected Day (5th Nov selected by default as in screenshot)
  const [selectedDay, setSelectedDay] = useState(5);

  // Selected reservation modal for inspection
  const [selectedReservation, setSelectedReservation] = useState(null);

  // Info modal toggle
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Calendar Day Data for November 2026 (30 Days)
  // Matching Screenshots 1, 2, 3, 4, 5
  const calendarDays = [
    {
      day: 1, dayOfWeek: 'SUN',
      // Operations
      opsOccupancy: 18, opsCount: '5/28', arrivals: 5, departures: 8, barColor: 'bg-emerald-600',
      // Revenue
      revenue: '₹13,650', revOccupancy: '18%', adr: '2,730', revpar: '488', fcst: '18%', pickup: '0',
      // Housekeeping
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 8
    },
    {
      day: 2, dayOfWeek: 'MON',
      opsOccupancy: 50, opsCount: '14/28', arrivals: 12, departures: 6, barColor: 'bg-[#0e4860]',
      revenue: '₹35,826', revOccupancy: '50%', adr: '2,559', revpar: '1,280', fcst: '50%', pickup: '+2',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 6
    },
    {
      day: 3, dayOfWeek: 'TUE',
      opsOccupancy: 25, opsCount: '7/28', arrivals: 5, departures: 11, barColor: 'bg-emerald-600',
      revenue: '₹18,883', revOccupancy: '25%', adr: '2,698', revpar: '674', fcst: '25%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 11
    },
    {
      day: 4, dayOfWeek: 'WED',
      opsOccupancy: 21, opsCount: '6/28', arrivals: 5, departures: 4, barColor: 'bg-emerald-600',
      revenue: '₹15,752', revOccupancy: '21%', adr: '2,625', revpar: '563', fcst: '21%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 4
    },
    {
      day: 5, dayOfWeek: 'THU',
      // TODAY / SELECTED
      isToday: true,
      opsOccupancy: 4, opsCount: '1/28', arrivals: 1, departures: 6, barColor: 'bg-emerald-600',
      revenue: '₹2,476', revOccupancy: '4%', adr: '2,476', revpar: '88', fcst: '4%', pickup: '+1',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 6
    },
    {
      day: 6, dayOfWeek: 'FRI',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 1, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '2%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 1
    },
    {
      day: 7, dayOfWeek: 'SAT',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '4%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 8, dayOfWeek: 'SUN',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 9, dayOfWeek: 'MON',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 10, dayOfWeek: 'TUE',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 11, dayOfWeek: 'WED',
      opsOccupancy: 11, opsCount: '3/28', arrivals: 2, departures: 0, barColor: 'bg-emerald-600',
      revenue: '₹8,000', revOccupancy: '11%', adr: '2,667', revpar: '286', fcst: '11%', pickup: '+3',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 12, dayOfWeek: 'THU',
      opsOccupancy: 11, opsCount: '3/28', arrivals: 0, departures: 0, barColor: 'bg-emerald-600',
      revenue: '₹8,000', revOccupancy: '11%', adr: '2,667', revpar: '286', fcst: '11%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 13, dayOfWeek: 'FRI',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 2, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 2
    },
    {
      day: 14, dayOfWeek: 'SAT',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 15, dayOfWeek: 'SUN',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 16, dayOfWeek: 'MON',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 17, dayOfWeek: 'TUE',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 18, dayOfWeek: 'WED',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 19, dayOfWeek: 'THU',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 20, dayOfWeek: 'FRI',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 21, dayOfWeek: 'SAT',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 22, dayOfWeek: 'SUN',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 23, dayOfWeek: 'MON',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 24, dayOfWeek: 'TUE',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 25, dayOfWeek: 'WED',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 26, dayOfWeek: 'THU',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 27, dayOfWeek: 'FRI',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 28, dayOfWeek: 'SAT',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 29, dayOfWeek: 'SUN',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
    {
      day: 30, dayOfWeek: 'MON',
      opsOccupancy: 0, opsCount: '0/28', arrivals: 0, departures: 0, barColor: '',
      revenue: '₹0', revOccupancy: '0%', adr: '0', revpar: '0', fcst: '0%', pickup: '0',
      hkOpen: 0, hkDone: '0/0', unassigned: 0, hkDepartures: 0
    },
  ];

  // Arrivals for the selected day (Screenshot 2)
  const arrivalsList = [
    {
      id: 'BSE-B-864',
      guest: 'Sristi Bhattacharya',
      status: 'CHECKEDIN',
      room: 'Standard Room',
      source: 'Walkin',
      checkIn: 'Thu, Nov 5 08:31 AM',
      checkOut: 'Fri, Nov 6 08:31 AM',
      duration: '1 NIGHT',
      tariff: '₹2,600.00'
    }
  ];

  // Departures for the selected day (Screenshots 2 & 4)
  const departuresList = [
    {
      id: 'BSE-B-852',
      guest: 'Tejender Thakur',
      status: 'CONFIRMED',
      room: 'Deluxe Room',
      source: 'Walkin',
      checkIn: 'Tue, Nov 3 07:42 PM',
      checkOut: 'Thu, Nov 5 07:42 PM',
      duration: '2 NIGHTS',
      tariff: '₹6,400.00'
    },
    {
      id: 'BSE-B-853',
      guest: 'Mr. Manoj Kumar',
      status: 'CONFIRMED',
      room: 'Executive Suite',
      source: 'Direct Web',
      checkIn: 'Tue, Nov 3 02:15 PM',
      checkOut: 'Thu, Nov 5 11:00 AM',
      duration: '2 NIGHTS',
      tariff: '₹9,000.00'
    },
    {
      id: 'AST-B-857',
      guest: 'Shashank Verma',
      status: 'PENDING SETTLEMENT',
      room: 'Standard Room (102)',
      source: 'Walkin',
      checkIn: 'Tue, Nov 3 08:00 PM',
      checkOut: 'Thu, Nov 5 11:00 AM',
      duration: '2 NIGHTS',
      tariff: '₹4,000.00'
    }
  ];

  const handleReset = () => {
    setSelectedDay(5);
    setActiveMode('operations');
    showNotification('Calendar reset to default operations view for November 2026.');
  };

  return (
    <div className="select-none space-y-4">
      {/* 3-COLUMN MAIN LAYOUT (Screenshots 2 & 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* COLUMN 1: LEFT SIDEBAR (~2.5 / 12 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Card 1: TODAY'S ISSUES (Screenshot 2) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                TODAY'S ISSUES
              </h3>
              <span className="bg-rose-100 text-rose-600 font-extrabold text-[10px] px-2 py-0.5 rounded-full tracking-wider">
                LIVE
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Not Ready</span>
                <span className="font-black text-amber-500 text-sm">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Maintenance (OOO)</span>
                <span className="font-black text-amber-500 text-sm">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Pending Arrivals</span>
                <span className="font-black text-amber-500 text-sm">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Overbook Risk</span>
                <span className="font-black text-rose-500 text-sm">0</span>
              </div>
            </div>
          </div>

          {/* Card 2: OWNER SUMMARY (Screenshot 2) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
            <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider mb-2">
              OWNER SUMMARY
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Avg Occupancy</span>
                <span className="font-black text-slate-900">4.00%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Avg ADR</span>
                <span className="font-black text-slate-900">Rs. 2476.19</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total Alerts</span>
                <span className="font-black text-slate-900">0</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: MIDDLE CALENDAR MATRIX (~6 / 12 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-4">
          {/* Header Switcher & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Mode Switcher Pills: Operations | Revenue | Housekeeping */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 text-xs">
              <button
                onClick={() => setActiveMode('operations')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
                  activeMode === 'operations'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Operations
              </button>
              <button
                onClick={() => setActiveMode('revenue')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
                  activeMode === 'revenue'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveMode('housekeeping')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
                  activeMode === 'housekeeping'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Housekeeping
              </button>
            </div>

            <div className="text-sm font-black text-[#0e4860] self-end sm:self-center">
              November 2026
            </div>
          </div>

          {/* Controls: Date Picker, Reset & Info */}
          <div className="flex items-center space-x-2">
            <div className="h-9 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center space-x-2 shadow-2xs flex-1 max-w-xs">
              <span>November 2026</span>
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-auto" />
            </div>

            <button
              onClick={handleReset}
              className="h-9 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-1.5 shadow-2xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={() => setIsInfoOpen(true)}
              className="h-9 w-9 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 flex items-center justify-center shadow-2xs transition"
              title="Metric Definitions"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Matrix Grid */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 bg-slate-50/70 border-b border-slate-200 text-center text-[11px] font-black text-slate-600 py-2.5 uppercase tracking-wider">
              <div>SUN</div>
              <div>MON</div>
              <div>TUE</div>
              <div>WED</div>
              <div>THU</div>
              <div>FRI</div>
              <div>SAT</div>
            </div>

            {/* 30 Day Cells Grid (November 2026 starts on Sunday) */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-white text-xs">
              {calendarDays.map(item => {
                const isSelected = selectedDay === item.day;

                return (
                  <div
                    key={item.day}
                    onClick={() => {
                      setSelectedDay(item.day);
                      showNotification(`Viewing details for Nov ${item.day}, 2026`);
                    }}
                    className={`p-2 transition cursor-pointer min-h-[90px] flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-2 border-[#0e4860] bg-sky-50/40 z-10'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Day Number */}
                    <div className="font-black text-sm text-slate-900 leading-tight">
                      {item.day}
                    </div>

                    {/* CONTENT VARIANT 1: OPERATIONS MODE (Screenshot 2) */}
                    {activeMode === 'operations' && (
                      <div className="space-y-1 my-1">
                        <div className="font-bold text-slate-800 text-[11px] leading-tight">
                          {item.opsOccupancy}% <span className="font-normal text-slate-400">({item.opsCount})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold leading-tight">
                          A: {item.arrivals} | D: {item.departures}
                        </div>
                      </div>
                    )}

                    {/* CONTENT VARIANT 2: REVENUE MODE (Screenshot 1) */}
                    {activeMode === 'revenue' && (
                      <div className="space-y-1 my-1">
                        <div className="flex items-baseline space-x-1">
                          <span className="font-black text-slate-900 text-[11.5px] leading-tight">{item.revenue}</span>
                          <span className="text-[10px] font-bold text-slate-400">{item.revOccupancy}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 leading-tight">
                          ADR {item.adr} | RevPAR {item.revpar}
                        </div>
                        {item.day <= 7 && (
                          <div className="text-[9.5px] font-bold text-sky-700 leading-tight">
                            Fcst {item.fcst} • Pickup {item.pickup}
                          </div>
                        )}
                      </div>
                    )}

                    {/* CONTENT VARIANT 3: HOUSEKEEPING MODE (Screenshot 3) */}
                    {activeMode === 'housekeeping' && (
                      <div className="space-y-1 my-1">
                        <div className="font-black text-slate-900 text-xs leading-tight">
                          {item.hkOpen} open
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          ({item.hkDone} done)
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold leading-tight">
                          Unassigned: {item.unassigned} | D: {item.hkDepartures}
                        </div>
                      </div>
                    )}

                    {/* Mini Progress Bar at bottom */}
                    <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden mt-auto">
                      {item.opsOccupancy > 0 && (
                        <div
                          className={`h-full rounded-full ${item.barColor || 'bg-emerald-600'}`}
                          style={{ width: `${Math.min(item.opsOccupancy * 2, 100)}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Empty placeholder cells for end of calendar week */}
              <div className="p-2 min-h-[90px] bg-slate-50/20" />
              <div className="p-2 min-h-[90px] bg-slate-50/20" />
              <div className="p-2 min-h-[90px] bg-slate-50/20" />
              <div className="p-2 min-h-[90px] bg-slate-50/20" />
              <div className="p-2 min-h-[90px] bg-slate-50/20" />
            </div>
          </div>
        </div>

        {/* COLUMN 3: RIGHT SIDEBAR (~3.5 / 12 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Card 1: ARRIVALS (Screenshot 2) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                ARRIVALS
              </h3>
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center">
                1
              </span>
            </div>

            {/* Arrival Item: Sristi Bhattacharya */}
            {arrivalsList.map(item => (
              <div 
                key={item.id}
                className="bg-slate-50/60 hover:bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2 transition shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900">{item.guest}</span>
                  <span className="bg-amber-50 text-amber-700 border border-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                    {item.status}
                  </span>
                </div>

                <div className="font-bold text-[#0e4860]">
                  Reservation # {item.id}
                </div>

                <div className="text-slate-500 font-medium">
                  {item.room} | {item.source}
                </div>

                {/* Timing Row */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-slate-400" /> CHECK-IN
                    </div>
                    <div className="font-bold text-slate-800 text-[11px] mt-0.5">{item.checkIn}</div>
                  </div>

                  <span className="bg-[#0e4860] text-white text-[10px] font-black px-2 py-1 rounded-md shrink-0">
                    {item.duration}
                  </span>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">CHECK OUT</div>
                    <div className="font-bold text-slate-800 text-[11px] mt-0.5">{item.checkOut}</div>
                  </div>
                </div>

                <div className="pt-1 text-right">
                  <button
                    onClick={() => setSelectedReservation(item)}
                    className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center space-x-1 ml-auto"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Card 2: DEPARTURES (Screenshots 2 & 4) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                DEPARTURES
              </h3>
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center">
                6
              </span>
            </div>

            {/* Departures List */}
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {departuresList.map(item => (
                <div 
                  key={item.id}
                  className="bg-slate-50/60 hover:bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2 transition shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-900">{item.guest}</span>
                    <span className="bg-amber-50 text-amber-700 border border-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                      {item.status}
                    </span>
                  </div>

                  <div className="font-bold text-[#0e4860]">
                    Reservation # {item.id}
                  </div>

                  <div className="text-slate-500 font-medium">
                    {item.room} | {item.source}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-slate-400" /> CHECK-IN
                      </div>
                      <div className="font-bold text-slate-800 text-[11px] mt-0.5">{item.checkIn}</div>
                    </div>

                    <span className="bg-[#0e4860] text-white text-[10px] font-black px-2 py-1 rounded-md shrink-0">
                      {item.duration}
                    </span>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">CHECK OUT</div>
                      <div className="font-bold text-slate-800 text-[11px] mt-0.5">{item.checkOut}</div>
                    </div>
                  </div>

                  <div className="pt-1 text-right">
                    <button
                      onClick={() => setSelectedReservation(item)}
                      className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center space-x-1 ml-auto"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: STAY OVER BOOKINGS (Screenshot 5) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              STAY OVER BOOKINGS
            </span>
            <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-xs flex items-center justify-center">
              0
            </span>
          </div>

          {/* Card 4: EXCEPTIONS (Screenshot 5) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              EXCEPTIONS
            </span>
            <span className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-black text-xs flex items-center justify-center">
              0
            </span>
          </div>
        </div>
      </div>

      {/* RESERVATION DETAIL MODAL */}
      {selectedReservation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="font-black text-sm text-slate-900">{selectedReservation.guest}</div>
              <button 
                onClick={() => setSelectedReservation(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking ID:</span>
                <span className="font-mono font-bold text-slate-800">{selectedReservation.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Allocated Room:</span>
                <span className="font-bold text-slate-800">{selectedReservation.room}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Booking Source:</span>
                <span className="font-bold text-slate-800">{selectedReservation.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stay Dates:</span>
                <span className="font-bold text-slate-800">{selectedReservation.checkIn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Tariffs:</span>
                <span className="font-mono font-bold text-emerald-700">{selectedReservation.tariff}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500">Status:</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  {selectedReservation.status}
                </span>
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => {
                  showNotification(`Guest folio opened for ${selectedReservation.guest}`);
                  setSelectedReservation(null);
                }}
                className="flex-1 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Open Folio
              </button>
              <button
                onClick={() => setSelectedReservation(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* METRIC DEFINITIONS INFO MODAL */}
      {isInfoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900">Accommodation Calendar Metrics</h3>
              <button onClick={() => setIsInfoOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div>
                <strong className="text-slate-900">Operations Mode:</strong> Displays real-time occupancy rates, occupied room counts over total inventory (e.g. 5/28), and arrivals (A) / departures (D).
              </div>
              <div>
                <strong className="text-slate-900">Revenue Mode:</strong> Shows daily realized gross room revenues, ADR (Average Daily Rate), RevPAR, demand forecasts, and day-over-day pickup trends.
              </div>
              <div>
                <strong className="text-slate-900">Housekeeping Mode:</strong> Tracks open cleaning work orders, completed sanitizations, unassigned tasks, and dirty checkout departures.
              </div>
            </div>

            <button
              onClick={() => setIsInfoOpen(false)}
              className="w-full py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs rounded-lg shadow-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

