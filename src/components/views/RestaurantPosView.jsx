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
  { id: 'T1', name: 'Table 01', area: 'Main Dining', seats: 4, status: 'VACANT', currentOrder: null },
  { id: 'T2', name: 'Table 02', area: 'Main Dining', seats: 4, status: 'OCCUPIED', currentOrder: { items: 2, total: 540 } },
  { id: 'T3', name: 'Table 03', area: 'Main Dining', seats: 2, status: 'VACANT', currentOrder: null },
  { id: 'T4', name: 'Table 04', area: 'Main Dining', seats: 6, status: 'VACANT', currentOrder: null },
  { id: 'P1', name: 'Table P1', area: 'Poolside', seats: 4, status: 'VACANT', currentOrder: null },
  { id: 'P2', name: 'Table P2', area: 'Poolside', seats: 4, status: 'VACANT', currentOrder: null },
  { id: 'P3', name: 'Table P3', area: 'Poolside', seats: 2, status: 'VACANT', currentOrder: null },
  { id: 'R1', name: 'Table R1', area: 'Rooftop', seats: 4, status: 'VACANT', currentOrder: null },
  { id: 'R2', name: 'Table R2', area: 'Rooftop', seats: 6, status: 'VACANT', currentOrder: null },
  { id: 'R3', name: 'Table R3', area: 'Rooftop', seats: 2, status: 'VACANT', currentOrder: null }
];

const MENU_ITEMS = [
  { id: 'M-1', name: 'Paneer Tikka', category: 'Starters', price: 280, isVeg: true, desc: 'Chargrilled cottage cheese marinated with hung curd and spices' },
  { id: 'M-2', name: 'Crispy Corn Salt & Pepper', category: 'Starters', price: 220, isVeg: true, desc: 'Sweet golden corn kernels tossed with wok peppers' },
  { id: 'M-3', name: 'Chicken Tikka Angara', category: 'Starters', price: 340, isVeg: false, desc: 'Spiced tender chicken roasted in traditional clay oven' },
  { id: 'M-4', name: 'Veg Spring Rolls (6 pcs)', category: 'Starters', price: 210, isVeg: true, desc: 'Crispy rolls stuffed with seasoned shredded vegetables' },
  { id: 'M-5', name: 'Tandoori Chicken Wings', category: 'Starters', price: 320, isVeg: false, desc: 'Marinated roasted juicy chicken wings' },
  { id: 'M-6', name: 'Paneer Butter Masala', category: 'Mains', price: 320, isVeg: true, desc: 'Fresh paneer cooked in creamy tomato butter gravy' },
  { id: 'M-7', name: 'Dal Makhani Royal', category: 'Mains', price: 260, isVeg: true, desc: 'Slow simmered black lentils with cream and butter' },
  { id: 'M-8', name: 'Murgh Makhani (Butter Chicken)', category: 'Mains', price: 380, isVeg: false, desc: 'Boneless tandoori chicken in rich silk makhani gravy' },
  { id: 'M-9', name: 'Kadhai Paneer', category: 'Mains', price: 310, isVeg: true, desc: 'Cottage cheese with capsicum, onion and crushed spices' },
  { id: 'M-10', name: 'Awadhi Veg Biryani', category: 'Mains', price: 280, isVeg: true, desc: 'Fragrant basmati rice dum cooked with vegetables and saffron' },
  { id: 'M-11', name: 'Chicken Dum Biryani', category: 'Mains', price: 360, isVeg: false, desc: 'Hyderabadi style slow cooked chicken biryani with mirchi ka salan' },
  { id: 'M-12', name: 'Butter Naan', category: 'Breads', price: 50, isVeg: true, desc: 'Refined flour bread cooked in tandoor with butter' },
  { id: 'M-13', name: 'Garlic Naan', category: 'Breads', price: 70, isVeg: true, desc: 'Flavored with minced fresh garlic and coriander' },
  { id: 'M-14', name: 'Tandoori Roti', category: 'Breads', price: 30, isVeg: true, desc: 'Whole wheat flatbread baked in clay oven' },
  { id: 'M-15', name: 'Fresh Lime Soda (Sweet/Salt)', category: 'Drinks', price: 90, isVeg: true, desc: 'Chilled bubbly soda with fresh lime juice' },
  { id: 'M-16', name: 'Masala Chai', category: 'Drinks', price: 40, isVeg: true, desc: 'Traditional Indian tea infused with cardamom and ginger' },
  { id: 'M-17', name: 'Cold Coffee with Ice Cream', category: 'Drinks', price: 140, isVeg: true, desc: 'Creamy chilled blended espresso with vanilla scoop' },
  { id: 'M-18', name: 'Mango Lassi', category: 'Drinks', price: 110, isVeg: true, desc: 'Rich whipped yogurt blended with Alphonso mango pulp' },
  { id: 'M-19', name: 'Gulab Jamun (2 pcs)', category: 'Desserts', price: 110, isVeg: true, desc: 'Warm milk dumplings soaked in rose flavored saffron syrup' },
  { id: 'M-20', name: 'Rasmalai (2 pcs)', category: 'Desserts', price: 140, isVeg: true, desc: 'Soft cottage cheese discs in thickened saffron pistachios milk' }
];

