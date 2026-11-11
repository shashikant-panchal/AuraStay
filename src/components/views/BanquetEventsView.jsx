import React, { useState, useEffect, useMemo } from 'react';
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
  Check,
  Trash2,
  Printer,
  Download
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function BanquetEventsView() {
  const { showNotification } = useDashboard();

  const [activeTab, setActiveTab] = useState('bookings'); // bookings | venues | menus | calendar
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('ALL');
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState(null);

  // Venues List (Exceed HMS Venues Master)
  const [venues, setVenues] = useState([
    { id: 'v-1', name: 'Grand Ballroom (Crystal Hall)', capacity: 500, rate: 75000, type: 'Indoor AC', floor: 'Ground Floor' },
    { id: 'v-2', name: 'Sapphire Banquet & Conference Suite', capacity: 200, rate: 35000, type: 'Indoor AC', floor: '1st Floor' },
    { id: 'v-3', name: 'Lotus Open-Air Terrace Lounge', capacity: 150, rate: 28000, type: 'Rooftop Lounge', floor: '4th Floor' },
    { id: 'v-4', name: 'Executive Boardroom', capacity: 35, rate: 12000, type: 'Corporate Meeting Room', floor: '2nd Floor' }
  ]);

  // Live Banquet Bookings State (loaded from Supabase banquet_bookings table)
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State for New Banquet Booking
  const [formEventName, setFormEventName] = useState('');
  const [formEventType, setFormEventType] = useState('Wedding Reception');
  const [formClient, setFormClient] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formVenue, setFormVenue] = useState(venues[0].name);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTimeSlot, setFormTimeSlot] = useState('06:00 PM - 11:30 PM (Evening)');
  const [formPax, setFormPax] = useState('150');
  const [formMenu, setFormMenu] = useState('Royal Indian Grand Buffet');
  const [formAdvance, setFormAdvance] = useState('50000');

  // Preset Menus
  const presetMenus = [
    {
      name: 'Royal Indian Grand Buffet',
      pricePerPax: 950,
      items: '3 Welcome Mocktails, 4 Starters (Paneer Tikka, Veg Galouti, Chicken Seekh, Fish Amritsari), 6 Main Course Curries, Dal Makhani, 3 Rice/Biryani varieties, Assorted Breads, 3 Gourmet Desserts & Ice Cream.'
    },
    {
      name: 'Executive Corporate Lunch & High-Tea',
      pricePerPax: 750,
      items: 'Morning Tea/Coffee with Cookies, 2-course Executive Buffet, Salad Bar, Live Pasta Counter, Evening High-Tea with Finger Sandwiches, Pakoras & Pastries.'
    },
    {
      name: 'Deluxe Celebration Bites & Mocktail Bar',
      pricePerPax: 650,
      items: 'Live Mocktail Station, Finger Foods & Canapes, Pizza & Pasta station, Biryani Pots, Gourmet Cupcakes, Waffle counter.'
    }
  ];

  // 1. Fetch live banquet bookings from Supabase
  const loadBanquetBookings = async () => {
    if (!isSupabaseConfigured) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('banquet_bookings')
        .select('*')
        .order('event_date', { ascending: false });

      if (!error && data) {
        setBookings(data.map(b => ({
          id: b.id,
          eventName: b.event_name,
          eventType: b.event_type || 'Private Function',
          client: b.client_name,
          phone: b.client_phone || '—',
          email: b.client_email || '—',
          venue: b.venue,
          date: b.event_date,
          timeSlot: b.time_slot || '06:00 PM - 11:00 PM',
          pax: Number(b.pax) || 100,
          menuPackage: b.menu_package || 'Grand Buffet',
          totalAmount: Number(b.total_amount) || 50000,
          paidAmount: Number(b.paid_amount) || 0,
          status: b.status || 'CONFIRMED'
        })));
      }
    } catch (err) {
      console.warn('Supabase banquet fetch warning:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanquetBookings();

    if (!isSupabaseConfigured) return;
    const channel = supabase.channel('aurastay-banquet-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banquet_bookings' }, () => {
        loadBanquetBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Submit New Banquet Booking
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!formEventName.trim() || !formClient.trim() || !formPhone.trim()) {
      showNotification('Please fill in required fields.', 'error');
      return;
    }

    const bookingId = `BNQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const selVenueObj = venues.find(v => v.name === formVenue);
    const selMenuObj = presetMenus.find(m => m.name === formMenu);
    const venueRent = selVenueObj?.rate || 35000;
    const cateringTotal = (selMenuObj?.pricePerPax || 750) * Number(formPax);
    const totalEst = venueRent + cateringTotal;

    const newBooking = {
      id: bookingId,
      hotel_id: 'hotel_aurastay_01',
      event_name: formEventName.trim(),
      event_type: formEventType,
      client_name: formClient.trim(),
      client_phone: formPhone.trim(),
      client_email: formEmail.trim() || null,
      venue: formVenue,
      event_date: formDate,
      time_slot: formTimeSlot,
      pax: Number(formPax) || 100,
      menu_package: formMenu,
      total_amount: totalEst,
      paid_amount: Number(formAdvance) || 0,
      status: 'CONFIRMED'
    };

    // Optimistic local update
    setBookings(prev => [{
      id: newBooking.id,
      eventName: newBooking.event_name,
      eventType: newBooking.event_type,
      client: newBooking.client_name,
      phone: newBooking.client_phone,
      email: newBooking.client_email,
      venue: newBooking.venue,
      date: newBooking.event_date,
      timeSlot: newBooking.time_slot,
      pax: newBooking.pax,
      menuPackage: newBooking.menu_package,
      totalAmount: newBooking.total_amount,
      paidAmount: newBooking.paid_amount,
      status: newBooking.status
    }, ...prev]);

    setIsNewBookingModalOpen(false);
    showNotification(`🎉 Banquet Booking #${bookingId} confirmed! Venue ${formVenue} locked.`, 'success');

    // Live insertion into Supabase
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('banquet_bookings').insert(newBooking);
        if (error) {
          console.warn('Initial banquet insert error, attempting fallback...', error);
          const fb = { ...newBooking };
          delete fb.hotel_id;
          await supabase.from('banquet_bookings').insert(fb);
        }
      } catch (err) {
        console.warn('Banquet database sync error:', err);
      }
    }

    // Reset Form
    setFormEventName('');
    setFormClient('');
    setFormPhone('');
    setFormEmail('');
  };

  // Status Change / Payment
  const handleUpdateStatus = async (id, newStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    showNotification(`Banquet #${id} status updated to ${newStatus}.`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('banquet_bookings').update({ status: newStatus }).eq('id', id);
      } catch (e) {}
    }
  };

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchVenue = selectedVenue === 'ALL' || b.venue === selectedVenue;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        b.eventName.toLowerCase().includes(q) ||
        b.client.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q);
      return matchVenue && matchSearch;
    });
  }, [bookings, selectedVenue, searchQuery]);

  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const totalCollected = bookings.reduce((sum, b) => sum + (Number(b.paidAmount) || 0), 0);
  const totalDue = Math.max(0, totalRevenue - totalCollected);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      
      {/* 1. Header */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full shadow-2xs">
              MICE, BANQUETS & EVENTS
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Live Cloud Persistence</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
            Banquet & Event Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage weddings, corporate conferences, venue schedules, catering packages, and event folio billings with real-time Supabase sync.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => loadBanquetBookings()}
            className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs shadow-2xs transition"
            title="Refresh database"
          >
            Refresh Sync
          </button>

          <button
            onClick={() => setIsNewBookingModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-md shadow-purple-900/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Banquet Booking</span>
          </button>
        </div>
      </div>

      {/* 2. Revenue & Event KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">TOTAL EVENT PIPELINE</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">₹{totalRevenue.toLocaleString()}</div>
          <span className="text-[11px] font-bold text-purple-700 mt-1 block">{bookings.length} Booked Events</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">ADVANCE COLLECTED</span>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">₹{totalCollected.toLocaleString()}</div>
          <span className="text-[11px] font-bold text-emerald-700 mt-1 block">In Bank / Cashier</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">BALANCE DUE</span>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">₹{totalDue.toLocaleString()}</div>
          <span className="text-[11px] font-bold text-slate-500 mt-1 block">Payable on event day</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">AVAILABLE VENUES</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{venues.length}</div>
          <span className="text-[11px] font-bold text-slate-500 mt-1 block">Halls & Terraces</span>
        </div>
      </div>

      {/* 3. Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'bookings'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Event Bookings ({bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('venues')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'venues'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Venues & Halls ({venues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('menus')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'menus'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Catering Menus ({presetMenus.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BANQUET BOOKINGS LIST */}
      {/* ========================================================================= */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event name, client, or reference ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-purple-600"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white outline-none"
              >
                <option value="ALL">All Venues</option>
                {venues.map(v => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))}
              </select>

              <button
                onClick={() => setIsNewBookingModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Booking</span>
              </button>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-200 space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center mx-auto">
                <CalendarCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">No Banquet Bookings Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Lock dates and venues for weddings, conferences, and birthday parties with complete catering and billing management.
                </p>
              </div>
              <button
                onClick={() => setIsNewBookingModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Create Banquet Booking</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBookings.map(b => {
                const due = Math.max(0, b.totalAmount - b.paidAmount);
                const isPaid = due === 0;

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-purple-700 block">{b.id}</span>
                        <h4 className="font-serif text-base font-bold text-slate-900 mt-0.5">{b.eventName}</h4>
                        <span className="text-xs text-slate-500 font-semibold">{b.client} • {b.phone}</span>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        b.status === 'CONFIRMED' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : b.status === 'COMPLETED'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl text-[11px] text-slate-600 space-y-1.5 border border-slate-200/60 font-medium">
                      <div className="flex justify-between">
                        <span>Venue:</span>
                        <span className="font-bold text-slate-800">{b.venue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date & Slot:</span>
                        <span className="font-bold text-slate-800">{b.date} • {b.timeSlot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pax & Menu:</span>
                        <span className="font-bold text-slate-800">{b.pax} Guests • {b.menuPackage}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50/50 rounded-2xl border border-purple-200 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-purple-800 uppercase block">Total Tariff</span>
                        <span className="font-mono font-black text-slate-900 text-sm">₹{b.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-purple-800 uppercase block">Due Balance</span>
                        <span className={`font-mono font-bold ${due > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {due > 0 ? `₹${due.toLocaleString()}` : 'Settled ✓'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                      <button
                        onClick={() => setSelectedBookingForInvoice(b)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-700" />
                        <span>View Folio / BFP</span>
                      </button>

                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VENUES & HALLS */}
      {/* ========================================================================= */}
      {activeTab === 'venues' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {venues.map(v => (
            <div key={v.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">{v.name}</h3>
                  <span className="text-xs text-slate-500">{v.floor} • {v.type}</span>
                </div>
                <div className="text-right font-mono font-black text-lg text-slate-900">
                  ₹{v.rate.toLocaleString()}
                  <span className="text-[10px] font-normal text-slate-400 block font-sans">base rental</span>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl text-xs font-semibold text-purple-900 flex items-center justify-between">
                <span>Maximum Capacity:</span>
                <span className="font-bold">{v.capacity} Guests</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CATERING MENUS */}
      {/* ========================================================================= */}
      {activeTab === 'menus' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {presetMenus.map((m, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif text-base font-bold text-slate-900">{m.name}</h3>
                  <span className="text-sm font-black font-mono text-emerald-700">₹{m.pricePerPax}/pax</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                  {m.items}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW BANQUET BOOKING */}
      {/* ========================================================================= */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900">New Banquet & Event Reservation</h3>
              <button onClick={() => setIsNewBookingModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Event Name / Occasion *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharma Family Wedding Reception"
                  value={formEventName}
                  onChange={(e) => setFormEventName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Event Type</label>
                  <select
                    value={formEventType}
                    onChange={(e) => setFormEventType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                  >
                    <option value="Wedding Reception">Wedding Reception</option>
                    <option value="Corporate Conference">Corporate Conference</option>
                    <option value="Birthday Celebration">Birthday Celebration</option>
                    <option value="Anniversary Gala">Anniversary Gala</option>
                    <option value="Cocktail Dinner">Cocktail Dinner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Venue Hall *</label>
                  <select
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                  >
                    {venues.map(v => (
                      <option key={v.id} value={v.name}>{v.name} (Max {v.capacity})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={formClient}
                    onChange={(e) => setFormClient(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Client Mobile *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98450 12345"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={formTimeSlot}
                    onChange={(e) => setFormTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                  >
                    <option value="06:00 PM - 11:30 PM (Evening)">06:00 PM - 11:30 PM (Evening)</option>
                    <option value="09:00 AM - 04:00 PM (Day)">09:00 AM - 04:00 PM (Day)</option>
                    <option value="Full Day (09:00 AM - 11:00 PM)">Full Day (09:00 AM - 11:00 PM)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Pax</label>
                  <input
                    type="number"
                    min="10"
                    value={formPax}
                    onChange={(e) => setFormPax(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catering Menu</label>
                  <select
                    value={formMenu}
                    onChange={(e) => setFormMenu(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                  >
                    {presetMenus.map((m, i) => (
                      <option key={i} value={m.name}>{m.name} (₹{m.pricePerPax}/pax)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Advance Token Received (₹)</label>
                <input
                  type="number"
                  value={formAdvance}
                  onChange={(e) => setFormAdvance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold font-mono outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewBookingModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs shadow-md"
                >
                  Confirm & Lock Venue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BANQUET FUNCTION PROSPECTUS (BFP / INVOICE) */}
      {/* ========================================================================= */}
      {selectedBookingForInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase">Banquet Function Prospectus (BFP)</span>
                <h3 className="font-serif text-lg font-bold text-slate-900">{selectedBookingForInvoice.eventName}</h3>
              </div>
              <button onClick={() => setSelectedBookingForInvoice(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-2 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking Ref:</span>
                <span className="font-mono font-bold text-slate-900">{selectedBookingForInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Client:</span>
                <span className="font-bold text-slate-900">{selectedBookingForInvoice.client} ({selectedBookingForInvoice.phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Venue:</span>
                <span className="font-bold text-slate-900">{selectedBookingForInvoice.venue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-slate-900">{selectedBookingForInvoice.date} • {selectedBookingForInvoice.timeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Package:</span>
                <span className="font-bold text-slate-900">{selectedBookingForInvoice.pax} Pax • {selectedBookingForInvoice.menuPackage}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Total Valuation:</span>
                <span className="font-mono font-black text-slate-900 text-sm">₹{selectedBookingForInvoice.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-emerald-700">Advance Paid:</span>
                <span className="font-mono font-bold text-emerald-700">₹{selectedBookingForInvoice.paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-amber-700">Balance Due:</span>
                <span className="font-mono font-bold text-amber-700">₹{Math.max(0, selectedBookingForInvoice.totalAmount - selectedBookingForInvoice.paidAmount).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print BFP Invoice</span>
              </button>
              <button
                onClick={() => setSelectedBookingForInvoice(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50"
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
