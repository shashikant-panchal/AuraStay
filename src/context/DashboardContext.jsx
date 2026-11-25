import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import aavasaLogo from '../assets/aavasa-logo.webp';
import { initialMockData } from '../data/mockData';
import { mockRooms, mockReservations, mockFnbOrders, mockStaffUsers, mockOtaChannels } from '../data/suiteData';
import { supabase, isSupabaseConfigured, supabaseAnonKey } from '../lib/supabase';
import { cachedQuery, invalidateCache, invalidateAllCache } from '../lib/queryCache';
import { PMS_API_URL, broadcastCrossDeviceSync, pushHotelInventoryViaBackend } from '../services/aiosellService';
import { compareCategoryNames, compareRoomsByCategoryAndNumber } from '../utils/roomSort';
import { playBookingBellSound } from '../utils/audioAlert';
import { getLocalTodayStr, normalizeRoomNum, extractReservationRoomNum, resolveRoomTodayState } from '../utils/roomState';

const RESERVATION_PAGE_SIZE = 200;
const FOLIO_PAGE_SIZE = 200;
const POLL_FALLBACK_MS = 180000;
const STALE_VISIBLE_MS = 60000;

const DEFAULT_HOTEL = {
  id: '',
  slug: '',
  aiosellHotelCode: '',
  name: 'AuraStay Property',
  shortName: 'AST',
  logoUrl: aavasaLogo || './aavasa-logo.webp',
  ownerName: 'Property Admin',
  ownerRole: 'Property Admin',
  email: '',
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

  // Persist Admin session in localStorage and verify active Supabase Auth JWT on mount/change
  useEffect(() => {
    try {
      if (isLoggedIn && currentHotel && (currentHotel.id || currentHotel.email)) {
        localStorage.setItem('aavasa_admin_auth_v3', 'true');
        localStorage.setItem('aavasa_admin_session_v3', JSON.stringify(currentHotel));
        if (currentHotel.name) {
          document.title = `${currentHotel.name} — PMS Admin`;
        }
      } else {
        document.title = 'Hotel Admin Portal';
      }
    } catch (e) { }
  }, [isLoggedIn, currentHotel]);

  const [hasMoreReservations, setHasMoreReservations] = useState(false);
  const [isLoadingMoreReservations, setIsLoadingMoreReservations] = useState(false);
  const lastLoadedAtRef = useRef(0);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const role = data?.session?.user?.app_metadata?.role;
      const hasValidSession = Boolean(data?.session?.access_token && (!role || ['hotel_admin', 'staff', 'super_admin'].includes(role)));
      if (isLoggedIn && !hasValidSession) {
        // Legacy pre-RLS localStorage session without Auth JWT: require clean sign-in
        setIsLoggedIn(false);
        localStorage.removeItem('aavasa_admin_auth_v3');
      }
    }).catch(() => {});

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        invalidateAllCache();
        setIsLoggedIn(false);
        localStorage.removeItem('aavasa_admin_auth_v3');
        localStorage.removeItem('aavasa_admin_session_v3');
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

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
  const [editingRoomType, setEditingRoomType] = useState(null);

  const openCreateRoomTypeModal = () => {
    setEditingRoomType(null);
    setIsCreateRoomTypeModalOpen(true);
  };

  const openEditRoomTypeModal = (roomType) => {
    setEditingRoomType(roomType);
    setIsCreateRoomTypeModalOpen(true);
  };

  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [fnbOrders, setFnbOrders] = useState([]);
  const [restaurantTables, setRestaurantTables] = useState([]);
  const [restaurantMenuItems, setRestaurantMenuItems] = useState([]);
  const [staffUsers, setStaffUsers] = useState(mockStaffUsers);
  const [otaChannels, setOtaChannels] = useState(mockOtaChannels);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const syncDebounceRef = useRef(null);
  const recentLocalGuestEditRef = useRef({ id: null, until: 0 });
  const recentLocalShiftRef = useRef({ resId: null, rooms: [], until: 0 });

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
  const [selectedReservationDetails, setSelectedReservationDetails] = useState(null);
  const [isReservationDetailsOpen, setIsReservationDetailsOpen] = useState(false);

  // Checkout Confirmation Modal State
  const [checkoutConfirmData, setCheckoutConfirmData] = useState(null);
  const [isCheckoutConfirmOpen, setIsCheckoutConfirmOpen] = useState(false);

  const requestCheckout = useCallback((data) => {
    if (!data) return;
    setCheckoutConfirmData(data);
    setIsCheckoutConfirmOpen(true);
  }, []);

  const closeCheckoutConfirmModal = useCallback(() => {
    setIsCheckoutConfirmOpen(false);
    setCheckoutConfirmData(null);
  }, []);

  const openReservationDetails = useCallback((res) => {
    if (!res) return;
    setSelectedReservationDetails(res);
    setIsReservationDetailsOpen(true);
  }, []);

  const closeReservationDetails = useCallback(() => {
    setSelectedReservationDetails(null);
    setIsReservationDetailsOpen(false);
  }, []);
  const [isCreateReservationModalOpenState, setIsCreateReservationModalOpenState] = useState(false);
  const [reservationPrefill, setReservationPrefill] = useState(null);
  const isCreateReservationModalOpen = isCreateReservationModalOpenState;
  const setIsCreateReservationModalOpen = (open) => {
    setIsCreateReservationModalOpenState(open);
    if (!open) {
      setReservationPrefill(null);
    }
  };
  const openCreateReservationModal = (prefill = null) => {
    setReservationPrefill(prefill);
    setIsCreateReservationModalOpenState(true);
  };
  const [isCreateRoomModalOpenState, setIsCreateRoomModalOpenState] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const isCreateRoomModalOpen = isCreateRoomModalOpenState;
  const setIsCreateRoomModalOpen = (open) => {
    setIsCreateRoomModalOpenState(open);
    if (!open) {
      setEditingRoom(null);
    }
  };
  const openCreateRoomModal = () => {
    setEditingRoom(null);
    setIsCreateRoomModalOpenState(true);
  };
  const openEditRoomModal = (room) => {
    setEditingRoom(room || null);
    setIsCreateRoomModalOpenState(true);
  };

  // Popover state for Master Service Home cards
  const [activePopoverModule, setActivePopoverModule] = useState(null);

  const [notificationMessage, setNotificationMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Fetch hotel-scoped live data directly from Supabase (Free-Plan Optimized, zero cross-tenant leakage)
  const loadSupabaseData = useCallback(async (options = {}) => {
    const hotelId = currentHotel?.id;
    if (!isSupabaseConfigured || !isLoggedIn || !hotelId) return;
    const forceRefresh = Boolean(options?.force);

    try {
      const [
        hotelRes,
        roomsRes,
        resRes,
        fnbRes,
        tablesRes,
        menuRes,
        staffRes,
        chanRes,
        roomTypesRes,
        cabsRes,
        invoicesRes
      ] = await cachedQuery(
        `pms:dashboard:${hotelId}`,
        () => Promise.all([
          supabase
            .from('hotels')
            .select('id, slug, name, short_name, logo_url, owner_name, email, mobile, address, city, total_rooms, status, currency, currency_symbol, aiosell_hotel_code')
            .eq('id', hotelId)
            .maybeSingle(),
          supabase
            .from('rooms')
            .select('id, hotel_id, room_number, room_type_id, floor, type, bed, status, housekeeping, price, guest, booking_id, check_out, key_card_no, is_smoking, interconnecting_room, phone_extension, is_ota_locked, ota_channel')
            .eq('hotel_id', hotelId)
            .order('room_number'),
          supabase
            .from('reservations')
            .select('id, hotel_id, guest, guest_email, guest_phone, guest_id_type, guest_id_number, guest_id_city, room, room_number, room_type, check_in, check_out, actual_check_in_time, actual_check_out_time, expected_check_out_time, source, amount, paid, advance_paid, payment_mode, billing_mode, organisation, gstin, status, payment, created_at, rate_plan, adults, children, notes')
            .eq('hotel_id', hotelId)
            .order('created_at', { ascending: false })
            .range(0, RESERVATION_PAGE_SIZE - 1),
          supabase
            .from('fnb_orders')
            .select('id, room_table, guest, items, total, status, time, created_at')
            .eq('hotel_id', hotelId)
            .order('created_at', { ascending: false })
            .range(0, FOLIO_PAGE_SIZE - 1),
          supabase
            .from('restaurant_tables')
            .select('id, hotel_id, name, area, seats, status, guest_name, room_number, items_count, current_total, active_order_id, updated_at')
            .eq('hotel_id', hotelId)
            .order('name'),
          supabase
            .from('restaurant_menu_items')
            .select('id, hotel_id, name, category, kitchen_station, price, cost_price, tax_pct, unit, is_veg, status, prep_time, description, image_url')
            .eq('hotel_id', hotelId)
            .order('created_at', { ascending: false }),
          supabase
            .from('staff_users')
            .select('id, hotel_id, name, role, email, phone, department, status, created_at')
            .eq('hotel_id', hotelId)
            .order('id'),
          supabase
            .from('ota_channels')
            .select('id, name, status, sync_status, mapped_rooms, active_bookings, commission')
            .order('id'),
          supabase
            .from('room_types')
            .select('id, hotel_id, name, label, bedding_type, max_adults, max_extra, max_children, area_sqft, base_price, extra_bed_price, child_price, amenities, description, notes, is_booking_engine')
            .eq('hotel_id', hotelId)
            .order('name'),
          supabase
            .from('cab_bookings')
            .select('id, hotel_id, guest_name, room_number, phone, pickup_location, drop_location, pickup_time, cab_type, driver_name, driver_phone, vehicle_number, fare, payment_status, booking_status, notes, created_at')
            .eq('hotel_id', hotelId)
            .order('created_at', { ascending: false })
            .range(0, FOLIO_PAGE_SIZE - 1),
          supabase
            .from('financial_invoices')
            .select('id, reservation_id, room_number, client_name, client_phone, subtotal, total_amount, paid_amount, notes, created_at')
            .eq('hotel_id', hotelId)
            .order('created_at', { ascending: false })
            .range(0, FOLIO_PAGE_SIZE - 1)
        ]),
        { ttlMs: 10000, force: forceRefresh }
      );
      lastLoadedAtRef.current = Date.now();

      const matchedHotel = hotelRes?.data;
      if (matchedHotel) {
        setCurrentHotel(prev => {
          const syncedHotel = {
            ...prev,
            id: matchedHotel.id,
            slug: matchedHotel.slug || matchedHotel.id,
            aiosellHotelCode: matchedHotel.aiosell_hotel_code || prev.aiosellHotelCode || '',
            name: matchedHotel.name || prev.name,
            shortName: matchedHotel.short_name || prev.shortName || 'HTL',
            logoUrl: matchedHotel.logo_url || DEFAULT_HOTEL.logoUrl,
            ownerName: matchedHotel.owner_name || prev.ownerName || 'Hotel Admin',
            email: matchedHotel.email || prev.email,
            mobile: matchedHotel.mobile || prev.mobile || '',
            address: matchedHotel.address || prev.address || 'India',
            city: matchedHotel.city || prev.city || 'Bengaluru',
            totalRooms:
              matchedHotel.total_rooms !== undefined && matchedHotel.total_rooms !== null
                ? Number(matchedHotel.total_rooms)
                : (Number(prev.totalRooms) || 0)
          };
          delete syncedHotel.password;
          if (
            syncedHotel.name === prev.name &&
            syncedHotel.shortName === prev.shortName &&
            syncedHotel.logoUrl === prev.logoUrl &&
            syncedHotel.ownerName === prev.ownerName &&
            syncedHotel.mobile === prev.mobile &&
            syncedHotel.address === prev.address &&
            syncedHotel.city === prev.city &&
            syncedHotel.totalRooms === prev.totalRooms &&
            syncedHotel.aiosellHotelCode === prev.aiosellHotelCode
          ) {
            return prev;
          }
          try {
            localStorage.setItem('aavasa_admin_session_v3', JSON.stringify(syncedHotel));
          } catch (e) { }
          return syncedHotel;
        });
      }

      let tablesFound = false;

      if (!roomsRes?.error && Array.isArray(roomsRes?.data)) {
        const hotelRooms = roomsRes.data;
        setRooms(hotelRooms.map(r => ({
          id: r.id,
          hotelId: r.hotel_id || hotelId,
          roomNumber: r.room_number,
          room_number: r.room_number,
          roomTypeId: r.room_type_id || null,
          room_type_id: r.room_type_id || null,
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
          key_card_no: r.key_card_no,
          isSmoking: !!r.is_smoking,
          is_smoking: !!r.is_smoking,
          phoneExtension: r.phone_extension,
          phone_extension: r.phone_extension,
          interconnectingRoom: r.interconnecting_room || '',
          isOtaLocked: !!r.is_ota_locked,
          is_ota_locked: !!r.is_ota_locked,
          otaChannel: r.ota_channel || ''
        })).sort(compareRoomsByCategoryAndNumber));
        tablesFound = true;
      }

      if (!resRes?.error && Array.isArray(resRes?.data)) {
        const hotelRes = resRes.data;
        setReservations(hotelRes.map(r => ({
          id: r.id,
          hotelId: r.hotel_id || hotelId,
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
          actualCheckInTime: r.actual_check_in_time || '',
          actual_check_in_time: r.actual_check_in_time || '',
          actualCheckOutTime: r.actual_check_out_time || '',
          actual_check_out_time: r.actual_check_out_time || '',
          expectedCheckOutTime: r.expected_check_out_time || '',
          expected_check_out_time: r.expected_check_out_time || '',
          idType: r.guest_id_type || '',
          idNumber: r.guest_id_number || '',
          idCity: r.guest_id_city || '',
          source: r.source || 'Direct',
          amount: Number(r.amount) || 0,
          total: Number(r.amount) || 0,
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
        setHasMoreReservations(hotelRes.length >= RESERVATION_PAGE_SIZE);
        tablesFound = true;
      }

      if (!fnbRes?.error && Array.isArray(fnbRes?.data)) {
        setFnbOrders(fnbRes.data.map(o => ({
          orderId: o.id,
          roomTable: o.room_table,
          guest: o.guest,
          items: o.items,
          total: Number(o.total) || 0,
          status: o.status,
          time: o.time
        })));
      }

      if (!tablesRes?.error && Array.isArray(tablesRes?.data)) {
        setRestaurantTables(tablesRes.data.map(t => ({
          id: t.id,
          hotelId: t.hotel_id,
          name: t.name,
          area: t.area || 'Main Dining',
          seats: Number(t.seats) || 4,
          status: t.status || 'VACANT',
          guestName: t.guest_name || null,
          roomNumber: t.room_number || null,
          itemsCount: Number(t.items_count) || 0,
          total: Number(t.current_total) || 0,
          activeOrderId: t.active_order_id || null,
          updatedAt: t.updated_at
        })));
      }

      if (!menuRes?.error && Array.isArray(menuRes?.data)) {
        setRestaurantMenuItems(menuRes.data.map(m => ({
          id: m.id,
          hotelId: m.hotel_id,
          name: m.name,
          category: m.category || 'Main Course',
          kitchenStation: m.kitchen_station || 'Hot Kitchen (Indian)',
          price: Number(m.price) || 0,
          costPrice: Number(m.cost_price) || 0,
          taxPct: Number(m.tax_pct ?? 5),
          unit: m.unit || 'Portion',
          isVeg: m.is_veg !== false,
          isVegetarian: m.is_veg !== false,
          status: m.status || 'AVAILABLE',
          prepTime: m.prep_time || '15 mins',
          description: m.description || '',
          imageUrl: m.image_url || ''
        })));
      }

      if (!staffRes?.error && Array.isArray(staffRes?.data)) {
        setStaffUsers(staffRes.data);
      }

      if (!chanRes?.error && Array.isArray(chanRes?.data) && chanRes.data.length > 0) {
        setOtaChannels(chanRes.data.map(c => ({
          name: c.name,
          status: c.status,
          syncStatus: c.sync_status,
          mappedRooms: c.mapped_rooms,
          activeBookings: c.active_bookings,
          commission: c.commission
        })));
      }

      if (!roomTypesRes?.error && Array.isArray(roomTypesRes?.data)) {
        setRoomTypes(roomTypesRes.data.map(t => ({
          id: t.id,
          hotelId: t.hotel_id || hotelId,
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
        })).sort((a, b) => compareCategoryNames(a.name, b.name)));
      }

      if (!cabsRes?.error && Array.isArray(cabsRes?.data)) {
        setCabBookings(cabsRes.data.map(c => ({
          id: c.id,
          hotelId: c.hotel_id || hotelId,
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

      if (!invoicesRes?.error && Array.isArray(invoicesRes?.data)) {
        const folioMap = {};
        invoicesRes.data.forEach(inv => {
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
  }, [currentHotel?.id, isLoggedIn]);

  const loadMoreReservations = useCallback(async () => {
    const hotelId = currentHotel?.id;
    if (!isSupabaseConfigured || !isLoggedIn || !hotelId || isLoadingMoreReservations || !hasMoreReservations) return;
    setIsLoadingMoreReservations(true);
    try {
      const from = reservations.length;
      const to = from + RESERVATION_PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from('reservations')
        .select('id, hotel_id, guest, guest_email, guest_phone, guest_id_type, guest_id_number, guest_id_city, room, room_number, room_type, check_in, check_out, actual_check_in_time, actual_check_out_time, expected_check_out_time, source, amount, paid, advance_paid, payment_mode, billing_mode, organisation, gstin, status, payment, created_at, rate_plan, adults, children, notes')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (!error && Array.isArray(data)) {
        const mapped = data.map(r => ({
          id: r.id,
          hotelId: r.hotel_id || hotelId,
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
          actualCheckInTime: r.actual_check_in_time || '',
          actual_check_in_time: r.actual_check_in_time || '',
          actualCheckOutTime: r.actual_check_out_time || '',
          actual_check_out_time: r.actual_check_out_time || '',
          expectedCheckOutTime: r.expected_check_out_time || '',
          expected_check_out_time: r.expected_check_out_time || '',
          idType: r.guest_id_type || '',
          idNumber: r.guest_id_number || '',
          idCity: r.guest_id_city || '',
          source: r.source || 'Direct',
          amount: Number(r.amount) || 0,
          total: Number(r.amount) || 0,
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
        }));
        setReservations(prev => {
          const seen = new Set(prev.map(item => String(item.id)));
          const merged = [...prev];
          mapped.forEach(item => {
            if (!seen.has(String(item.id))) merged.push(item);
          });
          return merged;
        });
        setHasMoreReservations(data.length >= RESERVATION_PAGE_SIZE);
      }
    } finally {
      setIsLoadingMoreReservations(false);
    }
  }, [currentHotel?.id, isLoggedIn, isLoadingMoreReservations, hasMoreReservations, reservations.length]);

  const scheduleRealtimeRefresh = useCallback(() => {
    const hotelId = currentHotel?.id;
    if (hotelId) invalidateCache(`pms:dashboard:${hotelId}`);
    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
    }
    syncDebounceRef.current = setTimeout(() => {
      loadSupabaseData({ force: true });
    }, 350);
  }, [currentHotel?.id, loadSupabaseData]);

  useEffect(() => {
    if (!isLoggedIn || !currentHotel?.id) return;
    loadSupabaseData();

    // Free-Tier Nano optimized: Realtime WebSockets handle instant updates;
    // visibility-aware 3-min fallback avoids wasting connections & WAL query bandwidth on idle tabs.
    const pollTimer = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        loadSupabaseData({ force: true });
      }
    }, POLL_FALLBACK_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastLoadedAtRef.current > STALE_VISIBLE_MS) {
        loadSupabaseData({ force: true });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    };
  }, [isLoggedIn, currentHotel?.id, loadSupabaseData]);

  // 2. Scoped Realtime WebSocket & Webhook Broadcast Subscription (No refresh required)
  useEffect(() => {
    const hotelId = currentHotel?.id;
    if (!isSupabaseConfigured || !isLoggedIn || !hotelId) return;

    const hotelFilter = `hotel_id=eq.${hotelId}`;
    const isSelfGuestEditEcho = (payload, matchKey) => {
      if (payload?.eventType !== 'UPDATE') return false;
      const recent = recentLocalGuestEditRef.current;
      if (!recent?.id || Date.now() > recent.until) return false;
      return String(payload?.new?.[matchKey] || '') === String(recent.id);
    };
    const isSelfShiftEcho = (payload, kind) => {
      if (payload?.eventType !== 'UPDATE') return false;
      const recent = recentLocalShiftRef.current;
      if (!recent || Date.now() > recent.until) return false;
      if (kind === 'room') {
        const rn = normalizeRoomNum(payload?.new?.room_number);
        return Boolean(rn && recent.rooms.includes(rn));
      }
      if (kind === 'reservation') {
        return Boolean(recent.resId && String(payload?.new?.id || '') === String(recent.resId));
      }
      if (kind === 'invoice') {
        return Boolean(recent.resId && String(payload?.new?.reservation_id || '') === String(recent.resId));
      }
      return false;
    };

    const channel = supabase.channel(`aurastay-realtime-${hotelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hotels', filter: `id=eq.${hotelId}` }, () => {
        scheduleRealtimeRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: hotelFilter }, payload => {
        if (!isSelfGuestEditEcho(payload, 'booking_id') && !isSelfShiftEcho(payload, 'room')) {
          scheduleRealtimeRefresh();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: hotelFilter }, payload => {
        if (payload.eventType === 'INSERT' && payload.new) {
          playBookingBellSound();
          showNotification(`New Booking #${payload.new.id} received for ${payload.new.guest || 'Guest'} (${payload.new.room || 'Room'}).`);
          scheduleRealtimeRefresh();
        } else if (payload.eventType === 'UPDATE' && payload.new && payload.new.status === 'CANCELLED') {
          showNotification(`Reservation #${payload.new.id} for ${payload.new.guest || 'Guest'} was CANCELLED.`);
          scheduleRealtimeRefresh();
        } else if (!isSelfGuestEditEcho(payload, 'id') && !isSelfShiftEcho(payload, 'reservation')) {
          scheduleRealtimeRefresh();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fnb_orders', filter: hotelFilter }, () => {
        scheduleRealtimeRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_tables', filter: hotelFilter }, () => {
        scheduleRealtimeRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_menu_items', filter: hotelFilter }, () => {
        scheduleRealtimeRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_types', filter: hotelFilter }, () => {
        scheduleRealtimeRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cab_bookings', filter: hotelFilter }, () => {
        scheduleRealtimeRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_invoices', filter: hotelFilter }, payload => {
        if (!isSelfGuestEditEcho(payload, 'reservation_id') && !isSelfShiftEcho(payload, 'invoice')) {
          scheduleRealtimeRefresh();
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLiveConnected(true);
        }
      });

    const broadcastChannel = supabase.channel('aurastay_sync_broadcast')
      .on('broadcast', { event: 'webhook_update' }, (msg) => {
        const data = msg?.payload;
        if (data?.hotelId && String(data.hotelId) !== String(hotelId)) return;
        scheduleRealtimeRefresh();
        if (data?.bookingId && data?.action === 'book') {
          playBookingBellSound();
          showNotification(`Real-Time Webhook Sync: Booking #${data.bookingId} (${data.guestName || 'Guest'}) locked Room ${data.allocatedRoom || ''}.`);
        } else if (data?.bookingId && data?.action === 'cancel') {
          showNotification(`Real-Time Webhook Sync: Booking #${data.bookingId} cancelled across all channels.`);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [isLoggedIn, currentHotel?.id, scheduleRealtimeRefresh]);

  // Hotel Admin Authentication functions - Client-provisioned credentials only
  const login = async (email, password) => {
    const inputIdent = String(email || '').trim().toLowerCase();
    const inputPass = String(password || '').trim();

    if (!inputIdent || !inputPass) {
      return { success: false, message: 'Please enter both Email and Password.' };
    }

    if (inputIdent.length < 3 || inputPass.length < 4) {
      return { success: false, message: 'Invalid email or password format.' };
    }

    if (
      inputIdent === 'superadmin@aavasa.com' ||
      inputIdent === 'superadmin@aurastay.com' ||
      inputIdent === 'admin@aurastay.com' ||
      inputIdent === 'hotel_aurastay_01'
    ) {
      return {
        success: false,
        message: 'Invalid email or password. Please verify your credentials and try again.'
      };
    }

    if (!isSupabaseConfigured) {
      return { success: false, message: 'Database connection is not configured.' };
    }

    const buildSanitizedHotel = (hotelData) => ({
      id: hotelData.id,
      slug: hotelData.slug || hotelData.id,
      aiosellHotelCode: hotelData.aiosell_hotel_code || '',
      name: hotelData.name,
      shortName: hotelData.short_name || 'HTL',
      logoUrl: hotelData.logo_url || DEFAULT_HOTEL.logoUrl,
      ownerName: hotelData.owner_name || 'Hotel Admin',
      ownerRole: 'Property Admin',
      email: hotelData.email,
      mobile: hotelData.mobile || '',
      address: hotelData.address || 'India',
      city: hotelData.city || 'Bengaluru',
      totalRooms: Number(hotelData.total_rooms) || 0,
      currency: hotelData.currency || 'INR',
      currencySymbol: hotelData.currency_symbol || '₹'
    });

    const completeLoginSession = (hotelData) => {
      const hotel = buildSanitizedHotel(hotelData);
      setCurrentHotel(hotel);
      setIsLoggedIn(true);
      localStorage.setItem('aavasa_admin_auth_v3', 'true');
      localStorage.setItem('aavasa_admin_session_v3', JSON.stringify(hotel));
      showNotification(`Welcome to ${hotel.name} PMS Portal!`);
      return { success: true, hotel };
    };

    try {
      // Server-side cryptographic password verification + Supabase Auth JWT minting
      const res = await fetch(PMS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'x-aavasa-client': 'aurastay-pms'
        },
        body: JSON.stringify({
          action: 'verify_admin_login',
          email: inputIdent,
          password: inputPass
        })
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result?.success && result?.hotel) {
        if (result.session?.access_token && result.session?.refresh_token && supabase) {
          await supabase.auth.setSession({
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token
          });
        }
        invalidateAllCache();
        return completeLoginSession(result.hotel);
      }

      return {
        success: false,
        message: result?.message || 'Invalid email or password. Please verify your credentials and try again.'
      };
    } catch (e) {
      console.warn('Supabase hotel login error:', e);
      return { success: false, message: 'Authentication service unavailable. Please check your connection and try again.' };
    }
  };

  const logout = () => {
    invalidateAllCache();
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setIsLoggedIn(false);
    setHasMoreReservations(false);
    setCurrentHotel(DEFAULT_HOTEL);
    setRooms([]);
    setReservations([]);
    setRoomTypes([]);
    setFnbOrders([]);
    setRestaurantTables([]);
    setRestaurantMenuItems([]);
    setCabBookings([]);
    setFolios({});
    setStaffUsers([]);
    localStorage.removeItem('aavasa_admin_auth_v3');
    localStorage.removeItem('aavasa_admin_session_v3');
    localStorage.removeItem('aurastay_hotel_auth');
    localStorage.removeItem('aurastay_hotel_session');
    showNotification('Logged out successfully', 'info');
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
      if (currentHotel?.id) invalidateCache(`pms:dashboard:${currentHotel.id}`);
      await loadSupabaseData({ force: true });
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

    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        // Always scope by hotel_id so identical room numbers across properties never collide
        const { error } = await supabase
          .from('rooms')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('hotel_id', currentHotel.id)
          .eq('room_number', cleanNum);

        if (error) {
          await supabase
            .from('rooms')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('hotel_id', currentHotel.id)
            .eq('id', roomIdentifier);
        }
        await broadcastCrossDeviceSync({ action: 'room_status', roomNumber: cleanNum, status: newStatus });
      } catch (err) {
        console.warn('Supabase room update sync pending table setup', err);
      }
    }
  };

  // Room Categories (AuraStay Room Category Master) CRUD
  const addRoomType = async (newType) => {
    const typeObj = {
      ...newType,
      id: newType.id || `rt-${Date.now().toString().slice(-4)}`,
      hotelId: currentHotel.id
    };
    setRoomTypes(prev =>
      [typeObj, ...(prev || []).filter(t => t.name.toLowerCase() !== typeObj.name.toLowerCase())]
        .sort((a, b) => compareCategoryNames(a.name, b.name))
    );
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
    const cleanObj = {
      ...updatedType,
      id
    };
    setRoomTypes(prev =>
      (prev || []).map(t => t.id === id ? { ...t, ...cleanObj } : t)
        .sort((a, b) => compareCategoryNames(a.name, b.name))
    );
    showNotification(`Room category ${updatedType.name || ''} updated successfully.`);
    setIsCreateRoomTypeModalOpen(false);
    setEditingRoomType(null);

    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        const payload = {
          name: updatedType.name,
          label: updatedType.label || 'Room',
          bedding_type: updatedType.beddingType || updatedType.bedding_type || 'King Bed',
          max_adults: Number(updatedType.maxAdults || updatedType.max_adults) || 2,
          max_extra: Number(updatedType.maxExtra || updatedType.max_extra) || 1,
          max_children: Number(updatedType.maxChildren || updatedType.max_children) || 1,
          area_sqft: Number(updatedType.areaSqft || updatedType.area_sqft) || 350,
          base_price: Number(updatedType.basePrice || updatedType.base_price) || 2500,
          extra_bed_price: Number(updatedType.extraBedPrice || updatedType.extra_bed_price) || 800,
          child_price: Number(updatedType.childPrice || updatedType.child_price) || 400,
          amenities: updatedType.amenities || [],
          description: updatedType.description || '',
          notes: updatedType.notes || '',
          is_booking_engine: updatedType.isBookingEngine !== false
        };
        await supabase.from('room_types').update(payload).eq('id', id).eq('hotel_id', currentHotel.id);
        await broadcastCrossDeviceSync({ action: 'room_type_update', id });
      } catch (err) {
        console.warn('Supabase update room type error:', err);
      }
    }
  };

  const deleteRoomType = async (id) => {
    setRoomTypes(prev => (prev || []).filter(t => t.id !== id));
    showNotification('Room category removed.');
    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        await supabase.from('room_types').delete().eq('id', id).eq('hotel_id', currentHotel.id);
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

    setRooms(prev =>
      [room, ...prev.filter(r => String(r.roomNumber || r.room_number) !== cleanNum)]
        .sort(compareRoomsByCategoryAndNumber)
    );
    showNotification(`Room #${cleanNum} created successfully.`);
    setIsCreateRoomModalOpen(false);

    if (isSupabaseConfigured) {
      try {
        const payload = {
          room_number: room.roomNumber,
          room_type_id: room.roomTypeId || null,
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
        const { data: insertedRoom, error } = await supabase
          .from('rooms')
          .insert({
            ...payload,
            hotel_id: currentHotel.id
          })
          .select('id, hotel_id, room_number, room_type_id, floor, type, bed, status, housekeeping, price, guest, booking_id, check_out, key_card_no, is_smoking, interconnecting_room, phone_extension')
          .maybeSingle();
        if (currentHotel?.id) invalidateCache(`pms:dashboard:${currentHotel.id}`);
        if (error) {
          console.warn('Supabase room insert error:', error.message);
        } else if (insertedRoom?.id) {
          room.id = insertedRoom.id;
          setRooms(prev =>
            prev.map(r =>
              String(r.roomNumber || r.room_number) === cleanNum ? { ...r, id: insertedRoom.id } : r
            )
          );
        }
        await broadcastCrossDeviceSync({ action: 'room_add', roomNumber: cleanNum });
        pushHotelInventoryViaBackend({ hotelId: currentHotel.id }).catch(() => {});
      } catch (err) {
        console.warn('Supabase room insert error:', err);
      }
    }
    return { success: true, room };
  };

  // Edit / Update pre-entered room details (persisted via atomic PostgreSQL RPC & synced realtime)
  const updateRoom = async (originalRoom, updatedData = {}) => {
    const origObj =
      originalRoom && typeof originalRoom === 'object'
        ? originalRoom
        : rooms.find(
            r =>
              String(r.id) === String(originalRoom) ||
              String(r.roomNumber || r.room_number) === String(originalRoom)
          );

    const origRoomNum = String(
      origObj?.roomNumber || origObj?.room_number || (typeof originalRoom === 'string' ? originalRoom : '')
    ).trim();
    const newRoomNum = String(updatedData.roomNumber ?? origRoomNum).trim();

    if (!newRoomNum) {
      const msg = 'Room Number is required.';
      showNotification(msg);
      return { success: false, message: msg };
    }

    const parsedPrice = Number(updatedData.price ?? origObj?.price ?? 2500);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      const msg = 'Tariff per night must be greater than zero.';
      showNotification(msg);
      return { success: false, message: msg };
    }

    const duplicateRoom = rooms.find(r => {
      const rNum = String(r.roomNumber || r.room_number || '').trim();
      if (rNum !== newRoomNum) return false;
      if (origObj?.id && r.id) return String(r.id) !== String(origObj.id);
      return rNum !== origRoomNum;
    });

    if (duplicateRoom) {
      const msg = `Room #${newRoomNum} already exists in inventory.`;
      showNotification(msg);
      return { success: false, message: msg };
    }

    const existingStatus = String(origObj?.status || 'VACANT_READY').toUpperCase();
    const isStayActive = existingStatus === 'OCCUPIED' || existingStatus === 'RESERVED';
    const nextHousekeeping = String(updatedData.housekeeping ?? origObj?.housekeeping ?? 'Clean').trim() || 'Clean';

    let nextStatus = existingStatus;
    if (!isStayActive) {
      if (updatedData.status) {
        nextStatus = String(updatedData.status).toUpperCase();
      } else if (nextHousekeeping.toLowerCase() === 'dirty') {
        nextStatus = 'DIRTY';
      } else if (nextHousekeeping.toLowerCase() === 'maintenance') {
        nextStatus = 'MAINTENANCE';
      } else {
        nextStatus = 'VACANT_READY';
      }
    }

    const nextType = String(updatedData.type ?? origObj?.type ?? origObj?.category ?? 'Standard Room').trim();
    const nextFloor = String(updatedData.floor ?? origObj?.floor ?? 'Floor 1').trim();
    const nextBed = String(updatedData.bed ?? origObj?.bed ?? 'King Bed').trim();
    const nextRoomTypeId =
      updatedData.roomTypeId ??
      origObj?.roomTypeId ??
      origObj?.room_type_id ??
      roomTypes.find(rt => String(rt.name || '').trim().toLowerCase() === nextType.toLowerCase())?.id ??
      null;
    const nextKeyCardNo =
      updatedData.keyCardNo !== undefined ? String(updatedData.keyCardNo).trim() : (origObj?.keyCardNo ?? origObj?.key_card_no ?? '');
    const nextPhoneExt =
      updatedData.phoneExtension !== undefined
        ? String(updatedData.phoneExtension).trim()
        : (origObj?.phoneExtension ?? origObj?.phone_extension ?? newRoomNum);
    const nextSmoking =
      updatedData.isSmoking !== undefined ? Boolean(updatedData.isSmoking) : Boolean(origObj?.isSmoking ?? origObj?.is_smoking);
    const nextInterconnecting =
      updatedData.interconnectingRoom !== undefined
        ? String(updatedData.interconnectingRoom).trim()
        : (origObj?.interconnectingRoom ?? origObj?.interconnecting_room ?? '');

    let savedRow = null;

    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        const rawId = origObj?.id ? String(origObj.id).trim() : null;
        const uuidId =
          rawId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId) ? rawId : null;

        const { data: rpcRow, error: rpcErr } = await supabase.rpc('admin_update_room', {
          p_hotel_id: currentHotel.id,
          p_original_room_number: origRoomNum || newRoomNum,
          p_new_room_number: newRoomNum,
          p_target_room_id: uuidId,
          p_room_type_id: nextRoomTypeId,
          p_floor: nextFloor,
          p_type: nextType,
          p_bed: nextBed,
          p_price: parsedPrice,
          p_key_card_no: nextKeyCardNo,
          p_is_smoking: nextSmoking,
          p_phone_extension: nextPhoneExt,
          p_housekeeping: nextHousekeeping,
          p_status: nextStatus,
          p_interconnecting_room: nextInterconnecting
        });

        if (rpcErr) {
          const isMissingRpc =
            /admin_update_room/i.test(rpcErr.message || '') &&
            /(could not find|does not exist|schema cache)/i.test(rpcErr.message || '');

          if (!isMissingRpc) {
            const errMsg = rpcErr.message || 'Failed to update room details.';
            showNotification(errMsg);
            return { success: false, message: errMsg };
          }

          // Fallback direct update if RPC isn't present in schema cache
          const directPayload = {
            room_number: newRoomNum,
            room_type_id: nextRoomTypeId || null,
            floor: nextFloor,
            type: nextType,
            bed: nextBed,
            price: parsedPrice,
            key_card_no: nextKeyCardNo || null,
            is_smoking: nextSmoking,
            phone_extension: nextPhoneExt || null,
            interconnecting_room: nextInterconnecting || null,
            housekeeping: nextHousekeeping,
            status: nextStatus,
            updated_at: new Date().toISOString()
          };

          let query = supabase.from('rooms').update(directPayload).eq('hotel_id', currentHotel.id);
          query = uuidId ? query.eq('id', uuidId) : query.eq('room_number', origRoomNum);
          const { data: fallbackData, error: fallbackErr } = await query
            .select('id, hotel_id, room_number, room_type_id, floor, type, bed, status, housekeeping, price, guest, booking_id, check_out, key_card_no, is_smoking, interconnecting_room, phone_extension, is_ota_locked, ota_channel')
            .maybeSingle();
          if (currentHotel?.id) invalidateCache(`pms:dashboard:${currentHotel.id}`);
          if (fallbackErr) {
            showNotification(fallbackErr.message || 'Failed to update room.');
            return { success: false, message: fallbackErr.message || 'Failed to update room.' };
          }
          savedRow = fallbackData;
        } else {
          savedRow = rpcRow;
        }
      } catch (err) {
        const msg = err?.message || 'Failed to update room details.';
        showNotification(msg);
        return { success: false, message: msg };
      }
    }

    const updatedRoomObj = {
      ...(origObj || {}),
      id: savedRow?.id || origObj?.id,
      hotelId: currentHotel?.id || origObj?.hotelId,
      roomNumber: savedRow?.room_number || newRoomNum,
      room_number: savedRow?.room_number || newRoomNum,
      roomTypeId: savedRow?.room_type_id ?? nextRoomTypeId,
      room_type_id: savedRow?.room_type_id ?? nextRoomTypeId,
      floor: savedRow?.floor || nextFloor,
      type: savedRow?.type || nextType,
      category: savedRow?.type || nextType,
      bed: savedRow?.bed || nextBed,
      status: savedRow?.status || nextStatus,
      housekeeping: savedRow?.housekeeping || nextHousekeeping,
      price: Number(savedRow?.price ?? parsedPrice),
      keyCardNo: savedRow?.key_card_no ?? nextKeyCardNo,
      key_card_no: savedRow?.key_card_no ?? nextKeyCardNo,
      isSmoking: savedRow?.is_smoking !== undefined ? Boolean(savedRow.is_smoking) : nextSmoking,
      is_smoking: savedRow?.is_smoking !== undefined ? Boolean(savedRow.is_smoking) : nextSmoking,
      phoneExtension: savedRow?.phone_extension ?? nextPhoneExt,
      phone_extension: savedRow?.phone_extension ?? nextPhoneExt,
      interconnectingRoom: savedRow?.interconnecting_room ?? nextInterconnecting
    };

    setRooms(prev =>
      prev.map(r => {
        const matchById = updatedRoomObj.id && r.id && String(r.id) === String(updatedRoomObj.id);
        const matchByNum = String(r.roomNumber || r.room_number) === origRoomNum;
        return matchById || matchByNum ? updatedRoomObj : r;
      }).sort(compareRoomsByCategoryAndNumber)
    );

    if (newRoomNum !== origRoomNum) {
      setReservations(prev =>
        prev.map(res => {
          const resNum = String(res.room_number || '').trim() || (String(res.room || '').match(/\b(\d+)\b/)?.[1] || '');
          if (resNum === origRoomNum || String(res.room || '').trim() === origRoomNum) {
            return { ...res, room_number: newRoomNum, room: `Room ${newRoomNum}` };
          }
          return res;
        })
      );
      setRestaurantTables(prev =>
        prev.map(t => (String(t.roomNumber || '') === origRoomNum ? { ...t, roomNumber: newRoomNum } : t))
      );
      setCabBookings(prev =>
        prev.map(c => (String(c.roomNumber || '') === origRoomNum ? { ...c, roomNumber: newRoomNum } : c))
      );
    }

    setEditingRoom(null);
    setIsCreateRoomModalOpenState(false);
    showNotification(
      newRoomNum !== origRoomNum
        ? `Room #${origRoomNum} updated and renamed to #${newRoomNum}.`
        : `Room #${newRoomNum} updated successfully.`
    );

    if (isSupabaseConfigured && currentHotel?.id) {
      scheduleRealtimeRefresh?.();
      broadcastCrossDeviceSync({
        action: 'room_update',
        hotelId: currentHotel.id,
        roomNumber: newRoomNum,
        previousRoomNumber: origRoomNum
      }).catch(() => {});
      pushHotelInventoryViaBackend({ hotelId: currentHotel.id }).catch(() => {});
    }

    return { success: true, room: updatedRoomObj };
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

  // =========================================================================
  // RESTAURANT POS & MENU CATALOG (100% hotel_id isolated + Realtime Synced)
  // =========================================================================
  const upsertRestaurantTable = async (tableInput) => {
    if (!currentHotel?.id) return { success: false, message: 'No active hotel session.' };
    const tableId = tableInput.id || `TBL-${currentHotel.id.slice(0, 6)}-${Date.now().toString().slice(-5)}`;
    const normalized = {
      id: tableId,
      hotelId: currentHotel.id,
      name: String(tableInput.name || '').trim(),
      area: String(tableInput.area || 'Main Dining').trim(),
      seats: Math.max(1, Number(tableInput.seats) || 4),
      status: tableInput.status || 'VACANT',
      guestName: tableInput.guestName ?? null,
      roomNumber: tableInput.roomNumber ?? null,
      itemsCount: Number(tableInput.itemsCount) || 0,
      total: Number(tableInput.total) || 0,
      activeOrderId: tableInput.activeOrderId ?? null,
      updatedAt: new Date().toISOString()
    };

    setRestaurantTables(prev => {
      const exists = prev.some(t => t.id === tableId);
      if (exists) return prev.map(t => t.id === tableId ? normalized : t);
      return [...prev, normalized];
    });

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('restaurant_tables').upsert({
        id: normalized.id,
        hotel_id: currentHotel.id,
        name: normalized.name,
        area: normalized.area,
        seats: normalized.seats,
        status: normalized.status,
        guest_name: normalized.guestName,
        room_number: normalized.roomNumber,
        items_count: normalized.itemsCount,
        current_total: normalized.total,
        active_order_id: normalized.activeOrderId,
        updated_at: normalized.updatedAt
      });
      if (error) {
        console.warn('Supabase restaurant_tables upsert error:', error);
        showNotification(`Table sync warning: ${error.message}`);
        return { success: false, error: error.message };
      }
    }
    return { success: true, table: normalized };
  };

  const deleteRestaurantTable = async (tableId) => {
    if (!currentHotel?.id || !tableId) return;
    setRestaurantTables(prev => prev.filter(t => t.id !== tableId));
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('id', tableId)
        .eq('hotel_id', currentHotel.id);
      if (error) showNotification(`Delete table error: ${error.message}`);
    }
  };

  const upsertRestaurantMenuItem = async (itemInput) => {
    if (!currentHotel?.id) return { success: false, message: 'No active hotel session.' };
    const itemId = itemInput.id || `MENU-${Date.now().toString().slice(-6)}`;
    const isVegVal = itemInput.isVeg !== undefined ? Boolean(itemInput.isVeg) : (itemInput.isVegetarian !== undefined ? Boolean(itemInput.isVegetarian) : true);
    const normalized = {
      id: itemId,
      hotelId: currentHotel.id,
      name: String(itemInput.name || '').trim(),
      category: String(itemInput.category || 'Main Course').trim(),
      kitchenStation: String(itemInput.kitchenStation || 'Hot Kitchen (Indian)').trim(),
      price: Math.max(0, Number(itemInput.price) || 0),
      costPrice: Math.max(0, Number(itemInput.costPrice) || 0),
      taxPct: Math.max(0, Number(itemInput.taxPct ?? 5)),
      unit: String(itemInput.unit || 'Portion').trim(),
      isVeg: isVegVal,
      isVegetarian: isVegVal,
      status: itemInput.status || 'AVAILABLE',
      prepTime: String(itemInput.prepTime || '15 mins').trim(),
      description: String(itemInput.description || '').trim(),
      imageUrl: String(itemInput.imageUrl || '').trim()
    };

    setRestaurantMenuItems(prev => {
      const exists = prev.some(m => m.id === itemId);
      if (exists) return prev.map(m => m.id === itemId ? normalized : m);
      return [normalized, ...prev];
    });

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('restaurant_menu_items').upsert({
        id: normalized.id,
        hotel_id: currentHotel.id,
        name: normalized.name,
        category: normalized.category,
        kitchen_station: normalized.kitchenStation,
        price: normalized.price,
        cost_price: normalized.costPrice,
        tax_pct: normalized.taxPct,
        unit: normalized.unit,
        is_veg: normalized.isVeg,
        status: normalized.status,
        prep_time: normalized.prepTime,
        description: normalized.description,
        image_url: normalized.imageUrl || null,
        updated_at: new Date().toISOString()
      });
      if (error) {
        console.warn('Supabase restaurant_menu_items upsert error:', error);
        showNotification(`Menu sync warning: ${error.message}`);
        return { success: false, error: error.message };
      }
    }
    return { success: true, item: normalized };
  };

  const deleteRestaurantMenuItem = async (itemId) => {
    if (!currentHotel?.id || !itemId) return;
    setRestaurantMenuItems(prev => prev.filter(m => m.id !== itemId));
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('restaurant_menu_items')
        .delete()
        .eq('id', itemId)
        .eq('hotel_id', currentHotel.id);
      if (error) showNotification(`Delete menu item error: ${error.message}`);
    }
  };

  const addFnbOrder = async (order) => {
    setFnbOrders(prev => [order, ...prev]);

    const cleanRoom = String(order.roomNumber || '').replace(/\D/g, '') ||
      (String(order.roomTable || '').match(/\b(?:Room\s*)?(\d{2,4})\b/i)?.[1] || '');

    if (cleanRoom && order.paymentStatus === 'BILLED_TO_ROOM') {
      await addFolioCharge(cleanRoom, {
        category: 'F&B',
        description: `Restaurant Dining (${order.orderId}): ${order.items}`,
        amount: Number(order.total) || 0,
        rate: Number(order.total) || 0,
        qty: 1
      });
    }

    if (order.tableId) {
      const resetAfterRoomPost = order.paymentStatus === 'BILLED_TO_ROOM';
      setRestaurantTables(prev => prev.map(t => {
        if (t.id !== order.tableId) return t;
        return resetAfterRoomPost
          ? { ...t, status: 'VACANT', guestName: null, roomNumber: null, itemsCount: 0, total: 0, activeOrderId: null }
          : {
              ...t,
              status: 'OCCUPIED',
              guestName: order.guest || 'Walk-in Guest',
              roomNumber: cleanRoom || null,
              itemsCount: (Number(t.itemsCount) || 0) + (Number(order.itemsCount) || 1),
              total: (Number(t.total) || 0) + (Number(order.total) || 0),
              activeOrderId: order.orderId
            };
      }));
    }

    if (isSupabaseConfigured && currentHotel?.id) {
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

        if (order.tableId) {
          const targetTbl = restaurantTables.find(t => t.id === order.tableId);
          const resetAfterRoomPost = order.paymentStatus === 'BILLED_TO_ROOM';
          await supabase
            .from('restaurant_tables')
            .update(
              resetAfterRoomPost
                ? {
                    status: 'VACANT',
                    guest_name: null,
                    room_number: null,
                    items_count: 0,
                    current_total: 0,
                    active_order_id: null,
                    updated_at: new Date().toISOString()
                  }
                : {
                    status: 'OCCUPIED',
                    guest_name: order.guest || 'Walk-in Guest',
                    room_number: cleanRoom || null,
                    items_count: (Number(targetTbl?.itemsCount) || 0) + (Number(order.itemsCount) || 1),
                    current_total: (Number(targetTbl?.total) || 0) + (Number(order.total) || 0),
                    active_order_id: order.orderId,
                    updated_at: new Date().toISOString()
                  }
            )
            .eq('id', order.tableId)
            .eq('hotel_id', currentHotel.id);
        }
      } catch (err) {
        console.warn('Supabase F&B insert error:', err);
      }
    }
  };

  const settleFnbOrder = async (orderId, paymentMode = 'UPI', tableId = null) => {
    if (orderId) {
      setFnbOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: 'BILLED' } : o));
    }
    if (tableId) {
      setRestaurantTables(prev => prev.map(t =>
        t.id === tableId
          ? { ...t, status: 'VACANT', guestName: null, roomNumber: null, itemsCount: 0, total: 0, activeOrderId: null }
          : t
      ));
    }
    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        if (orderId) {
          await supabase.from('fnb_orders').update({ status: 'BILLED' }).eq('id', orderId).eq('hotel_id', currentHotel.id);
        }
        if (tableId) {
          await supabase
            .from('restaurant_tables')
            .update({
              status: 'VACANT',
              guest_name: null,
              room_number: null,
              items_count: 0,
              current_total: 0,
              active_order_id: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', tableId)
            .eq('hotel_id', currentHotel.id);
        }
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

    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        const invId = !/\D/.test(cleanKey) ? `FOL-${currentHotel.id}-${cleanKey}` : `FOL-${cleanKey}`;
        await supabase.from('financial_invoices').upsert({
          id: invId,
          hotel_id: currentHotel.id,
          reservation_id: folioData.reservationId || cleanKey,
          room_number: cleanNum,
          client_name: folioData.guestName || 'In-House Guest',
          client_phone: folioData.phone || '',
          category: 'Room Stay & Folio Ledger',
          subtotal: Number(folioData.subtotal || 0),
          cgst: folioData.isGstEnabled ? Number(folioData.cgstAmount || 0) : 0,
          sgst: folioData.isGstEnabled ? Number(folioData.sgstAmount || 0) : 0,
          total_amount: Number(folioData.grandTotal || 0),
          paid_amount: Number(folioData.totalPaid || 0),
          payment_mode: folioData.paymentEntries?.[folioData.paymentEntries.length - 1]?.mode || 'UPI',
          status: (Number(folioData.balanceDue || 0) <= 0 && Number(folioData.totalPaid || 0) > 0) ? 'SETTLED' : 'PENDING',
          notes: JSON.stringify({
            folioItems: folioData.folioItems || [],
            paymentEntries: folioData.paymentEntries || [],
            discountPercent: folioData.discountPercent || 0,
            isGstEnabled: Boolean(folioData.isGstEnabled)
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

    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        const { error } = await supabase
          .from('reservations')
          .update({
            payment: newPayment,
            paid: Number(paid) || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', reservationId)
          .eq('hotel_id', currentHotel.id);
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
    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        await supabase.from('cab_bookings').update({
          booking_status: updates.bookingStatus || updates.booking_status,
          payment_status: updates.paymentStatus || updates.payment_status,
          driver_name: updates.driverName || updates.driver_name,
          driver_phone: updates.driverPhone || updates.driver_phone,
          vehicle_number: updates.vehicleNumber || updates.vehicle_number,
          fare: updates.fare !== undefined ? Number(updates.fare) : undefined
        }).eq('id', bookingId).eq('hotel_id', currentHotel.id);
      } catch (err) {
        console.warn('Supabase cab booking update error:', err);
      }
    }
    showNotification(`Cab booking #${bookingId} updated.`);
  };

  const deleteCabBooking = async (bookingId) => {
    setCabBookings(prev => prev.filter(b => b.id !== bookingId));
    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        await supabase.from('cab_bookings').delete().eq('id', bookingId).eq('hotel_id', currentHotel.id);
      } catch (err) {
        console.warn('Supabase cab booking delete error:', err);
      }
    }
    showNotification(`Cab booking #${bookingId} deleted.`);
  };

  // Update Customer / Guest Real Name (1 atomic RPC call, zero redundant refetches)
  const updateReservationGuestName = async (reservationId, newGuestName) => {
    const resId = String(reservationId || '').trim();
    const cleanName = String(newGuestName || '').trim().slice(0, 150);

    if (!resId) {
      const msg = 'Reservation ID is required to update customer name.';
      showNotification(msg, 'error');
      return { success: false, message: msg };
    }

    if (!cleanName) {
      const msg = 'Customer name cannot be empty.';
      showNotification(msg, 'error');
      return { success: false, message: msg };
    }

    const matchedRes = reservations.find(r => String(r.id) === resId);
    if (matchedRes && String(matchedRes.guest || '').trim() === cleanName) {
      return { success: true, guest: cleanName, unchanged: true };
    }

    const nowIso = new Date().toISOString();

    if (isSupabaseConfigured && currentHotel?.id) {
      recentLocalGuestEditRef.current = { id: resId, until: Date.now() + 3500 };
      try {
        const { error: rpcErr } = await supabase.rpc('admin_update_reservation_guest_name', {
          p_hotel_id: currentHotel.id,
          p_reservation_id: resId,
          p_guest_name: cleanName
        });

        if (rpcErr) {
          const isMissingRpc =
            /admin_update_reservation_guest_name/i.test(rpcErr.message || '') &&
            /(could not find|does not exist|schema cache)/i.test(rpcErr.message || '');

          if (!isMissingRpc) {
            recentLocalGuestEditRef.current = { id: null, until: 0 };
            const errMsg = rpcErr.message || 'Failed to update customer name.';
            showNotification(errMsg, 'error');
            return { success: false, message: errMsg };
          }

          // Graceful fallback if RPC isn't yet deployed: minimal targeted updates only
          const { error: resErr } = await supabase
            .from('reservations')
            .update({ guest: cleanName, updated_at: nowIso })
            .eq('id', resId)
            .eq('hotel_id', currentHotel.id);

          if (resErr) {
            recentLocalGuestEditRef.current = { id: null, until: 0 };
            const errMsg = resErr.message || 'Failed to update customer name.';
            showNotification(errMsg, 'error');
            return { success: false, message: errMsg };
          }

          const hasLinkedRoom = rooms.some(rm => String(rm.bookingId || rm.booking_id || '') === resId);
          if (hasLinkedRoom) {
            await supabase
              .from('rooms')
              .update({ guest: cleanName, updated_at: nowIso })
              .eq('hotel_id', currentHotel.id)
              .eq('booking_id', resId);
          }

          const hasSavedFolio = Boolean(folios[resId]);
          if (hasSavedFolio) {
            await supabase
              .from('financial_invoices')
              .update({ client_name: cleanName, updated_at: nowIso })
              .eq('hotel_id', currentHotel.id)
              .eq('reservation_id', resId);
          }
        }
        invalidateCache(`pms:dashboard:${currentHotel.id}`);
      } catch (err) {
        recentLocalGuestEditRef.current = { id: null, until: 0 };
        const errMsg = err?.message || 'Failed to update customer name.';
        showNotification(errMsg, 'error');
        return { success: false, message: errMsg };
      }
    }

    setReservations(prev =>
      prev.map(r => (String(r.id) === resId ? { ...r, guest: cleanName } : r))
    );

    setRooms(prev =>
      prev.map(rm =>
        String(rm.bookingId || rm.booking_id || '') === resId
          ? { ...rm, guest: cleanName }
          : rm
      )
    );

    setFolios(prev => {
      let changed = false;
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        const f = next[k];
        if (f && (String(k) === resId || String(f.reservationId || '') === resId)) {
          next[k] = { ...f, guestName: cleanName, updatedAt: nowIso };
          changed = true;
        }
      });
      return changed ? next : prev;
    });

    setSelectedReservationDetails(prev =>
      prev && String(prev.id) === resId ? { ...prev, guest: cleanName } : prev
    );

    showNotification(`Customer name updated to "${cleanName}".`);
    return { success: true, guest: cleanName };
  };

  // Full Admin Check-In Action
  const checkInReservation = async (reservationId, checkInData) => {
    const {
      roomNumber,
      guestName,
      actualCheckInTime,
      expectedCheckOutTime,
      idType = 'Aadhaar Card',
      idNumber = '',
      idCity = '',
      collectedAmount = 0,
      paymentMode = 'CASH',
      paymentRef = ''
    } = checkInData;

    const cleanGuestName = String(guestName || '').trim().slice(0, 150);

    const normalizeIsoTimestamp = (val) => {
      if (!val) return new Date().toISOString();
      const raw = String(val).trim();
      const normalized = raw.includes(' ') && !raw.includes('T') ? raw.replace(' ', 'T') : raw;
      const parsed = new Date(normalized);
      return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    };

    const checkInIso = normalizeIsoTimestamp(actualCheckInTime);
    const currentRes = reservations.find(r => r.id === reservationId);
    let updatedRes = null;

    if (currentRes) {
      const totalAmount = Number(currentRes.amount || currentRes.price || 0);
      const existingPaid = Number(currentRes.paid || 0);
      const newPaid = existingPaid + Number(collectedAmount);
      const newDue = Math.max(0, totalAmount - newPaid);
      const newPaymentStatus = newDue <= 0 ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'PENDING');

      updatedRes = {
        ...currentRes,
        guest: cleanGuestName || currentRes.guest,
        status: 'CHECKED_IN',
        room: roomNumber ? `Room ${roomNumber}` : currentRes.room,
        room_number: roomNumber || currentRes.room_number,
        actualCheckInTime: checkInIso,
        actual_check_in_time: checkInIso,
        expectedCheckOutTime: expectedCheckOutTime || currentRes.checkOut || currentRes.check_out,
        expected_check_out_time: expectedCheckOutTime || currentRes.checkOut || currentRes.check_out,
        idType,
        idNumber,
        idCity,
        paid: newPaid,
        due: newDue,
        payment: newPaymentStatus,
        paymentMode,
        paymentRef
      };
    }

    setReservations(prev => prev.map(r => (r.id === reservationId && updatedRes ? updatedRes : r)));

    // Persist reservation check-in FIRST so DB triggers sync atomically before room update
    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        const cleanRoomNum = roomNumber ? (String(roomNumber).replace(/\D/g, '') || String(roomNumber)) : undefined;
        const { error: resCheckInError } = await supabase.from('reservations').update({
          ...(cleanGuestName ? { guest: cleanGuestName } : {}),
          status: 'CHECKED_IN',
          room: roomNumber ? `Room ${cleanRoomNum || roomNumber}` : undefined,
          room_number: cleanRoomNum || undefined,
          actual_check_in_time: checkInIso,
          expected_check_out_time: expectedCheckOutTime || undefined,
          guest_id_type: idType,
          guest_id_number: idNumber,
          guest_id_city: idCity || undefined,
          paid: updatedRes?.paid,
          payment: updatedRes?.payment,
          payment_mode: paymentMode,
          updated_at: new Date().toISOString()
        }).eq('id', reservationId).eq('hotel_id', currentHotel.id);

        if (resCheckInError) {
          console.error('Supabase reservation check-in update error:', resCheckInError);
          showNotification?.(`Check-in failed to save: ${resCheckInError.message}`, 'error');
          scheduleRealtimeRefresh?.();
          return;
        }
      } catch (err) {
        console.warn('Supabase reservation check-in update error:', err);
        showNotification?.(`Check-in failed to save: ${err?.message || 'Unknown error'}`, 'error');
        scheduleRealtimeRefresh?.();
        return;
      }
    }

    // Update physical room status from RESERVED/VACANT -> OCCUPIED
    if (roomNumber) {
      const cleanNum = String(roomNumber).replace(/\D/g, '') || String(roomNumber);
      setRooms(prev => prev.map(rm => {
        const matchNum = String(rm.roomNumber || rm.room_number || rm.number).replace(/\D/g, '');
        if (matchNum === cleanNum) {
          return {
            ...rm,
            status: 'OCCUPIED',
            guest: updatedRes?.guest || rm.guest,
            bookingId: reservationId,
            booking_id: reservationId
          };
        }
        return rm;
      }));

      if (isSupabaseConfigured && currentHotel?.id) {
        try {
          const { error: roomCheckInError } = await supabase.from('rooms').update({
            status: 'OCCUPIED',
            guest: updatedRes?.guest || 'Checked-in Guest',
            booking_id: reservationId,
            updated_at: new Date().toISOString()
          }).eq('hotel_id', currentHotel.id).eq('room_number', cleanNum);

          if (roomCheckInError) {
            console.warn('Supabase room check-in update error:', roomCheckInError);
            showNotification?.(`Room ${cleanNum} status sync warning: ${roomCheckInError.message}`, 'warning');
          }
        } catch (err) {
          console.warn('Supabase room check-in update error:', err);
        }
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

    await broadcastCrossDeviceSync({ action: 'checkin', hotelId: currentHotel?.id, bookingId: reservationId, roomNumber });
    if (currentHotel?.id) {
      pushHotelInventoryViaBackend({
        hotelId: currentHotel.id,
        hotelCode: currentHotel.aiosellHotelCode || currentHotel.slug
      }).catch(() => null);
    }
    showNotification(`Guest successfully checked into Room ${roomNumber || ''}! Status: CHECKED IN`);
    return updatedRes;
  };

  // Admin Check-Out Action
  const checkOutReservation = async (reservationId) => {
    const checkoutIso = new Date().toISOString();
    const todayStr = getLocalTodayStr();
    const matchedRes = reservations.find(r => r.id === reservationId);
    const matchedCi = String(matchedRes?.check_in || matchedRes?.checkIn || '').slice(0, 10);
    if (matchedRes && matchedCi && matchedCi > todayStr && !matchedRes.actualCheckInTime && !matchedRes.actual_check_in_time) {
      showNotification(`Cannot check out future booking #${reservationId} before its arrival date (${matchedCi}).`, 'error');
      return;
    }
    const rawTargetRoom = matchedRes
      ? (matchedRes.room_number || String(matchedRes.room || '').replace(/\D/g, ''))
      : null;
    const targetRoom = rawTargetRoom ? (String(rawTargetRoom).replace(/\D/g, '') || String(rawTargetRoom)) : null;

    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        const { error: resCheckOutError } = await supabase.from('reservations').update({
          status: 'CHECKED_OUT',
          actual_check_out_time: checkoutIso,
          updated_at: checkoutIso
        }).eq('id', reservationId).eq('hotel_id', currentHotel.id);

        if (resCheckOutError) {
          console.error('Supabase reservation check-out update error:', resCheckOutError);
          showNotification?.(`Check-out failed to save: ${resCheckOutError.message}`, 'error');
          scheduleRealtimeRefresh?.();
          return;
        }
      } catch (err) {
        console.warn('Supabase reservation check-out update error:', err);
        showNotification?.(`Check-out failed to save: ${err?.message || 'Unknown error'}`, 'error');
        scheduleRealtimeRefresh?.();
        return;
      }
    }

    setReservations(prev => prev.map(r => {
      if (r.id === reservationId) {
        return {
          ...r,
          status: 'CHECKED_OUT',
          actualCheckOutTime: checkoutIso,
          actual_check_out_time: checkoutIso
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
            bookingId: null,
            booking_id: null,
            checkOut: null,
            check_out: null,
            isOtaLocked: false,
            is_ota_locked: false,
            otaChannel: ''
          };
        }
        return rm;
      }));

      if (isSupabaseConfigured && currentHotel?.id) {
        try {
          // Ensure any other lingering CHECKED_IN reservations for this room are also closed
          await supabase.from('reservations').update({
            status: 'CHECKED_OUT',
            actual_check_out_time: checkoutIso,
            updated_at: checkoutIso
          }).eq('hotel_id', currentHotel.id).eq('room_number', String(targetRoom)).in('status', ['CHECKED_IN', 'CHECKEDIN']);

          const { error: roomCheckOutError } = await supabase.from('rooms').update({
            status: 'DIRTY',
            guest: null,
            booking_id: null,
            check_out: null,
            is_ota_locked: false,
            ota_channel: null,
            updated_at: checkoutIso
          }).eq('hotel_id', currentHotel.id).eq('room_number', String(targetRoom));

          if (roomCheckOutError) {
            console.warn('Supabase room check-out update error:', roomCheckOutError);
            showNotification?.(`Room ${targetRoom} dirty-state sync warning: ${roomCheckOutError.message}`, 'warning');
          }
        } catch (err) {
          console.warn('Supabase room check-out update error:', err);
        }

        // Only insert client HK turnover task if the DB trigger didn't already create one
        try {
          const { data: existingHk } = await supabase
            .from('housekeeping_tasks')
            .select('id')
            .eq('hotel_id', currentHotel.id)
            .eq('room_number', String(targetRoom))
            .eq('status', 'PENDING')
            .limit(1);

          if (!existingHk || existingHk.length === 0) {
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
          }
        } catch (e) { }
      }
    }

    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        scheduleRealtimeRefresh?.();
        await broadcastCrossDeviceSync({ action: 'checkout', hotelId: currentHotel.id, bookingId: reservationId, roomNumber: targetRoom });
        pushHotelInventoryViaBackend({
          hotelId: currentHotel.id,
          hotelCode: currentHotel.aiosellHotelCode || currentHotel.slug
        }).catch(() => null);
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

    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        await supabase.from('reservations').update({
          paid: updatedRes?.paid,
          payment: updatedRes?.payment,
          payment_mode: paymentMethod,
          updated_at: new Date().toISOString()
        }).eq('id', reservationId).eq('hotel_id', currentHotel.id);
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

  // Add reservation (AuraStay Schema Synchronization)
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
    playBookingBellSound();
    showNotification(`Reservation ${resId} confirmed for ${reservation.guest}`);
    setIsCreateReservationModalOpen(false);

    // ONLY update physical room status if booking covers TODAY (future bookings must stay VACANT until arrival day!)
    const todayStr = getLocalTodayStr();
    const resCheckIn = String(reservation.check_in || '').slice(0, 10);
    const resCheckOut = String(reservation.check_out || '').slice(0, 10);
    const coversToday = Boolean(resCheckIn && resCheckIn <= todayStr && (!resCheckOut || resCheckOut > todayStr));
    const targetRoomStatus = reservation.status === 'CHECKED_IN' && coversToday ? 'OCCUPIED' : 'RESERVED';
    const checkInTimeIfCheckedIn = reservation.status === 'CHECKED_IN' && coversToday ? new Date().toISOString() : null;

    if (cleanRoomNum && coversToday) {
      setRooms(prev => prev.map(r => {
        if (normalizeRoomNum(r.room_number || r.roomNumber) === normalizeRoomNum(cleanRoomNum)) {
          // Do not overwrite an actively OCCUPIED room unless explicitly checking in
          if (String(r.status || '').toUpperCase() === 'OCCUPIED' && targetRoomStatus !== 'OCCUPIED') {
            return r;
          }
          return {
            ...r,
            status: targetRoomStatus,
            guest: reservation.guest,
            bookingId: resId,
            booking_id: resId,
            checkOut: reservation.check_out,
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
          actual_check_in_time: checkInTimeIfCheckedIn,
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

        if (cleanRoomNum && currentHotel?.id && coversToday) {
          await supabase.from('rooms').update({
            status: targetRoomStatus,
            guest: reservation.guest,
            booking_id: resId,
            check_out: reservation.check_out
          }).eq('hotel_id', currentHotel.id).eq('room_number', cleanRoomNum).neq('status', 'OCCUPIED');
        }
        await broadcastCrossDeviceSync({
          action: 'book',
          hotelId: currentHotel.id,
          bookingId: resId,
          guestName: reservation.guest,
          roomNumber: cleanRoomNum
        });
        pushHotelInventoryViaBackend({
          hotelId: currentHotel.id,
          hotelCode: currentHotel.aiosellHotelCode || currentHotel.slug,
          startDate: reservation.check_in,
          endDate: reservation.check_out
        }).catch(() => null);
      } catch (err) {
        console.warn('Supabase reservation insert sync:', err);
      }
    }
  };

  // =========================================================================
  // AURASTAY HOTEL OPERATIONAL LOGIC & WORKFLOWS
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

  // 1. Shift Room (Atomic 1-call transfer: marks old room VACANT_READY, updates room_number + folio)
  const shiftRoom = async (sourceRoomNumber, targetRoomNumber, reason = 'Guest Request', explicitReservationId = null) => {
    const srcRaw = String(sourceRoomNumber || '').trim();
    const tgtRaw = String(targetRoomNumber || '').trim();
    const srcNorm = normalizeRoomNum(srcRaw);
    const tgtNorm = normalizeRoomNum(tgtRaw);

    if (!srcNorm || !tgtNorm) {
      showNotification('Source and target room numbers are required.', 'error');
      return false;
    }
    if (srcNorm === tgtNorm) {
      showNotification('Target room must be different from the current room.', 'error');
      return false;
    }

    const sourceRoomObj = rooms.find(r => normalizeRoomNum(r.room_number || r.roomNumber) === srcNorm);
    const targetRoomObj = rooms.find(r => normalizeRoomNum(r.room_number || r.roomNumber) === tgtNorm);

    if (!targetRoomObj) {
      showNotification(`Target room ${tgtRaw} does not exist.`, 'error');
      return false;
    }

    const todayStr = getLocalTodayStr();
    const srcExactNum = String(sourceRoomObj?.room_number || sourceRoomObj?.roomNumber || srcRaw).trim();
    const tgtExactNum = String(targetRoomObj.room_number || targetRoomObj.roomNumber || tgtRaw).trim();

    // Resolve exact active reservation to shift (explicit ID -> room's today active stay -> linked booking_id)
    const srcState = sourceRoomObj ? resolveRoomTodayState(sourceRoomObj, reservations, todayStr) : null;
    const activeRes =
      (explicitReservationId && reservations.find(r => String(r.id) === String(explicitReservationId))) ||
      srcState?.activeReservation ||
      (sourceRoomObj?.booking_id || sourceRoomObj?.bookingId
        ? reservations.find(r => String(r.id) === String(sourceRoomObj.booking_id || sourceRoomObj.bookingId))
        : null) ||
      null;

    // Validate target room isn't already occupied/reserved for today (unless shifting a non-overlapping future stay)
    const tgtState = resolveRoomTodayState(targetRoomObj, reservations, todayStr);
    if (tgtState.isBlocked) {
      showNotification(`Target Room #${tgtExactNum} is currently blocked for maintenance.`, 'error');
      return false;
    }

    const resStatusUpper = String(activeRes?.status || '').toUpperCase();
    const resCi = String(activeRes?.check_in || activeRes?.checkIn || '').slice(0, 10);
    const resCo = String(activeRes?.check_out || activeRes?.checkOut || '').slice(0, 10);
    const resCoversToday = Boolean(!resCi || (resCi <= todayStr && (!resCo || resCo > todayStr)));

    if (resCoversToday && (tgtState.isOccupied || tgtState.isReserved)) {
      showNotification(`Target Room #${tgtExactNum} is already ${tgtState.effectiveStatus}. Please choose a vacant room.`, 'error');
      return false;
    }

    let resolvedSourceStatus = 'VACANT_READY';
    let resolvedTargetStatus =
      activeRes
        ? (['CHECKED_IN', 'CHECKEDIN', 'OCCUPIED'].includes(resStatusUpper) && (!resCi || resCi <= todayStr)
            ? 'OCCUPIED'
            : (['CONFIRMED', 'PENDING', 'RESERVED'].includes(resStatusUpper) && resCoversToday
                ? 'RESERVED'
                : String(targetRoomObj.status || 'VACANT_READY')))
        : (String(sourceRoomObj?.status || '').toUpperCase() === 'RESERVED' ? 'RESERVED' : 'OCCUPIED');
    let resolvedResId = activeRes?.id || sourceRoomObj?.booking_id || sourceRoomObj?.bookingId || null;
    let resolvedGuest = activeRes?.guest || sourceRoomObj?.guest || null;
    let resolvedCheckOut = activeRes?.check_out || activeRes?.checkOut || sourceRoomObj?.check_out || sourceRoomObj?.checkOut || null;
    let resolvedTargetType = targetRoomObj.type || targetRoomObj.category || 'Standard Room';

    // Persist atomically in 1 single RPC call (Free-Tier Nano optimized)
    if (isSupabaseConfigured && currentHotel?.id) {
      recentLocalShiftRef.current = {
        resId: resolvedResId,
        rooms: [srcNorm, tgtNorm],
        until: Date.now() + 4000
      };

      try {
        const { data: rpcResult, error: rpcErr } = await supabase.rpc('admin_shift_room', {
          p_hotel_id: currentHotel.id,
          p_source_room_number: srcExactNum,
          p_target_room_number: tgtExactNum,
          p_reservation_id: resolvedResId ? String(resolvedResId) : null,
          p_reason: reason || 'Guest Request'
        });

        if (rpcErr) {
          const isMissingRpc =
            /admin_shift_room/i.test(rpcErr.message || '') &&
            /(could not find|does not exist|schema cache)/i.test(rpcErr.message || '');

          if (!isMissingRpc) {
            recentLocalShiftRef.current = { resId: null, rooms: [], until: 0 };
            showNotification(rpcErr.message || 'Failed to shift room.', 'error');
            return false;
          }

          // Graceful fallback if RPC isn't yet installed: update reservation room_number + clear old room to VACANT_READY
          const nowIso = new Date().toISOString();
          if (resolvedResId) {
            const { error: resErr } = await supabase
              .from('reservations')
              .update({
                room: `Room ${tgtExactNum} - ${resolvedTargetType}`,
                room_number: tgtExactNum,
                room_type: resolvedTargetType,
                updated_at: nowIso
              })
              .eq('hotel_id', currentHotel.id)
              .eq('id', resolvedResId);
            if (resErr) throw resErr;
          }

          await supabase
            .from('rooms')
            .update({
              status: 'VACANT_READY',
              housekeeping: 'Clean',
              guest: null,
              booking_id: null,
              check_out: null,
              is_ota_locked: false,
              ota_channel: null,
              updated_at: nowIso
            })
            .eq('hotel_id', currentHotel.id)
            .eq('room_number', srcExactNum);

          if (resolvedTargetStatus === 'OCCUPIED' || resolvedTargetStatus === 'RESERVED') {
            await supabase
              .from('rooms')
              .update({
                status: resolvedTargetStatus,
                housekeeping: 'Clean',
                guest: resolvedGuest,
                booking_id: resolvedResId,
                check_out: resolvedCheckOut,
                updated_at: nowIso
              })
              .eq('hotel_id', currentHotel.id)
              .eq('room_number', tgtExactNum);
          }

          if (resolvedResId && folios[resolvedResId]) {
            await supabase
              .from('financial_invoices')
              .update({ room_number: tgtExactNum, updated_at: nowIso })
              .eq('hotel_id', currentHotel.id)
              .eq('reservation_id', resolvedResId);
          }
        } else if (rpcResult) {
          resolvedSourceStatus = rpcResult.sourceStatus || 'VACANT_READY';
          resolvedTargetStatus = rpcResult.targetStatus || resolvedTargetStatus;
          resolvedResId = rpcResult.reservationId ?? resolvedResId;
          resolvedGuest = rpcResult.guest ?? resolvedGuest;
          resolvedCheckOut = rpcResult.checkOut ?? resolvedCheckOut;
          resolvedTargetType = rpcResult.targetType || resolvedTargetType;
        }

        invalidateCache(`pms:dashboard:${currentHotel.id}`);
      } catch (err) {
        recentLocalShiftRef.current = { resId: null, rooms: [], until: 0 };
        console.warn('Supabase shift room sync:', err);
        showNotification(err?.message || 'Failed to shift room.', 'error');
        return false;
      }
    }

    // Update local React state synchronously (0 extra SELECT queries!)
    setRooms(prev =>
      prev.map(r => {
        const rNorm = normalizeRoomNum(r.room_number || r.roomNumber);
        if (rNorm === srcNorm) {
          return {
            ...r,
            status: resolvedSourceStatus,
            housekeeping: 'Clean',
            guest: null,
            bookingId: null,
            booking_id: null,
            checkOut: null,
            check_out: null,
            isOtaLocked: false,
            is_ota_locked: false,
            otaChannel: ''
          };
        }
        if (rNorm === tgtNorm && (resolvedTargetStatus === 'OCCUPIED' || resolvedTargetStatus === 'RESERVED')) {
          return {
            ...r,
            status: resolvedTargetStatus,
            housekeeping: 'Clean',
            guest: resolvedGuest || r.guest,
            bookingId: resolvedResId || r.bookingId,
            booking_id: resolvedResId || r.booking_id,
            checkOut: resolvedCheckOut || r.checkOut,
            check_out: resolvedCheckOut || r.check_out,
            isOtaLocked: Boolean(sourceRoomObj?.isOtaLocked || sourceRoomObj?.is_ota_locked),
            is_ota_locked: Boolean(sourceRoomObj?.isOtaLocked || sourceRoomObj?.is_ota_locked),
            otaChannel: sourceRoomObj?.otaChannel || sourceRoomObj?.ota_channel || ''
          };
        }
        return r;
      })
    );

    if (resolvedResId) {
      setReservations(prev =>
        prev.map(r =>
          String(r.id) === String(resolvedResId)
            ? {
                ...r,
                room: `Room ${tgtExactNum} - ${resolvedTargetType}`,
                room_number: tgtExactNum,
                room_type: resolvedTargetType
              }
            : r
        )
      );

      setFolios(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(k => {
          const f = next[k];
          if (f && (String(k) === String(resolvedResId) || String(f.reservationId || '') === String(resolvedResId))) {
            next[k] = { ...f, roomNumber: tgtExactNum };
            changed = true;
          }
        });
        if (next[srcExactNum] && (!resolvedResId || String(next[srcExactNum].reservationId || '') === String(resolvedResId))) {
          next[tgtExactNum] = { ...next[srcExactNum], roomNumber: tgtExactNum };
          delete next[srcExactNum];
          changed = true;
        }
        return changed ? next : prev;
      });
    }

    showNotification(`Room shifted from #${srcExactNum} to #${tgtExactNum} (${reason}). Room #${srcExactNum} is now Vacant.`);
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

    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        await supabase.from('reservations').update({ check_out: newCheckOutDate }).eq('hotel_id', currentHotel.id).eq('id', reservationId);
        await supabase.from('rooms').update({ check_out: newCheckOutDate }).eq('hotel_id', currentHotel.id).eq('room_number', num);
      } catch (err) {
        console.warn('Supabase extend stay sync:', err);
      }
    }
    return true;
  };

  // 3. Checkout Room
  const checkoutRoom = async (roomNumber, reservationId) => {
    const num = String(roomNumber).trim();
    const cleanNum = num.replace(/\D/g, '') || num;
    const checkoutIso = new Date().toISOString();
    const todayStr = getLocalTodayStr();

    const targetRoomObj = rooms.find(rm => {
      const rmNum = String(rm.roomNumber || rm.room_number || rm.number || '').trim();
      const rmClean = rmNum.replace(/\D/g, '') || rmNum;
      return rmClean === cleanNum;
    });
    const roomBookingId = targetRoomObj?.bookingId || targetRoomObj?.booking_id || null;

    const activeForRoom = reservations.filter(r => {
      const st = String(r.status || '').toUpperCase();
      if (['CHECKED_OUT', 'CHECKEDOUT', 'CANCELLED', 'NO_SHOW'].includes(st)) return false;
      const ci = String(r.check_in || r.checkIn || '').slice(0, 10);
      // Never allow checkoutRoom to accidentally check out a future upcoming booking
      if (ci && ci > todayStr && !r.actualCheckInTime && !r.actual_check_in_time) return false;
      const resNorm = extractReservationRoomNum(r);
      return resNorm === normalizeRoomNum(cleanNum);
    });

    const matchedRes = reservationId
      ? reservations.find(r => r.id === reservationId)
      : (
          activeForRoom.find(r => roomBookingId && String(r.id) === String(roomBookingId)) ||
          activeForRoom.find(r => ['CHECKED_IN', 'CHECKEDIN', 'OCCUPIED'].includes(String(r.status || '').toUpperCase())) ||
          activeForRoom[0]
        );

    const matchedCi = String(matchedRes?.check_in || matchedRes?.checkIn || '').slice(0, 10);
    if (matchedRes && matchedCi && matchedCi > todayStr && !matchedRes.actualCheckInTime && !matchedRes.actual_check_in_time) {
      showNotification(`Cannot check out future booking #${matchedRes.id} before its arrival date (${matchedCi}).`, 'error');
      return;
    }

    const resolvedResId = matchedRes?.id || null;

    if (resolvedResId) {
      setReservations(prev => prev.map(r => {
        if (r.id === resolvedResId) {
          return {
            ...r,
            status: 'CHECKED_OUT',
            actualCheckOutTime: checkoutIso,
            actual_check_out_time: checkoutIso
          };
        }
        return r;
      }));
    }

    setRooms(prev => prev.map(r => {
      if (String(r.room_number || r.roomNumber) === num || String(r.room_number || r.roomNumber).replace(/\D/g, '') === cleanNum) {
        return {
          ...r,
          status: 'DIRTY',
          guest: null,
          bookingId: null,
          booking_id: null,
          checkOut: null,
          check_out: null,
          isOtaLocked: false,
          is_ota_locked: false,
          otaChannel: ''
        };
      }
      return r;
    }));

    showNotification(`Room #${num} checked out. Room marked DIRTY for housekeeping turnover.`);

    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        // Persist reservation checkout FIRST so triggers & DB state stay consistent before updating room
        if (resolvedResId) {
          const { error: resCheckOutError } = await supabase.from('reservations').update({
            status: 'CHECKED_OUT',
            actual_check_out_time: checkoutIso,
            updated_at: checkoutIso
          }).eq('hotel_id', currentHotel.id).eq('id', resolvedResId);

          if (resCheckOutError) {
            console.error('Supabase reservation checkoutRoom error:', resCheckOutError);
            showNotification?.(`Check-out failed to save: ${resCheckOutError.message}`, 'error');
            scheduleRealtimeRefresh?.();
            return;
          }
        }

        // Also close any other lingering CHECKED_IN reservations on this room (never future bookings)
        const { error: staleCheckOutError } = await supabase.from('reservations').update({
          status: 'CHECKED_OUT',
          actual_check_out_time: checkoutIso,
          updated_at: checkoutIso
        }).eq('hotel_id', currentHotel.id).eq('room_number', cleanNum).in('status', ['CHECKED_IN', 'CHECKEDIN']).lte('check_in', todayStr);

        if (staleCheckOutError) {
          console.warn('Supabase stale check-in cleanup warning:', staleCheckOutError);
        }

        const { error: roomCheckOutError } = await supabase.from('rooms').update({
          status: 'DIRTY',
          guest: null,
          booking_id: null,
          check_out: null,
          is_ota_locked: false,
          ota_channel: null,
          updated_at: checkoutIso
        }).eq('hotel_id', currentHotel.id).eq('room_number', cleanNum);

        if (roomCheckOutError) {
          console.error('Supabase room checkout update error:', roomCheckOutError);
          showNotification?.(`Room ${cleanNum} dirty-state sync warning: ${roomCheckOutError.message}`, 'warning');
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

        await broadcastCrossDeviceSync({
          action: 'checkout',
          hotelId: currentHotel.id,
          bookingId: resolvedResId,
          roomNumber: num
        });
        pushHotelInventoryViaBackend({
          hotelId: currentHotel.id,
          hotelCode: currentHotel.aiosellHotelCode || currentHotel.slug
        }).catch(() => null);
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

    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        await supabase.from('rooms').update({ status: 'MAINTENANCE' }).eq('hotel_id', currentHotel.id).eq('room_number', num);
        pushHotelInventoryViaBackend({
          hotelId: currentHotel.id,
          hotelCode: currentHotel.aiosellHotelCode || currentHotel.slug
        }).catch(() => null);
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

    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        await supabase.from('rooms').update({ status: 'VACANT_READY' }).eq('hotel_id', currentHotel.id).eq('room_number', num);
        pushHotelInventoryViaBackend({
          hotelId: currentHotel.id,
          hotelCode: currentHotel.aiosellHotelCode || currentHotel.slug
        }).catch(() => null);
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

    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        await supabase.from('rooms').update({ status: newStatus }).eq('hotel_id', currentHotel.id).eq('room_number', num);
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
      restaurantTables,
      setRestaurantTables,
      restaurantMenuItems,
      setRestaurantMenuItems,
      upsertRestaurantTable,
      deleteRestaurantTable,
      upsertRestaurantMenuItem,
      deleteRestaurantMenuItem,
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
      updateReservationGuestName,
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
      reservationPrefill,
      openCreateReservationModal,
      roomTypes,
      setRoomTypes,
      addRoomType,
      updateRoomType,
      deleteRoomType,
      isCreateRoomTypeModalOpen,
      setIsCreateRoomTypeModalOpen,
      editingRoomType,
      setEditingRoomType,
      openCreateRoomTypeModal,
      openEditRoomTypeModal,
      isCreateRoomModalOpen,
      setIsCreateRoomModalOpen,
      editingRoom,
      setEditingRoom,
      openCreateRoomModal,
      openEditRoomModal,
      addRoom,
      updateRoom,
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
      checkoutConfirmData,
      isCheckoutConfirmOpen,
      requestCheckout,
      closeCheckoutConfirmModal,
      blockRoom,
      unblockRoom,
      updateHousekeepingCleanliness,
      executeNightAudit,
      isLoggedIn,
      setIsLoggedIn,
      currentHotel,
      login,
      logout,
      selectedReservationDetails,
      isReservationDetailsOpen,
      openReservationDetails,
      closeReservationDetails,
      playBookingBellSound,
      playBookingSound: playBookingBellSound,
      hasMoreReservations,
      loadMoreReservations,
      isLoadingMoreReservations
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
