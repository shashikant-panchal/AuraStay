import React, { useState, useMemo, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  X,
  Building2,
  Plus,
  DollarSign,
  Layers,
  Trash2,
  BedDouble,
  CheckCircle2,
  Key,
  Phone,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import CreateRoomTypeModal from './CreateRoomTypeModal';

export default function CreateRoomModal() {
  const {
    isCreateRoomModalOpen,
    setIsCreateRoomModalOpen,
    addRoom,
    currentHotel,
    rooms = [],
    roomTypes = [],
    showNotification
  } = useDashboard();

  const assignedRoomLimit = Number(currentHotel?.totalRooms) || 0;
  const remainingRoomQuota = Math.max(0, assignedRoomLimit - rooms.length);
  const isRoomLimitReached = rooms.length >= assignedRoomLimit;

  // Combined room categories (Explicit room types + Inferred from existing rooms + Defaults)
  const effectiveRoomTypes = useMemo(() => {
    const list = [...(roomTypes || [])];
    const seen = new Set(list.map(rt => String(rt.name || '').trim().toLowerCase()));

    // Infer categories from existing physical rooms so they're selectable
    (rooms || []).forEach(r => {
      const cat = String(r.type || r.category || '').trim();
      if (cat && !seen.has(cat.toLowerCase())) {
        seen.add(cat.toLowerCase());
        list.push({
          id: `rt-inferred-${cat.toLowerCase().replace(/\s+/g, '-')}`,
          name: cat,
          label: 'Room',
          beddingType: r.bed || 'King Bed',
          maxAdults: 2,
          maxExtra: 1,
          maxChildren: 1,
          areaSqft: 350,
          basePrice: Number(r.price) || Number(r.tariff) || 2500,
          extraBedPrice: 800,
          childPrice: 400,
          amenities: ['Air conditioning', 'Free High-Speed Wi-Fi'],
          description: `${cat} category accommodation.`,
          isBookingEngine: true
        });
      }
    });

    if (list.length === 0) {
      list.push(
        { id: 'rt-standard', name: 'Standard Room', label: 'Room', beddingType: 'Queen Bed', maxAdults: 2, maxExtra: 0, maxChildren: 1, areaSqft: 280, basePrice: 2500, isBookingEngine: true },
        { id: 'rt-deluxe', name: 'Deluxe Room', label: 'Room', beddingType: 'King Bed', maxAdults: 3, maxExtra: 1, maxChildren: 1, areaSqft: 350, basePrice: 3500, isBookingEngine: true },
        { id: 'rt-executive', name: 'Executive Room', label: 'Room', beddingType: 'King Bed', maxAdults: 3, maxExtra: 1, maxChildren: 1, areaSqft: 420, basePrice: 4500, isBookingEngine: true }
      );
    }

    return list;
  }, [roomTypes, rooms]);

  const [activeTab, setActiveTab] = useState('addRoom'); // 'addRoom' | 'roomCategories' | 'manageRooms'
  const [isRoomTypeModalOpen, setIsRoomTypeModalOpen] = useState(false);

  // Form fields for Add Room
  const [roomNumber, setRoomNumber] = useState('');
  const [selectedType, setSelectedType] = useState(() => effectiveRoomTypes[0]?.name || 'Deluxe Room');
  const [floor, setFloor] = useState('Floor 1');
  const [bed, setBed] = useState('King Bed');
  const [price, setPrice] = useState('2500');
  const [keyCardNo, setKeyCardNo] = useState('');
  const [isSmoking, setIsSmoking] = useState(false);
  const [phoneExt, setPhoneExt] = useState('');
  const [housekeeping, setHousekeeping] = useState('Clean');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep selectedType valid as roomTypes update
  useEffect(() => {
    if (effectiveRoomTypes.length > 0) {
      const exists = effectiveRoomTypes.some(t => t.name === selectedType);
      if (!exists) {
        setSelectedType(effectiveRoomTypes[0].name);
        setPrice(String(effectiveRoomTypes[0].basePrice || 2500));
        setBed(effectiveRoomTypes[0].beddingType || 'King Bed');
      }
    }
  }, [effectiveRoomTypes]);

  if (!isCreateRoomModalOpen) return null;

  const handleCategoryChange = (catName) => {
    setSelectedType(catName);
    const matchedType = effectiveRoomTypes.find(rt => rt.name === catName);
    if (matchedType) {
      setPrice(String(matchedType.basePrice || 2500));
      setBed(matchedType.beddingType || 'King Bed');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const roomNums = roomNumber
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (roomNums.length === 0) {
      setError('Room Number is required');
      return;
    }

    if (rooms.length >= assignedRoomLimit || rooms.length + roomNums.length > assignedRoomLimit) {
      const limitErr = `Your room creation limit has reached (${rooms.length}/${assignedRoomLimit} rooms created). Please contact SuperAdmin.`;
      setError(limitErr);
      showNotification('Your room creation limit has reached, contact SuperAdmin.');
      return;
    }

    const duplicate = roomNums.find(num =>
      rooms.some(r => String(r.room_number || r.roomNumber) === num)
    );
    if (duplicate) {
      setError(`Room #${duplicate} already exists in inventory.`);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const matchedType = roomTypes.find(rt => rt.name === selectedType);

      for (const cleanNum of roomNums) {
        await addRoom({
          roomNumber: cleanNum,
          roomTypeId: matchedType?.id || null,
          type: selectedType,
          floor,
          bed,
          price: Number(price) || 2500,
          keyCardNo: roomNums.length === 1 && keyCardNo.trim() ? keyCardNo.trim() : `CARD-${cleanNum}`,
          isSmoking,
          phoneExtension: roomNums.length === 1 && phoneExt.trim() ? phoneExt.trim() : cleanNum,
          housekeeping,
          status: housekeeping === 'Clean' ? 'VACANT_READY' : 'DIRTY'
        });
      }

      setRoomNumber('');
      setKeyCardNo('');
      setPhoneExt('');
      showNotification(
        roomNums.length > 1
          ? `${roomNums.length} rooms (#${roomNums.join(', #')}) added to ${selectedType} category!`
          : `Room #${roomNums[0]} added to ${selectedType} category!`,
        'success'
      );
      setIsCreateRoomModalOpen(false);
    } catch (err) {
      setError('Failed to save room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] relative">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-wide">Room & Category Inventory Master</h3>
              <p className="text-xs text-indigo-200/80">Exceed HMS Room Numbers & Types Setup</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateRoomModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 shrink-0 space-x-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('addRoom')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'addRoom'
                ? 'border-indigo-600 text-indigo-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Room Number</span>
          </button>

          <button
            onClick={() => setActiveTab('roomCategories')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'roomCategories'
                ? 'border-indigo-600 text-indigo-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Room Categories ({effectiveRoomTypes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('manageRooms')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'manageRooms'
                ? 'border-indigo-600 text-indigo-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BedDouble className="w-3.5 h-3.5" />
            <span>Active Rooms ({rooms.length})</span>
          </button>
        </div>

        {/* Tab 1: Add Room Form */}
        {activeTab === 'addRoom' && (
          <form onSubmit={handleCreateRoom} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            {/* SuperAdmin Assigned Room Limit Banner */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isRoomLimitReached
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
              }`}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">
                  SuperAdmin Room Creation Quota
                </span>
                <span className="font-bold text-xs mt-0.5 block">
                  {isRoomLimitReached
                    ? 'Your room creation limit has reached. Contact SuperAdmin to add more rooms.'
                    : `You can create ${remainingRoomQuota} more room${remainingRoomQuota === 1 ? '' : 's'} (Assigned by SuperAdmin: ${assignedRoomLimit})`}
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-xl font-mono font-black text-xs shrink-0 ${
                  isRoomLimitReached
                    ? 'bg-amber-200/80 text-amber-950'
                    : 'bg-indigo-900 text-white'
                }`}
              >
                {rooms.length} / {assignedRoomLimit} Created
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Room Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 101, 102, 204"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Floor Level
                </label>
                <select
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold outline-none"
                >
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="Floor 1">Floor 1</option>
                  <option value="Floor 2">Floor 2</option>
                  <option value="Floor 3">Floor 3</option>
                  <option value="Floor 4">Floor 4</option>
                  <option value="Executive Floor">Executive Penthouse Floor</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Room Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsRoomTypeModalOpen(true)}
                    className="text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    + New Category
                  </button>
                </div>
                <select
                  value={selectedType}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold outline-none"
                >
                  {effectiveRoomTypes.map(rt => (
                    <option key={rt.id} value={rt.name}>{rt.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tariff Per Night (₹)
                </label>
                <input
                  type="number"
                  min="100"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-xs outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  RFID / Key Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. CARD-101"
                    value={keyCardNo}
                    onChange={(e) => setKeyCardNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs outline-none"
                  />
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Extension
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 101"
                    value={phoneExt}
                    onChange={(e) => setPhoneExt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs outline-none"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Cleanliness
                </label>
                <select
                  value={housekeeping}
                  onChange={(e) => setHousekeeping(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold outline-none"
                >
                  <option value="Clean">Clean (Ready for Check-In)</option>
                  <option value="Dirty">Dirty (Needs Turnover Cleaning)</option>
                  <option value="Inspected">Inspected & Verified</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="chkSmoking"
                  checked={isSmoking}
                  onChange={(e) => setIsSmoking(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="chkSmoking" className="font-semibold text-slate-700 cursor-pointer">
                  Smoking Allowed
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsCreateRoomModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-bold shadow-md shadow-indigo-900/20 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Adding...' : 'Add Room to Inventory'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Room Categories Master */}
        {activeTab === 'roomCategories' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Room Categories Master</h4>
                <p className="text-slate-500 text-[11px]">Configured room types and pricing tiers</p>
              </div>
              <button
                onClick={() => setIsRoomTypeModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs flex items-center space-x-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Category</span>
              </button>
            </div>

            <div className="space-y-3">
              {effectiveRoomTypes.map(rt => {
                const count = rooms.filter(r => (r.type || r.category) === rt.name).length;
                return (
                  <div key={rt.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:shadow-xs transition space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{rt.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full ml-2 font-mono">
                          {rt.label || 'Room'}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {rt.beddingType} • Max {rt.maxAdults} Adults, {rt.maxChildren} Children • {rt.areaSqft} sq.ft.
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-indigo-900 font-mono">
                          ₹{rt.basePrice?.toLocaleString('en-IN') || 2500}
                        </span>
                        <span className="text-[10px] text-slate-400 block">/ night</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-600 font-medium">
                        Allocated Rooms: <strong className="text-slate-900">{count} Rooms</strong>
                      </span>
                      <span className="text-indigo-600 font-bold">
                        {rt.isBookingEngine ? '✓ Published on Booking Engine' : 'Internal Only'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Active Rooms List (Deletion Controlled Exclusively by SuperAdmin) */}
        {activeTab === 'manageRooms' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-3 text-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 text-sm">
                Room Numbers Directory ({rooms.length} / {assignedRoomLimit} Assigned)
              </h4>
              <span className="text-[11px] font-semibold text-slate-500">
                Room deletion is managed by SuperAdmin
              </span>
            </div>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Room</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Floor</th>
                    <th className="px-4 py-2.5">Tariff</th>
                    <th className="px-4 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {rooms.map(r => {
                    const rNum = String(r.room_number || r.roomNumber);
                    return (
                      <tr key={rNum} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-bold font-mono text-slate-900">#{rNum}</td>
                        <td className="px-4 py-2.5 text-slate-700">{r.type || r.category || 'Standard Room'}</td>
                        <td className="px-4 py-2.5 text-slate-500">{r.floor || 'Floor 1'}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-800">₹{r.price || 2000}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            {r.status || 'VACANT_READY'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Sub-Modal: Create Room Type */}
      <CreateRoomTypeModal
        isOpen={isRoomTypeModalOpen}
        onClose={() => setIsRoomTypeModalOpen(false)}
      />

    </div>
  );
}
