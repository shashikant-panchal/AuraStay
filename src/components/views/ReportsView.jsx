import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { BarChart2, Download, Printer, FileText, CheckCircle2 } from 'lucide-react';

export default function ReportsView() {
  const { data, showNotification } = useDashboard();
  const { kpis } = data;

  const handleDownload = (reportName) => {
    showNotification(`Downloading ${reportName} (CSV / PDF)...`);
  };

  const reportsList = [
    { title: "Night Audit Report", desc: "Daily close of room revenue, ledger balancing, tax breakdowns, and cash reconciliations.", date: "Completed for 03/11/2026", color: "indigo" },
    { title: "Occupancy & Revenue Report", desc: "Detailed breakdown of room nights sold, ADR realization, RevPAR, and market mix.", date: "5 Oct – 3 Nov 2026", color: "emerald" },
    { title: "Check-in / Police Report", desc: "Mandatory official record of guest arrival IDs, addresses, and nationality registrations.", date: "Active in-house guests", color: "blue" },
    { title: "GST & Tax Summary Report", desc: "Itemized SGST, CGST, and IGST tax invoices ready for accounting and GST filing.", date: "October 2026 Filing", color: "amber" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Hospitality Operations & Audit Reports
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Export and review statutory, financial, and front-desk operational reports.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map(rep => (
          <div key={rep.title} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">{rep.title}</h3>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {rep.desc}
              </p>
              <div className="text-[11px] text-slate-400 mt-2 font-mono">
                {rep.date}
              </div>
            </div>

            <div className="flex space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleDownload(rep.title)}
                className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => handleDownload(`${rep.title} PDF`)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

