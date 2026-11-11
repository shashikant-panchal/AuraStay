import React, { useState, useMemo, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  X,
  CalendarPlus,
  BedDouble,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Receipt,
  Star,
  Check,
  DollarSign,
  Calendar
} from 'lucide-react';

export default function CreateReservationModal() {
  const {
    isCreateReservationModalOpen,
    setIsCreateReservationModalOpen,
    addReservation,
    rooms = [],
    reservations = [],
    roomTypes = [],
    showNotification
  } = useDashboard();

  // Guest Information
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('India');
  const [city, setCity] = useState('');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [vipTier, setVipTier] = useState('Regular');

  // Stay Information
  const [checkIn, setCheckIn] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedRoomNum, setSelectedRoomNum] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [ratePlan, setRatePlan] = useState('CP - Continental Plan (Breakfast Included)');

  // Commercials & Billing
  const [tariffRate, setTariffRate] = useState(2500);
  const [advancePaid, setAdvancePaid] = useState(1000);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [billingMode, setBillingMode] = useState('Guest Direct');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available vacant rooms
  const availableRooms = useMemo(() => {
    return rooms.filter(r => {
      const num = String(r.room_number || r.roomNumber);
      return r.status !== 'MAINTENANCE';
    });
  }, [rooms]);

  useEffect(() => {
    if (availableRooms.length > 0 && !selectedRoomNum) {
      setSelectedRoomNum(String(availableRooms[0].room_number || availableRooms[0].roomNumber));
      setTariffRate(Number(availableRooms[0].price || 2500));
    }
  }, [availableRooms, selectedRoomNum]);

  const handleRoomSelect = (num) => {
    setSelectedRoomNum(num);
    const rm = rooms.find(r => String(r.room_number || r.roomNumber) === String(num));
    if (rm) {
      setTariffRate(Number(rm.price || 2500));
    }
  };

  // Calculate nights
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };
  const nightsCount = calculateNights();

  // Commercials
  const subtotal = tariffRate * nightsCount;
  const taxes = Math.round(subtotal * 0.12);
  const totalTariff = subtotal + taxes;

  // Conflict validation
  const activeConflict = useMemo(() => {
    if (!selectedRoomNum || !checkIn || !checkOut) return null;
    if (checkIn >= checkOut) return 'Check-out date must be strictly after Check-in date.';

    const sDate = new Date(checkIn);
    const eDate = new Date(checkOut);

    const conflictingRes = reservations.find(res => {
      if (res.status === 'CANCELLED' || res.status === 'CHECKED_OUT') return false;
      const resRoomMatch = String(res.room).match(/\b(\d+)\b/);
      const resNum = resRoomMatch ? resRoomMatch[1] : String(res.room_number || res.room);
      if (String(resNum) !== String(selectedRoomNum)) return false;

      const rStart = new Date(res.checkIn || res.check_in);
      const rEnd = new Date(res.checkOut || res.check_out);
      return sDate < rEnd && eDate > rStart;
    });

    if (conflictingRes) {
      return `Room #${selectedRoomNum} is already reserved by ${conflictingRes.guest || 'another guest'} from ${conflictingRes.checkIn || conflictingRes.check_in} to ${conflictingRes.checkOut || conflictingRes.check_out}.`;
    }
    return null;
  }, [selectedRoomNum, checkIn, checkOut, reservations]);

  if (!isCreateReservationModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setValidationError('Please enter guest full name.');
      return;
    }
    if (activeConflict) {
      setValidationError(activeConflict);
      showNotification(activeConflict, 'error');
      return;
    }

    setValidationError('');
    setIsSubmitting(true);

    try {
      const selectedRoomObj = rooms.find(r => String(r.room_number || r.roomNumber) === String(selectedRoomNum));

      const payload = {
        id: `RES-${Date.now().toString().slice(-4)}`,
        guest: guestName.trim(),
        guest_email: email.trim() || null,
        guest_phone: phone.trim() || null,
        guest_country: country,
        guest_id_type: idType,
        guest_id_number: idNumber.trim() || null,
        vip_tier: vipTier,
        room: `Room ${selectedRoomNum} - ${selectedRoomObj?.type || 'Deluxe'}`,
        room_number: selectedRoomNum,
        room_type: selectedRoomObj?.type || 'Deluxe Room',
        check_in: checkIn,
        check_out: checkOut,
        nights: nightsCount,
        adults: Number(adults),
        children: Number(children),
        rate_plan: ratePlan,
        source: 'Front Desk Direct Booking',
        amount: totalTariff,
        paid: Number(advancePaid) || 0,
        advance_paid: Number(advancePaid) || 0,
        payment_mode: paymentMode,
        billing_mode: billingMode,
        organisation: companyName.trim() || null,
        gstin: gstin.trim() || null,
        status: 'CONFIRMED',
        payment: Number(advancePaid) >= totalTariff ? 'PAID' : 'PENDING',
        notes: notes.trim() || null
      };

      if (addReservation) {
        await addReservation(payload);
      }
      showNotification(`Reservation confirmed for ${guestName} in Room #${selectedRoomNum}!`, 'success');
      setIsCreateReservationModalOpen(false);
    } catch (err) {
      setValidationError('Failed to create reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide">
                Exceed HMS Reservation Create & Room Booking
              </h2>
              <p className="text-xs text-indigo-200/80">
                Front desk guest registration, KYC identity proof & room allocation
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateReservationModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          
          {validationError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1: Guest Profile & KYC */}
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Primary Guest Identity & KYC</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Rajesh Sharma"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/30 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">VIP Tier</label>
                <select
                  value={vipTier}
                  onChange={(e) => setVipTier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold outline-none text-xs"
                >
                  <option value="Regular">Regular Guest</option>
                  <option value="Silver VIP">Silver VIP</option>
                  <option value="Gold VIP">Gold VIP</option>
                  <option value="Platinum VIP">Platinum VIP</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Mobile Number *</label>
                <input
                  type="text"
                  placeholder="+91..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="rajesh@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">City / Origin</label>
                <input
                  type="text"
                  placeholder="City, State"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>
            </div>

            {/* Government ID Proof */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">ID Proof Type</label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold outline-none text-xs"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">ID Document Number</label>
                <input
                  type="text"
                  placeholder="e.g. 5421-9812-4412"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Stay Dates & Room Selection */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Stay Dates & Room Allocation</span>
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Check-In Date *</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Check-Out Date *</label>
                <input
                  type="date"
                  min={checkIn}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Select Room *</label>
                <select
                  value={selectedRoomNum}
                  onChange={(e) => handleRoomSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-xs outline-none"
                >
                  {availableRooms.map(r => {
                    const rNum = String(r.room_number || r.roomNumber);
                    return (
                      <option key={rNum} value={rNum}>
                        Room #{rNum} ({r.type || 'Deluxe'}) - â‚¹{r.price || 2500}/n
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Adults / Children</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={adults}
                    onChange={(e) => setAdults(e.target.value)}
                    className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-300 text-center font-bold text-xs"
                    title="Adults"
                  />
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={children}
                    onChange={(e) => setChildren(e.target.value)}
                    className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-300 text-center font-bold text-xs"
                    title="Children"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Rate Plan</label>
                <select
                  value={ratePlan}
                  onChange={(e) => setRatePlan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-xs outline-none"
                >
                  <option value="EP - Room Only">EP (Room Only)</option>
                  <option value="CP - Continental Plan (Breakfast Included)">CP (With Breakfast)</option>
                  <option value="MAP - Half Board (Breakfast + Dinner)">MAP (Half Board)</option>
                  <option value="AP - Full Board (All Meals)">AP (All Meals)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Commercials & Billing */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                Commercials, Taxes & Advance Settlement
              </span>
              <span className="text-[11px] font-bold text-amber-800">
                {nightsCount} Night{nightsCount > 1 ? 's' : ''} Stay
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Daily Tariff</span>
                <span className="font-mono font-bold text-slate-900">â‚¹{tariffRate.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Room Subtotal</span>
                <span className="font-mono font-bold text-slate-900">â‚¹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">GST (12%)</span>
                <span className="font-mono font-bold text-slate-900">â‚¹{taxes.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-indigo-700 font-bold uppercase block">Total Amount</span>
                <span className="font-mono font-black text-indigo-950 text-sm">â‚¹{totalTariff.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Advance Payment Amount (â‚¹)
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalTariff}
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-bold font-mono text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-xs outline-none"
                >
                  <option value="UPI">UPI / QR (GPay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash (Front Desk)</option>
                  <option value="Credit Card">Credit / Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Direct Billing">Company Direct Bill</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Special Preferences & Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              Guest Remarks / Special Preferences
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Non-smoking room, high floor, airport taxi pickup..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setIsCreateReservationModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !!activeConflict}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Confirming...' : 'Confirm Reservation & Post Folio'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
