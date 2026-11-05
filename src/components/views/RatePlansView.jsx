import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Smartphone,
  User,
  Layers,
  ShieldCheck,
  Link2,
  Plus,
  FileText,
  ChevronDown,
  ChevronUp,
  Edit3,
  MoreVertical,
  X,
  Check,
  CheckCircle2,
  SlidersHorizontal,
  Calendar,
  Sparkles,
  Trophy,
  Coffee,
  Wifi,
  Tv,
  Wind,
  Bath,
  Share2,
  BedDouble,
  Clock,
  Globe,
  Tag
} from 'lucide-react';

// Exact 7 Room Categories from Screenshots
const INITIAL_ROOM_CATEGORIES = [
  {
    id: 'banquet-hall-1',
    name: 'Banquet Hall',
    code: 'BAN',
    totalRooms: 1,
    basePrice: 10000,
    plansCount: 1,
    otasCount: 5,
    maxOccupancy: 2,
    minPerson: 1,
    maxPerson: 2,
    minLos: 0,
    maxLos: 0,
    hsnCode: '996311',
    ranking: 0,
    shortCode: 'BAN',
    description: 'Spacious banquet hall designed for private gatherings, meetings, and residential functions.',
    isDayTrip: false,
    roomsList: ['Banquet Hall-1'],
    plans: [
      { name: 'EP Plan (Room Only)', code: 'EP', price: 10000, description: 'Flexible event & room tariff excluding meals.' }
    ],
    facilities: ['Air Conditioning', 'Free Wi-Fi', 'En-suite Bathroom', 'Projector & Audio', 'Power Backup']
  },
  {
    id: 'deluxe-non-ac',
    name: 'Deluxe Non AC',
    code: 'DNA',
    totalRooms: 2,
    basePrice: 2000,
    plansCount: 2,
    otasCount: 5,
    maxOccupancy: 2,
    minPerson: 1,
    maxPerson: 2,
    minLos: 0,
    maxLos: 0,
    hsnCode: '996311',
    ranking: 1,
    shortCode: 'DNA',
    description: 'Comfortable natural ventilation deluxe room with essential modern amenities.',
    isDayTrip: false,
    roomsList: ['Room 101', 'Room 102'],
    plans: [
      { name: 'EP Plan (Room Only)', code: 'EP', price: 2000, description: 'Room only plan.' },
      { name: 'CP Plan (Bed & Breakfast)', code: 'CP', price: 2350, description: 'Includes gourmet buffet breakfast.' }
    ],
    facilities: ['Ceiling Fan', 'Double Bed', 'Free Wi-Fi', 'Television', 'Attached Bathroom']
  },
  {
    id: 'deluxe-ac',
    name: 'Deluxe AC',
    code: 'DAC',
    totalRooms: 10,
    basePrice: 2500,
    plansCount: 3,
    otasCount: 6,
    maxOccupancy: 2,
    minPerson: 1,
    maxPerson: 2,
    minLos: 0,
    maxLos: 0,
    hsnCode: '996311',
    ranking: 2,
    shortCode: 'DAC',
    description: 'Fully climate-controlled deluxe room with king bed and premium furnishings.',
    isDayTrip: false,
    roomsList: ['Room 201', 'Room 202', 'Room 203', 'Room 204', 'Room 205', 'Room 206', 'Room 207', 'Room 208', 'Room 209', 'Room 210'],
    plans: [
      { name: 'EP Plan (Room Only)', code: 'EP', price: 2500, description: 'Room only tariff.' },
      { name: 'CP Plan (Bed & Breakfast)', code: 'CP', price: 2950, description: 'Buffet breakfast included.' },
      { name: 'MAP Plan (Half Board)', code: 'MAP', price: 3600, description: 'Includes Breakfast and Lunch or Dinner.' }
    ],
    facilities: ['Double Bed', 'Air Conditioning', 'Free Wi-Fi', 'Television', 'Work Desk', 'En-suite Bathroom']
  },
  {
    id: 'executive-non-ac',
    name: 'Executive Non AC',
    code: 'ENA',
    totalRooms: 2,
    basePrice: 3000,
    plansCount: 2,
    otasCount: 5,
    maxOccupancy: 3,
    minPerson: 1,
    maxPerson: 3,
    minLos: 0,
    maxLos: 0,
    hsnCode: '996311',
    ranking: 3,
    shortCode: 'ENA',
    description: 'Spacious executive room with lounge seating and pleasant ventilation.',
    isDayTrip: false,
    roomsList: ['Room 301', 'Room 302'],
    plans: [
      { name: 'EP Plan (Room Only)', code: 'EP', price: 3000, description: 'Room only tariff.' },
      { name: 'CP Plan (Bed & Breakfast)', code: 'CP', price: 3500, description: 'Breakfast included.' }
    ],
    facilities: ['Ceiling Fan', 'King Bed', 'Free Wi-Fi', 'Coffee Maker', 'Sofa Seating', 'Balcony']
  },
  {
    id: 'executive-ac',
    name: 'Executive AC',
    code: 'EAC',
    totalRooms: 10,
    basePrice: 3500,
    plansCount: 3,
    otasCount: 6,
    maxOccupancy: 3,
    minPerson: 1,
    maxPerson: 3,
    minLos: 0,
    maxLos: 0,
    hsnCode: '996311',
    ranking: 4,
    shortCode: 'EAC',
    description: 'Premium executive room with central cooling, ergonomic desk, and smart entertainment.',
    isDayTrip: false,
    roomsList: ['Room 303', 'Room 304', 'Room 305', 'Room 306', 'Room 307', 'Room 308', 'Room 309', 'Room 310', 'Room 311', 'Room 312'],
    plans: [
      { name: 'EP Plan (Room Only)', code: 'EP', price: 3500, description: 'Executive room only tariff.' },
      { name: 'CP Plan (Bed & Breakfast)', code: 'CP', price: 4100, description: 'Includes gourmet breakfast.' },
      { name: 'MAP Plan (Half Board)', code: 'MAP', price: 4900, description: 'Breakfast & Dinner buffet included.' }
    ],
    facilities: ['King Bed', 'Air Conditioning', 'Free Wi-Fi', 'Smart TV', 'Mini Bar', 'Bathrobe & Slippers', 'Work Desk']
  },
  {
    id: 'family-suite-non-ac',
    name: 'Family Suite Non AC',
    code: 'FNA',
    totalRooms: 1,
    basePrice: 4500,
    plansCount: 2,
    otasCount: 5,
    maxOccupancy: 4,
    minPerson: 1,
    maxPerson: 4,
    minLos: 0,
    maxLos: 0,
    hsnCode: '996311',
    ranking: 5,
    shortCode: 'FNA',
    description: 'Multi-room family suite with connected living area for extended stays.',
    isDayTrip: false,
    roomsList: ['Suite 401'],
    plans: [
      { name: 'EP Plan (Room Only)', code: 'EP', price: 4500, description: 'Family suite room only.' },
      { name: 'CP Plan (Bed & Breakfast)', code: 'CP', price: 5400, description: 'Breakfast for up to 4 guests.' }
    ],
    facilities: ['2 Double Beds', 'Ceiling Fan', 'Free Wi-Fi', 'Dining Area', 'Kitchenette', 'Living Area']
  },
  {
    id: 'family-suite-ac',
    name: 'Family Suite AC',
    code: 'FAC',
    totalRooms: 2,
    basePrice: 5500,
    plansCount: 2,
    otasCount: 6,
    maxOccupancy: 4,
    minPerson: 1,
    maxPerson: 4,
    minLos: 0,
    maxLos: 0,
    hsnCode: '996311',
    ranking: 6,
    shortCode: 'FAC',
    description: 'Luxury air-conditioned family suite featuring master bedroom, living hall, and 2 full bathrooms.',
    isDayTrip: false,
    roomsList: ['Suite 402', 'Suite 403'],
    plans: [
      { name: 'EP Plan (Room Only)', code: 'EP', price: 5500, description: 'AC Family suite room only.' },
      { name: 'AP Plan (Full Board)', code: 'AP', price: 7900, description: 'All meals included for family.' }
    ],
    facilities: ['2 King Beds', 'Air Conditioning', 'Free High-Speed Wi-Fi', '2 Smart TVs', '2 Bathrooms', 'Mini Bar', 'Living Room']
  }
];

