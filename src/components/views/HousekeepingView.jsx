import React, { useState, useMemo, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  Bed,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Plus,
  Search,
  User,
  ShieldAlert,
  Paintbrush,
  Calendar,
  Layers,
  Wrench,
  Check,
  X,
  FileText,
  Trash2,
  Filter,
  Archive,
  Phone,
  Tag,
  Building,
  Eye
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function HousekeepingView() {
  const { 
    rooms: contextRooms = [], 
    updateRoomStatus, 
    showNotification,
    navigateTo,
    activeTab: contextActiveTab,
    setActiveTab: setContextActiveTab
  } = useDashboard();

  // Map contextActiveTab to view tabs
  const resolveTab = (tab) => {
    if (tab === 'maintenance' || tab === 'tasks-log') return 'tasks-log';
    if (tab === 'lost-found') return 'lost-found';
    if (tab === 'housekeepers') return 'housekeepers';
    return 'rooms-grid';
  };

  const [activeTab, setActiveTab] = useState(() => resolveTab(contextActiveTab));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedFloor, setSelectedFloor] = useState('ALL');

  useEffect(() => {
    if (contextActiveTab) {
      setActiveTab(resolveTab(contextActiveTab));
    }
  }, [contextActiveTab]);

  const handleTabChange = (t) => {
    setActiveTab(t);
    if (setContextActiveTab) {
      if (t === 'rooms-grid') setContextActiveTab('turnover');
      else if (t === 'tasks-log') setContextActiveTab('maintenance');
      else if (t === 'lost-found') setContextActiveTab('lost-found');
      else if (t === 'housekeepers') setContextActiveTab('housekeepers');
    }
  };

  // Housekeeper staff roster (Clean empty slate for real hotel creation)
  const [housekeepers, setHousekeepers] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_housekeepers_v2');
      if (saved) return JSON.parse(saved);
    } catch(e){}
    return [];
  });

  // Housekeeping Tasks State (Clean empty slate)
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_hk_tasks_v2');
      if (saved) return JSON.parse(saved);
    } catch(e){}
    return [];
  });

  // Lost & Found Registry State (Clean empty slate)
  const [lostFoundItems, setLostFoundItems] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_lost_found_v2');
      if (saved) return JSON.parse(saved);
    } catch(e){}
    return [];
  });

  // Modals state
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [taskRoom, setTaskRoom] = useState('');
  const [taskType, setTaskType] = useState('Daily Turnover Clean');
  const [taskPriority, setTaskPriority] = useState('Normal');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskNotes, setTaskNotes] = useState('');

  // Lost and found modals state
  const [isNewLostModalOpen, setIsNewLostModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [selectedLostItem, setSelectedLostItem] = useState(null);
  const [claimantName, setClaimantName] = useState('');
  const [claimantPhone, setClaimantPhone] = useState('');

  // New Lost Item form
  const [lostName, setLostName] = useState('');
  const [lostCategory, setLostCategory] = useState('Electronics');
  const [lostRoom, setLostRoom] = useState('');
  const [lostLocation, setLostLocation] = useState('Room Nightstand');
  const [lostFoundBy, setLostFoundBy] = useState('');
  const [lostNotes, setLostNotes] = useState('');

  // New Staff Modal State
  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffShift, setStaffShift] = useState('Morning (07:00 - 15:30)');

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aurastay_housekeepers_v2', JSON.stringify(housekeepers));
    } catch(e){}
  }, [housekeepers]);

  useEffect(() => {
    try {
      localStorage.setItem('aurastay_hk_tasks_v2', JSON.stringify(tasks));
    } catch(e){}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('aurastay_lost_found_v2', JSON.stringify(lostFoundItems));
    } catch(e){}
  }, [lostFoundItems]);

  // Load live tasks from Supabase if configured
  useEffect(() => {
    async function loadTasksFromSupabase() {
      if (!isSupabaseConfigured()) return;
      try {
        const { data, error } = await supabase
          .from('housekeeping_tasks')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setTasks(data.map(d => ({
            id: d.id,
            room: d.room_number,
            taskType: d.task_type,
            priority: d.priority,
            assignedTo: d.assigned_to,
            status: d.status,
            createdAt: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            notes: d.notes || ''
          })));
        }
      } catch (err) {
        console.warn('Supabase housekeeping_tasks fetch notice:', err.message);
      }
    }
    loadTasksFromSupabase();
  }, []);

  // Compute status counts for metrics
  const cleanCount = contextRooms.filter(r => r.status === 'VACANT_READY' || r.status === 'AVAILABLE' || r.housekeeping === 'CLEAN').length;
  const dirtyCount = contextRooms.filter(r => r.status === 'DIRTY' || r.housekeeping === 'DIRTY').length;
  const occupiedCount = contextRooms.filter(r => r.status === 'OCCUPIED').length;
  const maintenanceCount = contextRooms.filter(r => r.status === 'MAINTENANCE' || r.status === 'BLOCKED').length;

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return contextRooms.filter(r => {
      const matchSearch = String(r.roomNumber || r.number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          String(r.roomType || r.type || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'ALL' || 
        (statusFilter === 'CLEAN' && (r.status === 'VACANT_READY' || r.housekeeping === 'CLEAN')) ||
        (statusFilter === 'DIRTY' && (r.status === 'DIRTY' || r.housekeeping === 'DIRTY')) ||
        (statusFilter === 'OCCUPIED' && r.status === 'OCCUPIED') ||
        (statusFilter === 'MAINTENANCE' && r.status === 'MAINTENANCE');

      const matchFloor = selectedFloor === 'ALL' || String(r.floor) === String(selectedFloor);

      return matchSearch && matchStatus && matchFloor;
    });
  }, [contextRooms, searchQuery, statusFilter, selectedFloor]);

  // One-click room status toggle
  const handleRoomAction = async (roomNumber, newStatus) => {
    if (updateRoomStatus) {
      await updateRoomStatus(roomNumber, newStatus);
      showNotification(`Room ${roomNumber} updated to ${newStatus.replace('_', ' ')}.`);
    }
  };

  // Add new cleaning task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskRoom) {
      showNotification('Please enter a room number for the task.', 'error');
      return;
    }
    const newTask = {
      id: `TSK-${Date.now().toString().slice(-4)}`,
      room: taskRoom,
      taskType,
      priority: taskPriority,
      assignedTo: taskAssignee || 'Unassigned Staff',
      status: 'PENDING',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: taskNotes
    };

    setTasks(prev => [newTask, ...prev]);
    setIsNewTaskModalOpen(false);
    showNotification(`Cleaning task created for Room ${taskRoom}`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('housekeeping_tasks').insert([{
          id: newTask.id,
          hotel_id: 'hotel_aurastay_01',
          room_number: taskRoom,
          task_type: taskType,
          priority: taskPriority,
          assigned_to: taskAssignee || 'Unassigned Staff',
          status: 'PENDING',
          notes: taskNotes
        }]);
      } catch (err) {
        console.warn('Supabase task insert err:', err.message);
      }
    }

    setTaskRoom('');
    setTaskAssignee('');
    setTaskNotes('');
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    showNotification(`Task ${taskId} marked as ${newStatus}.`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('housekeeping_tasks').update({ status: newStatus }).eq('id', taskId);
      } catch (e) {}
    }
  };

  // Add Lost & Found Item
  const handleCreateLostItem = (e) => {
    e.preventDefault();
    if (!lostName || !lostRoom) {
      showNotification('Please enter item name and location/room.', 'error');
      return;
    }
    const newItem = {
      id: `LF-${Date.now().toString().slice(-4)}`,
      itemName: lostName,
      category: lostCategory,
      roomNumber: lostRoom,
      location: lostLocation,
      foundBy: lostFoundBy || 'Housekeeping Staff',
      foundDate: new Date().toLocaleDateString('en-GB'),
      status: 'UNCLAIMED',
      claimedBy: '',
      claimantPhone: '',
      notes: lostNotes
    };
    setLostFoundItems(prev => [newItem, ...prev]);
    setIsNewLostModalOpen(false);
    showNotification(`Lost & found item "${lostName}" logged in registry.`);
    setLostName('');
    setLostRoom('');
    setLostFoundBy('');
    setLostNotes('');
  };

  const handleClaimItem = (e) => {
    e.preventDefault();
    if (!selectedLostItem || !claimantName) return;
    setLostFoundItems(prev => prev.map(item => {
      if (item.id === selectedLostItem.id) {
        return {
          ...item,
          status: 'CLAIMED',
          claimedBy: claimantName,
          claimantPhone: claimantPhone
        };
      }
      return item;
    }));
    setIsClaimModalOpen(false);
    setSelectedLostItem(null);
    setClaimantName('');
    setClaimantPhone('');
    showNotification(`Item marked as Claimed & handed over to ${claimantName}.`);
  };

  // Add Staff Member
  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!staffName) return;
    const newStaff = {
      id: `hk-${Date.now().toString().slice(-3)}`,
      name: staffName,
      phone: staffPhone || '+91 98000 00000',
      shift: staffShift,
      assignedRooms: []
    };
    setHousekeepers(prev => [...prev, newStaff]);
    setIsNewStaffModalOpen(false);
    showNotification(`Added ${staffName} to housekeeping roster.`);
    setStaffName('');
    setStaffPhone('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#072432] via-[#0b3347] to-[#0e4860] rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              OPERATIONS & HYGIENE
            </span>
            <span className="text-xs text-sky-200/80 font-mono">• Exceed HMS Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white mt-1">
            Housekeeping & Maintenance
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Live room cleanliness matrix, rapid turnover dispatching, staff shift assignments, and complete Lost & Found registry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'rooms-grid' && (
            <button
              onClick={() => handleTabChange('tasks-log')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Cleaning Task</span>
            </button>
          )}

          {activeTab === 'tasks-log' && (
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Work Order</span>
            </button>
          )}

          {activeTab === 'lost-found' && (
            <button
              onClick={() => setIsNewLostModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Found Item</span>
            </button>
          )}

          {activeTab === 'housekeepers' && (
            <button
              onClick={() => setIsNewStaffModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Housekeeper</span>
            </button>
          )}

          <button
            onClick={() => navigateTo('rate-plans')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center space-x-1.5 transition border border-white/20 cursor-pointer"
          >
            <Building className="w-4 h-4" />
            <span>Manage Rooms & Rates</span>
          </button>
        </div>
      </div>

      {/* 2. Top Operational KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">CLEAN & INSPECTED</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{cleanCount} Rooms</div>
          <span className="text-[11px] font-bold text-emerald-800 mt-1 block">Ready for guest check-in</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">DIRTY / TURNOVER</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{dirtyCount} Rooms</div>
          <span className="text-[11px] font-bold text-amber-700 mt-1 block">Needs housekeeping</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">OCCUPIED IN-HOUSE</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{occupiedCount} Rooms</div>
          <span className="text-[11px] font-bold text-slate-500 mt-1 block">Daily stay service</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">LOST & FOUND ITEMS</span>
          <div className="text-2xl font-black text-purple-700 mt-1">{lostFoundItems.filter(i => i.status === 'UNCLAIMED').length} Unclaimed</div>
          <span className="text-[11px] font-bold text-purple-800 mt-1 block">In safe custody</span>
        </div>
      </div>

      {/* 3. Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1 overflow-x-auto">
        <button
          onClick={() => handleTabChange('rooms-grid')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'rooms-grid'
              ? 'bg-[#0e4860] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Bed className="w-4 h-4" />
          <span>Room Cleanliness & Turnover ({contextRooms.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('tasks-log')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'tasks-log'
              ? 'bg-[#0e4860] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Work Orders & Tasks ({tasks.filter(t => t.status !== 'COMPLETED').length})</span>
        </button>

        <button
          onClick={() => handleTabChange('lost-found')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'lost-found'
              ? 'bg-[#0e4860] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Lost & Found Registry ({lostFoundItems.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('housekeepers')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'housekeepers'
              ? 'bg-[#0e4860] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Staff Roster ({housekeepers.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ROOMS HOUSEKEEPING GRID */}
      {/* ========================================================================= */}
      {activeTab === 'rooms-grid' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search room number or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="CLEAN">Clean & Ready</option>
                <option value="DIRTY">Dirty / Turnover</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>

              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">All Floors</option>
                <option value="1">1st Floor</option>
                <option value="2">2nd Floor</option>
                <option value="3">3rd Floor</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
              <span>Showing {filteredRooms.length} of {contextRooms.length} rooms</span>
            </div>
          </div>

          {filteredRooms.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Bed className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-800">No Rooms Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                No rooms configured yet. You can create room categories and add room numbers in Rates & Plans.
              </p>
              <button
                onClick={() => navigateTo('rate-plans')}
                className="mt-4 px-4 py-2 bg-[#0e4860] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                Go to Rates & Plans to Add Rooms
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredRooms.map(room => {
                const roomNum = room.roomNumber || room.number;
                const isClean = room.status === 'VACANT_READY' || room.status === 'AVAILABLE' || room.housekeeping === 'CLEAN';
                const isDirty = room.status === 'DIRTY' || room.housekeeping === 'DIRTY';
                const isOccupied = room.status === 'OCCUPIED';

                return (
                  <div
                    key={room.id || roomNum}
                    className={`bg-white rounded-2xl p-4 border transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between ${
                      isDirty ? 'border-amber-300 ring-2 ring-amber-100' :
                      isClean ? 'border-emerald-200 ring-1 ring-emerald-50' :
                      isOccupied ? 'border-indigo-200 ring-1 ring-indigo-50' :
                      'border-rose-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Floor {room.floor || 1}
                          </span>
                          <h4 className="text-xl font-mono font-black text-slate-900 mt-0.5">
                            Room {roomNum}
                          </h4>
                          <span className="text-xs font-semibold text-slate-600 block mt-0.5">
                            {room.roomType || room.type || 'Standard Suite'}
                          </span>
                        </div>

                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                          isClean ? 'bg-emerald-100 text-emerald-800' :
                          isDirty ? 'bg-amber-100 text-amber-800 animate-pulse' :
                          isOccupied ? 'bg-indigo-100 text-indigo-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {room.status?.replace('_', ' ') || 'CLEAN'}
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1 text-slate-500">
                        <div className="flex justify-between">
                          <span>Housekeeper:</span>
                          <span className="font-semibold text-slate-800">{room.assignedHk || 'Unassigned'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bed Type:</span>
                          <span className="font-semibold text-slate-800">{room.bedType || 'King Bed'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5">
                      {isDirty ? (
                        <button
                          onClick={() => handleRoomAction(roomNum, 'VACANT_READY')}
                          className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition shadow-2xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Clean ✓</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoomAction(roomNum, 'DIRTY')}
                          className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition cursor-pointer"
                        >
                          <Paintbrush className="w-3.5 h-3.5" />
                          <span>Mark Dirty</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setTaskRoom(roomNum);
                          setIsNewTaskModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                        title="Dispatch Task"
                      >
                        <Wrench className="w-3.5 h-3.5" />
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
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active Cleaning Tasks & Maintenance Orders</h3>
              <p className="text-xs text-slate-500">Live work order queue synchronized across housekeeping staff.</p>
            </div>
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="px-3.5 py-2 bg-[#0e4860] hover:bg-[#0b3347] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Work Order</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-800">No Cleaning Tasks Queued</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                All rooms are clean and inspected. Click the button below to assign a new cleaning task or maintenance work order.
              </p>
              <button
                onClick={() => setIsNewTaskModalOpen(true)}
                className="mt-4 px-4 py-2 bg-[#0e4860] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                + Create Cleaning Task
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Task ID</th>
                      <th className="py-3.5 px-4">Room #</th>
                      <th className="py-3.5 px-4">Task Type</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Assigned To</th>
                      <th className="py-3.5 px-4">Created Time</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{t.id}</td>
                        <td className="py-3.5 px-4 font-bold text-sky-800">Room {t.room}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {t.taskType}
                          {t.notes && <span className="block text-[10px] text-slate-400 italic">{t.notes}</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.priority === 'High' ? 'bg-rose-100 text-rose-800' :
                            t.priority === 'Urgent' ? 'bg-red-200 text-red-900 font-black' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{t.assignedTo}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{t.createdAt}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            t.status === 'IN_PROGRESS' ? 'bg-sky-100 text-sky-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          {t.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(t.id, 'COMPLETED')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-xs transition cursor-pointer"
                            >
                              Mark Done ✓
                            </button>
                          )}
                          <button
                            onClick={() => setTasks(prev => prev.filter(item => item.id !== t.id))}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LOST & FOUND REGISTRY */}
      {/* ========================================================================= */}
      {activeTab === 'lost-found' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-200 gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Guest Lost & Found Register</h3>
              <p className="text-xs text-slate-500">Record valuables, luggage, and personal items found in rooms or public areas.</p>
            </div>
            <button
              onClick={() => setIsNewLostModalOpen(true)}
              className="px-3.5 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Found Item</span>
            </button>
          </div>

          {lostFoundItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                <Archive className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-800">No Lost & Found Items Recorded</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                The registry is clean. When a guest item or valuable is found in a room or premises, click below to log it into custody.
              </p>
              <button
                onClick={() => setIsNewLostModalOpen(true)}
                className="mt-4 px-4 py-2 bg-purple-900 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                + Log Found Item
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Register #</th>
                      <th className="py-3.5 px-4">Item Description</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Room / Location</th>
                      <th className="py-3.5 px-4">Found By</th>
                      <th className="py-3.5 px-4">Date Logged</th>
                      <th className="py-3.5 px-4">Claim Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lostFoundItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-purple-900">{item.id}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {item.itemName}
                          {item.notes && <span className="block text-[10px] text-slate-400 font-normal italic">{item.notes}</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 font-semibold">
                          Room {item.roomNumber}
                          <span className="block text-[10px] text-slate-400 font-normal">{item.location}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{item.foundBy}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{item.foundDate}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.status === 'CLAIMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status}
                          </span>
                          {item.claimedBy && (
                            <span className="block text-[10px] text-emerald-800 font-semibold mt-0.5">
                              to {item.claimedBy}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          {item.status === 'UNCLAIMED' ? (
                            <button
                              onClick={() => {
                                setSelectedLostItem(item);
                                setIsClaimModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-lg border border-purple-200 text-xs transition cursor-pointer"
                            >
                              Claim Item ✓
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Handed Over</span>
                          )}
                          <button
                            onClick={() => setLostFoundItems(prev => prev.filter(i => i.id !== item.id))}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: HOUSEKEEPING STAFF */}
      {/* ========================================================================= */}
      {activeTab === 'housekeepers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Housekeeping Team Roster</h3>
              <p className="text-xs text-slate-500">Staff shift schedules and floor/room allocations.</p>
            </div>
            <button
              onClick={() => setIsNewStaffModalOpen(true)}
              className="px-3.5 py-2 bg-[#0e4860] hover:bg-[#0b3347] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Housekeeper</span>
            </button>
          </div>

          {housekeepers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-800">No Housekeepers Registered</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Register housekeeping staff members to assign room cleaning rosters and work orders.
              </p>
              <button
                onClick={() => setIsNewStaffModalOpen(true)}
                className="mt-4 px-4 py-2 bg-[#0e4860] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                + Add Housekeeper
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {housekeepers.map(hk => (
                <div key={hk.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{hk.name}</h4>
                      <span className="text-xs text-slate-400 font-mono">{hk.phone}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                    <div className="text-slate-500">Shift:</div>
                    <div className="font-semibold text-slate-800 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      {hk.shift}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    <span>Assigned Rooms: </span>
                    <span className="font-bold text-slate-800">
                      {hk.assignedRooms && hk.assignedRooms.length > 0 ? hk.assignedRooms.join(', ') : 'None'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW CLEANING TASK */}
      {/* ========================================================================= */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif font-black text-lg text-slate-900">Create Cleaning Task</h3>
              <button onClick={() => setIsNewTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Room Number</label>
                <input
                  type="text"
                  placeholder="e.g. 101, 204"
                  value={taskRoom}
                  onChange={(e) => setTaskRoom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Task Type</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Daily Turnover Clean">Daily Turnover Clean</option>
                  <option value="Full Linen Change & Sanitization">Full Linen Change & Sanitization</option>
                  <option value="Deep Clean & Minibar Restock">Deep Clean & Minibar Restock</option>
                  <option value="Plumbing / Electrical Check">Plumbing / Electrical Check</option>
                  <option value="VIP Turndown Service">VIP Turndown Service</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Assignee (Staff Name)</label>
                  <input
                    type="text"
                    placeholder="Staff name"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Instructions / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Special instructions for the housekeeper..."
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0e4860] hover:bg-[#0b3347] text-white font-bold shadow-md cursor-pointer"
                >
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOG LOST & FOUND ITEM */}
      {/* ========================================================================= */}
      {isNewLostModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif font-black text-lg text-slate-900">Log Lost & Found Item</h3>
              <button onClick={() => setIsNewLostModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLostItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Item Name / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Dell XPS Laptop, Gold Watch, Brown Leather Wallet"
                  value={lostName}
                  onChange={(e) => setLostName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Category</label>
                  <select
                    value={lostCategory}
                    onChange={(e) => setLostCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Jewelry & Watches">Jewelry & Watches</option>
                    <option value="Documents & Wallets">Documents & Wallets</option>
                    <option value="Clothing & Apparel">Clothing & Apparel</option>
                    <option value="Luggage & Bags">Luggage & Bags</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Room / Area</label>
                  <input
                    type="text"
                    placeholder="e.g. 204 or Lobby"
                    value={lostRoom}
                    onChange={(e) => setLostRoom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Exact Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Under bed, Nightstand"
                    value={lostLocation}
                    onChange={(e) => setLostLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Found By (Staff / Finder)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sunita Devi or Reception"
                    value={lostFoundBy}
                    onChange={(e) => setLostFoundBy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Safe Custody Notes</label>
                <textarea
                  rows={2}
                  placeholder="Where the item is currently stored (e.g. Safe Box 2)..."
                  value={lostNotes}
                  onChange={(e) => setLostNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewLostModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold shadow-md cursor-pointer"
                >
                  Save to Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD HOUSEKEEPER */}
      {/* ========================================================================= */}
      {isNewStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif font-black text-lg text-slate-900">Add Housekeeping Staff</h3>
              <button onClick={() => setIsNewStaffModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sunita Devi"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Mobile Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98450 11223"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Working Shift</label>
                <select
                  value={staffShift}
                  onChange={(e) => setStaffShift(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Morning (07:00 - 15:30)">Morning (07:00 - 15:30)</option>
                  <option value="Evening (15:00 - 23:30)">Evening (15:00 - 23:30)</option>
                  <option value="Night (23:00 - 07:30)">Night (23:00 - 07:30)</option>
                  <option value="General (09:00 - 17:30)">General (09:00 - 17:30)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0e4860] hover:bg-[#0b3347] text-white font-bold shadow-md cursor-pointer"
                >
                  Add Housekeeper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLAIM ITEM HANDOVER */}
      {/* ========================================================================= */}
      {isClaimModalOpen && selectedLostItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif font-black text-lg text-slate-900">Guest Handover & Claim</h3>
              <button onClick={() => setIsClaimModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-50 rounded-2xl mb-4 border border-purple-100 text-xs">
              <span className="text-[10px] font-bold text-purple-700 uppercase block">Claiming Item:</span>
              <span className="font-bold text-slate-900">{selectedLostItem.itemName}</span>
              <span className="text-slate-500 block">Found in Room {selectedLostItem.roomNumber} on {selectedLostItem.foundDate}</span>
            </div>

            <form onSubmit={handleClaimItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Claimant / Guest Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Verified Mobile Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={claimantPhone}
                  onChange={(e) => setClaimantPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Confirm Handover ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
