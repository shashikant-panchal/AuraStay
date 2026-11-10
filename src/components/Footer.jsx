import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { ExternalLink, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const { data } = useDashboard();
  const { property } = data;

  return (
    <footer className="mt-12 border-t border-slate-200 bg-white py-6 px-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="text-slate-300">|</span>
          <span>
            Powered by <strong className="text-slate-700">AuraStay Hospitality Suite</strong> (v4.2.0)
          </span>
        </div>

        <div className="flex items-center space-x-4 text-slate-400 text-[11px]">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Deterministic Analytics Engine</span>
          </span>
          <span>© 2026 {property.name}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

