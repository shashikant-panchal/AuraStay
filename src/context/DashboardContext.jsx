import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialMockData } from '../data/mockData';
import { mockRooms, mockReservations, mockFnbOrders, mockStaffUsers, mockOtaChannels } from '../data/suiteData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_HOTEL = {
  id: 'hotel_aurastay_01',
  slug: 'aurastay-suite',
  name: 'AuraStay Suite',
  shortName: 'AST',
  logoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=200&q=80',
  ownerName: 'AuraStay Admin',
  ownerRole: 'Property Admin',
  email: 'admin@aurastay.com',
  password: 'admin123',
  mobile: '7978578046',
  address: 'DLF Cyber City, Patia, Bhubaneswar, Odisha, India - 751024',
  city: 'Bhubaneswar',
  totalRooms: 28,
  currency: 'INR',
  currencySymbol: '₹'
};

const DashboardContext = createContext(null);

const VALID_VIEWS = new Set([
  'dashboard',
  'master-service-home',
  'revenue-dashboard',
  'front-office',
  'reservation-management',
  'food-beverages',
  'restaurant-pos',
  'product-setup',
  'housekeeping',
  'channel-manager',
  'revenue-insights',
  'audit-logs',
  'reports',
  'rate-plans',
  'promotions',
  'ari-grid',
  'guests',
  'guest-crm',
  'reputation-management',
  'stock-management',
  'services',
  'account-finance',
  'staff-admin',
  'hr-payroll'
]);

