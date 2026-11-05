import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  Utensils,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Printer,
  X,
  CreditCard,
  User,
  Coffee,
  Pizza,
  Wine,
  Trophy,
  SlidersHorizontal,
  ChevronRight,
  Flame,
  Check
} from 'lucide-react';

const TABLES_DATA = [
  { id: 'T-01', name: 'Table 01', area: 'Main Dining', seats: 2, status: 'OCCUPIED', guest: 'Dr. Alok Verma', room: 'Room 203', items: 3, total: 980, time: '22m ago' },
  { id: 'T-02', name: 'Table 02', area: 'Main Dining', seats: 4, status: 'VACANT', guest: null, room: null, items: 0, total: 0, time: null },
  { id: 'T-03', name: 'Table 03', area: 'Main Dining', seats: 4, status: 'KOT_PENDING', guest: 'Pooja Agarwal', room: 'Room 101', items: 4, total: 1420, time: '8m ago' },
  { id: 'T-04', name: 'Table 04', area: 'Main Dining', seats: 6, status: 'BILLING', guest: 'Sunil Rao', room: 'Walk-in', items: 5, total: 2150, time: '45m ago' },
  { id: 'T-05', name: 'Table 05', area: 'Main Dining', seats: 2, status: 'VACANT', guest: null, room: null, items: 0, total: 0, time: null },
  { id: 'T-06', name: 'Table 06', area: 'Main Dining', seats: 4, status: 'OCCUPIED', guest: 'Rajesh Mehra', room: 'Room 304', items: 2, total: 720, time: '14m ago' },
  { id: 'P-01', name: 'Pool Deck 01', area: 'Poolside', seats: 4, status: 'OCCUPIED', guest: 'Vikram Joshi', room: 'Room 402', items: 3, total: 1100, time: '30m ago' },
  { id: 'P-02', name: 'Pool Deck 02', area: 'Poolside', seats: 2, status: 'VACANT', guest: null, room: null, items: 0, total: 0, time: null },
  { id: 'R-01', name: 'Rooftop Lounge 01', area: 'Rooftop', seats: 6, status: 'OCCUPIED', guest: 'Kavita Sen', room: 'Room 308', items: 6, total: 3450, time: '55m ago' },
  { id: 'R-02', name: 'Rooftop Lounge 02', area: 'Rooftop', seats: 4, status: 'VACANT', guest: null, room: null, items: 0, total: 0, time: null },
];

const MENU_ITEMS = [
  { id: 'P-1', name: 'Paneer Butter Masala', category: 'Mains', price: 360, veg: true },
  { id: 'P-2', name: 'Murgh Dum Biryani', category: 'Mains', price: 450, veg: false },
  { id: 'P-3', name: 'Crispy Corn Salt & Pepper', category: 'Starters', price: 280, veg: true },
  { id: 'P-4', name: 'Tandoori Murgh (Half)', category: 'Starters', price: 320, veg: false },
  { id: 'P-5', name: 'Butter Naan', category: 'Breads', price: 65, veg: true },
  { id: 'P-6', name: 'Garlic Roti', category: 'Breads', price: 50, veg: true },
  { id: 'P-7', name: 'Fresh Mint Mojito', category: 'Drinks', price: 210, veg: true },
  { id: 'P-8', name: 'Cold Brew Coffee', category: 'Drinks', price: 160, veg: true },
  { id: 'P-9', name: 'Gulab Jamun with Rabri', category: 'Desserts', price: 180, veg: true },
];

