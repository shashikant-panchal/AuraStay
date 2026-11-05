import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { X, Building2, Plus, DollarSign, Layers } from 'lucide-react';

export default function CreateRoomModal() {
  const { isCreateRoomModalOpen, setIsCreateRoomModalOpen, addRoom } = useDashboard();

  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('1st Floor');
  const [type, setType] = useState('Standard Room');
  const [bed, setBed] = useState('King Bed');
  const [price, setPrice] = useState('2000');
  const [error, setError] = useState('');

  if (!isCreateRoomModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      setError('Room Number is required');
      return;
    }
    setError('');
    addRoom({
      roomNumber: roomNumber.trim(),
      floor,
      type,
      bed,
      price: Number(price) || 2000
    });
    setRoomNumber('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-indigo-200" />
            <h3 className="font-bold text-base">Add New Room</h3>
          </div>
          <button
            onClick={() => setIsCreateRoomModalOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Room Number / Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 101, 102, 201..."
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Floor
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="Ground Floor">Ground Floor</option>
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
                <option value="4th Floor">4th Floor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="Standard Room">Standard Room</option>
                <option value="Deluxe King">Deluxe King</option>
                <option value="Super Deluxe">Super Deluxe</option>
                <option value="Executive Suite">Executive Suite</option>
                <option value="Presidential Suite">Presidential Suite</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bed Type
              </label>
              <select
                value={bed}
                onChange={(e) => setBed(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="King Bed">King Bed</option>
                <option value="Queen Bed">Queen Bed</option>
                <option value="Twin Beds">Twin Beds</option>
                <option value="Single Bed">Single Bed</option>
                <option value="Super King">Super King</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Base Price / Night (₹)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateRoomModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Room</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

