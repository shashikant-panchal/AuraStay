import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Home, 
  Sun, 
  Building, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  Clock, 
  Wrench, 
  UserPlus, 
  Plus, 
  Minus, 
  Info, 
  Bed, 
  DollarSign, 
  Percent, 
  ChevronDown,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export default function BookARoomView({ onBack, onSaveReservation }) {
  const { showNotification } = useDashboard();

  // Mode and switchers
  const [activeTab, setActiveTab] = useState('room'); // 'room' | 'daytrip' | 'wholeproperty'
  const [bookingMode, setBookingMode] = useState('RESERVATION'); // 'ENQUIRY' | 'RESERVATION'
  const [groupMode, setGroupMode] = useState('SINGLE'); // 'SINGLE' | 'GROUP'
  const [bookingStatus, setBookingStatus] = useState('Confirmed'); // 'Confirmed' | 'Tentative' | 'Hold Until' | 'Maintenance'
  const [counter, setCounter] = useState('AuraStay Suite-2259');
  const [operator, setOperator] = useState('Twinkle Bagh');

  // Primary Guest
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [guest, setGuest] = useState({
    name: '',
    phone: '',
    email: '',
    idProof: ''
  });

  // Stay Details
  const [checkIn, setCheckIn] = useState('05/11/2026');
  const [checkOut, setCheckOut] = useState('06/11/2026');
  const [roomType, setRoomType] = useState('');
  const [plan, setPlan] = useState('');
  const [roomsCount, setRoomsCount] = useState(0);
  const [adultsCount, setAdultsCount] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);

  // Discount
  const [discountType, setDiscountType] = useState('%'); // '%' | '₹'
  const [discountValue, setDiscountValue] = useState(0);
  const [showDiscountDetails, setShowDiscountDetails] = useState(false);

  // Advance Collection
  const [advanceAmount, setAdvanceAmount] = useState('0.00');
  const [paymentMode, setPaymentMode] = useState('Select mode');
  const [paymentStatus, setPaymentStatus] = useState('Select status');

  // Notes
  const [bookingNotes, setBookingNotes] = useState('');

  // Calculations
  const calculations = useMemo(() => {
    if (!roomType || roomsCount <= 0) {
      return {
        hasSelection: false,
        roomRate: 0,
        subTotal: 0,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        paidAmount: 0,
        dueAmount: 0
      };
    }

    let baseRate = 2000;
    if (roomType === 'Deluxe Room') baseRate = 2500;
    if (roomType === 'Super Deluxe Room') baseRate = 3000;
    if (roomType === 'Suite Room') baseRate = 3500;

    let planCost = 0;
    if (plan === 'CP Plan') planCost = 400;
    if (plan === 'MAP Plan') planCost = 900;
    if (plan === 'AP Plan') planCost = 1400;

    const singleRoomRate = baseRate + planCost;
    const roomSubTotal = singleRoomRate * roomsCount;

    let disc = 0;
    if (discountType === '%') {
      disc = (roomSubTotal * (parseFloat(discountValue) || 0)) / 100;
    } else {
      disc = parseFloat(discountValue) || 0;
    }

    const discountedTotal = Math.max(0, roomSubTotal - disc);
    const tax = discountedTotal * 0.12;
    const finalTotal = discountedTotal + tax;
    const adv = parseFloat(advanceAmount) || 0;
    const due = Math.max(0, finalTotal - adv);

    return {
      hasSelection: true,
      roomRate: singleRoomRate,
      subTotal: roomSubTotal,
      discountAmount: disc,
      taxAmount: tax,
      totalAmount: finalTotal,
      paidAmount: adv,
      dueAmount: due
    };
  }, [roomType, plan, roomsCount, discountType, discountValue, advanceAmount]);

  const handleConfirmAndSave = () => {
    const guestName = guest.name.trim() || 'Walk-in Guest';
    const newReservation = {
      id: 'BSE-B-865',
      hash: 'BSE-B-CI-383/2026',
      guest: guestName,
      guestType: 'WALKIN',
      phone: guest.phone || '+91 98765 43210',
      createdAt: '5 Nov 2026',
      createdTime: '12:30 PM',
      stayPeriod: `${checkIn} — ${checkOut}`,
      checkInOut: `${checkIn} 12:00 PM — ${checkOut} 11:00 AM`,
      roomType: roomType || 'Standard Room',
      ratePlan: plan || 'EP PLAN',
      rooms: ['105'],
      status: 'CONFIRMED',
      total: calculations.totalAmount > 0 ? calculations.totalAmount : 2000.00,
      paid: calculations.paidAmount,
      due: calculations.dueAmount > 0 ? calculations.dueAmount : 2000.00 - calculations.paidAmount,
      note: bookingNotes || null,
      highlight: false,
      invoiceNumber: null
    };

    if (onSaveReservation) {
      onSaveReservation(newReservation);
    }
    showNotification('Reservation #BSE-B-865 created successfully! Room R-105 allocated.');
    if (onBack) onBack();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* 1. Top Breadcrumb & Next Rsvn (Screenshot 2) */}
      <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200">
        <div className="flex items-center space-x-1.5 text-slate-500">
          <span 
            onClick={onBack}
            className="hover:text-slate-900 cursor-pointer transition flex items-center gap-1"
          >
            🏠 Home
          </span>
          <span>/</span>
          <span 
            onClick={onBack}
            className="hover:text-slate-900 cursor-pointer transition"
          >
            Reservation Management
          </span>
          <span>/</span>
          <span className="font-semibold text-slate-900">
            Book A Room
          </span>
        </div>

        <div className="text-xs font-bold text-[#008290]">
          Next Rsvn : <span className="tracking-wide">BSE - 865</span>
        </div>
      </div>

      {/* 2. Title, Modes & Switches Bar (Screenshot 2) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Back button & Title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              title="Back to Reservations"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                Book A Room
              </h1>
              <p className="text-xs text-slate-500">
                Create a new reservation for individual or group bookings.
              </p>
            </div>
          </div>

          {/* Mode Switchers & Toggles */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Category tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('room')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition ${
                  activeTab === 'room'
                    ? 'bg-[#0e4860] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Room</span>
              </button>

              <button
                onClick={() => setActiveTab('daytrip')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition ${
                  activeTab === 'daytrip'
                    ? 'bg-[#0e4860] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Day Trip</span>
              </button>

              <button
                onClick={() => setActiveTab('wholeproperty')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition ${
                  activeTab === 'wholeproperty'
                    ? 'bg-[#0e4860] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Whole Property</span>
              </button>
            </div>

            {/* ENQUIRY / RESERVATION Toggle */}
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold">
              <span className={bookingMode === 'ENQUIRY' ? 'text-slate-900' : 'text-slate-400'}>
                ENQUIRY
              </span>
              <button
                type="button"
                onClick={() => setBookingMode(bookingMode === 'ENQUIRY' ? 'RESERVATION' : 'ENQUIRY')}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                  bookingMode === 'RESERVATION' ? 'bg-[#0e4860]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    bookingMode === 'RESERVATION' ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={bookingMode === 'RESERVATION' ? 'text-[#0e4860]' : 'text-slate-400'}>
                RESERVATION
              </span>
            </div>

            {/* SINGLE / GROUP Toggle */}
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold">
              <span className={groupMode === 'SINGLE' ? 'text-slate-900' : 'text-slate-400'}>
                SINGLE
              </span>
              <button
                type="button"
                onClick={() => setGroupMode(groupMode === 'SINGLE' ? 'GROUP' : 'SINGLE')}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                  groupMode === 'GROUP' ? 'bg-[#0e4860]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    groupMode === 'GROUP' ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={groupMode === 'GROUP' ? 'text-[#0e4860]' : 'text-slate-400'}>
                GROUP
              </span>
            </div>

            <button
              onClick={() => showNotification('Resetting form inputs...')}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              title="Reset form"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* Status Row & Counter / Operator (Screenshot 2) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          
          {/* Status Pills */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
              Status
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'Confirmed', icon: Check, activeClass: 'border-2 border-teal-500 bg-teal-50 text-teal-800' },
                { id: 'Tentative', icon: AlertCircle, activeClass: 'border-2 border-amber-500 bg-amber-50 text-amber-800' },
                { id: 'Hold Until', icon: Clock, activeClass: 'border-2 border-sky-500 bg-sky-50 text-sky-800' },
                { id: 'Maintenance', icon: Wrench, activeClass: 'border-2 border-rose-500 bg-rose-50 text-rose-800' }
              ].map(st => {
                const Icon = st.icon;
                const isActive = bookingStatus === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => setBookingStatus(st.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                      isActive 
                        ? st.activeClass 
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{st.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Counter & Choose Operator Selectors */}
          <div className="flex items-center space-x-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block text-right mb-0.5">
                Counter
              </span>
              <div className="relative">
                <select
                  value={counter}
                  onChange={(e) => setCounter(e.target.value)}
                  className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-8 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs shadow-2xs"
                >
                  <option value="AuraStay Suite-2259">AuraStay Suite-2259</option>
                  <option value="Front Desk Counter 1">Front Desk Counter 1</option>
                  <option value="Front Desk Counter 2">Front Desk Counter 2</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block text-right mb-0.5">
                Choose Operator
              </span>
              <div className="relative">
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-8 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs shadow-2xs"
                >
                  <option value="Twinkle Bagh">Twinkle Bagh</option>
                  <option value="Ankit Sharma">Ankit Sharma</option>
                  <option value="Pooja Rawat">Pooja Rawat</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Main Form Grid: Left Column (Guest & Stay) + Right Column (Rate Breakdown & Summaries) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN (Cols 1-4) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* PRIMARY GUEST CARD (Screenshot 2) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  PRIMARY GUEST
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Choose an existing guest or add a new profile.
                </p>
              </div>

              <button
                onClick={() => setIsAddGuestModalOpen(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-semibold shadow-2xs transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Guest</span>
              </button>
            </div>

            {/* Guest Summary Card if added */}
            {guest.name ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{guest.name}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    {guest.phone || 'No phone'} | {guest.idProof || 'KYC Verified'}
                  </div>
                </div>
                <button
                  onClick={() => setIsAddGuestModalOpen(true)}
                  className="text-xs font-bold text-emerald-800 hover:underline"
                >
                  Edit
                </button>
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400">
                No guest selected. Walk-in default will be used if omitted.
              </div>
            )}
          </div>

          {/* STAY DETAILS CARD (Screenshot 2 & 3) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3.5">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              STAY DETAILS
            </h3>

            {/* Check-in & Check-out */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Check-in*
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Check-out*
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* 1 Night(s) Pill */}
            <div>
              <span className="bg-sky-50 text-sky-800 border border-sky-200 font-bold px-3 py-1 rounded-md text-xs inline-block">
                1 Night(s)
              </span>
            </div>

            {/* Room Type Dropdown */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                Room Type*
              </label>
              <div className="relative">
                <select
                  value={roomType}
                  onChange={(e) => {
                    setRoomType(e.target.value);
                    if (roomsCount === 0) setRoomsCount(1);
                    if (adultsCount === 0) setAdultsCount(1);
                  }}
                  className="w-full appearance-none text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                >
                  <option value="">Room Type</option>
                  <option value="Standard Room">Standard Room (₹2,000)</option>
                  <option value="Deluxe Room">Deluxe Room (₹2,500)</option>
                  <option value="Super Deluxe Room">Super Deluxe Room (₹3,000)</option>
                  <option value="Suite Room">Suite Room (₹3,500)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Plan Dropdown */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                Plan*
              </label>
              <div className="relative">
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full appearance-none text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                >
                  <option value="">Choose Plan</option>
                  <option value="EP Plan">EP Plan (Room Only)</option>
                  <option value="CP Plan">CP Plan (Bed & Breakfast)</option>
                  <option value="MAP Plan">MAP Plan (Breakfast + Dinner)</option>
                  <option value="AP Plan">AP Plan (All Meals)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Steppers: Rooms*, Adults*, Children */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Rooms *
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={roomsCount}
                  onChange={(e) => setRoomsCount(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 text-center"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Adults *
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={adultsCount}
                  onChange={(e) => setAdultsCount(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 text-center"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Children
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 text-center"
                />
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN (Cols 5-12) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* RATE BREAKDOWN CARD (Screenshot 2 & 3) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                RATE BREAKDOWN
              </h3>
              <p className="text-[11px] text-slate-400 italic">
                Reverse calculation supported — edit any cell to recalculate
              </p>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#0e4860] text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Particulars</th>
                    <th className="py-2.5 px-2 text-center">Rate</th>
                    <th className="py-2.5 px-2 text-center">Occupancy</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-2 text-center">Nts</th>
                    <th className="py-2.5 px-2 text-center">Dates</th>
                    <th className="py-2.5 px-2 text-center">Sub Total</th>
                    <th className="py-2.5 px-2 text-center">Tax</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-[11.5px] font-medium text-slate-700">
                  {/* Row 1: Room */}
                  <tr className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <input type="checkbox" defaultChecked className="rounded text-[#0e4860]" />
                      <span>Room</span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      {calculations.hasSelection ? `₹${calculations.roomRate}` : '—'}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {calculations.hasSelection ? adultsCount : '—'}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {calculations.hasSelection ? roomsCount : '—'}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {calculations.hasSelection ? '1' : '—'}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-500">
                      {calculations.hasSelection ? '05/11' : '—'}
                    </td>
                    <td className="py-2 px-2 text-center font-bold">
                      {calculations.hasSelection ? `₹${calculations.subTotal.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-500">
                      {calculations.hasSelection ? `₹${calculations.taxAmount.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {calculations.hasSelection ? `₹${calculations.totalAmount.toFixed(2)}` : '—'}
                    </td>
                  </tr>

                  {/* Row 2: Extra Adult */}
                  <tr className="hover:bg-slate-50/60 text-slate-400">
                    <td className="py-2 px-3 flex items-center gap-1.5">
                      <span>👤 Extra Adult</span>
                    </td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-3 text-right">—</td>
                  </tr>

                  {/* Row 3: Extra Child */}
                  <tr className="hover:bg-slate-50/60 text-slate-400">
                    <td className="py-2 px-3 flex items-center gap-1.5">
                      <span>👶 Extra Child</span>
                    </td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-3 text-right">—</td>
                  </tr>

                  {/* Row 4: Child < 5 */}
                  <tr className="hover:bg-slate-50/60 text-slate-400">
                    <td className="py-2 px-3 flex items-center gap-1.5">
                      <span>🍼 Child &lt; 5</span>
                    </td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-3 text-right">—</td>
                  </tr>

                  {/* Row 5: Service */}
                  <tr className="hover:bg-slate-50/60 text-slate-400">
                    <td className="py-2 px-3 flex items-center gap-1.5">
                      <span>🔔 Service</span>
                    </td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-3 text-right">—</td>
                  </tr>

                  {/* Row 6: TOTAL */}
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                    <td className="py-2 px-3 uppercase tracking-wider">TOTAL</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">—</td>
                    <td className="py-2 px-2 text-center">
                      {calculations.hasSelection ? `₹${calculations.subTotal.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {calculations.hasSelection ? `₹${calculations.taxAmount.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-700">
                      {calculations.hasSelection ? `₹${calculations.totalAmount.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Discount Control Row (Screenshot 2 & 3) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700">Discount</span>
                <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
                  <button
                    onClick={() => setDiscountType('%')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      discountType === '%' ? 'bg-[#0e4860] text-white shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setDiscountType('₹')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      discountType === '₹' ? 'bg-[#0e4860] text-white shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    ₹
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  max={discountType === '%' ? '100' : '50000'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-md font-bold text-slate-800 text-center"
                />
                <span className="text-[11px] text-slate-400">
                  Discount ({discountValue}{discountType})
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-rose-600 font-bold">
                    Due : ₹{calculations.dueAmount.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-900 font-black">
                    Total : ₹{calculations.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Show Discount Details switch */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDiscountDetails(!showDiscountDetails)}
                  className={`w-8 h-4 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                    showDiscountDetails ? 'bg-[#0e4860]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-200 ${
                      showDiscountDetails ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-[11.5px] font-medium text-slate-600">
                  Show Discount Details
                </span>
              </div>

              <div className="flex items-center space-x-3 text-xs font-bold">
                <span className="text-rose-600">
                  Total Due: ₹{calculations.dueAmount.toFixed(2)}
                </span>
                <span className="text-emerald-700">
                  Total Amount: ₹{calculations.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

          </div>

          {/* PAYMENT SUMMARY CARD (Dark Teal Box - Screenshot 3 & 4) */}
          <div className="bg-[#084055] text-white rounded-xl p-4 shadow-sm space-y-2.5 text-xs">
            <h3 className="font-black text-xs uppercase tracking-wider text-sky-200 border-b border-sky-800/80 pb-2">
              PAYMENT SUMMARY
            </h3>

            <div className="space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-200">Room Tariff</span>
                <span className="font-bold">₹{calculations.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Extra Person</span>
                <span>₹0.00</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Extra Child</span>
                <span>₹0.00</span>
              </div>
              <div className="flex justify-between text-[#facc15] font-semibold">
                <span>Discount</span>
                <span>-₹{calculations.discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Taxes (GST)</span>
                <span>₹{calculations.taxAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-sky-800/80 pt-2 space-y-1 font-bold">
              <div className="flex justify-between text-sm text-white">
                <span>Total Amount</span>
                <span>₹{calculations.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Paid</span>
                <span>₹{calculations.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Due</span>
                <span>₹{calculations.dueAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* ADVANCE COLLECTION CARD (Screenshot 4) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 text-xs">
            <h3 className="font-black text-xs text-slate-800 uppercase tracking-wider">
              ADVANCE COLLECTION
            </h3>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                Advance Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 font-bold text-slate-500">₹</span>
                <input
                  type="text"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                Mode of Payment
              </label>
              <div className="relative">
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Select mode">Select mode</option>
                  <option value="UPI / QR">UPI / QR Code</option>
                  <option value="Credit / Debit Card">Credit / Debit Card (POS)</option>
                  <option value="Cash">Cash at Counter</option>
                  <option value="Net Banking">Bank Transfer / NEFT</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                Payment Status
              </label>
              <div className="relative">
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Select status">Select status</option>
                  <option value="Fully Paid">Fully Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Payment Pending">Payment Pending</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ROOM ALLOCATION CARD (Screenshot 5) */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-2xs text-center space-y-2">
            <div className="w-12 h-12 rounded-full border border-dashed border-sky-300 bg-sky-50/50 flex items-center justify-center text-sky-700 mx-auto">
              <Bed className="w-6 h-6" />
            </div>
            {calculations.hasSelection ? (
              <div>
                <h4 className="text-sm font-bold text-emerald-800">
                  Room R-105 Auto-Allocated
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standard Room on 1st Floor ready for guest arrival.
                </p>
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-bold text-[#0e4860]">
                  Unable to Allocate Rooms
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Please try adjusting your search criteria or check back later.
                </p>
              </div>
            )}
          </div>

          {/* OTHER INFORMATION CARD (Screenshot 5) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2.5 text-xs">
            <h3 className="font-black text-xs text-slate-800 uppercase tracking-wider">
              OTHER INFORMATION
            </h3>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                Booking Notes
              </label>
              <textarea
                rows="3"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Any special requests or notes..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-[10.5px] text-slate-400 block mt-1">
                ** Any Special Request
              </span>
            </div>
          </div>

          {/* 4. BOTTOM ACTION BAR (Screenshot 5) */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Left Info Callout */}
            <div className="flex items-center space-x-2 bg-sky-50 text-sky-900 border border-sky-200/90 rounded-lg px-3 py-2 text-xs flex-1">
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                Please review all booking details carefully before saving. Ensure all information is accurate to avoid booking discrepancies later.
              </span>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center space-x-2.5 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAndSave}
                className="px-5 py-2 bg-[#5897a6] hover:bg-[#457c8a] text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Save</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* ADD GUEST MODAL */}
      {isAddGuestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-[#0e4860] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Add Guest Profile</h3>
              <button 
                onClick={() => setIsAddGuestModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsAddGuestModalOpen(false);
                showNotification(`Guest profile saved for ${guest.name}`);
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={guest.name}
                  onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={guest.phone}
                  onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={guest.email}
                  onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                  placeholder="guest@example.com"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Identity Proof / KYC
                </label>
                <select
                  value={guest.idProof}
                  onChange={(e) => setGuest({ ...guest, idProof: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Aadhaar Card Verified">Aadhaar Card Verified</option>
                  <option value="Passport Verified">Passport Verified</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Corporate ID">Corporate ID</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddGuestModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold"
                >
                  Save Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