export default function RatePlansView() {
  const { navigateTo, showNotification } = useDashboard();

  // Property Profile State (Matching Screenshot 1)
  const [propertyProfile, setPropertyProfile] = useState({
    name: 'AuraStay Suite',
    location: 'DIF Cyber City , Patia, Bhubaneswar, India, 751024',
    email: 'aurastaydemo123@gmail.com',
    phone: '',
    mobile: '7978578046',
    managerName: 'Twinkle Bagh',
    managerEmail: 'aurastaydemo123@gmail.com',
    managerPhone: '7608928399'
  });

  const [roomCategories, setRoomCategories] = useState(INITIAL_ROOM_CATEGORIES);
  const [expandedCategoryId, setExpandedCategoryId] = useState('banquet-hall-1'); // Expanded by default
  const [activeSubTab, setActiveSubTab] = useState('Details'); // 'Details' | 'Facilities' | 'Plan Details' | 'ARI' | 'OTA'

  // Modals state
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isAddRoomTypeModalOpen, setIsAddRoomTypeModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // New room type form state
  const [newRoomTypeData, setNewRoomTypeData] = useState({
    name: '',
    code: '',
    basePrice: 2000,
    maxOccupancy: 2
  });

  // New room modal form state
  const [newRoomData, setNewRoomData] = useState({
    categoryId: 'deluxe-ac',
    roomNumber: '',
    floor: 'Floor 1'
  });

  const toggleExpand = (id) => {
    setExpandedCategoryId(prev => (prev === id ? null : id));
  };

  // Add Room handler
  const handleAddRoom = (e) => {
    e.preventDefault();
    if (!newRoomData.roomNumber) {
      showNotification('Please enter a room number.');
      return;
    }

    setRoomCategories(prev => prev.map(cat => {
      if (cat.id === newRoomData.categoryId) {
        return {
          ...cat,
          totalRooms: cat.totalRooms + 1,
          roomsList: [...cat.roomsList, `Room ${newRoomData.roomNumber}`]
        };
      }
      return cat;
    }));

    showNotification(`Room ${newRoomData.roomNumber} added successfully!`);
    setIsAddRoomModalOpen(false);
    setNewRoomData({ categoryId: 'deluxe-ac', roomNumber: '', floor: 'Floor 1' });
  };

  // Add Room Type handler
  const handleAddRoomType = (e) => {
    e.preventDefault();
    if (!newRoomTypeData.name || !newRoomTypeData.code) {
      showNotification('Please enter both Room Type Name and Code.');
      return;
    }

    const created = {
      id: `custom-rt-${Date.now()}`,
      name: newRoomTypeData.name,
      code: newRoomTypeData.code.toUpperCase(),
      totalRooms: 1,
      basePrice: parseFloat(newRoomTypeData.basePrice) || 2000,
      plansCount: 1,
      otasCount: 5,
      maxOccupancy: parseInt(newRoomTypeData.maxOccupancy) || 2,
      minPerson: 1,
      maxPerson: parseInt(newRoomTypeData.maxOccupancy) || 2,
      minLos: 0,
      maxLos: 0,
      hsnCode: '996311',
      ranking: roomCategories.length,
      shortCode: newRoomTypeData.code.toUpperCase(),
      description: 'Newly configured room category.',
      isDayTrip: false,
      roomsList: ['New-01'],
      plans: [
        { name: 'EP Plan (Room Only)', code: 'EP', price: parseFloat(newRoomTypeData.basePrice) || 2000, description: 'Standard room-only rate.' }
      ],
      facilities: ['Free Wi-Fi', 'Air Conditioning', 'En-suite Bathroom']
    };

    setRoomCategories(prev => [...prev, created]);
    setExpandedCategoryId(created.id);
    showNotification(`Room category ${newRoomTypeData.name} created!`);
    setIsAddRoomTypeModalOpen(false);
    setNewRoomTypeData({ name: '', code: '', basePrice: 2000, maxOccupancy: 2 });
  };

  const totalRoomTypes = roomCategories.length;
  const totalPlans = roomCategories.reduce((acc, c) => acc + c.plansCount, 0);
  const totalOtas = 6;

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* 1. Breadcrumb (Home / Manage Property) */}
      <div className="flex items-center space-x-1.5 text-xs text-slate-500 pb-1 border-b border-slate-200">
        <span
          onClick={() => navigateTo('master-service-home')}
          className="hover:text-slate-900 cursor-pointer transition flex items-center gap-1"
        >
          🏠 Home
        </span>
        <span>/</span>
        <span className="font-semibold text-slate-900">
          Manage Property
        </span>
      </div>

      {/* 2. Top Header & Action Buttons */}
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

          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Manage Property
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure rooms, rate plans, availability, and OTA connections
          </p>
        </div>

        {/* Action Buttons: New Booking, Add Room Type, Add Room */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigateTo('reservation-management')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>New Booking</span>
          </button>

          <button
            onClick={() => setIsAddRoomTypeModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Room Type</span>
          </button>

          <button
            onClick={() => setIsAddRoomModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Room</span>
          </button>
        </div>
      </div>

      {/* 3. Property Card (Dark Teal Box with AuraStay Suite Info) */}
      <div className="bg-[#0e4860] text-white rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-1.5 shrink-0 shadow-xs">
            <div className="flex items-center space-x-0.5">
              <span className="font-extrabold text-lg text-[#0e4860]">b</span>
              <span className="font-bold text-xs text-slate-600">one</span>
            </div>
          </div>

          <div>
            <h2 className="text-base font-extrabold tracking-tight">
              {propertyProfile.name}
            </h2>
            <div className="flex items-center space-x-1.5 text-xs text-sky-200 mt-0.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{propertyProfile.location}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsEditProfileModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-white transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => showNotification('Property options')}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 transition"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Contact Details Strip (Row of 6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        {/* Email */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">EMAIL</span>
            <span className="font-semibold text-slate-800 text-[11px] truncate block" title={propertyProfile.email}>
              {propertyProfile.email}
            </span>
          </div>
        </div>

        {/* Phone */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PHONE</span>
            <span className="font-semibold text-slate-600 text-[11px]">
              {propertyProfile.phone || '—'}
            </span>
          </div>
        </div>

        {/* Mobile */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MOBILE</span>
            <span className="font-bold text-slate-800 text-[11px]">
              {propertyProfile.mobile}
            </span>
          </div>
        </div>

        {/* Manager Name */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MANAGER NAME</span>
            <span className="font-bold text-slate-800 text-[11px] truncate block">
              {propertyProfile.managerName}
            </span>
          </div>
        </div>

        {/* Manager Email */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MANAGER EMAIL</span>
            <span className="font-semibold text-slate-800 text-[11px] truncate block" title={propertyProfile.managerEmail}>
              {propertyProfile.managerEmail}
            </span>
          </div>
        </div>

        {/* Manager Phone */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MANAGER PHONE</span>
            <span className="font-bold text-slate-800 text-[11px]">
              {propertyProfile.managerPhone}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Metrics Cards: ROOM TYPES, TOTAL PLANS, OTA CONNECTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* ROOM TYPES: 7 */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              ROOM TYPES
            </span>
            <span className="text-2xl font-black text-slate-900 leading-tight">
              {totalRoomTypes}
            </span>
          </div>
        </div>

        {/* TOTAL PLANS: 15 */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              TOTAL PLANS
            </span>
            <span className="text-2xl font-black text-slate-900 leading-tight">
              {totalPlans}
            </span>
          </div>
        </div>

        {/* OTA CONNECTIONS: 6 */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              OTA CONNECTIONS
            </span>
            <span className="text-2xl font-black text-slate-900 leading-tight">
              {totalOtas}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Room Categories Accordions */}
      <div className="space-y-3">
        {roomCategories.map((cat) => {
          const isExpanded = expandedCategoryId === cat.id;

          return (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition"
            >
              {/* Collapsed / Main Bar */}
              <div
                onClick={() => toggleExpand(cat.id)}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition select-none ${
                  isExpanded ? 'bg-slate-50/70 border-b border-slate-200' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isExpanded ? 'bg-[#0e4860] text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {cat.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                        {cat.code}
                      </span>
                      <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {cat.totalRooms} rooms
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                      <span className="font-bold text-slate-800">
                        ₹{cat.basePrice.toLocaleString()} base
                      </span>
                      <span>•</span>
                      <span>{cat.plansCount} plans</span>
                      <span>•</span>
                      <span>{cat.otasCount} OTAs connected</span>
                      <span>•</span>
                      <span>Max {cat.maxOccupancy} guests</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewRoomData(prev => ({ ...prev, categoryId: cat.id }));
                      setIsAddRoomModalOpen(true);
                    }}
                    className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-600 transition"
                    title="Add Room to category"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      showNotification(`Category details: ${cat.name}`);
                    }}
                    className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-600 transition"
                    title="Documentation"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  <div className="p-1 text-slate-400">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Sub-Tabs Section */}
              {isExpanded && (
                <div className="p-5 animate-in fade-in duration-150">
                  {/* 5 Sub-Tabs Navigation */}
                  <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 mb-4 overflow-x-auto">
                    {[
                      { id: 'Details', label: 'Details' },
                      { id: 'Facilities', label: 'Facilities' },
                      { id: 'Plan Details', label: 'Plan Details' },
                      { id: 'ARI', label: 'Rate & Availability (ARI)' },
                      { id: 'OTA', label: 'Online Travel Agency (OTA)' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                          activeSubTab === tab.id
                            ? 'bg-[#0e4860] text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* SUB-TAB 1: DETAILS */}
                  {activeSubTab === 'Details' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ROOM TYPE</span>
                          <span className="font-bold text-slate-900">{cat.name}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">SHORT CODE</span>
                          <span className="font-bold text-slate-900">{cat.code}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">TOTAL ROOMS</span>
                          <span className="font-bold text-slate-900">{cat.totalRooms} Units</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">BASE RATE</span>
                          <span className="font-bold text-emerald-700">₹{cat.basePrice.toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">MIN / MAX PERSON</span>
                          <span className="font-bold text-slate-900">{cat.minPerson} / {cat.maxPerson} Guests</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">MIN / MAX LOS</span>
                          <span className="font-bold text-slate-900">{cat.minLos} / {cat.maxLos} Days</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">HSN CODE</span>
                          <span className="font-bold text-slate-900">{cat.hsnCode}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">RANKING</span>
                          <span className="font-bold text-slate-900">{cat.ranking}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">DESCRIPTION</span>
                        <p className="text-slate-700 leading-relaxed">{cat.description}</p>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">ALLOCATED PHYSICAL UNITS</span>
                        <div className="flex flex-wrap gap-2">
                          {cat.roomsList.map((rm, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 rounded-md font-bold text-slate-800 shadow-2xs">
                              {rm}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: FACILITIES */}
                  {activeSubTab === 'Facilities' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                        {[
                          { name: 'Double Bed', icon: BedDouble },
                          { name: 'Air Conditioning', icon: Wind },
                          { name: 'Free Wi-Fi', icon: Wifi },
                          { name: 'Television', icon: Tv },
                          { name: 'Coffee / Tea Maker', icon: Coffee },
                          { name: 'En-suite Bathroom', icon: Bath },
                          { name: '24h Room Service', icon: Clock },
                          { name: 'Complimentary Breakfast', icon: Coffee },
                          { name: 'Dedicated Work Desk', icon: Building2 },
                          { name: 'Balcony View', icon: Globe },
                        ].map((fac, idx) => {
                          const IconComp = fac.icon;
                          const isIncluded = cat.facilities.includes(fac.name) || idx < 4;
                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border flex items-center space-x-2.5 transition ${
                                isIncluded
                                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                            >
                              <IconComp className={`w-4 h-4 ${isIncluded ? 'text-emerald-600' : 'text-slate-400'}`} />
                              <span className="text-xs">{fac.name}</span>
                              {isIncluded && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 3: PLAN DETAILS */}
                  {activeSubTab === 'Plan Details' && (
                    <div className="space-y-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold">
                              <th className="p-2.5">PLAN CODE</th>
                              <th className="p-2.5">PLAN NAME</th>
                              <th className="p-2.5">BASE TARIFF</th>
                              <th className="p-2.5">DETAILS</th>
                              <th className="p-2.5">STATUS</th>
                              <th className="p-2.5 text-right">ACTION</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {cat.plans.map((p, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2.5 font-bold text-sky-700">{p.code}</td>
                                <td className="p-2.5 font-bold text-slate-800">{p.name}</td>
                                <td className="p-2.5 font-bold text-emerald-700">₹{p.price.toLocaleString()}</td>
                                <td className="p-2.5 text-slate-600">{p.description}</td>
                                <td className="p-2.5">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    ACTIVE
                                  </span>
                                </td>
                                <td className="p-2.5 text-right">
                                  <button
                                    onClick={() => showNotification(`Editing plan ${p.code}`)}
                                    className="text-xs text-sky-700 hover:text-sky-900 font-bold"
                                  >
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 4: ARI */}
                  {activeSubTab === 'ARI' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <SlidersHorizontal className="w-4 h-4 text-sky-700" />
                          <span>Live 7-Day Rates & Availability for <strong>{cat.name}</strong></span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Live Sync</span>
                      </div>

                      <div className="grid grid-cols-7 gap-2 text-center text-xs">
                        {['Thu 05', 'Fri 06', 'Sat 07', 'Sun 08', 'Mon 09', 'Tue 10', 'Wed 11'].map((day, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">{day}</span>
                            <span className="font-extrabold text-emerald-700 block">₹{cat.basePrice.toLocaleString()}</span>
                            <span className="text-[9.5px] font-semibold text-slate-500 block mt-1">Avail: {cat.totalRooms}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 5: OTA */}
                  {activeSubTab === 'OTA' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        {[
                          { name: 'Booking.com', multiplier: '+0%', status: 'Connected' },
                          { name: 'Agoda', multiplier: '+0%', status: 'Connected' },
                          { name: 'Expedia', multiplier: '+5%', status: 'Connected' },
                          { name: 'MakeMyTrip', multiplier: '+0%', status: 'Connected' },
                          { name: 'Goibibo', multiplier: '+0%', status: 'Connected' },
                          { name: 'Airbnb', multiplier: '+8%', status: 'Connected' },
                        ].map((ota, idx) => (
                          <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-900 block">{ota.name}</span>
                              <span className="text-[10px] text-slate-500">Markup: {ota.multiplier}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {ota.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL 1: ADD ROOM */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#0e4860] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Add New Room Unit</h3>
              <button
                onClick={() => setIsAddRoomModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Select Room Category
                </label>
                <select
                  value={newRoomData.categoryId}
                  onChange={(e) => setNewRoomData({ ...newRoomData, categoryId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  {roomCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Room Number / Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 211"
                  value={newRoomData.roomNumber}
                  onChange={(e) => setNewRoomData({ ...newRoomData, roomNumber: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Floor
                </label>
                <select
                  value={newRoomData.floor}
                  onChange={(e) => setNewRoomData({ ...newRoomData, floor: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                >
                  <option value="Ground Floor">Ground Floor (GF)</option>
                  <option value="Floor 1">1st Floor</option>
                  <option value="Floor 2">2nd Floor</option>
                  <option value="Floor 3">3rd Floor</option>
                  <option value="Floor 4">4th Floor</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddRoomModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold"
                >
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD ROOM TYPE */}
      {isAddRoomTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#0e4860] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Add New Room Type</h3>
              <button
                onClick={() => setIsAddRoomTypeModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRoomType} className="p-5 space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Room Type Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Penthouse"
                  value={newRoomTypeData.name}
                  onChange={(e) => setNewRoomTypeData({ ...newRoomTypeData, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Short Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RPH"
                    value={newRoomTypeData.code}
                    onChange={(e) => setNewRoomTypeData({ ...newRoomTypeData, code: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Base Price (₹)
                  </label>
                  <input
                    type="number"
                    value={newRoomTypeData.basePrice}
                    onChange={(e) => setNewRoomTypeData({ ...newRoomTypeData, basePrice: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Max Occupancy
                </label>
                <input
                  type="number"
                  value={newRoomTypeData.maxOccupancy}
                  onChange={(e) => setNewRoomTypeData({ ...newRoomTypeData, maxOccupancy: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddRoomTypeModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold"
                >
                  Create Room Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT PROPERTY PROFILE */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#0e4860] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Edit Property Profile</h3>
              <button
                onClick={() => setIsEditProfileModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showNotification('Property profile updated successfully!');
                setIsEditProfileModalOpen(false);
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Property Name</label>
                <input
                  type="text"
                  value={propertyProfile.name}
                  onChange={(e) => setPropertyProfile({ ...propertyProfile, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Location / Address</label>
                <input
                  type="text"
                  value={propertyProfile.location}
                  onChange={(e) => setPropertyProfile({ ...propertyProfile, location: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Email</label>
                  <input
                    type="email"
                    value={propertyProfile.email}
                    onChange={(e) => setPropertyProfile({ ...propertyProfile, email: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Mobile</label>
                  <input
                    type="text"
                    value={propertyProfile.mobile}
                    onChange={(e) => setPropertyProfile({ ...propertyProfile, mobile: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Manager Name</label>
                  <input
                    type="text"
                    value={propertyProfile.managerName}
                    onChange={(e) => setPropertyProfile({ ...propertyProfile, managerName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Manager Phone</label>
                  <input
                    type="text"
                    value={propertyProfile.managerPhone}
                    onChange={(e) => setPropertyProfile({ ...propertyProfile, managerPhone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
