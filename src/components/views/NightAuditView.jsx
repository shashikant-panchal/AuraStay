import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Moon, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  FileText, 
  Download, 
  Printer, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';

export default function NightAuditView() {
  const { showNotification } = useDashboard();

  const [auditStep, setAuditStep] = useState(0);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);

  const auditSteps = [
    { title: 'Resolve Pending Check-ins & No-Shows', desc: 'Verify all expected arrivals for 05 Nov 2026', status: 'READY' },
    { title: 'Post Room Charges & Statutory Taxes', desc: 'Automatically calculate CGST + SGST (12%/18%) and post to guest ledgers', status: 'READY' },
    { title: 'Audit Food & Beverages Outlets', desc: 'Close open KOTs and reconcile POS billing from The Spice Pavilion', status: 'READY' },
    { title: 'Reconcile Cash & Payment Gateways', desc: 'Match Razorpay, Stripe, and Cash drawer shift balancing', status: 'READY' },
    { title: 'Roll Business Date Forward', desc: 'Advance PMS operational date from 05 Nov to 06 Nov 2026', status: 'PENDING' },
  ];

  const handleRunAudit = () => {
    setIsRunningAudit(true);
    setAuditStep(1);

    const stepInterval = setInterval(() => {
      setAuditStep(prev => {
        if (prev >= 5) {
          clearInterval(stepInterval);
          setIsRunningAudit(false);
          setAuditComplete(true);
          showNotification('Night Audit successfully completed! PMS Rolled to 06 Nov 2026.');
          return 5;
        }
        return prev + 1;
      });
    }, 700);
  };

  const auditLogs = [
    { date: '04 Nov 2026', auditor: 'Twinkle Bagh (PROP ADMIN)', roomRev: '₹32,400', fnbRev: '₹8,920', totalRev: '₹41,320', status: 'BALANCED' },
    { date: '03 Nov 2026', auditor: 'Samir Nayak (Front Desk Lead)', roomRev: '₹28,600', fnbRev: '₹7,450', totalRev: '₹36,050', status: 'BALANCED' },
    { date: '02 Nov 2026', auditor: 'Twinkle Bagh (PROP ADMIN)', roomRev: '₹35,100', fnbRev: '₹11,200', totalRev: '₹46,300', status: 'BALANCED' },
    { date: '01 Nov 2026', auditor: 'Samir Nayak (Front Desk Lead)', roomRev: '₹42,000', fnbRev: '₹14,800', totalRev: '₹56,800', status: 'BALANCED' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Moon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Night Audit & End of Day Operations
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile daily revenues, post nightly room tariffs and statutory taxes, and roll over the operational business day.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Current Business Date</div>
            <div className="text-sm font-black text-indigo-700 font-mono">05 Nov 2026 (Evening Shift)</div>
          </div>

          <button
            onClick={handleRunAudit}
            disabled={isRunningAudit || auditComplete}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm transition ${
              auditComplete 
                ? 'bg-emerald-600 text-white cursor-default' 
                : isRunningAudit 
                ? 'bg-indigo-400 text-white cursor-wait' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {auditComplete ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Audit Finished (06 Nov)</span>
              </>
            ) : isRunningAudit ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Audit Step {auditStep}/5...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Night Audit Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step Progress Checklist */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Daily Closing Checklist & Pipeline</span>
        </h3>

        <div className="space-y-3">
          {auditSteps.map((step, idx) => {
            const isDone = auditComplete || auditStep > idx;
            const isCurrent = isRunningAudit && auditStep === idx + 1;

            return (
              <div 
                key={step.title}
                className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                  isDone 
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                    : isCurrent 
                    ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    isDone ? 'bg-emerald-600 text-white' :
                    isCurrent ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{step.title}</div>
                    <div className="text-[11px] text-slate-500">{step.desc}</div>
                  </div>
                </div>

                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    isDone ? 'bg-emerald-200 text-emerald-800' :
                    isCurrent ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isDone ? 'COMPLETED' : isCurrent ? 'PROCESSING...' : step.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit History Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Recent Night Audit Archive</span>
          </h3>
          <span className="text-xs text-slate-400">All shifts balanced</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Audit Date</th>
                <th className="p-3">Auditor / Manager</th>
                <th className="p-3">Room Revenue</th>
                <th className="p-3">F&B Revenue</th>
                <th className="p-3">Total Daily Rev</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map(log => (
                <tr key={log.date} className="hover:bg-slate-50/60">
                  <td className="p-3 font-bold text-slate-800">{log.date}</td>
                  <td className="p-3 text-slate-600">{log.auditor}</td>
                  <td className="p-3 font-mono font-medium text-slate-700">{log.roomRev}</td>
                  <td className="p-3 font-mono font-medium text-slate-700">{log.fnbRev}</td>
                  <td className="p-3 font-mono font-bold text-indigo-700">{log.totalRev}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button 
                      onClick={() => showNotification(`Exporting Manager Flash for ${log.date}`)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Export Flash PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

