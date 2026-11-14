import React, { useState } from 'react';
import { Printer, X } from 'lucide-react';
import aavasaLogo from '../../assets/aavasa-logo.jpg';

/**
 * Architectural Neoclassical Hotel Emblem Logo matching Image 2 & 3
 */
export function HotelVoucherLogo({ className = "w-16 h-16", logoUrl, hotelName }) {
  return (
    <img
      src={logoUrl || aavasaLogo || "./aavasa-logo.jpg"}
      alt={hotelName || "Property Logo"}
      className={`${className} object-contain rounded-md`}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = aavasaLogo || './aavasa-logo.jpg';
      }}
    />
  );
}

/**
 * Complete, Un-clipped Booking Invoice & Tax Invoice
 * with detailed tariff, discounts, additional charges, taxes, paid, balance due,
 * and exact captured Check-In / Check-Out timestamps.
 */
export default function BookingVoucher({
  room,
  reservation,
  folioItems = [],
  paymentEntries = [],
  discountPercent = 0,
  currentHotel = {},
  voucherType = 'BOOKING INVOICE',
  voucherNo,
  voucherDate,
  onClose
}) {
  // Currency state (defaults to Indian Rupee ₹)
  const [selectedCurrency, setSelectedCurrency] = useState(
    currentHotel?.currencySymbol || '₹'
  );

  const displayDocType = String(voucherType || 'BOOKING INVOICE').replace(/BOOKING VOUCHER/i, 'BOOKING INVOICE');

  const roomNum = String(room?.room_number || room?.roomNumber || room?.number || reservation?.room_number || String(reservation?.room || '').replace(/\D/g, '') || '101');
  const roomCategory = String(room?.category || room?.type || reservation?.room_type || 'DELUXE ROOM').toUpperCase();
  const guestName = reservation?.guest || reservation?.name || room?.guest || 'Valued Guest';
  const phone = reservation?.phone || reservation?.guestPhone || reservation?.guest_phone || '';
  const email = reservation?.email || reservation?.guestEmail || reservation?.guest_email || '';
  const address = reservation?.address || reservation?.idCity || currentHotel?.city || 'Bengaluru';
  const organisation = reservation?.organisation || reservation?.company || 'Direct Guest';
  const gstin = reservation?.gstin || reservation?.gst || 'Unregistered / Direct';

  // Dates & Captured Check-In / Check-Out Timestamps
  const checkInRaw = reservation?.check_in || reservation?.checkIn || new Date().toISOString().split('T')[0];
  const checkOutRaw = reservation?.check_out || reservation?.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const actualCheckInRaw = reservation?.actualCheckInTime || reservation?.actual_check_in_time || '';
  const actualCheckOutRaw = reservation?.actualCheckOutTime || reservation?.actual_check_out_time || '';

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
      const rawStr = dateInput ? String(dateInput).trim() : '';
      const hasExplicitTime = rawStr.includes('T') || /\d{2}:\d{2}/.test(rawStr);
      const normalized = rawStr.includes(' ') && !rawStr.includes('T') ? rawStr.replace(' ', 'T') : rawStr;
      const d = normalized ? new Date(normalized) : new Date();
      if (isNaN(d.getTime())) return `${formatDateDDMMMYYYY(new Date())} ${defaultTime}`;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      if (hasExplicitTime) {
        const timeFormatted = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
        return `${month} ${day}, ${year} • ${timeFormatted}`;
      }
      return `${month} ${day}, ${year} (${defaultTime})`;
    } catch {
      return `${formatDateDDMMMYYYY(new Date())} ${defaultTime}`;
    }
  };

  const formatCapturedTimestamp = (ts) => {
    if (!ts) return '';
    try {
      const normalized = String(ts).trim().includes(' ') && !String(ts).includes('T')
        ? String(ts).trim().replace(' ', 'T')
        : String(ts).trim();
      const d = new Date(normalized);
      if (isNaN(d.getTime())) return String(ts);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
      return `${day}-${month}-${year}, ${timeStr}`;
    } catch {
      return String(ts);
    }
  };

  const upperStatus = String(reservation?.status || 'CONFIRMED').toUpperCase();
  const displayBookingStatus =
    upperStatus === 'CHECKED_IN' || upperStatus === 'CHECKEDIN' || upperStatus === 'OCCUPIED'
      ? 'Checked-In (Occupied)'
      : upperStatus === 'CHECKED_OUT' || upperStatus === 'CHECKEDOUT'
        ? 'Checked-Out (Completed)'
        : upperStatus === 'CANCELLED'
          ? 'Cancelled'
          : 'Reserved (Confirmed — Awaiting Check-In)';

  const actualCheckInDisplay = actualCheckInRaw ? formatCapturedTimestamp(actualCheckInRaw) : 'Pending Check-In';
  const actualCheckOutDisplay = actualCheckOutRaw
    ? formatCapturedTimestamp(actualCheckOutRaw)
    : (upperStatus === 'CHECKED_IN' || upperStatus === 'OCCUPIED' ? 'In-House (Active Stay)' : 'Scheduled (Not Checked Out)');

  const displayDate = voucherDate || formatDateDDMMMYYYY(new Date());
  const displayVoucherNo = voucherNo || reservation?.id || `INV-${roomNum}`;

  // Hotel Info
  const hotelName = currentHotel?.name || 'Hotel Admin';
  const operatingUnit = currentHotel?.operatingUnit || (currentHotel?.ownerName ? `Managed by ${currentHotel.ownerName}` : 'Hospitality Operations');
  const hotelAddress = currentHotel?.address || (currentHotel?.city ? `${currentHotel.city}, India` : 'India');
  const hotelPhone = currentHotel?.mobile || currentHotel?.phone || 'N/A';
  const hotelEmail = currentHotel?.email || 'N/A';
  const hotelWebsite = currentHotel?.website || '';

  // --- DETAILED FINANCIAL CALCULATIONS ---
  // 1. Room Tariff
  const derivedReservationRate = Number(reservation?.amount) > 0
    ? Math.round((Number(reservation.amount) / Math.max(1, nights)) * 100) / 100
    : 0;
  const baseRatePerNight = Number(room?.tariff || room?.price || reservation?.price || derivedReservationRate || 2500);
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

  // Print helper variables (ensure all referenced totals exist in print template)
  const tariffRate = baseRatePerNight;
  const subtotalCharges = combinedSubtotal;
  const discountAmount = totalDiscountAmount;
  const cgst = cgstAmount;
  const sgst = sgstAmount;

  // 4. Advances & Payments Paid
  const fallbackPaid = Number(reservation?.paid || 0);
  const totalPaid = paymentEntries.length > 0
    ? paymentEntries.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    : fallbackPaid;

  // 5. Remaining Balance
  const balanceDue = Math.max(0, grandTotal - totalPaid);

  // Formatter helper
  const fmt = (val) => Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handlePrintVoucher = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      window.print();
      return;
    }
    const basePath = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/';
    const rawLogo = currentHotel?.logoUrl;
    const logoUrl = rawLogo && (rawLogo.startsWith('data:') || rawLogo.startsWith('http://') || rawLogo.startsWith('https://'))
      ? rawLogo
      : new URL(rawLogo || aavasaLogo || 'aavasa-logo.jpg', basePath).href;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${displayDocType} - ${displayVoucherNo}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; color: #1e293b; line-height: 1.45; font-size: 12px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #034a7f; padding-bottom: 12px; margin-bottom: 16px; }
          .logo { max-height: 60px; object-fit: contain; }
          .hotel-details h1 { margin: 0; font-size: 20px; color: #083d63; text-transform: uppercase; letter-spacing: 0.5px; }
          .hotel-details p { margin: 2px 0; color: #475569; font-size: 11px; }
          .voucher-title { text-align: right; }
          .voucher-title h2 { margin: 0; font-size: 20px; color: #034a7f; text-transform: uppercase; }
          .meta-badge { font-family: monospace; font-weight: bold; background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-top: 4px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px; }
          .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; }
          .box-title { font-weight: 800; text-transform: uppercase; font-size: 11px; color: #034a7f; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .row .label { color: #64748b; font-weight: 500; }
          .row .val { color: #0f172a; font-weight: 600; text-align: right; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 14px; font-size: 11.5px; }
          th { background: #034a7f; color: #ffffff; text-align: left; padding: 6px 10px; font-weight: 700; font-size: 11px; text-transform: uppercase; }
          td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
          .totals-table { margin-left: auto; width: 340px; margin-top: 10px; }
          .totals-table td { padding: 4px 8px; }
          .total-row { font-size: 13px; font-weight: 800; color: #083d63; border-top: 2px solid #034a7f; }
          .terms { border-top: 1px solid #cbd5e1; padding-top: 10px; margin-top: 14px; font-size: 10.5px; color: #475569; }
          .terms h4 { margin: 0 0 4px 0; font-size: 11px; color: #0f172a; text-transform: uppercase; }
          .terms ul { margin: 0; padding-left: 18px; line-height: 1.5; }
          .footer-note { text-align: center; font-size: 10.5px; color: #64748b; margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="${logoUrl}" alt="Aavasa" class="logo" onerror="this.style.display='none'" />
            <div class="hotel-details">
              <h1>${hotelName}</h1>
              <p><strong>${operatingUnit}</strong></p>
              <p>${hotelAddress}</p>
              <p>Phone: ${hotelPhone} | Email: ${hotelEmail}</p>
            </div>
          </div>
          <div class="voucher-title">
            <h2>${displayDocType}</h2>
            <div class="meta-badge">${displayVoucherNo}</div>
            <p style="margin:4px 0 0; color:#64748b; font-size:11px;">Invoice Date: ${displayDate}</p>
            <p style="margin:2px 0 0; color:#034a7f; font-size:10.5px; font-weight:700;">Status: ${displayBookingStatus}</p>
          </div>
        </div>

        <div class="grid-2">
          <div class="box">
            <div class="box-title">Guest Information</div>
            <div class="row"><span class="label">Primary Guest:</span><span class="val">${guestName}</span></div>
            <div class="row"><span class="label">Mobile Number:</span><span class="val">${phone || 'N/A'}</span></div>
            <div class="row"><span class="label">Email Address:</span><span class="val">${email || 'N/A'}</span></div>
            <div class="row"><span class="label">City / Address:</span><span class="val">${address}</span></div>
            <div class="row"><span class="label">GSTIN / Company:</span><span class="val">${gstin}</span></div>
          </div>

          <div class="box">
            <div class="box-title">Stay, Check-In & Check-Out Timings</div>
            <div class="row"><span class="label">Room Allocated:</span><span class="val">Room #${roomNum} (${roomCategory})</span></div>
            <div class="row"><span class="label">Scheduled Check-In:</span><span class="val">${formatDateDDMMMYYYY(checkInRaw)} (12:00 PM)</span></div>
            <div class="row"><span class="label">Actual Check-In Time:</span><span class="val" style="color:${actualCheckInRaw ? '#047857' : '#d97706'};">${actualCheckInDisplay}</span></div>
            <div class="row"><span class="label">Scheduled Check-Out:</span><span class="val">${formatDateDDMMMYYYY(checkOutRaw)} (11:00 AM)</span></div>
            <div class="row"><span class="label">Actual Check-Out Time:</span><span class="val" style="color:${actualCheckOutRaw ? '#034a7f' : '#64748b'};">${actualCheckOutDisplay}</span></div>
            <div class="row"><span class="label">Duration & Plan:</span><span class="val">${nights} Night(s) • ${reservation?.ratePlan || reservation?.rate_plan || 'EP - Room Only'}</span></div>
          </div>
        </div>

        <div style="font-weight: 800; text-transform: uppercase; font-size: 11px; color: #034a7f; margin-bottom: 4px;">Accommodation & Room Charges</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:center;">Qty / Nights</th>
              <th style="text-align:right;">Tariff Rate</th>
              <th style="text-align:right;">Amount (${selectedCurrency})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Room #${roomNum} — ${roomCategory}</strong><br/><small style="color:#64748b;">Accommodation for ${nights} night(s) from ${formatDateDDMMMYYYY(checkInRaw)} to ${formatDateDDMMMYYYY(checkOutRaw)}</small></td>
              <td style="text-align:center;">${nights}</td>
              <td style="text-align:right;">${selectedCurrency} ${fmt(tariffRate)}</td>
              <td style="text-align:right; font-weight:700;">${selectedCurrency} ${fmt(totalBaseTariffAllNights)}</td>
            </tr>
            ${additionalItems.map((item) => {
              const iRate = Number(item.rate || item.amount) || 0;
              return `
                <tr>
                  <td><strong>${item.description || 'Additional Charge'}</strong><br/><small style="color:#64748b;">${item.category || 'Incidentals'}</small></td>
                  <td style="text-align:center;">1</td>
                  <td style="text-align:right;">${selectedCurrency} ${fmt(iRate)}</td>
                  <td style="text-align:right; font-weight:700;">${selectedCurrency} ${fmt(iRate)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td style="color:#64748b;">Subtotal Tariff & Charges:</td>
            <td style="text-align:right; font-weight:600;">${selectedCurrency} ${fmt(subtotalCharges)}</td>
          </tr>
          ${discountAmount > 0 ? `
          <tr>
            <td style="color:#d97706;">Discount (${discountPercent}%):</td>
            <td style="text-align:right; font-weight:600; color:#d97706;">-${selectedCurrency} ${fmt(discountAmount)}</td>
          </tr>` : ''}
          <tr>
            <td style="color:#64748b;">CGST (Tax Split):</td>
            <td style="text-align:right;">${selectedCurrency} ${fmt(cgst)}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">SGST (Tax Split):</td>
            <td style="text-align:right;">${selectedCurrency} ${fmt(sgst)}</td>
          </tr>
          <tr class="total-row">
            <td>Grand Total (Incl. Taxes):</td>
            <td style="text-align:right;">${selectedCurrency} ${fmt(grandTotal)}</td>
          </tr>
          <tr>
            <td style="color:#059669; font-weight:700;">Total Paid / Advance:</td>
            <td style="text-align:right; font-weight:700; color:#059669;">${selectedCurrency} ${fmt(totalPaid)}</td>
          </tr>
          <tr style="font-weight:800; font-size:12.5px; border-top:1px dashed #cbd5e1; color:${balanceDue > 0 ? '#dc2626' : '#059669'};">
            <td>Balance Due:</td>
            <td style="text-align:right;">${selectedCurrency} ${fmt(balanceDue)}</td>
          </tr>
        </table>

        <div class="terms">
          <h4>Terms & Conditions & Property Policies</h4>
          <ul>
            <li><strong>Check-in Time:</strong> 12:00 PM | <strong>Check-out Time:</strong> 11:00 AM.</li>
            <li>Government-issued photo identification (Aadhaar Card / Passport / Driving License) is mandatory for all adult guests at check-in.</li>
            <li>Tariff is inclusive of applicable GST taxes. Any incidentals or extended stay charges are payable prior to departure.</li>
            <li>Early check-in and late check-out are subject to availability and property management approval.</li>
          </ul>
        </div>

        <div class="footer-note">
          Thank you for choosing <strong>${hotelName}</strong>. Managed by <strong>Aavasa — Hospitality Simplified</strong>.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const voucherContent = (
    <div
      id="printable-booking-voucher"
      className="bg-white text-slate-800 p-6 sm:p-8 max-w-4xl mx-auto font-sans leading-normal text-xs"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {/* Action Toolbar: Print & Currency Switcher Bar (Hidden in Print) */}
      <div className="no-print flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrintVoucher}
            className="px-3.5 py-1.5 bg-[#034a7f] hover:bg-[#023861] text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print {displayDocType.toLowerCase().includes('tax') ? 'Tax Invoice' : 'Booking Invoice'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-semibold">Currency:</span>
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg">
            {['₹', '$'].map((cur) => (
              <button
                key={cur}
                onClick={() => setSelectedCurrency(cur)}
                className={`px-2.5 py-0.5 rounded font-bold text-xs transition ${
                  selectedCurrency === cur ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {cur === '₹' ? '₹ INR' : '$ USD'}
              </button>
            ))}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 1. Header: Logo, Hotel Name & Voucher Title */}
      <div className="flex items-start justify-between pb-3">
        {/* Left: Hotel Logo & Details */}
        <div className="flex items-start space-x-3.5 max-w-[65%]">
          <div className="shrink-0 pt-0.5">
            <HotelVoucherLogo className="w-14 h-14" logoUrl={currentHotel?.logoUrl} hotelName={hotelName} />
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

        {/* Right: Booking Invoice Title & Metadata */}
        <div className="text-right shrink-0">
          <h2 className="text-xl sm:text-2xl font-black text-[#034a7f] tracking-wide uppercase">
            {displayDocType}
          </h2>
          <div className="mt-1 space-y-0.5 text-xs text-slate-800">
            <p>
              <span className="text-slate-500">Invoice / Reservation No.:</span>{' '}
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
            STAY & CHECK-IN / CHECK-OUT INFORMATION
          </h3>
          <p className="text-slate-700">
            <span className="text-slate-500">Booking Status:</span>{' '}
            <strong className="font-black text-slate-900">
              {displayBookingStatus}
            </strong>
          </p>
          <p className="text-slate-700">
            <span className="text-slate-500">Booked On:</span>{' '}
            <strong className="font-semibold text-slate-800">
              {(reservation?.created_at || reservation?.createdAt)
                ? formatCapturedTimestamp(reservation?.created_at || reservation?.createdAt)
                : formatDateDDMMMYYYY(checkInRaw)}
            </strong>
          </p>
          <p className="text-slate-700">
            <span className="text-slate-500">Scheduled Arrival:</span>{' '}
            <strong className="font-semibold text-slate-800">
              {formatDateTime(checkInRaw, '12:00 PM')}
            </strong>
          </p>
          <p className="text-slate-700">
            <span className="text-slate-500">Actual Check-In Time:</span>{' '}
            <strong className={`font-bold ${actualCheckInRaw ? 'text-emerald-700' : 'text-amber-600'}`}>
              {actualCheckInDisplay}
            </strong>
          </p>
          <p className="text-slate-700">
            <span className="text-slate-500">Scheduled Departure:</span>{' '}
            <strong className="font-semibold text-slate-800">
              {formatDateTime(checkOutRaw, '11:00 AM')}
            </strong>
          </p>
          <p className="text-slate-700">
            <span className="text-slate-500">Actual Check-Out Time:</span>{' '}
            <strong className={`font-bold ${actualCheckOutRaw ? 'text-[#034a7f]' : 'text-slate-600'}`}>
              {actualCheckOutDisplay}
            </strong>
          </p>
          <p className="text-slate-700">
            <span className="text-slate-500">Booking Source:</span>{' '}
            <strong className="font-semibold text-slate-800">
              {reservation?.source || 'Direct'}
            </strong>
          </p>
          <div className="pt-1 flex items-center space-x-6">
            <p className="text-sm font-black text-slate-900">
              Rooms: <span className="font-black">1 (#{roomNum})</span>
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
                  Plan: {reservation?.ratePlan || reservation?.rate_plan || reservation?.plan || 'EP - Room Only'}
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
                  <td className="py-1.5 px-2.5 font-mono text-slate-500">ADV-{displayVoucherNo}</td>
                  <td className="py-1.5 px-2.5">Advance Deposit Received</td>
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
          TERMS & CONDITIONS & PROPERTY POLICIES
        </h4>
        <ul className="text-[11px] text-slate-600 mt-1 list-disc pl-4 space-y-0.5">
          <li>Standard Check-in: 12:00 PM | Standard Check-out: 11:00 AM.</li>
          <li>Government photo identification (Aadhaar / Passport / DL) is mandatory for all adult guests at check-in.</li>
          <li>Tariff is inclusive of applicable taxes. Incidentals or room service are payable upon departure.</li>
        </ul>
      </div>

      {/* Bottom Horizontal Divider */}
      <div className="border-b border-[#034a7f] my-3"></div>

      {/* 7. Footer Note */}
      <div className="text-center text-[11px] text-slate-600 font-medium pb-2">
        Thank you for choosing <strong className="text-slate-800">{hotelName}</strong>. Powered by <strong className="text-slate-800">Aavasa — Hospitality Simplified</strong>.
      </div>
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
          {voucherContent}
        </div>
      </div>
    );
  }

  return voucherContent;
}
