import React, { useState } from 'react';
import {
  X,
  Moon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  BedDouble,
  DollarSign,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export default function NightAuditModal({ isOpen, onClose }) {
  const { workingDate, executeNightAudit, rooms = [], reservations = [], showNotification } = useDashboard();

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Active rooms calculations
  const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED' || r.status === 'Occupied');
  const dirtyRooms = rooms.filter(r => r.status === 'DIRTY' || r.housekeeping === 'Dirty');
  const blockedRooms = rooms.filter(r => r.status === 'MAINTENANCE' || r.status === 'Blocked');
  
  // Potential No-Shows (arrivals pending)
  const pendingArrivals = reservations.filter(r => (r.status === 'CONFIRMED' || r.status === 'Confirmed') && r.check_in === workingDate);

  // Due out today
  const dueOutDepartures = reservations.filter(r => (r.status === 'CHECKED_IN' || r.status === 'Occupied') && r.check_out === workingDate);

  // Step 4 Tariff estimate
  const totalTariffPosting = occupiedRooms.reduce((sum, r) => sum + (Number(r.price || r.tariff || 2500)), 0);

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleExecuteAudit = () => {
    setIsProcessing(true);
    setTimeout(() => {
      executeNightAudit(workingDate);
      setIsProcessing(false);
      onClose();
    }, 1200);
  };

  const stepsList = [
    { num: 1, title: 'Not Arrived', desc: 'No-Show check' },
    { num: 2, title: 'Departures', desc: 'Overstay review' },
    { num: 3, title: 'Blocked Rooms', desc: 'Maintenance review' },
    { num: 4, title: 'Post Tariff', desc: 'Post daily charges' },
    { num: 5, title: 'Roll Date', desc: 'Advance working date' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black tracking-wide">Night Audit & Day-End Closing</h3>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-400/30">
                  Step {currentStep} of 5
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">Working Date: <strong className="text-white">{workingDate}</strong> • DEMO HOTEL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          {stepsList.map((st) => (
            <div key={st.num} className="flex items-center space-x-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                currentStep === st.num
                  ? 'bg-indigo-900 text-white ring-4 ring-indigo-900/10'
                  : currentStep > st.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {currentStep > st.num ? '✓' : st.num}
              </div>
              <div className="hidden sm:block text-left">
                <p className={`text-[11px] font-bold leading-none ${currentStep === st.num ? 'text-indigo-950' : 'text-slate-500'}`}>
                  {st.title}
                </p>
              </div>
              {st.num < 5 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Step Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Step 1: Check In Pending Arrivals / No-Shows</h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Verify all reservations expected to check in today. Unclaimed bookings can be marked as No-Show.
                  </p>
                </div>
              </div>

              {pendingArrivals.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">No Pending Arrivals for Today</p>
                  <p className="text-[11px] text-slate-500">All scheduled arrivals have been checked in or resolved.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingArrivals.map(res => (
                    <div key={res.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{res.guest} ({res.room})</p>
                        <p className="text-slate-500 text-[11px]">Advance Paid: ₹{res.paid || 0} • Phone: {res.phone || 'N/A'}</p>
                      </div>
                      <span className="text-amber-800 font-bold bg-amber-100 px-2.5 py-1 rounded-lg text-[10px]">
                        Pending Arrival
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-4 flex items-start space-x-3">
                <Clock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Step 2: Review Overstay & Due Departures</h4>
                  <p className="text-xs text-indigo-800 mt-0.5">
                    Review in-house guests whose departure was scheduled for today.
                  </p>
                </div>
              </div>

              {dueOutDepartures.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">All Scheduled Departures Cleared</p>
                  <p className="text-[11px] text-slate-500">No overdue guests remaining at front desk.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dueOutDepartures.map(res => (
                    <div key={res.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{res.guest} ({res.room})</p>
                        <p className="text-slate-500 text-[11px]">Due Out: {res.check_out}</p>
                      </div>
                      <span className="text-rose-800 font-bold bg-rose-100 px-2.5 py-1 rounded-lg text-[10px]">
                        Due Departure
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-4 flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">Step 3: Blocked & Maintenance Rooms</h4>
                  <p className="text-xs text-rose-800 mt-0.5">
                    Review out-of-order and maintenance rooms before rolling over the day.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Under Maintenance</p>
                  <p className="text-2xl font-black text-rose-700 mt-1">{blockedRooms.length} Rooms</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Will carry over as out-of-service</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Dirty / Turnover</p>
                  <p className="text-2xl font-black text-amber-700 mt-1">{dirtyRooms.length} Rooms</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Scheduled for housekeeping inspection</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-start space-x-3">
                <DollarSign className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Step 4: Post Room Tariffs & Post Charges</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Automatically post daily accommodation charges and GST for all in-house occupied suites.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Currently Occupied Rooms:</span>
                  <span className="font-bold text-slate-900">{occupiedRooms.length} Rooms</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Estimated Room Revenue Posting:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">₹{totalTariffPosting.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-2">
                  <span className="text-slate-600 font-medium">Blended GST (12%):</span>
                  <span className="font-mono font-bold text-slate-900">₹{Math.round(totalTariffPosting * 0.12).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-5 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-300">
                  <Sparkles className="w-5 h-5" />
                  <h4 className="text-xs font-black uppercase tracking-wider">Step 5: Roll Working Date</h4>
                </div>
                <p className="text-xs text-indigo-100/90 leading-relaxed">
                  You are about to close operational day <strong>{workingDate}</strong>. All day books will be locked, daily revenues recorded, and the working date will advance by 1 day.
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between bg-slate-50">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Operational Date</span>
                  <span className="text-sm font-black text-slate-800 font-mono mt-0.5 block">{workingDate}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-indigo-600" />
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Next Working Date</span>
                  <span className="text-sm font-black text-emerald-800 font-mono mt-0.5 block">
                    {(() => {
                      const d = new Date(workingDate);
                      d.setDate(d.getDate() + 1);
                      return d.toISOString().split('T')[0];
                    })()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={currentStep === 1 ? onClose : handlePrevStep}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs"
          >
            {currentStep === 1 ? 'Cancel' : 'Previous Step'}
          </button>

          {currentStep < 5 ? (
            <button
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs shadow-md shadow-indigo-900/20 flex items-center space-x-1.5 transition-all"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleExecuteAudit}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Executing Audit & Rolling Date...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Execute Night Audit & Close Day</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

