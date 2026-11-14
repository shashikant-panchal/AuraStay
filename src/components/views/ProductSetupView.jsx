import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { compressImageFile } from '../../utils/imageCompression';
import {
  Archive,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Tag,
  DollarSign,
  Layers,
  Utensils,
  Coffee,
  Pizza,
  Wine,
  Trophy,
  X,
  Check,
  Download,
  Percent,
  ImagePlus
} from 'lucide-react';

export default function ProductSetupView() {
  const {
    navigateTo,
    showNotification,
    currentHotel,
    restaurantMenuItems = [],
    upsertRestaurantMenuItem,
    deleteRestaurantMenuItem
  } = useDashboard();

  const products = restaurantMenuItems;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  // Form State
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Main Course',
    kitchenStation: 'Hot Kitchen (Indian)',
    price: 350,
    costPrice: 110,
    taxPct: 5,
    isVegetarian: true,
    prepTime: '15 mins',
    description: '',
    imageUrl: ''
  });

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return ['ALL', ...unique];
  }, [products]);

  const blendedMargin = useMemo(() => {
    const priced = products.filter(p => Number(p.price) > 0);
    if (priced.length === 0) return '0%';
    const avg = priced.reduce((sum, p) => sum + ((p.price - (p.costPrice || 0)) / p.price) * 100, 0) / priced.length;
    return `${avg.toFixed(1)}%`;
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      String(p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.kitchenStation || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const toggleAvailability = async (product) => {
    const nextStatus = product.status === 'AVAILABLE' ? 'OUT_OF_STOCK' : 'AVAILABLE';
    await upsertRestaurantMenuItem({ ...product, status: nextStatus });
    showNotification(`${product.name} marked as ${nextStatus === 'AVAILABLE' ? 'In Stock' : "86'd (Out of Stock)"}`);
  };

  const openAddModal = () => {
    setEditingItemId(null);
    setNewItem({
      name: '',
      category: 'Main Course',
      kitchenStation: 'Hot Kitchen (Indian)',
      price: 350,
      costPrice: 110,
      taxPct: 5,
      isVegetarian: true,
      prepTime: '15 mins',
      description: '',
      imageUrl: ''
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingItemId(product.id);
    setNewItem({
      name: product.name || '',
      category: product.category || 'Main Course',
      kitchenStation: product.kitchenStation || 'Hot Kitchen (Indian)',
      price: product.price || 0,
      costPrice: product.costPrice || 0,
      taxPct: product.taxPct ?? 5,
      isVegetarian: product.isVeg !== false,
      prepTime: product.prepTime || '15 mins',
      description: product.description || '',
      imageUrl: product.imageUrl || ''
    });
    setIsAddModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, { maxDim: 280, maxBytes: 24 * 1024 });
      setNewItem(prev => ({ ...prev, imageUrl: compressed }));
      showNotification('Dish photo compressed for fast storage.');
    } catch {
      showNotification('Could not process image.');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) {
      showNotification('Please enter a product name.');
      return;
    }

    const existing = editingItemId ? products.find(p => p.id === editingItemId) : null;
    const res = await upsertRestaurantMenuItem({
      ...(existing || {}),
      id: editingItemId || undefined,
      name: newItem.name.trim(),
      category: newItem.category.trim() || 'Main Course',
      kitchenStation: newItem.kitchenStation,
      price: parseFloat(newItem.price) || 0,
      costPrice: parseFloat(newItem.costPrice) || 0,
      taxPct: parseFloat(newItem.taxPct ?? 5),
      unit: 'Portion',
      isVeg: Boolean(newItem.isVegetarian),
      status: existing?.status || 'AVAILABLE',
      prepTime: newItem.prepTime || '15 mins',
      description: newItem.description || '',
      imageUrl: newItem.imageUrl || ''
    });

    if (res?.success) {
      setIsAddModalOpen(false);
      setEditingItemId(null);
      showNotification(
        editingItemId
          ? `Updated ${newItem.name} across POS & menu catalog.`
          : `New item ${newItem.name} added to Restaurant POS menu!`
      );
    }
  };

  const handleExportCsv = () => {
    if (products.length === 0) {
      showNotification('Add at least one menu item before exporting.');
      return;
    }
    const headers = ['ID', 'Name', 'Category', 'Kitchen Station', 'Price', 'Cost Price', 'Tax %', 'Dietary', 'Status'];
    const rows = products.map(p => [
      p.id,
      `"${String(p.name || '').replace(/"/g, '""')}"`,
      p.category,
      p.kitchenStation,
      p.price,
      p.costPrice,
      p.taxPct,
      p.isVeg ? 'Veg' : 'Non-Veg',
      p.status
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(currentHotel?.slug || 'hotel')}-fnb-menu.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Menu catalog exported as CSV.');
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
          Product Setup
        </span>
      </div>

      {/* 2. Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-300 px-2 py-0.5 rounded tracking-wider uppercase">
              {(currentHotel?.name || 'AAVASA PMS')}
            </span>
            <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
              <Utensils className="w-3.5 h-3.5 text-orange-500" /> HOTEL-SPECIFIC F&B CATALOG
            </span>
          </div>

          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Product & Menu Item Setup
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure restaurant food & beverage menus, pricing tariffs, taxes, kitchen routing stations, and item availability.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Menu</span>
          </button>

          <button
            onClick={() => navigateTo('restaurant-pos')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Go to POS</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#ff6d00] hover:bg-[#e66200] text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* 3. 4 Top Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            TOTAL ACTIVE ITEMS
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {products.length} Items
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Live on POS & Room Service
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            MENU CATEGORIES
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{Math.max(0, categories.length - 1)} Sections</div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1 truncate">
            {categories.filter(c => c !== 'ALL').join(', ') || 'Add items to create sections'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            BLENDED FOOD MARGIN
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{blendedMargin}</div>
          <span className="text-[11px] text-emerald-600 font-medium block mt-1">
            Live profit margin calculation
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            86'D (OUT OF STOCK)
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {products.filter(p => p.status === 'OUT_OF_STOCK').length} Items
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Kitchen stock alerts
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
            placeholder="Search items by name, ID, or kitchen station..."
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${selectedCategory === cat
                  ? 'bg-[#ff6d00] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Products Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3">ITEM DETAILS</th>
                <th className="p-3">CATEGORY</th>
                <th className="p-3">KITCHEN ROUTE</th>
                <th className="p-3 text-right">SELLING PRICE</th>
                <th className="p-3 text-right">FOOD COST</th>
                <th className="p-3 text-center">PREP TIME</th>
                <th className="p-3 text-center">AVAILABILITY</th>
                <th className="p-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Utensils className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-slate-600">No F&B Products Configured</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "Add New Product" to create restaurant menu items and pricing.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 border ${p.isVegetarian ? 'bg-emerald-500 border-emerald-600' : 'bg-rose-500 border-rose-600'
                        }`} title={p.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'} />
                      <div>
                        <span className="font-extrabold text-slate-900 block">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{p.id} • {p.unit}</span>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[10.5px]">
                      {p.category}
                    </span>
                  </td>

                  <td className="p-3 text-slate-600 font-medium">
                    {p.kitchenStation}
                  </td>

                  <td className="p-3 text-right font-black text-slate-900">
                    ₹{p.price} <span className="text-[10px] text-slate-400 font-normal">+ {p.taxPct}% GST</span>
                  </td>

                  <td className="p-3 text-right font-medium text-slate-600">
                    ₹{p.costPrice} <span className="text-[10px] text-emerald-600 font-bold">({Math.round(((p.price - p.costPrice) / p.price) * 100)}%)</span>
                  </td>

                  <td className="p-3 text-center text-slate-600">
                    {p.prepTime}
                  </td>

                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleAvailability(p)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${p.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                    >
                      {p.status === 'AVAILABLE' ? 'In Stock' : '86\'d (Out)'}
                    </button>
                  </td>

                  <td className="p-3 text-right space-x-1">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteRestaurantMenuItem(p.id)}
                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT MENU ITEM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#ff6d00] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">{editingItemId ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dish name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Category
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Starters">Starters</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Italian & Continental">Italian & Continental</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Dietary Type
                  </label>
                  <select
                    value={newItem.isVegetarian ? 'veg' : 'nonveg'}
                    onChange={(e) => setNewItem({ ...newItem, isVegetarian: e.target.value === 'veg' })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="veg">Vegetarian (Green Dot)</option>
                    <option value="nonveg">Non-Vegetarian (Red Dot)</option>
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
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    value={newItem.costPrice}
                    onChange={(e) => setNewItem({ ...newItem, costPrice: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Kitchen Routing Station
                </label>
                <select
                  value={newItem.kitchenStation}
                  onChange={(e) => setNewItem({ ...newItem, kitchenStation: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                >
                  <option value="Hot Kitchen (Indian)">Hot Kitchen (Indian Curries)</option>
                  <option value="Tandoor Clay Oven">Tandoor Clay Oven (Breads & Kebabs)</option>
                  <option value="Pan Asian Wok">Pan Asian Wok</option>
                  <option value="Pizza Oven">Pizza & Continental</option>
                  <option value="Mocktail & Bar">Bar & Beverages</option>
                  <option value="Halwai / Dessert Bar">Dessert Station</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Ingredients, preparation details..."
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Dish Thumbnail (Compressed WebP)
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer font-bold text-slate-700">
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {newItem.imageUrl && (
                    <img src={newItem.imageUrl} alt="Dish preview" className="w-9 h-9 rounded-lg object-cover border" />
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#ff6d00] hover:bg-[#e66200] text-white rounded-lg text-xs font-bold"
                >
                  Save Menu Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
