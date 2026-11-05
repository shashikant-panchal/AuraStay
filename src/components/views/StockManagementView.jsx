import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  Warehouse,
  Plus,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle2,
  Package,
  TrendingDown,
  DollarSign,
  Trophy,
  X,
  RefreshCw,
  Truck
} from 'lucide-react';

const INITIAL_STOCK = [];

export default function StockManagementView() {
  const { navigateTo, showNotification } = useDashboard();

  const [stockList, setStockList] = useState(INITIAL_STOCK);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);

  // New PO State
  const [newPo, setNewPo] = useState({
    skuId: '',
    qty: 25,
    supplier: 'Amul Fresh Dairy',
    urgent: false
  });

  const categories = ['ALL', 'F&B Raw Materials', 'Beverage & Bar', 'Housekeeping Linens', 'Guest Amenities', 'Front Desk Supplies'];

  const filteredStock = stockList.filter(it => {
    const matchesSearch = 
      it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || it.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalAssetValue = stockList.reduce((acc, it) => acc + (it.currentStock * it.costPerUnit), 0);
  const lowStockCount = stockList.filter(it => it.status === 'LOW_STOCK').length;
  const outOfStockCount = stockList.filter(it => it.status === 'OUT_OF_STOCK').length;

  const handleCreatePo = (e) => {
    e.preventDefault();
    showNotification(`Purchase Order for ${newPo.qty} units dispatched to ${newPo.supplier}!`);
    setIsPoModalOpen(false);
  };

  const handleQuickRefill = (item) => {
    setStockList(prev => prev.map(i => {
      if (i.id === item.id) {
        const added = i.minThreshold * 2;
        showNotification(`Refilled ${added} ${i.unit} of ${i.name}`);
        return { ...i, currentStock: i.currentStock + added, status: 'IN_STOCK' };
      }
      return i;
    }));
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* 1. Breadcrumb */}
      <div className="flex items-center space-x-1.5 text-xs text-slate-500 pb-1 border-b border-slate-200">
        <span
          onClick={() => navigateTo('master-service-home')}
          className="hover:text-slate-900 cursor-pointer transition flex items-center gap-1"
        >
          🏠 Home
        </span>
        <span>/</span>
        <span
          onClick={() => navigateTo('restaurant-pos')}
          className="hover:text-slate-900 cursor-pointer transition"
        >
          Restaurant & POS
        </span>
        <span>/</span>
        <span className="font-semibold text-slate-900">
          Stock Management
        </span>
      </div>

      {/* 2. Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-300 px-2 py-0.5 rounded tracking-wider">
              AURASTAY PMS
            </span>
            <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> MASTERY: 0%
            </span>
          </div>

          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Stock & Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track kitchen ingredients, beverages, housekeeping linens, consumables, and automated PO reordering.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => showNotification('Inventory audit valuation export generated.')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Stock</span>
          </button>

          <button
            onClick={() => setIsPoModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#ff6d00] hover:bg-[#e66200] text-white rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Purchase Order (PO)</span>
          </button>
        </div>
      </div>

      {/* 3. 4 Top Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            TOTAL INVENTORY ASSETS
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{totalAssetValue.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Across {stockList.length} SKUs
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            LOW STOCK WARNINGS
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {lowStockCount} Items
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Below min safety buffer
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            OUT OF STOCK (CRITICAL)
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {outOfStockCount} Items
          </div>
          <span className="text-[11px] text-rose-600 font-medium block mt-1">
            Action required: Refill
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            ACTIVE VENDORS
          </span>
          <div className="text-2xl font-black text-sky-800 mt-1">{new Set(stockList.map(s => s.supplier)).size} Suppliers</div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Automated PO delivery
          </span>
        </div>
      </div>

      {/* 4. Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search SKUs by name, code, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-medium"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#0e4860] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Stock Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3">SKU & ITEM NAME</th>
                <th className="p-3">CATEGORY</th>
                <th className="p-3 text-right">IN STOCK</th>
                <th className="p-3 text-right">MIN BUFFER</th>
                <th className="p-3 text-right">UNIT COST</th>
                <th className="p-3 text-right">VALUATION</th>
                <th className="p-3 text-center">STATUS</th>
                <th className="p-3">PRIMARY SUPPLIER</th>
                <th className="p-3 text-right">REORDER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-slate-600">No Inventory Stock Items Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "Receive Stock & Create PO" to register warehouse SKUs.</p>
                  </td>
                </tr>
              ) : (
                filteredStock.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3">
                    <span className="font-extrabold text-slate-900 block">{it.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{it.id}</span>
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[10.5px]">
                      {it.category}
                    </span>
                  </td>

                  <td className="p-3 text-right font-black text-slate-900">
                    {it.currentStock} <span className="text-[10px] text-slate-400 font-normal">{it.unit}</span>
                  </td>

                  <td className="p-3 text-right text-slate-500 font-medium">
                    {it.minThreshold} {it.unit}
                  </td>

                  <td className="p-3 text-right font-medium text-slate-700">
                    ₹{it.costPerUnit}
                  </td>

                  <td className="p-3 text-right font-black text-slate-900">
                    ₹{(it.currentStock * it.costPerUnit).toLocaleString()}
                  </td>

                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      it.status === 'IN_STOCK'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : it.status === 'LOW_STOCK'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {it.status === 'IN_STOCK' ? 'Adequate' : it.status === 'LOW_STOCK' ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </td>

                  <td className="p-3 text-slate-600">
                    {it.supplier}
                  </td>

                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleQuickRefill(it)}
                      className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 rounded font-bold text-xs transition"
                    >
                      + Refill
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NEW PURCHASE ORDER */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#ff6d00] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">New Purchase Order Requisition</h3>
              <button
                onClick={() => setIsPoModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Select Item / SKU
                </label>
                <select
                  value={newPo.skuId}
                  onChange={(e) => {
                    const found = stockList.find(s => s.id === e.target.value);
                    setNewPo({ ...newPo, skuId: e.target.value, supplier: found?.supplier || '' });
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  {stockList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Reorder Quantity
                </label>
                <input
                  type="number"
                  value={newPo.qty}
                  onChange={(e) => setNewPo({ ...newPo, qty: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Supplier / Vendor
                </label>
                <input
                  type="text"
                  value={newPo.supplier}
                  onChange={(e) => setNewPo({ ...newPo, supplier: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#ff6d00] hover:bg-[#e66200] text-white rounded-lg text-xs font-bold"
                >
                  Dispatch Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
