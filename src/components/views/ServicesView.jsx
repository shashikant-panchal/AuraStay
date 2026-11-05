import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { ConciergeBell, Plus, CheckCircle, Clock, DollarSign } from 'lucide-react';

export default function ServicesView() {
  const { showNotification } = useDashboard();
  const [services, setServices] = useState([]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ConciergeBell className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900">
              Hotel Services & Amenities Catalog
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage concierge add-ons, wellness spa appointments, airport logistics, and banquet bookings.
          </p>
        </div>

        <button
          onClick={() => showNotification('New service creation modal opened.')}
          className="flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hotel Service</span>
        </button>
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
            <ConciergeBell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Hotel Services Configured</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click "Add Hotel Service" to configure custom guest amenities, airport transfers, spa treatments, and event halls.
          </p>
          <button
            onClick={() => showNotification('Add Hotel Service modal opened.')}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            + Add Hotel Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map(srv => (
            <div key={srv.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded uppercase">
                    {srv.category}
                  </span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    {srv.price}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-2">{srv.name}</h3>
                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Active Bookings today: <strong className="text-slate-800">{srv.activeRequests}</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Service Active
                </span>
                <button
                  onClick={() => showNotification(`Booked ${srv.name} for current guest folio.`)}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-lg transition"
                >
                  Book for Guest
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

