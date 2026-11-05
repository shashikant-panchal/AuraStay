import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Wallet, Plus, Download, CheckCircle } from 'lucide-react';

export default function AccountsFinanceView() {
  const { data, showNotification, reservations = [] } = useDashboard();
  const { kpis } = data;

  const invoices = (reservations || []).map((r, i) => ({
    id: `INV-2026-${String(r.id || i + 1).padStart(3, '0')}`,
    client: r.guest || 'Walk-in Guest',
    amount: Number(r.amount) || 0,
    date: r.checkIn || 'Today',
    status: r.payment || 'PENDING',
    type: `Room Booking (${r.room || 'Standard'})`
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-lime-600" />
            <h2 className="text-base font-bold text-slate-900">
              Accounts & Finance — Invoices & Payments
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track guest folios, corporate credit settlements, and revenue collections.
          </p>
        </div>

        <button
          onClick={() => showNotification('Create Invoice modal opened.')}
          className="flex items-center space-x-1.5 px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white text-xs font-semibold rounded-lg shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Invoice</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 text-xs font-bold text-slate-700">
          Recent Invoices & Folio Ledgers
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 font-bold">Invoice #</th>
                <th className="py-3 px-4 font-bold">Client / Guest</th>
                <th className="py-3 px-4 font-bold">Type</th>
                <th className="py-3 px-4 font-bold">Date</th>
                <th className="py-3 px-4 font-bold text-right">Amount</th>
                <th className="py-3 px-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans text-xs">
                    No invoices recorded yet. Invoices and folios will automatically populate as new reservations are created.
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-indigo-600">{inv.id}</td>
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-900">{inv.client}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-600">{inv.type}</td>
                    <td className="py-3.5 px-4 text-slate-500">{inv.date}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">₹{inv.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-sans uppercase ${
                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

