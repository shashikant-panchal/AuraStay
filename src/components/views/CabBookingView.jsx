import React, { useState, useMemo, useEffect } from 'react';
import aavasaLogo from '../../assets/aavasa-logo.jpg';
import { useDashboard } from '../../context/DashboardContext';
import {
  CarTaxiFront,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Phone,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Printer,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Navigation,
  X,
  Edit3,
  Trash2,
  Car,
  Check
} from 'lucide-react';

export default function CabBookingView() {
  const {
    cabBookings = [],
    addCabBooking,
    updateCabBooking,
    deleteCabBooking,
    rooms = [],
    reservations = [],
    currentHotel = {},
    showNotification
  } = useDashboard();

  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isNewBookingModalOpen) setIsNewBookingModalOpen(false);
        if (editingBooking) setEditingBooking(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNewBookingModalOpen, editingBooking]);

  // New Booking Form State
  const now = new Date();
  const defaultDate = now.toISOString().slice(0, 10);
  const defaultTime = `${String(now.getHours() + 1).padStart(2, '0')}:00`;

  const [formData, setFormData] = useState({
    guestName: '',
    roomNumber: '',
    phone: '',
    pickupLocation: 'Hotel Shivanandi (Main Porch)',
    dropLocation: 'Kempegowda Int. Airport (BLR T1)',
    pickupDate: defaultDate,
    pickupTime: defaultTime,
    cabType: 'Sedan (Dzire / Etios)',
    fare: 1800,
    driverName: '',
    driverPhone: '',
    vehicleNumber: '',
    paymentStatus: 'PENDING',
    bookingStatus: 'CONFIRMED',
    notes: ''
  });

  // Cab Type pricing helper
  const handleCabTypeChange = (type) => {
    let price = 1800;
    if (type.includes('SUV')) price = 2800;
    else if (type.includes('Luxury')) price = 5500;
    else if (type.includes('Tempo')) price = 4200;
    setFormData(prev => ({ ...prev, cabType: type, fare: price }));
  };

  // Quick chips
  const quickLocations = [
    'Hotel Shivanandi (Main Porch)',
    'Kempegowda Int. Airport (BLR T1)',
    'Kempegowda Int. Airport (BLR T2)',
    'Krantivira Sangolli Rayanna (City Station)',
    'Bangalore Cantonment Station',
    'Electronic City Phase 1',
    'Whitefield ITPL'
  ];

  // In-house guests for quick autocomplete
  const inHouseGuests = useMemo(() => {
    return reservations.filter(r => r.status === 'CHECKED_IN' || r.status === 'CONFIRMED');
  }, [reservations]);

  const handleSelectInHouseGuest = (r) => {
    const rNum = String(r.room_number || r.room || '').replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      guestName: r.guest || '',
      roomNumber: rNum,
      phone: r.guest_phone || r.phone || ''
    }));
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!formData.guestName.trim() || !formData.phone.trim()) {
      showNotification('Please enter guest name and contact phone.');
      return;
    }

    await addCabBooking({
      guestName: formData.guestName.trim(),
      roomNumber: formData.roomNumber.trim() || null,
      phone: formData.phone.trim(),
      pickupLocation: formData.pickupLocation.trim(),
      dropLocation: formData.dropLocation.trim(),
      pickupTime: `${formData.pickupDate} ${formData.pickupTime}`,
      cabType: formData.cabType,
      driverName: formData.driverName.trim() || null,
      driverPhone: formData.driverPhone.trim() || null,
      vehicleNumber: formData.vehicleNumber.trim() || null,
      fare: Number(formData.fare) || 0,
      paymentStatus: formData.paymentStatus,
      bookingStatus: formData.bookingStatus,
      notes: formData.notes.trim() || null
    });

    setIsNewBookingModalOpen(false);
    setFormData({
      guestName: '',
      roomNumber: '',
      phone: '',
      pickupLocation: 'Hotel Shivanandi (Main Porch)',
      dropLocation: 'Kempegowda Int. Airport (BLR T1)',
      pickupDate: defaultDate,
      pickupTime: defaultTime,
      cabType: 'Sedan (Dzire / Etios)',
      fare: 1800,
      driverName: '',
      driverPhone: '',
      vehicleNumber: '',
      paymentStatus: 'PENDING',
      bookingStatus: 'CONFIRMED',
      notes: ''
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;
    await updateCabBooking(editingBooking.id, editingBooking);
    setEditingBooking(null);
  };

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return cabBookings.filter(b => {
      const bStatus = (b.bookingStatus || b.booking_status || 'CONFIRMED').toUpperCase();
      const pTime = String(b.pickupTime || b.pickup_time || '');
      const isToday = pTime.startsWith(defaultDate);

      if (activeFilter === 'TODAY' && !isToday) return false;
      if (activeFilter === 'IN_TRANSIT' && bStatus !== 'IN_TRANSIT') return false;
      if (activeFilter === 'COMPLETED' && bStatus !== 'COMPLETED') return false;
      if (activeFilter === 'CANCELLED' && bStatus !== 'CANCELLED') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const gName = String(b.guestName || b.guest_name || '').toLowerCase();
        const ph = String(b.phone || '').toLowerCase();
        const rm = String(b.roomNumber || b.room_number || '').toLowerCase();
        const drv = String(b.driverName || b.driver_name || '').toLowerCase();
        const vNum = String(b.vehicleNumber || b.vehicle_number || '').toLowerCase();
        if (!gName.includes(q) && !ph.includes(q) && !rm.includes(q) && !drv.includes(q) && !vNum.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [cabBookings, activeFilter, searchQuery, defaultDate]);

  // KPIs
  const totalTrips = cabBookings.length;
  const inTransitCount = cabBookings.filter(b => (b.bookingStatus || b.booking_status) === 'IN_TRANSIT').length;
  const todayCount = cabBookings.filter(b => String(b.pickupTime || b.pickup_time || '').startsWith(defaultDate)).length;
  const totalRevenue = cabBookings
    .filter(b => (b.bookingStatus || b.booking_status) !== 'CANCELLED')
    .reduce((sum, b) => sum + (Number(b.fare) || 0), 0);

  // Print voucher
  const handlePrintVoucher = (b) => {
    const printWindow = window.open('', '_blank', 'width=750,height=800');
    if (!printWindow) return;
    const basePath = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/';
    const logoUrl = new URL(aavasaLogo || 'aavasa-logo.jpg', basePath).href;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cab Travel Voucher - ${b.id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; color: #1e293b; line-height: 1.5; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 20px; }
          .logo { max-height: 55px; }
          .title-area h1 { margin: 0; font-size: 20px; color: #0369a1; }
          .title-area p { margin: 2px 0 0 0; color: #64748b; font-size: 11px; }
          .badge { background: #e0f2fe; color: #0284c7; padding: 4px 8px; border-radius: 6px; font-weight: 800; font-size: 11px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 14px; }
          .card h3 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #64748b; }
          .row { display: flex; justify-content: space-between; padding: 3px 0; }
          .val { font-weight: 700; color: #0f172a; }
          .route { background: #eff6ff; border: 1px dashed #93c5fd; border-radius: 8px; padding: 12px; margin-bottom: 14px; }
          .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display:flex; align-items:center; gap: 12px;">
            <img src="${logoUrl}" alt="Aavasa" class="logo" />
            <div class="title-area">
              <h1>Shivanandi Hotel Travel Desk</h1>
              <p>Aavasa — Hospitality Simplified • Bengaluru, Karnataka</p>
            </div>
          </div>
          <div>
            <span class="badge">CAB TRAVEL PASS</span>
            <div style="font-weight:bold; font-size: 13px; margin-top: 4px;">Pass #${b.id}</div>
          </div>
        </div>

        <div class="route">
          <div style="font-size: 11px; color: #64748b; font-weight:bold;">TRAVEL ROUTE</div>
          <div style="font-size: 14px; font-weight: 800; color: #1e3a8a; margin-top: 4px;">
            ${b.pickupLocation || b.pickup_location} ➔ ${b.dropLocation || b.drop_location}
          </div>
          <div style="font-size: 12px; color: #475569; margin-top: 2px;">
            Pickup Scheduled: <strong>${b.pickupTime || b.pickup_time}</strong>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="card">
            <h3>Guest Information</h3>
            <div class="row"><span>Guest Name:</span><span class="val">${b.guestName || b.guest_name}</span></div>
            <div class="row"><span>Room Number:</span><span class="val">${b.roomNumber || b.room_number || 'N/A'}</span></div>
            <div class="row"><span>Phone:</span><span class="val">${b.phone}</span></div>
          </div>
          <div class="card">
            <h3>Vehicle & Driver</h3>
            <div class="row"><span>Vehicle Type:</span><span class="val">${b.cabType || b.cab_type}</span></div>
            <div class="row"><span>Driver:</span><span class="val">${b.driverName || b.driver_name || 'Assigned on Dispatch'}</span></div>
            <div class="row"><span>Vehicle Plate:</span><span class="val">${b.vehicleNumber || b.vehicle_number || 'To be shared via SMS'}</span></div>
          </div>
        </div>

        <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span style="font-size: 11px; color:#64748b;">TOTAL LOGISTICS FARE:</span>
            <div style="font-size: 18px; font-weight:900; color:#047857;">₹${Number(b.fare).toLocaleString()}</div>
          </div>
          <div>
            <span style="font-size: 11px; color:#64748b;">PAYMENT STATUS:</span>
            <div style="font-weight:bold; color: #0284c7;">${b.paymentStatus || b.payment_status}</div>
          </div>
        </div>

        <div class="footer">
          <p>For instant driver coordination, contact Shivanandi Travel Desk (+91 79785 78046).</p>
          <p>Generated by Aavasa HMS Travel Logistics System.</p>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <CarTaxiFront className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Cab Booking & Travel Desk
              </h1>
              <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                Shivanandi Logistics
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Airport transfers, guest drop-offs, driver dispatch, and direct room billing.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewBookingModalOpen(true)}
          className="px-4 py-2.5 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5 cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Book A Cab</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Trips</span>
            <CarTaxiFront className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalTrips}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Recorded bookings</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active / En Route</span>
            <Navigation className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{inTransitCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Vehicles on the road</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Today's Pickups</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-2">{todayCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Scheduled today</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Travel Revenue</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">₹{totalRevenue.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Total fare volume</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {['ALL', 'TODAY', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                activeFilter === tab
                  ? 'bg-[#0e4860] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search guest, phone, room, driver..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px] tracking-wider">
                <th className="py-3 px-4">Trip ID</th>
                <th className="py-3 px-4">Guest & Room</th>
                <th className="py-3 px-4">Route (Pickup ➔ Drop)</th>
                <th className="py-3 px-4">Pickup Time</th>
                <th className="py-3 px-4">Cab & Driver</th>
                <th className="py-3 px-4">Fare & Payment</th>
                <th className="py-3 px-4">Trip Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CarTaxiFront className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600 text-sm">No Cab Bookings Found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "+ Book A Cab" to schedule an airport transfer or city cab.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => {
                  const bStatus = (b.bookingStatus || b.booking_status || 'CONFIRMED').toUpperCase();
                  const pStatus = (b.paymentStatus || b.payment_status || 'PENDING').toUpperCase();

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-sky-800">
                        #{b.id}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{b.guestName || b.guest_name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                          {(b.roomNumber || b.room_number) && (
                            <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                              Room {b.roomNumber || b.room_number}
                            </span>
                          )}
                          <span>{b.phone}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center space-x-1 font-semibold text-slate-800 truncate">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{b.pickupLocation || b.pickup_location}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-500 truncate mt-0.5">
                          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{b.dropLocation || b.drop_location}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {b.pickupTime || b.pickup_time}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{b.cabType || b.cab_type}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {(b.driverName || b.driver_name) ? (
                            <span>{b.driverName || b.driver_name} • {b.vehicleNumber || b.vehicle_number || ''}</span>
                          ) : (
                            <span className="text-amber-600 font-semibold italic">Unassigned</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono font-black text-slate-900">
                          ₹{Number(b.fare).toLocaleString()}
                        </div>
                        <span className={`inline-block text-[9.5px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                          pStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : pStatus === 'BILLED_TO_ROOM'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {pStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          bStatus === 'IN_TRANSIT'
                            ? 'bg-amber-100 text-amber-800'
                            : bStatus === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : bStatus === 'CANCELLED'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-sky-100 text-sky-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            bStatus === 'IN_TRANSIT'
                              ? 'bg-amber-500'
                              : bStatus === 'COMPLETED'
                              ? 'bg-emerald-500'
                              : 'bg-sky-500'
                          }`} />
                          <span>{bStatus}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setEditingBooking(b)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title="Update Status & Driver"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handlePrintVoucher(b)}
                            className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition"
                            title="Print Travel Pass"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Delete cab booking #${b.id}?`)) {
                                deleteCabBooking(b.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: NEW CAB BOOKING */}
      {isNewBookingModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150"
          onClick={() => setIsNewBookingModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Pinned) */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 text-[#0e4860] flex items-center justify-center font-bold shadow-xs">
                  <CarTaxiFront className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">Book A New Cab</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{currentHotel?.name || 'AuraStay'} • Travel Desk Logistics</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewBookingModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form wrapping body and footer */}
            <form onSubmit={handleCreateBooking} className="flex flex-col flex-1 min-h-0">
              {/* Scrollable Form Body */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                {/* In-House Guest Quick Picker */}
                {inHouseGuests.length > 0 && (
                  <div className="p-3 bg-sky-50/60 rounded-2xl border border-sky-100">
                    <span className="text-[10px] uppercase font-bold text-sky-800 block mb-1.5 flex items-center space-x-1">
                      <User className="w-3 h-3 text-sky-600" />
                      <span>Quick Select In-House Guest:</span>
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {inHouseGuests.slice(0, 8).map(g => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => handleSelectInHouseGuest(g)}
                          className="px-2.5 py-1 bg-white hover:bg-sky-100 text-slate-800 border border-sky-200 rounded-lg text-[11px] font-semibold transition shrink-0 cursor-pointer shadow-2xs"
                        >
                          {g.guest} ({g.room || 'Room'})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Guest Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.guestName}
                      onChange={e => setFormData({ ...formData, guestName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Room Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 102"
                      value={formData.roomNumber}
                      onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 98450 12345"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pickup Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.pickupLocation}
                    onChange={e => setFormData({ ...formData, pickupLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {quickLocations.slice(0, 3).map(loc => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setFormData({ ...formData, pickupLocation: loc })}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition"
                      >
                        {loc.split('(')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Drop Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.dropLocation}
                    onChange={e => setFormData({ ...formData, dropLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {quickLocations.slice(1, 4).map(loc => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setFormData({ ...formData, dropLocation: loc })}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition"
                      >
                        {loc.split('(')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Pickup Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.pickupDate}
                      onChange={e => setFormData({ ...formData, pickupDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Pickup Time *</label>
                    <input
                      type="time"
                      required
                      value={formData.pickupTime}
                      onChange={e => setFormData({ ...formData, pickupTime: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Cab Category</label>
                    <select
                      value={formData.cabType}
                      onChange={e => handleCabTypeChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                    >
                      <option value="Sedan (Dzire / Etios)">Sedan (Dzire / Etios) — ₹1,800</option>
                      <option value="SUV (Innova / Ertiga)">SUV (Innova / Ertiga) — ₹2,800</option>
                      <option value="Luxury (Camry / Mercedes)">Luxury (Camry / Mercedes) — ₹5,500</option>
                      <option value="Tempo Traveller 12-Seater">Tempo Traveller 12-Seater — ₹4,200</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Fare (₹)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.fare}
                      onChange={e => setFormData({ ...formData, fare: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                    Driver & Vehicle Allocation (Optional)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <span className="text-[10px] text-slate-600 font-medium block mb-1">Driver Name</span>
                      <input
                        type="text"
                        placeholder="e.g. Manjunath"
                        value={formData.driverName}
                        onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 font-medium block mb-1">Driver Phone</span>
                      <input
                        type="text"
                        placeholder="e.g. 98450 99999"
                        value={formData.driverPhone}
                        onChange={e => setFormData({ ...formData, driverPhone: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 font-medium block mb-1">Vehicle Plate</span>
                      <input
                        type="text"
                        placeholder="KA 04 MP 1234"
                        value={formData.vehicleNumber}
                        onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono uppercase bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
                    <select
                      value={formData.paymentStatus}
                      onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                    >
                      <option value="PENDING">Pay to Driver at Drop</option>
                      <option value="PAID">Collected at Desk (Cash/UPI)</option>
                      <option value="BILLED_TO_ROOM">Bill to Room Folio</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Booking Status</label>
                    <select
                      value={formData.bookingStatus}
                      onChange={e => setFormData({ ...formData, bookingStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                    >
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="IN_TRANSIT">IN_TRANSIT</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Special Instructions / Remarks (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Flight 6E-204 arrival, 2 big suitcases, child seat requested..."
                    value={formData.notes || ''}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Footer (Pinned) */}
              <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-500 font-medium">
                  Estimated Total: <strong className="text-slate-900 font-bold text-sm">₹{Number(formData.fare || 0).toLocaleString('en-IN')}</strong>
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsNewBookingModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold transition shadow-sm cursor-pointer flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Create Cab Booking</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT / UPDATE STATUS */}
      {editingBooking && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150"
          onClick={() => setEditingBooking(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Update Trip #{editingBooking.id}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingBooking.guestName || editingBooking.guest_name} • {editingBooking.cabType || editingBooking.cab_type || 'Cab'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditingBooking(null)} 
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 overflow-y-auto flex-1 space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Trip Status</label>
                  <select
                    value={editingBooking.bookingStatus || editingBooking.booking_status}
                    onChange={e => setEditingBooking({ ...editingBooking, bookingStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="IN_TRANSIT">IN_TRANSIT</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Driver Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Manjunath"
                    value={editingBooking.driverName || editingBooking.driver_name || ''}
                    onChange={e => setEditingBooking({ ...editingBooking, driverName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Driver Contact</label>
                  <input
                    type="text"
                    placeholder="e.g. 98450 11223"
                    value={editingBooking.driverPhone || editingBooking.driver_phone || ''}
                    onChange={e => setEditingBooking({ ...editingBooking, driverPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Vehicle Plate Number</label>
                  <input
                    type="text"
                    placeholder="e.g. KA 04 MP 1234"
                    value={editingBooking.vehicleNumber || editingBooking.vehicle_number || ''}
                    onChange={e => setEditingBooking({ ...editingBooking, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Payment Status</label>
                  <select
                    value={editingBooking.paymentStatus || editingBooking.payment_status}
                    onChange={e => setEditingBooking({ ...editingBooking, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="BILLED_TO_ROOM">BILLED_TO_ROOM</option>
                  </select>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold transition shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
