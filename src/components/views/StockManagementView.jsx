import React, { useState, useEffect, useMemo } from 'react';
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
  X,
  RefreshCw,
  Truck,
  Trash2,
  ArrowDownRight,
  ArrowUpRight,
  Check
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function StockManagementView() {
  const { navigateTo, showNotification } = useDashboard();

  // Active Tab: 'inventory' | 'orders' | 'suppliers'
  const [activeTab, setActiveTab] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modals state
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState(null);
  const [adjustType, setAdjustType] = useState('IN'); // 'IN' (Receive) or 'OUT' (Issue)
  const [adjustQty, setAdjustQty] = useState('10');

  // Stock List State
  const [stockList, setStockList] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_inventory_items');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'SKU-101', name: 'Fresh Full Cream Milk', category: 'F&B Raw Materials', unit: 'Liters', currentStock: 45, minThreshold: 20, costPerUnit: 64, supplier: 'Amul Fresh Dairy', status: 'IN_STOCK' },
      { id: 'SKU-102', name: 'Single-Source Arabica Coffee Beans', category: 'Beverage & Bar', unit: 'Kg', currentStock: 8, minThreshold: 15, costPerUnit: 850, supplier: 'Blue Tokai Roasters', status: 'LOW_STOCK' },
      { id: 'SKU-103', name: 'Luxury Cotton Bath Towels (650 GSM)', category: 'Housekeeping Linens', unit: 'Pieces', currentStock: 120, minThreshold: 30, costPerUnit: 480, supplier: 'Trident Hospitality', status: 'IN_STOCK' },
      { id: 'SKU-104', name: 'Eco Dental Kits & Wooden Comb Sets', category: 'Guest Amenities', unit: 'Packs', currentStock: 250, minThreshold: 50, costPerUnit: 24, supplier: 'GreenStay Amenities', status: 'IN_STOCK' }
    ];
  });

  // Purchase Orders State
  const [purchaseOrders, setPurchaseOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_purchase_orders');
      if (saved) return JSON.parse(saved);
    } catch(e){}
    return [
      { id: 'PO-2026-081', supplier: 'Amul Fresh Dairy', items: 'Milk (50L), Salted Butter (10kg)', amount: 6800, date: '11-11-2026', status: 'RECEIVED' },
      { id: 'PO-2026-082', supplier: 'Blue Tokai Roasters', items: 'Arabica Coffee Beans (20kg)', amount: 17000, date: '11-11-2026', status: 'DISPATCHED' }
    ];
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('aurastay_inventory_items', JSON.stringify(stockList));
    } catch(e){}
  }, [stockList]);

  useEffect(() => {
    try {
      localStorage.setItem('aurastay_purchase_orders', JSON.stringify(purchaseOrders));
    } catch(e){}
  }, [purchaseOrders]);

  // Form state for adding new inventory item
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('F&B Raw Materials');
  const [newItemUnit, setNewItemUnit] = useState('Pieces');
  const [newItemCost, setNewItemCost] = useState('100');
  const [newItemStock, setNewItemStock] = useState('50');
  const [newItemMin, setNewItemMin] = useState('15');
  const [newItemSupplier, setNewItemSupplier] = useState('');

  // Form state for new PO
  const [poSupplier, setPoSupplier] = useState('Amul Fresh Dairy');
  const [poItemDescription, setPoItemDescription] = useState('');
  const [poAmount, setPoAmount] = useState('5000');

  const categories = ['ALL', 'F&B Raw Materials', 'Beverage & Bar', 'Housekeeping Linens', 'Guest Amenities', 'Front Desk Supplies'];

  // Add Item
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const itemObj = {
      id: `SKU-${Date.now().toString().slice(-4)}`,
      name: newItemName.trim(),
      category: newItemCategory,
      unit: newItemUnit,
      currentStock: Number(newItemStock) || 0,
      minThreshold: Number(newItemMin) || 10,
      costPerUnit: Number(newItemCost) || 0,
      supplier: newItemSupplier.trim() || 'General Vendor',
      status: Number(newItemStock) <= Number(newItemMin) ? 'LOW_STOCK' : 'IN_STOCK'
    };

    setStockList(prev => [itemObj, ...prev]);
    showNotification(`New SKU ${itemObj.name} added to inventory master.`);
    setIsAddItemModalOpen(false);

    // Reset
    setNewItemName('');
    setNewItemSupplier('');
  };

  // Adjust Stock (In / Out)
  const handleApplyAdjustment = (e) => {
    e.preventDefault();
    if (!selectedItemForAdjust) return;
    const qty = Number(adjustQty) || 0;
    if (qty <= 0) return;

    setStockList(prev => prev.map(item => {
      if (item.id === selectedItemForAdjust.id) {
        let updatedStock = item.currentStock;
        if (adjustType === 'IN') {
          updatedStock += qty;
        } else {
          updatedStock = Math.max(0, updatedStock - qty);
        }

        const newStatus = updatedStock === 0 ? 'OUT_OF_STOCK' : updatedStock <= item.minThreshold ? 'LOW_STOCK' : 'IN_STOCK';
        return { ...item, currentStock: updatedStock, status: newStatus };
      }
      return item;
    }));

    showNotification(`${adjustType === 'IN' ? 'Received' : 'Issued'} ${qty} ${selectedItemForAdjust.unit} of ${selectedItemForAdjust.name}.`);
    setIsAdjustStockModalOpen(false);
  };

  // Create PO
  const handleCreatePo = (e) => {
    e.preventDefault();
    const poObj = {
      id: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      supplier: poSupplier,
      items: poItemDescription.trim() || 'Standard Inventory Replenishment',
      amount: Number(poAmount) || 2000,
      date: new Date().toLocaleDateString('en-GB'),
      status: 'DISPATCHED'
    };

    setPurchaseOrders(prev => [poObj, ...prev]);
    showNotification(`Purchase Order #${poObj.id} dispatched to ${poObj.supplier}!`);
    setIsPoModalOpen(false);
    setPoItemDescription('');
  };

  // Mark PO Received
  const handleReceivePo = (poId) => {
    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, status: 'RECEIVED' } : p));
    showNotification(`PO #${poId} received and verified into inventory.`);
  };

  // Filtered Stock
  const filteredStock = useMemo(() => {
    return stockList.filter(it => {
      const matchesSearch = 
        it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        it.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        it.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'ALL' || it.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [stockList, searchTerm, selectedCategory]);

  const totalAssetValue = stockList.reduce((acc, it) => acc + (it.currentStock * it.costPerUnit), 0);
  const lowStockCount = stockList.filter(it => it.status === 'LOW_STOCK').length;
  const outOfStockCount = stockList.filter(it => it.status === 'OUT_OF_STOCK').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      
      {/* 1. Header */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-800 border border-orange-300 px-2.5 py-0.5 rounded-full shadow-2xs">
              STORES & INVENTORY ERP
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Real-time Material Valuation</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
            Stores, Stock & Purchase Orders
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Monitor kitchen raw materials, beverages, guest toiletries, linen stocks, and issue goods with automated PO reordering.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsPoModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 font-bold text-xs flex items-center space-x-1.5 transition shadow-xs"
          >
            <Truck className="w-4 h-4 text-orange-600" />
            <span>New Purchase Order (PO)</span>
          </button>

          <button
            onClick={() => setIsAddItemModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#ff6d00] hover:bg-[#e66200] text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-md shadow-[#ff6d00]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item (SKU)</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">TOTAL STOCK ASSET VALUE</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">₹{totalAssetValue.toLocaleString()}</div>
          <span className="text-[11px] font-bold text-emerald-600 mt-1 block">Across {stockList.length} SKUs</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">LOW STOCK WARNINGS</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{lowStockCount} Items</div>
          <span className="text-[11px] font-bold text-amber-700 mt-1 block">Below safety reorder level</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">CRITICAL OUT OF STOCK</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{outOfStockCount} Items</div>
          <span className="text-[11px] font-bold text-rose-700 mt-1 block">Immediate PO required</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">ACTIVE PURCHASE ORDERS</span>
          <div className="text-2xl font-black text-sky-800 mt-1">{purchaseOrders.length}</div>
          <span className="text-[11px] font-bold text-slate-500 mt-1 block">Suppliers: {new Set(stockList.map(s => s.supplier)).size}</span>
        </div>
      </div>

      {/* 3. Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'inventory'
              ? 'bg-[#ff6d00] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Inventory Master ({stockList.length} SKUs)</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-[#ff6d00] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Purchase Orders & Deliveries ({purchaseOrders.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INVENTORY ITEMS MASTER */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU code, item name, or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto self-start md:self-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    selectedCategory === cat 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10.5px] border-b border-slate-200">
                    <th className="py-3 px-4 font-bold">SKU Code</th>
                    <th className="py-3 px-4 font-bold">Item Description</th>
                    <th className="py-3 px-4 font-bold">Category</th>
                    <th className="py-3 px-4 font-bold text-center">Current Stock</th>
                    <th className="py-3 px-4 font-bold">Safety Min</th>
                    <th className="py-3 px-4 font-bold text-right">Unit Cost</th>
                    <th className="py-3 px-4 font-bold text-right">Valuation</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Stock Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No inventory items matching filter. Click "+ Add Stock Item (SKU)" to create items.
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map(it => {
                      const valuation = it.currentStock * it.costPerUnit;
                      const isLow = it.status === 'LOW_STOCK';
                      const isOut = it.status === 'OUT_OF_STOCK';

                      return (
                        <tr key={it.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-mono font-bold text-orange-700">{it.id}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{it.name}</span>
                            <span className="text-[11px] text-slate-500">{it.supplier}</span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">{it.category}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-mono font-bold text-sm text-slate-900">{it.currentStock}</span>
                            <span className="text-[10px] text-slate-400 block font-sans">{it.unit}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono">{it.minThreshold} {it.unit}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold">₹{it.costPerUnit}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">₹{valuation.toLocaleString()}</td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isOut 
                                ? 'bg-rose-100 text-rose-800' 
                                : isLow 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedItemForAdjust(it);
                                  setAdjustType('IN');
                                  setIsAdjustStockModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[11px] border border-emerald-200 transition"
                                title="Receive Goods / Stock In"
                              >
                                + In
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedItemForAdjust(it);
                                  setAdjustType('OUT');
                                  setIsAdjustStockModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-bold text-[11px] border border-amber-200 transition"
                                title="Issue to Department / Stock Out"
                              >
                                - Issue
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PURCHASE ORDERS */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Vendor Purchase Orders & Deliveries</h3>
              <p className="text-xs text-slate-500">Track dispatched supplier orders and verify goods receipt.</p>
            </div>
            <button
              onClick={() => setIsPoModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#ff6d00] hover:bg-[#e66200] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Purchase Order</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10.5px] border-b border-slate-200">
                  <th className="py-3 px-4 font-bold">PO Number</th>
                  <th className="py-3 px-4 font-bold">Supplier / Vendor</th>
                  <th className="py-3 px-4 font-bold">Items Dispatched</th>
                  <th className="py-3 px-4 font-bold">PO Date</th>
                  <th className="py-3 px-4 font-bold text-right">Valuation</th>
                  <th className="py-3 px-4 font-bold">Delivery Status</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.map(po => {
                  const isReceived = po.status === 'RECEIVED';
                  return (
                    <tr key={po.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{po.id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{po.supplier}</td>
                      <td className="py-3.5 px-4 text-slate-700">{po.items}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">{po.date}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">₹{po.amount.toLocaleString()}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isReceived ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isReceived && (
                          <button
                            onClick={() => handleReceivePo(po.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs"
                          >
                            Mark Received ✓
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW STOCK ITEM */}
      {/* ========================================================================= */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900">New Inventory Item (SKU)</h3>
              <button onClick={() => setIsAddItemModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item Description / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati Biryani Rice (Daawat Gold)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                  >
                    <option value="F&B Raw Materials">F&B Raw Materials</option>
                    <option value="Beverage & Bar">Beverage & Bar</option>
                    <option value="Housekeeping Linens">Housekeeping Linens</option>
                    <option value="Guest Amenities">Guest Amenities</option>
                    <option value="Front Desk Supplies">Front Desk Supplies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                  >
                    <option value="Pieces">Pieces (pcs)</option>
                    <option value="Kg">Kilograms (kg)</option>
                    <option value="Liters">Liters (ltr)</option>
                    <option value="Packs">Packs (box)</option>
                    <option value="Bottles">Bottles</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cost/Unit (₹)</label>
                  <input
                    type="number"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Qty</label>
                  <input
                    type="number"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Safety Min</label>
                  <input
                    type="number"
                    value={newItemMin}
                    onChange={(e) => setNewItemMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vendor / Supplier Name</label>
                <input
                  type="text"
                  placeholder="e.g. Metro Cash & Carry"
                  value={newItemSupplier}
                  onChange={(e) => setNewItemSupplier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#ff6d00] hover:bg-[#e66200] text-white font-bold text-xs shadow-md"
                >
                  Save Stock Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADJUST STOCK (IN / OUT) */}
      {/* ========================================================================= */}
      {isAdjustStockModalOpen && selectedItemForAdjust && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-orange-600 uppercase">Stock Adjustment</span>
                <h3 className="font-serif text-base font-bold text-slate-900">{selectedItemForAdjust.name}</h3>
              </div>
              <button onClick={() => setIsAdjustStockModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div className="flex rounded-xl bg-slate-100 p-1 font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setAdjustType('IN')}
                  className={`flex-1 py-2 rounded-lg transition ${adjustType === 'IN' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'}`}
                >
                  + Stock In (Receive)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('OUT')}
                  className={`flex-1 py-2 rounded-lg transition ${adjustType === 'OUT' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'}`}
                >
                  - Stock Out (Issue)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantity to {adjustType === 'IN' ? 'Add' : 'Deduct'} ({selectedItemForAdjust.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-base outline-none text-center"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600 flex justify-between">
                <span>Current Stock:</span>
                <span className="font-bold">{selectedItemForAdjust.currentStock} {selectedItemForAdjust.unit}</span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustStockModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW PURCHASE ORDER */}
      {/* ========================================================================= */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900">New Purchase Order (PO)</h3>
              <button onClick={() => setIsPoModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vendor / Supplier *</label>
                <input
                  type="text"
                  required
                  value={poSupplier}
                  onChange={(e) => setPoSupplier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Items & Quantities</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. 50L Full Cream Milk, 10kg Butter, 25kg Basmati Rice"
                  value={poItemDescription}
                  onChange={(e) => setPoItemDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Purchase Valuation (₹)</label>
                <input
                  type="number"
                  required
                  value={poAmount}
                  onChange={(e) => setPoAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#ff6d00] hover:bg-[#e66200] text-white font-bold text-xs shadow-md"
                >
                  Dispatch PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
