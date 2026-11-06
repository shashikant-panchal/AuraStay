import React, { useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Trash2, AlertTriangle, X, BedDouble, ShieldAlert } from 'lucide-react';

export default function DeleteRoomModal() {
  const { deleteConfirmRoom, cancelDeleteRoom, confirmDeleteRoom, rooms = [] } = useDashboard();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') cancelDeleteRoom();
    };
    if (deleteConfirmRoom) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteConfirmRoom, cancelDeleteRoom]);

  if (!deleteConfirmRoom) return null;

  const roomNum = typeof deleteConfirmRoom === 'object'
    ? (deleteConfirmRoom.room_number || deleteConfirmRoom.roomNumber || deleteConfirmRoom.number)
    : String(deleteConfirmRoom);

  const matchedRoom = rooms.find(r => 
    String(r.roomNumber) === String(roomNum) || 
    String(r.room_number) === String(roomNum) || 
    String(r.id) === String(roomNum)
  );

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={cancelDeleteRoom}
    >
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pt-1">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Delete Room</span>
                <span className="font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 text-sm">
                  #{roomNum}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Confirm inventory removal
              </p>
            </div>
          </div>

          <button
            onClick={cancelDeleteRoom}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Room Information Preview Card */}
        {matchedRoom && (
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-black">
                <BedDouble className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <div className="font-bold text-slate-900">{matchedRoom.type || matchedRoom.category || 'Standard Room'}</div>
                <div className="text-[11px] text-slate-500">{matchedRoom.floor ? (String(matchedRoom.floor).startsWith('Floor') ? matchedRoom.floor : `Floor ${matchedRoom.floor}`) : 'Floor 1'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-slate-900">₹{Number(matchedRoom.price || matchedRoom.tariff || 2000).toLocaleString('en-IN')}/nt</div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                {matchedRoom.status || 'VACANT_READY'}
              </span>
            </div>
          </div>
        )}

        {/* Warning Alert Note */}
        <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-200/60 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 leading-relaxed font-medium">
            <span className="font-bold">Permanent Action:</span> Deleting Room <strong className="font-mono font-bold">#{roomNum}</strong> will immediately remove it from the PMS Stayview timeline, Dayview operations, and guest booking catalogs. Active reservations for this room should be reassigned first.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={cancelDeleteRoom}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDeleteRoom}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-rose-600/25 flex items-center space-x-2 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Yes, Delete Room</span>
          </button>
        </div>
      </div>
    </div>
  );
}
