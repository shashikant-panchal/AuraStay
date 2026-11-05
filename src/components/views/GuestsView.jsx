import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Users, 
  Home, 
  Crown, 
  TrendingUp, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  RotateCcw, 
  Upload, 
  Plus, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  X, 
  CheckCircle2, 
  FileText, 
  CreditCard, 
  ArrowUpDown, 
  User, 
  Sparkles,
  ExternalLink,
  Eye,
  Trash2
} from 'lucide-react';

// Sample existing guests from PMS reservations
const DEFAULT_HOTEL_GUESTS = [
  {
    id: 'CUST-1001',
    name: 'Sristi Bhattacharya',
    company: 'Mindtree Solutions',
    email: 'sristi.b@mindtree.com',
    phone: '+91 98450 44211',
    room: '102 (Standard)',
    status: 'IN-HOUSE',
    loyalty: 'Gold',
    stays: 4,
    lifetimeSpend: 24800,
    kyc: 'Aadhaar Verified'
  },
  {
    id: 'CUST-1002',
    name: 'Tejender Thakur',
    company: 'Himachal Hydro Power',
    email: 'tejender.thakur@hhp.gov.in',
    phone: '+91 98160 77412',
    room: '202 (Deluxe)',
    status: 'IN-HOUSE',
    loyalty: 'Platinum',
    stays: 7,
    lifetimeSpend: 68500,
    kyc: 'Passport Verified'
  },
  {
    id: 'CUST-1003',
    name: 'Dibyajeeban Nayak',
    company: 'Tata Consultancy Services',
    email: 'd.nayak@tcs.com',
    phone: '+91 97110 88299',
    room: '302 (Super Deluxe)',
    status: 'CHECKOUT DUE',
    loyalty: 'Silver',
    stays: 2,
    lifetimeSpend: 11400,
    kyc: 'Aadhaar Verified'
  },
  {
    id: 'CUST-1004',
    name: 'Hiten Palreja',
    company: 'FinEdge Capital',
    email: 'hiten.p@finedge.com',
    phone: '+91 98201 55321',
    room: '103 (Standard)',
    status: 'CONFIRMED',
    loyalty: 'Silver',
    stays: 1,
    lifetimeSpend: 5400,
    kyc: 'PAN Verified'
  },
  {
    id: 'CUST-1005',
    name: 'Mukeshbhai Patel',
    company: 'Patel Agro Exports',
    email: 'mukesh.patel@agroexports.in',
    phone: '+91 98250 88990',
    room: '102 & 103 (Standard)',
    status: 'CONFIRMED',
    loyalty: 'Platinum',
    stays: 6,
    lifetimeSpend: 52000,
    kyc: 'Aadhaar Verified'
  }
];

