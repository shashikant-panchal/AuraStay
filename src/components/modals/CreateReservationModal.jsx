import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { X, CalendarPlus, BedDouble, User } from 'lucide-react';

export default function CreateReservationModal() {
  const { 
    isCreateReservationModalOpen, 
    setIsCreateReservationModalOpen, 
    addReservation,
    rooms 
  } = useDashboard();

  const [guest, setGuest] = useState('');
  const [room, setRoom] = useState('101 (Standard Room)');
  const [checkIn, setCheckIn] = useState('2026-11-04');
  const [checkOut, setCheckOut] = useState('2026-11-06');
  const [source, setSource] = useState('Direct Walk-in');
  const [amount, setAmount] = useState('4000');

  if (!isCreateReservationModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    addReservation({
      guest,
      room,
      checkIn,
      checkOut,
      source,
      amount: Number(amount)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-100">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Create Reservation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Front desk guest check-in & stay creation
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateReservationModalOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Guest Full Name</label>
            <input
              type="text"
              placeholder="Guest Full Name"
              value={guest}
              onChange={(e) => setGuest(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Check-in Date</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Check-out Date</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Room</label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {rooms.length === 0 ? (
                  <option value="Unassigned Room">Unassigned Room (No rooms in inventory)</option>
                ) : (
                  rooms.map(r => (
                    <option key={r.roomNumber} value={`${r.roomNumber} (${r.type})`}>
                      Room {r.roomNumber} - {r.type}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Booking Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Direct Walk-in">Direct Walk-in</option>
                <option value="Booking Engine">Direct Booking Engine</option>
                <option value="Booking.com">Booking.com</option>
                <option value="Agoda">Agoda</option>
                <option value="Corporate Contract">Corporate Contract</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Total Stay Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsCreateReservationModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
            >
              Confirm Reservation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

