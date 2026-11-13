import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  X, 
  Compass, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  TrendingUp, 
  CalendarClock, 
  PieChart, 
  Target, 
  Activity, 
  Split 
} from 'lucide-react';

export default function TourModal() {
  const { isTourOpen, setIsTourOpen, setActiveTab } = useDashboard();
  const [step, setStep] = useState(0);

  if (!isTourOpen) return null;

  const tourSteps = [
    {
      title: "Welcome to Aavasa",
      tab: "overview",
      icon: TrendingUp,
      desc: "Aavasa is your dedicated Hotel Management & Revenue Optimization platform. It empowers hoteliers to seamlessly manage reservations, front office operations, room allocations, dynamic tariffs, and channel distribution."
    },
    {
      title: "Today's Revenue Actions & Live KPIs",
      tab: "overview",
      icon: TrendingUp,
      desc: "Check today's urgent pricing exceptions on the Overview tab. Review rate recommendations triggered by demand surges or competitor price spikes, and view real-time core metrics: RevPAR, ADR, and Occupancy."
    },
    {
      title: "Pickup & Booking Pace",
      tab: "pickup-pace",
      icon: CalendarClock,
      desc: "Monitor active booking additions day-by-day over the next 14 days, see booking velocity (0.9 rooms/day), and analyze lead time distribution (91% within 0-3 days for this property)."
    },
    {
      title: "Segmentation & Account Mix",
      tab: "segmentation",
      icon: PieChart,
      desc: "Track revenue contributions by channel (Booking Engine vs Walk-in) and review top corporate client production (CKS Education, Shyam Engineering, DCC Medical)."
    },
    {
      title: "Budget & Forecast Tracking",
      tab: "budget-forecast",
      icon: Target,
      desc: "Set monthly accommodation revenue targets and compare real-time MTD progress against targets. View historical variance for completed months."
    },
    {
      title: "Demand Forecast & Signals",
      tab: "demand-forecast",
      icon: Activity,
      desc: "Explore 90-day deterministic occupancy projections based on 402 historical inventory days. Apply manual date-range overrides and review forecast error (MAE 18.37 pts)."
    },
    {
      title: "Group Displacement Decisions",
      tab: "displacement",
      icon: Split,
      desc: "Evaluate large corporate group inquiries against transient demand opportunity costs. Calculate net commercial gain or loss before signing contracts, and configure property overbooking caps."
    }
  ];

  const current = tourSteps[step];
  const Icon = current.icon;

  const handleNext = () => {
    if (step < tourSteps.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      setActiveTab(tourSteps[nextStep].tab);
    } else {
      setIsTourOpen(false);
      setStep(0);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      const prevStep = step - 1;
      setStep(prevStep);
      setActiveTab(tourSteps[prevStep].tab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white relative">
          <button
            onClick={() => setIsTourOpen(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Compass className="w-4 h-4" />
            <span>Interactive Guided Tour · Step {step + 1} of {tourSteps.length}</span>
          </div>

          <div className="w-12 h-12 rounded-xl bg-indigo-600/60 border border-indigo-400/30 flex items-center justify-center text-white my-3">
            <Icon className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-extrabold text-white">
            {current.title}
          </h3>

          <p className="text-xs text-indigo-100/90 mt-2 leading-relaxed">
            {current.desc}
          </p>

          {/* Dots */}
          <div className="flex space-x-1.5 mt-5">
            {tourSteps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-emerald-400' : 'w-1.5 bg-indigo-700'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-t border-slate-200">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <span>{step === tourSteps.length - 1 ? 'Finish Tour' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