export default function GuestsView() {
  const { navigateTo, showNotification } = useDashboard();

  // Search Criteria
  const [searchBy, setSearchBy] = useState('Email'); // 'Email' | 'Phone' | 'Name' | 'Company'
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Guest dataset (starts empty if user wants initial zero state, or toggleable)
  // Initially we provide state that matches the screenshot (0 guests / No Data Found),
  // but allow searching or clicking "Show Sample Guests" / "Add Guest" / "Upload CSV".
  const [guestsList, setGuestsList] = useState([]);

  // Modals state
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [isUploadCsvModalOpen, setIsUploadCsvModalOpen] = useState(false);
  const [selectedGuestProfile, setSelectedGuestProfile] = useState(null);

  // New Guest Form
  const [newGuest, setNewGuest] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    room: '',
    loyalty: 'Silver',
    kyc: 'Aadhaar Verified'
  });

  // Calculate live KPI stats
  const totalGuests = guestsList.length;
  const inHouseCount = guestsList.filter(g => g.status === 'IN-HOUSE').length;
  const platinumCount = guestsList.filter(g => g.loyalty === 'Platinum').length;
  const totalRevenue = guestsList.reduce((acc, g) => acc + (g.lifetimeSpend || 0), 0);

  // Search filtering
  const filteredGuests = useMemo(() => {
    if (!hasSearched || !searchQuery.trim()) {
      return guestsList;
    }
    const q = searchQuery.toLowerCase().trim();
    return guestsList.filter(g => {
      if (searchBy === 'Email') return g.email?.toLowerCase().includes(q);
      if (searchBy === 'Phone') return g.phone?.includes(q);
      if (searchBy === 'Name') return g.name?.toLowerCase().includes(q);
      if (searchBy === 'Company') return g.company?.toLowerCase().includes(q);
      return (
        g.name?.toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q) ||
        g.phone?.includes(q) ||
        g.company?.toLowerCase().includes(q)
      );
    });
  }, [guestsList, searchQuery, searchBy, hasSearched]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setHasSearched(true);
    if (!searchQuery.trim()) {
      // If searched with empty, show notification
      showNotification('Please enter a search keyword or load sample guest profiles.');
    } else {
      showNotification(`Searching for ${searchQuery} in ${searchBy}...`);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearchBy('Email');
    setHasSearched(false);
    showNotification('Search filters reset');
  };

  const handleLoadSampleData = () => {
    setGuestsList(DEFAULT_HOTEL_GUESTS);
    setHasSearched(false);
    showNotification('Loaded 5 active guest profiles from property ledger');
  };

  const handleSaveGuest = (e) => {
    e.preventDefault();
    if (!newGuest.name.trim()) {
      showNotification('Guest Name is required');
      return;
    }

    const created = {
      id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newGuest.name.trim(),
      company: newGuest.company.trim() || 'Individual',
      email: newGuest.email.trim() || 'guest@example.com',
      phone: newGuest.phone.trim() || '+91 90000 00000',
      room: newGuest.room.trim() || 'Unassigned',
      status: 'CONFIRMED',
      loyalty: newGuest.loyalty,
      stays: 1,
      lifetimeSpend: 2500,
      kyc: newGuest.kyc
    };

    setGuestsList(prev => [created, ...prev]);
    setIsAddGuestModalOpen(false);
    setNewGuest({
      name: '',
      email: '',
      phone: '',
      company: '',
      room: '',
      loyalty: 'Silver',
      kyc: 'Aadhaar Verified'
    });
    showNotification(`Guest profile created for ${created.name}!`);
  };

  const handleCsvImport = () => {
    setGuestsList(DEFAULT_HOTEL_GUESTS);
    setIsUploadCsvModalOpen(false);
    showNotification('Successfully imported 5 guest records from CSV!');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* 1. Breadcrumb (Exact Screenshot: Home / Guest Management) */}
      <div className="flex items-center space-x-1.5 text-xs text-slate-500 pb-1 border-b border-slate-200">
        <span 
          onClick={() => navigateTo('master-service-home')}
          className="hover:text-slate-900 cursor-pointer transition flex items-center gap-1"
        >
          🏠 Home
        </span>
        <span>/</span>
        <span className="font-semibold text-slate-900">
          Guest Management
        </span>
      </div>

      {/* 2. Title & Action Buttons Header Row (Exact Screenshot) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Guest Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, manage, and track guest profiles and loyalty
          </p>
        </div>

        {/* Action Buttons: Reset, Upload CSV, Add Guest (Exact Screenshot) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>

          <button
            onClick={() => setIsUploadCsvModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload CSV</span>
          </button>

          <button
            onClick={() => setIsAddGuestModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white text-xs font-bold rounded-lg shadow-2xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Guest</span>
          </button>
        </div>
      </div>

      {/* 3. Four Metric KPI Cards (Exact Screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: TOTAL GUESTS */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              TOTAL GUESTS
            </span>
            <span className="text-2xl font-black text-slate-900 leading-tight">
              {totalGuests}
            </span>
          </div>
        </div>

        {/* Card 2: IN-HOUSE */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              IN-HOUSE
            </span>
            <span className="text-2xl font-black text-slate-900 leading-tight">
              {inHouseCount}
            </span>
          </div>
        </div>

        {/* Card 3: PLATINUM MEMBERS */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              PLATINUM MEMBERS
            </span>
            <span className="text-2xl font-black text-slate-900 leading-tight">
              {platinumCount}
            </span>
          </div>
        </div>

        {/* Card 4: TOTAL REVENUE */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              TOTAL REVENUE
            </span>
            <span className="text-2xl font-black text-slate-900 leading-tight">
              ₹{totalRevenue.toLocaleString()}
            </span>
          </div>
        </div>

      </div>

      {/* 4. Guest Search Card (Exact Screenshot) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">
            Guest search
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lookup guest profile by email, phone, name or company.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 text-xs">
          <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider shrink-0">
            SEARCH BY:
          </span>

          {/* Search By Dropdown */}
          <div className="relative w-full sm:w-36">
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
            >
              <option value="Email">Email</option>
              <option value="Phone">Phone</option>
              <option value="Name">Name</option>
              <option value="Company">Company</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Search Input with Dynamic Icon */}
          <div className="relative flex-1">
            <div className="absolute left-3 top-2.5 text-slate-400">
              {searchBy === 'Email' && <Mail className="w-4 h-4" />}
              {searchBy === 'Phone' && <Phone className="w-4 h-4" />}
              {searchBy === 'Name' && <User className="w-4 h-4" />}
              {searchBy === 'Company' && <Building2 className="w-4 h-4" />}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                searchBy === 'Email' ? 'Enter email address' :
                searchBy === 'Phone' ? 'Enter phone number' :
                searchBy === 'Name' ? 'Enter guest name' : 'Enter company name'
              }
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
            />
          </div>

          {/* Search Button (Exact Screenshot) */}
          <button
            type="submit"
            className="flex items-center justify-center space-x-1.5 px-5 py-2 bg-[#5897a6] hover:bg-[#477a87] text-white rounded-lg text-xs font-bold shadow-2xs transition shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </form>

        {/* Quick action to load active hotel guests if list is empty */}
        {guestsList.length === 0 && (
          <div className="pt-1 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Tip: You can add new guest profiles or preload current hotel stay records.</span>
            <button
              onClick={handleLoadSampleData}
              className="text-[#0e4860] hover:underline font-bold"
            >
              Preload Hotel Guest Folios
            </button>
          </div>
        )}
      </div>

      {/* 5. Main Guest Data Table (Exact Screenshot) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-sky-50/40 text-slate-600 font-bold uppercase tracking-wider text-[11px] select-none">
                <th className="py-3 px-3">
                  <div className="flex items-center space-x-1 cursor-pointer">
                    <span>ID</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="flex items-center space-x-1 cursor-pointer">
                    <span>GUEST</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="flex items-center space-x-1 cursor-pointer">
                    <span>COMPANY</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="flex items-center space-x-1 cursor-pointer">
                    <span>CONTACT</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="flex items-center space-x-1 cursor-pointer">
                    <span>ROOM</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="flex items-center space-x-1 cursor-pointer">
                    <span>STATUS</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="flex items-center space-x-1 cursor-pointer">
                    <span>LOYALTY</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="flex items-center space-x-1 cursor-pointer">
                    <span>STAYS</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="flex items-center space-x-1 cursor-pointer">
                    <span>LIFETIME SPEND</span>
                    <span className="text-[10px] text-slate-400">↑↓</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-right">ACTION</th>
              </tr>
            </thead>

            <tbody>
              {filteredGuests.length === 0 ? (
                /* No Data Found Row (Exact Match with Screenshot) */
                <tr>
                  <td colSpan="10" className="py-8 text-center text-xs font-semibold text-slate-700">
                    No Data Found
                  </td>
                </tr>
              ) : (
                /* Populated Guest Rows */
                filteredGuests.map((g) => (
                  <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-3 font-mono font-bold text-sky-800">
                      {g.id}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">{g.name}</div>
                      <div className="text-[10.5px] text-slate-400">{g.kyc}</div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-600 font-medium">
                      {g.company}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-slate-800 font-medium">{g.phone}</div>
                      <div className="text-[10.5px] text-slate-400">{g.email}</div>
                    </td>

                    <td className="py-3.5 px-3 font-bold text-slate-800">
                      {g.room}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        g.status === 'IN-HOUSE' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : g.status === 'CHECKOUT DUE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {g.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        g.loyalty === 'Platinum' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                          : g.loyalty === 'Gold'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Crown className="w-3 h-3" />
                        <span>{g.loyalty}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-bold text-slate-800 text-center">
                      {g.stays}
                    </td>

                    <td className="py-3.5 px-3 font-black text-slate-900">
                      ₹{g.lifetimeSpend.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedGuestProfile(g)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-bold text-[#0e4860] transition"
                      >
                        Profile ↗
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination (Exact Screenshot) */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing {filteredGuests.length > 0 ? 1 : 0} to {filteredGuests.length} of {filteredGuests.length} customers
          </div>

          <div className="flex items-center space-x-1 font-semibold">
            <button className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-400 disabled:opacity-50">
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-400 disabled:opacity-50">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-400 disabled:opacity-50">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-400 disabled:opacity-50">
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>

            <div className="ml-2 flex items-center border border-slate-200 rounded px-2 py-1 bg-white">
              <span className="text-slate-700">10</span>
              <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
            </div>
          </div>
        </div>

      </div>

      {/* 6. ADD GUEST MODAL */}
      {isAddGuestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-[#0e4860] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <h3 className="font-bold text-base">Add Guest Profile</h3>
              </div>
              <button 
                onClick={() => setIsAddGuestModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGuest} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Mahindra"
                  value={newGuest.name}
                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="guest@company.com"
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mahindra Group"
                    value={newGuest.company}
                    onChange={(e) => setNewGuest({ ...newGuest, company: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Loyalty Tier
                  </label>
                  <select
                    value={newGuest.loyalty}
                    onChange={(e) => setNewGuest({ ...newGuest, loyalty: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                  >
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Identity Proof / KYC
                </label>
                <select
                  value={newGuest.kyc}
                  onChange={(e) => setNewGuest({ ...newGuest, kyc: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                >
                  <option value="Aadhaar Verified">Aadhaar Card Verified</option>
                  <option value="Passport Verified">Passport Verified</option>
                  <option value="PAN Verified">PAN Card</option>
                  <option value="Driving License">Driving License</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddGuestModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Save Guest Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. UPLOAD CSV MODAL */}
      {isUploadCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#0e4860] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <h3 className="font-bold text-base">Import Guests via CSV</h3>
              </div>
              <button 
                onClick={() => setIsUploadCsvModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2 hover:border-[#0e4860] cursor-pointer transition">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="font-bold text-slate-800">Drag and drop guest CSV file here</div>
                <div className="text-[11px] text-slate-400">Supports .csv or .xlsx with name, phone, email, company headers</div>
              </div>

              <div className="p-3 bg-sky-50 rounded-lg border border-sky-100 text-[11px] text-sky-900">
                <span>Tip: Click below to load standard hotel guests template.</span>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsUploadCsvModalOpen(false)}
                className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCsvImport}
                className="px-4 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold"
              >
                Import CSV Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. GUEST PROFILE DETAILS MODAL */}
      {selectedGuestProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-[#0e4860] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{selectedGuestProfile.name}</h3>
                <p className="text-xs text-sky-200">{selectedGuestProfile.company} • {selectedGuestProfile.id}</p>
              </div>
              <button 
                onClick={() => setSelectedGuestProfile(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-medium block">Phone</span>
                  <span className="font-bold text-slate-900">{selectedGuestProfile.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Email</span>
                  <span className="font-bold text-slate-900">{selectedGuestProfile.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Loyalty Tier</span>
                  <span className="font-bold text-purple-700 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" /> {selectedGuestProfile.loyalty}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">KYC Status</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {selectedGuestProfile.kyc}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div>
                  <span className="font-bold text-emerald-950 block">Lifetime Total Spend: ₹{selectedGuestProfile.lifetimeSpend.toLocaleString()}</span>
                  <span className="text-[11px] text-emerald-700">{selectedGuestProfile.stays} Completed Stays at BookOne Suite</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedGuestProfile(null);
                    navigateTo('reservation-management');
                  }}
                  className="px-3 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg font-bold text-xs"
                >
                  Book New Stay
                </button>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedGuestProfile(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
