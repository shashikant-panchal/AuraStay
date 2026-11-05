import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Package, Plus, AlertCircle, CheckCircle, Search, ArrowUpDown, TrendingDown } from 'lucide-react';

export default function StockManagementView() {
  const { showNotification } = useDashboard();
  const [items, setItems] = useState([
    { id: 'STK-01', name: 'Luxury Cotton Bed Sheets (King)', category: 'Linen & Bedding', currentStock: 42, minThreshold: 20, unit: 'Sets', status: 'IN_STOCK' },
    { id: 'STK-02', name: 'Bath Towels (700 GSM)', category: 'Linen & Bedding', currentStock: 18, minThreshold: 30, unit: 'Units', status: 'LOW_STOCK' },
    { id: 'STK-03', name: 'Organic Body Wash & Shampoo (50ml)', category: 'Guest Amenities', currentStock: 250, minThreshold: 100, unit: 'Bottles', status: 'IN_STOCK' },
    { id: 'STK-04', name: 'Coffee Pods & Tea Sachets', category: 'F&B Pantry', currentStock: 340, minThreshold: 150, unit: 'Packets', status: 'IN_STOCK' },
    { id: 'STK-05', name: 'Keycards RFID NFC 13.56MHz', category: 'Front Desk Supplies', currentStock: 12, minThreshold: 50, unit: 'Cards', status: 'CRITICAL' },
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900">
              Stock & Inventory Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track hotel consumables, housekeeping linens, F&B ingredients, and automated reorder alerts.
          </p>
        </div>

        <button
          onClick={() => showNotification('Purchase order requisition opened.')}
          className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Reorder Requisition</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-3">Item ID & Description</th>
              <th className="p-3">Category</th>
              <th className="p-3">In Stock</th>
              <th className="p-3">Min Level</th>
              <th className="p-3">Health Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(it => (
              <tr key={it.id} className="hover:bg-slate-50/60">
                <td className="p-3">
                  <div className="font-bold text-slate-900">{it.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{it.id}</div>
                </td>
                <td className="p-3 text-slate-600">{it.category}</td>
                <td className="p-3 font-mono font-bold text-slate-800">{it.currentStock} {it.unit}</td>
                <td className="p-3 font-mono text-slate-500">{it.minThreshold} {it.unit}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    it.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-800' :
                    it.status === 'LOW_STOCK' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {it.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => showNotification(`Quick refill triggered for ${it.name}`)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                  >
                    Order Refill
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

