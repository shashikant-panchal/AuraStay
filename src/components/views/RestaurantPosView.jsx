import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { compressImageFile } from '../../utils/imageCompression';
import {
  Utensils,
  Plus,
  Minus,
  Printer,
  CheckCircle2,
  Clock,
  CreditCard,
  Search,
  ChefHat,
  Coffee,
  Pizza,
  BedDouble,
  Users,
  Trash2,
  Edit3,
  Receipt,
  Sparkles,
  Check,
  X,
  ImagePlus
} from 'lucide-react';

const DEFAULT_AREAS = ['Main Dining', 'Garden Patio', 'Rooftop Deck', 'Bar & Lounge', 'Private Dining'];
const DEFAULT_KITCHEN_STATIONS = [
  'Hot Kitchen (Indian)',
  'Tandoor Clay Oven',
  'Pan Asian Wok',
  'Pizza & Continental',
  'Mocktail & Bar',
  'Halwai / Dessert Bar'
];

export default function RestaurantPosView() {
  const {
    navigateTo,
    showNotification,
    fnbOrders = [],
    restaurantTables = [],
    restaurantMenuItems = [],
    upsertRestaurantTable,
    deleteRestaurantTable,
    upsertRestaurantMenuItem,
    deleteRestaurantMenuItem,
    addFnbOrder,
    settleFnbOrder,
    addFolioCharge,
    rooms = [],
    currentHotel
  } = useDashboard();

  const tables = restaurantTables;
  const menuItems = restaurantMenuItems;

  const [selectedTableId, setSelectedTableId] = useState(null);
  const selectedTable = useMemo(
    () => tables.find(t => t.id === selectedTableId) || tables[0] || null,
    [tables, selectedTableId]
  );

  const [activeArea, setActiveArea] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchMenu, setSearchMenu] = useState('');
  const [cart, setCart] = useState([]);
  const [guestNameInput, setGuestNameInput] = useState('');

  // Modal states
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [editingTableId, setEditingTableId] = useState(null);
  const [newTableData, setNewTableData] = useState({
    name: '',
    area: 'Main Dining',
    seats: 4
  });

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    category: 'Main Course',
    kitchenStation: 'Hot Kitchen (Indian)',
    price: 350,
    costPrice: 120,
    taxPct: 5,
    isVeg: true,
    prepTime: '15 mins',
    description: '',
    imageUrl: ''
  });

  const [isRoomFolioModalOpen, setIsRoomFolioModalOpen] = useState(false);
  const [selectedTargetRoom, setSelectedTargetRoom] = useState('');

  const areas = useMemo(() => {
    const unique = Array.from(new Set(tables.map(t => t.area).filter(Boolean)));
    return ['ALL', ...unique];
  }, [tables]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(menuItems.map(m => m.category).filter(Boolean)));
    return ['ALL', ...unique];
  }, [menuItems]);

  const occupiedRooms = useMemo(() => {
    return (rooms || []).filter(r => r.status === 'OCCUPIED');
  }, [rooms]);

  const filteredTables = tables.filter(t => activeArea === 'ALL' || t.area === activeArea);

  const filteredMenu = menuItems.filter(m => {
    const matchesSearch =
      String(m.name || '').toLowerCase().includes(searchMenu.toLowerCase()) ||
      String(m.category || '').toLowerCase().includes(searchMenu.toLowerCase()) ||
      String(m.kitchenStation || '').toLowerCase().includes(searchMenu.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Table CRUD
  const openCreateTableModal = () => {
    setEditingTableId(null);
    setNewTableData({
      name: `T-${tables.length + 1}`,
      area: activeArea !== 'ALL' ? activeArea : 'Main Dining',
      seats: 4
    });
    setIsAddTableModalOpen(true);
  };

  const openEditTableModal = (table, e) => {
    e.stopPropagation();
    setEditingTableId(table.id);
    setNewTableData({
      name: table.name,
      area: table.area,
      seats: table.seats
    });
    setIsAddTableModalOpen(true);
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    const cleanName = String(newTableData.name || '').trim();
    if (!cleanName) {
      showNotification('Please provide a table name (e.g., T-1, Patio-2).');
      return;
    }

    const existing = editingTableId ? tables.find(t => t.id === editingTableId) : null;
    const res = await upsertRestaurantTable({
      ...(existing || {}),
      id: editingTableId || undefined,
      name: cleanName,
      area: String(newTableData.area || 'Main Dining').trim() || 'Main Dining',
      seats: parseInt(newTableData.seats, 10) || 4
    });

    if (res?.success) {
      if (res.table?.id) setSelectedTableId(res.table.id);
      setIsAddTableModalOpen(false);
      setEditingTableId(null);
      showNotification(
        editingTableId
          ? `Dining table ${cleanName} updated.`
          : `New table ${cleanName} added to ${currentHotel?.name || 'hotel'} floor plan.`
      );
    }
  };

  const handleDeleteTable = async (table, e) => {
    e.stopPropagation();
    if (table.status === 'OCCUPIED') {
      showNotification(`Settle active bill for ${table.name} before deleting it.`);
      return;
    }
    await deleteRestaurantTable(table.id);
    if (selectedTable?.id === table.id) {
      setSelectedTableId(null);
    }
    showNotification(`Removed table ${table.name}.`);
  };

  // Menu Item CRUD inside POS (syncs directly with ProductSetupView via Supabase)
  const openCreateMenuModal = () => {
    setEditingMenuId(null);
    setMenuForm({
      name: '',
      category: selectedCategory !== 'ALL' ? selectedCategory : 'Main Course',
      kitchenStation: 'Hot Kitchen (Indian)',
      price: 350,
      costPrice: 120,
      taxPct: 5,
      isVeg: true,
      prepTime: '15 mins',
      description: '',
      imageUrl: ''
    });
    setIsMenuModalOpen(true);
  };

  const openEditMenuModal = (item, e) => {
    e.stopPropagation();
    setEditingMenuId(item.id);
    setMenuForm({
      name: item.name,
      category: item.category || 'Main Course',
      kitchenStation: item.kitchenStation || 'Hot Kitchen (Indian)',
      price: item.price || 0,
      costPrice: item.costPrice || 0,
      taxPct: item.taxPct ?? 5,
      isVeg: item.isVeg !== false,
      prepTime: item.prepTime || '15 mins',
      description: item.description || '',
      imageUrl: item.imageUrl || ''
    });
    setIsMenuModalOpen(true);
  };

  const handleMenuImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, { maxDim: 280, maxBytes: 24 * 1024 });
      setMenuForm(prev => ({ ...prev, imageUrl: compressed }));
      showNotification('Dish photo compressed for fast loading.');
    } catch {
      showNotification('Could not process selected image.');
    }
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    const cleanName = String(menuForm.name || '').trim();
    if (!cleanName) {
      showNotification('Please enter a menu item name.');
      return;
    }
    const existing = editingMenuId ? menuItems.find(m => m.id === editingMenuId) : null;
    const res = await upsertRestaurantMenuItem({
      ...(existing || {}),
      id: editingMenuId || undefined,
      name: cleanName,
      category: String(menuForm.category || 'Main Course').trim(),
      kitchenStation: menuForm.kitchenStation,
      price: Number(menuForm.price) || 0,
      costPrice: Number(menuForm.costPrice) || 0,
      taxPct: Number(menuForm.taxPct ?? 5),
      isVeg: Boolean(menuForm.isVeg),
      prepTime: menuForm.prepTime || '15 mins',
      description: menuForm.description || '',
      imageUrl: menuForm.imageUrl || ''
    });

    if (res?.success) {
      setIsMenuModalOpen(false);
      setEditingMenuId(null);
      showNotification(
        editingMenuId
          ? `${cleanName} updated across POS & Product Setup.`
          : `${cleanName} added to ${currentHotel?.name || 'hotel'} menu catalog!`
      );
    }
  };

  // Cart Actions
  const addToCart = (item) => {
    if (item.status === 'OUT_OF_STOCK') {
      showNotification(`${item.name} is currently marked 86'd (Out of Stock).`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart(prev =>
      prev
        .map(item => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter(item => item.qty > 0)
    );
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const cartTax = Math.round(cartSubtotal * 0.05);
  const cartTotal = cartSubtotal + cartTax;

  // Send KOT -> inserts fnb_order + locks/updates table in Supabase
  const handlePrintKot = async () => {
    if (!selectedTable) {
      showNotification('Create and select a dining table first before firing a KOT.');
      return;
    }
    if (cart.length === 0) {
      showNotification('Cart is empty. Add items before firing a KOT.');
      return;
    }

    const itemsString = cart.map(i => `${i.qty}x ${i.name}`).join(', ');
    const orderId = `KOT-${Date.now().toString().slice(-5)}`;
    const guestDisplay =
      guestNameInput.trim() ||
      selectedTable.guestName ||
      `Dine-In (${selectedTable.name})`;

    const totalCartItems = cart.reduce((acc, i) => acc + i.qty, 0);

    await addFnbOrder({
      orderId,
      tableId: selectedTable.id,
      roomTable: `Table ${selectedTable.name}`,
      guest: guestDisplay,
      items: itemsString,
      itemsCount: totalCartItems,
      total: cartTotal,
      status: 'PREPARING',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    setCart([]);
    setGuestNameInput('');
    showNotification(`KOT ${orderId} sent to Kitchen for ${selectedTable.name} (₹${cartTotal}).`);
  };

  // Settle Table Bill (Direct Payment)
  const handleSettleTable = async () => {
    if (!selectedTable) return;
    if (selectedTable.status !== 'OCCUPIED' && selectedTable.total <= 0) {
      showNotification(`Table ${selectedTable.name} currently has no active bill.`);
      return;
    }

    const matchingOrders = fnbOrders.filter(
      o =>
        (o.orderId === selectedTable.activeOrderId ||
          String(o.roomTable || '').includes(selectedTable.name)) &&
        o.status !== 'BILLED'
    );

    if (matchingOrders.length > 0) {
      for (let i = 0; i < matchingOrders.length; i++) {
        await settleFnbOrder(
          matchingOrders[i].orderId,
          'UPI',
          i === matchingOrders.length - 1 ? selectedTable.id : null
        );
      }
    } else {
      await settleFnbOrder(selectedTable.activeOrderId || null, 'UPI', selectedTable.id);
    }

    showNotification(`Table ${selectedTable.name} bill settled & reset to Vacant!`);
  };

  // Open Post-to-Room Folio Modal
  const openRoomFolioModal = () => {
    if (occupiedRooms.length === 0) {
      showNotification('No rooms are currently Checked-In / Occupied to bill charges to.');
      return;
    }
    if (cart.length === 0 && (!selectedTable || selectedTable.total <= 0)) {
      showNotification('Add items to cart or select an occupied table with a bill first.');
      return;
    }
    setSelectedTargetRoom(String(occupiedRooms[0].roomNumber || occupiedRooms[0].room_number));
    setIsRoomFolioModalOpen(true);
  };

  const handleConfirmPostToRoom = async (e) => {
    e.preventDefault();
    if (!selectedTargetRoom) return;
    const roomObj = occupiedRooms.find(
      r => String(r.roomNumber || r.room_number) === String(selectedTargetRoom)
    );
    const roomGuest = roomObj?.guest || selectedTable?.guestName || 'In-House Guest';

    // 1. If there is a pending cart, post it directly to the selected room folio + create billed KOT
    if (cart.length > 0) {
      const itemsString = cart.map(i => `${i.qty}x ${i.name}`).join(', ');
      const orderId = `KOT-${Date.now().toString().slice(-5)}`;
      await addFnbOrder({
        orderId,
        tableId: selectedTable?.id || null,
        roomNumber: selectedTargetRoom,
        roomTable: `Room ${selectedTargetRoom}${selectedTable ? ` (${selectedTable.name})` : ''}`,
        guest: roomGuest,
        items: itemsString,
        total: cartTotal,
        status: 'PREPARING',
        paymentStatus: 'BILLED_TO_ROOM',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setCart([]);
    }

    // 2. If the selected dining table already had accumulated active bill, post remaining table bill & clear table
    if (selectedTable && selectedTable.total > 0) {
      await addFolioCharge(selectedTargetRoom, {
        category: 'F&B',
        description: `Restaurant Table ${selectedTable.name} Dining (${selectedTable.activeOrderId || 'POS'})`,
        amount: Number(selectedTable.total) || 0,
        rate: Number(selectedTable.total) || 0,
        qty: 1
      });
      await settleFnbOrder(selectedTable.activeOrderId || null, 'BILLED_TO_ROOM', selectedTable.id);
    }

    setIsRoomFolioModalOpen(false);
    showNotification(`Posted restaurant charges to Room ${selectedTargetRoom} Folio (${roomGuest}).`);
  };

  const occupiedCount = tables.filter(t => t.status === 'OCCUPIED').length;
  const vacantCount = tables.filter(t => t.status === 'VACANT').length;

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
            <span className="text-[10px] font-bold text-[#ff6d00] bg-orange-50 border border-orange-300 px-2 py-0.5 rounded tracking-wider uppercase">
              {(currentHotel?.name || 'AAVASA PMS')} · POS
            </span>
            <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
              <Utensils className="w-3.5 h-3.5 text-orange-500" /> LIVE FLOOR · {tables.length} TABLES · {menuItems.length} ITEMS
            </span>
          </div>

          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Restaurant & Dining POS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your property-specific dining floor tables, menu dishes, Kitchen Order Tickets (KOT), and room folio postings in real time.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openCreateMenuModal}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-orange-500" />
            <span>Add Dish</span>
          </button>

          <button
            onClick={() => navigateTo('product-setup')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Product Catalog ({menuItems.length})</span>
          </button>

          <button
            onClick={openCreateTableModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#ff6d00] hover:bg-[#e66200] text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* 3. Main Workspace Split View (Left Floor & Menu, Right Order Cart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* LEFT COLUMN (7 Cols): Floor Plan Tables & Menu */}
        <div className="lg:col-span-7 space-y-5">

          {/* Section A: Restaurant Tables Floor Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-black text-slate-900">Dining Floor Layout</h2>
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {vacantCount} Vacant
                </span>
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  {occupiedCount} Occupied
                </span>
              </div>

              {/* Area Filter Pills */}
              <div className="flex items-center flex-wrap gap-1">
                {areas.map(a => (
                  <button
                    key={a}
                    onClick={() => setActiveArea(a)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                      activeArea === a
                        ? 'bg-[#ff6d00] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {a === 'ALL' ? 'All Areas' : a}
                  </button>
                ))}
              </div>
            </div>

            {filteredTables.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                <Users className="w-7 h-7 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  No Dining Tables Configured for {currentHotel?.name || 'This Property'} Yet
                </p>
                <p className="text-[11px] text-slate-500">
                  Create your restaurant dining tables (Main Dining, Patio, Rooftop, etc.) to start taking live KOT orders.
                </p>
                <button
                  onClick={openCreateTableModal}
                  className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ff6d00] hover:bg-[#e66200] text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add First Dining Table
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {filteredTables.map(t => {
                  const isSelected = selectedTable?.id === t.id;
                  const isOcc = t.status === 'OCCUPIED';

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTableId(t.id)}
                      className={`group relative p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between min-h-[104px] ${
                        isSelected
                          ? 'ring-2 ring-orange-500 border-orange-500 bg-orange-50/40 shadow-sm'
                          : isOcc
                          ? 'border-rose-300 bg-rose-50/40 hover:bg-rose-50/80'
                          : 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/70'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div>
                          <span className="text-sm font-black text-slate-900">{t.name}</span>
                          <span className="text-[9.5px] font-semibold text-slate-500 block">{t.seats} Seats · {t.area}</span>
                        </div>
                        <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${isOcc ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                      </div>

                      <div className="flex items-end justify-between mt-2">
                        <div>
                          {isOcc ? (
                            <>
                              <span className="text-[10px] font-extrabold text-rose-700 block truncate max-w-[90px]">
                                {t.guestName || 'Seated Guest'}
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                ₹{(t.total || 0).toLocaleString('en-IN')}
                              </span>
                            </>
                          ) : (
                            <span className="text-[10.5px] font-bold text-emerald-700">Available</span>
                          )}
                        </div>

                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => openEditTableModal(t, e)}
                            className="p-1 rounded hover:bg-white text-slate-500 hover:text-slate-800"
                            title="Edit Table"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          {!isOcc && (
                            <button
                              onClick={(e) => handleDeleteTable(t, e)}
                              className="p-1 rounded hover:bg-white text-slate-400 hover:text-rose-600"
                              title="Delete Table"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section B: Menu Selection Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-[#ff6d00]" />
                <span>Food & Beverage Menu</span>
              </h2>

              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={searchMenu}
                  onChange={(e) => setSearchMenu(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-medium"
                />
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredMenu.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                <Utensils className="w-7 h-7 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  {menuItems.length === 0
                    ? `No Menu Dishes Configured for ${currentHotel?.name || 'This Property'} Yet`
                    : 'No dishes match your search filter.'}
                </p>
                {menuItems.length === 0 && (
                  <button
                    onClick={openCreateMenuModal}
                    className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ff6d00] hover:bg-[#e66200] text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add First Menu Dish
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredMenu.map(m => {
                  const isOut = m.status === 'OUT_OF_STOCK';
                  return (
                    <div
                      key={m.id}
                      onClick={() => addToCart(m)}
                      className={`group p-3 rounded-xl border text-left transition flex flex-col justify-between relative ${
                        isOut
                          ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                          : 'border-slate-200 hover:border-orange-300 bg-white hover:bg-orange-50/40 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {m.imageUrl && (
                          <img
                            src={m.imageUrl}
                            alt={m.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-extrabold text-slate-900 leading-tight truncate">{m.name}</span>
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${
                                m.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              title={m.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium block mt-0.5 truncate">
                            {m.category} {isOut ? '· 86\'d Out' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-xs font-black text-slate-900">₹{m.price}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => openEditMenuModal(m, e)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 opacity-0 group-hover:opacity-100 transition"
                            title="Edit Item"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRestaurantMenuItem(m.id);
                            }}
                            className="p-1 rounded bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition"
                            title="Remove Item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          {!isOut && (
                            <span className="text-[10px] font-bold text-[#ff6d00] bg-orange-50 px-2 py-0.5 rounded border border-orange-200 group-hover:bg-[#ff6d00] group-hover:text-white transition">
                              + Add
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): Active Table Order Ticket & Checkout */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
          {/* Cart Header */}
          <div className="p-4 bg-[#1e2736] text-white flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
                ACTIVE ORDER TICKET
              </span>
              <h2 className="text-base font-black">
                {selectedTable
                  ? `Table ${selectedTable.name} (${selectedTable.area})`
                  : 'No Table Selected'}
              </h2>
            </div>

            {selectedTable && (
              <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                selectedTable.status === 'OCCUPIED'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {selectedTable.status === 'OCCUPIED' ? 'Seated / Running' : 'New Order'}
              </span>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* Existing Running Bill Alert */}
            {selectedTable?.status === 'OCCUPIED' && selectedTable?.total > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-amber-900 block">
                    Running Bill: ₹{selectedTable.total.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10.5px] text-amber-700 font-medium">
                    Guest: {selectedTable.guestName || 'Walk-in'} · {selectedTable.itemsCount} items ordered
                  </span>
                </div>
                <button
                  onClick={handleSettleTable}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition cursor-pointer"
                >
                  Settle Bill
                </button>
              </div>
            )}

            {/* Walk-in Guest Name Input */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Guest / Party Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Walk-in Guest / Table Party..."
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-orange-500"
              />
            </div>

            {/* Cart Items List */}
            <div className="border-t border-b border-slate-100 py-3 min-h-[160px] max-h-[260px] overflow-y-auto space-y-2">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-slate-500">Cart is empty</p>
                  <p className="text-[11px]">Click food items from the menu to add to KOT</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="font-bold text-slate-900 block truncate">{item.name}</span>
                      <span className="text-[10.5px] text-slate-500 font-medium">₹{item.price} x {item.qty}</span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="p-1 hover:bg-slate-100 text-slate-600 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-black text-slate-800">{item.qty}</span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="p-1 hover:bg-slate-100 text-slate-600 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-black text-slate-900 w-12 text-right">
                        ₹{item.price * item.qty}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Subtotal & Tax Calculations */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>GST (5%)</span>
                <span className="font-bold text-slate-800">₹{cartTax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Cart Total</span>
                <span className="text-lg text-[#ff6d00]">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={handlePrintKot}
                className="flex items-center justify-center space-x-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Send & Print KOT</span>
              </button>

              <button
                onClick={openRoomFolioModal}
                className="flex items-center justify-center space-x-1.5 py-2.5 bg-[#ff6d00] hover:bg-[#e66200] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <BedDouble className="w-3.5 h-3.5" />
                <span>Post to Room</span>
              </button>
            </div>
          </div>

          {/* Live Recent F&B Orders Feed */}
          <div className="border-t border-slate-200 p-4 bg-slate-50/70 space-y-2.5">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Live F&B Orders ({fnbOrders.length})</span>
              <span className="text-emerald-600 font-bold">Real-Time Synced</span>
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {fnbOrders.length === 0 ? (
                <p className="text-[11px] text-slate-400 py-2 text-center">No recent KOT orders yet.</p>
              ) : (
                fnbOrders.slice(0, 6).map(o => (
                  <div key={o.orderId} className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900">{o.orderId} · {o.roomTable}</span>
                      <span className="text-[10.5px] text-slate-500 block">{o.items}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-slate-900 block">₹{o.total}</span>
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                        o.status === 'BILLED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD / EDIT DINING TABLE */}
      {isAddTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#1e2736] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingTableId ? 'Edit Dining Table' : 'Add Restaurant Table'}
              </h3>
              <button
                onClick={() => setIsAddTableModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Table Name / Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. T-1, Patio-2, VIP-1"
                  value={newTableData.name}
                  onChange={(e) => setNewTableData({ ...newTableData, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Dining Area
                </label>
                <input
                  type="text"
                  list="pos-area-suggestions"
                  placeholder="e.g. Main Dining, Garden Patio"
                  value={newTableData.area}
                  onChange={(e) => setNewTableData({ ...newTableData, area: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  required
                />
                <datalist id="pos-area-suggestions">
                  {Array.from(new Set([...DEFAULT_AREAS, ...areas.filter(a => a !== 'ALL')])).map(a => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  value={newTableData.seats}
                  onChange={(e) => setNewTableData({ ...newTableData, seats: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddTableModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#ff6d00] hover:bg-[#e66200] text-white font-bold rounded-lg shadow-xs transition cursor-pointer"
                >
                  {editingTableId ? 'Save Changes' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT MENU DISH (WITH COMPRESSED PHOTO UPLOAD) */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#ff6d00] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingMenuId ? 'Edit Menu Dish' : 'Add Menu Dish'}
              </h3>
              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Dish Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paneer Butter Masala"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    list="pos-menu-cat-suggestions"
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                    required
                  />
                  <datalist id="pos-menu-cat-suggestions">
                    {Array.from(new Set(['Main Course', 'Starters', 'Breads', 'Beverages', 'Desserts', 'Chinese & Asian', ...categories.filter(c => c !== 'ALL')])).map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Dietary Type
                  </label>
                  <select
                    value={menuForm.isVeg ? 'veg' : 'nonveg'}
                    onChange={(e) => setMenuForm({ ...menuForm, isVeg: e.target.value === 'veg' })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="veg">Vegetarian (Green)</option>
                    <option value="nonveg">Non-Vegetarian (Red)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Kitchen Station
                  </label>
                  <select
                    value={menuForm.kitchenStation}
                    onChange={(e) => setMenuForm({ ...menuForm, kitchenStation: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                  >
                    {DEFAULT_KITCHEN_STATIONS.map(ks => (
                      <option key={ks} value={ks}>{ks}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Dish Thumbnail (Auto-compressed WebP &lt;= 24KB)
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer font-bold text-slate-700">
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleMenuImageUpload} />
                  </label>
                  {menuForm.imageUrl && (
                    <div className="flex items-center gap-2">
                      <img src={menuForm.imageUrl} alt="Dish preview" className="w-9 h-9 rounded-lg object-cover border" />
                      <button
                        type="button"
                        onClick={() => setMenuForm({ ...menuForm, imageUrl: '' })}
                        className="text-[10.5px] font-bold text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#ff6d00] hover:bg-[#e66200] text-white font-bold rounded-lg shadow-xs transition cursor-pointer"
                >
                  {editingMenuId ? 'Save Dish' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: POST RESTAURANT BILL TO IN-HOUSE ROOM FOLIO */}
      {isRoomFolioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#1e2736] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Post Bill to Room Folio</h3>
              <button
                onClick={() => setIsRoomFolioModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPostToRoom} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Select Occupied / In-House Room
                </label>
                <select
                  value={selectedTargetRoom}
                  onChange={(e) => setSelectedTargetRoom(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  required
                >
                  {occupiedRooms.map(rm => {
                    const num = rm.roomNumber || rm.room_number;
                    return (
                      <option key={num} value={num}>
                        Room {num} — {rm.guest || 'Occupied Guest'} ({rm.type})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-[11px] text-orange-900">
                Amount to charge to Room {selectedTargetRoom}:{' '}
                <strong>
                  ₹{((selectedTable?.total || 0) + cartTotal).toLocaleString('en-IN')}
                </strong>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRoomFolioModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#ff6d00] hover:bg-[#e66200] text-white font-bold rounded-lg shadow-xs transition cursor-pointer"
                >
                  Confirm Room Charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
