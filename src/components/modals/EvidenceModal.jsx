import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  X, 
  ShieldAlert, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle, 
  Building, 
  Calendar,
  IndianRupee,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function EvidenceModal() {
  const { 
    isEvidenceModalOpen, 
    setIsEvidenceModalOpen, 
    data, 
    handleReviewAction 
  } = useDashboard();

  const { todayActions } = data;
  const action = todayActions.items[0];

  const [customRate, setCustomRate] = useState(2450);
  const [isEditing, setIsEditing] = useState(false);

  if (!isEvidenceModalOpen || !action) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-50/40 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  Rate Recommendation Evidence
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                  {action.severity}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Persisted pricing exception audit & publication approval
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEvidenceModalOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Main Price Comparison Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Target Room Category & Stay Date
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 flex items-center space-x-2">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>{action.evidence.roomType}</span>
                <span className="text-slate-400">·</span>
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>{action.evidence.targetDate}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Current</div>
                <div className="text-base font-bold text-slate-500 line-through">
                  ₹{action.evidence.currentRate}
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400" />

              <div>
                <div className="text-[10px] font-bold text-emerald-600 uppercase">Recommended</div>
                <div className="text-xl font-extrabold text-emerald-600">
                  ₹{customRate}
                </div>
              </div>
            </div>
          </div>

          {/* Evidence Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Underlying Market & Demand Signals
            </h4>

            <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-950 space-y-1.5">
              <div className="font-semibold text-indigo-900 flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Primary Pricing Trigger</span>
              </div>
              <p className="text-indigo-900/90 leading-relaxed">
                {action.evidence.reason}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                <Lock className="w-4 h-4 text-slate-500" />
                <span>Guardrail Compliance</span>
              </div>
              <p className="text-slate-600">
                {action.evidence.exceptionFlag}. The recommended rate is within configured safety bounds and does not breach property rate minimums.
              </p>
            </div>
          </div>

          {/* Custom rate override toggle */}
          {isEditing && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
              <label className="block font-semibold text-amber-900 mb-1">
                Override Recommended Rate (₹):
              </label>
              <input
                type="number"
                value={customRate}
                onChange={(e) => setCustomRate(Number(e.target.value))}
                min="2000"
                max="4500"
                step="50"
                className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline self-start sm:self-auto"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Rate Before Approval'}
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleReviewAction(action.id, 'DISMISSED')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              Dismiss Recommendation
            </button>
            <button
              onClick={() => handleReviewAction(action.id, 'APPROVED', `Approved at ₹${customRate}`)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition flex items-center space-x-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Accept & Publish to Channel Manager</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

