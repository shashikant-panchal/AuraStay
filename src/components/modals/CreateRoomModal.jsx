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
  Check,
  Edit3
} from 'lucide-react';
import CreateRoomTypeModal from './CreateRoomTypeModal';
import { compareCategoryNames, compareRoomsByCategoryAndNumber } from '../../utils/roomSort';

const STANDARD_FLOOR_OPTIONS = [
  'Ground Floor',
  'Floor 1',
  'Floor 2',
  'Floor 3',
  'Floor 4',
  'Executive Floor'
];

const STANDARD_BED_OPTIONS = [
  'King Bed',
  'Queen Bed',
  'Twin Beds',
  'Double Bed',
  'Single Bed',
  'King + Sofa Bed'
];

export default function CreateRoomModal() {
  const {
    isCreateRoomModalOpen,
    setIsCreateRoomModalOpen,
    editingRoom,
    setEditingRoom,
    openEditRoomModal,
    addRoom,
    updateRoom,
    currentHotel,
    rooms = [],
    roomTypes = [],
    showNotification
  } = useDashboard();

  const isEditMode = Boolean(editingRoom);
  const assignedRoomLimit = Number(currentHotel?.totalRooms) || 0;
  const remainingRoomQuota = Math.max(0, assignedRoomLimit - rooms.length);
  const isRoomLimitReached = assignedRoomLimit > 0 ? rooms.length >= assignedRoomLimit : true;

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

    return list.sort((a, b) => compareCategoryNames(a.name, b.name));
  }, [roomTypes, rooms]);

  const sortedRooms = useMemo(() => {
    return (rooms || []).slice().sort(compareRoomsByCategoryAndNumber);
  }, [rooms]);

  const [activeTab, setActiveTab] = useState('addRoom'); // 'addRoom' | 'roomCategories' | 'manageRooms'
  const [isRoomTypeModalOpen, setIsRoomTypeModalOpen] = useState(false);

  // Form fields for Add / Edit Room
  const [roomNumber, setRoomNumber] = useState('');
  const [selectedType, setSelectedType] = useState(() => effectiveRoomTypes[0]?.name || 'Standard Room');
  const [floor, setFloor] = useState('Floor 1');
  const [bed, setBed] = useState('King Bed');
  const [price, setPrice] = useState('2500');
  const [keyCardNo, setKeyCardNo] = useState('');
  const [isSmoking, setIsSmoking] = useState(false);
  const [phoneExt, setPhoneExt] = useState('');
  const [housekeeping, setHousekeeping] = useState('Clean');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form whenever modal opens or target editingRoom changes
  useEffect(() => {
    if (!isCreateRoomModalOpen) return;
    setError('');
    setIsSubmitting(false);

    if (editingRoom) {
      setActiveTab('addRoom');
      const existingNum = String(editingRoom.roomNumber || editingRoom.room_number || '').trim();
      const existingType = String(editingRoom.type || editingRoom.category || effectiveRoomTypes[0]?.name || 'Standard Room').trim();
      const existingFloor = String(editingRoom.floor || 'Floor 1').trim();
      const existingBed = String(editingRoom.bed || 'King Bed').trim();
      const existingPrice = Number(editingRoom.price ?? editingRoom.tariff ?? 2500);
      const existingStatus = String(editingRoom.status || 'VACANT_READY').toUpperCase();
      const defaultHk =
        existingStatus === 'DIRTY' ? 'Dirty' : existingStatus === 'MAINTENANCE' ? 'Maintenance' : 'Clean';

      setRoomNumber(existingNum);
      setSelectedType(existingType);
      setFloor(existingFloor);
      setBed(existingBed);
      setPrice(String(existingPrice > 0 ? existingPrice : 2500));
      setKeyCardNo(String(editingRoom.keyCardNo ?? editingRoom.key_card_no ?? ''));
      setPhoneExt(String(editingRoom.phoneExtension ?? editingRoom.phone_extension ?? ''));
      setIsSmoking(Boolean(editingRoom.isSmoking ?? editingRoom.is_smoking));
      setHousekeeping(String(editingRoom.housekeeping || defaultHk));
    } else {
      const defaultType = effectiveRoomTypes[0]?.name || 'Standard Room';
      const matched = effectiveRoomTypes.find(t => t.name === defaultType) || effectiveRoomTypes[0];
      setRoomNumber('');
      setSelectedType(defaultType);
      setFloor('Floor 1');
      setBed(matched?.beddingType || 'King Bed');
      setPrice(String(matched?.basePrice || 2500));
      setKeyCardNo('');
      setPhoneExt('');
      setIsSmoking(false);
      setHousekeeping('Clean');
    }
  }, [isCreateRoomModalOpen, editingRoom]);

  // Keep selectedType valid as roomTypes update in Create mode
  useEffect(() => {
    if (!isCreateRoomModalOpen || editingRoom) return;
    if (effectiveRoomTypes.length > 0) {
      const exists = effectiveRoomTypes.some(t => t.name === selectedType);
      if (!exists) {
        setSelectedType(effectiveRoomTypes[0].name);
        setPrice(String(effectiveRoomTypes[0].basePrice || 2500));
        setBed(effectiveRoomTypes[0].beddingType || 'King Bed');
      }
    }
  }, [effectiveRoomTypes, isCreateRoomModalOpen, editingRoom, selectedType]);

  const floorOptions = useMemo(() => {
    if (floor && !STANDARD_FLOOR_OPTIONS.includes(floor)) {
      return [floor, ...STANDARD_FLOOR_OPTIONS];
    }
    return STANDARD_FLOOR_OPTIONS;
  }, [floor]);

  const bedOptions = useMemo(() => {
    if (bed && !STANDARD_BED_OPTIONS.includes(bed)) {
      return [bed, ...STANDARD_BED_OPTIONS];
    }
    return STANDARD_BED_OPTIONS;
  }, [bed]);

  if (!isCreateRoomModalOpen) return null;

  const originalRoomNum = editingRoom ? String(editingRoom.roomNumber || editingRoom.room_number || '').trim() : '';
  const isActiveStayRoom =
    isEditMode && ['OCCUPIED', 'RESERVED'].includes(String(editingRoom?.status || '').toUpperCase());

  const handleCloseModal = () => {
    setEditingRoom?.(null);
    setIsCreateRoomModalOpen(false);
  };

  const handleCategoryChange = (catName) => {
    setSelectedType(catName);
    const matchedType = effectiveRoomTypes.find(rt => rt.name === catName);
    if (matchedType) {
      setPrice(String(matchedType.basePrice || 2500));
      setBed(matchedType.beddingType || 'King Bed');
    }
  };

  const handleSubmitRoom = async (e) => {
    e.preventDefault();
    setError('');

    if (isEditMode) {
      const trimmedNum = roomNumber.trim();
      if (!trimmedNum) {
        setError('Room Number is required.');
        return;
      }
      if (trimmedNum.includes(',')) {
        setError('Please enter a single Room Number when editing an existing room.');
        return;
      }

      const parsedTariff = Number(price);
      if (!Number.isFinite(parsedTariff) || parsedTariff <= 0) {
        setError('Please enter a valid Tariff Per Night.');
        return;
      }

      const duplicate = rooms.find(r => {
        const rNum = String(r.room_number || r.roomNumber || '').trim();
        if (rNum !== trimmedNum) return false;
        if (editingRoom?.id && r.id) return String(r.id) !== String(editingRoom.id);
        return rNum !== originalRoomNum;
      });
      if (duplicate) {
        setError(`Room #${trimmedNum} already exists in inventory.`);
        return;
      }

      setIsSubmitting(true);
      try {
        const matchedType = effectiveRoomTypes.find(rt => rt.name === selectedType);
        const result = await updateRoom(editingRoom, {
          roomNumber: trimmedNum,
          roomTypeId: matchedType?.id && !String(matchedType.id).startsWith('rt-inferred-') ? matchedType.id : editingRoom?.roomTypeId || null,
          type: selectedType,
          floor,
          bed,
          price: parsedTariff,
          keyCardNo: keyCardNo.trim(),
          isSmoking,
          phoneExtension: phoneExt.trim(),
          housekeeping
        });

        if (result && result.success === false) {
          setError(result.message || 'Failed to update room details.');
        }
      } catch (err) {
        setError(err?.message || 'Failed to update room details.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

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
          status: housekeeping === 'Clean' ? 'VACANT_READY' : housekeeping === 'Maintenance' ? 'MAINTENANCE' : 'DIRTY'
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
      handleCloseModal();
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
              {isEditMode ? <Edit3 className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-base tracking-wide">
                {isEditMode ? `Edit Room #${originalRoomNum}` : 'Room & Category Inventory Master'}
              </h3>
              <p className="text-xs text-indigo-200/80">
                {isEditMode
                  ? 'Update saved room number, category, tariff, floor & hardware details'
                  : 'Property Room Numbers & Category Setup'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 shrink-0 space-x-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('addRoom')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'addRoom'
                ? 'border-indigo-600 text-indigo-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {isEditMode ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isEditMode ? `Edit Room #${originalRoomNum}` : 'Add Room Number'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roomCategories')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'roomCategories'
                ? 'border-indigo-600 text-indigo-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Room Categories ({effectiveRoomTypes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manageRooms')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'manageRooms'
                ? 'border-indigo-600 text-indigo-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BedDouble className="w-3.5 h-3.5" />
            <span>Active Rooms ({rooms.length})</span>
          </button>
        </div>

        {/* Tab 1: Add / Edit Room Form */}
        {activeTab === 'addRoom' && (
          <form onSubmit={handleSubmitRoom} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            {/* SuperAdmin Quota / Edit Mode Status Banner */}
            {isEditMode ? (
              <div className="p-3.5 rounded-2xl border bg-sky-50/80 border-sky-200 text-sky-950 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block text-sky-700">
                    Editing Existing Inventory Record
                  </span>
                  <span className="font-bold text-xs mt-0.5 block">
                    {isActiveStayRoom
                      ? `Room #${originalRoomNum} is currently ${editingRoom.status} — stay status remains protected.`
                      : `Modifying Room #${originalRoomNum} pre-entered settings (${rooms.length} / ${assignedRoomLimit} rooms used).`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-900 border border-sky-200 font-bold text-[11px] shrink-0 transition cursor-pointer"
                >
                  + Add New Room
                </button>
              </div>
            ) : (
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
            )}

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
                  placeholder={isEditMode ? 'e.g. 101' : 'e.g. 101, 102, 204'}
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
                  {floorOptions.map(fl => (
                    <option key={fl} value={fl}>{fl === 'Executive Floor' ? 'Executive Penthouse Floor' : fl}</option>
                  ))}
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
                    className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
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
                  Bed Configuration
                </label>
                <select
                  value={bed}
                  onChange={(e) => setBed(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold outline-none"
                >
                  {bedOptions.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isEditMode ? 'Cleanliness / Condition' : 'Initial Cleanliness'}
                </label>
                <select
                  value={housekeeping}
                  onChange={(e) => setHousekeeping(e.target.value)}
                  disabled={isActiveStayRoom}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold outline-none disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="Clean">Clean (Ready for Check-In)</option>
                  <option value="Dirty">Dirty (Needs Turnover Cleaning)</option>
                  <option value="Inspected">Inspected & Verified</option>
                  {isEditMode && <option value="Maintenance">Maintenance (Blocked)</option>}
                </select>
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

            <div className="flex items-center space-x-2 pt-1">
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

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-bold shadow-md shadow-indigo-900/20 flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? isEditMode
                      ? 'Saving Changes...'
                      : 'Adding...'
                    : isEditMode
                      ? 'Save Room Changes'
                      : 'Add Room to Inventory'}
                </span>
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
                type="button"
                onClick={() => setIsRoomTypeModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs flex items-center space-x-1 shadow-xs cursor-pointer"
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

        {/* Tab 3: Active Rooms List (Editable by Admin, Deletion Controlled by SuperAdmin) */}
        {activeTab === 'manageRooms' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-3 text-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 text-sm">
                Room Numbers Directory ({rooms.length} / {assignedRoomLimit} Assigned)
              </h4>
              <span className="text-[11px] font-semibold text-slate-500">
                Deletion controlled by SuperAdmin • Click Edit to modify
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
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sortedRooms.map(r => {
                    const rNum = String(r.room_number || r.roomNumber);
                    return (
                      <tr key={r.id || rNum} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-bold font-mono text-slate-900">#{rNum}</td>
                        <td className="px-4 py-2.5 text-slate-700">{r.type || r.category || 'Standard Room'}</td>
                        <td className="px-4 py-2.5 text-slate-500">{r.floor || 'Floor 1'}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-800">₹{r.price || 2000}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            {r.status || 'VACANT_READY'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => openEditRoomModal(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-[11px] transition cursor-pointer"
                            title={`Edit Room #${rNum}`}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
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