export default function RestaurantPosView() {
  const { navigateTo, showNotification, fnbOrders = [], addFnbOrder, settleFnbOrder, rooms = [], currentHotel } = useDashboard();

  const [tables, setTables] = useState(TABLES_DATA);
  const [menuItems, setMenuItems] = useState(MENU_ITEMS);

  const [activeArea, setActiveArea] = useState('ALL');
  const [selectedTable, setSelectedTable] = useState(tables[0] || null);
  const [cart, setCart] = useState([]);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('ALL');

  // Modals
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [newTable, setNewTable] = useState({
    name: 'Table 01',
    area: 'Main Dining',
    seats: 4
  });

  const areas = ['ALL', 'Main Dining', 'Poolside', 'Rooftop'];
  const menuCats = ['ALL', 'Starters', 'Mains', 'Breads', 'Drinks', 'Desserts'];

  const filteredTables = activeArea === 'ALL'
    ? tables
    : tables.filter(t => t.area === activeArea);

  const filteredMenu = selectedMenuCategory === 'ALL'
    ? menuItems
    : menuItems.filter(m => m.category === selectedMenuCategory);

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

  const handleAddTable = (e) => {
    e.preventDefault();
    const created = {
      id: `T-${Date.now().toString().slice(-4)}`,
      name: newTable.name,
      area: newTable.area,
      seats: Number(newTable.seats) || 4,
      status: 'VACANT',
      guest: null,
      room: null,
      items: 0,
      total: 0,
      time: null
    };
    const updated = [...tables, created];
    setTables(updated);
    setSelectedTable(created);
    setIsAddTableModalOpen(false);
    showNotification(`${created.name} added to ${created.area}!`);
  };

  const handlePrintKot = () => {
    if (cart.length === 0) {
      showNotification('Please add dishes to cart before sending to kitchen KOT.');
      return;
    }
    const orderItemsSummary = cart.map(i => `${i.qty}x ${i.name}`).join(', ');
    const kotId = `KOT-${Date.now().toString().slice(-4)}`;
    const newKotOrder = {
      orderId: kotId,
      roomTable: selectedTable?.name || 'Table 01',
      guest: selectedTable?.guest || 'Dine-In Guest',
      items: orderItemsSummary,
      total: grandTotal,
      status: 'PREPARING',
      time: 'Just now'
    };

    if (addFnbOrder) {
      addFnbOrder(newKotOrder);
    }

    const updated = tables.map(t => t.id === selectedTable?.id ? {
      ...t,
      status: 'OCCUPIED',
      items: cart.reduce((s, it) => s + it.qty, 0),
      total: grandTotal
    } : t);
    setTables(updated);

    // Open Kitchen Slip print window
    const printWindow = window.open('', '_blank', 'width=450,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>KOT #${kotId}</title>
          <style>
            body { font-family: monospace; padding: 16px; font-size: 13px; color: #000; }
            .center { text-align: center; }
            .line { border-bottom: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; margin: 8px 0; }
            th, td { text-align: left; padding: 5px 0; font-size: 13px; }
            .qty { text-align: right; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2 style="margin:0 0 4px 0; font-size:16px;">KITCHEN ORDER TICKET (KOT)</h2>
            <p style="margin:2px 0;"><strong>${currentHotel?.name || 'Hotel Dining'}</strong></p>
            <p style="margin:2px 0;">Token: <strong>#${kotId}</strong> | ${new Date().toLocaleTimeString()}</p>
            <p style="margin:4px 0 0; font-size: 15px;"><strong>${selectedTable?.name || 'Table'} (${selectedTable?.area || 'Dining'})</strong></p>
          </div>
          <div class="line"></div>
          <table>
            <thead>
              <tr><th>ITEM</th><th class="qty">QTY</th></tr>
            </thead>
            <tbody>
              ${cart.map(i => `<tr><td>${i.name}</td><td class="qty"><strong>x${i.qty}</strong></td></tr>`).join('')}
            </tbody>
          </table>
          <div class="line"></div>
          <div class="center" style="margin-top:12px;">
            <p style="margin:0; font-size:11px;">* Dispatched to Chef & KDS *</p>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 300);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }

    showNotification(`KOT #${kotId} sent to Kitchen Display System (KDS)! Items: ${orderItemsSummary}`);
  };

  const handleSettleTable = () => {
    if (!selectedTable) return;
    const updated = tables.map(t => t.id === selectedTable.id ? { ...t, status: 'VACANT', guest: null, room: null, items: 0, total: 0 } : t);
    setTables(updated);

    if (settleFnbOrder) {
      const activeOrder = fnbOrders.find(o => o.roomTable === selectedTable.name && o.status !== 'BILLED');
      if (activeOrder) {
        settleFnbOrder(activeOrder.orderId);
      }
    }

    setCart([]);
    showNotification(`Bill ₹${grandTotal} settled via UPI/Card. ${selectedTable.name} ready for next guest.`);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* 1. Breadcrumb */}
      <div className="flex items-center space-x-1.5 text-xs text-slate-500 pb-1 border-b border-slate-200">
        <span
          onClick={() => navigateTo('master-service-home')}
          className="hover:text-slate-900 cursor-pointer transition flex items-center gap-1"
        >
          🏨 Home
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
              AAVASA HMS
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
            onClick={() => setIsAddTableModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dining Table</span>
          </button>
        </div>
      </div>

      {/* 3. Operational Status Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs text-xs">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="font-bold text-slate-700 whitespace-nowrap">Dining Area:</span>
          {areas.map(ar => (
            <button
              key={ar}
              onClick={() => setActiveArea(ar)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition whitespace-nowrap ${activeArea === ar
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
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Vacant: {tables.filter(t => t.status === 'VACANT').length}
          </span>
          <span className="flex items-center gap-1.5 text-blue-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Occupied: {tables.filter(t => t.status === 'OCCUPIED').length}
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> KOT Cooking: {fnbOrders.filter(o => o.status === 'PREPARING').length}
          </span>
          <span className="flex items-center gap-1.5 text-purple-700">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Billing: {tables.filter(t => t.status === 'BILLING').length}
          </span>
        </div>
      </div>

      {/* 4. Split Layout: Tables Grid + POS Order Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Tables Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredTables.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-200 shadow-2xs">
                <Utensils className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No Dining Tables Configured</p>
                <p className="text-xs text-slate-400 mt-0.5">Click "Add Dining Table" to create tables for Main Dining, Poolside, or Rooftop.</p>
                <button
                  onClick={() => setIsAddTableModalOpen(true)}
                  className="mt-3.5 px-3.5 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white text-xs font-bold rounded-lg shadow-2xs transition"
                >
                  + Add Dining Table
                </button>
              </div>
            ) : (
              filteredTables.map(t => {
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
              })
            )}
          </div>

          {/* Quick Menu Selection */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">
                Menu Dishes {selectedTable ? <>for <strong>{selectedTable.name}</strong></> : null}
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
              {filteredMenu.length === 0 ? (
                <div className="col-span-full py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <Coffee className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-700">No Menu Dishes Found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Configure items in Product Setup to take restaurant orders.</p>
                  <button
                    onClick={() => navigateTo('product-setup')}
                    className="mt-2.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition"
                  >
                    Go to Product Setup
                  </button>
                </div>
              ) : (
                filteredMenu.map(m => (
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
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Active Order Cart & Folio Settle (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Table & Guest Summary Header */}
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-black text-base text-slate-900">{selectedTable ? selectedTable.name : 'No Table Selected'}</span>
                <span className="text-xs text-slate-500 block">
                  {selectedTable?.guest ? `${selectedTable.guest} (${selectedTable.room})` : 'Dining Session'}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-700 font-bold text-xs rounded-lg">
                POS Terminal
              </span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <p className="font-semibold text-slate-600">Cart is empty</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Select a dining table and click dishes to build an order.</p>
                </div>
              ) : (
                cart.map(it => (
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
                ))
              )}
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
              onClick={handlePrintKot}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Kitchen KOT</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (cart.length === 0) {
                    showNotification('No items in cart to post.');
                    return;
                  }
                  showNotification(`₹${grandTotal} posted to Guest Room Folio.`);
                }}
                className="py-2 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 rounded-lg text-xs font-bold transition"
              >
                Post to Room Folio
              </button>

              <button
                onClick={handleSettleTable}
                className="py-2 bg-[#ff6d00] hover:bg-[#e66200] text-white rounded-lg text-xs font-bold transition shadow-2xs"
              >
                Settle & Clear Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Table Modal */}
      {isAddTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#0e4860] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Add New Dining Table</h3>
              <button
                onClick={() => setIsAddTableModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Table Name / Number
                </label>
                <input
                  type="text"
                  value={newTable.name}
                  onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                  placeholder="e.g. Table 01 or Pool Deck 01"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Dining Area
                </label>
                <select
                  value={newTable.area}
                  onChange={(e) => setNewTable({ ...newTable, area: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="Main Dining">Main Dining</option>
                  <option value="Poolside">Poolside</option>
                  <option value="Rooftop">Rooftop</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newTable.seats}
                  onChange={(e) => setNewTable({ ...newTable, seats: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTableModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold shadow-2xs"
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
