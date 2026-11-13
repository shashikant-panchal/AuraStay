import React, { useState } from 'react';

/**
 * Architectural Neoclassical Hotel Emblem Logo matching Image 2 & 3
 */
export function HotelVoucherLogo({ className = "w-16 h-16" }) {
  return (
    <img
      src="/aavasa-logo.jpg"
      alt="Aavasa — Hospitality Simplified"
      className={`${className} object-contain rounded-md`}
    />
  );
}

/**
 * Complete, Un-clipped Booking Voucher & Tax Invoice matching Image 3
 * with all detailed amounts: Tariff, Discounts, Additional Charges, Taxes, Paid & Balance Due.
 */
export default function BookingVoucher({
  room,
  reservation,
  folioItems = [],
  paymentEntries = [],
  discountPercent = 0,
  currentHotel = {},
  voucherType = 'BOOKING VOUCHER',
  voucherNo,
  voucherDate,
  onClose
}) {
  // Currency state (defaults to Indian Rupee ₹)
  const [selectedCurrency, setSelectedCurrency] = useState(
    currentHotel?.currencySymbol || '₹'
  );

  const roomNum = String(room?.room_number || room?.roomNumber || room?.number || '101');
  const roomCategory = String(room?.category || room?.type || 'DELUXE ROOM').toUpperCase();
  const guestName = reservation?.guest || reservation?.name || room?.guest || 'Valued Guest';
  const phone = reservation?.phone || reservation?.guestPhone || '';
  const email = reservation?.email || '';
  const address = reservation?.address || currentHotel?.city || 'Bengaluru';
  const organisation = reservation?.organisation || reservation?.company || 'Direct Guest';
  const gstin = reservation?.gstin || reservation?.gst || '29AAACH7409R1ZZ';

  // Dates & Times
  const checkInRaw = reservation?.check_in || reservation?.checkIn || new Date().toISOString().split('T')[0];
  const checkOutRaw = reservation?.check_out || reservation?.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Calculate nights
  const calculateNights = (start, end) => {
    try {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : (reservation?.nights || 1);
    } catch {
      return reservation?.nights || 1;
    }
  };
  const nights = calculateNights(checkInRaw, checkOutRaw);

  // Format date: "11-Nov-2026"
  const formatDateDDMMMYYYY = (dateInput) => {
    try {
      const d = dateInput ? new Date(dateInput) : new Date();
      if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-GB');
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return new Date().toLocaleDateString('en-GB');
    }
  };

  // Format date with time
  const formatDateTime = (dateInput, defaultTime = '12:00 PM') => {
    try {
      const d = dateInput ? new Date(dateInput) : new Date();
      if (isNaN(d.getTime())) return `${formatDateDDMMMYYYY(new Date())} ${defaultTime}`;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      return `${month} ${day}, ${year} ${defaultTime}`;
    } catch {
      return `${formatDateDDMMMYYYY(new Date())} ${defaultTime}`;
    }
  };

  const displayDate = voucherDate || formatDateDDMMMYYYY(new Date());
  const displayVoucherNo = voucherNo || reservation?.id || `VOUCH-${roomNum}`;

  // Hotel Info
  const hotelName = currentHotel?.name || 'Shivanandi';
  const operatingUnit = currentHotel?.operatingUnit || 'Aavasa — Hospitality Simplified';
  const hotelAddress = currentHotel?.address || 'Bengaluru, Karnataka, India';
  const hotelPhone = currentHotel?.mobile || currentHotel?.phone || '+91 79785 78046';
  const hotelEmail = currentHotel?.email || 'reservations@aavasa.com';
  const hotelWebsite = currentHotel?.website || 'https://aavasa.com';

  // --- DETAILED FINANCIAL CALCULATIONS ---
  // 1. Room Tariff
  const baseRatePerNight = Number(room?.tariff || room?.price || reservation?.price || 2500);
  const extraChargePerNight = 0.00;
  const roomDiscountPerNight = discountPercent > 0 ? (baseRatePerNight * discountPercent) / 100 : 0.00;
  const taxableRoomRate = baseRatePerNight - roomDiscountPerNight;
  const roomTaxRatePercent = 5; // standard 5% tax
  const roomTaxPerNight = (taxableRoomRate * roomTaxRatePercent) / 100;
  const totalPerNight = taxableRoomRate + roomTaxPerNight;
  const totalRoomStayAmount = totalPerNight * nights;
  const totalBaseTariffAllNights = baseRatePerNight * nights;

  // 2. Additional Charges & Incidentals (F&B, Laundry, etc.)
  const additionalItems = folioItems.filter(item => item.category !== 'Room Tariff');
  const additionalChargesGross = additionalItems.reduce((sum, item) => sum + (Number(item.amount || item.rate) || 0), 0);
  const additionalTaxesTotal = additionalItems.reduce((sum, item) => {
    const amt = Number(item.amount || item.rate) || 0;
    const gstRate = Number(item.gst) || 5;
    return sum + (amt * gstRate) / 100;
  }, 0);

  // 3. Overall Totals
  const combinedSubtotal = totalBaseTariffAllNights + additionalChargesGross;
  const totalDiscountAmount = (totalBaseTariffAllNights * discountPercent) / 100;
  const netTaxableAmount = combinedSubtotal - totalDiscountAmount;

  // CGST & SGST Split
  const totalRoomTax = roomTaxPerNight * nights;
  const totalTaxCombined = totalRoomTax + additionalTaxesTotal;
  const cgstAmount = totalTaxCombined / 2;
  const sgstAmount = totalTaxCombined / 2;

  const grandTotal = Math.round(netTaxableAmount + totalTaxCombined);

  // 4. Advances & Payments Paid
  const fallbackPaid = Number(reservation?.paid || 0);
  const totalPaid = paymentEntries.length > 0
    ? paymentEntries.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    : fallbackPaid;

  // 5. Remaining Balance
  const balanceDue = Math.max(0, grandTotal - totalPaid);

  // Formatter helper
  const fmt = (val) => Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      id="printable-booking-voucher"
      className="bg-white text-slate-800 p-6 sm:p-8 max-w-4xl mx-auto font-sans leading-normal text-xs"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {/* Currency Switcher Bar (Hidden in Print) */}
      <div className="no-print flex items-center justify-between pb-3 mb-2 border-b border-slate-100 text-xs">
        <span className="text-slate-500 font-semibold">Display Currency:</span>
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
          {['₹', '$'].map((cur) => (
            <button
              key={cur}
              onClick={() => setSelectedCurrency(cur)}
              className={`px-3 py-0.5 rounded-lg font-bold text-xs transition ${
                selectedCurrency === cur ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {cur === '₹' ? '₹ INR (Rupee)' : '$ USD'}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Header: Logo, Hotel Name & Voucher Title */}
      <div className="flex items-start justify-between pb-3">
        {/* Left: Hotel Logo & Details */}
        <div className="flex items-start space-x-3.5 max-w-[65%]">
          <div className="shrink-0 pt-0.5">
            <HotelVoucherLogo className="w-14 h-14" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#083d63] tracking-tight leading-tight uppercase">
              {hotelName}
            </h1>
            <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
              {operatingUnit}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {hotelAddress}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Phone: {hotelPhone} | Email: {hotelEmail} | {hotelWebsite}
            </p>
          </div>
        </div>

        {/* Right: Booking Voucher Title & Metadata */}
        <div className="text-right shrink-0">
          <h2 className="text-xl sm:text-2xl font-black text-[#034a7f] tracking-wide uppercase">
            {voucherType}
          </h2>
          <div className="mt-1 space-y-0.5 text-xs text-slate-800">
            <p>
              <span className="text-slate-500">Reservation No.:</span>{' '}
              <strong className="font-mono font-black text-slate-900">{displayVoucherNo}</strong>
            </p>
            <p>
              <span className="text-slate-500">Date:</span>{' '}
              <strong className="font-bold text-slate-900">{displayDate}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Solid Blue Horizontal Divider */}
      <div className="border-b-2 border-[#034a7f] my-2"></div>

      {/* 2. Guest Information & Stay Information Dual Column Card */}
      <div className="border border-slate-300 grid grid-cols-1 sm:grid-cols-2 text-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-300">
        {/* Left Box: Guest Information */}
        <div className="p-3 space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
            GUEST INFORMATION
          </h3>
          <p className="font-black text-sm text-slate-900">{guestName}</p>
          <p className="text-slate-700">
            <span className="text-slate-500">Phone Number:</span>{' '}
            <strong className="font-semibold text-slate-800">{phone}</strong>
          </p>
          <p className="text-slate-700">
            <span className="text-slate-500">Email:</span>{' '}
            <span className="font-semibold text-slate-800 break-all">{email}</span>
          </p>
          <p className="text-slate-700">
            <span className="text-slate-500">Address:</span> {address}
          </p>
          <p className="text-slate-700">
            <span className="text-slate-500">Organisation:</span> {organisation}
          </p>
          <p className="text-slate-700">
            <span className="text-slate-500">GST:</span>{' '}
            <span className="font-mono font-semibold">{gstin}</span>
          </p>
        </div>

        {/* Right Box: Stay Information */}
        <div className="p-3 space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
            STAY INFORMATION
          </h3>
          <p className="text-slate-700">
            <span className="text-slate-500">Booking Status:</span>{' '}
            <strong className="font-black text-slate-900">
              {reservation?.status === 'CHECKED_IN' || reservation?.status === 'OCCUPIED'
                ? 'Arrived'
                : reservation?.status || 'Arrived'}
            </strong>
          </p>
          <p className="text-slate-700">
            <span className="text-slate-500">Booked On:</span>{' '}
            <strong className="font-semibold text-slate-800">
              {formatDateTime(reservation?.created_at || '2026-10-01', '04:31 PM')}
            </strong>
          </p>
          <p className="text-slate-700">
            <span className="text-slate-500">Arrival Date:</span>{' '}
            <strong className="font-semibold text-slate-800">
              {formatDateTime(checkInRaw, '12:00 PM')}
            </strong>
          </p>
          <p className="text-slate-700">
            <span className="text-slate-500">Departure Date:</span>{' '}
            <strong className="font-semibold text-slate-800">
              {formatDateTime(checkOutRaw, '11:00 AM')}
            </strong>
          </p>
          <p className="text-slate-700">
            <span className="text-slate-500">Booking Source:</span>{' '}
            <strong className="font-semibold text-slate-800">
              {reservation?.source || 'Direct'}
            </strong>
          </p>
          <p className="text-slate-700">
            <span className="text-slate-500">Travel Agent:</span>{' '}
            <strong className="font-semibold text-slate-800">
              {reservation?.ota || reservation?.travelAgent || 'Almosafer'}
            </strong>
          </p>
          <div className="pt-1 flex items-center space-x-6">
            <p className="text-sm font-black text-slate-900">
              Rooms: <span className="font-black">1</span>
            </p>
            <p className="text-sm font-black text-slate-900">
              Nights: <span className="font-black">{nights}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Itemized Charges Table (Tariff, Additional Charges, Taxes) */}
      <div className="mt-3 overflow-hidden border border-slate-300">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0c4a6e] text-white uppercase text-[10px] tracking-wider font-bold">
              <th className="py-2 px-2 text-center border-r border-[#083d63] w-8">#</th>
              <th className="py-2 px-3 border-r border-[#083d63]">Room Type & Plan</th>
              <th className="py-2 px-2 text-right border-r border-[#083d63]">Rate</th>
              <th className="py-2 px-2 text-right border-r border-[#083d63]">Extra Charge</th>
              <th className="py-2 px-2 text-right border-r border-[#083d63]">Discount</th>
              <th className="py-2 px-2 text-right border-r border-[#083d63]">Tax</th>
              <th className="py-2 px-2 text-right border-r border-[#083d63]">Total / Night</th>
              <th className="py-2 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {/* Primary Room Accommodation Tariff Row */}
            <tr className="align-top hover:bg-slate-50/50">
              <td className="py-2.5 px-2 text-center font-bold text-slate-700 border-r border-slate-200">
                1
              </td>
              <td className="py-2.5 px-3 border-r border-slate-200">
                <p className="font-black text-slate-900 text-xs">
                  {roomCategory} x 1 Room
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Plan: {reservation?.plan || 'MAP'}
                </p>
                <p className="text-[10px] text-slate-500">
                  Adult: {reservation?.adults || 1} | Child: {reservation?.children || 0}
                </p>
              </td>
              <td className="py-2.5 px-2 text-right font-mono font-medium text-slate-700 border-r border-slate-200">
                {fmt(baseRatePerNight)}
              </td>
              <td className="py-2.5 px-2 text-right font-mono text-slate-600 border-r border-slate-200">
                {fmt(extraChargePerNight)}
              </td>
              <td className="py-2.5 px-2 text-right font-mono text-slate-600 border-r border-slate-200">
                {fmt(roomDiscountPerNight)}
              </td>
              <td className="py-2.5 px-2 text-right font-mono text-slate-600 border-r border-slate-200">
                {fmt(roomTaxPerNight)}
              </td>
              <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-800 border-r border-slate-200">
                {fmt(totalPerNight)}
              </td>
              <td className="py-2.5 px-3 text-right">
                <p className="font-mono font-black text-slate-900 text-xs">
                  {fmt(totalRoomStayAmount)}
                </p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                  ({fmt(totalPerNight)} x 1 Room x {nights} {nights === 1 ? 'Night' : 'Nights'})
                </p>
              </td>
            </tr>

            {/* Additional Charges / Incidentals Rows (F&B, Laundry, etc.) */}
            {additionalItems.map((item, idx) => {
              const itemRate = Number(item.rate || item.amount) || 0;
              const itemTaxRate = Number(item.gst) || 5;
              const itemTax = (itemRate * itemTaxRate) / 100;
              const itemTotal = itemRate + itemTax;

              return (
                <tr key={item.id || idx} className="align-top hover:bg-slate-50/50">
                  <td className="py-2.5 px-2 text-center font-bold text-slate-700 border-r border-slate-200">
                    {idx + 2}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-200">
                    <p className="font-bold text-slate-800 text-xs">{item.description}</p>
                    <p className="text-[10px] text-slate-500">{item.category}</p>
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-700 border-r border-slate-200">
                    {fmt(itemRate)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-600 border-r border-slate-200">
                    0.00
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-600 border-r border-slate-200">
                    0.00
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-600 border-r border-slate-200">
                    {fmt(itemTax)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-800 border-r border-slate-200">
                    {fmt(itemTotal)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {fmt(itemTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Complete Detailed Totals & Settlements Summary Box (Aligned Right) */}
      <div className="flex justify-end mt-3">
        <div className="w-80 border border-slate-300 text-xs divide-y divide-slate-200">
          {/* Base Room Tariff Subtotal */}
          <div className="flex justify-between items-center px-3 py-1.5 text-slate-700">
            <span>Room Tariff ({nights} Nights)</span>
            <span className="font-mono font-semibold">
              {selectedCurrency} {fmt(totalBaseTariffAllNights)}
            </span>
          </div>

          {/* Additional Charges (if any) */}
          {additionalChargesGross > 0 && (
            <div className="flex justify-between items-center px-3 py-1.5 text-slate-700">
              <span>Additional Services (F&B / Laundry)</span>
              <span className="font-mono font-semibold">
                {selectedCurrency} {fmt(additionalChargesGross)}
              </span>
            </div>
          )}

          {/* Manager / Promotional Discount */}
          {totalDiscountAmount > 0 && (
            <div className="flex justify-between items-center px-3 py-1.5 text-amber-700">
              <span>Discount ({discountPercent}%)</span>
              <span className="font-mono font-semibold">
                -{selectedCurrency} {fmt(totalDiscountAmount)}
              </span>
            </div>
          )}

          {/* Taxes & Levies (CGST + SGST) */}
          <div className="flex justify-between items-center px-3 py-1.5 text-slate-700">
            <span>Taxes & Levies (GST / CGST+SGST)</span>
            <span className="font-mono font-semibold">
              +{selectedCurrency} {fmt(totalTaxCombined)}
            </span>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center px-3 py-2 bg-slate-50 font-bold text-slate-900">
            <span>Grand Total</span>
            <span className="font-mono font-black text-sm text-slate-900">
              {selectedCurrency} {fmt(grandTotal)}
            </span>
          </div>

          {/* Total Advances / Payments Received */}
          <div className="flex justify-between items-center px-3 py-1.5 text-emerald-800 font-medium">
            <span>Total Advances / Paid</span>
            <span className="font-mono font-bold">
              {selectedCurrency} {fmt(totalPaid)}
            </span>
          </div>

          {/* Est. Balance / Remaining Due Highlighted in Deep Blue */}
          <div className="flex justify-between items-center px-3 py-2 bg-[#034a7f] text-white">
            <span className="font-black uppercase tracking-wider text-[11px]">Est. Balance</span>
            <span className="font-mono font-black text-sm">
              {selectedCurrency} {fmt(balanceDue)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Payment & Advances Receipts Record (Ledger) */}
      <div className="mt-4 pt-2 border-t border-slate-200">
        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
          PAYMENTS & ADVANCES RECORD
        </h4>
        <div className="border border-slate-200 rounded-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                <th className="py-1.5 px-2.5">Date</th>
                <th className="py-1.5 px-2.5">Payment Mode</th>
                <th className="py-1.5 px-2.5">Reference / Auth No.</th>
                <th className="py-1.5 px-2.5">Notes</th>
                <th className="py-1.5 px-2.5 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paymentEntries.length > 0 ? (
                paymentEntries.map((pay) => (
                  <tr key={pay.id}>
                    <td className="py-1.5 px-2.5 font-mono">{pay.date}</td>
                    <td className="py-1.5 px-2.5 font-bold">{pay.mode}</td>
                    <td className="py-1.5 px-2.5 font-mono text-slate-500">{pay.ref}</td>
                    <td className="py-1.5 px-2.5">{pay.note || 'Advance Deposit'}</td>
                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-700">
                      {selectedCurrency} {fmt(pay.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-1.5 px-2.5 font-mono">{displayDate}</td>
                  <td className="py-1.5 px-2.5 font-bold">Advance Payment / UPI</td>
                  <td className="py-1.5 px-2.5 font-mono text-slate-500">AST-REC-982</td>
                  <td className="py-1.5 px-2.5">Check-in Advance Deposit</td>
                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-700">
                    {selectedCurrency} {fmt(totalPaid)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Terms & Conditions Section */}
      <div className="mt-4 pt-2">
        <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
          TERMS & CODITIONS.
        </h4>
        <p className="text-[11px] font-mono text-slate-600 mt-1">
          145646545362
        </p>
      </div>

      {/* Bottom Horizontal Divider */}
      <div className="border-b border-[#034a7f] my-3"></div>

      {/* 7. Footer Note */}
      <div className="text-center text-[11px] text-slate-600 font-medium pb-2">
        Thank you for choosing <strong className="text-slate-800">{hotelName}</strong> for your stay. This is a system generated booking voucher.
      </div>
    </div>
  );
}
