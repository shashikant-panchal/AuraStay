import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { CheckCircle2, Sparkles } from 'lucide-react';

export default function NotificationToast() {
  const { notificationMessage } = useDashboard();

  if (!notificationMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700/80 flex items-center space-x-3 text-xs">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-medium text-slate-100">{notificationMessage}</span>
      </div>
    </div>
  );
}

