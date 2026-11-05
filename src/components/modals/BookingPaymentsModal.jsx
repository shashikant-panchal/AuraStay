import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Check, 
  Plus, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Receipt,
  Wallet,
  Clock
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export default function BookingPaymentsModal({ isOpen, onClose, reservation, onUpdatePayment }) {
  const { showNotification } = useDashboard();

  if (!isOpen || !reservation) return null;

  const totalTariff = reservation.total || 11000.00;
  const initialPaid = reservation.paid !== undefined ? reservation.paid : (reservation.status === 'CHECKEDOUT' ? totalTariff : 5000.00);
  const initialDue = reservation.due !== undefined ? reservation.due : Math.max(0, totalTariff - initialPaid);

  const [paidAmount, setPaidAmount] = useState(initialPaid);
  const [dueAmount, setDueAmount] = useState(initialDue);
  const [activeAction, setActiveAction] = useState(null); // 'part' | 'full' | 'new'
  const [inputAmount, setInputAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');

  // Transactions list
  const [transactions, setTransactions] = useState(
    initialPaid > 0 ? [
      {
        id: `TXN-${reservation?.id ? reservation.id.replace(/[^0-9]/g, '') : '101'}`,
        date: 'Booking Date',
        mode: reservation?.payment === 'PAID' ? 'Direct / UPI' : 'Advance Payment',
        type: 'Advance Deposit',
        amount: initialPaid,
        status: 'SETTLED',
        ref: `AST-REC-${Math.floor(100 + Math.random() * 900)}`
      }
    ] : []
  );

  const handleFullPayment = () => {
    if (dueAmount <= 0) {
      showNotification('This reservation is already fully paid.');
      return;
    }
    const settledAmount = dueAmount;
    const newTxn = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      date: 'Just now (5 Nov 2026)',
      mode: 'Card / POS Terminal',
      type: 'Balance Settle',
      amount: settledAmount,
      status: 'SETTLED',
      ref: `AST-REC-${Math.floor(500 + Math.random() * 500)}`
    };

    setTransactions(prev => [newTxn, ...prev]);
    setPaidAmount(totalTariff);
    setDueAmount(0);
    setActiveAction(null);
    if (onUpdatePayment) {
      onUpdatePayment(reservation.id, totalTariff, 0);
    }
    showNotification(`Full payment of ₹${settledAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} collected successfully!`);
  };

  const handleCustomPaymentSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(inputAmount);
    if (!amt || amt <= 0) {
      showNotification('Please enter a valid payment amount.');
      return;
    }
    if (amt > dueAmount) {
      showNotification(`Amount exceeds remaining due of ₹${dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      return;
    }

    const newPaid = paidAmount + amt;
    const newDue = Math.max(0, dueAmount - amt);

    const newTxn = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      date: 'Just now (5 Nov 2026)',
      mode: paymentMode,
      type: activeAction === 'part' ? 'Part Payment' : 'New Receipt',
      amount: amt,
      status: 'SETTLED',
      ref: `AST-REC-${Math.floor(500 + Math.random() * 500)}`
    };

    setTransactions(prev => [newTxn, ...prev]);
    setPaidAmount(newPaid);
    setDueAmount(newDue);
    setInputAmount('');
    setActiveAction(null);
    if (onUpdatePayment) {
      onUpdatePayment(reservation.id, newPaid, newDue);
    }
    showNotification(`Payment of ₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })} recorded via ${paymentMode}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header (Exact Screenshot 4) */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0e4860]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Booking Payments
              </h2>
              <p className="text-xs text-slate-500">
                Collect, settle, and review reservation transactions
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-[11px] font-medium text-slate-400 block leading-tight">
                Reservation
              </span>
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                #{reservation.id}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Top 3 KPI Cards (Exact Screenshot 4) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Card 1: Room Tariff */}
            <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-800 p-4 shadow-2xs">
              <div className="text-xs font-semibold text-slate-500">
                Room Tariff
              </div>
              <div className="text-xl font-black text-slate-900 mt-1">
                ₹{totalTariff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                With discount applied
              </div>
            </div>

            {/* Card 2: Room Paid */}
            <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-blue-600 p-4 shadow-2xs">
              <div className="text-xs font-semibold text-slate-500">
                Room Paid
              </div>
              <div className="text-xl font-black text-slate-900 mt-1">
                ₹{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Accommodation receipts
              </div>
            </div>

            {/* Card 3: Room Due */}
            <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-red-500 p-4 shadow-2xs">
              <div className="text-xs font-semibold text-slate-500">
                Room Due
              </div>
              <div className="text-xl font-black text-slate-900 mt-1">
                ₹{dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {dueAmount > 0 ? 'Pending collection' : 'Fully Settled'}
              </div>
            </div>

          </div>

          {/* Middle: RESERVATION LEDGER Box (Exact Screenshot 4) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs max-w-xs space-y-2.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>RESERVATION LEDGER</span>
            </div>

            <div className="space-y-2 pt-1 text-xs font-bold">
              {/* Pill 1: Total Tariff */}
              <div className="bg-[#e0f2fe] text-[#0284c7] px-3.5 py-2 rounded-lg flex items-center justify-between">
                <span>Total Tariff</span>
                <span>₹{totalTariff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Pill 2: Collect */}
              <div className="bg-[#ffedd5] text-[#ea580c] px-3.5 py-2 rounded-lg flex items-center justify-between">
                <span>Collect</span>
                <span>₹{totalTariff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Pill 3: Paid */}
              <div className="bg-[#dcfce7] text-[#16a34a] px-3.5 py-2 rounded-lg flex items-center justify-between">
                <span>Paid</span>
                <span>₹{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Pill 4: Total Due */}
              <div className="bg-[#ffe4e6] text-[#e11d48] px-3.5 py-2 rounded-lg flex items-center justify-between">
                <span>Total Due</span>
                <span>₹{dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Lower: Payment Transactions (Exact Screenshot 4) */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Payment Transactions
                </h3>
                <p className="text-xs text-slate-400">
                  {transactions.length} {transactions.length === 1 ? 'record' : 'records'} found
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setActiveAction(activeAction === 'part' ? null : 'part');
                    setInputAmount(dueAmount > 0 ? (dueAmount / 2).toFixed(2) : '');
                  }}
                  className={`px-3 py-1.5 border rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    activeAction === 'part'
                      ? 'bg-slate-100 border-slate-400 text-slate-900'
                      : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  <span>Part Payment</span>
                </button>

                <button
                  onClick={handleFullPayment}
                  disabled={dueAmount <= 0}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition ${
                    dueAmount <= 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#10b981] hover:bg-[#059669] text-white'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Full Payment</span>
                </button>

                <button
                  onClick={() => {
                    setActiveAction(activeAction === 'new' ? null : 'new');
                    setInputAmount('');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition ${
                    activeAction === 'new'
                      ? 'bg-[#135d7c] text-white'
                      : 'bg-[#0e4860] hover:bg-[#135d7c] text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Payment</span>
                </button>
              </div>
            </div>

            {/* Inline Payment Form (when Part or New Payment is clicked) */}
            {activeAction && (
              <form onSubmit={handleCustomPaymentSubmit} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
                <div className="text-xs font-bold text-slate-700">
                  {activeAction === 'part' ? 'Collect Partial Payment' : 'Record New Payment Transaction'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                      placeholder={`Max ₹${dueAmount}`}
                      className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-bold text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium text-slate-800"
                    >
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Card (POS)">Card (POS Terminal)</option>
                      <option value="Cash">Cash at Counter</option>
                      <option value="Net Banking">Bank Transfer / NEFT</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="flex items-end space-x-2">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white text-xs font-bold rounded-lg transition"
                    >
                      Submit Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAction(null)}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Transactions List */}
            <div className="bg-slate-50/60 rounded-xl border border-slate-200 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">Transaction ID</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Receipt Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transactions.map((txn, idx) => (
                    <tr key={idx} className="hover:bg-white transition font-medium">
                      <td className="py-2.5 px-3 font-bold text-sky-700">{txn.id}</td>
                      <td className="py-2.5 px-3 text-slate-600">{txn.date}</td>
                      <td className="py-2.5 px-3 text-slate-700">{txn.mode}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10.5px] font-bold">
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {txn.ref}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* Modal Footer (Exact Screenshot 4) */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Keep payment records current before checkout or invoice generation.
          </p>

          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        </div>

      </div>
    </div>
  );
}

