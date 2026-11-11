import React, { useState } from 'react';
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  Sparkles,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  CalendarCheck,
  Utensils,
  MapPin,
  FileText,
  Building,
  Tag,
  Phone,
  Mail,
  X,
  Check
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export default function BanquetEventsView() {
  const { showNotification } = useDashboard();

  const [activeTab, setActiveTab] = useState('bookings'); // bookings | venues | calendar | menus
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('ALL');
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);

  // Sample venues matching Exceed
  const venues = [
    { id: 'v-1', name: 'Grand Ballroom (Crystal Hall)', capacity: '500 Pax', rate: 75000, type: 'Indoor AC', floor: 'Ground Floor' },
    { id: 'v-2', name: 'Sapphire Banquet & Conference Suite', capacity: '200 Pax', rate: 35000, type: 'Indoor AC', floor: '1st Floor' },
    { id: 'v-3', name: 'Lotus Open-Air Terrace Lounge', capacity: '150 Pax', rate: 28000, type: 'Rooftop Lounge', floor: '4th Floor' },
    { id: 'v-4', name: 'Executive Boardroom', capacity: '35 Pax', rate: 12000, type: 'Corporate Meeting Room', floor: '2nd Floor' }
  ];

  // Sample banquet bookings
  const [bookings, setBookings] = useState([
    {
      id: 'BNQ-2026-101',
      eventName: 'Mehta & Sharma Wedding Reception',
      eventType: 'Wedding',
      client: 'Mr. Arvind Mehta',
      phone: '+91 98450 88219',
      venue: 'Grand Ballroom (Crystal Hall)',
      date: '2026-11-18',
      timeSlot: '06:00 PM - 11:30 PM (Evening)',
      pax: 350,
      menuPackage: 'Royal Indian Grand Buffet',
      totalAmount: 385000,
      paidAmount: 200000,
      status: 'CONFIRMED'
    },
    {
      id: 'BNQ-2026-102',
      eventName: 'TechCorp Annual Leadership Summit & Gala',
      eventType: 'Corporate Conference',
      client: 'Ms. Sunita Rao (TechCorp Ltd.)',
      phone: '+91 99201 44550',
      venue: 'Sapphire Banquet & Conference Suite',
      date: '2026-11-20',
      timeSlot: '09:00 AM - 05:00 PM (Full Day)',
      pax: 140,
      menuPackage: 'Executive Corporate Lunch & High-Tea',
      totalAmount: 168000,
      paidAmount: 168000,
      status: 'CONFIRMED'
    },
    {
      id: 'BNQ-2026-103',
      eventName: 'Aarav 1st Birthday Celebration',
      eventType: 'Birthday Party',
      client: 'Dr. Nikhil Kulkarni',
      phone: '+91 97654 33210',
      venue: 'Lotus Open-Air Terrace Lounge',
      date: '2026-11-22',
      timeSlot: '07:00 PM - 10:30 PM',
      pax: 90,
      menuPackage: 'Deluxe Party Bites & Mocktail Bar',
      totalAmount: 95000,
      paidAmount: 40000,
      status: 'TENTATIVE'
    }
  ]);

  // Preset Menus
  const presetMenus = [
    {
      name: 'Royal Indian Grand Buffet',
      pricePerPax: 950,
      items: '3 Welcome Drinks, 4 Starters (Paneer Tikka, Veg Galouti, Chicken Seekh, Fish Amritsari), 6 Main Course Curries, Dal Makhani, 3 Rice/Biryani varieties, Assorted Breads, 3 Gourmet Desserts & Ice Cream.'
    },
    {
      name: 'Executive Corporate Lunch & High-Tea',
      pricePerPax: 750,
      items: 'Morning Tea/Coffee with Cookies, 2-course Executive Buffet, Salad Bar, Live Pasta Counter, Evening High-Tea with Finger Sandwiches, Pakoras & Pastries.'
    },
    {
      name: 'Deluxe Party Bites & Mocktail Bar',
      pricePerPax: 600,
      items: 'Continuous pass-around appetizers, Live Chaat Counter, Exotic Mocktails, Wood-fired Pizza slices, Biryani bowls, Brownie with Vanilla Ice Cream.'
    }
  ];

  // New Booking Form State
  const [formEventName, setFormEventName] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formVenue, setFormVenue] = useState(venues[0].name);
  const [formDate, setFormDate] = useState('2026-11-25');
  const [formPax, setFormPax] = useState(100);
  const [formMenu, setFormMenu] = useState(presetMenus[0].name);
  const [formAdvance, setFormAdvance] = useState(25000);

  const handleCreateBooking = (e) => {
    e.preventDefault();
    if (!formEventName || !formClient) return;

    const selectedMenuObj = presetMenus.find(m => m.name === formMenu) || presetMenus[0];
    const selectedVenueObj = venues.find(v => v.name === formVenue) || venues[0];
    const totalEst = (Number(formPax) * selectedMenuObj.pricePerPax) + selectedVenueObj.rate;

    const newBooking = {
      id: `BNQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      eventName: formEventName,
      eventType: 'Private Function',
      client: formClient,
      phone: formPhone,
      venue: formVenue,
      date: formDate,
      timeSlot: '06:00 PM - 11:00 PM',
      pax: Number(formPax),
      menuPackage: formMenu,
      totalAmount: totalEst,
      paidAmount: Number(formAdvance),
      status: 'CONFIRMED'
    };

    setBookings(prev => [newBooking, ...prev]);
    setIsNewBookingModalOpen(false);
    showNotification(`Banquet Booking confirmed for ${formEventName}! Folio created.`, 'success');

    // Reset
    setFormEventName('');
    setFormClient('');
    setFormPhone('');
  };

  const filteredBookings = bookings.filter(b => {
    if (selectedVenue !== 'ALL' && b.venue !== selectedVenue) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return b.eventName.toLowerCase().includes(q) || b.client.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
    }
    return true;
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalCollected = bookings.reduce((sum, b) => sum + b.paidAmount, 0);
  const totalDue = totalRevenue - totalCollected;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Banquet & Event Management</h1>
            <span className="text-[11px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full shadow-xs">
              MICE & BANQUETS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete management of Venues, Catering Packages, Preset Menus, Calendar Schedule, and Event Billing
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsNewBookingModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-800 to-indigo-950 hover:from-purple-900 hover:to-indigo-900 text-white text-xs font-bold shadow-md shadow-purple-950/20 flex items-center space-x-2 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>New Banquet Booking</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)]">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Events</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{bookings.length}</p>
          <span className="text-[11px] font-bold text-purple-600 mt-1 block">Scheduled This Month</span>
        </div>
        <div className="bg-white rounded-3xl p-4 border border-purple-100 shadow-[0_10px_25px_-5px_rgba(168,85,247,0.06)]">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 block">Total Revenue</span>
          <p className="text-2xl font-black text-purple-950 font-mono mt-1">â‚¹{totalRevenue.toLocaleString('en-IN')}</p>
          <span className="text-[11px] font-semibold text-slate-400 mt-1 block">Banquet & Catering</span>
        </div>
        <div className="bg-white rounded-3xl p-4 border border-emerald-100 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.06)]">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Advance Collected</span>
          <p className="text-2xl font-black text-emerald-900 font-mono mt-1">â‚¹{totalCollected.toLocaleString('en-IN')}</p>
          <span className="text-[11px] font-bold text-emerald-700 mt-1 block">Cleared in Bank</span>
        </div>
        <div className="bg-white rounded-3xl p-4 border border-rose-100 shadow-[0_10px_25px_-5px_rgba(244,63,94,0.06)]">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">Pending Balance Due</span>
          <p className="text-2xl font-black text-rose-900 font-mono mt-1">â‚¹{totalDue.toLocaleString('en-IN')}</p>
          <span className="text-[11px] font-semibold text-slate-400 mt-1 block">Due on Event Day</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs flex flex-wrap gap-2">
        {[
          { id: 'bookings', label: 'Bookings List' },
          { id: 'venues', label: 'Venues & Halls Master' },
          { id: 'menus', label: 'Preset Menus & Catering' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === t.id
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Bookings List */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event, client, or booking #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none"
              />
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Venue:</span>
              <select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">All Venues</option>
                {venues.map(v => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBookings.map(b => (
              <div
                key={b.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-lg transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold">
                      {b.id}
                    </span>
                    <h3 className="font-black text-slate-900 text-sm mt-1.5">{b.eventName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{b.eventType}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    b.status === 'CONFIRMED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {b.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                  <p className="flex items-center space-x-2 font-bold text-slate-800">
                    <Building className="w-3.5 h-3.5 text-purple-600" />
                    <span>{b.venue}</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.date} â€¢ {b.timeSlot}</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.pax} Guests Expected</span>
                  </p>
                  <p className="flex items-center space-x-2 truncate">
                    <Utensils className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{b.menuPackage}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Amount</span>
                    <span className="font-mono font-black text-slate-900 text-sm">â‚¹{b.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-600 uppercase font-bold block">Advance Paid</span>
                    <span className="font-mono font-bold text-emerald-700 text-xs">â‚¹{b.paidAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Venues & Halls */}
      {activeTab === 'venues' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {venues.map(v => (
            <div key={v.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-black text-slate-900">{v.name}</h3>
                  <p className="text-xs text-slate-500">{v.floor} â€¢ {v.type}</p>
                </div>
                <span className="text-xs font-black bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                  {v.capacity}
                </span>
              </div>
              <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100 flex items-center justify-between text-xs">
                <span className="text-purple-900 font-semibold">Standard Venue Rental Fee:</span>
                <span className="font-mono font-black text-slate-900 text-sm">â‚¹{v.rate.toLocaleString('en-IN')} / Slot</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Preset Menus */}
      {activeTab === 'menus' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presetMenus.map((m, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-sm font-black text-slate-900">{m.name}</h3>
                </div>
                <p className="text-base font-black text-purple-950 font-mono mt-1">â‚¹{m.pricePerPax} <span className="text-xs font-normal text-slate-500">/ Person</span></p>
                <p className="text-xs text-slate-600 leading-relaxed mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  {m.items}
                </p>
              </div>
              <button
                onClick={() => showNotification(`Menu package selected: ${m.name}`)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Customize Dishes
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New Booking Modal */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative">
            <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">New Banquet Booking</h3>
                  <p className="text-xs text-purple-200/80">Reserve hall, menu package & collect advance</p>
                </div>
              </div>
              <button onClick={() => setIsNewBookingModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Event Name</label>
                <input
                  type="text"
                  placeholder="e.g. Verma Silver Jubilee Celebration"
                  value={formEventName}
                  onChange={(e) => setFormEventName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Client Name</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formClient}
                    onChange={(e) => setFormClient(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Venue Hall</label>
                  <select
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium outline-none text-xs"
                  >
                    {venues.map(v => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Event Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Estimated Pax</label>
                  <input
                    type="number"
                    min="10"
                    value={formPax}
                    onChange={(e) => setFormPax(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Catering Package</label>
                  <select
                    value={formMenu}
                    onChange={(e) => setFormMenu(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium outline-none text-xs"
                  >
                    {presetMenus.map((m, idx) => (
                      <option key={idx} value={m.name}>{m.name} (â‚¹{m.pricePerPax}/pax)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Advance Token (â‚¹)</label>
                <input
                  type="number"
                  value={formAdvance}
                  onChange={(e) => setFormAdvance(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none text-xs font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewBookingModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold shadow-md shadow-purple-900/20"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
