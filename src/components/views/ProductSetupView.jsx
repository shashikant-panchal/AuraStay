import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
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
  Percent
} from 'lucide-react';

const INITIAL_PRODUCTS = [
  {
    id: 'PRD-101',
    name: 'Paneer Butter Masala',
    category: 'Main Course',
    kitchenStation: 'Hot Kitchen (Indian)',
    price: 360,
    taxPct: 5,
    costPrice: 120,
    unit: 'Portion',
    isVegetarian: true,
    status: 'AVAILABLE',
    prepTime: '15 mins',
    description: 'Cottage cheese cubes simmered in rich velvety tomato cashew gravy.'
  },
  {
    id: 'PRD-102',
    name: 'Murgh Dum Biryani (Chef Special)',
    category: 'Main Course',
    kitchenStation: 'Hot Kitchen (Biryani)',
    price: 450,
    taxPct: 5,
    costPrice: 160,
    unit: 'Portion',
    isVegetarian: false,
    status: 'AVAILABLE',
    prepTime: '20 mins',
    description: 'Fragrant basmati rice layered with spiced tender chicken and saffron dum.'
  },
  {
    id: 'PRD-103',
    name: 'Crispy Corn & Water Chestnut',
    category: 'Starters',
    kitchenStation: 'Pan Asian Wok',
    price: 280,
    taxPct: 5,
    costPrice: 85,
    unit: 'Plate',
    isVegetarian: true,
    status: 'AVAILABLE',
    prepTime: '12 mins',
    description: 'Tossed sweet corn kernels with scallions, crushed pepper, and sea salt.'
  },
  {
    id: 'PRD-104',
    name: 'Tandoori Murgh (Full)',
    category: 'Starters',
    kitchenStation: 'Tandoor Clay Oven',
    price: 520,
    taxPct: 5,
    costPrice: 210,
    unit: 'Full Bird',
    isVegetarian: false,
    status: 'AVAILABLE',
    prepTime: '25 mins',
    description: 'Whole chicken marinated in Kashmiri chili and hung curd, roasted in clay oven.'
  },
  {
    id: 'PRD-105',
    name: 'Gulab Jamun with Rabri',
    category: 'Desserts',
    kitchenStation: 'Halwai / Dessert Bar',
    price: 180,
    taxPct: 5,
    costPrice: 50,
    unit: '2 Pcs',
    isVegetarian: true,
    status: 'AVAILABLE',
    prepTime: '5 mins',
    description: 'Warm fried milk solids drenched in cardamom sugar syrup with creamy rabri.'
  },
  {
    id: 'PRD-106',
    name: 'Fresh Mint Mojito',
    category: 'Beverages',
    kitchenStation: 'Mocktail & Bar',
    price: 210,
    taxPct: 5,
    costPrice: 40,
    unit: 'Glass (350ml)',
    isVegetarian: true,
    status: 'AVAILABLE',
    prepTime: '5 mins',
    description: 'Muddled fresh garden mint, lime wedges, simple syrup, and sparkling soda.'
  },
  {
    id: 'PRD-107',
    name: 'Artisan Wood-Fired Margherita Pizza',
    category: 'Italian & Continental',
    kitchenStation: 'Pizza Oven',
    price: 420,
    taxPct: 5,
    costPrice: 130,
    unit: '11 Inch',
    isVegetarian: true,
    status: 'AVAILABLE',
    prepTime: '18 mins',
    description: 'San Marzano tomato coulis, fresh mozzarella bocconcini, and handpicked basil.'
  },
  {
    id: 'PRD-108',
    name: 'Single Malt Scotch (Glenfiddich 12 YO)',
    category: 'Beverages',
    kitchenStation: 'Main Bar',
    price: 650,
    taxPct: 18,
    costPrice: 320,
    unit: 'Peg (60ml)',
    isVegetarian: true,
    status: 'OUT_OF_STOCK',
    prepTime: '2 mins',
    description: 'Signature Speyside 12-year-old single malt scotch whisky.'
  }
];

export default function ProductSetupView() {
  const { navigateTo, showNotification } = useDashboard();

  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Main Course',
    kitchenStation: 'Hot Kitchen (Indian)',
    price: 350,
    costPrice: 110,
    isVegetarian: true,
    prepTime: '15 mins',
    description: ''
  });

  const categories = ['ALL', 'Main Course', 'Starters', 'Desserts', 'Beverages', 'Italian & Continental'];

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.kitchenStation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const toggleAvailability = (id) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'AVAILABLE' ? 'OUT_OF_STOCK' : 'AVAILABLE';
        showNotification(`${p.name} marked as ${nextStatus === 'AVAILABLE' ? 'In Stock' : '86\'d (Out of Stock)'}`);
        return { ...p, status: nextStatus };
      }
      return p;
    }));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name) {
      showNotification('Please enter a product name.');
      return;
    }

    const created = {
      id: `PRD-${100 + products.length + 1}`,
      name: newItem.name,
      category: newItem.category,
      kitchenStation: newItem.kitchenStation,
      price: parseFloat(newItem.price) || 250,
      costPrice: parseFloat(newItem.costPrice) || 80,
      taxPct: 5,
      unit: 'Portion',
      isVegetarian: newItem.isVegetarian,
      status: 'AVAILABLE',
      prepTime: newItem.prepTime || '15 mins',
      description: newItem.description || 'Delicious culinary preparation crafted with fresh ingredients.'
    };

    setProducts([created, ...products]);
    setIsAddModalOpen(false);
    showNotification(`New item ${created.name} added to Restaurant POS menu!`);
    setNewItem({
      name: '',
      category: 'Main Course',
      kitchenStation: 'Hot Kitchen (Indian)',
      price: 350,
      costPrice: 110,
      isVegetarian: true,
      prepTime: '15 mins',
      description: ''
    });
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
            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-300 px-2 py-0.5 rounded tracking-wider">
              BOOKONE PMS
            </span>
            <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> MASTERY: 0%
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
            onClick={() => showNotification('Exporting complete F&B menu catalog...')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Menu</span>
          </button>

          <button
            onClick={() => navigateTo('restaurant-pos')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Go to POS</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#ff6d00] hover:bg-[#e66200] text-white rounded-lg text-xs font-bold shadow-2xs transition"
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
          <div className="text-2xl font-black text-slate-900 mt-1">5 Sections</div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Indian, Tandoor, Asian, Continental
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            BLENDED FOOD MARGIN
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">68.2%</div>
          <span className="text-[11px] text-emerald-600 font-medium block mt-1">
            Standard 3x food cost markup
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat
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
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 border ${
                        p.isVegetarian ? 'bg-emerald-500 border-emerald-600' : 'bg-rose-500 border-rose-600'
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
                      onClick={() => toggleAvailability(p.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                        p.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {p.status === 'AVAILABLE' ? 'In Stock' : '86\'d (Out)'}
                    </button>
                  </td>

                  <td className="p-3 text-right">
                    <button
                      onClick={() => showNotification(`Editing item ${p.name}`)}
                      className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded transition"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD MENU ITEM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#ff6d00] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Add New Menu Item</h3>
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
                  placeholder="e.g. Malai Kofta"
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
