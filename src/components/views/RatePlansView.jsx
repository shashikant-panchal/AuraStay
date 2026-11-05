import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  Tag,
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
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  Edit3,
  MoreVertical,
  Image as ImageIcon,
  X,
  Check,
  CheckCircle2,
  SlidersHorizontal,
  Percent,
  Calendar,
  Edit3,
  ShieldCheck,
  ArrowUpRight,
  TrendingUp,
  AlertCircle
  Tag,
  Sparkles,
  Trophy,
  Coffee,
  Wifi,
  Tv,
  Wind,
  Bath,
  Share2
} from 'lucide-react';

// Exact 7 Room Categories from Screenshots 1 & 2
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
    hsnCode: '9963',
    ranking: 0,
    shortCode: 'BAN-1',
    description: 'Luxury pillarless banquet and conference hall for executive summits and private galas.',
    isDayTrip: false,
    roomsList: ['Hall 1'],
    plans: [
      { name: 'EP Plan (Hall Only)', code: 'EP', price: 10000, description: 'Hall reservation with audiovisual setup.' }
    ],
    facilities: ['Air Conditioning', 'High Speed Wi-Fi', 'PA Audio System', 'Projector & Screen', 'Daily Housekeeping']
  },
  {
    id: 'day-trip',
    name: 'DayTrip',
    code: 'DAY',
    totalRooms: 5,
    basePrice: 1000,
    plansCount: 1,
    otasCount: 5,
    maxOccupancy: 200,
    minPerson: 1,
    maxPerson: 200,
    minLos: 0,
    maxLos: 0,
    hsnCode: '9963',
    ranking: 1,
    shortCode: 'DAY-OUT',
    description: 'Day outing and leisure experience with access to swimming pool and resort gardens.',
    isDayTrip: true,
    roomsList: ['Day Outing 1', 'Day Outing 2', 'Day Outing 3', 'Day Outing 4', 'Day Outing 5'],
    plans: [
      { name: 'Day Outing Pass', code: 'DAY-PASS', price: 1000, description: 'Access from 10:00 AM to 06:00 PM.' }
    ],
    facilities: ['Garden Access', 'Swimming Pool', 'Changing Rooms', 'Free Wi-Fi', 'Dining Area']
  },
  {
    id: 'banquet-hall-2',
    name: 'Banquet Hall',
    code: 'BAN',
    totalRooms: 2,
    basePrice: 5000,
    plansCount: 2,
    otasCount: 5,
    maxOccupancy: 2000,
    minPerson: 10,
    maxPerson: 2000,
    minLos: 0,
    maxLos: 0,
    hsnCode: '9963',
    ranking: 2,
    shortCode: 'BAN-2',
    description: 'Grand ballroom and open lawn for weddings, banquets, and major corporate exhibitions.',
    isDayTrip: false,
    roomsList: ['Grand Ballroom', 'Open Lawn Pavilion'],
    plans: [
      { name: 'Standard Banquet Package', code: 'BAN-STD', price: 5000, description: 'Stage setup & standard lighting.' },
      { name: 'Premium Gala Package', code: 'BAN-PREM', price: 7500, description: 'Full banquet setup with green rooms.' }
    ],
    facilities: ['Air Conditioning', 'Lawn Access', 'Stage Lighting', 'Audio Console', 'Valet Parking']
  },
  {
    id: 'suite-room',
    name: 'Suite Room',
    code: 'SUI',
    totalRooms: 5,
    basePrice: 3500,
    plansCount: 3,
    otasCount: 5,
    maxOccupancy: 3,
    minPerson: 1,
    maxPerson: 3,
    minLos: 0,
    maxLos: 0,
    hsnCode: '996311',
    ranking: 3,
    shortCode: 'SUI-STE',
    description: 'Expansive master bedroom suite with separate living parlor, walk-in closet, and panoramic views.',
    isDayTrip: false,
    roomsList: ['401', '402', '403', '404', '405'],
    plans: [
      { name: 'EP Plan (Room Only)', code: 'EP', price: 3500, description: 'Suite accommodation room-only.' },
      { name: 'CP Plan (Bed & Breakfast)', code: 'CP', price: 4100, description: 'Buffet breakfast at The Spice Pavilion.' },
      { name: 'MAP Plan (Half Board)', code: 'MAP', price: 4900, description: 'Includes gourmet dinner buffet.' }
    ],
    facilities: ['King Bed', 'Living Room', 'Free Wi-Fi', 'Air Conditioning', 'Bathtub & Geyser', 'Smart TV', 'Mini Bar']
  },
  {
    id: 'super-deluxe-room',
    name: 'Super Deluxe Room',
    code: 'SUP',
    totalRooms: 5,
    basePrice: 3000,
    plansCount: 3,
    otasCount: 5,
    maxOccupancy: 3,
    minPerson: 1,
    maxPerson: 3,
    minLos: 0,
    maxLos: 0,
    hsnCode: '996311',
    ranking: 4,
    shortCode: 'SUP-DLX',
    description: 'Premium guestroom with handcrafted teak furniture, balcony, and modern bathroom amenities.',
    isDayTrip: false,
    roomsList: ['301', '302', '303', '304', '305'],
    plans: [
      { name: 'EP Plan (Room Only)', code: 'EP', price: 3000, description: 'Room only rate.' },
      { name: 'CP Plan (Bed & Breakfast)', code: 'CP', price: 3500, description: 'Inclusive of continental buffet breakfast.' },
      { name: 'MAP Plan (Half Board)', code: 'MAP', price: 4200, description: 'Breakfast & Chef lunch or dinner.' }
    ],
    facilities: ['Balcony View', 'King/Twin Bed', 'Free Wi-Fi', 'Air Conditioning', 'Smart TV', 'Tea/Coffee Maker']
  },
  {
    id: 'deluxe-room',
    name: 'Deluxe Room',
    code: 'DEL',
    totalRooms: 5,
    basePrice: 2500,
    plansCount: 2,
    otasCount: 5,
    maxOccupancy: 3,
    minPerson: 1,
    maxPerson: 3,
    minLos: 0,
    maxLos: 0,
    hsnCode: '996311',
    ranking: 5,
    shortCode: 'DLX-RM',
    description: 'Comfortable guestroom with workspace, soundproofed windows, and plush bed linen.',
    isDayTrip: false,
    roomsList: ['201', '202', '203', '204', '205'],
    plans: [
      { name: 'EP Plan (Room Only)', code: 'EP', price: 2500, description: 'Standard room-only flexible rate.' },
      { name: 'CP Plan (Bed & Breakfast)', code: 'CP', price: 2900, description: 'Inclusive of breakfast buffet.' }
    ],
    facilities: ['King Bed', 'Free Wi-Fi', 'Air Conditioning', 'Work Desk', 'Geyser', 'Daily Housekeeping']
  },
  {
    id: 'standard-room',
    name: 'Standard Room',
    code: 'STD',
    totalRooms: 5,
    basePrice: 2000,
    plansCount: 3,
    otasCount: 5,
    maxOccupancy: 2,
    minPerson: 1,
    maxPerson: 2,
    minLos: 0,
    maxLos: 0,
    hsnCode: '996311',
    ranking: 6,
    shortCode: 'STD-RM',
    description: 'Cozy and functional hotel room ideal for business travelers and short stays.',
    isDayTrip: false,
    roomsList: ['101', '102', '103', '104', '105'],
    plans: [
      { name: 'EP Plan (Room Only)', code: 'EP', price: 2000, description: 'Standard room-only rate.' },
      { name: 'CP Plan (Bed & Breakfast)', code: 'CP', price: 2400, description: 'Inclusive of breakfast buffet.' },
      { name: 'MAP Plan (Half Board)', code: 'MAP', price: 3100, description: 'Breakfast & Dinner included.' }
    ],
    facilities: ['Double Bed', 'Free Wi-Fi', 'Air Conditioning', 'En-suite Bathroom', 'Room Service']
  }
];

