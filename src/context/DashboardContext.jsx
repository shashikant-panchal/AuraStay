import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import aavasaLogo from '../assets/aavasa-logo.jpg';
import { initialMockData } from '../data/mockData';
import { mockRooms, mockReservations, mockFnbOrders, mockStaffUsers, mockOtaChannels } from '../data/suiteData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { broadcastCrossDeviceSync, fetchLiveStateViaEdgeFunction } from '../services/aiosellService';

const DEFAULT_HOTEL = {
  id: '',
  slug: '',
  name: 'AuraStay Property',
  shortName: 'AST',
  logoUrl: aavasaLogo || './aavasa-logo.jpg',
  ownerName: 'Property Admin',
  ownerRole: 'Property Admin',
  email: '',
  password: '',
  mobile: '',
  address: 'India',
  city: 'Bengaluru',
  totalRooms: 0,
  currency: 'INR',
  currencySymbol: '₹'
};

function belongsToCurrentHotel(recordHotelId, activeHotel) {
  const curId = String(activeHotel?.id || '').trim().toLowerCase();
  const curSlug = String(activeHotel?.slug || '').trim().toLowerCase();
  if (!curId && !curSlug) return false;
  if (!recordHotelId) return false;
  const recId = String(recordHotelId).trim().toLowerCase();
  if (curId && recId === curId) return true;
  if (curSlug && recId === curSlug) return true;
  return false;
}

const DashboardContext = createContext(null);

const VALID_VIEWS = new Set([
  'dashboard',
  'master-service-home',
  'revenue-dashboard',
  'front-office',
  'stay-view-calendar',
  'banquet-events',
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
  'cab-booking',
  'account-finance',
  'staff-admin',
  'hr-payroll'
]);

// Room Categories Master (Empty by default for fresh creation)
const defaultMockRoomTypes = [];

