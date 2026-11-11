import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, ShieldCheck, FileText, Camera, Award, Star, History, Calendar, Check, Edit3 } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export default function Guest360Modal({ isOpen, onClose, room, reservation }) {
  const { showNotification } = useDashboard();

  const [isEditing, setIsEditing] = useState(false);
  const [guestName, setGuestName] = useState(reservation?.guest || reservation?.name || room?.guest || 'Mr. Ramesh Patel');
  const [phone, setPhone] = useState(reservation?.phone || '+91 98450 12345');
  const [email, setEmail] = useState(reservation?.email || 'ramesh.patel@gmail.com');
  const [city, setCity] = useState('Bengaluru, Karnataka');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('XXXX-XXXX-4812');
  const [vipTier, setVipTier] = useState('Gold VIP');
  const [preferences, setPreferences] = useState('Non-smoking high-floor room, prefers extra bottled water and morning tea at 7:30 AM.');

  if (!isOpen || !room) return null;

  const roomNum = String(room.room_number || room.roomNumber || room.number);

  const pastStays = [
    { date: '14 Oct 2026', room: 'Suite #201', nights: 3, amount: 'â‚¹12,600', status: 'Completed' },
    { date: '02 Aug 2026', room: 'Deluxe #105', nights: 2, amount: 'â‚¹6,800', status: 'Completed' },
    { date: '19 May 2026', room: 'Deluxe #103', nights: 1, amount: 'â‚¹3,400', status: 'Completed' }
  ];

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    showNotification('Guest profile and identity details updated successfully.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-black text-lg">
              {guestName.charAt(0) || 'G'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black tracking-wide">{guestName}</h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 border border-amber-400/40 text-amber-300 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <Star className="w-2.5 h-2.5 fill-amber-300" />
                  <span>{vipTier}</span>
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">Room #{roomNum} â€¢ In-House Guest Profile</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all flex items-center space-x-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">City / Region</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">ID Proof Type</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">ID Proof Number</label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/30 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Guest Preferences & Notes</label>
                <textarea
                  rows={2}
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/30 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold shadow-md shadow-indigo-900/20 flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Profile Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Phone</span>
                  <p className="text-xs font-bold text-slate-800 mt-1 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{phone}</span>
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                  <p className="text-xs font-bold text-slate-800 mt-1 flex items-center space-x-1 truncate">
                    <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">{email}</span>
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">City / Origin</span>
                  <p className="text-xs font-bold text-slate-800 mt-1 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{city}</span>
                  </p>
                </div>
              </div>

              {/* ID Proof & KYC Card */}
              <div className="bg-indigo-50/50 border border-indigo-200/60 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Government ID Proof (KYC Verified)</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                    VERIFIED
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-indigo-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-mono text-xs font-black">
                      ID
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{idType}</p>
                      <p className="text-xs text-slate-500 font-mono">{idNumber}</p>
                    </div>
                  </div>
                  <span className="text-xs text-indigo-700 font-bold hover:underline cursor-pointer flex items-center space-x-1">
                    <Camera className="w-3.5 h-3.5" />
                    <span>View Scan</span>
                  </span>
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wider">Guest Preferences & Housekeeping Remarks</span>
                </div>
                <p className="text-xs font-medium text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-amber-100">
                  {preferences}
                </p>
              </div>

              {/* Past Stay History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <History className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Stay History (3 Past Visits)</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">Lifetime Revenue: â‚¹22,800</span>
                </div>

                <div className="space-y-2">
                  {pastStays.map((stay, idx) => (
                    <div key={idx} className="bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{stay.room}</p>
                          <p className="text-[11px] text-slate-500">{stay.date} â€¢ {stay.nights} Nights</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900 font-mono">{stay.amount}</p>
                        <span className="text-[10px] font-bold text-emerald-600">{stay.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            Registered at DEMO Hotel PMS â€¢ Guest UID: G-9082
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

