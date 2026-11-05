import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Search, 
  ArrowUpRight, 
  Clock, 
  BarChart3, 
  Contact, 
  LogIn, 
  LogOut, 
  Wallet, 
  Calendar, 
  Home, 
  TrendingUp, 
  Percent, 
  Package, 
  PlusCircle, 
  Users, 
  CreditCard, 
  BarChart2, 
  ShoppingCart, 
  Tag, 
  Shield, 
  Download, 
  Printer, 
  X,
  FileText,
  Filter,
  CheckCircle2
} from 'lucide-react';

// Exact 18 reports from Screenshots 1, 2, 3
const REPORTS_CATALOG = [
  {
    id: 'night-audit',
    title: 'Night Audit Report',
    subtitle: 'Final summary of daily transactions, occupancy, and revenue.',
    overview: 'End-of-day closure and validation.',
    departments: ['Front-Office', 'Finance'],
    icon: Clock,
    iconBg: 'bg-sky-50 text-sky-700 border-sky-100',
    data: [
      { metric: 'Gross Room Revenue', value: '₹0.00', status: 'Reconciled' },
      { metric: 'Occupancy Rate', value: '0% (0/0 Rooms)', status: 'Verified' },
      { metric: 'ADR (Average Daily Rate)', value: '₹0.00', status: 'Calculated' },
      { metric: 'RevPAR', value: '₹0.00', status: 'Calculated' },
      { metric: 'Cash in Drawer', value: '₹0.00', status: 'Balanced' }
    ]
  },
  {
    id: 'occupancy',
    title: 'Occupancy Report',
    subtitle: 'Shows how many rooms are occupied vs available.',
    overview: 'Daily operations and yield tracking.',
    departments: ['Operations', 'Revenue'],
    icon: BarChart3,
    iconBg: 'bg-teal-50 text-teal-700 border-teal-100',
    data: [
      { metric: 'Total Operational Rooms', value: '0 Rooms', status: 'Active' },
      { metric: 'Occupied Rooms', value: '0 Rooms', status: 'Occupied' },
      { metric: 'Vacant Ready Rooms', value: '0 Rooms', status: 'Clean' },
      { metric: 'Out of Order (OOO)', value: '0 Rooms', status: 'Normal' },
      { metric: 'Average Stay Duration', value: '0 Nights', status: 'Normal' }
    ]
  },
  {
    id: 'police-checkin',
    title: 'Check-in/Police Report',
    subtitle: 'Guest identity logs and government compliance export.',
    overview: 'Statutory compliance for guest tracking.',
    departments: ['Legal / Security'],
    icon: Contact,
    iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    data: [
      { metric: 'Total Registered In-House', value: '0 Guests', status: 'Verified' },
      { metric: 'Aadhaar Verified Guests', value: '0 / 0', status: 'KYC Ready' },
      { metric: 'Foreign Nationals (Form-C)', value: '0 Required', status: 'N/A' },
      { metric: 'Local Police PS Station Ref', value: 'Station Log Active', status: 'Logged' }
    ]
  },
  {
    id: 'arrival-report',
    title: 'Arrival Report',
    subtitle: 'List of all expected guest arrivals for the day or date range.',
    overview: 'Helps prepare for front desk operations.',
    departments: ['Front-Office'],
    icon: LogIn,
    iconBg: 'bg-sky-50 text-sky-700 border-sky-100',
    data: [
      { metric: 'Today Expected Arrivals', value: '0 Bookings', status: 'Scheduled' },
      { metric: 'Arrived / Checked In', value: '0', status: 'In-House' },
      { metric: 'VIP / Corporate Arrivals', value: '0', status: 'Standard' },
      { metric: 'Special Requests Logged', value: 'None', status: 'None' }
    ]
  },
  {
    id: 'departure-report',
    title: 'Departure/Sales Report',
    subtitle: 'Guests scheduled for check-out today.',
    overview: 'Ensure timely billing and housekeeping scheduling.',
    departments: ['Front-Office'],
    icon: LogOut,
    iconBg: 'bg-sky-50 text-sky-700 border-sky-100',
    data: [
      { metric: 'Scheduled Checkouts', value: '0 Bookings', status: 'Pending Checkout' },
      { metric: 'Settled Folios', value: '0 / 0', status: 'Paid' },
      { metric: 'Late Checkouts Approved', value: '0', status: 'None' },
      { metric: 'Housekeeping Release Triggered', value: '0 Rooms', status: 'Scheduled' }
    ]
  },
  {
    id: 'cashier-report',
    title: 'Cashier Report',
    subtitle: 'Detailed breakdown of cash, card, and other payment transactions.',
    overview: 'Reconcile payments end-of-day.',
    departments: ['Finance'],
    icon: Wallet,
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    data: [
      { metric: 'Counter UPI / QR Payments', value: '₹0.00', status: 'Settled' },
      { metric: 'Card / POS Machine Collections', value: '₹0.00', status: 'Batched' },
      { metric: 'Cash at Desk', value: '₹0.00', status: 'Safe Vault' },
      { metric: 'Online / Gateway Settlements', value: '₹0.00', status: 'Processed' }
    ]
  },
  {
    id: 'booking-report',
    title: 'Booking Report',
    subtitle: 'Helps track occupancy pipeline and booking source.',
    overview: 'Complete overview of reservations (past, present, future).',
    departments: ['Front-Office'],
    icon: Calendar,
    iconBg: 'bg-sky-50 text-sky-700 border-sky-100',
    data: [
      { metric: 'Total Active Reservations', value: '0 Bookings', status: 'Confirmed' },
      { metric: 'Direct Walk-in Share', value: '0%', status: 'None' },
      { metric: 'OTA Booking Engine Share', value: '0%', status: 'None' },
      { metric: 'Average Booking Lead Time', value: '0 Days', status: 'Normal' }
    ]
  },
  {
    id: 'room-status',
    title: 'Room Status Report',
    subtitle: 'Assign cleaning, maintenance, and availability updates.',
    overview: 'Current status of each room (occupied, dirty, ready).',
    departments: ['Housekeeping'],
    icon: Home,
    iconBg: 'bg-teal-50 text-teal-700 border-teal-100',
    data: [
      { metric: 'Vacant Ready for Check-in', value: '0 Rooms', status: 'Inspected' },
      { metric: 'Turnaround / In-Service', value: '0 Rooms', status: 'None' },
      { metric: 'Maintenance Hold', value: '0 Rooms', status: 'Normal' },
      { metric: 'Linen Turnaround Status', value: '100% Stock', status: 'Ready' }
    ]
  },
  {
    id: 'forecast-report',
    title: 'Forecast Report',
    subtitle: 'Forecast staffing, pricing and inventory.',
    overview: 'Projected occupancy, revenue and RevPAR for upcoming dates.',
    departments: ['Revenue'],
    icon: TrendingUp,
    iconBg: 'bg-rose-50 text-rose-700 border-rose-100',
    data: [
      { metric: 'Projected 7-Day Occupancy', value: '0%', status: 'Neutral' },
      { metric: 'Expected ADR Pickup', value: '₹0.00', status: 'Neutral' },
      { metric: 'High-Demand Weekend Dates', value: 'None', status: 'Standard' },
      { metric: 'Recommended BAR Dynamic Price', value: '₹0.00', status: 'Standard' }
    ]
  },
  {
    id: 'gst-report',
    title: 'GST Report',
    subtitle: 'Summary of Goods and Services Tax collected and paid.',
    overview: 'Detailed GST compliance report for financial and tax audits.',
    departments: ['Finance', 'Accounts'],
    icon: Percent,
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    data: [
      { metric: 'Total Taxable Room Revenue', value: '₹0.00', status: 'Taxable' },
      { metric: 'CGST Collected (6% / 9%)', value: '₹0.00', status: 'Accrued' },
      { metric: 'SGST Collected (6% / 9%)', value: '₹0.00', status: 'Accrued' },
      { metric: 'Total GST Liability (GSTR-1)', value: '₹0.00', status: 'Ready to File' }
    ]
  },
  {
    id: 'product-report',
    title: 'Product Report',
    subtitle: 'Monitor stock movement and sales.',
    overview: 'Tracks items sold by inventory (POS, minibar, etc.)',
    departments: ['Food & Beverages'],
    icon: Package,
    iconBg: 'bg-lime-50 text-lime-700 border-lime-100',
    data: [
      { metric: 'Minibar Beverages Sold', value: '0 Units', status: 'Restocked' },
      { metric: 'Mineral Water (1L) Bottles', value: '0 Bottles', status: 'Complimentary' },
      { metric: 'Guest Toiletries Consumed', value: '0 Kits', status: 'Inventory OK' },
      { metric: 'Laundry Services Sold', value: '0 Batches', status: 'Billed' }
    ]
  },
  {
    id: 'addon-service',
    title: 'Add On Service Report',
    subtitle: 'Track upsells and service usage.',
    overview: 'Details of additional services availed by guests.',
    departments: ['Guest Services'],
    icon: PlusCircle,
    iconBg: 'bg-pink-50 text-pink-700 border-pink-100',
    data: [
      { metric: 'Airport Pickup & Drop', value: '0 Trips', status: 'None' },
      { metric: 'Early Check-in Surcharge', value: '₹0.00', status: 'None' },
      { metric: 'Banquet Hall Hourly Bookings', value: '0 Events', status: 'None' },
      { metric: 'Spa & Wellness Bookings', value: '0 Sessions', status: 'None' }
    ]
  },
  {
    id: 'guest-in-house',
    title: 'Guest In House Report',
    subtitle: 'Helps in-room service tracking and emergency planning.',
    overview: 'Guests currently checked-in and staying in the property.',
    departments: ['Operations'],
    icon: Users,
    iconBg: 'bg-amber-50 text-amber-700 border-amber-100',
    data: [
      { metric: 'Current Active In-House Adults', value: '0 Adults', status: 'Verified' },
      { metric: 'Children In-House', value: '0', status: 'None' },
      { metric: 'Occupied Room Units', value: '0 Rooms', status: 'None' },
      { metric: 'Emergency Contact Logs', value: 'None', status: 'Safe' }
    ]
  },
  {
    id: 'expense-report',
    title: 'Expense Report',
    subtitle: 'Track overheads, compare cost vs revenue.',
    overview: 'Summarized view of all property-level expenses.',
    departments: ['Accounts'],
    icon: CreditCard,
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    data: [
      { metric: 'Property Utilities & Electricity', value: '₹0.00', status: 'Monthly' },
      { metric: 'Housekeeping Supplies & Linen', value: '₹0.00', status: 'Approved' },
      { metric: 'F&B Raw Materials / Groceries', value: '₹0.00', status: 'Vendor Settle' },
      { metric: 'Total Operating Expenses', value: '₹0.00', status: 'Budget OK' }
    ]
  },
  {
    id: 'profit-loss',
    title: 'Profit & Loss Report',
    subtitle: 'Compare revenue, expenses, and net profit for a selected period.',
    overview: 'Financial performance summary with revenue and expense composition.',
    departments: ['Finance', 'Accounts'],
    icon: BarChart2,
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    data: [
      { metric: 'Gross Operating Revenue', value: '₹0.00', status: 'None' },
      { metric: 'Total Departmental Expenses', value: '₹0.00', status: 'None' },
      { metric: 'Gross Operating Profit (GOP)', value: '₹0.00', status: '0.0% Margin' },
      { metric: 'EBITDA Realization', value: '₹0.00', status: 'None' }
    ]
  },
  {
    id: 'order-report',
    title: 'Order Report',
    subtitle: 'F&B sales performance.',
    overview: 'Tracks room service and restaurant orders.',
    departments: ['Food & Beverages'],
    icon: ShoppingCart,
    iconBg: 'bg-lime-50 text-lime-700 border-lime-100',
    data: [
      { metric: 'Room Service KOT Orders', value: '0 Orders', status: 'None' },
      { metric: 'Restaurant Dine-in Receipts', value: '₹0.00', status: 'None' },
      { metric: 'Average Order Preparation Time', value: '0 Minutes', status: 'None' },
      { metric: 'Top Selling F&B Item', value: 'None', status: 'None' }
    ]
  },
  {
    id: 'plan-report',
    title: 'Plan Report',
    subtitle: 'Evaluate pricing effectiveness.',
    overview: 'Displays rate plans and their booking trends.',
    departments: ['Revenue'],
    icon: Tag,
    iconBg: 'bg-rose-50 text-rose-700 border-rose-100',
    data: [
      { metric: 'EP Plan (Room Only) Share', value: '0%', status: 'None' },
      { metric: 'CP Plan (Bed & Breakfast) Share', value: '0%', status: 'None' },
      { metric: 'MAP & AP Plan Share', value: '0%', status: 'None' },
      { metric: 'Corporate Fixed Rate Plan', value: '₹0 / Night', status: 'None' }
    ]
  },
  {
    id: 'audit-report',
    title: 'Audit Report',
    subtitle: 'For compliance and user action traceability.',
    overview: 'Tracks system changes, user logins, and configuration changes.',
    departments: ['IT / Admin'],
    icon: Shield,
    iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
    data: [
      { metric: 'Authorized Staff Logins', value: '0 Sessions Today', status: 'Secure' },
      { metric: 'Rate Plan Overrides Logged', value: '0 Overrides', status: 'Normal' },
      { metric: 'System Security Health Score', value: '100%', status: 'Optimal' },
      { metric: 'Last Database Backup', value: 'Realtime Cloud', status: 'Encrypted Cloud' }
    ]
  }
];

