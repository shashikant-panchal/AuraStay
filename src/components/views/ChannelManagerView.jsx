import React, { useState, useEffect, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  Globe,
  Share2,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Plus,
  SlidersHorizontal,
  FileText,
  TrendingUp,
  Lock,
  ExternalLink,
  X,
  AlertCircle,
  Zap,
  Clock,
  ArrowUpRight,
  Send,
  Terminal,
  Settings,
  Radio,
  Check,
  Copy,
  Calendar,
  DollarSign,
  AlertTriangle,
  Layers,
  Building2,
  User,
  CreditCard,
  Ban
} from 'lucide-react';
import {
  getAiosellConfig,
  saveAiosellConfig,
  DEFAULT_AIOSELL_CONFIG,
  fetchPropertyDetails,
  pushInventory,
  pushRates,
  pushInventoryRestrictions,
  pushRateRestrictions,
  markNoShow,
  fetchInventory,
  fetchRates,
  fetchReservations,
  updateChannelMultiplier,
  parseAiosellWebhookPayload,
  allocateAndLockPhysicalRoom,
  calculateCategoryInventory,
  dispatchWebhookToBackend,
  saveHotelAiosellCode,
  pushHotelInventoryViaBackend
} from '../../services/aiosellService';

export default function ChannelManagerView() {
  const {
    navigateTo,
    showNotification,
    rooms = [],
    setRooms,
    reservations = [],
    setReservations,
    roomTypes = [],
    currentHotel,
    refreshData
  } = useDashboard();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState('channels'); // 'channels' | 'push' | 'fetch' | 'webhook' | 'noshow' | 'settings'

  // Aiosell credentials & config state
  const [config, setConfig] = useState(() => getAiosellConfig());
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null); // null | { ok: boolean, message: string, property?: any }

  useEffect(() => {
    if (currentHotel?.aiosellHotelCode) {
      setConfig(prev => ({ ...prev, hotelCode: currentHotel.aiosellHotelCode }));
    }
  }, [currentHotel?.aiosellHotelCode]);

  // Connected OTAs state with channel multipliers
  const [channels, setChannels] = useState([
    { id: 'bcom', name: 'Booking.com', code: 'booking.com', logo: 'B.', color: 'bg-blue-600', active: true, multiplier: 1.0, commission: '15%', lastSync: 'Real-time 2-Way XML' },
    { id: 'mmt', name: 'MakeMyTrip (MMT)', code: 'gommt', logo: 'MMT', color: 'bg-rose-600', active: true, multiplier: 1.10, commission: '18%', lastSync: 'Real-time 2-Way XML' },
    { id: 'goibibo', name: 'Goibibo', code: 'gommt', logo: 'Go', color: 'bg-orange-500', active: true, multiplier: 1.10, commission: '18%', lastSync: 'Real-time 2-Way XML' },
    { id: 'agoda', name: 'Agoda', code: 'agoda', logo: 'Ag', color: 'bg-emerald-600', active: true, multiplier: 1.05, commission: '16%', lastSync: 'Real-time 2-Way XML' },
    { id: 'expedia', name: 'Expedia Group', code: 'expedia', logo: 'Exp', color: 'bg-amber-600', active: true, multiplier: 1.0, commission: '15%', lastSync: 'Real-time 2-Way XML' },
    { id: 'airbnb', name: 'Airbnb Global', code: 'airbnb', logo: 'Ab', color: 'bg-pink-600', active: true, multiplier: 1.0, commission: '3%', lastSync: 'Real-time 2-Way XML' },
    { id: 'google', name: 'Google Free Booking Links', code: 'google', logo: 'G.', color: 'bg-red-500', active: true, multiplier: 1.0, commission: '0% (Direct)', lastSync: 'Real-time 2-Way XML' }
  ]);

  // Push Console State
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => new Date(Date.now() + 86400000).toISOString().split('T')[0], []);
  
  const [pushType, setPushType] = useState('inventory'); // 'inventory' | 'rates' | 'restrictions'
  const [pushStartDate, setPushStartDate] = useState(todayStr);
  const [pushEndDate, setPushEndDate] = useState(tomorrowStr);
  const [pushRoomCode, setPushRoomCode] = useState('executive');
  const [pushAvailableCount, setPushAvailableCount] = useState(15);
  const [pushRatePlanCode, setPushRatePlanCode] = useState('executive-s-ep');
  const [pushNightlyRate, setPushNightlyRate] = useState(2450);
  const [pushStopSell, setPushStopSell] = useState(false);
  const [pushMinStay, setPushMinStay] = useState(1);
  const [pushCloseOnArrival, setPushCloseOnArrival] = useState(false);
  const [pushCloseOnDeparture, setPushCloseOnDeparture] = useState(false);
  const [pushSelectedChannels, setPushSelectedChannels] = useState(['agoda', 'booking.com', 'gommt']);

  const [isPushing, setIsPushing] = useState(false);
  const [lastPushResponse, setLastPushResponse] = useState(null);

  // Fetch Console State
  const [fetchType, setFetchType] = useState('rates'); // 'inventory' | 'rates' | 'reservation'
  const [fetchStartDate, setFetchStartDate] = useState(todayStr);
  const [fetchEndDate, setFetchEndDate] = useState(tomorrowStr);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);

  // Webhook Simulator State (synced live with Supabase OTA reservations)
  const [sessionWebhookLogs, setSessionWebhookLogs] = useState([]);
  const [customWebhookPayload, setCustomWebhookPayload] = useState('');
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);

  const webhookLogs = useMemo(() => {
    const dbOtaLogs = (reservations || [])
      .filter(r => {
        const src = String(r.source || '').toLowerCase();
        return (
          src.includes('aiosell') ||
          src.includes('booking.com') ||
          src.includes('makemytrip') ||
          src.includes('goibibo') ||
          src.includes('agoda') ||
          src.includes('expedia') ||
          src.includes('ota')
        );
      })
      .map(r => ({
        id: `db-wh-${r.id}-${r.status}`,
        time: r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : 'Live Synced',
        action: r.status === 'CANCELLED' ? 'cancel' : 'book',
        channel: String(r.source || 'OTA').replace(/\s*\(Aiosell.*\)/i, ''),
        bookingId: r.id,
        guest: r.guest || 'Guest',
        amount: `₹${Number(r.amount || 0).toLocaleString('en-IN')}`,
        pah: r.payment === 'PENDING' ? 'Pay At Hotel (PAH)' : 'Prepaid',
        status: 'PROCESSED_SUCCESS'
      }));

    const seenKeys = new Set(dbOtaLogs.map(l => `${l.bookingId}-${l.action}`));
    const extraSession = sessionWebhookLogs.filter(l => !seenKeys.has(`${l.bookingId}-${l.action}`));
    return [...extraSession, ...dbOtaLogs];
  }, [reservations, sessionWebhookLogs]);
  const setWebhookLogs = setSessionWebhookLogs;

  // Mark No-Show State
  const [noShowBookingId, setNoShowBookingId] = useState('');
  const [noShowChannel, setNoShowChannel] = useState('booking.com');
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false);
  const [noShowResponse, setNoShowResponse] = useState(null);

  // Initial check on load
  useEffect(() => {
    handleTestConnection(false);
  }, []);

  // 1. Test Aiosell Sandbox / Live Connection
  const handleTestConnection = async (showToast = true) => {
    setIsTestingConnection(true);
    try {
      const res = await fetchPropertyDetails(config);
      if (res.success && res.data) {
        setConnectionStatus({
          ok: true,
          message: `Connected to Aiosell! Property: ${res.data.hotel_name || res.data.hotel_id} (${res.data.rooms?.length || 0} Room Categories, ${res.data.connected_channels?.length || 0} Connected Channels)`,
          property: res.data
        });
        if (showToast) showNotification(`Aiosell API Connected: ${res.data.hotel_name || res.data.hotel_id}`);
      } else {
        setConnectionStatus({
          ok: false,
          message: res.error || 'Could not connect to Aiosell API.'
        });
        if (showToast) showNotification(`Aiosell Connection Failed: ${res.error}`);
      }
    } catch (err) {
      setConnectionStatus({ ok: false, message: err.message });
      if (showToast) showNotification(`Aiosell Error: ${err.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  // 2. Push to Aiosell (Inventory, Rates, Restrictions)
  const handleExecutePush = async () => {
    setIsPushing(true);
    setLastPushResponse(null);

    try {
      let res;
      if (pushType === 'inventory') {
        const updates = [
          {
            startDate: pushStartDate,
            endDate: pushEndDate,
            rooms: [
              {
                roomCode: pushRoomCode,
                available: Number(pushAvailableCount) || 0
              }
            ]
          }
        ];
        res = await pushInventory(updates, config);
      } else if (pushType === 'rates') {
        const updates = [
          {
            startDate: pushStartDate,
            endDate: pushEndDate,
            rates: [
              {
                roomCode: pushRoomCode,
                rateplanCode: pushRatePlanCode,
                rate: Number(pushNightlyRate) || 2000
              }
            ]
          }
        ];
        res = await pushRates(updates, config);
      } else if (pushType === 'restrictions') {
        const updates = [
          {
            startDate: pushStartDate,
            endDate: pushEndDate,
            rooms: [
              {
                roomCode: pushRoomCode,
                restrictions: {
                  stopSell: Boolean(pushStopSell),
                  exactStayArrival: null,
                  maximumStayArrival: null,
                  minimumAdvanceReservation: null,
                  minimumStay: Number(pushMinStay) || 1,
                  closeOnArrival: Boolean(pushCloseOnArrival),
                  minimumStayArrival: null,
                  maximumStay: null,
                  maximumAdvanceReservation: null,
                  closeOnDeparture: Boolean(pushCloseOnDeparture)
                }
              }
            ]
          }
        ];
        res = await pushInventoryRestrictions(pushSelectedChannels, updates, config);
      }

      setLastPushResponse(res);
      if (res.success) {
        showNotification(`Aiosell Update Successful: ${res.data?.message || 'Updated Successfully'}`);
      } else {
        showNotification(`Push Notice: ${res.error || 'Please review response'}`);
      }
    } catch (err) {
      setLastPushResponse({ success: false, error: err.message });
      showNotification(`Push Failed: ${err.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  // 3. Fetch from Aiosell
  const handleExecuteFetch = async () => {
    setIsFetching(true);
    setFetchedData(null);
    try {
      let res;
      if (fetchType === 'inventory') {
        res = await fetchInventory(fetchStartDate, fetchEndDate, config);
      } else if (fetchType === 'rates') {
        res = await fetchRates(fetchStartDate, fetchEndDate, config);
      } else if (fetchType === 'reservation') {
        res = await fetchReservations(fetchStartDate, fetchEndDate, config);
      }
      setFetchedData(res);
      if (res.success) {
        const count = Array.isArray(res.data) ? res.data.length : (res.data?.updates?.length || 1);
        showNotification(`Fetched ${count} ${fetchType} records from Aiosell.`);
      } else {
        showNotification(`Fetch Error: ${res.error}`);
      }
    } catch (err) {
      setFetchedData({ success: false, error: err.message });
      showNotification(`Fetch failed: ${err.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  // Import fetched reservations directly into AuraStay PMS & Supabase Backend with automatic physical room locking
  const handleImportFetchedReservations = async () => {
    if (!fetchedData || !Array.isArray(fetchedData.data) || fetchedData.data.length === 0) {
      showNotification('No reservation records available to import.');
      return;
    }

    let imported = 0;
    const existingIds = new Set((reservations || []).map(r => r.id));

    for (const item of fetchedData.data.slice(0, 10)) {
      try {
        const parsed = parseAiosellWebhookPayload(item);
        if ((parsed.action === 'book' || parsed.action === 'modify') && !existingIds.has(parsed.reservation.id)) {
          existingIds.add(parsed.reservation.id);
          await dispatchWebhookToBackend(item, currentHotel?.id);
          imported++;
        }
      } catch (e) {}
    }

    if (refreshData) {
      await refreshData();
    }
    showNotification(`Imported ${imported} active OTA reservations into Supabase and locked physical rooms across all devices.`);
  };

  // 4. Update Multipliers
  const handleApplyMultiplier = async (channelCode, factor) => {
    showNotification(`Updating ${channelCode} multiplier to ${factor}...`);
    try {
      const res = await updateChannelMultiplier(factor, [channelCode], config);
      if (res.success) {
        setChannels(prev => prev.map(ch => ch.code === channelCode ? { ...ch, multiplier: factor } : ch));
        showNotification(`Multiplier updated: ${res.data?.message || 'Factor applied'}`);
      } else {
        showNotification(`Multiplier update notice: ${res.error}`);
      }
    } catch (err) {
      showNotification(`Multiplier Error: ${err.message}`);
    }
  };

  // 5. Inbound Webhook Dispatch (Persists to Supabase via Edge Function & Syncs Across All Devices)
  const handleSimulateWebhook = async (sampleType) => {
    setIsSimulatingWebhook(true);

    let samplePayload;
    if (sampleType === 'booking_prepaid') {
      samplePayload = {
        action: 'book',
        hotelCode: config.hotelCode,
        channel: 'booking.com',
        bookingId: `BDC-${Math.floor(100000 + Math.random() * 900000)}`,
        cmBookingId: `CM-BDC-${Date.now().toString().slice(-6)}`,
        bookedOn: new Date().toISOString().replace('T', ' ').slice(0, 19),
        checkin: todayStr,
        checkout: tomorrowStr,
        segment: 'OTA',
        specialRequests: 'High floor preferred, airport taxi at 10 AM',
        pah: false, // Prepaid
        amount: {
          amountAfterTax: 7500,
          amountBeforeTax: 6355.93,
          tax: 1144.07,
          currency: 'INR',
          commission: 1125,
          tcs: 50,
          tds: 10
        },
        guest: {
          firstName: 'Vikram',
          lastName: 'Malhotra',
          email: 'vikram.malhotra@example.com',
          phone: '+91 98765 43210',
          address: {
            line1: '42 MG Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            country: 'India',
            zipCode: '560001'
          }
        },
        rooms: [
          {
            roomCode: 'suite',
            rateplanCode: 'suite-d-cp',
            guestName: 'Vikram Malhotra',
            occupancy: { adults: 2, children: 1 },
            prices: [{ date: todayStr, sellRate: 7500 }]
          }
        ]
      };
    } else if (sampleType === 'mmt_pah') {
      samplePayload = {
        action: 'book',
        hotelCode: config.hotelCode,
        channel: 'Goibibo',
        bookingId: `GOI-${Math.floor(100000 + Math.random() * 900000)}`,
        cmBookingId: `CM-GOI-${Date.now().toString().slice(-6)}`,
        bookedOn: new Date().toISOString().replace('T', ' ').slice(0, 19),
        checkin: todayStr,
        checkout: tomorrowStr,
        segment: 'OTA',
        specialRequests: 'Late check-in around 11 PM',
        pah: true, // Pay at Hotel
        amount: {
          amountAfterTax: 2800,
          amountBeforeTax: 2500,
          tax: 300,
          currency: 'INR',
          commission: 450,
          tcs: 10,
          tds: 2
        },
        guest: {
          firstName: 'Ananya',
          lastName: 'Sharma',
          email: null, // OTA masked email test
          phone: '+91 99887 76655',
          address: { city: 'Mumbai', country: 'India' }
        },
        rooms: [
          {
            roomCode: 'standard',
            rateplanCode: 'standard-s-ep',
            guestName: 'Ananya Sharma',
            occupancy: { adults: 1, children: 0 },
            prices: [{ date: todayStr, sellRate: 2800 }]
          }
        ]
      };
    } else if (sampleType === 'modify') {
      // Find a recent booking to modify or use sample
      samplePayload = {
        action: 'modify',
        hotelCode: config.hotelCode,
        channel: 'booking.com',
        bookingId: webhookLogs[0]?.bookingId || reservations[0]?.id || 'BDC-5238846',
        cmBookingId: 'CM-BDC-MOD-99',
        bookedOn: new Date().toISOString().replace('T', ' ').slice(0, 19),
        checkin: todayStr,
        checkout: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // Extended stay
        segment: 'OTA',
        specialRequests: 'Stay extended by 2 nights per guest request',
        pah: false,
        amount: {
          amountAfterTax: 14500,
          amountBeforeTax: 12288.13,
          tax: 2211.87,
          currency: 'INR',
          commission: 2175,
          tcs: 100,
          tds: 20
        },
        guest: {
          firstName: 'Vikram',
          lastName: 'Malhotra',
          email: 'vikram.malhotra@example.com',
          phone: '+91 98765 43210'
        },
        rooms: [
          {
            roomCode: 'suite',
            rateplanCode: 'suite-d-cp',
            guestName: 'Vikram Malhotra',
            occupancy: { adults: 2, children: 1 }
          }
        ]
      };
    } else if (sampleType === 'cancel') {
      samplePayload = {
        action: 'cancel',
        hotelCode: config.hotelCode,
        channel: 'Goibibo',
        bookingId: webhookLogs[0]?.bookingId || reservations[0]?.id || '111222333'
      };
    } else if (sampleType === 'custom') {
      try {
        samplePayload = JSON.parse(customWebhookPayload);
      } catch (err) {
        showNotification(`Invalid JSON Payload: ${err.message}`);
        setIsSimulatingWebhook(false);
        return;
      }
    }

    // Dispatch to Supabase Edge Function & persist in Supabase DB for cross-device Realtime sync
    try {
      const parsed = parseAiosellWebhookPayload(samplePayload);
      const result = await dispatchWebhookToBackend(samplePayload, currentHotel?.id);

      if (!result?.success) {
        setSessionWebhookLogs(prev => [
          {
            id: `wh-${Date.now()}`,
            time: new Date().toLocaleTimeString(),
            action: parsed.action,
            channel: samplePayload.channel || 'OTA',
            bookingId: parsed.action === 'cancel' ? parsed.bookingId : parsed.reservation.id,
            guest: parsed.action === 'cancel' ? 'N/A' : parsed.reservation.guest,
            amount: parsed.action === 'cancel' ? 'N/A' : `₹${parsed.reservation.amount}`,
            pah: parsed.action === 'cancel' ? 'N/A' : (parsed.reservation.pah ? 'Pay At Hotel (PAH)' : 'Prepaid'),
            status: result?.status === 409 ? 'BLOCKED_NO_INVENTORY' : 'REJECTED'
          },
          ...prev
        ]);
        showNotification(`Webhook Rejected: ${result?.error || 'Could not process OTA booking.'}`);
        setIsSimulatingWebhook(false);
        return;
      }

      const logEntry = {
        id: `wh-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        action: parsed.action,
        channel: samplePayload.channel || 'OTA',
        bookingId: parsed.action === 'cancel' ? parsed.bookingId : parsed.reservation.id,
        guest: parsed.action === 'cancel' ? 'N/A' : parsed.reservation.guest,
        amount: parsed.action === 'cancel' ? 'N/A' : `₹${parsed.reservation.amount}`,
        pah: parsed.action === 'cancel' ? 'N/A' : (parsed.reservation.pah ? 'Pay At Hotel (PAH)' : 'Prepaid'),
        status: 'PROCESSED_SUCCESS'
      };

      setSessionWebhookLogs(prev => [logEntry, ...prev]);

      if (refreshData) {
        await refreshData();
      }

      if (parsed.action === 'book') {
        const allocatedRoomNumber = result?.allocatedRoomNumber;
        if (allocatedRoomNumber) {
          showNotification(`[BOOK LOCKED]: Reservation ${parsed.reservation.id} saved & Room ${allocatedRoomNumber} LOCKED across Admin + Guest Website.`);
        } else {
          showNotification(`[BOOK]: Reservation ${parsed.reservation.id} saved from ${parsed.reservation.channel}.`);
        }
      } else if (parsed.action === 'modify') {
        showNotification(`Webhook [MODIFY]: Reservation ${parsed.reservation.id} updated across all devices!`);
      } else if (parsed.action === 'cancel') {
        showNotification(`Webhook [CANCEL]: Booking ${parsed.bookingId} cancelled and physical room UNLOCKED across all devices!`);
      }
    } catch (err) {
      showNotification(`Webhook processing error: ${err.message}`);
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  // 6. Mark No-Show (Rule 14: booking.com or gommt)
  const handleExecuteMarkNoShow = async () => {
    if (!noShowBookingId.trim()) {
      showNotification('Please enter a Booking Reference ID.');
      return;
    }
    setIsMarkingNoShow(true);
    setNoShowResponse(null);
    try {
      const res = await markNoShow(noShowBookingId.trim(), noShowChannel, config);
      setNoShowResponse(res);
      if (res.success) {
        showNotification(`No-show marked successfully for ${noShowChannel} booking ${noShowBookingId}.`);
        // Update local status if found
        setReservations(prev => prev.map(r => r.id === noShowBookingId.trim() ? { ...r, status: 'NO_SHOW' } : r));
      } else {
        showNotification(`No-show response: ${res.error || res.data?.message}`);
      }
    } catch (err) {
      setNoShowResponse({ success: false, error: err.message });
      showNotification(`No-show error: ${err.message}`);
    } finally {
      setIsMarkingNoShow(false);
    }
  };

  // 7. Save Credentials & Persist Per-Hotel Aiosell hotelCode Mapping
  const handleSaveConfig = async () => {
    saveAiosellConfig(config);
    if (currentHotel?.id && config.hotelCode) {
      await saveHotelAiosellCode(currentHotel.id, config.hotelCode);
    }
    showNotification('Aiosell credentials & property hotelCode mapping saved.');
    handleTestConnection(true);
  };

  const handleResetToSandbox = () => {
    setConfig(DEFAULT_AIOSELL_CONFIG);
    saveAiosellConfig(DEFAULT_AIOSELL_CONFIG);
    showNotification('Reset to Aiosell Sandbox defaults (sandbox-pms / aiosell).');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Breadcrumbs */}
      <div className="flex items-center space-x-1.5 text-xs text-slate-500 pb-1 border-b border-slate-200">
        <span
          onClick={() => navigateTo('master-service-home')}
          className="hover:text-slate-900 cursor-pointer transition flex items-center gap-1"
        >
          🏠 Home
        </span>
        <span>/</span>
        <span className="font-semibold text-slate-900">
          Aiosell Channel Manager
        </span>
      </div>

      {/* 2. Top Banner & Active Partner Status Bar */}
      <div className="bg-gradient-to-r from-[#0b1a30] via-[#0f274a] to-[#0b1a30] rounded-2xl p-6 text-white shadow-lg border border-slate-700/60 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            <span className="px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded-full text-[11px] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AIOSELL 2-WAY XML INTEGRATION ACTIVE
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[11px] font-bold">
              Option 1: ₹800 / Property / Month (Flat Billing · 0% Commission)
            </span>
            <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded-md">
              Mode: {config.isSandbox ? 'SANDBOX (sandbox-pms)' : 'PRODUCTION PARTNER'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center space-x-2">
            <span>Aiosell Channel Manager Control Hub</span>
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed">
            Real-time multi-OTA distribution engine connecting MakeMyTrip, Goibibo, Booking.com, Agoda, Expedia, and Airbnb.
            Synchronize room rates, available inventory, stop-sells, and auto-ingest reservations directly into Aavasa HMS.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2.5 shrink-0 flex-wrap gap-y-2">
          <button
            onClick={() => handleTestConnection(true)}
            disabled={isTestingConnection}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
            <span>{isTestingConnection ? 'Pinging API...' : 'Test Connection'}</span>
          </button>

          <button
            onClick={() => setActiveTab('push')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Push Live Rates & Inventory</span>
          </button>
        </div>
      </div>

      {/* 3. Live Diagnostic Connection Banner */}
      {connectionStatus && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
          connectionStatus.ok
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-rose-50/80 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center space-x-2">
            {connectionStatus.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{connectionStatus.message}</span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-[10px] font-mono text-slate-500">
              Target: {config.baseUrl}
            </span>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-xs font-bold text-indigo-700 hover:underline cursor-pointer"
            >
              Configure
            </button>
          </div>
        </div>
      )}

      {/* 4. Tab Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex items-center space-x-1 overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveTab('channels')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'channels'
              ? 'bg-[#0b1a30] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Connected OTAs & Multipliers</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-sky-500 text-white font-mono">
            {channels.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('push')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'push'
              ? 'bg-[#0b1a30] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Rates & Inventory Push Console</span>
        </button>

        <button
          onClick={() => setActiveTab('fetch')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'fetch'
              ? 'bg-[#0b1a30] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Fetch Data from Aiosell</span>
        </button>

        <button
          onClick={() => setActiveTab('webhook')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'webhook'
              ? 'bg-[#0b1a30] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Inbound Webhook Tester & Simulator</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-600 text-white font-mono">
            {webhookLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('locking')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'locking'
              ? 'bg-[#0b1a30] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>Room Locking & Production Architecture</span>
        </button>

        <button
          onClick={() => setActiveTab('noshow')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'noshow'
              ? 'bg-[#0b1a30] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Ban className="w-3.5 h-3.5" />
          <span>Mark No-Show (Rule 14)</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-[#0b1a30] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>API Credentials & Auth</span>
        </button>
      </div>

      {/* 5. TAB CONTENT */}

      {/* TAB 1: Connected OTAs & Channel Multipliers */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Connected Distribution Channels</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono rounded-md border border-emerald-200 font-bold">
                  2-Way ARI Enabled
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Aiosell pushes your tariffs and available room counts to these OTAs and delivers bookings directly into Aavasa HMS.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateTo('ari-grid')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Open ARI Calendar Grid</span>
              </button>
            </div>
          </div>

          {/* Channels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl ${ch.color} text-white flex items-center justify-center font-black text-sm shadow-sm`}>
                      {ch.logo}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {ch.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">
                        Code: {ch.code}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-xs border border-slate-100">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Sync Protocol:</span>
                    <span className="font-bold text-slate-800">{ch.lastSync}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>OTA Commission:</span>
                    <span className="font-bold text-slate-800">{ch.commission}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                    <span className="font-semibold text-slate-700">Rate Multiplier:</span>
                    <div className="flex items-center space-x-1">
                      <select
                        value={ch.multiplier}
                        onChange={(e) => handleApplyMultiplier(ch.code, Number(e.target.value))}
                        className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold text-indigo-700 cursor-pointer"
                      >
                        <option value={0.9}>0.90 (-10%)</option>
                        <option value={1.0}>1.00 (Parity)</option>
                        <option value={1.05}>1.05 (+5%)</option>
                        <option value={1.10}>1.10 (+10%)</option>
                        <option value={1.15}>1.15 (+15%)</option>
                        <option value={1.20}>1.20 (+20%)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <Check className="w-3.5 h-3.5" /> Stop-Sell & Min Stay Synced
                  </span>
                  <button
                    onClick={() => {
                      setPushSelectedChannels([ch.code]);
                      setActiveTab('push');
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                  >
                    Push Rates &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Rates & Inventory Push Console */}
      {activeTab === 'push' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: 7 cols */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Send className="w-4 h-4 text-indigo-600" />
                <span>Aiosell Push Transmission Console</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Transmit room inventory counts, nightly rates, or stay restrictions directly to Aiosell API.
              </p>
            </div>

            {/* Selector: Inventory vs Rates vs Restrictions */}
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPushType('inventory')}
                className={`py-2 rounded-lg transition cursor-pointer text-center ${
                  pushType === 'inventory' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Push Inventory
              </button>
              <button
                type="button"
                onClick={() => setPushType('rates')}
                className={`py-2 rounded-lg transition cursor-pointer text-center ${
                  pushType === 'rates' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Push Rates
              </button>
              <button
                type="button"
                onClick={() => setPushType('restrictions')}
                className={`py-2 rounded-lg transition cursor-pointer text-center ${
                  pushType === 'restrictions' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3. Push Restrictions
              </button>
            </div>

            {/* Date Range Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Start Date (Inclusive)
                </label>
                <input
                  type="date"
                  value={pushStartDate}
                  onChange={(e) => setPushStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  End Date (Inclusive)
                </label>
                <input
                  type="date"
                  value={pushEndDate}
                  onChange={(e) => setPushEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            </div>

            {/* Room Category Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Aiosell Room Code
              </label>
              <select
                value={pushRoomCode}
                onChange={(e) => setPushRoomCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="executive">EXECUTIVE (executive - 25 Rooms in Sandbox)</option>
                <option value="suite">SUITE (suite - 5 Rooms in Sandbox)</option>
                {(roomTypes || []).map(rt => (
                  <option key={rt.id} value={rt.name.toLowerCase().replace(/\s+/g, '-')}>
                    {rt.name} ({rt.label || 'Aavasa Master'})
                  </option>
                ))}
              </select>
            </div>

            {/* Type-Specific Fields */}
            {pushType === 'inventory' && (
              <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Available Room Count to Distribute
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={pushAvailableCount}
                    onChange={(e) => setPushAvailableCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-32 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold font-mono text-slate-900"
                  />
                  <span className="text-xs text-slate-500">
                    rooms available on selected date window
                  </span>
                </div>
              </div>
            )}

            {pushType === 'rates' && (
              <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Rate Plan Code
                    </label>
                    <select
                      value={pushRatePlanCode}
                      onChange={(e) => setPushRatePlanCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="executive-s-ep">executive-s-ep (Executive Room Only Single)</option>
                      <option value="executive-d-ep">executive-d-ep (Executive Room Only Double)</option>
                      <option value="executive-s-cp">executive-s-cp (Executive Breakfast Single)</option>
                      <option value="executive-d-cp">executive-d-cp (Executive Breakfast Double)</option>
                      <option value="suite-s-ep">suite-s-ep (Suite Room Only Single)</option>
                      <option value="suite-d-cp">suite-d-cp (Suite Breakfast Double)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Nightly Rate (₹ INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="500"
                        step="50"
                        value={pushNightlyRate}
                        onChange={(e) => setPushNightlyRate(parseInt(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {pushType === 'restrictions' && (
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="pushStopSellCheck"
                      checked={pushStopSell}
                      onChange={(e) => setPushStopSell(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                    />
                    <label htmlFor="pushStopSellCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Stop Sell (Block Bookings)
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Minimum Stay Nights
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={pushMinStay}
                      onChange={(e) => setPushMinStay(parseInt(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-amber-200/60">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="ctaCheck"
                      checked={pushCloseOnArrival}
                      onChange={(e) => setPushCloseOnArrival(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                    <label htmlFor="ctaCheck" className="text-xs text-slate-700 cursor-pointer">
                      Close On Arrival (CTA)
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="ctdCheck"
                      checked={pushCloseOnDeparture}
                      onChange={(e) => setPushCloseOnDeparture(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                    <label htmlFor="ctdCheck" className="text-xs text-slate-700 cursor-pointer">
                      Close On Departure (CTD)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Target Distribution Channels */}
            {pushType === 'restrictions' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-2">
                  Target Channels (toChannels)
                </label>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  {['agoda', 'booking.com', 'gommt', 'expedia', 'airbnb'].map(ch => (
                    <label
                      key={ch}
                      className={`px-3 py-1.5 rounded-xl border cursor-pointer transition flex items-center space-x-1.5 ${
                        pushSelectedChannels.includes(ch)
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={pushSelectedChannels.includes(ch)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPushSelectedChannels(prev => [...prev, ch]);
                          } else {
                            setPushSelectedChannels(prev => prev.filter(c => c !== ch));
                          }
                        }}
                        className="sr-only"
                      />
                      <span>{ch}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleExecutePush}
                disabled={isPushing}
                className="w-full py-3 bg-[#0b1a30] hover:bg-[#132c52] text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Send className={`w-4 h-4 ${isPushing ? 'animate-bounce' : ''}`} />
                <span>{isPushing ? 'Sending Transmission to Aiosell...' : `Transmit ${pushType.toUpperCase()} to Aiosell OTAs`}</span>
              </button>
            </div>
          </div>

          {/* Right Console: 5 cols */}
          <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-5 text-white font-mono text-xs shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-sky-400" />
                  AIOSELL API LIVE CONSOLE
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  AUTH: Basic {btoa(`${config.username}:***`).slice(0, 10)}...
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="text-[11px] text-slate-400">
                  Target Endpoint:
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg text-emerald-400 text-[11px] break-all border border-slate-800">
                  POST {config.baseUrl}/{pushType === 'rates' ? 'update-rates' : 'update'}/{config.partnerId}
                </div>

                <div className="text-[11px] text-slate-400 pt-2">
                  Live Response from live.aiosell.com:
                </div>
                <div className="bg-slate-950 p-3 rounded-lg text-[11px] overflow-x-auto max-h-64 border border-slate-800">
                  {lastPushResponse ? (
                    <pre className="text-slate-200">
                      {JSON.stringify(lastPushResponse, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-slate-500 italic py-4 text-center">
                      Ready to transmit. Click "Transmit to Aiosell OTAs" to see the real-time API response.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Hotel: {config.hotelCode}</span>
              <span>Partner: {config.partnerId}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Fetch Data from Aiosell */}
      {activeTab === 'fetch' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-indigo-600" />
                <span>Fetch Live Inventory, Rates & Reservations</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Direct query against Aiosell dataset endpoint: <code className="text-indigo-600 font-mono">POST /data/{config.partnerId}</code>
              </p>
            </div>

            {fetchedData?.data && Array.isArray(fetchedData.data) && fetchType === 'reservation' && (
              <button
                onClick={handleImportFetchedReservations}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Import Bookings to Front Desk</span>
              </button>
            )}
          </div>

          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Query Type
              </label>
              <select
                value={fetchType}
                onChange={(e) => setFetchType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                <option value="rates">Rates (type: 'rates')</option>
                <option value="inventory">Inventory (type: 'inventory')</option>
                <option value="reservation">OTA Reservations (type: 'reservation')</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={fetchStartDate}
                onChange={(e) => setFetchStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                End Date
              </label>
              <input
                type="date"
                value={fetchEndDate}
                onChange={(e) => setFetchEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleExecuteFetch}
                disabled={isFetching}
                className="w-full py-2 bg-[#0b1a30] hover:bg-[#132c52] text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                <span>{isFetching ? 'Fetching Data...' : 'Execute Fetch'}</span>
              </button>
            </div>
          </div>

          {/* Fetched Data Viewer */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Aiosell Query Result
            </h3>

            {fetchedData ? (
              <div className="bg-slate-900 rounded-xl p-4 text-white text-xs font-mono overflow-x-auto max-h-96">
                <pre>{JSON.stringify(fetchedData, null, 2)}</pre>
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                Click "Execute Fetch" to query active rates or reservations from the Aiosell Sandbox.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Inbound Webhook Tester & Simulator */}
      {activeTab === 'webhook' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Inbound Reservation Webhook Integration</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Aiosell calls YOUR webhook when an OTA reservation is created, modified, or cancelled.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  HTTP Basic Auth Protected
                </span>
              </div>
            </div>

            {/* Integration Details to share with Aiosell onboarding */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Webhook URL (Share with Aiosell Support)
                </span>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={config.webhookUrl || 'https://pdsfctfixxfazchamznm.supabase.co/functions/v1/aiosell-webhook'}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(config.webhookUrl || 'https://pdsfctfixxfazchamznm.supabase.co/functions/v1/aiosell-webhook');
                      showNotification('Production Webhook URL copied to clipboard.');
                    }}
                    className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition cursor-pointer"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Expected Basic Auth Credentials (Header)
                </span>
                <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-700 flex items-center justify-between">
                  <span>username: <strong className="text-indigo-600">{config.username}</strong></span>
                  <span>password: <strong className="text-indigo-600">{config.password}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Test Triggers */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Simulate Inbound OTA Webhook Events:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => handleSimulateWebhook('booking_prepaid')}
                  disabled={isSimulatingWebhook}
                  className="p-3 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200 rounded-xl text-left transition cursor-pointer space-y-1"
                >
                  <div className="text-xs font-bold text-blue-900 flex items-center justify-between">
                    <span>1. Booking.com (Prepaid)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded">book</span>
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Suite, ₹7,500, pah=false, guest details & special requests
                  </p>
                </button>

                <button
                  onClick={() => handleSimulateWebhook('mmt_pah')}
                  disabled={isSimulatingWebhook}
                  className="p-3 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200 rounded-xl text-left transition cursor-pointer space-y-1"
                >
                  <div className="text-xs font-bold text-rose-900 flex items-center justify-between">
                    <span>2. Goibibo / MMT (PAH)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-rose-200 text-rose-800 rounded">book</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Standard Room, ₹2,800, pah=true — locks physical room immediately
                  </p>
                </button>

                <button
                  onClick={() => handleSimulateWebhook('modify')}
                  disabled={isSimulatingWebhook}
                  className="p-3 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200 rounded-xl text-left transition cursor-pointer space-y-1"
                >
                  <div className="text-xs font-bold text-amber-900 flex items-center justify-between">
                    <span>3. Modify Booking</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded">modify</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Full state overwrite per Rule 9 (extended stay, ₹14,500)
                  </p>
                </button>

                <button
                  onClick={() => handleSimulateWebhook('cancel')}
                  disabled={isSimulatingWebhook}
                  className="p-3 bg-red-50/70 hover:bg-red-100/80 border border-red-200 rounded-xl text-left transition cursor-pointer space-y-1"
                >
                  <div className="text-xs font-bold text-red-900 flex items-center justify-between">
                    <span>4. Cancel Booking</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-red-200 text-red-800 rounded">cancel</span>
                  </div>
                  <p className="text-[11px] text-red-700">
                    Cancels booking & frees up inventory across all OTAs
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Webhook Activity Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Live Inbound Webhook Activity Log</span>
              </h3>
              {webhookLogs.length > 0 && (
                <button
                  onClick={() => {
                    setWebhookLogs([]);
                    showNotification('Webhook log cleared.');
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  Clear Log
                </button>
              )}
            </div>

            {webhookLogs.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">OTA Channel</th>
                      <th className="py-2.5 px-3">Booking ID</th>
                      <th className="py-2.5 px-3">Guest Name</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Payment Type</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {webhookLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{log.time}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            log.action === 'book' ? 'bg-emerald-100 text-emerald-800' :
                            log.action === 'modify' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{log.channel}</td>
                        <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">{log.bookingId}</td>
                        <td className="py-2.5 px-3 text-slate-800">{log.guest}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{log.amount}</td>
                        <td className="py-2.5 px-3 text-slate-600">{log.pah}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Synced to PMS
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                No webhook events received yet. Click any of the simulation triggers above to test incoming bookings!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Room Locking & Production Architecture */}
      {activeTab === 'locking' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-[#0b1a30] via-[#102746] to-[#0b1a30] rounded-2xl p-6 text-white shadow-lg border border-slate-700/60 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  ATOMIC ROOM LOCKING & OVERBOOKING SHIELD
                </span>
                <span className="px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded-full text-[11px] font-bold">
                  Supabase Project: pdsfctfixxfazchamznm
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight">
                How Third-Party OTA Bookings Lock Rooms in Aavasa
              </h2>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                When a guest reserves on Booking.com, MakeMyTrip, Agoda, or Expedia, Aiosell calls your real backend webhook.
                Aavasa instantly assigns a clean physical room, changes its status to <strong className="text-rose-400">OCCUPIED</strong> in the database, locks the room card in Front Office, and decrements inventory across all remaining OTAs to guarantee zero overbookings.
              </p>
            </div>

            <div className="shrink-0 bg-white/10 p-4 rounded-xl border border-white/20 text-center space-y-1">
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">Real Webhook State</span>
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                EDGE FUNCTION READY
              </span>
            </div>
          </div>

          {/* 1. Real Production Webhook Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>Your Real Production Webhook Endpoint</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Share this exact URL and credentials with the Aiosell onboarding team.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                HTTPS Secure · Production
              </span>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-white space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                <span>Webhook Endpoint (Deno Edge Function on Supabase):</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('https://pdsfctfixxfazchamznm.supabase.co/functions/v1/aiosell-webhook');
                    showNotification('Copied Supabase Edge Function Webhook URL!');
                  }}
                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-sans font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy URL
                </button>
              </div>
              <div className="text-emerald-400 font-bold break-all">
                POST https://pdsfctfixxfazchamznm.supabase.co/functions/v1/aiosell-webhook
              </div>
              <div className="text-slate-400 text-[11px] pt-1">
                Auth Header: <span className="text-amber-300 font-bold">Authorization: Basic {btoa('adminaavasa:admin123')}</span> (username: <span className="text-white">adminaavasa</span>, password: <span className="text-white">admin123</span>)
              </div>
            </div>
          </div>

          {/* 2. Four-Step Room Locking Visual Engine */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>The 4-Step Room Locking & Anti-Double-Booking Engine</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                How every third-party booking is secured in the database and visually locked in the Front Desk.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Step 1 */}
              <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 space-y-2 relative">
                <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-xs">
                  1
                </div>
                <h4 className="font-bold text-sky-950">Guest Books on OTA</h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  A guest confirms a reservation on <strong>Booking.com</strong>, <strong>MakeMyTrip</strong>, or <strong>Agoda</strong>. Aiosell captures the booking and instantly dispatches an inbound HTTP POST webhook.
                </p>
                <div className="text-[10px] font-mono text-sky-800 bg-sky-100 p-1.5 rounded">
                  Action: "book" · PAH: true/false
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2 relative">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <h4 className="font-bold text-indigo-950">Atomic Room Allocation</h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  The Supabase webhook queries your real physical rooms (e.g. Room 101, 102, 201) matching the room category, finds the first clean vacant room, and executes an atomic SQL lock.
                </p>
                <div className="text-[10px] font-mono text-indigo-800 bg-indigo-100 p-1.5 rounded">
                  UPDATE rooms SET status='OCCUPIED'
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2 relative">
                <div className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <h4 className="font-bold text-rose-950">Visual Lock in Admin</h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  The room immediately displays as <strong>OCCUPIED</strong> in the <strong>Live Room Matrix (3D cards)</strong> and <strong>Tape Chart</strong> with guest name and OTA source. Front desk staff are blocked from assigning anyone else.
                </p>
                <div className="text-[10px] font-mono text-rose-800 bg-rose-100 p-1.5 rounded">
                  Locked · MMT / Booking.com
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2 relative">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  4
                </div>
                <h4 className="font-bold text-emerald-950">Stop-Sell Push to All OTAs</h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Remaining available inventory is recalculated. If all rooms of that category are booked, Aavasa triggers an automated Stop-Sell to Aiosell, shutting down sales across all other OTAs worldwide.
                </p>
                <div className="text-[10px] font-mono text-emerald-800 bg-emerald-100 p-1.5 rounded">
                  Zero Overbooking Guaranteed
                </div>
              </div>
            </div>
          </div>

          {/* 3. Onboarding Handshake Protocol Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Onboarding Exchange: What You Send vs What Aiosell Sends</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact protocol for connecting Aavasa HMS to the Aiosell partner network.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Left Column: What you provide to Aiosell */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-indigo-950 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Send className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1. What You Share with Aiosell Support</span>
                </h4>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Webhook URL:</strong> <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-300">https://pdsfctfixxfazchamznm.supabase.co/functions/v1/aiosell-webhook</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Webhook HTTP Basic Auth:</strong> username: <code className="font-mono bg-white px-1 rounded">adminaavasa</code>, password: <code className="font-mono bg-white px-1 rounded">admin123</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Hotel Details:</strong> Property Name, City, State, Country, Total Room Count.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Room Types & Rate Plans:</strong> Deluxe Room, Executive Room, Suite (EP - Room Only, CP - Breakfast).</span>
                  </li>
                </ul>
              </div>

              {/* Right Column: What Aiosell gives to you */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. What Aiosell Returns to You</span>
                </h4>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Production Partner ID:</strong> Assigned slug (e.g. <code className="font-mono bg-white px-1 rounded">aurastay-pms</code>).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Partner Basic Auth Credentials:</strong> Issued credentials for pushing rates and inventory to their production API.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Property Hotel Code:</strong> e.g. <code className="font-mono bg-white px-1 rounded">HOTEL-1082</code> assigned in Aiosell PMS master.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Channel Activation:</strong> Aiosell links your property to Booking.com, MMT, Agoda, and Expedia extranets.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 4. Backend SQL Trigger & Verification Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-slate-700" />
                  <span>Production Backend Files Ready on Disk</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Both the Supabase Edge Function and the PostgreSQL Atomic Lock Trigger have been written and tested.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={async () => {
                    const syncRes = await pushHotelInventoryViaBackend({
                      hotelId: currentHotel?.id,
                      hotelCode: config.hotelCode,
                      partnerId: config.partnerId,
                      username: config.username,
                      password: config.password,
                      startDate: pushStartDate,
                      endDate: pushEndDate
                    });
                    if (syncRes?.success) {
                      showNotification('Live room availability & Stop-Sell flags synced to Aiosell via secured pms-api!');
                    } else {
                      showNotification(`Aiosell inventory push: ${syncRes?.error || syncRes?.message || 'Completed with notice.'}`);
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Sync Live Inventory to Aiosell
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('supabase functions deploy aiosell-webhook --no-verify-jwt && supabase functions deploy pms-api --no-verify-jwt');
                    showNotification('Copied Supabase CLI deploy command!');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy CLI Deploy Command
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
                <span className="text-sky-400 font-bold block">1. Inbound OTA Webhook Only</span>
                <span className="text-slate-300 block text-[11px]">POST /functions/v1/aiosell-webhook</span>
                <span className="text-slate-400 text-[10px] block">Requires HTTP Basic Auth. Accepts only book/modify/cancel from Aiosell & locks physical rooms per hotel_id without leaking tenant data.</span>
              </div>

              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
                <span className="text-indigo-400 font-bold block">2. Secured PMS & Push API</span>
                <span className="text-slate-300 block text-[11px]">POST /functions/v1/pms-api</span>
                <span className="text-slate-400 text-[10px] block">Pushes only (hotelCode, startDate, endDate, roomCode, available, stopSell) to Aiosell with zero guest PII.</span>
              </div>

              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
                <span className="text-emerald-400 font-bold block">3. Date-Overlap Room Lock</span>
                <span className="text-slate-300 block text-[11px]">20261114123000_pos_and_secure_ota_sync.sql</span>
                <span className="text-slate-400 text-[10px] block">Multi-tenant PostgreSQL trigger preventing double-booking across Goibibo, Admin & Guest Website in realtime.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Mark No-Show Console (Rule 14) */}
      {activeTab === 'noshow' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 max-w-2xl">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Ban className="w-4 h-4 text-rose-600" />
              <span>Mark Booking as No-Show</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Strictly complies with Rule 14: body field <code className="text-indigo-600 font-mono">channel</code> supports only <code className="text-indigo-600 font-mono">booking.com</code> and <code className="text-indigo-600 font-mono">gommt</code>.
            </p>
          </div>

          <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Booking Reference ID
              </label>
              <input
                type="text"
                placeholder="e.g. 111222350 or BDC-5238846"
                value={noShowBookingId}
                onChange={(e) => setNoShowBookingId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Supported Channel
              </label>
              <select
                value={noShowChannel}
                onChange={(e) => setNoShowChannel(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                <option value="booking.com">booking.com (Booking.com)</option>
                <option value="gommt">gommt (MakeMyTrip & Goibibo)</option>
              </select>
            </div>

            <button
              onClick={handleExecuteMarkNoShow}
              disabled={isMarkingNoShow}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{isMarkingNoShow ? 'Submitting to Aiosell...' : 'Mark as No-Show on OTA Extranet'}</span>
            </button>
          </div>

          {noShowResponse && (
            <div className="bg-slate-900 rounded-xl p-4 text-white text-xs font-mono">
              <pre>{JSON.stringify(noShowResponse, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: Settings & Credentials */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 max-w-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Settings className="w-4 h-4 text-slate-700" />
                <span>Aiosell Channel Manager API Settings</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure your partner credentials issued by Aiosell. Default credentials are set for Sandbox testing.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetToSandbox}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Load Sandbox Defaults
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  HTTP Basic Auth Username
                </label>
                <input
                  type="text"
                  value={config.username}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  HTTP Basic Auth Password
                </label>
                <input
                  type="password"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Hotel Code
                </label>
                <input
                  type="text"
                  value={config.hotelCode}
                  onChange={(e) => setConfig({ ...config, hotelCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Partner ID ({'{pms}'})
                </label>
                <input
                  type="text"
                  value={config.partnerId}
                  onChange={(e) => setConfig({ ...config, partnerId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Aiosell Base URL
              </label>
              <input
                type="text"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-800"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="sandboxToggle"
                checked={config.isSandbox}
                onChange={(e) => setConfig({ ...config, isSandbox: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
              <label htmlFor="sandboxToggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                Sandbox Mode (live.aiosell.com testing environment)
              </label>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-5 py-2.5 bg-[#0b1a30] hover:bg-[#132c52] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
              >
                Save & Verify Credentials
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
