import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Users, 
  Search, 
  Plus, 
  Crown, 
  Phone, 
  Mail, 
  FileCheck, 
  Calendar, 
  Building2, 
  CreditCard,
  MessageSquare,
  Filter
} from 'lucide-react';

export default function GuestsView() {
  const { showNotification } = useDashboard();

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  const [guests, setGuests] = useState([
    {
      id: 'GST-901',
      name: 'Dr. Alok Mishra',
      email: 'alok.mishra@dccmedical.org',
      phone: '+91 98450 11223',
      tier: 'VIP Platinum',
      tierColor: 'purple',
      company: 'DCC Medical Research',
      totalStays: 8,
      nightsSpent: 26,
      totalSpent: '₹1,02,400',
      currentRoom: '201 (Deluxe King)',
      kycStatus: 'VERIFIED_AADHAAR',
      preferences: 'High floor, feather pillows, green tea',
      lastStay: 'Active In-House'
    },
    {
      id: 'GST-902',
      name: 'Rajesh Sen',
      email: 'rajesh.sen@ckseducation.com',
      phone: '+91 97110 33445',
      tier: 'Corporate Prime',
      tierColor: 'blue',
      company: 'CKS Education Group',
      totalStays: 5,
      nightsSpent: 18,
      totalSpent: '₹81,000',
      currentRoom: '302 (Executive Suite)',
      kycStatus: 'VERIFIED_PAN',
      preferences: 'Late checkout, airport taxi, quiet corner',
      lastStay: 'Active In-House'
    },
    {
      id: 'GST-903',
      name: 'Shashank Verma',
      email: 'shashank.v@techventures.in',
      phone: '+91 99370 88990',
      tier: 'VIP Gold',
      tierColor: 'amber',
      company: 'TechVentures India',
      totalStays: 3,
      nightsSpent: 6,
      totalSpent: '₹14,800',
      currentRoom: '102 (Standard Room)',
      kycStatus: 'VERIFIED_AADHAAR',
      preferences: 'Fast Wi-Fi, King Bed, Extra Towels',
      lastStay: 'Active In-House'
    },
    {
      id: 'GST-904',
      name: 'Priya Sundaram',
      email: 'priya.sundaram@travelblog.com',
      phone: '+91 98200 44556',
      tier: 'Standard',
      tierColor: 'slate',
      company: 'Individual Traveler',
      totalStays: 1,
      nightsSpent: 3,
      totalSpent: '₹9,600',
      currentRoom: '203 (Deluxe King)',
      kycStatus: 'VERIFIED_PASSPORT',
      preferences: 'Pool view, non-smoking, fruit platter',
      lastStay: 'Active In-House'
    },
    {
      id: 'GST-905',
      name: 'Amitabh Choudhury',
      email: 'amitabh.c@fintechhub.com',
      phone: '+91 94371 99221',
      tier: 'Corporate Prime',
      tierColor: 'blue',
      company: 'FinTech Hub Asia',
      totalStays: 4,
      nightsSpent: 12,
      totalSpent: '₹48,000',
      currentRoom: 'Reserved (101)',
      kycStatus: 'VERIFIED_AADHAAR',
      preferences: 'Early check-in 10:00 AM, breakfast in room',
      lastStay: 'Arriving Tomorrow'
    },
    {
      id: 'GST-906',
      name: 'Meera Patel',
      email: 'meera.patel@designstudio.in',
      phone: '+91 98190 22334',
      tier: 'VIP Gold',
      tierColor: 'amber',
      company: 'Studio Axis',
      totalStays: 2,
      nightsSpent: 5,
      totalSpent: '₹19,200',
      currentRoom: 'Reserved (202)',
      kycStatus: 'VERIFIED_AADHAAR',
      preferences: 'Corner room, sparkling water',
      lastStay: 'Arriving 05 Nov'
    },
  ]);

  const filteredGuests = guests.filter(g => {
    if (tierFilter !== 'ALL' && !g.tier.toLowerCase().includes(tierFilter.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return g.name.toLowerCase().includes(q) || g.phone.includes(q) || g.email.toLowerCase().includes(q) || g.company.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">
              Guest Profiles & CRM Directory
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage comprehensive guest history, loyalty tiers, KYC verifications, and personalized stay preferences.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => showNotification('New guest registration form opened.')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Guest Profile</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by guest name, phone, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Tier:
          </span>
          {['ALL', 'Platinum', 'Gold', 'Corporate'].map(tier => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tierFilter === tier 
                  ? 'bg-sky-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Guests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGuests.map(guest => (
          <div key={guest.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    {guest.name}
                    {guest.tier.includes('VIP') && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{guest.company}</p>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  guest.tierColor === 'purple' ? 'bg-purple-100 text-purple-800' :
                  guest.tierColor === 'amber' ? 'bg-amber-100 text-amber-800' :
                  guest.tierColor === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {guest.tier}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{guest.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{guest.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800">Room: {guest.currentRoom}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg mt-3 text-[11px] text-slate-600 border border-slate-100">
                <span className="font-bold text-slate-700">Preferences: </span>
                {guest.preferences}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <div className="text-[10px] text-slate-400">Total Spend</div>
                <div className="font-black text-slate-900">{guest.totalSpent} ({guest.totalStays} stays)</div>
              </div>

              <button
                onClick={() => showNotification(`Contacting ${guest.name} via WhatsApp Concierge...`)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg flex items-center space-x-1 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

