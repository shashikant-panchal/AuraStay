import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Clock,
  AlertCircle,
  Calendar,
  Check,
  ClipboardList
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export default function FrontDeskTasksDrawer({ isOpen, onClose }) {
  const { frontDeskTasks = [], addDeskTask, toggleDeskTask, deleteDeskTask, workingDate } = useDashboard();

  const [newTaskText, setNewTaskText] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [targetTime, setTargetTime] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    addDeskTask(newTaskText.trim(), priority, targetTime || 'Shift Duty');
    setNewTaskText('');
    setTargetTime('');
  };

  const pendingCount = frontDeskTasks.filter(t => !t.completed).length;
  const completedCount = frontDeskTasks.filter(t => t.completed).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-wide">Front Desk Shift Checklist</h3>
                <p className="text-xs text-indigo-200/80">Working Date: {workingDate}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Shift stats */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 text-xs">
            <span className="text-slate-600 font-bold">
              {pendingCount} Pending • {completedCount} Done
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
              Morning Shift
            </span>
          </div>

          {/* New Task Form */}
          <form onSubmit={handleAdd} className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3 shrink-0">
            <div>
              <input
                type="text"
                placeholder="Add wake-up call, airport drop, VIP task..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/30 outline-none"
                required
              />
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Time (e.g. 08:30 AM)"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="w-1/2 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 outline-none"
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-1/2 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="NORMAL">Normal Priority</option>
                <option value="HIGH">High Priority</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Shift Reminder</span>
            </button>
          </form>

          {/* Tasks List */}
          <div className="p-6 overflow-y-auto flex-1 space-y-3">
            {frontDeskTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold">No tasks on shift roster.</p>
              </div>
            ) : (
              frontDeskTasks.map((t) => (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between space-x-3 ${
                    t.completed
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : t.priority === 'HIGH'
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-white border-slate-200 hover:shadow-xs'
                  }`}
                >
                  <button
                    onClick={() => toggleDeskTask(t.id)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                  >
                    {t.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                  </button>

                  <div className="flex-1 text-xs">
                    <p className={`font-semibold ${t.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {t.text}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{t.time || 'Shift Task'}</span>
                      </span>
                      {t.priority === 'HIGH' && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">
                          High
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteDeskTask(t.id)}
                    className="text-slate-300 hover:text-rose-600 transition-colors shrink-0 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs"
            >
              Close Drawer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