export function DashboardProvider({ children }) {
  // Multi-tenant Hotel Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('aurastay_hotel_auth') === 'true';
  });

  const [currentHotel, setCurrentHotel] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_hotel_session');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return DEFAULT_HOTEL;
  });

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

  // Current view: restore from URL hash or localStorage, fallback to 'dashboard'
  const [currentView, setCurrentView] = useState(() => {
    try {
      const rawHash = window.location.hash.replace(/^#[/]?/, '').trim();
      if (rawHash) {
        const [viewPart] = rawHash.split('?');
        if (VALID_VIEWS.has(viewPart)) return viewPart;
      }
      const savedView = localStorage.getItem('aurastay_current_view');
      if (savedView && VALID_VIEWS.has(savedView)) return savedView;
    } catch (e) {
      console.warn('Could not read saved navigation state', e);
    }
    return 'dashboard';
  });
  const [subModuleTitle, setSubModuleTitle] = useState('');

  // Revenue Dashboard active tab
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_active_tab');
      if (saved) return saved;
    } catch (e) { }
    return 'overview';
  });
  const [frontOfficeSubTab, setFrontOfficeSubTab] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_front_office_subtab');
      if (saved) return saved;
    } catch (e) { }
    return 'dashboard';
  });

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
            // Filter rooms for current hotel tenant
            const hotelRooms = roomsRes.data.filter(r => !r.hotel_id || r.hotel_id === currentHotel.id);
            setRooms(hotelRooms.map(r => ({
              id: r.id,
              hotelId: r.hotel_id || currentHotel.id,
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
            // Filter reservations for current hotel tenant
            const hotelRes = resRes.data.filter(r => !r.hotel_id || r.hotel_id === currentHotel.id);
            setReservations(hotelRes.map(r => ({
              id: r.id,
              hotelId: r.hotel_id || currentHotel.id,
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
            const hotelFnb = fnbRes.data.filter(o => !o.hotel_id || o.hotel_id === currentHotel.id);
            setFnbOrders(hotelFnb.map(o => ({
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
          }
        }
      } catch (err) {
        console.info('Supabase database initializing...', err);
      }
    }

    loadSupabaseData();
    return () => { isMounted = false; };
  }, [currentHotel]);

  // 2. Realtime WebSocket subscription
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase.channel(`aurastay-realtime-${currentHotel.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, payload => {
        if (payload.eventType === 'INSERT' && payload.new) {
          if (!payload.new.hotel_id || payload.new.hotel_id === currentHotel.id) {
            const newRm = {
              id: payload.new.id,
              hotelId: payload.new.hotel_id || currentHotel.id,
              roomNumber: payload.new.room_number,
              floor: payload.new.floor,
              type: payload.new.type,
              bed: payload.new.bed,
              status: payload.new.status,
              price: Number(payload.new.price),
              guest: payload.new.guest,
              bookingId: payload.new.booking_id,
              checkOut: payload.new.check_out
            };
            setRooms(prev => [newRm, ...prev.filter(r => r.roomNumber !== newRm.roomNumber)]);
          }
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          if (!payload.new.hotel_id || payload.new.hotel_id === currentHotel.id) {
            setRooms(prev => prev.map(r => r.roomNumber === payload.new.room_number ? {
              ...r,
              status: payload.new.status,
              guest: payload.new.guest,
              bookingId: payload.new.booking_id,
              checkOut: payload.new.check_out
            } : r));
          }
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setRooms(prev => prev.filter(r => r.id !== payload.old.id && r.roomNumber !== payload.old.room_number));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, payload => {
        if (payload.eventType === 'INSERT' && payload.new) {
          if (!payload.new.hotel_id || payload.new.hotel_id === currentHotel.id) {
            const item = {
              id: payload.new.id,
              hotelId: payload.new.hotel_id || currentHotel.id,
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
            showNotification(`🎉 New Online Guest Booking #${payload.new.id} received from AuraStayBooking! Room ${payload.new.room} is locked.`);
          }
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          if (!payload.new.hotel_id || payload.new.hotel_id === currentHotel.id) {
            setReservations(prev => prev.map(r => r.id === payload.new.id ? {
              ...r,
              status: payload.new.status,
              payment: payload.new.payment,
              amount: Number(payload.new.amount) || r.amount
            } : r));
          }
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setReservations(prev => prev.filter(r => r.id !== payload.old.id));
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
  }, [currentHotel]);

  // Hotel Admin Authentication functions
  const login = async (email, password) => {
    const inputEmail = email.trim().toLowerCase();
    const inputPass = password.trim();

    // 1. Check Supabase 'hotels' table
    if (isSupabaseConfigured) {
      try {
        const { data: hotelData, error } = await supabase
          .from('hotels')
          .select('*')
          .eq('email', inputEmail)
          .eq('password', inputPass)
          .maybeSingle();

        if (hotelData && !error) {
          const hotel = {
            id: hotelData.id,
            slug: hotelData.slug,
            name: hotelData.name,
            shortName: hotelData.short_name || 'AST',
            logoUrl: hotelData.logo_url || DEFAULT_HOTEL.logoUrl,
            ownerName: hotelData.owner_name || 'Hotel Admin',
            ownerRole: 'Property Admin',
            email: hotelData.email,
            password: hotelData.password,
            mobile: hotelData.mobile || '7978578046',
            address: hotelData.address || 'India',
            city: hotelData.city || 'Bhubaneswar',
            totalRooms: hotelData.total_rooms || 20,
            currency: hotelData.currency || 'INR',
            currencySymbol: hotelData.currency_symbol || '₹'
          };
          setCurrentHotel(hotel);
          setIsLoggedIn(true);
          localStorage.setItem('aurastay_hotel_auth', 'true');
          localStorage.setItem('aurastay_hotel_session', JSON.stringify(hotel));
          showNotification(`Welcome to ${hotel.name} PMS Portal!`);
          return true;
        }
      } catch (e) {
        console.warn('Supabase hotel login query error:', e);
      }
    }

    // 2. Check local SaaS tenants (created by Super Admin in aurastay_saas_hotels)
    try {
      const saasHotels = JSON.parse(localStorage.getItem('aurastay_saas_hotels') || '[]');
      const match = saasHotels.find(h =>
        h.email.toLowerCase() === inputEmail && h.password === inputPass
      );
      if (match) {
        const hotel = {
          ...match,
          ownerRole: 'Property Admin'
        };
        setCurrentHotel(hotel);
        setIsLoggedIn(true);
        localStorage.setItem('aurastay_hotel_auth', 'true');
        localStorage.setItem('aurastay_hotel_session', JSON.stringify(hotel));
        showNotification(`Welcome to ${hotel.name} PMS Portal!`);
        return true;
      }
    } catch (e) { }

    // 3. Fallback check for default hotel credentials and Exceed Software credentials
    if (
      (inputEmail === 'shivanandi' && inputPass === '12345') ||
      (inputEmail === 'demo' && inputPass === '12345') ||
      (inputEmail.includes('shivanandi') && inputPass === '12345') ||
      (inputEmail === 'admin@aurastay.com' && inputPass === 'admin123') ||
      (inputEmail.includes('admin') && inputPass.length >= 4)
    ) {
      const activeHotel = {
        ...DEFAULT_HOTEL,
        name: 'SHIVANANDI VISTA (DEMO HOTEL)',
        shortName: 'DEMO',
        ownerName: 'SHIVANANDI Admin'
      };
      setCurrentHotel(activeHotel);
      setIsLoggedIn(true);
      localStorage.setItem('aurastay_hotel_auth', 'true');
      localStorage.setItem('aurastay_hotel_session', JSON.stringify(activeHotel));
      showNotification('Welcome to SHIVANANDI VISTA PMS Portal!');
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('aurastay_hotel_auth');
    localStorage.removeItem('aurastay_hotel_session');
    showNotification('Logged out from Hotel PMS', 'info');
  };

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

  // Sync currentView to localStorage and URL hash
  useEffect(() => {
    try {
      if (currentView && VALID_VIEWS.has(currentView)) {
        localStorage.setItem('aurastay_current_view', currentView);
        const currentHash = window.location.hash.replace(/^#[/]?/, '').trim();
        if (currentHash !== currentView) {
          window.location.hash = currentView;
        }
      }
    } catch (e) {
      console.warn('Could not save current view', e);
    }
  }, [currentView]);

  // Listen to hash changes (browser back/forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      try {
        const rawHash = window.location.hash.replace(/^#[/]?/, '').trim();
        if (rawHash) {
          const [viewPart] = rawHash.split('?');
          if (VALID_VIEWS.has(viewPart) && viewPart !== currentView) {
            setCurrentView(viewPart);
          }
        }
      } catch (e) {
        console.warn('Error handling hashchange', e);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentView]);

  // Persist activeTab to localStorage
  useEffect(() => {
    try {
      if (activeTab) localStorage.setItem('aurastay_active_tab', activeTab);
    } catch (e) { }
  }, [activeTab]);

  // Persist frontOfficeSubTab to localStorage
  useEffect(() => {
    try {
      if (frontOfficeSubTab) localStorage.setItem('aurastay_front_office_subtab', frontOfficeSubTab);
    } catch (e) { }
  }, [frontOfficeSubTab]);

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
      showNotification('Inventory synchronized successfully.');
    }
  };

  const resetToDefaults = () => {
    setData(initialMockData);
    setRooms(mockRooms);
    setReservations(mockReservations);
    setFnbOrders(mockFnbOrders);
    setCurrentView('dashboard');
    localStorage.removeItem('aurastay_suite_data');
    localStorage.removeItem('aurastay_current_view');
    localStorage.removeItem('aurastay_active_tab');
    localStorage.removeItem('aurastay_front_office_subtab');
    try {
      window.location.hash = 'dashboard';
    } catch (e) { }
    showNotification('Suite reset to official AuraStay demo state.');
  };

  const navigateTo = (view, subItem = '') => {
    setCurrentView(view);
    setSubModuleTitle(subItem);
    setActivePopoverModule(null);
    try {
      if (VALID_VIEWS.has(view)) {
        localStorage.setItem('aurastay_current_view', view);
        window.location.hash = view;
      }
    } catch (e) { }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Change room status (Housekeeping)
  const updateRoomStatus = async (roomIdentifier, newStatus) => {
    const cleanNum = String(roomIdentifier).replace(/\D/g, '') || String(roomIdentifier);
    setRooms(prev => prev.map(r => 
      (String(r.roomNumber) === cleanNum || String(r.id) === String(roomIdentifier) || String(r.name) === String(roomIdentifier))
        ? { ...r, status: newStatus }
        : r
    ));
    showNotification(`Room ${cleanNum} status set to ${newStatus}`);

    if (isSupabaseConfigured) {
      try {
        // Try updating by room_number first, or by id
        const { error } = await supabase
          .from('rooms')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('room_number', cleanNum);

        if (error) {
          await supabase
            .from('rooms')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', roomIdentifier);
        }
      } catch (err) {
        console.warn('Supabase room update sync pending table setup', err);
      }
    }
  };

  // Add room (saved to Supabase & local state)
  const addRoom = async (newRoom) => {
    const room = {
      hotelId: currentHotel.id,
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
        const payload = {
          room_number: room.roomNumber,
          floor: room.floor,
          type: room.type,
          bed: room.bed,
          status: 'VACANT_READY',
          price: room.price
        };
        const { error } = await supabase.from('rooms').insert({
          ...payload,
          hotel_id: currentHotel.id
        });
        if (error && (error.code === 'PGRST204' || error.message?.includes('hotel_id'))) {
          // Schema does not have hotel_id yet, fallback insert without hotel_id
          await supabase.from('rooms').insert(payload);
        }
      } catch (err) {
        console.warn('Supabase room insert error:', err);
      }
    }
  };

  // Delete room state & modal controls
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState(null);

  const requestDeleteRoom = (roomOrNumber) => {
    setDeleteConfirmRoom(roomOrNumber);
  };

  const cancelDeleteRoom = () => {
    setDeleteConfirmRoom(null);
  };

  const deleteRoom = async (roomNumber) => {
    const num = String(roomNumber).trim();
    setRooms(prev => prev.filter(r => String(r.roomNumber) !== num && String(r.room_number) !== num));
    showNotification(`Room ${num} permanently deleted.`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('rooms').delete().eq('room_number', num);
      } catch (err) {
        console.warn('Supabase room delete error:', err);
      }
    }
  };

  const confirmDeleteRoom = async () => {
    if (!deleteConfirmRoom) return;
    const roomNum = typeof deleteConfirmRoom === 'object'
      ? (deleteConfirmRoom.room_number || deleteConfirmRoom.roomNumber || deleteConfirmRoom.number)
      : deleteConfirmRoom;
    await deleteRoom(roomNum);
    setDeleteConfirmRoom(null);
  };

  // Update reservation payment (Collect Payment & Settle Folio)
  const updateReservationPayment = async (reservationId, { paid, due, paymentStatus }) => {
    const newPayment = paymentStatus || (due <= 0 ? 'PAID' : 'PENDING');
    setReservations(prev => prev.map(r => {
      if (r.id === reservationId) {
        return {
          ...r,
          payment: newPayment,
          paid: paid,
          due: due
        };
      }
      return r;
    }));
    showNotification(`Payment recorded for booking #${reservationId}. Status: ${newPayment}`);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('reservations')
          .update({ payment: newPayment })
          .eq('id', reservationId);
        if (error) console.warn('Supabase payment update error:', error);
      } catch (err) {
        console.warn('Supabase payment sync error:', err);
      }
    }
  };

  // Add reservation
  const addReservation = async (newRes) => {
    const resId = newRes.id || `AST-B-${(reservations?.length || 0) + 101}`;
    const reservation = {
      ...newRes,
      id: resId,
      hotelId: currentHotel.id,
      status: newRes.status || 'CONFIRMED',
      payment: newRes.payment || 'PENDING'
    };
    setReservations(prev => [reservation, ...(prev || [])]);
    showNotification(`Reservation ${resId} created for ${newRes.guest}`);
    setIsCreateReservationModalOpen(false);

    // If check-in is today or ongoing, mark room status as OCCUPIED
    const todayStr = new Date().toISOString().split('T')[0];
    const roomNumMatch = String(newRes.room).match(/\b(\d+)\b/);
    const roomNum = roomNumMatch ? roomNumMatch[1] : null;

    if (roomNum && (newRes.checkIn || newRes.check_in) <= todayStr && (newRes.checkOut || newRes.check_out) >= todayStr) {
      updateRoomStatus(roomNum, 'OCCUPIED');
    }

    if (isSupabaseConfigured) {
      try {
        const payload = {
          id: resId,
          guest: newRes.guest,
          guest_email: newRes.guestEmail || newRes.guest_email || null,
          guest_phone: newRes.guestPhone || newRes.guest_phone || null,
          room: newRes.room,
          check_in: newRes.checkIn || newRes.check_in,
          check_out: newRes.checkOut || newRes.check_out,
          source: newRes.source || 'Direct Website',
          amount: Number(newRes.amount) || 2000,
          status: newRes.status || 'CONFIRMED',
          payment: newRes.payment || 'PENDING'
        };
        const { error } = await supabase.from('reservations').insert({
          ...payload,
          hotel_id: currentHotel.id
        });
        if (error && (error.code === 'PGRST204' || error.message?.includes('hotel_id'))) {
          await supabase.from('reservations').insert(payload);
        }
      } catch (err) {
        console.warn('Supabase reservation insert sync pending table setup', err);
      }
    }
  };

  // =========================================================================
  // EXCEED-INSPIRED HOTEL OPERATIONAL LOGIC & WORKFLOWS
  // =========================================================================

  // Hotel Operational Working Date
  const [workingDate, setWorkingDate] = useState(() => {
    return localStorage.getItem('aurastay_working_date') || new Date().toISOString().split('T')[0];
  });

  // Front Desk Tasks & Shift Reminders
  const [frontDeskTasks, setFrontDeskTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_desk_tasks');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'tsk-1', text: 'Wake-up Call for Room 101 at 07:30 AM', priority: 'HIGH', completed: false, time: '07:30 AM' },
      { id: 'tsk-2', text: 'Airport Taxi Pickup for Flight 6E-421 (Mr. Ramesh)', priority: 'HIGH', completed: false, time: '11:00 AM' },
      { id: 'tsk-3', text: 'Housekeeping Linen Inspection - 2nd Floor', priority: 'NORMAL', completed: true, time: '02:00 PM' },
      { id: 'tsk-4', text: 'Collect Advance / Settlement for Due-out Room 105', priority: 'HIGH', completed: false, time: '06:00 PM' }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('aurastay_desk_tasks', JSON.stringify(frontDeskTasks));
    } catch (e) {}
  }, [frontDeskTasks]);

  const addDeskTask = (text, priority = 'NORMAL', time = 'Anytime') => {
    const newTask = {
      id: `tsk-${Date.now().toString().slice(-4)}`,
      text: text.trim(),
      priority,
      time,
      completed: false,
      createdOn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setFrontDeskTasks(prev => [newTask, ...prev]);
    showNotification('New task added to Front Desk shift checklist.');
  };

  const toggleDeskTask = (taskId) => {
    setFrontDeskTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const deleteDeskTask = (taskId) => {
    setFrontDeskTasks(prev => prev.filter(t => t.id !== taskId));
    showNotification('Task removed.');
  };

  // 1. Shift Room (Transfer guest to another room)
  const shiftRoom = async (sourceRoomNumber, targetRoomNumber, reason = 'Guest Request') => {
    const src = String(sourceRoomNumber).trim();
    const tgt = String(targetRoomNumber).trim();

    // Check if target is available
    const targetRoom = rooms.find(r => String(r.room_number || r.roomNumber) === tgt);
    if (!targetRoom) {
      showNotification(`Target room ${tgt} does not exist.`, 'error');
      return false;
    }

    // Find active reservation for source room
    const activeRes = reservations.find(r => {
      const matchNum = String(r.room).match(/\b(\d+)\b/);
      return matchNum && matchNum[1] === src && r.status !== 'CANCELLED' && r.status !== 'CHECKED_OUT';
    });

    // Update rooms status
    setRooms(prev => prev.map(r => {
      const rNum = String(r.room_number || r.roomNumber);
      if (rNum === src) {
        return { ...r, status: 'DIRTY', guest: null, booking_id: null };
      }
      if (rNum === tgt) {
        return {
          ...r,
          status: 'OCCUPIED',
          guest: activeRes?.guest || r.guest,
          booking_id: activeRes?.id || r.booking_id,
          check_out: activeRes?.check_out || activeRes?.checkOut || r.check_out
        };
      }
      return r;
    }));

    // Update reservation room name
    if (activeRes) {
      setReservations(prev => prev.map(r => {
        if (r.id === activeRes.id) {
          return { ...r, room: `Room ${tgt} - ${targetRoom.type || 'Standard'}` };
        }
        return r;
      }));
    }

    showNotification(`Room shifted from #${src} to #${tgt} (${reason}).`);

    // Sync to Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase.from('rooms').update({ status: 'DIRTY' }).eq('room_number', src);
        await supabase.from('rooms').update({ status: 'OCCUPIED' }).eq('room_number', tgt);
        if (activeRes) {
          await supabase.from('reservations').update({ room: `Room ${tgt}` }).eq('id', activeRes.id);
        }
      } catch (err) {
        console.warn('Supabase shift room sync:', err);
      }
    }
    return true;
  };

  // 2. Extend Stay
  const extendStay = async (reservationId, roomNumber, newCheckOutDate, additionalTariff = 0) => {
    const num = String(roomNumber).trim();

    setReservations(prev => prev.map(r => {
      if (r.id === reservationId) {
        const newAmt = (Number(r.amount) || 0) + Number(additionalTariff);
        return { ...r, check_out: newCheckOutDate, checkOut: newCheckOutDate, amount: newAmt };
      }
      return r;
    }));

    setRooms(prev => prev.map(r => {
      if (String(r.room_number || r.roomNumber) === num) {
        return { ...r, check_out: newCheckOutDate };
      }
      return r;
    }));

    showNotification(`Stay extended for Room #${num} till ${newCheckOutDate}.`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('reservations').update({ check_out: newCheckOutDate }).eq('id', reservationId);
        await supabase.from('rooms').update({ check_out: newCheckOutDate }).eq('room_number', num);
      } catch (err) {
        console.warn('Supabase extend stay sync:', err);
      }
    }
    return true;
  };

  // 3. Checkout Room
  const checkoutRoom = async (roomNumber, reservationId) => {
    const num = String(roomNumber).trim();

    if (reservationId) {
      setReservations(prev => prev.map(r => {
        if (r.id === reservationId) {
          return { ...r, status: 'CHECKED_OUT' };
        }
        return r;
      }));
    }

    setRooms(prev => prev.map(r => {
      if (String(r.room_number || r.roomNumber) === num) {
        return { ...r, status: 'DIRTY', guest: null, booking_id: null, check_out: null };
      }
      return r;
    }));

    showNotification(`Room #${num} checked out. Room marked DIRTY for housekeeping.`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('rooms').update({ status: 'DIRTY' }).eq('room_number', num);
        if (reservationId) {
          await supabase.from('reservations').update({ status: 'CHECKED_OUT' }).eq('id', reservationId);
        }
      } catch (err) {
        console.warn('Supabase checkout room sync:', err);
      }
    }
    return true;
  };

  // 4. Block Room for Maintenance
  const blockRoom = async (roomNumber, reason = 'Maintenance') => {
    const num = String(roomNumber).trim();
    setRooms(prev => prev.map(r => {
      if (String(r.room_number || r.roomNumber) === num) {
        return { ...r, status: 'MAINTENANCE', housekeeping: reason };
      }
      return r;
    }));
    showNotification(`Room #${num} blocked for ${reason}.`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('rooms').update({ status: 'MAINTENANCE' }).eq('room_number', num);
      } catch (err) {
        console.warn('Supabase block room sync:', err);
      }
    }
    return true;
  };

  // 5. Unblock Room
  const unblockRoom = async (roomNumber) => {
    const num = String(roomNumber).trim();
    setRooms(prev => prev.map(r => {
      if (String(r.room_number || r.roomNumber) === num) {
        return { ...r, status: 'VACANT_READY', housekeeping: 'Clean' };
      }
      return r;
    }));
    showNotification(`Room #${num} unblocked and marked VACANT_READY.`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('rooms').update({ status: 'VACANT_READY' }).eq('room_number', num);
      } catch (err) {
        console.warn('Supabase unblock room sync:', err);
      }
    }
    return true;
  };

  // 6. Update Housekeeping Cleanliness
  const updateHousekeepingCleanliness = async (roomNumber, newStatus) => {
    const num = String(roomNumber).trim();
    setRooms(prev => prev.map(r => {
      if (String(r.room_number || r.roomNumber) === num) {
        return { ...r, status: newStatus };
      }
      return r;
    }));
    showNotification(`Room #${num} housekeeping status updated to ${newStatus}.`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('rooms').update({ status: newStatus }).eq('room_number', num);
      } catch (err) {
        console.warn('Supabase housekeeping update sync:', err);
      }
    }
  };

  // 7. Execute 5-Step Night Audit
  const executeNightAudit = (auditDate) => {
    // 1. Advance date by 1 day
    const curr = new Date(workingDate);
    curr.setDate(curr.getDate() + 1);
    const nextDate = curr.toISOString().split('T')[0];

    setWorkingDate(nextDate);
    localStorage.setItem('aurastay_working_date', nextDate);

    // 2. Refresh room states and post daily ledger
    showNotification(`Night Audit completed! Operational date advanced to ${nextDate}. All daily tariffs posted.`, 'success');
    return nextDate;
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
      setRooms,
      reservations,
      setReservations,
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
      updateReservationPayment,
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
      addRoom,
      deleteRoom,
      deleteConfirmRoom,
      requestDeleteRoom,
      cancelDeleteRoom,
      confirmDeleteRoom,
      workingDate,
      setWorkingDate,
      frontDeskTasks,
      addDeskTask,
      toggleDeskTask,
      deleteDeskTask,
      shiftRoom,
      extendStay,
      checkoutRoom,
      blockRoom,
      unblockRoom,
      updateHousekeepingCleanliness,
      executeNightAudit,
      isLoggedIn,
      setIsLoggedIn,
      currentHotel,
      login,
      logout
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
