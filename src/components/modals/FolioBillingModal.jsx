import React, { useState, useEffect } from 'react';
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
  const { showNotification, checkoutRoom, updateReservation, currentHotel } = useDashboard();

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

      setFolioItems([
        { id: 'chg-1', date: checkIn, category: 'Room Tariff', description: `Room #${roomNum} - Night 1 Accommodation`, rate: roomPrice, qty: 1, amount: roomPrice, gst: 12 },
        { id: 'chg-2', date: checkIn, category: 'F&B', description: 'Room Service Dinner (Buffet & Beverages)', rate: 650, qty: 1, amount: 650, gst: 5 },
        { id: 'chg-3', date: '2026-11-05', category: 'Laundry', description: 'Express Dry Cleaning (2 Garments)', rate: 250, qty: 1, amount: 250, gst: 18 }
      ]);

      setPaymentEntries([
        { id: 'pay-1', date: checkIn, mode: 'UPI', ref: 'UPI-9831920', amount: Number(reservation?.paid || 2000), note: 'Check-in Advance' }
      ]);

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
    window.print();
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

