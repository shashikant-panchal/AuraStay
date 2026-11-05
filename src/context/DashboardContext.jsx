import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialMockData } from '../data/mockData';
import { mockRooms, mockReservations, mockFnbOrders, mockStaffUsers, mockOtaChannels } from '../data/suiteData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const version = localStorage.getItem('aurastay_data_version');
      if (version === 'v2_clean_zero') {
        const saved = localStorage.getItem('aurastay_suite_data');
        if (saved) return JSON.parse(saved);
      } else {
        localStorage.removeItem('aurastay_suite_data');
        localStorage.setItem('aurastay_data_version', 'v2_clean_zero');
      }
    } catch (e) {
      console.warn('Could not load from localStorage, using initial clean data', e);
    }
    return initialMockData;
  });

  // Current view: 'master-service-home' or 'revenue-dashboard' or other module views
  const [currentView, setCurrentView] = useState('master-service-home');
  const [subModuleTitle, setSubModuleTitle] = useState('');

  // Revenue Dashboard active tab
  const [activeTab, setActiveTab] = useState('overview');
  const [frontOfficeSubTab, setFrontOfficeSubTab] = useState('dashboard');

  // Rooms & Operations state
  const [rooms, setRooms] = useState(mockRooms);
  const [reservations, setReservations] = useState(mockReservations);
  const [fnbOrders, setFnbOrders] = useState(mockFnbOrders);
  const [staffUsers, setStaffUsers] = useState(mockStaffUsers);
  const [otaChannels, setOtaChannels] = useState(mockOtaChannels);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Modals state
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isSetBudgetModalOpen, setIsSetBudgetModalOpen] = useState(false);
  const [isEvaluateGroupModalOpen, setIsEvaluateGroupModalOpen] = useState(false);
  const [isApplyOverrideModalOpen, setIsApplyOverrideModalOpen] = useState(false);
  const [isMonitoringModalOpen, setIsMonitoringModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateReservationModalOpen, setIsCreateReservationModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  
  // Popover state for Master Service Home cards
  const [activePopoverModule, setActivePopoverModule] = useState(null);

  const [notificationMessage, setNotificationMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Fetch initial live data from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let isMounted = true;

    async function loadSupabaseData() {
      try {
        const [roomsRes, resRes, fnbRes, staffRes, chanRes] = await Promise.all([
          supabase.from('rooms').select('*').order('room_number'),
          supabase.from('reservations').select('*').order('created_at', { ascending: false }),
          supabase.from('fnb_orders').select('*').order('created_at', { ascending: false }),
          supabase.from('staff_users').select('*').order('id'),
          supabase.from('ota_channels').select('*').order('id')
        ]);

        if (isMounted) {
          let tablesFound = false;
          if (roomsRes.data) {
            setRooms(roomsRes.data.map(r => ({
              roomNumber: r.room_number,
              floor: r.floor,
              type: r.type,
              bed: r.bed,
              status: r.status,
              price: Number(r.price),
              guest: r.guest,
              bookingId: r.booking_id,
              checkOut: r.check_out
            })));
            tablesFound = true;
          }
          if (resRes.data) {
            setReservations(resRes.data.map(r => ({
              id: r.id,
              guest: r.guest,
              room: r.room,
              checkIn: r.check_in,
              checkOut: r.check_out,
              source: r.source,
              amount: Number(r.amount),
              status: r.status,
              payment: r.payment
            })));
          }
          if (fnbRes.data) {
            setFnbOrders(fnbRes.data.map(o => ({
              orderId: o.id,
              roomTable: o.room_table,
              guest: o.guest,
              items: o.items,
              total: Number(o.total),
              status: o.status,
              time: o.time
            })));
          }
          if (staffRes.data) {
            setStaffUsers(staffRes.data);
          }
          if (chanRes.data && chanRes.data.length > 0) {
            setOtaChannels(chanRes.data.map(c => ({
              name: c.name,
              status: c.status,
              syncStatus: c.sync_status,
              mappedRooms: c.mapped_rooms,
              activeBookings: c.active_bookings,
              commission: c.commission
            })));
          }

          if (tablesFound) {
            setIsLiveConnected(true);
            showNotification('🟢 Live Cloud Sync Active. Ready to create your property data.');
          }
        }
      } catch (err) {
        console.info('Supabase database initializing...', err);
      }
    }

    loadSupabaseData();
    return () => { isMounted = false; };
  }, []);

  // 2. Realtime WebSocket subscription
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase.channel('aurastay-realtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, payload => {
        if (payload.eventType === 'UPDATE' && payload.new) {
          setRooms(prev => prev.map(r => r.roomNumber === payload.new.room_number ? {
            ...r,
            status: payload.new.status,
            guest: payload.new.guest,
            bookingId: payload.new.booking_id,
            checkOut: payload.new.check_out
          } : r));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, payload => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const item = {
            id: payload.new.id,
            guest: payload.new.guest,
            room: payload.new.room,
            checkIn: payload.new.check_in,
            checkOut: payload.new.check_out,
            source: payload.new.source,
            amount: Number(payload.new.amount),
            status: payload.new.status,
            payment: payload.new.payment
          };
          setReservations(prev => [item, ...prev.filter(r => r.id !== item.id)]);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          setReservations(prev => prev.map(r => r.id === payload.new.id ? {
            ...r,
            status: payload.new.status,
            payment: payload.new.payment
          } : r));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fnb_orders' }, payload => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const item = {
            orderId: payload.new.id,
            roomTable: payload.new.room_table,
            guest: payload.new.guest,
            items: payload.new.items,
            total: Number(payload.new.total),
            status: payload.new.status,
            time: payload.new.time
          };
          setFnbOrders(prev => [item, ...prev.filter(o => o.orderId !== item.orderId)]);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          setFnbOrders(prev => prev.map(o => o.orderId === payload.new.id ? { ...o, status: payload.new.status } : o));
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLiveConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aurastay_suite_data', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [data]);

  const showNotification = (msg) => {
    setNotificationMessage(msg);
    setTimeout(() => setNotificationMessage(null), 4000);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      if (isSupabaseConfigured) {
        const { data: latestRooms } = await supabase.from('rooms').select('*').order('room_number');
        if (latestRooms) {
          setRooms(latestRooms.map(r => ({
            roomNumber: r.room_number,
            floor: r.floor,
            type: r.type,
            bed: r.bed,
            status: r.status,
            price: Number(r.price),
            guest: r.guest,
            bookingId: r.booking_id,
            checkOut: r.check_out
          })));
        }
      }
    } catch (err) {
      console.warn('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
      showNotification('AuraStay Suite synchronized with live database.');
    }
  };

  const resetToDefaults = () => {
    setData(initialMockData);
    setRooms(mockRooms);
    setReservations(mockReservations);
    setFnbOrders(mockFnbOrders);
    setCurrentView('master-service-home');
    localStorage.removeItem('aurastay_suite_data');
    showNotification('Suite reset to official AuraStay demo state.');
  };

  const navigateTo = (view, subItem = '') => {
    setCurrentView(view);
    setSubModuleTitle(subItem);
    setActivePopoverModule(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Change room status (Housekeeping)
  const updateRoomStatus = async (roomNumber, newStatus) => {
    setRooms(prev => prev.map(r => r.roomNumber === roomNumber ? { ...r, status: newStatus } : r));
    showNotification(`Room ${roomNumber} status set to ${newStatus}`);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('rooms')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('room_number', roomNumber);
      } catch (err) {
        console.warn('Supabase room update sync pending table setup', err);
      }
    }
  };

  // Add room (saved to Supabase & local state)
  const addRoom = async (newRoom) => {
    const room = {
      roomNumber: String(newRoom.roomNumber).trim(),
      floor: newRoom.floor || '1st Floor',
      type: newRoom.type || 'Standard Room',
      bed: newRoom.bed || 'King Bed',
      status: 'VACANT_READY',
      price: Number(newRoom.price) || 2000,
      guest: null,
      bookingId: null,
      checkOut: null
    };

    setRooms(prev => [room, ...prev.filter(r => r.roomNumber !== room.roomNumber)]);
    showNotification(`Room ${room.roomNumber} created successfully.`);
    setIsCreateRoomModalOpen(false);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('rooms').insert({
          room_number: room.roomNumber,
          floor: room.floor,
          type: room.type,
          bed: room.bed,
          status: 'VACANT_READY',
          price: room.price
        });
      } catch (err) {
        console.warn('Supabase room insert error:', err);
      }
    }
  };

  // Add reservation
  const addReservation = async (newRes) => {
    const resId = `AST-B-${860 + reservations.length + 1}`;
    const reservation = {
      id: resId,
      ...newRes,
      status: 'CONFIRMED',
      payment: 'PENDING'
    };
    setReservations([reservation, ...reservations]);
    showNotification(`Reservation ${resId} created for ${newRes.guest}`);
    setIsCreateReservationModalOpen(false);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('reservations').insert({
          id: resId,
          guest: newRes.guest,
          guest_email: newRes.guestEmail || null,
          guest_phone: newRes.guestPhone || null,
          room: newRes.room,
          check_in: newRes.checkIn,
          check_out: newRes.checkOut,
          source: newRes.source || 'Direct Website',
          amount: newRes.amount || 4000,
          status: 'CONFIRMED',
          payment: 'PENDING'
        });
      } catch (err) {
        console.warn('Supabase reservation insert sync pending table setup', err);
      }
    }
  };

  // Revenue actions
  const handleReviewAction = (actionId, status, note = '') => {
    setData(prev => {
      const updatedItems = prev.todayActions.items.map(item => {
        if (item.id === actionId) return { ...item, status, note };
        return item;
      });
      return {
        ...prev,
        todayActions: { ...prev.todayActions, items: updatedItems }
      };
    });
    showNotification(`Recommendation marked as ${status}.`);
    setIsEvidenceModalOpen(false);
  };

  const updateMonthlyBudget = (updatedMonthlyList, newTarget) => {
    setData(prev => {
      const currentNov = updatedMonthlyList.find(m => m.month === 'Nov')?.budget || newTarget;
      const achievement = Number(((prev.budgetForecast.mtdRevenue / currentNov) * 100).toFixed(2));
      return {
        ...prev,
        budgetForecast: {
          ...prev.budgetForecast,
          revenueTarget: currentNov,
          revenueAchievement: achievement,
          monthlyComparison: updatedMonthlyList
        }
      };
    });
    showNotification('Monthly accommodation budgets saved.');
    setIsSetBudgetModalOpen(false);
  };

  const addForecastOverride = (override) => {
    const newOverride = {
      id: 'ovr-' + Date.now(),
      createdAt: new Date().toISOString(),
      ...override
    };
    setData(prev => {
      const updatedForecast = prev.demandForecast.occupancyForecast.map(item => {
        if (item.date >= override.fromDate && item.date <= override.toDate) {
          return {
            ...item,
            forecast: Number(override.adjustedOccupancy),
            explanation: `Overridden (${override.reason}): ${override.adjustedOccupancy}%`
          };
        }
        return item;
      });
      return {
        ...prev,
        demandForecast: {
          ...prev.demandForecast,
          accuracy: {
            ...prev.demandForecast.accuracy,
            manualOverridesEvaluated: prev.demandForecast.accuracy.manualOverridesEvaluated + 1
          },
          manualOverrides: [newOverride, ...(prev.demandForecast.manualOverrides || [])],
          occupancyForecast: updatedForecast
        }
      };
    });
    showNotification(`Manual override applied: ${override.adjustedOccupancy}%`);
    setIsApplyOverrideModalOpen(false);
  };

  const saveOverbookingPolicy = (policy) => {
    setData(prev => ({
      ...prev,
      displacement: { ...prev.displacement, overbookingPolicy: { ...policy } }
    }));
    showNotification(`Overbooking policy saved: ${policy.enabled ? 'Enabled (' + policy.maxExtraRooms + ' max rooms)' : 'Disabled'}.`);
  };

  const saveGroupEvaluation = (evaluation) => {
    const newEval = {
      id: 'eval-' + Date.now(),
      createdAt: new Date().toISOString(),
      ...evaluation
    };
    setData(prev => ({
      ...prev,
      displacement: {
        ...prev.displacement,
        evaluatedGroups: [newEval, ...(prev.displacement.evaluatedGroups || [])]
      }
    }));
    showNotification(`Group "${evaluation.groupName}" evaluated: ${evaluation.recommendation}.`);
    setIsEvaluateGroupModalOpen(false);
  };

  const toggleConfigRequirement = (reqId) => {
    setData(prev => {
      const updatedCategories = prev.configuration.categories.map(cat => ({
        ...cat,
        requirements: cat.requirements.map(req => {
          if (req.id === reqId) {
            const nextStatus = req.status === 'READY' ? 'NEEDS_ATTENTION' : 'READY';
            return { ...req, status: nextStatus };
          }
          return req;
        })
      }));

      // Recalculate readiness percentage
      let total = 0;
      let ready = 0;
      updatedCategories.forEach(cat => {
        cat.requirements.forEach(r => {
          total++;
          if (r.status === 'READY') ready++;
        });
      });
      const readiness = Math.round((ready / total) * 100);

      return {
        ...prev,
        configuration: {
          ...prev.configuration,
          overallReadiness: readiness,
          categories: updatedCategories
        }
      };
    });
  };

  return (
    <DashboardContext.Provider value={{
      data,
      currentView,
      activeTab,
      frontOfficeSubTab,
      rooms,
      reservations,
      fnbOrders,
      staffUsers,
      otaChannels,
      isLiveConnected,
      activePopoverModule,
      notificationMessage,
      isRefreshing,
      subModuleTitle,
      isGlossaryOpen,
      isConfigOpen,
      isEvidenceModalOpen,
      isSetBudgetModalOpen,
      isEvaluateGroupModalOpen,
      isApplyOverrideModalOpen,
      isMonitoringModalOpen,
      isTourOpen,
      isSearchOpen,
      isCreateReservationModalOpen,
      setCurrentView,
      setActiveTab,
      setFrontOfficeSubTab,
      navigateTo,
      setActivePopoverModule,
      showNotification,
      refreshData,
      resetToDefaults,
      updateRoomStatus,
      addReservation,
      handleReviewAction,
      updateMonthlyBudget,
      addForecastOverride,
      saveOverbookingPolicy,
      saveGroupEvaluation,
      toggleConfigRequirement,
      setIsGlossaryOpen,
      setIsConfigOpen,
      setIsEvidenceModalOpen,
      setIsSetBudgetModalOpen,
      setIsEvaluateGroupModalOpen,
      setIsApplyOverrideModalOpen,
      setIsMonitoringModalOpen,
      setIsTourOpen,
      setIsSearchOpen,
      setIsCreateReservationModalOpen,
      isCreateRoomModalOpen,
      setIsCreateRoomModalOpen,
      addRoom
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within DashboardProvider');
  return context;
}