// Department Filter Pill Config matching Screenshots 1, 2, 3
const DEPARTMENT_PILLS = [
  { name: 'Finance', count: 4, bg: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]', dot: 'bg-[#15803d]' },
  { name: 'Front-Office', count: 4, bg: 'bg-[#dbeafe] text-[#1d4ed8] border-[#bfdbfe]', dot: 'bg-[#1d4ed8]' },
  { name: 'Accounts', count: 3, bg: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]', dot: 'bg-[#15803d]' },
  { name: 'Revenue', count: 3, bg: 'bg-[#ffe4e6] text-[#be123c] border-[#fecdd3]', dot: 'bg-[#be123c]' },
  { name: 'Food & Beverages', count: 2, bg: 'bg-[#ecfccb] text-[#4d7c0f] border-[#d9f99d]', dot: 'bg-[#4d7c0f]' },
  { name: 'Operations', count: 2, bg: 'bg-[#ffedd5] text-[#c2410c] border-[#fed7aa]', dot: 'bg-[#c2410c]' },
  { name: 'Guest Services', count: 1, bg: 'bg-[#fce7f3] text-[#be185d] border-[#fbcfe8]', dot: 'bg-[#be185d]' },
  { name: 'Housekeeping', count: 1, bg: 'bg-[#ccfbf1] text-[#0f766e] border-[#99f6e4]', dot: 'bg-[#0f766e]' },
  { name: 'IT / Admin', count: 1, bg: 'bg-[#f1f5f9] text-[#334155] border-[#e2e8f0]', dot: 'bg-[#334155]' },
  { name: 'Legal / Security', count: 1, bg: 'bg-[#ede9fe] text-[#6d28d9] border-[#ddd6fe]', dot: 'bg-[#6d28d9]' },
];

export default function ReportsView() {
  const { navigateTo, showNotification } = useDashboard();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [activeReportModal, setActiveReportModal] = useState(null);
  const [reportDateRange, setReportDateRange] = useState('Today (05 Nov 2026)');

  const handleToggleDepartment = (deptName) => {
    if (selectedDepartment === deptName) {
      setSelectedDepartment('ALL');
    } else {
      setSelectedDepartment(deptName);
    }
  };

  const filteredReports = useMemo(() => {
    return REPORTS_CATALOG.filter(rep => {
      // Filter by department
      if (selectedDepartment !== 'ALL' && !rep.departments.includes(selectedDepartment)) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          rep.title.toLowerCase().includes(q) ||
          rep.subtitle.toLowerCase().includes(q) ||
          rep.overview.toLowerCase().includes(q) ||
          rep.departments.some(d => d.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [searchQuery, selectedDepartment]);

  const handleDownload = (format) => {
    showNotification(`Exporting ${activeReportModal?.title} in ${format} format...`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* 1. Breadcrumb (Screenshot 1: Home / Manage Report) */}
      <div className="flex items-center space-x-1.5 text-xs text-slate-500 pb-1 border-b border-slate-200">
        <span 
          onClick={() => navigateTo('master-service-home')}
          className="hover:text-slate-900 cursor-pointer transition flex items-center gap-1"
        >
          🏠 Home
        </span>
        <span>/</span>
        <span className="font-semibold text-slate-900">
          Manage Report
        </span>
      </div>

      {/* 2. Title & Search Header Row (Screenshot 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Report Library
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            All your essential reports, organized and ready to review
          </p>
        </div>

        {/* Search Input (Screenshot 1) */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Find a report..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
          />
        </div>
      </div>

      {/* 3. Available Reports Count Card & Department Filter Pills (Screenshot 1) */}
      <div className="flex flex-col md:flex-row items-stretch gap-3">
        
        {/* Left: Available Reports Count Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs w-full md:w-44 shrink-0 flex flex-col justify-center">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            AVAILABLE REPORTS
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">
            {REPORTS_CATALOG.length}
          </div>
        </div>

        {/* Right: Department Filter Pills Strip */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex-1 flex flex-wrap items-center gap-2">
          {DEPARTMENT_PILLS.map(dept => {
            const isSelected = selectedDepartment === dept.name;

            return (
              <button
                key={dept.name}
                onClick={() => handleToggleDepartment(dept.name)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                  isSelected 
                    ? 'ring-2 ring-slate-800 shadow-xs' 
                    : 'hover:opacity-90'
                } ${dept.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dept.dot}`} />
                <span>{dept.name}</span>
                <span className="w-4 h-4 rounded-full bg-white/70 flex items-center justify-center text-[10px] ml-1">
                  {dept.count}
                </span>
              </button>
            );
          })}

          {selectedDepartment !== 'ALL' && (
            <button
              onClick={() => setSelectedDepartment('ALL')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition"
            >
              Clear Filter ✕
            </button>
          )}
        </div>

      </div>

      {/* 4. Main Reports Table (Screenshots 1, 2, 3) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                <th className="py-3 px-5">REPORT TITLE</th>
                <th className="py-3 px-4">OVERVIEW</th>
                <th className="py-3 px-4">DEPARTMENT</th>
                <th className="py-3 px-5 text-right">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredReports.map(rep => {
                const IconComponent = rep.icon;

                return (
                  <tr 
                    key={rep.id}
                    className="hover:bg-slate-50/70 transition group cursor-pointer"
                    onClick={() => setActiveReportModal(rep)}
                  >
                    {/* 1. REPORT TITLE */}
                    <td className="py-4 px-5 align-top">
                      <div className="flex items-start space-x-3.5">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${rep.iconBg}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs group-hover:text-sky-800 transition">
                            {rep.title}
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {rep.subtitle}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 2. OVERVIEW */}
                    <td className="py-4 px-4 align-top text-xs text-slate-600 font-medium leading-relaxed max-w-xs">
                      {rep.overview}
                    </td>

                    {/* 3. DEPARTMENT */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {rep.departments.map(dName => {
                          const pillConfig = DEPARTMENT_PILLS.find(p => p.name === dName);
                          return (
                            <span 
                              key={dName}
                              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${pillConfig?.bg || 'bg-slate-100 text-slate-700'}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${pillConfig?.dot || 'bg-slate-500'}`} />
                              <span>{dName}</span>
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* 4. ACTION (Screenshot 1, 2, 3: Open ↗) */}
                    <td className="py-4 px-5 align-top text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveReportModal(rep);
                        }}
                        className="inline-flex items-center space-x-1 text-sky-800 hover:text-sky-950 font-bold text-xs hover:underline transition"
                      >
                        <span>Open</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Bottom Local Bar (Screenshot 3) */}
      <div className="rounded-xl bg-[#091b29] text-white p-3.5 flex items-center justify-between shadow-xs">
        <button
          onClick={() => showNotification('Connected to AuraStay Local PMS Sync Agent')}
          className="px-3.5 py-1.5 bg-[#132c3f] hover:bg-[#1a3c56] text-white text-xs font-semibold rounded-lg border border-slate-700 transition"
        >
          Go AuraStay local
        </button>

        <div className="flex items-center space-x-2 text-xs">
          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#091b29] font-black text-[10px]">
            b
          </div>
          <span className="font-semibold text-slate-300">
            Powered by <strong className="text-white">AuraStay</strong>
          </span>
        </div>
      </div>

      {/* 6. REPORT VIEWER & EXPORT MODAL */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0e4860] text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight">{activeReportModal.title}</h3>
                  <p className="text-xs text-sky-200">{activeReportModal.subtitle}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveReportModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              
              {/* Date Filter Bar */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                    Report Period
                  </span>
                  <select
                    value={reportDateRange}
                    onChange={(e) => setReportDateRange(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer mt-0.5"
                  >
                    <option value="Today (05 Nov 2026)">Today (05 Nov 2026)</option>
                    <option value="Yesterday (04 Nov 2026)">Yesterday (04 Nov 2026)</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Month of November 2026">Month of November 2026</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5">
                  {activeReportModal.departments.map(d => (
                    <span key={d} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-[10px]">
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <th className="py-2.5 px-3">Metric / Item</th>
                      <th className="py-2.5 px-3">Realized Value</th>
                      <th className="py-2.5 px-3 text-right">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {activeReportModal.data?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 text-slate-800 font-bold">{row.metric}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-sky-800">{row.value}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10.5px] font-bold">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Modal Footer with Export & Print */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Official AuraStay PMS statutory ledger export
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload('CSV')}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs shadow-2xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => handleDownload('PDF')}
                  className="flex items-center space-x-1 px-3.5 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold rounded-lg text-xs shadow-2xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PDF</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
