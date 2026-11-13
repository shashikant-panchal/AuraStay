import React, { useState, useEffect, useMemo } from 'react';
import aavasaLogo from '../../assets/aavasa-logo.jpg';
import {
  PartyPopper,
  Building,
  Calendar,
  Users,
  Utensils,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  X,
  CreditCard,
  Building2,
  CalendarCheck,
  Receipt,
  Trash2,
  Edit3
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function BanquetEventsView() {
  const {
    showNotification,
    activeTab: contextActiveTab,
    setActiveTab: setContextActiveTab
  } = useDashboard();

  // Resolve active tab from context
  const resolveTab = (tab) => {
    if (tab === 'venues') return 'venues';
    if (tab === 'menus') return 'menus';
    return 'bookings';
  };

  const [activeTab, setActiveTab] = useState(() => resolveTab(contextActiveTab));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('ALL');
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isNewVenueModalOpen, setIsNewVenueModalOpen] = useState(false);
  const [isNewMenuModalOpen, setIsNewMenuModalOpen] = useState(false);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState(null);

  useEffect(() => {
    if (contextActiveTab) {
      setActiveTab(resolveTab(contextActiveTab));
    }
  }, [contextActiveTab]);

  const handleTabChange = (t) => {
    setActiveTab(t);
    if (setContextActiveTab) {
      setContextActiveTab(t);
    }
  };

  // Venues List (Clean empty slate for real hotel creation)
  const [venues, setVenues] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_banquet_venues_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return [];
  });

  // Preset Catering Menus Master (Clean empty slate)
  const [presetMenus, setPresetMenus] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_banquet_menus_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return [];
  });

  // Save venues and menus to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aurastay_banquet_venues_v2', JSON.stringify(venues));
    } catch (e) { }
  }, [venues]);

  useEffect(() => {
    try {
      localStorage.setItem('aurastay_banquet_menus_v2', JSON.stringify(presetMenus));
    } catch (e) { }
  }, [presetMenus]);

  // Live Banquet Bookings State
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State for New Banquet Booking
  const [formGuestName, setFormGuestName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formTimeSlot, setFormTimeSlot] = useState('Evening (18:00 - 23:30)');
  const [formEventType, setFormEventType] = useState('Wedding Reception');
  const [formPax, setFormPax] = useState('100');
  const [formMenu, setFormMenu] = useState('');
  const [formCustomRate, setFormCustomRate] = useState('25000');
  const [formCustomMenuPrice, setFormCustomMenuPrice] = useState('850');
  const [formAdvance, setFormAdvance] = useState('10000');
  const [formNotes, setFormNotes] = useState('');

  // Form State for New Venue
  const [venueName, setVenueName] = useState('');
  const [venueCapacity, setVenueCapacity] = useState('100');
  const [venueRate, setVenueRate] = useState('20000');
  const [venueType, setVenueType] = useState('Indoor AC');
  const [venueFloor, setVenueFloor] = useState('Ground Floor');

  // Form State for New Menu
  const [menuName, setMenuName] = useState('');
  const [menuPrice, setMenuPrice] = useState('950');
  const [menuItems, setMenuItems] = useState('');

  // Fetch live banquet bookings from Supabase
  const fetchBookings = async () => {
    if (!isSupabaseConfigured()) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('banquet_bookings')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      if (data) {
        setBookings(data.map(b => ({
          id: b.id,
          guestName: b.guest_name,
          phone: b.phone,
          venue: b.venue_name,
          date: b.date,
          timeSlot: b.time_slot,
          eventType: b.event_type,
          pax: b.pax,
          cateringPackage: b.catering_package,
          totalAmount: Number(b.total_amount || 0),
          paidAmount: Number(b.paid_amount || 0),
          status: b.status || 'CONFIRMED',
          notes: b.notes || ''
        })));
      }
    } catch (err) {
      console.warn('Supabase banquet fetch notice:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Compute calculated pricing for new booking modal
  const calculatedTotal = useMemo(() => {
    const selVenueObj = venues.find(v => v.name === formVenue);
    const selMenuObj = presetMenus.find(m => m.name === formMenu);
    const venueRent = selVenueObj?.rate || Number(formCustomRate) || 0;
    const cateringPerPax = selMenuObj?.pricePerPax || Number(formCustomMenuPrice) || 0;
    const paxCount = parseInt(formPax, 10) || 0;
    return venueRent + (cateringPerPax * paxCount);
  }, [formVenue, formMenu, formPax, formCustomRate, formCustomMenuPrice, venues, presetMenus]);

  // Create Banquet Booking Handler
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!formGuestName || !formPhone) {
      showNotification('Please enter the client name and mobile number.', 'error');
      return;
    }
    const finalVenueName = formVenue || venues[0]?.name || 'Main Banquet Hall';
    const finalMenuName = formMenu || presetMenus[0]?.name || 'Standard Catering Package';

    const newBooking = {
      id: `BNQ-${Date.now().toString().slice(-4)}`,
      guestName: formGuestName,
      phone: formPhone,
      venue: finalVenueName,
      date: formDate,
      timeSlot: formTimeSlot,
      eventType: formEventType,
      pax: parseInt(formPax, 10) || 50,
      cateringPackage: finalMenuName,
      totalAmount: calculatedTotal,
      paidAmount: Number(formAdvance) || 0,
      status: 'CONFIRMED',
      notes: formNotes
    };

    setBookings(prev => [newBooking, ...prev]);
    setIsNewBookingModalOpen(false);
    showNotification(`Banquet booking registered for ${formGuestName} on ${formDate}.`);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('banquet_bookings').insert([{
          id: newBooking.id,
          hotel_id: 'hotel_aurastay_01',
          guest_name: formGuestName,
          phone: formPhone,
          venue_name: finalVenueName,
          date: formDate,
          time_slot: formTimeSlot,
          event_type: formEventType,
          pax: parseInt(formPax, 10) || 50,
          catering_package: finalMenuName,
          total_amount: calculatedTotal,
          paid_amount: Number(formAdvance) || 0,
          status: 'CONFIRMED',
          notes: formNotes
        }]);
      } catch (err) {
        console.warn('Supabase banquet insert err:', err.message);
      }
    }

    setFormGuestName('');
    setFormPhone('');
    setFormNotes('');
  };

  // Add New Venue Handler
  const handleCreateVenue = (e) => {
    e.preventDefault();
    if (!venueName) return;
    const newV = {
      id: `v-${Date.now().toString().slice(-3)}`,
      name: venueName,
      capacity: parseInt(venueCapacity, 10) || 50,
      rate: Number(venueRate) || 15000,
      type: venueType,
      floor: venueFloor
    };
    setVenues(prev => [...prev, newV]);
    setIsNewVenueModalOpen(false);
    showNotification(`New venue hall "${venueName}" created.`);
    setVenueName('');
  };

  // Add New Menu Handler
  const handleCreateMenu = (e) => {
    e.preventDefault();
    if (!menuName || !menuItems) return;
    const newM = {
      id: `m-${Date.now().toString().slice(-3)}`,
      name: menuName,
      pricePerPax: Number(menuPrice) || 850,
      items: menuItems
    };
    setPresetMenus(prev => [...prev, newM]);
    setIsNewMenuModalOpen(false);
    showNotification(`Catering package "${menuName}" created.`);
    setMenuName('');
    setMenuItems('');
  };

  // Print Banquet Invoice with Official Aavasa Layout
  const handlePrintBanquetInvoice = (booking) => {
    if (!booking) return;
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      window.print();
      return;
    }

    const dueAmount = Number(booking.totalAmount) - Number(booking.paidAmount);
    const basePath = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/';
    const logoUrl = new URL(aavasaLogo || 'aavasa-logo.jpg', basePath).href;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Banquet Tax Invoice - ${booking.id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; color: #1e293b; line-height: 1.5; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #7c3aed; padding-bottom: 16px; margin-bottom: 20px; }
          .logo { max-height: 60px; object-fit: contain; }
          .title-section h1 { margin: 0 0 4px 0; font-size: 22px; color: #4c1d95; text-transform: uppercase; }
          .title-section p { margin: 0; color: #64748b; font-size: 12px; }
          .doc-type { text-align: right; }
          .badge { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px; display: inline-block; margin-bottom: 6px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .card h3 { margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
          .card-row { display: flex; justify-content: space-between; padding: 3px 0; }
          .label { color: #64748b; }
          .val { font-weight: 600; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #4c1d95; color: white; text-align: left; padding: 8px 10px; font-size: 12px; }
          td { border-bottom: 1px solid #e2e8f0; padding: 10px; font-size: 12px; }
          .total-box { margin-left: auto; width: 280px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 12px; }
          .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .total-row.grand { border-top: 1px solid #d8b4fe; margin-top: 6px; padding-top: 6px; font-weight: 800; font-size: 14px; color: #581c87; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
          .sig-line { width: 180px; border-top: 1px solid #94a3b8; text-align: center; padding-top: 6px; margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <img src="${logoUrl}" alt="Aavasa" class="logo" />
            <div class="title-section" style="margin-top: 8px;">
              <h1>Shivanandi Hotel & Convention</h1>
              <p>Aavasa — Hospitality Simplified</p>
              <p>Bengaluru, Karnataka | Phone: +91 79785 78046 | GSTIN: 29AAACH7409R1ZZ</p>
            </div>
          </div>
          <div class="doc-type">
            <span class="badge">BANQUET FUNCTION PROSPECTUS</span>
            <div style="font-size: 16px; font-weight: 800; color: #0f172a;">Invoice #${booking.id}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Date: ${booking.date}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <h3>Host & Contact Details</h3>
            <div class="card-row"><span class="label">Client / Host:</span><span class="val">${booking.guestName}</span></div>
            <div class="card-row"><span class="label">Contact Phone:</span><span class="val">${booking.phone}</span></div>
            <div class="card-row"><span class="label">Status:</span><span class="val" style="color: #15803d;">${booking.status || 'CONFIRMED'}</span></div>
          </div>
          <div class="card">
            <h3>Event & Hall Specification</h3>
            <div class="card-row"><span class="label">Banquet Venue:</span><span class="val" style="color: #6d28d9;">${booking.venue}</span></div>
            <div class="card-row"><span class="label">Date & Slot:</span><span class="val">${booking.date} (${booking.timeSlot})</span></div>
            <div class="card-row"><span class="label">Guaranteed Pax:</span><span class="val">${booking.pax} Guests</span></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description / Catering Package</th>
              <th>Venue Hall</th>
              <th>Guest Count</th>
              <th style="text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><strong>${booking.cateringPackage || 'Royal Grand Buffet'}</strong><br><span style="color: #64748b; font-size: 11px;">Complete Event Space, Banquet Setup, Sound & Food Catering</span></td>
              <td>${booking.venue}</td>
              <td>${booking.pax} Pax</td>
              <td style="text-align: right; font-weight: 700;">₹${Number(booking.totalAmount).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row"><span class="label">Total Event Tariff:</span><span class="val">₹${Number(booking.totalAmount).toLocaleString()}</span></div>
          <div class="total-row"><span class="label" style="color: #15803d;">Advance Cleared:</span><span class="val" style="color: #15803d;">₹${Number(booking.paidAmount).toLocaleString()}</span></div>
          <div class="total-row grand"><span>Balance Due:</span><span>₹${dueAmount.toLocaleString()}</span></div>
        </div>

        <div class="footer">
          <div>
            <p><strong>Terms:</strong> Full settlement required before event conclusion. Outside catering subject to approval.</p>
            <p>Generated by Aavasa HMS Banquet System.</p>
          </div>
          <div class="sig-line">
            Authorized Signatory<br>Shivanandi Banquet Desk
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Update Status
  const handleUpdateStatus = async (bookingId, newStatus) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    showNotification(`Booking ${bookingId} status updated to ${newStatus}.`);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('banquet_bookings').update({ status: newStatus }).eq('id', bookingId);
      } catch (err) {
        console.warn('Supabase status err:', err.message);
      }
    }
  };

  // Metrics
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalCollected = bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const totalDue = totalRevenue - totalCollected;

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch = String(b.guestName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(b.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(b.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchVenue = selectedVenue === 'ALL' || b.venue === selectedVenue;
      return matchSearch && matchVenue;
    });
  }, [bookings, searchQuery, selectedVenue]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* 1. Header Banner */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                BANQUETS & CONVENTIONS
              </span>
              <span className="text-xs text-purple-200/80 font-mono">• Exceed HMS Module</span>
            </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                Banquets, Events & Catering
              </h1>
                <p className="text-xs text-purple-200 mt-1 max-w-xl leading-relaxed">
                  Manage weddings, corporate conferences, venue schedules, catering packages, and event folio billings with real-time Supabase sync.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeTab === 'bookings' && (
                  <button
                    onClick={() => setIsNewBookingModalOpen(true)}
                    className="h-10 px-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Banquet Booking</span>
                  </button>
                )}

                {activeTab === 'venues' && (
                  <button
                    onClick={() => setIsNewVenueModalOpen(true)}
                    className="h-10 px-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Venue / Hall</span>
                  </button>
                )}

                {activeTab === 'menus' && (
                  <button
                    onClick={() => setIsNewMenuModalOpen(true)}
                    className="h-10 px-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Catering Menu</span>
                  </button>
                )}
              </div>
          </div>

          {/* 2. Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Card 1: Total Bookings */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Bookings</span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4 text-purple-800" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">{bookings.length} Events</div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-slate-500">
                    <span>Scheduled in Calendar</span>
                  </div>
                </div>
              </div>

                {/* Card 2: Total Revenue */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Revenue</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-purple-700" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">₹{totalRevenue.toLocaleString('en-IN')}</div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-purple-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                      <span>Banquets & Catering</span>
                    </div>
                  </div>
                </div>

                  {/* Card 3: Advance Collected */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Advance Collected</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">₹{totalCollected.toLocaleString('en-IN')}</div>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Cleared in Bank</span>
                      </div>
                    </div>
                  </div>

                    {/* Card 4: Pending Balance Due */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Balance Due</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">₹{totalDue.toLocaleString('en-IN')}</div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span>Due on event date</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Navigation Sub-Tabs */}
                    <div className="bg-white rounded-2xl p-1.5 border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleTabChange('bookings')}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${activeTab === 'bookings'
                              ? 'bg-purple-900 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                            }`}
                        >
                          <CalendarCheck className="w-4 h-4" />
                          <span>Banquet Bookings & Calendar ({bookings.length})</span>
                        </button>

                        <button
                          onClick={() => handleTabChange('venues')}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${activeTab === 'venues'
                              ? 'bg-purple-900 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                            }`}
                        >
                          <Building className="w-4 h-4" />
                          <span>Venues & Halls Master ({venues.length})</span>
                        </button>

                        <button
                          onClick={() => handleTabChange('menus')}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${activeTab === 'menus'
                              ? 'bg-purple-900 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                            }`}
                        >
                          <Utensils className="w-4 h-4" />
                          <span>Catering Menus & Invoicing ({presetMenus.length})</span>
                        </button>
                      </div>

                      {/* Right status indicator */}
                      <div className="hidden sm:flex items-center gap-2 pr-3 text-[11px] font-semibold text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                        <span>Banquet Calendar In Sync</span>
                      </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* TAB 1: BANQUET BOOKINGS LIST */}
                    {/* ========================================================================= */}
                    {activeTab === 'bookings' && (
                      <div className="space-y-4">
                        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Search client, event or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                              />
                            </div>

                            {venues.length > 0 && (
                              <select
                                value={selectedVenue}
                                onChange={(e) => setSelectedVenue(e.target.value)}
                                className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 outline-none"
                              >
                                <option value="ALL">All Venues</option>
                                {venues.map(v => (
                                  <option key={v.id} value={v.name}>{v.name}</option>
                                ))}
                              </select>
                            )}
                          </div>

                          <div className="text-xs font-semibold text-slate-500">
                            Showing {filteredBookings.length} of {bookings.length} events
                          </div>
                        </div>

                        {filteredBookings.length === 0 ? (
                          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
                            <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                              <PartyPopper className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">No Banquet Bookings Found</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                              No events currently scheduled. Click the button below to reserve a hall or banquet space.
                            </p>
                            <button
                              onClick={() => setIsNewBookingModalOpen(true)}
                              className="mt-4 px-4 py-2 bg-purple-900 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                            >
                              + Create Banquet Booking
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredBookings.map(b => (
                              <div key={b.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition space-y-4 flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                                        {b.id}
                                      </span>
                                        <h4 className="font-bold text-slate-900 text-base mt-1">
                                          {b.guestName}
                                        </h4>
                                        <span className="text-xs text-slate-500 font-mono">{b.phone}</span>
                                    </div>

                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                                        b.status === 'COMPLETED' ? 'bg-sky-100 text-sky-800' :
                                          'bg-rose-100 text-rose-800'
                                      }`}>
                                      {b.status}
                                    </span>
                                  </div>

                                  <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Event:</span>
                                      <span className="font-bold text-slate-800">{b.eventType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Hall:</span>
                                      <span className="font-bold text-purple-950 truncate max-w-[180px]">{b.venue}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Date:</span>
                                      <span className="font-semibold text-slate-800">{b.date} • {b.timeSlot}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Pax:</span>
                                      <span className="font-semibold text-slate-800">{b.pax} Guests</span>
                                    </div>
                                  </div>

                                  <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                                    <div>
                                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Tariff</span>
                                      <span className="font-mono font-black text-slate-900 text-sm">₹{b.totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[10px] text-emerald-700 block uppercase font-bold">Advance Token</span>
                                      <span className="font-mono font-bold text-emerald-800 text-xs">₹{b.paidAmount.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                  <button
                                    onClick={() => setSelectedBookingForInvoice(b)}
                                    className="flex-1 py-1.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                                  >
                                    <Receipt className="w-3.5 h-3.5" />
                                    <span>Folio / BFP</span>
                                  </button>

                                  {b.status === 'CONFIRMED' && (
                                    <button
                                      onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                                    >
                                      Settle ✓
                                    </button>
                                  )}

                                  <button
                                    onClick={() => setBookings(prev => prev.filter(item => item.id !== b.id))}
                                    className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 2: VENUES & HALLS MASTER */}
                    {/* ========================================================================= */}
                    {activeTab === 'venues' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">Hotel Banquet & Convention Venues Master</h3>
                            <p className="text-xs text-slate-500">Add halls, lawns, and corporate conference meeting spaces.</p>
                          </div>
                          <button
                            onClick={() => setIsNewVenueModalOpen(true)}
                            className="px-3.5 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Venue / Hall</span>
                          </button>
                        </div>

                        {venues.length === 0 ? (
                          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
                            <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                              <Building className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">No Venues or Halls Added</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                              Configure your banquet halls, grand ballrooms, or meeting spaces with capacity and slot pricing.
                            </p>
                            <button
                              onClick={() => setIsNewVenueModalOpen(true)}
                              className="mt-4 px-4 py-2 bg-purple-900 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                            >
                              + Add Venue / Hall
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {venues.map(v => (
                              <div key={v.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="text-base font-bold text-slate-900">{v.name}</h3>
                                    <span className="text-xs text-slate-500">{v.floor} • {v.type}</span>
                                  </div>
                                  <div className="text-right font-mono font-black text-lg text-slate-900">
                                    ₹{v.rate.toLocaleString()}
                                    <span className="text-[10px] font-normal text-slate-400 block font-sans">base rental</span>
                                  </div>
                                </div>

                                <div className="p-3 bg-purple-50 rounded-2xl text-xs font-semibold text-purple-900 flex items-center justify-between">
                                  <span>Maximum Capacity:</span>
                                  <span className="font-bold">{v.capacity} Guests</span>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                  <span className="text-emerald-700 font-bold flex items-center space-x-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Available for Bookings</span>
                                  </span>
                                  <button
                                    onClick={() => {
                                      setFormVenue(v.name);
                                      setIsNewBookingModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                                  >
                                    Book This Hall
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 3: CATERING MENUS & INVOICING */}
                    {/* ========================================================================= */}
                    {activeTab === 'menus' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">Preset Catering Packages & Menus</h3>
                            <p className="text-xs text-slate-500">Configure wedding buffets, corporate high-teas, and per-guest dining rates.</p>
                          </div>
                          <button
                            onClick={() => setIsNewMenuModalOpen(true)}
                            className="px-3.5 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Create Catering Menu</span>
                          </button>
                        </div>

                        {presetMenus.length === 0 ? (
                          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
                            <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                              <Utensils className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">No Catering Menus Configured</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                              Add preset catering buffets, cocktails, or high-tea packages with per-guest tariffs.
                            </p>
                            <button
                              onClick={() => setIsNewMenuModalOpen(true)}
                              className="mt-4 px-4 py-2 bg-purple-900 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                            >
                              + Create Catering Menu
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {presetMenus.map(m => (
                              <div key={m.id || m.name} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
                                <div>
                                  <h3 className="text-base font-black text-slate-900">{m.name}</h3>
                                  <p className="text-lg font-black text-purple-950 font-mono mt-1">
                                    ₹{m.pricePerPax} <span className="text-xs font-normal text-slate-500">/ Person</span>
                                  </p>
                                  <div className="text-xs text-slate-600 leading-relaxed mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    {m.items}
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                                  <span className="text-slate-400 font-bold">Includes Chef & Service</span>
                                  <button
                                    onClick={() => {
                                      setFormMenu(m.name);
                                      setIsNewBookingModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-purple-100 text-purple-900 hover:bg-purple-200 rounded-xl font-bold transition cursor-pointer"
                                  >
                                    Select Package
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* MODAL: NEW BANQUET BOOKING */}
                    {/* ========================================================================= */}
                    {isNewBookingModalOpen && (
                      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-900">New Banquet Booking</h3>
                            <button onClick={() => setIsNewBookingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <form onSubmit={handleCreateBooking} className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Client / Host Name</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Verma Family / Corporate Host"
                                  value={formGuestName}
                                  onChange={(e) => setFormGuestName(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Mobile Phone</label>
                                <input
                                  type="tel"
                                  placeholder="e.g. +91 98765 43210"
                                  value={formPhone}
                                  onChange={(e) => setFormPhone(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Venue / Hall</label>
                                {venues.length > 0 ? (
                                  <select
                                    value={formVenue}
                                    onChange={(e) => setFormVenue(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                                  >
                                    <option value="">Select a Venue</option>
                                    {venues.map(v => (
                                      <option key={v.id} value={v.name}>{v.name} (₹{v.rate})</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder="e.g. Grand Ballroom"
                                    value={formVenue}
                                    onChange={(e) => setFormVenue(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                                    required
                                  />
                                )}
                              </div>

                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Event Type</label>
                                <select
                                  value={formEventType}
                                  onChange={(e) => setFormEventType(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                  <option value="Wedding Reception">Wedding Reception</option>
                                  <option value="Corporate Conference">Corporate Conference</option>
                                  <option value="Birthday Gala">Birthday Gala</option>
                                  <option value="Sangeet & Mehendi">Sangeet & Mehendi</option>
                                  <option value="Cocktail Dinner">Cocktail Dinner</option>
                                </select>
                              </div>
                            </div>

                            {venues.length === 0 && (
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Venue Slot Rental (₹)</label>
                                <input
                                  type="number"
                                  value={formCustomRate}
                                  onChange={(e) => setFormCustomRate(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Event Date</label>
                                <input
                                  type="date"
                                  value={formDate}
                                  onChange={(e) => setFormDate(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Time Slot</label>
                                <select
                                  value={formTimeSlot}
                                  onChange={(e) => setFormTimeSlot(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                  <option value="Morning (09:00 - 14:00)">Morning (09:00 - 14:00)</option>
                                  <option value="Evening (18:00 - 23:30)">Evening (18:00 - 23:30)</option>
                                  <option value="Full Day (09:00 - 23:00)">Full Day (09:00 - 23:00)</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Guaranteed Guests (Pax)</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={formPax}
                                  onChange={(e) => setFormPax(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Catering Package</label>
                                {presetMenus.length > 0 ? (
                                  <select
                                    value={formMenu}
                                    onChange={(e) => setFormMenu(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                  >
                                    <option value="">Select Package</option>
                                    {presetMenus.map(m => (
                                      <option key={m.id || m.name} value={m.name}>{m.name} (₹{m.pricePerPax}/pax)</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder="e.g. Wedding Grand Buffet"
                                    value={formMenu}
                                    onChange={(e) => setFormMenu(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                  />
                                )}
                              </div>
                            </div>

                            {presetMenus.length === 0 && (
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Catering Price per Guest (₹/pax)</label>
                                <input
                                  type="number"
                                  value={formCustomMenuPrice}
                                  onChange={(e) => setFormCustomMenuPrice(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Advance Token (₹)</label>
                              <input
                                type="number"
                                value={formAdvance}
                                onChange={(e) => setFormAdvance(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-emerald-800"
                              />
                            </div>

                            {/* Real-time Pricing Summary */}
                            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex justify-between items-center text-xs">
                              <div>
                                <span className="text-[10px] text-purple-700 block font-bold uppercase">Estimated Event Value</span>
                                <span className="font-mono font-black text-slate-900 text-base">₹{calculatedTotal.toLocaleString()}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block font-bold uppercase">Balance on Event Date</span>
                                <span className="font-mono font-bold text-rose-700">₹{(calculatedTotal - (Number(formAdvance) || 0)).toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setIsNewBookingModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold shadow-md cursor-pointer"
                              >
                                Confirm Banquet Booking
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* MODAL: NEW VENUE */}
                    {/* ========================================================================= */}
                    {isNewVenueModalOpen && (
                      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-900">Add Banquet Venue / Hall</h3>
                            <button onClick={() => setIsNewVenueModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <form onSubmit={handleCreateVenue} className="space-y-3 text-xs">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Hall Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Grand Crystal Ballroom"
                                value={venueName}
                                onChange={(e) => setVenueName(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Max Capacity (Guests)</label>
                                <input
                                  type="number"
                                  value={venueCapacity}
                                  onChange={(e) => setVenueCapacity(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Base Rent per Slot (₹)</label>
                                <input
                                  type="number"
                                  value={venueRate}
                                  onChange={(e) => setVenueRate(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Hall Type</label>
                                <select
                                  value={venueType}
                                  onChange={(e) => setVenueType(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                  <option value="Indoor AC">Indoor AC</option>
                                  <option value="Rooftop Lounge">Rooftop Lounge</option>
                                  <option value="Lawn / Garden">Lawn / Garden</option>
                                  <option value="Corporate Boardroom">Corporate Boardroom</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Floor Allocation</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Ground Floor, 2nd Floor"
                                  value={venueFloor}
                                  onChange={(e) => setVenueFloor(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setIsNewVenueModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold shadow-md cursor-pointer"
                              >
                                Add Venue
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* MODAL: NEW MENU */}
                    {/* ========================================================================= */}
                    {isNewMenuModalOpen && (
                      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-900">Create Catering Menu</h3>
                            <button onClick={() => setIsNewMenuModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <form onSubmit={handleCreateMenu} className="space-y-3 text-xs">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Package Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Royal Wedding Buffet"
                                value={menuName}
                                onChange={(e) => setMenuName(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                                required
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Price per Guest (₹/pax)</label>
                              <input
                                type="number"
                                value={menuPrice}
                                onChange={(e) => setMenuPrice(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                                required
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Items / Dishes Included</label>
                              <textarea
                                rows={3}
                                placeholder="List starters, main course, breads, desserts..."
                                value={menuItems}
                                onChange={(e) => setMenuItems(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                required
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setIsNewMenuModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold shadow-md cursor-pointer"
                              >
                                Save Package
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* MODAL: PRINTABLE BANQUET FUNCTION PROSPECTUS (BFP) */}
                    {/* ========================================================================= */}
                    {selectedBookingForInvoice && (
                      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                                BANQUET FUNCTION PROSPECTUS (BFP)
                              </span>
                                <h3 className="font-bold text-xl text-slate-900 mt-1">
                                  Event Folio #{selectedBookingForInvoice.id}
                                </h3>
                            </div>
                            <button onClick={() => setSelectedBookingForInvoice(null)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="py-4 space-y-3 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500 font-medium">Client / Host:</span>
                              <span className="font-bold text-slate-900">{selectedBookingForInvoice.guestName}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500 font-medium">Contact:</span>
                              <span className="font-mono text-slate-900">{selectedBookingForInvoice.phone}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500 font-medium">Venue:</span>
                              <span className="font-bold text-purple-900">{selectedBookingForInvoice.venue}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500 font-medium">Date & Slot:</span>
                              <span className="font-semibold text-slate-900">{selectedBookingForInvoice.date} • {selectedBookingForInvoice.timeSlot}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500 font-medium">Pax Count:</span>
                              <span className="font-bold text-slate-900">{selectedBookingForInvoice.pax} Guests</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500 font-medium">Catering Package:</span>
                              <span className="font-semibold text-slate-900">{selectedBookingForInvoice.cateringPackage}</span>
                            </div>

                            <div className="pt-2">
                              <div className="flex justify-between py-1 font-bold text-sm text-slate-900">
                                <span>Total Event Billing:</span>
                                <span className="font-mono">₹{selectedBookingForInvoice.totalAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between py-1 text-emerald-800 font-semibold">
                                <span>Advance Token Cleared:</span>
                                <span className="font-mono">₹{selectedBookingForInvoice.paidAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between py-1 text-rose-800 font-bold border-t border-slate-200 mt-1 pt-1">
                                <span>Remaining Due:</span>
                                <span className="font-mono">₹{(selectedBookingForInvoice.totalAmount - selectedBookingForInvoice.paidAmount).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                              onClick={() => handlePrintBanquetInvoice(selectedBookingForInvoice)}
                              className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                              <span>Print Prospectus</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                  );
}