export default function RestaurantPosView() {
  const { navigateTo, showNotification } = useDashboard();

  const [activeArea, setActiveArea] = useState('ALL');
  const [selectedTable, setSelectedTable] = useState(TABLES_DATA[0]);
  const [cart, setCart] = useState([]);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('ALL');

  const areas = ['ALL', 'Main Dining', 'Poolside', 'Rooftop'];
  const menuCats = ['ALL', 'Starters', 'Mains', 'Breads', 'Drinks', 'Desserts'];

  const filteredTables = activeArea === 'ALL'
    ? TABLES_DATA
    : TABLES_DATA.filter(t => t.area === activeArea);

  const filteredMenu = selectedMenuCategory === 'ALL'
    ? MENU_ITEMS
    : MENU_ITEMS.filter(m => m.category === selectedMenuCategory);

  const subtotal = cart.reduce((acc, it) => acc + (it.price * it.qty), 0);
  const gst = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + gst;

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : null;
      }
      return i;
    }).filter(Boolean));
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
        <span className="font-semibold text-slate-900">
          Restaurant & POS
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
            Restaurant POS & Table Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dine-in tables, room service billing, kitchen order tickets (KOT), and folio settlements.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigateTo('product-setup')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Product Setup</span>
          </button>

          <button
            onClick={() => navigateTo('stock-management')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Stock Inventory</span>
          </button>

          <button
            onClick={() => {
              showNotification(`New table order session opened for ${selectedTable.name}`);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#ff6d00] hover:bg-[#e66200] text-white rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Take New Order</span>
          </button>
        </div>
      </div>

      {/* 3. Operational Status Pills */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-700">Dining Area:</span>
          {areas.map(ar => (
            <button
              key={ar}
              onClick={() => setActiveArea(ar)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition ${activeArea === ar
                  ? 'bg-[#0e4860] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {ar}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-4 text-[11px] font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Vacant: 4
          </span>
          <span className="flex items-center gap-1.5 text-blue-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Occupied: 4
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> KOT Cooking: 1
          </span>
          <span className="flex items-center gap-1.5 text-purple-700">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Billing: 1
          </span>
        </div>
      </div>

      {/* 4. Split Layout: Tables Grid + POS Order Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Tables Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredTables.map(t => {
              const isSelected = selectedTable?.id === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTable(t)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${isSelected
                      ? 'border-[#ff6d00] ring-2 ring-orange-400/40 bg-orange-50/40 shadow-sm'
                      : t.status === 'VACANT'
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : t.status === 'OCCUPIED'
                          ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300'
                          : t.status === 'KOT_PENDING'
                            ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                            : 'bg-purple-50/50 border-purple-200 hover:border-purple-300'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-900">{t.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${t.status === 'VACANT' ? 'bg-emerald-100 text-emerald-800' :
                        t.status === 'OCCUPIED' ? 'bg-blue-100 text-blue-800' :
                          t.status === 'KOT_PENDING' ? 'bg-amber-100 text-amber-800' :
                            'bg-purple-100 text-purple-800'
                      }`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="my-2 space-y-1 text-xs">
                    <div className="text-[11px] text-slate-500">
                      {t.seats} Seats • {t.area}
                    </div>
                    {t.guest && (
                      <div className="font-bold text-slate-800 truncate">
                        {t.guest} <span className="text-[10px] text-slate-400 font-normal">({t.room})</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="font-black text-slate-900">
                      {t.total > 0 ? `₹${t.total.toLocaleString()}` : '—'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {t.time || 'Available'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Menu Selection */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">
                Quick Add Dishes to <strong>{selectedTable?.name}</strong>
              </span>

              <div className="flex items-center space-x-1">
                {menuCats.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedMenuCategory(cat)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${selectedMenuCategory === cat
                        ? 'bg-[#ff6d00] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredMenu.map(m => (
                <button
                  key={m.id}
                  onClick={() => addToCart(m)}
                  className="p-2.5 bg-slate-50 hover:bg-orange-50/70 border border-slate-200 hover:border-orange-300 rounded-lg text-left transition flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-xs text-slate-800 group-hover:text-orange-950 truncate block">
                      {m.name}
                    </span>
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ml-1 ${m.veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/50">
                    <span className="font-black text-xs text-slate-900">₹{m.price}</span>
                    <span className="text-[10px] font-bold text-orange-600">+ Add</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Active Order Cart & Folio Settle (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Table & Guest Summary Header */}
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-black text-base text-slate-900">{selectedTable?.name}</span>
                <span className="text-xs text-slate-500 block">
                  {selectedTable?.guest ? `${selectedTable.guest} (${selectedTable.room})` : 'Walk-in Dining Order'}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-700 font-bold text-xs rounded-lg">
                KOT Active
              </span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {cart.map(it => (
                <div key={it.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-slate-900 block truncate">{it.name}</span>
                    <span className="text-[10.5px] text-slate-400">₹{it.price} each</span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQty(it.id, -1)}
                        className="w-5 h-5 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100 rounded"
                      >
                        -
                      </button>
                      <span className="font-bold text-xs w-5 text-center">{it.qty}</span>
                      <button
                        onClick={() => updateQty(it.id, 1)}
                        className="w-5 h-5 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100 rounded"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-black text-slate-900 w-14 text-right">
                      ₹{it.price * it.qty}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Billing Calculation Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Food & Beverage Subtotal:</span>
                <span className="font-bold text-slate-800">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Restaurant GST (5%):</span>
                <span className="font-bold text-slate-800">₹{gst}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                <span>Total Bill Amount:</span>
                <span className="text-emerald-700">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: KOT Print, Room Folio, Settle */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => showNotification(`Kitchen Order Ticket (KOT #108) printed and dispatched!`)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Kitchen KOT</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => showNotification(`₹${grandTotal} transferred to Guest Room Folio (${selectedTable.room || 'Room 203'})`)}
                className="py-2 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 rounded-lg text-xs font-bold transition"
              >
                Post to Room Folio
              </button>

              <button
                onClick={() => showNotification(`Bill ₹${grandTotal} settled via UPI/Card. Table ready for cleaning.`)}
                className="py-2 bg-[#ff6d00] hover:bg-[#e66200] text-white rounded-lg text-xs font-bold transition shadow-2xs"
              >
                Settle & Clear Table
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
