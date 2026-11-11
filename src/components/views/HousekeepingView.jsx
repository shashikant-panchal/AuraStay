import React, { useState, useMemo, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Building, 
  RotateCcw, 
  SlidersHorizontal, 
  Calendar, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Bed, 
  Zap, 
  FileText, 
  RefreshCw, 
  Check, 
  X, 
  Layers,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  User,
  Plus,
  Clock,
  Trash2,
  Filter
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function HousekeepingView() {
  const { 
    rooms: contextRooms = [], 
    updateRoomStatus, 
    showNotification,
    navigateTo 
  } = useDashboard();

  // Active View Tab: 'rooms-grid' | 'tasks-log' | 'housekeepers'
  const [activeTab, setActiveTab] = useState('rooms-grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedFloor, setSelectedFloor] = useState('ALL');

  // Housekeeper staff roster
  const [housekeepers, setHousekeepers] = useState([
    { id: 'hk-1', name: 'Sunita Devi', phone: '+91 98450 11223', shift: 'Morning (07:00 - 15:30)', assignedRooms: ['101', '102'] },
    { id: 'hk-2', name: 'Rajesh Kumar', phone: '+91 98450 44556', shift: 'Morning (07:00 - 15:30)', assignedRooms: ['201', '202'] },
    { id: 'hk-3', name: 'Manish Verma', phone: '+91 97712 33445', shift: 'Evening (15:00 - 23:30)', assignedRooms: [] },
    { id: 'hk-4', name: 'Pooja Sharma', phone: '+91 98823 55667', shift: 'General (09:00 - 17:30)', assignedRooms: [] }
  ]);

  // Housekeeping Tasks State (loaded from localStorage / Supabase)
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_hk_tasks');
      if (saved) return JSON.parse(saved);
    } catch(e){}
    return [
      { id: 'TSK-101', room: '101', taskType: 'Full Linen Change & Sanitization', priority: 'High', assignedTo: 'Sunita Devi', status: 'IN_PROGRESS', createdAt: '10:15 AM', notes: 'VIP Guest arriving at 2:00 PM.' },
      { id: 'TSK-102', room: '201', taskType: 'Deep Clean & Minibar Restock', priority: 'Normal', assignedTo: 'Rajesh Kumar', status: 'PENDING', createdAt: '11:00 AM', notes: 'Check AC remote batteries.' }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('aurastay_hk_tasks', JSON.stringify(tasks));
    } catch(e){}
  }, [tasks]);

  // Modals state
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRoomForAssign, setSelectedRoomForAssign] = useState(null);

  // New task form state
  const [taskRoom, setTaskRoom] = useState('');
  const [taskType, setTaskType] = useState('Daily Cleaning');
  const [taskPriority, setTaskPriority] = useState('Normal');
  const [taskAssignee, setTaskAssignee] = useState('Sunita Devi');
  const [taskNotes, setTaskNotes] = useState('');

  // Quick Room Status Update with Supabase persistence
  const handleQuickStatusChange = async (roomNumber, newStatus) => {
    const cleanNum = String(roomNumber);
    if (updateRoomStatus) {
      updateRoomStatus(cleanNum, newStatus);
    }

    // Persist directly to Supabase rooms table
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('rooms')
          .update({
            status: newStatus,
            housekeeping: newStatus === 'VACANT_READY' ? 'Clean' : newStatus === 'DIRTY' ? 'Dirty' : 'Touch Up'
          })
          .eq('room_number', cleanNum);
      } catch (err) {
        console.warn('Supabase housekeeping update warning:', err);
      }
    }

    const label = newStatus === 'VACANT_READY' ? 'Clean & Ready' : newStatus === 'DIRTY' ? 'Dirty' : newStatus;
    showNotification(`Room #${cleanNum} marked as ${label}.`);
  };

  // Create New Task
  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!taskRoom) {
      showNotification('Please select a room.', 'error');
      return;
    }

    const newTask = {
      id: `TSK-${Date.now().toString().slice(-4)}`,
      room: taskRoom,
      taskType,
      priority: taskPriority,
      assignedTo: taskAssignee,
      status: 'PENDING',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: taskNotes.trim()
    };

    setTasks(prev => [newTask, ...prev]);
    showNotification(`Task #${newTask.id} created for Room #${taskRoom}!`);
    setIsNewTaskModalOpen(false);
    setTaskNotes('');
  };

  // Mark Task Completed
  const handleCompleteTask = (taskId, roomNumber) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'COMPLETED' } : t));
    handleQuickStatusChange(roomNumber, 'VACANT_READY');
    showNotification(`Task #${taskId} marked as Completed. Room #${roomNumber} is Clean.`);
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return contextRooms.filter(r => {
      const matchFloor = selectedFloor === 'ALL' || r.floor === selectedFloor;
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        String(r.roomNumber || r.room_number).includes(q) ||
        String(r.type || '').toLowerCase().includes(q);
      return matchFloor && matchStatus && matchSearch;
    });
  }, [contextRooms, selectedFloor, statusFilter, searchQuery]);

  // Statistics
  const totalCount = contextRooms.length;
  const cleanCount = contextRooms.filter(r => r.status === 'VACANT_READY').length;
  const dirtyCount = contextRooms.filter(r => r.status === 'DIRTY').length;
  const occupiedCount = contextRooms.filter(r => r.status === 'OCCUPIED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      
      {/* 1. Header */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-300 px-2.5 py-0.5 rounded-full shadow-2xs">
              HOUSEKEEPING & SANITIZATION
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Live PMS Sync</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
            Housekeeping Management Console
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Real-time room cleanliness monitoring, one-click quick turnover, work order task dispatch, and housekeeper staff assignment.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              contextRooms.forEach(r => {
                if (r.status === 'DIRTY') handleQuickStatusChange(r.roomNumber, 'VACANT_READY');
              });
              showNotification('All dirty rooms marked as Clean & Ready.');
            }}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs flex items-center space-x-1.5 transition shadow-2xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Mark All Clean</span>
          </button>

          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-md shadow-[#0e4860]/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Cleaning Task</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">TOTAL ROOMS</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          <span className="text-[11px] font-bold text-slate-500 mt-1 block">Physical inventory</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">CLEAN & READY</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{cleanCount}</div>
          <span className="text-[11px] font-bold text-emerald-700 mt-1 block">Available for check-in</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">DIRTY / TURNOVER</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{dirtyCount}</div>
          <span className="text-[11px] font-bold text-amber-700 mt-1 block">Needs housekeeping</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">OCCUPIED IN-HOUSE</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{occupiedCount}</div>
          <span className="text-[11px] font-bold text-slate-500 mt-1 block">Daily stay service</span>
        </div>
      </div>

      {/* 3. Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1">
        <button
          onClick={() => setActiveTab('rooms-grid')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'rooms-grid'
              ? 'bg-[#0e4860] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Bed className="w-4 h-4" />
          <span>Room Housekeeping Matrix ({contextRooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks-log')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'tasks-log'
              ? 'bg-[#0e4860] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Cleaning Work Orders ({tasks.filter(t => t.status !== 'COMPLETED').length} Active)</span>
        </button>

        <button
          onClick={() => setActiveTab('housekeepers')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'housekeepers'
              ? 'bg-[#0e4860] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Housekeeping Staff ({housekeepers.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ROOMS HOUSEKEEPING GRID */}
      {/* ========================================================================= */}
      {activeTab === 'rooms-grid' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search rooms by number or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white outline-none"
              >
                <option value="ALL">All Housekeeping Status</option>
                <option value="VACANT_READY">Clean & Ready</option>
                <option value="DIRTY">Dirty</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>

          {filteredRooms.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-200 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bed className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-900">No Rooms Configured</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Add hotel rooms in the "Rates & Plans" section to begin monitoring housekeeping status and assigning cleaning tasks.
              </p>
              <button
                onClick={() => navigateTo('rate-plans')}
                className="px-5 py-2.5 rounded-xl bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs inline-flex items-center gap-2"
              >
                <span>Go to Rates & Plans</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredRooms.map(r => {
                const rNum = String(r.roomNumber || r.room_number);
                const isClean = r.status === 'VACANT_READY';
                const isDirty = r.status === 'DIRTY';
                const isOccupied = r.status === 'OCCUPIED';

                return (
                  <div
                    key={r.id || rNum}
                    className={`bg-white rounded-3xl p-5 border transition-all duration-300 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md space-y-3.5 ${
                      isDirty ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                          #{rNum}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                          {r.type || 'Standard Room'} • {r.floor || 'Floor 1'}
                        </div>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        isClean 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : isDirty 
                          ? 'bg-amber-50 text-amber-700 border-amber-300' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {isClean ? 'Clean ✓' : isDirty ? 'Dirty ⚠️' : 'Occupied'}
                      </span>
                    </div>

                    {/* Quick Turnaround Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      {isDirty ? (
                        <button
                          onClick={() => handleQuickStatusChange(rNum, 'VACANT_READY')}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Clean</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleQuickStatusChange(rNum, 'DIRTY')}
                          className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                          <span>Mark Dirty</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setTaskRoom(rNum);
                          setIsNewTaskModalOpen(true);
                        }}
                        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                        title="Add Task"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLEANING WORK ORDERS & TASKS */}
      {/* ========================================================================= */}
      {activeTab === 'tasks-log' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Housekeeping Tasks & Dispatch Log</h3>
              <p className="text-xs text-slate-500">Track task assignments, deep cleaning schedules, and completion logs.</p>
            </div>
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10.5px] border-b border-slate-200">
                  <th className="py-3 px-4 font-bold">Task ID</th>
                  <th className="py-3 px-4 font-bold">Room #</th>
                  <th className="py-3 px-4 font-bold">Task Description</th>
                  <th className="py-3 px-4 font-bold">Assigned To</th>
                  <th className="py-3 px-4 font-bold">Priority</th>
                  <th className="py-3 px-4 font-bold">Created</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No housekeeping tasks logged. Click "Create Task" to dispatch work orders.
                    </td>
                  </tr>
                ) : (
                  tasks.map(t => {
                    const isDone = t.status === 'COMPLETED';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{t.id}</td>
                        <td className="py-3.5 px-4 font-black text-slate-900">Room #{t.room}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 block">{t.taskType}</span>
                          {t.notes && <span className="text-[11px] text-slate-500">{t.notes}</span>}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{t.assignedTo}</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{t.createdAt}</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {!isDone && (
                            <button
                              onClick={() => handleCompleteTask(t.id, t.room)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs"
                            >
                              Complete ✓
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: HOUSEKEEPING STAFF ROSTER */}
      {/* ========================================================================= */}
      {activeTab === 'housekeepers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {housekeepers.map(hk => (
            <div key={hk.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{hk.name}</h4>
                  <span className="text-[11px] text-slate-500 font-mono">{hk.phone}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1 text-slate-600">
                <div className="font-semibold text-slate-700">Shift: {hk.shift}</div>
                <div className="text-[11px] text-slate-500">
                  Assigned Rooms: {hk.assignedRooms.length > 0 ? hk.assignedRooms.map(r => `#${r}`).join(', ') : 'Floating'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW HOUSEKEEPING TASK */}
      {/* ========================================================================= */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900">New Cleaning Work Order</h3>
              <button onClick={() => setIsNewTaskModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Room Number *</label>
                <select
                  value={taskRoom}
                  onChange={(e) => setTaskRoom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white outline-none"
                  required
                >
                  <option value="">Select Room...</option>
                  {contextRooms.map(r => (
                    <option key={r.id || r.roomNumber} value={r.roomNumber || r.room_number}>
                      Room #{r.roomNumber || r.room_number} ({r.type || 'Room'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Type</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                >
                  <option value="Daily Cleaning">Daily Cleaning & Bedding</option>
                  <option value="Deep Turnover Sanitization">Deep Turnover Sanitization</option>
                  <option value="Linen & Towel Replacement">Linen & Towel Replacement</option>
                  <option value="Mini-Bar & Amenities Restock">Mini-Bar & Amenities Restock</option>
                  <option value="AC & Fixture Maintenance">AC & Fixture Maintenance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High / Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assign Housekeeper</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                  >
                    {housekeepers.map(hk => (
                      <option key={hk.id} value={hk.name}>{hk.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Special Instructions (Optional)</label>
                <textarea
                  rows="2"
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  placeholder="e.g. VIP guest arrival, extra pillows requested."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs shadow-md"
                >
                  Dispatch Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