export function DashboardProvider({ children }) {
  // Multi-tenant Hotel Authentication State (Persisted across page refreshes until explicit logout)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      const authFlag = localStorage.getItem('aavasa_admin_auth_v3') === 'true';
      const savedSession = JSON.parse(localStorage.getItem('aavasa_admin_session_v3') || 'null');
      return Boolean(authFlag && savedSession && (savedSession.id || savedSession.email));
    } catch (e) {
      return false;
    }
  });

  const [currentHotel, setCurrentHotel] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('aavasa_admin_session_v3') || 'null');
      if (saved && (saved.id || saved.email)) return saved;
    } catch (e) { }
    return DEFAULT_HOTEL;
  });

  // Persist Admin session in localStorage so page refresh never logs out the Admin
  useEffect(() => {
    try {
      if (isLoggedIn && currentHotel && (currentHotel.id || currentHotel.email)) {
        localStorage.setItem('aavasa_admin_auth_v3', 'true');
        localStorage.setItem('aavasa_admin_session_v3', JSON.stringify(currentHotel));
      }
    } catch (e) { }
  }, [isLoggedIn, currentHotel]);

  // Static mock fallbacks for initial render (never dumped to localStorage)
  const [data, setData] = useState(initialMockData);

  // Clean up legacy localStorage keys and old admin sessions on startup
  useEffect(() => {
    const legacyKeys = [
      'aurastay_hotel_auth',
      'aurastay_hotel_session',
      'aurastay_hotel_auth_v2',
      'aurastay_hotel_session_v2',
      'aurastay_suite_data',
      'aurastay_room_types',
      'aavasa_cab_bookings',
      'aurastay_folios_v2',
      'aurastay_inventory_items_v2',
      'aurastay_purchase_orders_v2',
      'aurastay_dept_requisitions_v2',
      'aurastay_custom_invoices_v2',
      'aurastay_hotel_expenses_v2',
      'aurastay_housekeepers_v2',
      'aurastay_hk_tasks_v2',
      'aurastay_lost_found_v2',
      'aurastay_banquet_venues_v2',
      'aurastay_banquet_menus_v2',
      'aurastay_desk_tasks'
    ];
    legacyKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) { }
    });
  }, []);

  // Current view: restore from URL hash or localStorage preference, fallback to 'dashboard'
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

  // Rooms & Operations state - driven by Supabase Backend Database
  const [roomTypes, setRoomTypes] = useState([]);
  const [isCreateRoomTypeModalOpen, setIsCreateRoomTypeModalOpen] = useState(false);

  const [rooms, setRooms] = useState(mockRooms);
  const [reservations, setReservations] = useState(mockReservations);
  const [fnbOrders, setFnbOrders] = useState(mockFnbOrders);
  const [staffUsers, setStaffUsers] = useState(mockStaffUsers);
  const [otaChannels, setOtaChannels] = useState(mockOtaChannels);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Cab Bookings & Travel Desk State - driven by Supabase
  const [cabBookings, setCabBookings] = useState([]);

  // Folios State - driven by Supabase financial_invoices
  const [folios, setFolios] = useState({});

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

  // 1. Fetch live data from Supabase & Edge Function (reusable across startup, realtime broadcast, and silent sync)
  const loadSupabaseData = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    try {
      const [
        hotelsRes,
        roomsRes,
        resRes,
        fnbRes,
        staffRes,
        chanRes,
        roomTypesRes,
        cabsRes,
        invoicesRes,
        edgeState
      ] = await Promise.all([
        supabase.from('hotels').select('*'),
        supabase.from('rooms').select('*').order('room_number'),
        supabase.from('reservations').select('*').order('created_at', { ascending: false }),
        supabase.from('fnb_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('staff_users').select('*').order('id'),
        supabase.from('ota_channels').select('*').order('id'),
        supabase.from('room_types').select('*').order('name'),
        supabase.from('cab_bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('financial_invoices').select('*').order('created_at', { ascending: false }),
        fetchLiveStateViaEdgeFunction(currentHotel?.id).catch(() => null)
      ]);

      const allHotels = Array.isArray(hotelsRes?.data)
        ? hotelsRes.data.filter(
            h =>
              String(h.id || '').toLowerCase() !== 'hotel_aurastay_01' &&
              String(h.email || '').toLowerCase() !== 'admin@aurastay.com'
          )
        : [];
      const totalHotelsCount = allHotels.length;
      const activeHotelIds = new Set(
        [
          ...allHotels.flatMap(h => [
            String(h.id || '').trim().toLowerCase(),
            String(h.slug || '').trim().toLowerCase()
          ]),
          isLoggedIn ? String(currentHotel?.id || '').trim().toLowerCase() : '',
          isLoggedIn ? String(currentHotel?.slug || '').trim().toLowerCase() : ''
        ].filter(Boolean)
      );

      // Purge any orphaned rooms, room_types, or reservations created under previous/deleted logins
      if (!hotelsRes?.error && activeHotelIds.size > 0) {
        if (Array.isArray(roomsRes?.data)) {
          for (const rm of roomsRes.data) {
            if (!rm.hotel_id || !activeHotelIds.has(String(rm.hotel_id).trim().toLowerCase())) {
              if (rm.id) {
                await supabase.from('rooms').delete().eq('id', rm.id);
              } else if (rm.room_number) {
                await supabase.from('rooms').delete().eq('room_number', rm.room_number);
              }
            }
          }
        }
        if (Array.isArray(roomTypesRes?.data)) {
          for (const rt of roomTypesRes.data) {
            if (!rt.hotel_id || !activeHotelIds.has(String(rt.hotel_id).trim().toLowerCase())) {
              if (rt.id) await supabase.from('room_types').delete().eq('id', rt.id);
            }
          }
        }
        if (Array.isArray(resRes?.data)) {
          for (const rs of resRes.data) {
            if (!rs.hotel_id || !activeHotelIds.has(String(rs.hotel_id).trim().toLowerCase())) {
              if (rs.id) await supabase.from('reservations').delete().eq('id', rs.id);
            }
          }
        }
      }

      // Sync latest hotel metadata from SuperAdmin 'hotels' table while keeping Admin session active across refreshes
      if (isLoggedIn && !hotelsRes?.error && allHotels.length > 0) {
        const curId = String(currentHotel?.id || '').trim().toLowerCase();
        const curEmail = String(currentHotel?.email || '').trim().toLowerCase();
        const matchedHotel = allHotels.find(h => {
          const hId = String(h.id || '').trim().toLowerCase();
          const hSlug = String(h.slug || '').trim().toLowerCase();
          const hEmail = String(h.email || '').trim().toLowerCase();
          return (curId && (hId === curId || hSlug === curId)) || (curEmail && hEmail === curEmail);
        });

        if (matchedHotel) {
          const syncedHotel = {
            ...currentHotel,
            id: matchedHotel.id,
            slug: matchedHotel.slug || matchedHotel.id,
            name: matchedHotel.name || currentHotel.name,
            shortName: matchedHotel.short_name || currentHotel.shortName || 'HTL',
            logoUrl: matchedHotel.logo_url || currentHotel.logoUrl,
            ownerName: matchedHotel.owner_name || currentHotel.ownerName || 'Hotel Admin',
            email: matchedHotel.email || currentHotel.email,
            password: matchedHotel.password || currentHotel.password,
            mobile: matchedHotel.mobile || currentHotel.mobile || '',
            address: matchedHotel.address || currentHotel.address || 'India',
            city: matchedHotel.city || currentHotel.city || 'Bengaluru',
            totalRooms:
              matchedHotel.total_rooms !== undefined && matchedHotel.total_rooms !== null
                ? Number(matchedHotel.total_rooms)
                : (Number(currentHotel.totalRooms) || 0)
          };
          if (
            syncedHotel.name !== currentHotel.name ||
            syncedHotel.ownerName !== currentHotel.ownerName ||
            syncedHotel.mobile !== currentHotel.mobile ||
            syncedHotel.address !== currentHotel.address ||
            syncedHotel.city !== currentHotel.city ||
            syncedHotel.totalRooms !== currentHotel.totalRooms
          ) {
            setCurrentHotel(syncedHotel);
            try {
              localStorage.setItem('aavasa_admin_session_v3', JSON.stringify(syncedHotel));
            } catch (e) { }
          }
        }
      }

      let tablesFound = false;

      const sourceRooms = Array.isArray(roomsRes?.data)
        ? roomsRes.data
        : (Array.isArray(edgeState?.rooms) ? edgeState.rooms : null);

      if (sourceRooms !== null) {
        const hotelRooms = sourceRooms.filter(r => belongsToCurrentHotel(r.hotel_id, currentHotel, totalHotelsCount));
        setRooms(hotelRooms.map(r => ({
          id: r.id,
          hotelId: r.hotel_id || currentHotel?.id,
          roomNumber: r.room_number,
          room_number: r.room_number,
          floor: r.floor,
          type: r.type,
          category: r.type,
          bed: r.bed,
          status: r.status,
          price: Number(r.price) || 0,
          guest: r.guest,
          bookingId: r.booking_id,
          booking_id: r.booking_id,
          checkOut: r.check_out,
          check_out: r.check_out,
          housekeeping: r.housekeeping || (r.status === 'DIRTY' ? 'Dirty' : 'Clean'),
          keyCardNo: r.key_card_no,
          isSmoking: !!r.is_smoking,
          phoneExtension: r.phone_extension
        })));
        tablesFound = true;
      }

      const sourceReservations = Array.isArray(resRes?.data)
        ? resRes.data
        : (Array.isArray(edgeState?.reservations) ? edgeState.reservations : null);

      if (sourceReservations !== null) {
        const hotelRes = sourceReservations.filter(r => belongsToCurrentHotel(r.hotel_id, currentHotel, totalHotelsCount));
        setReservations(hotelRes.map(r => ({
          id: r.id,
          hotelId: r.hotel_id || currentHotel?.id,
          guest: r.guest,
          guestEmail: r.guest_email || '',
          guest_email: r.guest_email || '',
          guestPhone: r.guest_phone || '',
          guest_phone: r.guest_phone || '',
          room: r.room,
          room_number: r.room_number || (String(r.room || '').match(/\b(\d+)\b/)?.[1] || ''),
          room_type: r.room_type || '',
          checkIn: r.check_in,
          check_in: r.check_in,
          checkOut: r.check_out,
          check_out: r.check_out,
          source: r.source || 'Direct',
          amount: Number(r.amount) || 0,
          paid: Number(r.paid) || (r.payment === 'PAID' ? Number(r.amount) || 0 : 0),
          paymentMode: r.payment_mode || 'UPI',
          payment_mode: r.payment_mode || 'UPI',
          status: r.status || 'CONFIRMED',
          payment: r.payment || 'PENDING',
          createdAt: r.created_at,
          created_at: r.created_at,
          ratePlan: r.rate_plan || 'EP - Room Only',
          rate_plan: r.rate_plan || 'EP - Room Only',
          adults: Number(r.adults) || 2,
          children: Number(r.children) || 0,
          notes: r.notes || ''
        })));
        tablesFound = true;
      }

      if (Array.isArray(fnbRes?.data)) {
        const hotelFnb = fnbRes.data.filter(o => belongsToCurrentHotel(o.hotel_id, currentHotel, totalHotelsCount));
        setFnbOrders(hotelFnb.map(o => ({
          orderId: o.id,
          roomTable: o.room_table,
          guest: o.guest,
          items: o.items,
          total: Number(o.total) || 0,
          status: o.status,
          time: o.time
        })));
      }

      if (Array.isArray(staffRes?.data)) {
        setStaffUsers(staffRes.data);
      }

      if (Array.isArray(chanRes?.data) && chanRes.data.length > 0) {
        setOtaChannels(chanRes.data.map(c => ({
          name: c.name,
          status: c.status,
          syncStatus: c.sync_status,
          mappedRooms: c.mapped_rooms,
          activeBookings: c.active_bookings,
          commission: c.commission
        })));
      }

      if (Array.isArray(roomTypesRes?.data)) {
        const hotelRt = roomTypesRes.data.filter(t => belongsToCurrentHotel(t.hotel_id, currentHotel, totalHotelsCount));
        setRoomTypes(hotelRt.map(t => ({
          id: t.id,
          hotelId: t.hotel_id || currentHotel?.id,
          name: t.name,
          label: t.label || 'Room',
          beddingType: t.bedding_type || 'King Bed',
          maxAdults: Number(t.max_adults) || 2,
          maxExtra: Number(t.max_extra) || 1,
          maxChildren: Number(t.max_children) || 1,
          areaSqft: Number(t.area_sqft) || 350,
          basePrice: Number(t.base_price) || 2500,
          extraBedPrice: Number(t.extra_bed_price) || 800,
          childPrice: Number(t.child_price) || 400,
          amenities: t.amenities || ['Free High-Speed Wi-Fi', 'Air conditioning'],
          description: t.description || '',
          notes: t.notes || '',
          isBookingEngine: t.is_booking_engine !== false
        })));
      }

      if (Array.isArray(cabsRes?.data)) {
        const hotelCabs = cabsRes.data.filter(c => belongsToCurrentHotel(c.hotel_id, currentHotel, totalHotelsCount));
        setCabBookings(hotelCabs.map(c => ({
          id: c.id,
          hotelId: c.hotel_id || currentHotel?.id,
          guestName: c.guest_name,
          roomNumber: c.room_number,
          phone: c.phone,
          pickupLocation: c.pickup_location,
          dropLocation: c.drop_location,
          pickupTime: c.pickup_time,
          cabType: c.cab_type,
          driverName: c.driver_name,
          driverPhone: c.driver_phone,
          vehicleNumber: c.vehicle_number,
          fare: Number(c.fare) || 0,
          paymentStatus: c.payment_status,
          bookingStatus: c.booking_status,
          notes: c.notes,
          createdAt: c.created_at
        })));
      }

      if (Array.isArray(invoicesRes?.data)) {
        const hotelInvoices = invoicesRes.data.filter(inv => belongsToCurrentHotel(inv.hotel_id, currentHotel, totalHotelsCount));
        const folioMap = {};
        hotelInvoices.forEach(inv => {
          const resId = inv.reservation_id || inv.id?.replace(/^FOL-/, '');
          if (resId) {
            let parsedNotes = {};
            try {
              parsedNotes = JSON.parse(inv.notes || '{}');
            } catch (e) { }
            folioMap[resId] = {
              reservationId: resId,
              roomNumber: inv.room_number,
              guestName: inv.client_name,
              phone: inv.client_phone,
              subtotal: Number(inv.subtotal || 0),
              grandTotal: Number(inv.total_amount || 0),
              totalPaid: Number(inv.paid_amount || 0),
              balanceDue: Math.max(0, Number(inv.total_amount || 0) - Number(inv.paid_amount || 0)),
              folioItems: parsedNotes.folioItems || [],
              paymentEntries: parsedNotes.paymentEntries || [],
              discountPercent: parsedNotes.discountPercent || 0
            };
          }
        });
        setFolios(folioMap);
      }

      if (tablesFound) {
        setIsLiveConnected(true);
      }
    } catch (err) {
      console.info('Supabase database initializing...', err);
    }
  }, [currentHotel, isLoggedIn]);

  useEffect(() => {
    loadSupabaseData();
    const pollTimer = setInterval(() => {
      loadSupabaseData();
    }, 4000);
    return () => clearInterval(pollTimer);
  }, [loadSupabaseData]);

  // 2. Realtime WebSocket & Cross-Device Webhook Broadcast Subscription
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase.channel(`aurastay-realtime-${currentHotel?.id || 'global'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hotels' }, () => {
        loadSupabaseData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        loadSupabaseData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, payload => {
        loadSupabaseData();
        if (payload.eventType === 'INSERT' && payload.new) {
          showNotification(`🎉 New Booking #${payload.new.id} received for ${payload.new.guest || 'Guest'} (${payload.new.room || 'Room'})!`);
        } else if (payload.eventType === 'UPDATE' && payload.new && payload.new.status === 'CANCELLED') {
          showNotification(`⚠️ Reservation #${payload.new.id} for ${payload.new.guest || 'Guest'} has been CANCELLED. Room released to Vacant.`);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fnb_orders' }, () => {
        loadSupabaseData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_types' }, () => {
        loadSupabaseData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cab_bookings' }, () => {
        loadSupabaseData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_invoices' }, () => {
        loadSupabaseData();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLiveConnected(true);
        }
      });

    const broadcastChannel = supabase.channel('aurastay_sync_broadcast')
      .on('broadcast', { event: 'webhook_update' }, (msg) => {
        loadSupabaseData();
        const data = msg?.payload;
        if (data?.bookingId && data?.action === 'book') {
          showNotification(`⚡ Real-Time Sync: Booking #${data.bookingId} (${data.guestName || 'Guest'}) updated across all devices!`);
        } else if (data?.bookingId && data?.action === 'cancel') {
          showNotification(`⚡ Real-Time Sync: Booking #${data.bookingId} cancelled across all devices!`);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [currentHotel?.id, loadSupabaseData]);

  // Hotel Admin Authentication functions - Strictly SuperAdmin-Provisioned Credentials Only
  const login = async (email, password) => {
    const inputIdent = String(email || '').trim().toLowerCase();
    const inputPass = String(password || '').trim();

    if (!inputIdent || !inputPass) {
      return { success: false, message: 'Please enter both Admin Email/Username and Password.' };
    }

    if (inputIdent.length < 3 || inputPass.length < 4) {
      return { success: false, message: 'Invalid credential format. Please enter the exact credentials created in Super Admin.' };
    }

    if (inputIdent === 'superadmin@aavasa.com' || inputIdent === 'superadmin@aurastay.com') {
      return {
        success: false,
        message: 'Super Admin credentials cannot sign in here. Please log in to Aavasa Super Admin and create a Hotel Admin credential first.'
      };
    }

    if (inputIdent === 'admin@aurastay.com' || inputIdent === 'hotel_aurastay_01') {
      return {
        success: false,
        message: 'Default credentials have been removed. Please use an Admin credential created in Aavasa Super Admin.'
      };
    }

    if (!isSupabaseConfigured) {
      return { success: false, message: 'Database connection is not configured.' };
    }

    try {
      const { data: allHotels, error } = await supabase
        .from('hotels')
        .select('*');

      if (error || !Array.isArray(allHotels)) {
        return { success: false, message: 'Unable to verify credentials with Supabase. Please try again.' };
      }

      const validHotels = allHotels.filter(
        h =>
          String(h.id || '').toLowerCase() !== 'hotel_aurastay_01' &&
          String(h.email || '').toLowerCase() !== 'admin@aurastay.com'
      );

      if (validHotels.length === 0) {
        return {
          success: false,
          message: 'No Hotel Admin credentials exist yet. Log in to Aavasa Super Admin (superadmin@aavasa.com) and create Admin credentials first.'
        };
      }

      const hotelData = validHotels.find(h => {
        const hEmail = String(h.email || '').trim().toLowerCase();
        const hSlug = String(h.slug || '').trim().toLowerCase();
        const hId = String(h.id || '').trim().toLowerCase();
        return hEmail === inputIdent || hSlug === inputIdent || hId === inputIdent;
      });

      if (!hotelData) {
        return {
          success: false,
          message: 'Admin credential not found. Only credentials created in Aavasa Super Admin are allowed to sign in.'
        };
      }

      if (hotelData.status && hotelData.status !== 'ACTIVE') {
        return {
          success: false,
          message: 'This Admin credential has been SUSPENDED by Super Admin. Please activate it in Aavasa Super Admin.'
        };
      }

      // Strictly verify exact password provisioned by SuperAdmin in Supabase
      if (!hotelData.password || hotelData.password !== inputPass) {
        return {
          success: false,
          message: 'Incorrect password. Please enter the exact password created in Aavasa Super Admin.'
        };
      }

      const hotel = {
        id: hotelData.id,
        slug: hotelData.slug || hotelData.id,
        name: hotelData.name,
        shortName: hotelData.short_name || 'HTL',
        logoUrl: hotelData.logo_url || DEFAULT_HOTEL.logoUrl,
        ownerName: hotelData.owner_name || 'Hotel Admin',
        ownerRole: 'Property Admin',
        email: hotelData.email,
        password: hotelData.password,
        mobile: hotelData.mobile || '',
        address: hotelData.address || 'India',
        city: hotelData.city || 'Bengaluru',
        totalRooms: Number(hotelData.total_rooms) || 0,
        currency: hotelData.currency || 'INR',
        currencySymbol: hotelData.currency_symbol || '₹'
      };
      setCurrentHotel(hotel);
      setIsLoggedIn(true);
      localStorage.setItem('aavasa_admin_auth_v3', 'true');
      localStorage.setItem('aavasa_admin_session_v3', JSON.stringify(hotel));
      showNotification(`Welcome to ${hotel.name} PMS Portal!`);
      return { success: true, hotel };
    } catch (e) {
      console.warn('Supabase hotel login query error:', e);
      return { success: false, message: 'Authentication error. Please try again.' };
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentHotel(DEFAULT_HOTEL);
    localStorage.removeItem('aavasa_admin_auth_v3');
    localStorage.removeItem('aavasa_admin_session_v3');
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
      await loadSupabaseData();
    } catch (err) {
      console.warn('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
      showNotification('Live Supabase inventory & reservations synchronized.');
    }
  };

  const resetToDefaults = () => {
    setData(initialMockData);
    setRooms([]);
    setReservations([]);
    setFnbOrders([]);
    setRoomTypes([]);
    setCurrentView('dashboard');
    localStorage.removeItem('aurastay_suite_data');
    localStorage.removeItem('aurastay_current_view');
    localStorage.removeItem('aurastay_active_tab');
    localStorage.removeItem('aurastay_front_office_subtab');
    localStorage.removeItem('aurastay_room_types');
    try {
      window.location.hash = 'dashboard';
    } catch (e) { }
    showNotification('System reset to clean state. Ready for fresh creation.');
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
        await broadcastCrossDeviceSync({ action: 'room_status', roomNumber: cleanNum, status: newStatus });
      } catch (err) {
        console.warn('Supabase room update sync pending table setup', err);
      }
    }
  };

  // Room Categories (Exceed HMS Room Category Master) CRUD
  const addRoomType = async (newType) => {
    const typeObj = {
      ...newType,
      id: newType.id || `rt-${Date.now().toString().slice(-4)}`,
      hotelId: currentHotel.id
    };
    setRoomTypes(prev => [typeObj, ...(prev || []).filter(t => t.name.toLowerCase() !== typeObj.name.toLowerCase())]);
    showNotification(`Room Category ${typeObj.name} saved successfully.`);
    setIsCreateRoomTypeModalOpen(false);

    if (isSupabaseConfigured) {
      try {
        const payload = {
          id: typeObj.id,
          hotel_id: currentHotel.id,
          name: typeObj.name,
          label: typeObj.label || 'Room',
          bedding_type: typeObj.beddingType || 'King Bed',
          max_adults: Number(typeObj.maxAdults) || 2,
          max_extra: Number(typeObj.maxExtra) || 1,
          max_children: Number(typeObj.maxChildren) || 1,
          area_sqft: Number(typeObj.areaSqft) || 350,
          base_price: Number(typeObj.basePrice) || 2500,
          extra_bed_price: Number(typeObj.extraBedPrice) || 800,
          child_price: Number(typeObj.childPrice) || 400,
          amenities: typeObj.amenities || [],
          description: typeObj.description || '',
          notes: typeObj.notes || '',
          is_booking_engine: typeObj.isBookingEngine !== false
        };
        const { error } = await supabase.from('room_types').upsert(payload);
        if (error) console.info('Supabase room_types notice:', error.message);
        await broadcastCrossDeviceSync({ action: 'room_type_add', id: typeObj.id });
      } catch (err) {
        console.warn('Supabase room_types sync notice:', err);
      }
    }
  };

  const updateRoomType = async (id, updatedType) => {
    setRoomTypes(prev => (prev || []).map(t => t.id === id ? { ...t, ...updatedType } : t));
    showNotification('Room category updated.');
    if (isSupabaseConfigured) {
      try {
        await supabase.from('room_types').update(updatedType).eq('id', id);
        await broadcastCrossDeviceSync({ action: 'room_type_update', id });
      } catch (err) {
        console.warn('Supabase update room type error:', err);
      }
    }
  };

  const deleteRoomType = async (id) => {
    setRoomTypes(prev => (prev || []).filter(t => t.id !== id));
    showNotification('Room category removed.');
    if (isSupabaseConfigured) {
      try {
        await supabase.from('room_types').delete().eq('id', id);
        await broadcastCrossDeviceSync({ action: 'room_type_delete', id });
      } catch (err) {
        console.warn('Supabase delete room type error:', err);
      }
    }
  };

  // Add room (saved to Supabase & local state — strictly enforces SuperAdmin's assigned room limit)
  const addRoom = async (newRoom) => {
    const assignedLimit = Number(currentHotel?.totalRooms) || 0;
    if (assignedLimit <= 0 || rooms.length >= assignedLimit) {
      const limitMsg = `Your room creation limit (${assignedLimit} rooms) has reached, contact SuperAdmin.`;
      showNotification(limitMsg);
      return {
        success: false,
        limitReached: true,
        message: limitMsg
      };
    }

    const cleanNum = String(newRoom.roomNumber).trim();
    const room = {
      hotelId: currentHotel.id,
      roomNumber: cleanNum,
      room_number: cleanNum,
      roomTypeId: newRoom.roomTypeId || null,
      floor: newRoom.floor || 'Floor 1',
      type: newRoom.type || 'Deluxe Room',
      category: newRoom.type || 'Deluxe Room',
      bed: newRoom.bed || 'King Bed',
      status: newRoom.status || (newRoom.housekeeping === 'Dirty' ? 'DIRTY' : 'VACANT_READY'),
      housekeeping: newRoom.housekeeping || 'Clean',
      price: Number(newRoom.price) || 2500,
      keyCardNo: newRoom.keyCardNo || `CARD-${cleanNum}`,
      isSmoking: !!newRoom.isSmoking,
      phoneExtension: newRoom.phoneExtension || cleanNum,
      guest: null,
      bookingId: null,
      checkOut: null
    };

    setRooms(prev => [room, ...prev.filter(r => String(r.roomNumber || r.room_number) !== cleanNum)]);
    showNotification(`Room #${cleanNum} created successfully.`);
    setIsCreateRoomModalOpen(false);

    if (isSupabaseConfigured) {
      try {
        const payload = {
          room_number: room.roomNumber,
          floor: room.floor,
          type: room.type,
          bed: room.bed,
          status: room.status,
          price: room.price,
          housekeeping: room.housekeeping,
          key_card_no: room.keyCardNo,
          is_smoking: room.isSmoking,
          phone_extension: room.phoneExtension
        };
        const { error } = await supabase.from('rooms').insert({
          ...payload,
          hotel_id: currentHotel.id
        });
        if (error && (error.code === 'PGRST204' || error.message?.includes('hotel_id'))) {
          await supabase.from('rooms').insert(payload);
        }
        await broadcastCrossDeviceSync({ action: 'room_add', roomNumber: cleanNum });
      } catch (err) {
        console.warn('Supabase room insert error:', err);
      }
    }
    return { success: true, room };
  };

  // Room deletion is controlled exclusively by SuperAdmin
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState(null);

  const requestDeleteRoom = () => {
    showNotification('Room deletion is restricted to SuperAdmin. Please contact SuperAdmin.');
  };

  const cancelDeleteRoom = () => {
    setDeleteConfirmRoom(null);
  };

  const deleteRoom = async () => {
    showNotification('Room deletion is restricted to SuperAdmin. Please contact SuperAdmin.');
  };

  const confirmDeleteRoom = async () => {
    setDeleteConfirmRoom(null);
    showNotification('Room deletion is restricted to SuperAdmin. Please contact SuperAdmin.');
  };

  const addFnbOrder = async (order) => {
    setFnbOrders(prev => [order, ...prev]);

    // If billed to room, post charge directly to room folio
    const rMatch = String(order.roomTable || '').match(/\b(?:Room\s*)?(\d{2,4})\b/i);
    if (rMatch && order.paymentStatus === 'BILLED_TO_ROOM') {
      const cleanRoom = rMatch[1];
      addFolioCharge(cleanRoom, {
        category: 'F&B',
        description: `Restaurant Dining (${order.orderId}): ${order.items}`,
        amount: Number(order.total) || 0,
        rate: Number(order.total) || 0,
        qty: 1
      });
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('fnb_orders').insert({
          id: order.orderId,
          hotel_id: currentHotel.id,
          room_table: order.roomTable,
          guest: order.guest || 'Guest',
          items: order.items,
          total: order.total,
          status: order.status || 'PREPARING',
          time: order.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } catch (err) {
        console.warn('Supabase F&B insert error:', err);
      }
    }
  };

  const settleFnbOrder = async (orderId, paymentMode = 'UPI') => {
    setFnbOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: 'BILLED' } : o));
    if (isSupabaseConfigured) {
      try {
        await supabase.from('fnb_orders').update({ status: 'BILLED' }).eq('id', orderId);
      } catch (err) {
        console.warn('Supabase settle FNB order error:', err);
      }
    }
  };

  // Folio API: retrieve folio by reservation id or room number
  const getFolio = (key) => {
    if (!key) return null;
    const cleanKey = String(key).trim();
    const cleanNum = cleanKey.replace(/\D/g, '');
    return folios[cleanKey] || (cleanNum ? folios[cleanNum] : null) || null;
  };

  // Folio API: save/update folio and sync to Supabase financial_invoices
  const saveFolio = async (key, folioData) => {
    if (!key) return;
    const cleanKey = String(key).trim();
    const cleanNum = String(folioData.roomNumber || cleanKey).replace(/\D/g, '');
    const updated = {
      ...folioData,
      roomNumber: cleanNum || folioData.roomNumber,
      updatedAt: new Date().toISOString()
    };

    setFolios(prev => {
      const next = { ...prev, [cleanKey]: updated };
      if (cleanNum && cleanNum !== cleanKey) {
        next[cleanNum] = updated;
      }
      return next;
    });

    if (isSupabaseConfigured) {
      try {
        const invId = `FOL-${cleanKey}`;
        await supabase.from('financial_invoices').upsert({
          id: invId,
          hotel_id: currentHotel.id,
          reservation_id: folioData.reservationId || cleanKey,
          room_number: cleanNum,
          client_name: folioData.guestName || 'In-House Guest',
          client_phone: folioData.phone || '',
          category: 'Room Stay & Folio Ledger',
          subtotal: Number(folioData.subtotal || 0),
          cgst: Number(folioData.cgstAmount || Math.round(Number(folioData.subtotal || 0) * 0.06)),
          sgst: Number(folioData.sgstAmount || Math.round(Number(folioData.subtotal || 0) * 0.06)),
          total_amount: Number(folioData.grandTotal || 0),
          paid_amount: Number(folioData.totalPaid || 0),
          payment_mode: folioData.paymentEntries?.[folioData.paymentEntries.length - 1]?.mode || 'UPI',
          status: (Number(folioData.balanceDue || 0) <= 0 && Number(folioData.totalPaid || 0) > 0) ? 'SETTLED' : 'PENDING',
          notes: JSON.stringify({
            folioItems: folioData.folioItems || [],
            paymentEntries: folioData.paymentEntries || [],
            discountPercent: folioData.discountPercent || 0
          }),
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase saveFolio error:', err);
      }
    }
  };

  // Folio API: post itemized charge
  const addFolioCharge = async (key, chargeItem) => {
    if (!key) return;
    const cleanKey = String(key).trim();
    const existing = getFolio(cleanKey) || {
      folioItems: [],
      paymentEntries: [],
      discountPercent: 0,
      totalPaid: 0
    };

    const newItem = {
      id: chargeItem.id || `chg-${Date.now().toString().slice(-4)}`,
      date: chargeItem.date || new Date().toISOString().split('T')[0],
      category: chargeItem.category || 'Incidental',
      description: chargeItem.description || 'Charge',
      rate: Number(chargeItem.rate || chargeItem.amount || 0),
      qty: Number(chargeItem.qty || 1),
      amount: Number(chargeItem.amount || 0),
      gst: chargeItem.gst !== undefined ? chargeItem.gst : 12
    };

    const updatedItems = [...(existing.folioItems || []), newItem];
    const subtotal = updatedItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    const discount = Math.round((subtotal * (existing.discountPercent || 0)) / 100);
    const net = subtotal - discount;
    const grandTotal = net + Math.round(net * 0.12);
    const totalPaid = (existing.paymentEntries || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const balanceDue = Math.max(0, grandTotal - totalPaid);

    const updatedFolio = {
      ...existing,
      folioItems: updatedItems,
      subtotal,
      grandTotal,
      totalPaid,
      balanceDue
    };

    await saveFolio(cleanKey, updatedFolio);
    showNotification(`Charge of ₹${newItem.amount.toLocaleString('en-IN')} posted to Folio (#${cleanKey}).`);
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
          .update({
            payment: newPayment,
            paid: Number(paid) || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', reservationId);
        if (error) console.warn('Supabase payment update error:', error);
      } catch (err) {
        console.warn('Supabase payment sync error:', err);
      }
    }
  };

  // Cab Bookings & Travel Desk Methods
  const addCabBooking = async (newBooking) => {
    const booking = {
      ...newBooking,
      id: newBooking.id || `CAB-${Date.now().toString().slice(-4)}`,
      hotelId: currentHotel.id,
      created_at: new Date().toISOString()
    };
    setCabBookings(prev => [booking, ...prev]);

    // If billed to room, post charge to that room's folio
    if (booking.paymentStatus === 'BILLED_TO_ROOM' && booking.roomNumber) {
      const cleanRoom = String(booking.roomNumber).replace(/\D/g, '') || String(booking.roomNumber);
      addFolioCharge(cleanRoom, {
        category: 'Travel / Cab',
        description: `Cab Ride #${booking.id}: ${booking.pickupLocation} ➔ ${booking.dropLocation} (${booking.cabType || 'Cab'})`,
        amount: Number(booking.fare) || 0,
        rate: Number(booking.fare) || 0,
        qty: 1
      });
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('cab_bookings').insert({
          id: booking.id,
          hotel_id: currentHotel.id,
          guest_name: booking.guestName || booking.guest_name,
          room_number: booking.roomNumber || booking.room_number || null,
          phone: booking.phone,
          pickup_location: booking.pickupLocation || booking.pickup_location,
          drop_location: booking.dropLocation || booking.drop_location,
          pickup_time: booking.pickupTime || booking.pickup_time,
          cab_type: booking.cabType || booking.cab_type || 'Sedan',
          driver_name: booking.driverName || booking.driver_name || null,
          driver_phone: booking.driverPhone || booking.driver_phone || null,
          vehicle_number: booking.vehicleNumber || booking.vehicle_number || null,
          fare: Number(booking.fare) || 0,
          payment_status: booking.paymentStatus || booking.payment_status || 'PENDING',
          booking_status: booking.bookingStatus || booking.booking_status || 'CONFIRMED',
          notes: booking.notes || null
        });
      } catch (err) {
        console.warn('Supabase cab booking insert error:', err);
      }
    }
    showNotification(`Cab booking #${booking.id} created successfully.`);
    return booking;
  };

  const updateCabBooking = async (bookingId, updates) => {
    setCabBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...updates } : b));
    if (isSupabaseConfigured) {
      try {
        await supabase.from('cab_bookings').update({
          booking_status: updates.bookingStatus || updates.booking_status,
          payment_status: updates.paymentStatus || updates.payment_status,
          driver_name: updates.driverName || updates.driver_name,
          driver_phone: updates.driverPhone || updates.driver_phone,
          vehicle_number: updates.vehicleNumber || updates.vehicle_number,
          fare: updates.fare !== undefined ? Number(updates.fare) : undefined
        }).eq('id', bookingId);
      } catch (err) {
        console.warn('Supabase cab booking update error:', err);
      }
    }
    showNotification(`Cab booking #${bookingId} updated.`);
  };

  const deleteCabBooking = async (bookingId) => {
    setCabBookings(prev => prev.filter(b => b.id !== bookingId));
    if (isSupabaseConfigured) {
      try {
        await supabase.from('cab_bookings').delete().eq('id', bookingId);
      } catch (err) {
        console.warn('Supabase cab booking delete error:', err);
      }
    }
    showNotification(`Cab booking #${bookingId} deleted.`);
  };

  // Full Admin Check-In Action
  const checkInReservation = async (reservationId, checkInData) => {
    const {
      roomNumber,
      actualCheckInTime,
      expectedCheckOutTime,
      idType = 'Aadhaar Card',
      idNumber = '',
      idCity = '',
      collectedAmount = 0,
      paymentMode = 'CASH',
      paymentRef = ''
    } = checkInData;

    let updatedRes = null;

    setReservations(prev => prev.map(r => {
      if (r.id === reservationId) {
        const totalAmount = Number(r.amount || r.price || 0);
        const existingPaid = Number(r.paid || 0);
        const newPaid = existingPaid + Number(collectedAmount);
        const newDue = Math.max(0, totalAmount - newPaid);
        const newPaymentStatus = newDue <= 0 ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'PENDING');

        updatedRes = {
          ...r,
          status: 'CHECKED_IN',
          room: roomNumber ? `Room ${roomNumber}` : r.room,
          room_number: roomNumber || r.room_number,
          actualCheckInTime: actualCheckInTime || new Date().toISOString(),
          actual_check_in_time: actualCheckInTime || new Date().toISOString(),
          expectedCheckOutTime: expectedCheckOutTime || r.checkOut || r.check_out,
          idType,
          idNumber,
          idCity,
          paid: newPaid,
          due: newDue,
          payment: newPaymentStatus,
          paymentMode,
          paymentRef
        };
        return updatedRes;
      }
      return r;
    }));

    // Update physical room status to OCCUPIED
    if (roomNumber) {
      const cleanNum = String(roomNumber).replace(/\D/g, '') || String(roomNumber);
      setRooms(prev => prev.map(rm => {
        const matchNum = String(rm.roomNumber || rm.room_number || rm.number).replace(/\D/g, '');
        if (matchNum === cleanNum) {
          return {
            ...rm,
            status: 'OCCUPIED',
            guest: updatedRes?.guest || rm.guest,
            bookingId: reservationId
          };
        }
        return rm;
      }));

      if (isSupabaseConfigured) {
        try {
          await supabase.from('rooms').update({
            status: 'OCCUPIED',
            guest: updatedRes?.guest || 'Checked-in Guest',
            booking_id: reservationId
          }).eq('room_number', cleanNum);
        } catch (err) {
          console.warn('Supabase room check-in update error:', err);
        }
      }
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('reservations').update({
          status: 'CHECKED_IN',
          room: roomNumber ? `Room ${roomNumber}` : undefined,
          room_number: roomNumber || undefined,
          actual_check_in_time: actualCheckInTime || new Date().toISOString(),
          guest_id_type: idType,
          guest_id_number: idNumber,
          paid: updatedRes?.paid,
          payment: updatedRes?.payment,
          payment_mode: paymentMode,
          updated_at: new Date().toISOString()
        }).eq('id', reservationId);
      } catch (err) {
        console.warn('Supabase reservation check-in update error:', err);
      }
    }

    if (Number(collectedAmount) > 0) {
      const cleanKey = reservationId;
      const existing = getFolio(cleanKey) || {};
      const newPay = {
        id: `pay-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        mode: paymentMode,
        ref: paymentRef || 'CHECKIN-ADV',
        amount: Number(collectedAmount),
        note: 'Check-in Advance Deposit'
      };
      await saveFolio(cleanKey, {
        ...existing,
        reservationId,
        roomNumber,
        guestName: updatedRes?.guest,
        phone: updatedRes?.guestPhone,
        paymentEntries: [...(existing.paymentEntries || []), newPay],
        totalPaid: (existing.totalPaid || 0) + Number(collectedAmount)
      });
    }

    await broadcastCrossDeviceSync({ action: 'checkin', bookingId: reservationId, roomNumber });
    showNotification(`Guest successfully checked into Room ${roomNumber || ''}! Status: CHECKED IN`);
    return updatedRes;
  };

  // Admin Check-Out Action
  const checkOutReservation = async (reservationId) => {
    let targetRoom = null;
    setReservations(prev => prev.map(r => {
      if (r.id === reservationId) {
        targetRoom = r.room_number || String(r.room || '').replace(/\D/g, '');
        return {
          ...r,
          status: 'CHECKED_OUT',
          actualCheckOutTime: new Date().toISOString(),
          actual_check_out_time: new Date().toISOString()
        };
      }
      return r;
    }));

    if (targetRoom) {
      setRooms(prev => prev.map(rm => {
        const matchNum = String(rm.roomNumber || rm.room_number || rm.number).replace(/\D/g, '');
        if (matchNum === String(targetRoom)) {
          return {
            ...rm,
            status: 'DIRTY',
            guest: null,
            bookingId: null
          };
        }
        return rm;
      }));

      if (isSupabaseConfigured) {
        try {
          await supabase.from('rooms').update({
            status: 'DIRTY',
            guest: null,
            booking_id: null,
            updated_at: new Date().toISOString()
          }).eq('room_number', String(targetRoom));
        } catch (err) { }

        // Automatically create turnover task in housekeeping_tasks table
        try {
          await supabase.from('housekeeping_tasks').insert([{
            id: `HK-${Date.now().toString().slice(-4)}`,
            hotel_id: currentHotel.id,
            room_number: String(targetRoom),
            task_type: 'Checkout Turnover & Deep Clean',
            priority: 'High',
            assigned_to: 'Turnover Staff',
            status: 'PENDING',
            notes: `Auto turnover task created upon checkout of reservation #${reservationId}.`
          }]);
        } catch (e) { }
      }
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('reservations').update({
          status: 'CHECKED_OUT',
          actual_check_out_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', reservationId);
        await broadcastCrossDeviceSync({ action: 'checkout', bookingId: reservationId, roomNumber: targetRoom });
      } catch (err) { }
    }

    showNotification(`Reservation #${reservationId} checked out. Room ${targetRoom || ''} marked DIRTY for housekeeping turnover.`);
  };

  // Front Desk Payment Collection
  const collectReservationPayment = async (reservationId, { amount, paymentMethod = 'CASH', reference = '', notes = '' }) => {
    let updatedRes = null;
    const numAmount = Number(amount) || 0;
    setReservations(prev => prev.map(r => {
      if (r.id === reservationId) {
        const total = Number(r.amount || r.price || 0);
        const prevPaid = Number(r.paid || 0);
        const newPaid = prevPaid + numAmount;
        const newDue = Math.max(0, total - newPaid);
        const newStatus = newDue <= 0 ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'PENDING');

        updatedRes = {
          ...r,
          paid: newPaid,
          due: newDue,
          payment: newStatus,
          payment_method: paymentMethod,
          lastPayment: {
            amount: numAmount,
            method: paymentMethod,
            reference,
            notes,
            timestamp: new Date().toISOString()
          }
        };
        return updatedRes;
      }
      return r;
    }));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('reservations').update({
          paid: updatedRes?.paid,
          payment: updatedRes?.payment,
          payment_mode: paymentMethod,
          updated_at: new Date().toISOString()
        }).eq('id', reservationId);
      } catch (err) {
        console.warn('Supabase collect payment error:', err);
      }

      // Record transaction in financial_invoices
      try {
        const cleanKey = reservationId;
        const existing = getFolio(cleanKey) || {};
        const newPay = {
          id: `pay-${Date.now().toString().slice(-4)}`,
          date: new Date().toISOString().split('T')[0],
          mode: paymentMethod,
          ref: reference || `TXN-${Date.now().toString().slice(-5)}`,
          amount: numAmount,
          note: notes || 'Front Desk Payment Collection'
        };
        await saveFolio(cleanKey, {
          ...existing,
          reservationId,
          roomNumber: updatedRes?.room_number || updatedRes?.room,
          guestName: updatedRes?.guest,
          phone: updatedRes?.guestPhone,
          paymentEntries: [...(existing.paymentEntries || []), newPay],
          totalPaid: (existing.totalPaid || 0) + numAmount
        });
      } catch (e) { }
    }

    showNotification(`Payment of ₹${numAmount.toLocaleString()} collected via ${paymentMethod}!`);
    return updatedRes;
  };

  // Add reservation (Full Exceed HMS Schema Synchronization)
  const addReservation = async (newRes) => {
    const resId = newRes.id || `RES-${Date.now().toString().slice(-4)}`;
    const cleanRoomNum = String(newRes.room_number || String(newRes.room).match(/\b(\d+)\b/)?.[1] || '');

    const reservation = {
      ...newRes,
      id: resId,
      hotelId: currentHotel.id,
      guest: newRes.guest,
      guest_email: newRes.guest_email || newRes.email || null,
      guest_phone: newRes.guest_phone || newRes.phone || null,
      guest_country: newRes.guest_country || newRes.country || 'India',
      guest_id_type: newRes.guest_id_type || 'Aadhaar Card',
      guest_id_number: newRes.guest_id_number || null,
      vip_tier: newRes.vip_tier || 'Regular',
      room: newRes.room,
      room_number: cleanRoomNum,
      room_type: newRes.room_type || 'Deluxe Room',
      check_in: newRes.check_in || newRes.checkIn,
      check_out: newRes.check_out || newRes.checkOut,
      checkIn: newRes.check_in || newRes.checkIn,
      checkOut: newRes.check_out || newRes.checkOut,
      nights: Number(newRes.nights) || 1,
      adults: Number(newRes.adults) || 2,
      children: Number(newRes.children) || 0,
      rate_plan: newRes.rate_plan || 'CP - Continental Plan',
      source: newRes.source || 'Front Desk Direct Booking',
      amount: Number(newRes.amount) || 2500,
      paid: Number(newRes.paid || newRes.advance_paid) || 0,
      advance_paid: Number(newRes.advance_paid || newRes.paid) || 0,
      payment_mode: newRes.payment_mode || 'UPI',
      billing_mode: newRes.billing_mode || 'Guest Direct',
      organisation: newRes.organisation || null,
      gstin: newRes.gstin || null,
      status: newRes.status || 'CONFIRMED',
      payment: (Number(newRes.paid || newRes.advance_paid) >= Number(newRes.amount)) ? 'PAID' : 'PENDING',
      notes: newRes.notes || null
    };

    setReservations(prev => [reservation, ...(prev || [])]);
    showNotification(`Reservation ${resId} confirmed for ${reservation.guest}`);
    setIsCreateReservationModalOpen(false);

    // If check-in is today or ongoing, mark room status as OCCUPIED
    const todayStr = new Date().toISOString().split('T')[0];
    if (cleanRoomNum && reservation.check_in <= todayStr && reservation.check_out >= todayStr) {
      setRooms(prev => prev.map(r => {
        if (String(r.room_number || r.roomNumber) === cleanRoomNum) {
          return {
            ...r,
            status: 'OCCUPIED',
            guest: reservation.guest,
            booking_id: resId,
            check_out: reservation.check_out
          };
        }
        return r;
      }));
    }

    if (isSupabaseConfigured) {
      try {
        const payload = {
          id: resId,
          hotel_id: currentHotel.id,
          guest: reservation.guest,
          guest_email: reservation.guest_email,
          guest_phone: reservation.guest_phone,
          guest_country: reservation.guest_country,
          guest_id_type: reservation.guest_id_type,
          guest_id_number: reservation.guest_id_number,
          vip_tier: reservation.vip_tier,
          room: reservation.room,
          room_number: cleanRoomNum,
          room_type: reservation.room_type,
          check_in: reservation.check_in,
          check_out: reservation.check_out,
          nights: reservation.nights,
          adults: reservation.adults,
          children: reservation.children,
          rate_plan: reservation.rate_plan,
          source: reservation.source,
          amount: reservation.amount,
          paid: reservation.paid,
          advance_paid: reservation.advance_paid,
          payment_mode: reservation.payment_mode,
          billing_mode: reservation.billing_mode,
          organisation: reservation.organisation,
          gstin: reservation.gstin,
          status: reservation.status,
          payment: reservation.payment,
          notes: reservation.notes
        };
        const { error } = await supabase.from('reservations').insert(payload);
        if (error) {
          // Schema fallback if extra columns not in Supabase yet
          await supabase.from('reservations').insert({
            id: resId,
            hotel_id: currentHotel.id,
            guest: reservation.guest,
            guest_email: reservation.guest_email,
            guest_phone: reservation.guest_phone,
            room: reservation.room,
            check_in: reservation.check_in,
            check_out: reservation.check_out,
            source: 'Front Desk Direct',
            amount: reservation.amount,
            status: reservation.status,
            payment: reservation.payment
          });
        }

        if (cleanRoomNum && reservation.check_in <= todayStr && reservation.check_out >= todayStr) {
          await supabase.from('rooms').update({
            status: 'OCCUPIED',
            guest: reservation.guest,
            booking_id: resId,
            check_out: reservation.check_out
          }).eq('room_number', cleanRoomNum);
        }
        await broadcastCrossDeviceSync({
          action: 'book',
          bookingId: resId,
          guestName: reservation.guest,
          roomNumber: cleanRoomNum
        });
      } catch (err) {
        console.warn('Supabase reservation insert sync:', err);
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
  const [frontDeskTasks, setFrontDeskTasks] = useState([
    { id: 'tsk-1', text: 'Wake-up Call for Room 101 at 07:30 AM', priority: 'HIGH', completed: false, time: '07:30 AM' },
    { id: 'tsk-2', text: 'Airport Taxi Pickup for Flight 6E-421 (Mr. Ramesh)', priority: 'HIGH', completed: false, time: '11:00 AM' },
    { id: 'tsk-3', text: 'Housekeeping Linen Inspection - 2nd Floor', priority: 'NORMAL', completed: true, time: '02:00 PM' },
    { id: 'tsk-4', text: 'Collect Advance / Settlement for Due-out Room 105', priority: 'HIGH', completed: false, time: '06:00 PM' }
  ]);

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

    showNotification(`Room #${num} checked out. Room marked DIRTY for housekeeping turnover.`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('rooms').update({
          status: 'DIRTY',
          guest: null,
          booking_id: null,
          updated_at: new Date().toISOString()
        }).eq('room_number', num);

        if (reservationId) {
          await supabase.from('reservations').update({
            status: 'CHECKED_OUT',
            actual_check_out_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).eq('id', reservationId);
        }

        // Automatically create turnover task in housekeeping_tasks table
        await supabase.from('housekeeping_tasks').insert([{
          id: `HK-${Date.now().toString().slice(-4)}`,
          hotel_id: currentHotel.id,
          room_number: num,
          task_type: 'Checkout Turnover & Deep Clean',
          priority: 'High',
          assigned_to: 'Turnover Staff',
          status: 'PENDING',
          notes: `Checkout turnover clean for room #${num}.`
        }]);
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
      setFnbOrders,
      addFnbOrder,
      staffUsers,
      otaChannels,
      isLiveConnected,
      cabBookings,
      setCabBookings,
      addCabBooking,
      updateCabBooking,
      deleteCabBooking,
      folios,
      getFolio,
      saveFolio,
      addFolioCharge,
      settleFnbOrder,
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
      checkInReservation,
      checkOutReservation,
      collectReservationPayment,
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
      roomTypes,
      setRoomTypes,
      addRoomType,
      updateRoomType,
      deleteRoomType,
      isCreateRoomTypeModalOpen,
      setIsCreateRoomTypeModalOpen,
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
