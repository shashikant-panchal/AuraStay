import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  X,
  CreditCard,
  DollarSign,
  CheckCircle2,
  Receipt,
  User,
  Building2,
  Calendar
} from 'lucide-react';

export default function CollectPaymentModal({ isOpen, onClose, reservation }) {
  const { collectReservationPayment, showNotification } = useDashboard();

  if (!isOpen || !reservation) return null;

  const totalTariff = Number(reservation.amount || reservation.price || 0);
  const alreadyPaid = Number(reservation.paid || 0);
  const balanceDue = Math.max(0, totalTariff - alreadyPaid);

  const [amount, setAmount] = useState(balanceDue > 0 ? String(balanceDue) : '');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmt = Number(amount);
    if (!numAmt || numAmt <= 0) {
      showNotification('Please enter a valid payment amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await collectReservationPayment(reservation.id, {
        amount: numAmt,
        paymentMethod,
        reference: reference.trim(),
        notes: notes.trim()
      });
      onClose();
    } catch (err) {
      console.error('Payment collection error:', err);
      showNotification('Failed to collect payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Collect Front Desk Payment
              </h2>
              <p className="text-xs text-slate-500">
                Booking Ref: <strong className="font-mono text-indigo-600">#{reservation.id}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest & Room Summary */}
        <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-900">{reservation.guest || 'Valued Guest'}</p>
            <p className="text-slate-500 text-[11px]">{reservation.room || 'Room Unassigned'} • {reservation.room_type || 'Deluxe Room'}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
            reservation.payment === 'PAID'
              ? 'bg-emerald-100 text-emerald-800'
              : reservation.payment === 'PARTIAL'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800'
          }`}>
            {reservation.payment || 'PENDING'}
          </span>
        </div>

        {/* Financial Overview */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Tariff</span>
            <p className="font-mono font-bold text-slate-800 mt-0.5">₹{totalTariff.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Paid So Far</span>
            <p className="font-mono font-bold text-emerald-600 mt-0.5">₹{alreadyPaid.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Remaining</span>
            <p className="font-mono font-bold text-rose-600 mt-0.5">₹{balanceDue.toLocaleString()}</p>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Payment Amount to Collect (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            {balanceDue > 0 && (
              <div className="flex gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setAmount(String(balanceDue))}
                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold"
                >
                  Pay Full Balance (₹{balanceDue.toLocaleString()})
                </button>
                {balanceDue > 1000 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(Math.round(balanceDue / 2)))}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                  >
                    Pay 50%
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="UPI">UPI / QR (GPay, PhonePe, Paytm)</option>
              <option value="CASH">Cash at Desk</option>
              <option value="CARD">Credit / Debit Card (Card Swiped at POS)</option>
              <option value="NET_BANKING">Net Banking / Direct Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Transaction ID / UTR / Reference
            </label>
            <input
              type="text"
              placeholder="e.g. UPI-9831924 / Card Auth 4892"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Settlement at check-in"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Record Payment'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