export default function RatePlansView() {
  const { showNotification } = useDashboard();
  const { navigateTo, showNotification } = useDashboard();

  const [activePlanCategory, setActivePlanCategory] = useState('ALL');
  const [plans, setPlans] = useState([
    {
      id: 'RP-EP-01',
      code: 'EP',
      name: 'European Plan (Room Only)',
      description: 'Standard flexible room-only rate with complimentary high-speed Wi-Fi & gym access.',
      mealPlan: 'Room Only',
      multiplier: 1.0,
      cancellation: 'Free cancellation up to 24 hrs prior to check-in',
      status: 'ACTIVE',
      baseRates: {
        'Standard Room': 2000,
        'Deluxe King': 3200,
        'Executive Suite': 4500,
        'Presidential Suite': 7500,
      },
      directDiscount: '5% BookMax Direct Promo',
      color: 'blue'
    },
    {
      id: 'RP-CP-02',
      code: 'CP',
      name: 'Continental Plan (Bed & Breakfast)',
      description: 'Room inclusive of lavish buffet breakfast at The Spice Pavilion.',
      mealPlan: 'Breakfast Included',
      multiplier: 1.2,
      cancellation: 'Free cancellation up to 24 hrs prior to check-in',
      status: 'ACTIVE',
      baseRates: {
        'Standard Room': 2400,
        'Deluxe King': 3700,
        'Executive Suite': 5100,
        'Presidential Suite': 8400,
      },
      directDiscount: 'Complimentary early check-in',
      color: 'emerald'
    },
    {
      id: 'RP-MAP-03',
      code: 'MAP',
      name: 'Modified American Plan (Half Board)',
      description: 'Includes breakfast plus gourmet lunch or dinner buffet.',
      mealPlan: 'Breakfast + Lunch/Dinner',
      multiplier: 1.45,
      cancellation: '48 hrs cancellation notice required',
      status: 'ACTIVE',
      baseRates: {
        'Standard Room': 3100,
        'Deluxe King': 4500,
        'Executive Suite': 6200,
        'Presidential Suite': 9800,
      },
      directDiscount: '15% on Spa & Wellness',
      color: 'amber'
    },
    {
      id: 'RP-AP-04',
      code: 'AP',
      name: 'American Plan (Full Board)',
      description: 'All-inclusive hospitality: breakfast, lunch, and chef dinner table.',
      mealPlan: 'All 3 Meals Included',
      multiplier: 1.7,
      cancellation: 'Non-refundable within 72 hrs',
      status: 'ACTIVE',
      baseRates: {
        'Standard Room': 3800,
        'Deluxe King': 5400,
        'Executive Suite': 7200,
        'Presidential Suite': 11200,
      },
      directDiscount: 'Airport transfer complimentary',
      color: 'purple'
    },
    {
      id: 'RP-NR-05',
      code: 'NR10',
      name: 'Non-Refundable Saver Rate',
      description: 'Strictly non-refundable advance purchase with a guaranteed 10% markdown.',
      mealPlan: 'Room Only (Discounted)',
      multiplier: 0.9,
      cancellation: 'Strictly Non-refundable',
      status: 'ACTIVE',
      baseRates: {
        'Standard Room': 1800,
        'Deluxe King': 2880,
        'Executive Suite': 4050,
        'Presidential Suite': 6750,
      },
      directDiscount: 'Best Rate Guaranteed',
      color: 'rose'
    },
  ]);
  const [roomCategories, setRoomCategories] = useState(INITIAL_ROOM_CATEGORIES);
  const [expandedCategoryId, setExpandedCategoryId] = useState('banquet-hall-1'); // Expanded by default (Screenshot 4)
  const [activeSubTab, setActiveSubTab] = useState('Details'); // 'Details' | 'Facilities' | 'Plan Details' | 'Rate and Availability' | 'Online Travel Agency'

  const [weekendSurgeActive, setWeekendSurgeActive] = useState(true);
  const [editingRate, setEditingRate] = useState(null);
  // Modals state
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isAddRoomTypeModalOpen, setIsAddRoomTypeModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const togglePlanStatus = (id) => {
    setPlans(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        showNotification(`Rate Plan ${p.name} set to ${nextStatus}`);
        return { ...p, status: nextStatus };
        // Property Profile State
        const [propertyProfile, setPropertyProfile] = useState({
          name: 'BookOne Suite',
          location: 'DIF Cyber City , Patia, Bhubaneswar, India, 751024',
          email: 'bookonedemo123@gmail.com',
          phone: '',
          mobile: '7978578046',
          managerName: 'Twinkle Bagh',
          managerEmail: 'bookonedemo123@gmail.com',
          managerPhone: '7608928399'
        });

        // Add Room form state (Screenshot 3)
        const [newRoomData, setNewRoomData] = useState({
          roomType: 'Banquet Hall',
          floor: 'Ground Floor',
          roomNo: '',
          seqNo: '1',
          noOfBeds: '1',
          bedType: 'King',
          bedDescription: 'Plush mattress with cotton linen',
          roomDescription: ''
        });

        // Add Room Type form state
        const [newRoomTypeData, setNewRoomTypeData] = useState({
          name: '',
          code: '',
          basePrice: 2000,
          maxOccupancy: 2
        });

        const toggleExpand = (catId) => {
          setExpandedCategoryId(prev => prev === catId ? null : catId);
        };

        const handleSaveRoom = (e) => {
          e.preventDefault();
          if (!newRoomData.roomNo) {
            showNotification('Please enter a room number.');
            return;
          }

          setRoomCategories(prev => prev.map(cat => {
            if (cat.name === newRoomData.roomType) {
              return {
                ...cat,
                totalRooms: cat.totalRooms + 1,
                roomsList: [...cat.roomsList, newRoomData.roomNo]
              };
            }
            return p;
            return cat;
          }));

          showNotification(`Room ${newRoomData.roomNo} successfully added to ${newRoomData.roomType}!`);
          setIsAddRoomModalOpen(false);
          setNewRoomData({
            roomType: 'Banquet Hall',
            floor: 'Ground Floor',
            roomNo: '',
            seqNo: '1',
            noOfBeds: '1',
            bedType: 'King',
            bedDescription: 'Plush mattress with cotton linen',
            roomDescription: ''
          });
        };

        const handleSaveRoomType = (e) => {
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
            description: 'Newly created hospitality room category.',
            isDayTrip: false,
            roomsList: ['New-01'],
            plans: [
              { name: 'EP Plan (Room Only)', code: 'EP', price: parseFloat(newRoomTypeData.basePrice) || 2000, description: 'Standard room-only rate.' }
            ],
            facilities: ['Free Wi-Fi', 'Air Conditioning', 'Daily Housekeeping']
          };

          setRoomCategories(prev => [...prev, created]);
          setExpandedCategoryId(created.id);
          showNotification(`Room type ${newRoomTypeData.name} created successfully!`);
          setIsAddRoomTypeModalOpen(false);
        };

        // Summary Metrics matching Screenshot 1
        const totalRoomTypes = roomCategories.length;
        const totalPlans = roomCategories.reduce((acc, c) => acc + c.plansCount, 0);
        const totalOtas = 6;

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-4 animate-in fade-in duration-200">

                {/* 1. Breadcrumb (Screenshot 1: Home / Manage Property) */}
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

                {/* 2. Top Header & Action Buttons (Screenshot 1) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Tag className="w-5 h-5 text-sky-600" />
                      <h2 className="text-base font-bold text-slate-900">
                        Rate Plans & Pricing Strategies
                      </h2>
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-300 px-2 py-0.5 rounded tracking-wider">
                          BOOKONE PMS
                        </span>
                        <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" /> MASTERY: 0%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Configure meal plan tariffs (EP, CP, MAP, AP), channel multipliers, and dynamic yield rules.

                        <h1 className="text-xl font-black text-slate-900 tracking-tight">
                          Manage Property
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Configure rooms, rate plans, availability, and OTA connections
                        </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setWeekendSurgeActive(!weekendSurgeActive);
                          showNotification(`Weekend dynamic surcharge ${!weekendSurgeActive ? 'Enabled (+20%)' : 'Disabled'}`);
                        }}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 border transition shadow-xs ${weekendSurgeActive
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        {/* Action Buttons (Screenshot 1: New Booking, Add Room Type, Add Room) */}
        <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => navigateTo('reservation-management')}
                          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold shadow-2xs transition"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                          <span>Weekend Dynamic Surge (+20%): {weekendSurgeActive ? 'ON' : 'OFF'}</span>
                          <FileText className="w-3.5 h-3.5" />
                          <span>New Booking</span>
                        </button>

                        <button
                          onClick={() => showNotification('Rate Plan Creator opened.')}
                          className="flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                          onClick={() => setIsAddRoomTypeModalOpen(true)}
                          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold shadow-2xs transition"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Rate Plan</span>
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

                    {/* KPI Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Rate Plans</div>
                        <div className="text-2xl font-black text-slate-900 mt-1">{plans.filter(p => p.status === 'ACTIVE').length} / {plans.length}</div>
                        <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 100% Rate Parity Synchronized
                          {/* 3. Property Card (Dark Teal Box with bookone Logo - Screenshot 1) */}
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

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Standard Base EP Rate</div>
                              <div className="text-2xl font-black text-slate-900 mt-1">₹2,000 <span className="text-xs text-slate-400 font-normal">/ night</span></div>
                              <div className="text-[11px] text-slate-500 mt-1">Standard Room Starting Tier</div>
                              <div className="flex items-center space-x-2 shrink-0">
                                <button
                                  onClick={() => setIsEditProfileModalOpen(true)}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-white transition"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit Profile</span>
                                </button>
                                <button
                                  onClick={() => showNotification('More property options')}
                                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 transition"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Highest Tariff (AP)</div>
                              <div className="text-2xl font-black text-indigo-700 mt-1">₹11,200 <span className="text-xs text-slate-400 font-normal">/ night</span></div>
                              <div className="text-[11px] text-slate-500 mt-1">Presidential Full Board</div>
                              {/* 4. Contact Details Strip (Screenshot 1) */}
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

                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Direct Booking Edge</div>
                                  <div className="text-2xl font-black text-emerald-700 mt-1">5% – 10%</div>
                                  <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Direct Channel Advantage
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
                                      <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MANAGER NAME</span>
                                        <span className="font-bold text-slate-800 text-[11px]">
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

                                  {/* Plans List */}
                                  <div className="space-y-4">
                                    {plans.map(plan => (
                                      <div key={plan.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                                        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
                                          <div className="flex items-start space-x-3.5">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0 shadow-sm ${plan.color === 'blue' ? 'bg-sky-600' :
                                                plan.color === 'emerald' ? 'bg-emerald-600' :
                                                  plan.color === 'amber' ? 'bg-amber-600' :
                                                    plan.color === 'purple' ? 'bg-purple-600' : 'bg-rose-600'
                                              }`}>
                                              {plan.code}
                                            </div>
                                            <div>
                                              <div className="flex items-center space-x-2">
                                                <h3 className="text-sm font-bold text-slate-900">{plan.name}</h3>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${plan.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                                  }`}>
                                                  {plan.status}
                                                </span>
                                                {/* 5. Three KPI Cards (Screenshot 1: ROOM TYPES, TOTAL PLANS, OTA CONNECTIONS) */}
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

                                                {/* 6. Room Categories & Rate Plans Accordions (Screenshots 1, 2, 4, 5) */}
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
                                                          className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition select-none ${isExpanded ? 'bg-slate-50/70 border-b border-slate-200' : 'hover:bg-slate-50/60'
                                                            }`}
                                                        >
                                                          <div className="flex items-center space-x-3.5">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isExpanded ? 'bg-[#0e4860] text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                                                              }`}>
                                                              <Building2 className="w-5 h-5" />
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>
                                                            <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2">
                                                              <span>Meal Type: <strong className="text-slate-700">{plan.mealPlan}</strong></span>
                                                              <span>•</span>
                                                              <span>Policy: <strong className="text-slate-700">{plan.cancellation}</strong></span>

                                                              <div>
                                                                <div className="flex items-center space-x-2">
                                                                  <h3 className="font-bold text-slate-900 text-sm">
                                                                    {cat.name}
                                                                  </h3>
                                                                  <span className="px-2 py-0.5 rounded border border-slate-300 text-[10px] font-bold text-slate-700 bg-white">
                                                                    {cat.code}
                                                                  </span>
                                                                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                                                                    {cat.totalRooms} rooms
                                                                  </span>
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1 font-medium">
                                                                  <span>₹{cat.basePrice.toLocaleString()} base</span>
                                                                  <span>•</span>
                                                                  <span>{cat.plansCount} plans</span>
                                                                  <span>•</span>
                                                                  <span>{cat.otasCount} OTAs connected</span>
                                                                  <span>•</span>
                                                                  <span>Max {cat.maxOccupancy} guests</span>
                                                                </div>
                                                              </div>
                                                            </div>

                                                            {/* Right Quick Controls */}
                                                            <div className="flex items-center space-x-2 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                                                              <button
                                                                onClick={() => {
                                                                  setNewRoomData(prev => ({ ...prev, roomType: cat.name }));
                                                                  setIsAddRoomModalOpen(true);
                                                                }}
                                                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                                                title="Add Room to this category"
                                                              >
                                                                <Plus className="w-4 h-4" />
                                                              </button>

                                                              <button
                                                                onClick={() => showNotification(`Exporting details for ${cat.name}...`)}
                                                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                                                title="View Document"
                                                              >
                                                                <FileText className="w-4 h-4" />
                                                              </button>

                                                              <button
                                                                onClick={() => toggleExpand(cat.id)}
                                                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                                              >
                                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                              </button>
                                                            </div>
                                                          </div>

                                                          <div className="flex items-center space-x-3">
                                                            {/* EXPANDED VIEW (Screenshots 4 & 5) */}
                                                            {isExpanded && (
                                                              <div className="p-5 space-y-5 animate-in fade-in duration-150">

                                                                {/* Expanded Navigation Sub-Tabs */}
                                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
                                                                  <div className="flex flex-wrap items-center gap-6 text-xs font-bold">
                                                                    {['Details', 'Facilities', 'Plan Details', 'Rate and Availability', 'Online Travel Agency'].map(tab => (
                                                                      <button
                                                                        key={tab}
                                                                        onClick={() => setActiveSubTab(tab)}
                                                                        className={`pb-2.5 transition relative ${activeSubTab === tab
                                                                            ? 'text-[#0e4860] border-b-2 border-[#0e4860] font-black'
                                                                            : 'text-slate-500 hover:text-slate-800 font-semibold'
                                                                          }`}
                                                                      >
                                                                        {tab}
                                                                      </button>
                                                                    ))}
                                                                  </div>

                                                                  <button
                                                                    onClick={() => showNotification(`Editing room configuration for ${cat.name}`)}
                                                                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#0e4860] hover:bg-[#135d7c] text-white rounded-lg text-xs font-bold shadow-2xs transition self-start sm:self-auto"
                                                                  >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                    <span>Edit</span>
                                                                  </button>
                                                                </div>

                                                                {/* TAB 1: DETAILS (Screenshots 4 & 5) */}
                                                                {activeSubTab === 'Details' && (
                                                                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">

                                                                    {/* Left Side: Room Specs & Form Inputs (Cols 1-7) */}
                                                                    <div className="lg:col-span-7 space-y-4">

                                                                      {/* Name & Code */}
                                                                      <div className="space-y-2">
                                                                        <div>
                                                                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                                                            ROOM TYPE NAME
                                                                          </span>
                                                                          <span className="font-extrabold text-slate-900 text-sm">
                                                                            {cat.name}
                                                                          </span>
                                                                        </div>

                                                                        <div>
                                                                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                                                            ROOM TYPE CODE
                                                                          </span>
                                                                          <span className="font-bold text-slate-900">
                                                                            {cat.code}
                                                                          </span>
                                                                        </div>

                                                                        <div>
                                                                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                                                            DESCRIPTION
                                                                          </span>
                                                                          <span className="text-slate-600">
                                                                            {cat.description || '-'}
                                                                          </span>
                                                                        </div>
                                                                      </div>

                                                                      {/* 3 Metric Cards (TOTAL ROOMS, BASE PRICE, MAX OCCUPANCY) */}
                                                                      <div className="grid grid-cols-3 gap-3">
                                                                        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 text-center">
                                                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                                                                            TOTAL ROOMS
                                                                          </span>
                                                                          <span className="text-xl font-black text-slate-900 mt-0.5 block">
                                                                            {cat.totalRooms}
                                                                          </span>
                                                                        </div>

                                                                        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 text-center">
                                                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                                                                            BASE PRICE
                                                                          </span>
                                                                          <span className="text-xl font-black text-slate-900 mt-0.5 block">
                                                                            ₹{cat.basePrice.toLocaleString()}
                                                                          </span>
                                                                        </div>

                                                                        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 text-center">
                                                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                                                                            MAX OCCUPANCY
                                                                          </span>
                                                                          <span className="text-xl font-black text-slate-900 mt-0.5 block">
                                                                            {cat.maxOccupancy}
                                                                          </span>
                                                                        </div>
                                                                      </div>

                                                                      {/* Detailed Numeric Inputs Row 1 (Screenshot 5) */}
                                                                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                                                        <div>
                                                                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                                                                            No Of Rooms *
                                                                          </label>
                                                                          <input
                                                                            type="number"
                                                                            readOnly
                                                                            value={cat.totalRooms}
                                                                            className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                                                                          />
                                                                        </div>

                                                                        <div>
                                                                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                                                                            No Of Person (Min)
                                                                          </label>
                                                                          <input
                                                                            type="number"
                                                                            readOnly
                                                                            value={cat.minPerson}
                                                                            className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                                                                          />
                                                                        </div>

                                                                        <div>
                                                                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                                                                            No Of Person (Max)
                                                                          </label>
                                                                          <input
                                                                            type="number"
                                                                            readOnly
                                                                            value={cat.maxPerson}
                                                                            className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                                                                          />
                                                                        </div>

                                                                        <div>
                                                                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                                                                            Minimum Length Of Stay *
                                                                          </label>
                                                                          <input
                                                                            type="number"
                                                                            readOnly
                                                                            value={cat.minLos}
                                                                            className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                                                                          />
                                                                        </div>

                                                                        <div>
                                                                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                                                                            Maximum Length Of Stay *
                                                                          </label>
                                                                          <input
                                                                            type="number"
                                                                            readOnly
                                                                            value={cat.maxLos}
                                                                            className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                                                                          />
                                                                        </div>
                                                                      </div>

                                                                      {/* Detailed Numeric Inputs Row 2 (Screenshot 5) */}
                                                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                                                        <div>
                                                                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                                                                            Room Only Price *
                                                                          </label>
                                                                          <input
                                                                            type="number"
                                                                            readOnly
                                                                            value={cat.basePrice}
                                                                            className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                                                                          />
                                                                        </div>

                                                                        <div>
                                                                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                                                                            Hsn Code
                                                                          </label>
                                                                          <input
                                                                            type="text"
                                                                            readOnly
                                                                            value={cat.hsnCode}
                                                                            className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                                                                          />
                                                                        </div>

                                                                        <div>
                                                                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                                                                            Ranking
                                                                          </label>
                                                                          <input
                                                                            type="number"
                                                                            readOnly
                                                                            value={cat.ranking}
                                                                            className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                                                                          />
                                                                        </div>

                                                                        <div>
                                                                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                                                                            Short Name / Room Code
                                                                          </label>
                                                                          <input
                                                                            type="text"
                                                                            readOnly
                                                                            value={cat.shortCode}
                                                                            className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                                                                          />
                                                                        </div>
                                                                      </div>

                                                                    </div>

                                                                    {/* Right Side: Photos & Room List (Cols 8-12) */}
                                                                    <div className="lg:col-span-5 space-y-4">

                                                                      {/* Room Photos Header with Day Trip Toggle */}
                                                                      <div>
                                                                        <div className="flex items-center justify-between mb-2">
                                                                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                                                            ROOM PHOTOS
                                                                          </span>

                                                                          <div className="flex items-center space-x-1.5">
                                                                            <span className="text-xs font-bold text-slate-700">Day Trip</span>
                                                                            <button
                                                                              type="button"
                                                                              className={`w-8 h-4 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${cat.isDayTrip ? 'bg-[#0e4860]' : 'bg-slate-300'
                                                                                }`}
                                                                            >
                                                                              <div
                                                                                className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-200 ${cat.isDayTrip ? 'translate-x-4' : 'translate-x-0'
                                                                                  }`}
                                                                              />
                                                                            </button>
                                                                          </div>
                                                                        </div>

                                                                        {/* Photos Grid */}
                                                                        <div className="grid grid-cols-2 gap-3">
                                                                          <div className="border-2 border-dashed border-sky-300 bg-sky-50/40 rounded-xl p-4 text-center flex flex-col items-center justify-center space-y-1.5 h-28">
                                                                            <ImageIcon className="w-6 h-6 text-sky-600" />
                                                                            <span className="text-xs font-bold text-slate-700">Room Photo 1</span>
                                                                          </div>

                                                                          <button
                                                                            onClick={() => showNotification('Upload photo dialog')}
                                                                            className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-white rounded-xl p-4 text-center flex flex-col items-center justify-center space-y-1.5 h-28 hover:bg-slate-50 transition"
                                                                          >
                                                                            <Plus className="w-5 h-5 text-slate-400" />
                                                                            <span className="text-xs font-bold text-slate-600">+ Add Photo</span>
                                                                          </button>
                                                                        </div>
                                                                      </div>

                                                                      {/* Room List (Screenshot 4 & 5) */}
                                                                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                                                          ROOM LIST
                                                                        </span>
                                                                        {cat.roomsList && cat.roomsList.length > 0 ? (
                                                                          <div className="flex flex-wrap gap-2 pt-1">
                                                                            {cat.roomsList.map((rmNum, i) => (
                                                                              <span
                                                                                key={i}
                                                                                className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-2xs"
                                                                              >
                                                                                {rmNum}
                                                                              </span>
                                                                            ))}
                                                                          </div>
                                                                        ) : (
                                                                          <span className="text-xs text-slate-400 italic block">
                                                                            No room numbers available
                                                                          </span>
                                                                        )}
                                                                      </div>

                                                                    </div>

                                                                  </div>
                                                                )}

                                                                {/* TAB 2: FACILITIES */}
                                                                {activeSubTab === 'Facilities' && (
                                                                  <div className="space-y-3 text-xs">
                                                                    <h4 className="font-bold text-slate-900 text-sm">Included Amenities & Services</h4>
                                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                                      {cat.facilities?.map(fac => (
                                                                        <div key={fac} className="flex items-center space-x-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                                                                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                                          <span className="font-semibold text-slate-800">{fac}</span>
                                                                        </div>
                                                                      ))}
                                                                    </div>
                                                                  </div>
                                                                )}

                                                                {/* TAB 3: PLAN DETAILS */}
                                                                {activeSubTab === 'Plan Details' && (
                                                                  <div className="space-y-3 text-xs">
                                                                    <div className="flex items-center justify-between">
                                                                      <h4 className="font-bold text-slate-900 text-sm">Rate Plans Linked to {cat.name}</h4>
                                                                      <button
                                                                        onClick={() => showNotification(`Add rate plan to ${cat.name}`)}
                                                                        className="px-3 py-1 bg-[#0e4860] text-white rounded-lg text-xs font-bold"
                                                                      >
                                                                        + Add Plan
                                                                      </button>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                                      {cat.plans?.map(p => (
                                                                        <div key={p.code} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                                                                          <div className="flex justify-between items-start">
                                                                            <span className="font-bold text-slate-900">{p.name}</span>
                                                                            <span className="px-2 py-0.5 bg-sky-50 text-sky-800 font-bold rounded text-[10px]">
                                                                              {p.code}
                                                                            </span>
                                                                          </div>
                                                                          <div className="text-lg font-black text-slate-900">
                                                                            ₹{p.price.toLocaleString()} <span className="text-xs font-medium text-slate-400">/ night</span>
                                                                          </div>
                                                                          <p className="text-slate-500 text-[11px] leading-relaxed">
                                                                            {p.description}
                                                                          </p>
                                                                        </div>
                                                                      ))}
                                                                    </div>
                                                                  </div>
                                                                )}

                                                                {/* TAB 4: RATE AND AVAILABILITY */}
                                                                {activeSubTab === 'Rate and Availability' && (
                                                                  <div className="space-y-3 text-xs">
                                                                    <h4 className="font-bold text-slate-900 text-sm">ARI Daily Rates & Open Allotments</h4>
                                                                    <p className="text-slate-500">Live rate parity synchronized with PMS calendar.</p>
                                                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-700 flex justify-between items-center">
                                                                      <span>Current Base Rate Realization: <strong>₹{cat.basePrice.toLocaleString()}</strong></span>
                                                                      <button
                                                                        onClick={() => navigateTo('ari-grid')}
                                                                        className="px-3 py-1 bg-[#0e4860] text-white rounded-lg font-bold text-xs"
                                                                      >
                                                                        Open Full ARI Matrix →
                                                                      </button>
                                                                    </div>
                                                                  </div>
                                                                )}

                                                                {/* TAB 5: ONLINE TRAVEL AGENCY */}
                                                                {activeSubTab === 'Online Travel Agency' && (
                                                                  <div className="space-y-3 text-xs">
                                                                    <h4 className="font-bold text-slate-900 text-sm">Channel Manager Distribution</h4>
                                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                                      {['Booking.com', 'Agoda', 'MakeMyTrip', 'Goibibo', 'Airbnb', 'Expedia'].map(ota => (
                                                                        <div key={ota} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs">
                                                                          <div className="flex items-center space-x-2">
                                                                            <Share2 className="w-4 h-4 text-sky-700" />
                                                                            <span className="font-bold text-slate-800">{ota}</span>
                                                                          </div>
                                                                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                                                                            Connected
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

                                                        {/* 7. ADD ROOM MODAL (Screenshot 3: Exact match) */}
                                                        {isAddRoomModalOpen && (
                                                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                                                            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">

                                                              {/* Modal Header */}
                                                              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                                                <h2 className="text-base font-extrabold text-slate-900">
                                                                  Add Room
                                                                </h2>
                                                                <button
                                                                  onClick={() => setIsAddRoomModalOpen(false)}
                                                                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition"
                                                                >
                                                                  <X className="w-5 h-5" />
                                                                </button>
                                                              </div>

                                                              {/* Modal Form (Exact Screenshot 3) */}
                                                              <form onSubmit={handleSaveRoom} className="p-6 space-y-3.5 text-xs">

                                                                {/* Row 1: Room Type & Select Floor */}
                                                                <div className="grid grid-cols-2 gap-3">
                                                                  <div>
                                                                    <select
                                                                      value={newRoomData.roomType}
                                                                      onChange={(e) => setNewRoomData({ ...newRoomData, roomType: e.target.value })}
                                                                      className="w-full p-2 bg-white border border-emerald-500 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                                                                    >
                                                                      {roomCategories.map(c => (
                                                                        <option key={c.id} value={c.name}>{c.name}</option>
                                                                      ))}
                                                                    </select>
                                                                  </div>

                                                                  <div>
                                                                    <select
                                                                      value={newRoomData.floor}
                                                                      onChange={(e) => setNewRoomData({ ...newRoomData, floor: e.target.value })}
                                                                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                                                                    >
                                                                      <option value="Select Floor">Select Floor</option>
                                                                      <option value="Ground Floor">Ground Floor</option>
                                                                      <option value="1st Floor">1st Floor</option>
                                                                      <option value="2nd Floor">2nd Floor</option>
                                                                      <option value="3rd Floor">3rd Floor</option>
                                                                      <option value="4th Floor">4th Floor</option>
                                                                    </select>
                                                                  </div>
                                                                </div>

                                                                {/* Row 2: Room No * & Room Sequence No * */}
                                                                <div className="grid grid-cols-2 gap-3">
                                                                  <div>
                                                                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                                      Room No *
                                                                    </label>
                                                                    <input
                                                                      type="text"
                                                                      required
                                                                      placeholder="e.g. 101"
                                                                      value={newRoomData.roomNo}
                                                                      onChange={(e) => setNewRoomData({ ...newRoomData, roomNo: e.target.value })}
                                                                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                                                                    />
                                                                  </div>

                                                                  <div>
                                                                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                                      Room Sequence No *
                                                                    </label>
                                                                    <input
                                                                      type="number"
                                                                      required
                                                                      value={newRoomData.seqNo}
                                                                      onChange={(e) => setNewRoomData({ ...newRoomData, seqNo: e.target.value })}
                                                                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                                                                    />
                                                                  </div>
                                                                </div>

                                                                {/* Row 3: No of Bed * & Bed Type * */}
                                                                <div className="grid grid-cols-2 gap-3">
                                                                  <div>
                                                                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                                      No of Bed *
                                                                    </label>
                                                                    <input
                                                                      type="number"
                                                                      required
                                                                      placeholder="e.g. 1"
                                                                      value={newRoomData.noOfBeds}
                                                                      onChange={(e) => setNewRoomData({ ...newRoomData, noOfBeds: e.target.value })}
                                                                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                                                                    />
                                                                  </div>

                                                                  <div>
                                                                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                                      Bed Type *
                                                                    </label>
                                                                    <input
                                                                      type="text"
                                                                      required
                                                                      placeholder="e.g. King, Queen, Single"
                                                                      value={newRoomData.bedType}
                                                                      onChange={(e) => setNewRoomData({ ...newRoomData, bedType: e.target.value })}
                                                                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                                                                    />
                                                                  </div>
                                                                </div>

                                                                {/* Row 4: Bed Description */}
                                                                <div>
                                                                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                                    Bed Description
                                                                  </label>
                                                                  <input
                                                                    type="text"
                                                                    placeholder="e.g. Plush mattress with cotton linen"
                                                                    value={newRoomData.bedDescription}
                                                                    onChange={(e) => setNewRoomData({ ...newRoomData, bedDescription: e.target.value })}
                                                                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                                                                  />
                                                                </div>

                                                                {/* Row 5: Room Description */}
                                                                <div>
                                                                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                                    Room Description
                                                                  </label>
                                                                  <textarea
                                                                    rows="2"
                                                                    placeholder="Add any additional notes about this room..."
                                                                    value={newRoomData.roomDescription}
                                                                    onChange={(e) => setNewRoomData({ ...newRoomData, roomDescription: e.target.value })}
                                                                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                                                                  />
                                                                </div>

                                                                {/* Modal Footer Buttons */}
                                                                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                                                                  <button
                                                                    onClick={() => togglePlanStatus(plan.id)}
                                                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${plan.status === 'ACTIVE'
                                                                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                                      }`}
                                                                    type="button"
                                                                    onClick={() => setIsAddRoomModalOpen(false)}
                                                                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition"
                                                                  >
                                                                    {plan.status === 'ACTIVE' ? 'Pause Plan' : 'Activate Plan'}
                                                                    Cancel
                                                                  </button>
                                                                  <button
                                                                    onClick={() => showNotification(`Quick edit opened for ${plan.name}`)}
                                                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
                                                                    type="submit"
                                                                    className="px-5 py-2 bg-[#5897a6] hover:bg-[#467d8a] text-white rounded-lg text-xs font-bold transition shadow-sm"
                                                                  >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                    <span>Edit Tariffs</span>
                                                                    Save
                                                                  </button>
                                                                </div>

                                                              </form>
                                                            </div>
                                                          </div>
                                                        )}

                                                        {/* 8. ADD ROOM TYPE MODAL */}
                                                        {isAddRoomTypeModalOpen && (
                                                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                                                            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
                                                              <div className="px-5 py-4 bg-[#0e4860] text-white flex items-center justify-between">
                                                                <h3 className="font-bold text-base">Add New Room Type</h3>
                                                                <button
                                                                  onClick={() => setIsAddRoomTypeModalOpen(false)}
                                                                  className="text-white/80 hover:text-white p-1"
                                                                >
                                                                  ✕
                                                                </button>
                                                              </div>

                                                              {/* Room category pricing breakdown */}
                                                              <div className="bg-slate-50/70 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                                                {Object.entries(plan.baseRates).map(([roomType, rate]) => (
                                                                  <div key={roomType} className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                                                                    <div className="text-[11px] text-slate-500 font-medium truncate">{roomType}</div>
                                                                    <div className="text-sm font-black text-slate-900 mt-0.5">
                                                                      ₹{weekendSurgeActive ? Math.round(rate * 1.2).toLocaleString('en-IN') : rate.toLocaleString('en-IN')}
                                                                      <span className="text-[10px] text-slate-400 font-normal"> / night</span>
                                                                    </div>
                                                                    {weekendSurgeActive && (
                                                                      <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                                                                        Includes +20% weekend surge
                                                                      </div>
                                                                    )}
                                                                    <form onSubmit={handleSaveRoomType} className="p-5 space-y-3.5 text-xs">
                                                                      <div>
                                                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                                          Room Type Name *
                                                                        </label>
                                                                        <input
                                                                          type="text"
                                                                          required
                                                                          placeholder="e.g. Executive Club Suite"
                                                                          value={newRoomTypeData.name}
                                                                          onChange={(e) => setNewRoomTypeData({ ...newRoomTypeData, name: e.target.value })}
                                                                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                                                        />
                                                                      </div>

                                                                      <div className="grid grid-cols-2 gap-3">
                                                                        <div>
                                                                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                                            Room Code *
                                                                          </label>
                                                                          <input
                                                                            type="text"
                                                                            required
                                                                            placeholder="e.g. ECS"
                                                                            value={newRoomTypeData.code}
                                                                            onChange={(e) => setNewRoomTypeData({ ...newRoomTypeData, code: e.target.value })}
                                                                            className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold uppercase text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                                                          />
                                                                        </div>
              ))}

                                                                        <div>
                                                                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                                            Base Price (₹) *
                                                                          </label>
                                                                          <input
                                                                            type="number"
                                                                            required
                                                                            value={newRoomTypeData.basePrice}
                                                                            onChange={(e) => setNewRoomTypeData({ ...newRoomTypeData, basePrice: e.target.value })}
                                                                            className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
                                                                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
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

                                                              {/* 9. EDIT PROPERTY PROFILE MODAL */}
                                                              {isEditProfileModalOpen && (
                                                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                                                                  <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
                                                                    <div className="px-5 py-4 bg-[#0e4860] text-white flex items-center justify-between">
                                                                      <h3 className="font-bold text-base">Edit Property Profile</h3>
                                                                      <button
                                                                        onClick={() => setIsEditProfileModalOpen(false)}
                                                                        className="text-white/80 hover:text-white p-1"
                                                                      >
                                                                        ✕
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
        ))}
                                                                </div>
        </div>
      )}

                                                          </div>
                                                        );
}
