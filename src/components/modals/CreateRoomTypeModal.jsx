import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  X,
  Layers,
  BedDouble,
  DollarSign,
  Maximize2,
  Users,
  Check,
  Plus,
  Sparkles,
  Tag,
  FileText,
  ShieldCheck,
  Globe
} from 'lucide-react';

export default function CreateRoomTypeModal({ isOpen, onClose }) {
  const {
    addRoomType,
    showNotification,
    isCreateRoomTypeModalOpen,
    setIsCreateRoomTypeModalOpen
  } = useDashboard();

  const isModalVisible = isOpen !== undefined ? isOpen : isCreateRoomTypeModalOpen;
  const handleModalClose = onClose || (() => setIsCreateRoomTypeModalOpen && setIsCreateRoomTypeModalOpen(false));

  // Exceed form fields
  const [name, setName] = useState('');
  const [label, setLabel] = useState('Room');
  const [beddingType, setBeddingType] = useState('King Bed');
  const [maxAdults, setMaxAdults] = useState(2);
  const [maxExtra, setMaxExtra] = useState(1);
  const [maxChildren, setMaxChildren] = useState(1);
  const [areaSqft, setAreaSqft] = useState(350);
  const [basePrice, setBasePrice] = useState(2500);
  const [extraBedPrice, setExtraBedPrice] = useState(800);
  const [childPrice, setChildPrice] = useState(400);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isBookingEngine, setIsBookingEngine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exceed standard facility chips
  const standardFacilities = [
    'Air conditioning',
    'Free High-Speed Wi-Fi',
    'Flat-screen Smart TV',
    'Private bathroom',
    'Electric kettle',
    'Daily housekeeping',
    'Balcony',
    'City view',
    'Bathtub',
    'Minibar',
    'Tea/Coffee machine',
    'Safe',
    'Work desk & chair',
    'Soundproof',
    'Wardrobe or closet'
  ];

  const [selectedFacilities, setSelectedFacilities] = useState([
    'Air conditioning',
    'Free High-Speed Wi-Fi',
    'Flat-screen Smart TV',
    'Private bathroom',
    'Daily housekeeping'
  ]);

  if (!isModalVisible) return null;

  const toggleFacility = (facility) => {
    setSelectedFacilities(prev =>
      prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showNotification('Room category name is required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: `rt-${Date.now().toString().slice(-4)}`,
        name: name.trim(),
        label,
        beddingType,
        maxAdults: Number(maxAdults),
        maxExtra: Number(maxExtra),
        maxChildren: Number(maxChildren),
        areaSqft: Number(areaSqft),
        basePrice: Number(basePrice),
        extraBedPrice: Number(extraBedPrice),
        childPrice: Number(childPrice),
        amenities: selectedFacilities,
        description: description.trim(),
        notes: notes.trim(),
        isBookingEngine
      };

      if (addRoomType) {
        await addRoomType(payload);
      }
      handleModalClose();
    } catch (err) {
      showNotification('Failed to create room category.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-wide">Create Room Category / Type</h3>
              <p className="text-xs text-indigo-200/80">Exceed HMS Room Category Master & Occupancy Setup</p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          
          {/* 1. Category Name & Label */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Room Category Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Deluxe Room, Executive Suite"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/30 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category Display Label
              </label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 outline-none"
              >
                {['Room', 'Suite', 'Villa', 'Cottage', 'Apartment', 'Studio', 'Tent', 'Dormitory', 'Bed', 'Cabin', 'Bungalow', 'Houseboat'].map(lbl => (
                  <option key={lbl} value={lbl}>{lbl}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Bedding Type & Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bedding Configuration
              </label>
              <select
                value={beddingType}
                onChange={(e) => setBeddingType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 outline-none"
              >
                {[
                  'King Bed',
                  'Queen Bed',
                  'Twin Bed',
                  'Double Bed',
                  'Single Bed',
                  'Suite',
                  'Dormitory',
                  'Sofa Bed',
                  '1 King Bed and 1 Single Bed',
                  '2 King Bed(s)',
                  '2 Queen Bed(s)'
                ].map(bed => (
                  <option key={bed} value={bed}>{bed}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Room Area Size (Sq. Ft.)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="50"
                  value={areaSqft}
                  onChange={(e) => setAreaSqft(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold font-mono text-slate-900 outline-none"
                />
                <span className="text-[10px] text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 font-bold uppercase">
                  sq. ft.
                </span>
              </div>
            </div>
          </div>

          {/* 3. Occupancy Rules (Exceed Max Guests) */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Occupancy Policy
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Max Adults</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxAdults}
                  onChange={(e) => setMaxAdults(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-center font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Extra Adults</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={maxExtra}
                  onChange={(e) => setMaxExtra(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-center font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Max Children</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={maxChildren}
                  onChange={(e) => setMaxChildren(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-center font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* 4. Tariffs & Pricing */}
          <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
              Tariff & Pricing Rates (INR)
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Base Price / Night</label>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 font-bold">₹</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Extra Bed Charge</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={extraBedPrice}
                    onChange={(e) => setExtraBedPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 font-bold">₹</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Child Charge</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={childPrice}
                    onChange={(e) => setChildPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 font-bold">₹</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Amenities & Facility Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Room Amenities & Facilities ({selectedFacilities.length} Selected)
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl border border-slate-200 bg-slate-50/60 max-h-36 overflow-y-auto">
              {standardFacilities.map(f => {
                const isSelected = selectedFacilities.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFacility(f)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center space-x-1 ${
                      isSelected
                        ? 'bg-indigo-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{f}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Descriptions & Internal Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Guest Description
              </label>
              <textarea
                rows={2}
                placeholder="What makes this room special for guests..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Front Office Internal Notes
              </label>
              <textarea
                rows={2}
                placeholder="Internal notes displayed on room inventory list..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none resize-none"
              />
            </div>
          </div>

          {/* 7. Booking Engine Switch */}
          <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50">
            <div className="flex items-center space-x-2.5">
              <Globe className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="font-bold text-slate-900 text-xs">Publish on Guest Booking Engine</p>
                <p className="text-[10px] text-slate-500">Allow guests to view and book this room type online</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isBookingEngine}
              onChange={(e) => setIsBookingEngine(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={handleModalClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-900 to-slate-900 hover:from-indigo-950 hover:to-slate-950 text-white font-bold text-xs shadow-md shadow-indigo-900/20 flex items-center space-x-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Category...' : 'Save Room Category'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
