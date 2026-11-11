import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2, DollarSign, Receipt, ArrowRight, ShieldCheck, Wallet, Smartphone, Banknote } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export default function QuickBalanceModal({ isOpen, onClose, room, reservation, onOpenFullFolio }) {
  const { showNotification, updateReservation } = useDashboard();

  const [paymentMode, setPaymentMode] = useState('UPI');
  const [payAmount, setPayAmount] = useState('');
  const [refNo, setRefNo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !room) return null;

  const roomNum = String(room.room_number || room.roomNumber || room.number);
  const guestName = reservation?.guest || reservation?.name || room.guest || 'In-House Guest';
  const totalAmount = Number(reservation?.amount || room.price || 4500);
  const advancePaid = Number(reservation?.paid || reservation?.advance || 0);
  const balanceDue = Math.max(0, totalAmount - advancePaid);

  const handleSettle = async (e) => {
    e.preventDefault();
    const amountToPay = Number(payAmount) || balanceDue;
    if (amountToPay <= 0) {
      showNotification('Please enter a valid payment amount.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const newPaid = advancePaid + amountToPay;
      const resId = reservation?.id || room.booking_id;
      if (resId && updateReservation) {
        await updateReservation(resId, {
          paid: newPaid,
          status: newPaid >= totalAmount ? 'CONFIRMED' : reservation?.status
        });
      }
      showNotification(`Payment of â‚¹${amountToPay.toLocaleString('en-IN')} received via ${paymentMode} for Room #${roomNum}.`, 'success');
      onClose();
    } catch (err) {
      showNotification('Failed to record payment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide">Quick Folio Balance</h3>
              <p className="text-xs text-emerald-200/80">Room #{roomNum} â€¢ {guestName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Summary Balance Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Bill</span>
              <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">â‚¹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Paid</span>
              <span className="text-sm font-black text-emerald-800 font-mono mt-0.5 block">â‚¹{advancePaid.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Due</span>
              <span className="text-sm font-black text-rose-800 font-mono mt-0.5 block">â‚¹{balanceDue.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {balanceDue > 0 ? (
            <form onSubmit={handleSettle} className="space-y-4 pt-1">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5">
                <p className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                  <DollarSign className="w-4 h-4 text-amber-700" />
                  <span>Settle Outstanding Balance</span>
                </p>
                <div className="mt-2.5 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Amount to Collect (â‚¹)
                    </label>
                    <input
                      type="number"
                      max={balanceDue}
                      value={payAmount || balanceDue}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-black text-base font-mono focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Payment Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                        { id: 'CASH', label: 'Cash', icon: Banknote },
                        { id: 'CARD', label: 'Card / POS', icon: CreditCard }
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setPaymentMode(mode.id)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 border transition-all ${
                            paymentMode === mode.id
                              ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <mode.icon className="w-4 h-4" />
                          <span>{mode.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Ref / Txn No. (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI-984214 or Card Last 4"
                      value={refNo}
                      onChange={(e) => setRefNo(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/30 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenFullFolio) onOpenFullFolio(room, reservation);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                >
                  <span>Detailed Folio Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording...' : 'Collect & Settle'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-base">Folio Fully Settled</p>
                <p className="text-xs text-slate-500">Zero balance due. Guest has cleared all room charges.</p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenFullFolio) onOpenFullFolio(room, reservation);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-flex items-center space-x-1"
                >
                  <span>Open Full Invoice / Print Bill</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
