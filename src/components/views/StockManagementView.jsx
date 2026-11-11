import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertCircle,
  Truck,
  ArrowDownRight,
  ArrowUpRight,
  Layers,
  Building2,
  CheckCircle2,
  Clock,
  X,
  Warehouse,
  Receipt,
  Trash2,
  Send,
  Check
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function StockManagementView() {
  const {
    showNotification,
    activeTab: contextActiveTab,
    setActiveTab: setContextActiveTab
  } = useDashboard();

  // Resolve active tab from context
  const resolveTab = (tab) => {
    if (tab === 'po' || tab === 'orders') return 'orders';
    if (tab === 'transfers') return 'transfers';
    return 'inventory';
  };

  const [activeTab, setActiveTab] = useState(() => resolveTab(contextActiveTab));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    if (contextActiveTab) {
      setActiveTab(resolveTab(contextActiveTab));
    }
  }, [contextActiveTab]);

  const handleTabChange = (t) => {
    setActiveTab(t);
    if (setContextActiveTab) {
      if (t === 'orders') setContextActiveTab('po');
      else setContextActiveTab(t);
    }
  };

  // Modals state
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [isNewReqModalOpen, setIsNewReqModalOpen] = useState(false);

  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState(null);
  const [adjustType, setAdjustType] = useState('IN');
  const [adjustQty, setAdjustQty] = useState('10');

  // Stock List State (Clean empty slate for real hotel creation)
  const [stockList, setStockList] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_inventory_items_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return [];
  });

  // Purchase Orders State (Clean empty slate)
  const [purchaseOrders, setPurchaseOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_purchase_orders_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return [];
  });

  // Department Requisitions & Transfers State (Clean empty slate)
  const [requisitions, setRequisitions] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_dept_requisitions_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return [];
  });

  // Form State: Add Item
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('F&B Raw Materials');
  const [newItemUnit, setNewItemUnit] = useState('Pieces');
  const [newItemStock, setNewItemStock] = useState('50');
  const [newItemThreshold, setNewItemThreshold] = useState('15');
  const [newItemCost, setNewItemCost] = useState('100');
  const [newItemSupplier, setNewItemSupplier] = useState('');

  // Form State: PO
  const [poSupplier, setPoSupplier] = useState('');
  const [poItems, setPoItems] = useState('');
  const [poAmount, setPoAmount] = useState('15000');

  // Form State: Requisition
  const [reqDept, setReqDept] = useState('Housekeeping');
  const [reqBy, setReqBy] = useState('Staff Requester');
  const [reqSkuId, setReqSkuId] = useState('');
  const [reqCustomItem, setReqCustomItem] = useState('');
  const [reqQty, setReqQty] = useState('10');
  const [reqNotes, setReqNotes] = useState('');

  // Persist State
  useEffect(() => {
    try {
      localStorage.setItem('aurastay_inventory_items_v2', JSON.stringify(stockList));
    } catch (e) { }
  }, [stockList]);

  useEffect(() => {
    try {
      localStorage.setItem('aurastay_purchase_orders_v2', JSON.stringify(purchaseOrders));
    } catch (e) { }
  }, [purchaseOrders]);

  useEffect(() => {
    try {
      localStorage.setItem('aurastay_dept_requisitions_v2', JSON.stringify(requisitions));
    } catch (e) { }
  }, [requisitions]);

  // Handle Add Item
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName) return;

    const newItem = {
      id: `SKU-${Date.now().toString().slice(-4)}`,
      name: newItemName,
      category: newItemCategory,
      unit: newItemUnit,
      currentStock: Number(newItemStock) || 0,
      minThreshold: Number(newItemThreshold) || 10,
      costPerUnit: Number(newItemCost) || 0,
      supplier: newItemSupplier || 'Vendor',
      status: Number(newItemStock) <= Number(newItemThreshold) ? 'LOW_STOCK' : 'IN_STOCK'
    };

    setStockList(prev => [newItem, ...prev]);
    setIsAddItemModalOpen(false);
    showNotification(`Added item ${newItem.name} to inventory.`);
    setNewItemName('');
    setNewItemSupplier('');
  };

  // Handle Create PO
  const handleCreatePo = (e) => {
    e.preventDefault();
    if (!poSupplier || !poItems) {
      showNotification('Please enter supplier name and items list.', 'error');
      return;
    }

    const newPo = {
      id: `PO-${Date.now().toString().slice(-4)}`,
      supplier: poSupplier,
      items: poItems,
      totalAmount: Number(poAmount) || 0,
      orderDate: new Date().toLocaleDateString('en-GB'),
      status: 'DISPATCHED'
    };

    setPurchaseOrders(prev => [newPo, ...prev]);
    setIsPoModalOpen(false);
    showNotification(`Purchase Order #${newPo.id} sent to ${poSupplier}.`);
    setPoSupplier('');
    setPoItems('');
  };

  // Handle Create Requisition
  const handleCreateRequisition = (e) => {
    e.preventDefault();
    const selItem = stockList.find(s => s.id === reqSkuId);
    const itemName = selItem?.name || reqCustomItem || 'Store Items';

    const newReq = {
      id: `REQ-${Date.now().toString().slice(-4)}`,
      department: reqDept,
      requestedBy: reqBy || 'Department Staff',
      skuId: reqSkuId || 'CUSTOM-SKU',
      itemName: itemName,
      qty: Number(reqQty) || 1,
      reqDate: new Date().toLocaleDateString('en-GB'),
      status: 'PENDING',
      notes: reqNotes
    };

    setRequisitions(prev => [newReq, ...prev]);
    setIsNewReqModalOpen(false);
    showNotification(`Requisition #${newReq.id} created for ${reqDept}.`);
    setReqCustomItem('');
    setReqNotes('');
  };

  // Approve Requisition & Deduct Stock
  const handleApproveRequisition = (req) => {
    setStockList(prev => prev.map(s => {
      if (s.id === req.skuId) {
        const updatedStock = Math.max(0, s.currentStock - req.qty);
        return {
          ...s,
          currentStock: updatedStock,
          status: updatedStock === 0 ? 'OUT_OF_STOCK' : updatedStock <= s.minThreshold ? 'LOW_STOCK' : 'IN_STOCK'
        };
      }
      return s;
    }));

    setRequisitions(prev => prev.map(r => r.id === req.id ? { ...r, status: 'APPROVED_ISSUED' } : r));
    showNotification(`Requisition #${req.id} approved & ${req.qty} units issued to ${req.department}.`);
  };

  // Adjust Stock (Receive / Issue)
  const handleAdjustStockSubmit = (e) => {
    e.preventDefault();
    if (!selectedItemForAdjust) return;

    const delta = Number(adjustQty) || 0;
    setStockList(prev => prev.map(item => {
      if (item.id === selectedItemForAdjust.id) {
        const newStock = adjustType === 'IN'
          ? item.currentStock + delta
          : Math.max(0, item.currentStock - delta);

        let status = 'IN_STOCK';
        if (newStock === 0) status = 'OUT_OF_STOCK';
        else if (newStock <= item.minThreshold) status = 'LOW_STOCK';

        return {
          ...item,
          currentStock: newStock,
          status
        };
      }
      return item;
    }));

    setIsAdjustStockModalOpen(false);
    showNotification(`Stock for ${selectedItemForAdjust.name} adjusted by ${adjustType === 'IN' ? '+' : '-'}${delta} ${selectedItemForAdjust.unit}.`);
  };

  // Mark PO Received (GRN)
  const handleMarkPoReceived = (po) => {
    setPurchaseOrders(prev => prev.map(p => p.id === po.id ? { ...p, status: 'RECEIVED' } : p));
    showNotification(`Purchase Order #${po.id} marked as Received (GRN recorded).`);
  };

  // Metrics
  const totalValuation = stockList.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);
  const lowStockCount = stockList.filter(item => item.status === 'LOW_STOCK').length;
  const outOfStockCount = stockList.filter(item => item.status === 'OUT_OF_STOCK').length;

  const filteredItems = useMemo(() => {
    return stockList.filter(item => {
      const matchSearch = String(item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [stockList, searchTerm, selectedCategory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* 1. Header Banner */}
        <div className="bg-gradient-to-r from-[#1c322b] via-[#24433a] to-[#2d564b] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                CENTRAL STORES & INVENTORY
              </span>
              <span className="text-xs text-emerald-200/80 font-mono">• Exceed HMS Module</span>
            </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                Stock, Requisitions & Procurement
              </h1>
                <p className="text-xs text-emerald-200 mt-1 max-w-xl leading-relaxed">
                  Live SKU asset valuation, automated low-stock reorder thresholds, inter-department requisitions, and Purchase Order tracking.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeTab === 'inventory' && (
                  <button
                    onClick={() => setIsAddItemModalOpen(true)}
                    className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Stock Item (SKU)</span>
                  </button>
                )}

                {activeTab === 'orders' && (
                  <button
                    onClick={() => setIsPoModalOpen(true)}
                    className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Purchase Order</span>
                  </button>
                )}

                {activeTab === 'transfers' && (
                  <button
                    onClick={() => setIsNewReqModalOpen(true)}
                    className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Material Requisition</span>
                  </button>
                )}
              </div>
          </div>

          {/* 2. Top Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Card 1: Total Asset Valuation */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Asset Valuation</span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center">
                    <Warehouse className="w-4 h-4 text-emerald-800" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">₹{totalValuation.toLocaleString('en-IN')}</div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Live warehouse inventory</span>
                  </div>
                </div>
              </div>

                {/* Card 2: Low Stock Alerts */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Low Stock Alerts</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">{lowStockCount} Items</div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      <span>Below safety reorder level</span>
                    </div>
                  </div>
                </div>

                  {/* Card 3: Pending Requisitions */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Requisitions</span>
                      <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-sky-600" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">{requisitions.filter(r => r.status === 'PENDING').length} Requests</div>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-slate-500">
                        <span>Awaiting store approval</span>
                      </div>
                    </div>
                  </div>

                    {/* Card 4: Active Purchase Orders */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Purchase Orders</span>
                        <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                          <Truck className="w-4 h-4 text-purple-600" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">{purchaseOrders.length} POs</div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-slate-500">
                          <span>Vendors: {new Set(stockList.map(s => s.supplier)).size}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Sub-Tabs */}
                    <div className="bg-white rounded-2xl p-1.5 border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleTabChange('inventory')}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${activeTab === 'inventory'
                              ? 'bg-[#24433a] text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                            }`}
                        >
                          <Package className="w-4 h-4" />
                          <span>Stock Balance & Inventory ({stockList.length} SKUs)</span>
                        </button>

                        <button
                          onClick={() => handleTabChange('orders')}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${activeTab === 'orders'
                              ? 'bg-[#24433a] text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                            }`}
                        >
                          <Truck className="w-4 h-4" />
                          <span>Purchase Orders & GRN ({purchaseOrders.length})</span>
                        </button>

                        <button
                          onClick={() => handleTabChange('transfers')}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${activeTab === 'transfers'
                              ? 'bg-[#24433a] text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                            }`}
                        >
                          <Layers className="w-4 h-4" />
                          <span>Requisitions & Department Transfers ({requisitions.length})</span>
                        </button>
                      </div>

                      {/* Right status indicator */}
                      <div className="hidden sm:flex items-center gap-2 pr-3 text-[11px] font-semibold text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Central Stores Active</span>
                      </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* TAB 1: INVENTORY ITEMS MASTER */}
                    {/* ========================================================================= */}
                    {activeTab === 'inventory' && (
                      <div className="space-y-4">
                        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Search item, SKU or supplier..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              />
                            </div>

                            <select
                              value={selectedCategory}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 outline-none"
                            >
                              <option value="ALL">All Categories</option>
                              <option value="F&B Raw Materials">F&B Raw Materials</option>
                              <option value="Beverage & Bar">Beverage & Bar</option>
                              <option value="Housekeeping Linens">Housekeeping Linens</option>
                              <option value="Guest Amenities">Guest Amenities</option>
                            </select>
                          </div>

                          <div className="text-xs font-semibold text-slate-500">
                            Showing {filteredItems.length} of {stockList.length} items
                          </div>
                        </div>

                        {filteredItems.length === 0 ? (
                          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
                            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                              <Warehouse className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">No Inventory Items Recorded</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                              Your central store is clean. Click below to add hotel inventory items, amenities, or raw materials.
                            </p>
                            <button
                              onClick={() => setIsAddItemModalOpen(true)}
                              className="mt-4 px-4 py-2 bg-[#24433a] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                            >
                              + Add Stock Item (SKU)
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                  <tr>
                                    <th className="py-3.5 px-4">SKU Code</th>
                                    <th className="py-3.5 px-4">Item Name</th>
                                    <th className="py-3.5 px-4">Category</th>
                                    <th className="py-3.5 px-4">Current Stock</th>
                                    <th className="py-3.5 px-4">Min Threshold</th>
                                    <th className="py-3.5 px-4">Unit Cost</th>
                                    <th className="py-3.5 px-4">Total Value</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-900">{item.id}</td>
                                      <td className="py-3.5 px-4 font-bold text-slate-900">
                                        {item.name}
                                        <span className="block text-[10px] text-slate-400 font-normal">{item.supplier}</span>
                                      </td>
                                      <td className="py-3.5 px-4 text-slate-600">{item.category}</td>
                                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">
                                        {item.currentStock} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                                      </td>
                                      <td className="py-3.5 px-4 font-mono text-slate-500">{item.minThreshold} {item.unit}</td>
                                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">₹{item.costPerUnit}</td>
                                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">₹{(item.currentStock * item.costPerUnit).toLocaleString()}</td>
                                      <td className="py-3.5 px-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${item.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-800' :
                                            item.status === 'LOW_STOCK' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                              'bg-rose-100 text-rose-800'
                                          }`}>
                                          {item.status.replace('_', ' ')}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-right space-x-1">
                                        <button
                                          onClick={() => {
                                            setSelectedItemForAdjust(item);
                                            setAdjustType('IN');
                                            setIsAdjustStockModalOpen(true);
                                          }}
                                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 text-xs transition cursor-pointer"
                                        >
                                          + Receive
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedItemForAdjust(item);
                                            setAdjustType('OUT');
                                            setIsAdjustStockModalOpen(true);
                                          }}
                                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-200 text-xs transition cursor-pointer"
                                        >
                                          - Issue
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 2: PURCHASE ORDERS & GRN */}
                    {/* ========================================================================= */}
                    {activeTab === 'orders' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">Purchase Orders & Goods Receipt Notes (GRN)</h3>
                            <p className="text-xs text-slate-500">Track vendor orders, scheduled deliveries, and receiving inspection.</p>
                          </div>
                          <button
                            onClick={() => setIsPoModalOpen(true)}
                            className="px-3.5 py-2 bg-[#24433a] hover:bg-[#1c322b] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Create Purchase Order</span>
                          </button>
                        </div>

                        {purchaseOrders.length === 0 ? (
                          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
                            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                              <Truck className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">No Purchase Orders Created</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                              You haven't dispatched any vendor orders yet. Click below to generate an official Purchase Order.
                            </p>
                            <button
                              onClick={() => setIsPoModalOpen(true)}
                              className="mt-4 px-4 py-2 bg-[#24433a] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                            >
                              + Create Purchase Order
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {purchaseOrders.map(po => (
                              <div key={po.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition space-y-3 flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                                        {po.id}
                                      </span>
                                      <h4 className="font-bold text-slate-900 text-sm mt-1">{po.supplier}</h4>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${po.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                                      }`}>
                                      {po.status}
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 mt-2">
                                    {po.items}
                                  </p>

                                  <div className="flex justify-between items-center pt-2 text-xs">
                                    <span className="text-slate-400 font-mono">Date: {po.orderDate}</span>
                                    <span className="font-mono font-black text-slate-900 text-sm">₹{po.totalAmount.toLocaleString()}</span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                  {po.status !== 'RECEIVED' ? (
                                    <button
                                      onClick={() => handleMarkPoReceived(po)}
                                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Mark Received (GRN) ✓</span>
                                    </button>
                                  ) : (
                                    <span className="text-emerald-700 font-bold text-xs flex items-center space-x-1">
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>Stock Inward Completed</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 3: REQUISITIONS & DEPARTMENT TRANSFERS */}
                    {/* ========================================================================= */}
                    {activeTab === 'transfers' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">Department Material Requisitions</h3>
                            <p className="text-xs text-slate-500">Internal stock issues from Central Stores to Front Desk, Housekeeping, Kitchen, and Banquets.</p>
                          </div>
                          <button
                            onClick={() => setIsNewReqModalOpen(true)}
                            className="px-3.5 py-2 bg-[#24433a] hover:bg-[#1c322b] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>New Material Requisition</span>
                          </button>
                        </div>

                        {requisitions.length === 0 ? (
                          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
                            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                              <Layers className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">No Requisitions Logged</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                              No internal stock requests have been raised yet. Click below to submit a department material requisition.
                            </p>
                            <button
                              onClick={() => setIsNewReqModalOpen(true)}
                              className="mt-4 px-4 py-2 bg-[#24433a] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                            >
                              + New Material Requisition
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                  <tr>
                                    <th className="py-3.5 px-4">Req #</th>
                                    <th className="py-3.5 px-4">Requesting Department</th>
                                    <th className="py-3.5 px-4">Requested By</th>
                                    <th className="py-3.5 px-4">Item & SKU</th>
                                    <th className="py-3.5 px-4">Requested Qty</th>
                                    <th className="py-3.5 px-4">Date</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {requisitions.map(req => (
                                    <tr key={req.id} className="hover:bg-slate-50/60 transition">
                                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-900">{req.id}</td>
                                      <td className="py-3.5 px-4 font-bold text-slate-900">
                                        {req.department}
                                        {req.notes && <span className="block text-[10px] text-slate-400 font-normal italic">{req.notes}</span>}
                                      </td>
                                      <td className="py-3.5 px-4 text-slate-700 font-medium">{req.requestedBy}</td>
                                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                                        {req.itemName}
                                        <span className="block text-[10px] text-slate-400 font-mono">{req.skuId}</span>
                                      </td>
                                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">{req.qty} units</td>
                                      <td className="py-3.5 px-4 text-slate-500 font-mono">{req.reqDate}</td>
                                      <td className="py-3.5 px-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${req.status === 'APPROVED_ISSUED' ? 'bg-emerald-100 text-emerald-800' :
                                            'bg-amber-100 text-amber-800'
                                          }`}>
                                          {req.status === 'APPROVED_ISSUED' ? 'ISSUED ✓' : 'PENDING'}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-right space-x-1">
                                        {req.status === 'PENDING' ? (
                                          <button
                                            onClick={() => handleApproveRequisition(req)}
                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition shadow-2xs cursor-pointer"
                                          >
                                            Approve & Issue ✓
                                          </button>
                                        ) : (
                                          <span className="text-[11px] text-emerald-700 font-semibold">Stock Issued</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* MODAL: ADD SKU ITEM */}
                    {/* ========================================================================= */}
                    {isAddItemModalOpen && (
                      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-900">Add Stock Item (SKU)</h3>
                            <button onClick={() => setIsAddItemModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <form onSubmit={handleAddItem} className="space-y-3 text-xs">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Item Description / Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Arabica Coffee, Bath Towels, Milk"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Category</label>
                                <select
                                  value={newItemCategory}
                                  onChange={(e) => setNewItemCategory(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                  <option value="F&B Raw Materials">F&B Raw Materials</option>
                                  <option value="Beverage & Bar">Beverage & Bar</option>
                                  <option value="Housekeeping Linens">Housekeeping Linens</option>
                                  <option value="Guest Amenities">Guest Amenities</option>
                                  <option value="Maintenance & Spares">Maintenance & Spares</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Measurement Unit</label>
                                <input
                                  type="text"
                                  placeholder="Pieces, Kg, Liters, Packs"
                                  value={newItemUnit}
                                  onChange={(e) => setNewItemUnit(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Initial Qty</label>
                                <input
                                  type="number"
                                  value={newItemStock}
                                  onChange={(e) => setNewItemStock(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Min Safety Level</label>
                                <input
                                  type="number"
                                  value={newItemThreshold}
                                  onChange={(e) => setNewItemThreshold(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-amber-700"
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Unit Cost (₹)</label>
                                <input
                                  type="number"
                                  value={newItemCost}
                                  onChange={(e) => setNewItemCost(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-emerald-800"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Primary Vendor / Supplier</label>
                              <input
                                type="text"
                                placeholder="e.g. Metro Cash & Carry, Local Distributor"
                                value={newItemSupplier}
                                onChange={(e) => setNewItemSupplier(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setIsAddItemModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-[#24433a] hover:bg-[#1c322b] text-white font-bold shadow-md cursor-pointer"
                              >
                                Add Item to Inventory
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* MODAL: STOCK IN / STOCK OUT ADJUSTMENT */}
                    {/* ========================================================================= */}
                    {isAdjustStockModalOpen && selectedItemForAdjust && (
                      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-lg text-slate-900">
                                {adjustType === 'IN' ? '+ Receive Stock (Inward)' : '- Issue Stock (Department)'}
                              </h3>
                              <button onClick={() => setIsAdjustStockModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                              </button>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-2xl mb-4 border border-slate-100 text-xs">
                            <span className="font-bold text-slate-900">{selectedItemForAdjust.name}</span>
                            <span className="text-slate-500 block">Current Stock: {selectedItemForAdjust.currentStock} {selectedItemForAdjust.unit}</span>
                          </div>

                          <form onSubmit={handleAdjustStockSubmit} className="space-y-3 text-xs">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">
                                Quantity to {adjustType === 'IN' ? 'Receive' : 'Issue'} ({selectedItemForAdjust.unit})
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={adjustQty}
                                onChange={(e) => setAdjustQty(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-black text-base"
                                required
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setIsAdjustStockModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className={`px-4 py-2 rounded-xl text-white font-bold shadow-md cursor-pointer ${adjustType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                                  }`}
                              >
                                Confirm Adjustment
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* MODAL: CREATE REQUISITION */}
                    {/* ========================================================================= */}
                    {isNewReqModalOpen && (
                      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-900">New Material Requisition</h3>
                            <button onClick={() => setIsNewReqModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <form onSubmit={handleCreateRequisition} className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Department</label>
                                <select
                                  value={reqDept}
                                  onChange={(e) => setReqDept(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                                >
                                  <option value="Housekeeping">Housekeeping</option>
                                  <option value="F&B Restaurant Kitchen">F&B Restaurant Kitchen</option>
                                  <option value="Front Desk / Lobby">Front Desk / Lobby</option>
                                  <option value="Banquets & Events">Banquets & Events</option>
                                  <option value="Maintenance / Engineering">Maintenance / Engineering</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Requested By</label>
                                <input
                                  type="text"
                                  value={reqBy}
                                  onChange={(e) => setReqBy(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Select Store SKU Item</label>
                              {stockList.length > 0 ? (
                                <select
                                  value={reqSkuId}
                                  onChange={(e) => setReqSkuId(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                                >
                                  <option value="">Select an Item</option>
                                  {stockList.map(s => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} ({s.id}) - Stock: {s.currentStock} {s.unit}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Enter item description (e.g. Linen Sets, Tea Bags)"
                                  value={reqCustomItem}
                                  onChange={(e) => setReqCustomItem(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                                  required
                                />
                              )}
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Quantity Required</label>
                              <input
                                type="number"
                                min="1"
                                value={reqQty}
                                onChange={(e) => setReqQty(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                                required
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Reason / Usage</label>
                              <textarea
                                rows={2}
                                placeholder="e.g. Replenish room amenities, breakfast buffet ingredients..."
                                value={reqNotes}
                                onChange={(e) => setReqNotes(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setIsNewReqModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-[#24433a] hover:bg-[#1c322b] text-white font-bold shadow-md cursor-pointer"
                              >
                                Submit Requisition
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* MODAL: CREATE PO */}
                    {/* ========================================================================= */}
                    {isPoModalOpen && (
                      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-900">Create Purchase Order (PO)</h3>
                            <button onClick={() => setIsPoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <form onSubmit={handleCreatePo} className="space-y-3 text-xs">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Vendor / Supplier</label>
                              <input
                                type="text"
                                placeholder="e.g. Metro Cash & Carry, Amul, Local Vendor"
                                value={poSupplier}
                                onChange={(e) => setPoSupplier(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                                required
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Items Description</label>
                              <textarea
                                rows={3}
                                placeholder="List of SKUs, quantities, and specifications..."
                                value={poItems}
                                onChange={(e) => setPoItems(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                required
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Estimated Total Value (₹)</label>
                              <input
                                type="number"
                                value={poAmount}
                                onChange={(e) => setPoAmount(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-emerald-800"
                                required
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setIsPoModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-[#24433a] hover:bg-[#1c322b] text-white font-bold shadow-md cursor-pointer"
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
