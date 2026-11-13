import React, { useState, useEffect } from 'react';
import aavasaLogo from '../../assets/aavasa-logo.jpg';
import {
  X,
  Printer,
  Plus,
  CreditCard,
  DollarSign,
  Receipt,
  BedDouble,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Download,
  Share2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import BookingVoucher from '../common/BookingVoucher';

export default function FolioBillingModal({ isOpen, onClose, room, reservation }) {
  const { 
    showNotification, 
    checkoutRoom, 
    updateReservation, 
    updateReservationPayment, 
    currentHotel 
  } = useDashboard();

  const [activeTab, setActiveTab] = useState('charges'); // charges | payments | invoice
  const [voucherType, setVoucherType] = useState('BOOKING VOUCHER');
  const [discountPercent, setDiscountPercent] = useState(0);

  // New charge item state
  const [newCategory, setNewCategory] = useState('F&B');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [isPostingCharge, setIsPostingCharge] = useState(false);

  // New payment state
  const [payMode, setPayMode] = useState('UPI');
  const [payAmount, setPayAmount] = useState('');
  const [payRef, setPayRef] = useState('');

  // Standard charges & payments
  const [folioItems, setFolioItems] = useState([]);
  const [paymentEntries, setPaymentEntries] = useState([]);

  // Sync / initialize folio items & payments whenever modal opens with room/reservation
  useEffect(() => {
    if (isOpen && room) {
      const roomNum = String(room.room_number || room.roomNumber || room.number || '101');
      const checkIn = reservation?.check_in || reservation?.checkIn || '2026-11-04';
      const roomPrice = Number(room.price || room.tariff || reservation?.price || 2500);

      const paidAmt = Number(reservation?.paid || reservation?.advance_paid || 0);
      const initialPayments = paidAmt > 0 ? [
        { id: 'pay-1', date: checkIn, mode: reservation?.payment_method || 'UPI', ref: reservation?.transaction_id || 'ADV-PAY', amount: paidAmt, note: 'Advance / Booking Payment' }
      ] : [];

      setFolioItems([
        { id: 'chg-1', date: checkIn, category: 'Room Tariff', description: `Room #${roomNum} - Accommodation Tariff`, rate: roomPrice, qty: 1, amount: roomPrice, gst: 12 }
      ]);

      setPaymentEntries(initialPayments);

      setActiveTab('charges');
      setDiscountPercent(0);
      setNewDescription('');
      setNewAmount('');
      setIsPostingCharge(false);
      setPayAmount('');
      setPayRef('');
    }
  }, [isOpen, room, reservation]);

  if (!isOpen || !room) return null;

  const roomNum = String(room.room_number || room.roomNumber || room.number);
  const guestName = reservation?.guest || reservation?.name || room?.guest || 'In-House Guest';
  const phone = reservation?.phone || '+91 98450 12345';
  const checkIn = reservation?.check_in || reservation?.checkIn || '2026-11-04';
  const checkOut = reservation?.check_out || reservation?.checkOut || '2026-11-06';
  const roomPrice = Number(room.price || room.tariff || reservation?.price || 2500);

  // Calculations
  const subtotalCharges = folioItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const discountAmount = Math.round((subtotalCharges * discountPercent) / 100);
  const netCharges = subtotalCharges - discountAmount;
  
  // Tax calculation (CGST + SGST approx 12% blended)
  const cgstAmount = Math.round(netCharges * 0.06);
  const sgstAmount = Math.round(netCharges * 0.06);
  const grandTotal = netCharges + cgstAmount + sgstAmount;

  const totalPaid = paymentEntries.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balanceDue = Math.max(0, grandTotal - totalPaid);

  const handleAddCharge = (e) => {
    e.preventDefault();
    if (!newDescription.trim() || !newAmount || Number(newAmount) <= 0) {
      showNotification('Please enter a valid description and amount.', 'error');
      return;
    }

    const newItem = {
      id: `chg-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      category: newCategory,
      description: newDescription.trim(),
      rate: Number(newAmount),
      qty: 1,
      amount: Number(newAmount),
      gst: newCategory === 'F&B' ? 5 : 12
    };

    setFolioItems(prev => [...prev, newItem]);
    setNewDescription('');
    setNewAmount('');
    setIsPostingCharge(false);
    showNotification(`Added ${newCategory} charge of ₹${newAmount} to Folio.`);
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    const amt = Number(payAmount) || balanceDue;
    if (amt <= 0) {
      showNotification('Please enter a payment amount.', 'error');
      return;
    }

    const newPayment = {
      id: `pay-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      mode: payMode,
      ref: payRef || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      amount: amt,
      note: 'Folio Settlement'
    };

    setPaymentEntries(prev => [...prev, newPayment]);
    setPayAmount('');
    setPayRef('');

    const resId = reservation?.id || room?.booking_id || room?.activeReservation?.id;
    if (resId && updateReservationPayment) {
      const updatedPaid = totalPaid + amt;
      const updatedDue = Math.max(0, grandTotal - updatedPaid);
      updateReservationPayment(resId, {
        paid: updatedPaid,
        due: updatedDue,
        paymentStatus: updatedDue <= 0 ? 'PAID' : 'PARTIAL'
      });
    }

    showNotification(`Payment of ₹${amt.toLocaleString('en-IN')} recorded successfully.`);
  };

  const handleCheckoutAndClose = async () => {
    if (balanceDue > 0) {
      if (!window.confirm(`There is an outstanding balance of ₹${balanceDue.toLocaleString('en-IN')}. Are you sure you want to proceed with Checkout?`)) {
        return;
      }
    }

    const resId = reservation?.id || room.booking_id;
    await checkoutRoom(roomNum, resId);
    onClose();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      window.print();
      return;
    }
    const basePath = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/';
    const logoUrl = new URL(aavasaLogo || 'aavasa-logo.jpg', basePath).href;

    const hotelName = currentHotel?.name || 'Shivanandi';
    const operatingUnit = 'Aavasa — Hospitality Simplified';
    const hotelAddress = currentHotel?.city ? `${currentHotel.city}, Karnataka, India` : 'Bengaluru, Karnataka, India';
    const docTitle = voucherType === 'BOOKING VOUCHER' ? 'Booking Voucher' : 'Tax Invoice';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${docTitle} - Room ${roomNum} - ${guestName}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; color: #1e293b; line-height: 1.45; font-size: 12px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #034a7f; padding-bottom: 12px; margin-bottom: 16px; }
          .logo { max-height: 60px; object-fit: contain; }
          .hotel-details h1 { margin: 0; font-size: 20px; color: #083d63; text-transform: uppercase; }
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
              <p>Phone: +91 79785 78046 | frontdesk@aavasa.com</p>
            </div>
          </div>
          <div class="voucher-title">
            <h2>${docTitle}</h2>
            <div class="meta-badge">FOL-2026-${roomNum}</div>
            <p style="margin:4px 0 0; color:#64748b; font-size:11px;">Date: ${new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        <div class="grid-2">
          <div class="box">
            <div class="box-title">Guest Details</div>
            <div class="row"><span class="label">Guest Name:</span><span class="val">${guestName}</span></div>
            <div class="row"><span class="label">Mobile Number:</span><span class="val">${phone}</span></div>
            <div class="row"><span class="label">Allocated Room:</span><span class="val">Room #${roomNum} (${room?.type || room?.category || 'Standard Room'})</span></div>
          </div>

          <div class="box">
            <div class="box-title">Stay Duration</div>
            <div class="row"><span class="label">Check-In:</span><span class="val">${checkIn}</span></div>
            <div class="row"><span class="label">Check-Out:</span><span class="val">${checkOut}</span></div>
            <div class="row"><span class="label">Rate Plan:</span><span class="val">${reservation?.rate_plan || 'EP - Room Only'}</span></div>
          </div>
        </div>

        <div style="font-weight: 800; text-transform: uppercase; font-size: 11px; color: #034a7f; margin-bottom: 4px;">Itemized Charges</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th style="text-align:right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${folioItems.map(item => `
              <tr>
                <td>${item.date}</td>
                <td><span style="font-weight:600; color:#475569;">${item.category}</span></td>
                <td>${item.description}</td>
                <td style="text-align:right; font-weight:600;">₹ ${Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td style="color:#64748b;">Subtotal Charges:</td>
            <td style="text-align:right; font-weight:600;">₹ ${subtotalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          ${discountAmount > 0 ? `
          <tr>
            <td style="color:#d97706;">Discount (${discountPercent}%):</td>
            <td style="text-align:right; font-weight:600; color:#d97706;">-₹ ${discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>` : ''}
          <tr>
            <td style="color:#64748b;">CGST (6%):</td>
            <td style="text-align:right;">₹ ${cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">SGST (6%):</td>
            <td style="text-align:right;">₹ ${sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr class="total-row">
            <td>Grand Total:</td>
            <td style="text-align:right;">₹ ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style="color:#059669; font-weight:700;">Payments Recorded:</td>
            <td style="text-align:right; font-weight:700; color:#059669;">₹ ${totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr style="font-weight:800; font-size:12.5px; border-top:1px dashed #cbd5e1; color:${balanceDue > 0 ? '#dc2626' : '#059669'};">
            <td>Balance Due:</td>
            <td style="text-align:right;">₹ ${balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
        </table>

        ${paymentEntries.length > 0 ? `
          <div style="font-weight: 800; text-transform: uppercase; font-size: 11px; color: #034a7f; margin-top: 14px; margin-bottom: 4px;">Payment Transactions</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Mode</th>
                <th>Reference</th>
                <th style="text-align:right;">Paid (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${paymentEntries.map(p => `
                <tr>
                  <td>${p.date}</td>
                  <td><strong>${p.mode}</strong></td>
                  <td><span style="font-family:monospace; color:#64748b;">${p.ref || 'PAID'}</span></td>
                  <td style="text-align:right; font-weight:700; color:#059669;">₹ ${Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="terms">
          <h4>Property Terms & Policies</h4>
          <ul>
            <li>Check-in: 12:00 PM | Check-out: 11:00 AM.</li>
            <li>Government-issued photo identification is mandatory for all adult guests during registration.</li>
            <li>All incidental expenses must be settled upon checkout.</li>
          </ul>
        </div>

        <div class="footer-note">
          Thank you for staying at <strong>${hotelName}</strong>. Managed by <strong>Aavasa — Hospitality Simplified</strong>.
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="no-print bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black tracking-wide">Guest Folio & Booking Voucher</h3>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-400/30">
                  FOL-2026-{roomNum}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">Room #{roomNum} • {guestName} • {phone}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all flex items-center space-x-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="no-print bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center justify-between shrink-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('charges')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'charges'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Itemized Charges ({folioItems.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'payments'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Payments & Advances ({paymentEntries.length})
            </button>
            <button
              onClick={() => setActiveTab('invoice')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'invoice'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Booking Voucher / Invoice
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-500 font-semibold">Balance Due:</span>
            <span className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-lg ${
              balanceDue > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              ₹{balanceDue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'charges' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Folio Charge Breakdown</h4>
                <button
                  onClick={() => setIsPostingCharge(!isPostingCharge)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 text-xs font-bold flex items-center space-x-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isPostingCharge ? 'Cancel Add' : 'Post Extra Charge'}</span>
                </button>
              </div>

              {isPostingCharge && (
                <form onSubmit={handleAddCharge} className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-in fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                    >
                      <option value="F&B">F&B / Food Service</option>
                      <option value="Laundry">Laundry / Dry Clean</option>
                      <option value="Mini-Bar">Mini-Bar / Snacks</option>
                      <option value="Extra Bed">Extra Bed / Mattress</option>
                      <option value="Transport">Airport Taxi / Travel</option>
                      <option value="Damage">Damage / Repair</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. In-Room Breakfast, Laundry 3 pcs"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Amount (₹)</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Amount"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold font-mono bg-white"
                        required
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Charges Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Rate</th>
                      <th className="px-4 py-3 text-right">GST %</th>
                      <th className="px-4 py-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {folioItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-600">{item.date}</td>
                        <td className="px-4 py-3">
                          <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{item.description}</td>
                        <td className="px-4 py-3 text-right font-mono">₹{item.rate.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500">{item.gst}%</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Payments Ledger</h4>
              
              {/* Add Payment Form */}
              <form onSubmit={handleRecordPayment} className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                  >
                    <option value="UPI">UPI / QR</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Ref / Txn No.</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI-998822"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Amount (₹)</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder={`Max ₹${balanceDue}`}
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold font-mono bg-white"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs shrink-0"
                    >
                      Record Payment
                    </button>
                  </div>
                </div>
              </form>

              {/* Payments Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3">Transaction Ref</th>
                      <th className="px-4 py-3">Remarks</th>
                      <th className="px-4 py-3 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {paymentEntries.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-600">{pay.date}</td>
                        <td className="px-4 py-3">
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {pay.mode}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">{pay.ref}</td>
                        <td className="px-4 py-3 text-slate-600">{pay.note}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-800">
                          ₹{pay.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BOOKING VOUCHER / TAX INVOICE TAB */}
          {activeTab === 'invoice' ? (
            <div className="space-y-4">
              {/* Document Type Switcher & Action Toolbar (Hidden in Print) */}
              <div className="no-print bg-slate-50 border border-slate-200/90 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-bold text-slate-600">Document Format:</span>
                  <div className="bg-slate-200/80 p-0.5 rounded-xl flex space-x-1">
                    <button
                      onClick={() => setVoucherType('BOOKING VOUCHER')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        voucherType === 'BOOKING VOUCHER'
                          ? 'bg-[#034a7f] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Booking Voucher
                    </button>
                    <button
                      onClick={() => setVoucherType('TAX INVOICE')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        voucherType === 'TAX INVOICE'
                          ? 'bg-[#034a7f] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tax Invoice
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 rounded-xl bg-[#034a7f] hover:bg-[#023358] text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all hover:scale-[1.01]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print {voucherType === 'BOOKING VOUCHER' ? 'Booking Voucher' : 'Tax Invoice'}</span>
                  </button>
                </div>
              </div>

              {/* Booking Voucher & Invoice Preview */}
              <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm bg-white">
                <BookingVoucher
                  room={room}
                  reservation={reservation}
                  folioItems={folioItems}
                  paymentEntries={paymentEntries}
                  subtotalCharges={subtotalCharges}
                  discountAmount={discountAmount}
                  discountPercent={discountPercent}
                  grandTotal={grandTotal}
                  totalPaid={totalPaid}
                  balanceDue={balanceDue}
                  currentHotel={currentHotel}
                  voucherType={voucherType}
                  voucherNo={reservation?.id || `00${roomNum}46`}
                />
              </div>
            </div>
          ) : (
            /* Rendered for immediate background print capability when on charges/payments tab */
            <div className="hidden print:block">
              <BookingVoucher
                room={room}
                reservation={reservation}
                folioItems={folioItems}
                paymentEntries={paymentEntries}
                subtotalCharges={subtotalCharges}
                discountAmount={discountAmount}
                discountPercent={discountPercent}
                grandTotal={grandTotal}
                totalPaid={totalPaid}
                balanceDue={balanceDue}
                currentHotel={currentHotel}
                voucherType={voucherType}
                voucherNo={reservation?.id || `00${roomNum}46`}
              />
            </div>
          )}

          {/* Financial Summary Card (Only on charges and payments tabs, hidden in print) */}
          {activeTab !== 'invoice' && (
            <div className="no-print bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-slate-700">Manager Discount:</span>
                <div className="flex space-x-1.5">
                  {[0, 5, 10, 15].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setDiscountPercent(pct)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        discountPercent === pct
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pct === 0 ? 'None' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-right text-xs">
                <div className="flex justify-between sm:justify-end space-x-6 text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">₹{subtotalCharges.toLocaleString('en-IN')}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between sm:justify-end space-x-6 text-amber-700">
                    <span>Discount ({discountPercent}%):</span>
                    <span className="font-mono font-semibold">-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between sm:justify-end space-x-6 text-slate-600">
                  <span>Taxes (CGST + SGST 12%):</span>
                  <span className="font-mono font-semibold">₹{(cgstAmount + sgstAmount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between sm:justify-end space-x-6 border-t border-slate-200 pt-1 text-sm font-black text-slate-900">
                  <span>Total Amount:</span>
                  <span className="font-mono text-indigo-900">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between sm:justify-end space-x-6 text-emerald-700 font-bold">
                  <span>Total Received:</span>
                  <span className="font-mono">₹{totalPaid.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="no-print bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs"
          >
            Close Folio
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCheckoutAndClose}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center space-x-1.5 transition-all"
            >
              <BedDouble className="w-3.5 h-3.5" />
              <span>Checkout Room #{roomNum}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

