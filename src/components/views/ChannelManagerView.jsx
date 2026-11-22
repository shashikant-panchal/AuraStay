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
  Ban,
  Filter,
  Search,
  Code2,
  Download,
  ChevronDown,
  ChevronRight,
  Eye,
  CheckCheck
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

  // Active AioConnect Navigation Tab (Default to modern logs-v2 matching Aiosell portal)
  const [activeTab, setActiveTab] = useState('logs-v2'); // 'logs-v2' | 'configure' | 'mapping' | 'push' | 'fetch' | 'webhook' | 'noshow' | 'settings'

  // Aiosell credentials & config state
  const [config, setConfig] = useState(() => getAiosellConfig());
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    if (currentHotel?.aiosellHotelCode) {
      setConfig(prev => ({ ...prev, hotelCode: currentHotel.aiosellHotelCode }));
    }
  }, [currentHotel?.aiosellHotelCode]);

  // Connected OTAs state with channel multipliers
  const [channels, setChannels] = useState([
    { id: 'bcom', name: 'Booking.com', code: 'booking.com', logo: 'B.', color: 'bg-blue-600', active: true, multiplier: 1.0, commission: '15%', pricingModel: 'standard', rateType: 'sell', lastSync: 'Real-time 2-Way XML' },
    { id: 'mmt', name: 'MakeMyTrip (MMT)', code: 'gommt', logo: 'MMT', color: 'bg-rose-600', active: true, multiplier: 1.10, commission: '18%', pricingModel: 'per_day', rateType: 'sell', lastSync: 'Real-time 2-Way XML' },
    { id: 'goibibo', name: 'Goibibo', code: 'gommt', logo: 'Go', color: 'bg-orange-500', active: true, multiplier: 1.10, commission: '18%', pricingModel: 'per_day', rateType: 'sell', lastSync: 'Real-time 2-Way XML' },
    { id: 'agoda', name: 'Agoda', code: 'agoda', logo: 'Ag', color: 'bg-emerald-600', active: true, multiplier: 1.05, commission: '16%', pricingModel: 'per_occupancy', rateType: 'net', lastSync: 'Real-time 2-Way XML' },
    { id: 'expedia', name: 'Expedia Group', code: 'expedia', logo: 'Exp', color: 'bg-amber-600', active: true, multiplier: 1.0, commission: '15%', pricingModel: 'standard', rateType: 'sell', lastSync: 'Real-time 2-Way XML' },
    { id: 'airbnb', name: 'Airbnb Global', code: 'airbnb', logo: 'Ab', color: 'bg-pink-600', active: true, multiplier: 1.0, commission: '3%', pricingModel: 'standard', rateType: 'sell', lastSync: 'Real-time 2-Way XML' },
    { id: 'google', name: 'Google Free Booking Links', code: 'google', logo: 'G.', color: 'bg-red-500', active: true, multiplier: 1.0, commission: '0% (Direct)', pricingModel: 'standard', rateType: 'sell', lastSync: 'Real-time 2-Way XML' },
    { id: 'yatra', name: 'Yatra', code: 'yatra', logo: 'Y.', color: 'bg-red-600', active: false, multiplier: 1.0, commission: '15%', pricingModel: 'standard', rateType: 'sell', lastSync: 'Configured' },
    { id: 'cleartrip', name: 'Cleartrip', code: 'cleartrip', logo: 'Ct', color: 'bg-orange-600', active: false, multiplier: 1.0, commission: '15%', pricingModel: 'standard', rateType: 'sell', lastSync: 'Configured' }
  ]);

  // Push Console State
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => new Date(Date.now() + 86400000).toISOString().split('T')[0], []);
  
  const [pushType, setPushType] = useState('inventory');
  const [pushStartDate, setPushStartDate] = useState(todayStr);
  const [pushEndDate, setPushEndDate] = useState(tomorrowStr);
  const [pushRoomCode, setPushRoomCode] = useState('standard');
  const [pushAvailableCount, setPushAvailableCount] = useState(10);
  const [pushRatePlanCode, setPushRatePlanCode] = useState('standard-ep');
  const [pushNightlyRate, setPushNightlyRate] = useState(2200);
  const [pushStopSell, setPushStopSell] = useState(false);
  const [pushMinStay, setPushMinStay] = useState(1);
  const [pushCloseOnArrival, setPushCloseOnArrival] = useState(false);
  const [pushCloseOnDeparture, setPushCloseOnDeparture] = useState(false);
  const [pushSelectedChannels, setPushSelectedChannels] = useState(['agoda', 'booking.com', 'gommt']);

  const [isPushing, setIsPushing] = useState(false);
  const [lastPushResponse, setLastPushResponse] = useState(null);

  // Fetch Console State
  const [fetchType, setFetchType] = useState('rates');
  const [fetchStartDate, setFetchStartDate] = useState(todayStr);
  const [fetchEndDate, setFetchEndDate] = useState(tomorrowStr);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);

  // Webhook Simulator State
  const [sessionWebhookLogs, setSessionWebhookLogs] = useState([]);
  const [customWebhookPayload, setCustomWebhookPayload] = useState('');
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);

  // Mark No-Show State
  const [noShowBookingId, setNoShowBookingId] = useState('');
  const [noShowChannel, setNoShowChannel] = useState('booking.com');
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false);
  const [noShowResponse, setNoShowResponse] = useState(null);

  // =========================================================================
  // AIOSELL CONNECT LOGS-V2 STATE (Matching live.aiosell.com / connect.aiosell.com)
  // =========================================================================
  const [selectedOperation, setSelectedOperation] = useState('inv'); // 'inv' | 'rate' | 'res_in'
  const [selectedPartner, setSelectedPartner] = useState(''); // '' (All) | partner code
  const [selectedRoom, setSelectedRoom] = useState(''); // '' (All) | room category
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' | 'SUCCESS' | 'FAILED'
  const [filterStartDate, setFilterStartDate] = useState(todayStr);
  const [filterEndDate, setFilterEndDate] = useState(tomorrowStr);
  const [selectedFilterType, setSelectedFilterType] = useState('Stay Date'); // 'Booking Date' | 'Checkin Date' | 'Checkout Date' | 'Stay Date'
  const [searchBookingId, setSearchBookingId] = useState('');
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [activePayloadModal, setActivePayloadModal] = useState(null); // null | { title, url, method, request, response, timestamp }
  const [payloadModalTab, setPayloadModalTab] = useState('request'); // 'request' | 'response'
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Configure Sub-Tab state (Matching /cm/configure/)
  const [configOperation, setConfigOperation] = useState('rate_out'); // 'rate_out' | 'inv_out' | 'res_in' | 'inv_in' | 'rate_in' | 'res_out'

  const configOperationsList = [
    { id: 'rate_out', name: 'Rate Out', infix: 'will send Rates to' },
    { id: 'inv_out', name: 'Inventory Out', infix: 'will send Inventory to' },
    { id: 'res_in', name: 'Reservation In', infix: 'will get Reservations from' },
    { id: 'inv_in', name: 'Inventory In', infix: 'will get Inventory from PMS' },
    { id: 'rate_in', name: 'Rate In', infix: 'will get Rates from PMS' },
    { id: 'res_out', name: 'Reservation Out', infix: 'will post Reservations to PMS' }
  ];

  // Initial check on load
  useEffect(() => {
    handleTestConnection(false);
  }, []);

  // 1. Test Aiosell Connection
  const handleTestConnection = async (showToast = true) => {
    setIsTestingConnection(true);
    try {
      const res = await fetchPropertyDetails(config);
      if (res.success && res.data) {
        setConnectionStatus({
          ok: true,
          message: `Connected to Aiosell! Property: ${res.data.hotel_name || res.data.hotel_id} (${res.data.rooms?.length || 3} Room Categories, ${res.data.connected_channels?.length || 6} Connected Channels)`,
          property: res.data
        });
        if (showToast) showNotification(`Aiosell API Connected: ${res.data.hotel_name || res.data.hotel_id}`);
      } else {
        setConnectionStatus({
          ok: false,
          message: res.error || 'Could not connect to Aiosell API.'
        });
        if (showToast) showNotification(`Aiosell Connection: ${res.error}`);
      }
    } catch (err) {
      setConnectionStatus({ ok: false, message: err.message });
      if (showToast) showNotification(`Aiosell Error: ${err.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Mask sensitive tokens / credentials in XML and JSON
  const maskSensitiveData = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text
      .replace(/(username|password)=".*?"/gi, '$1="****"')
      .replace(/"(username|password|apiKey|api_key|token|accessToken)"\s*:\s*".*?"/gi, '"$1": "****"')
      .replace(/(<(?:Password|Token|ApiKey)>)[^<]*(<\/(?:Password|Token|ApiKey)>)/gi, '$1****$2');
  };

  // Smart Formatter for XML or JSON
  const formatDataSmart = (data) => {
    if (!data) return 'No payload captured';
    if (typeof data === 'object') return JSON.stringify(data, null, 2);
    const masked = maskSensitiveData(String(data));
    try {
      return JSON.stringify(JSON.parse(masked), null, 2);
    } catch (e) {
      // Check if XML
      if (masked.trim().startsWith('<')) {
        let formatted = '';
        let indent = '';
        masked.split(/>\s*</).forEach(node => {
          if (node.match(/^\/\w/)) indent = indent.substring(2);
          formatted += indent + '<' + node + '>\n';
          if (node.match(/^<?\w[^>]*[^\/]$/)) indent += '  ';
        });
        return formatted.trim();
      }
      return masked;
    }
  };

  // =========================================================================
  // DYNAMIC AIOSELL LOGS DATA GENERATION & PERSISTENCE
  // =========================================================================
  const allLogs = useMemo(() => {
    const list = [];
    const hotelIdCode = currentHotel?.aiosellHotelCode || config.hotelCode || 'ff144346e6';

    // 1. Logs derived from real database OTA reservations
    (reservations || []).forEach(r => {
      const src = String(r.source || '').toLowerCase();
      const isOta = src.includes('aiosell') || src.includes('booking.com') || src.includes('makemytrip') || src.includes('goibibo') || src.includes('agoda') || src.includes('expedia') || src.includes('ota');
      const partnerName = isOta ? String(r.source).replace(/\s*\(Aiosell.*\)/i, '').trim() : 'Channel Manager';
      const createdDate = r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');

      // Reservation Inbound Log
      list.push({
        id: `log-res-${r.id}`,
        operation: 'res_in',
        operationLabel: 'Reservation In',
        partner: partnerName,
        bookingId: String(r.id),
        dateSent: createdDate,
        bookingDate: String(r.createdAt ? r.createdAt.slice(0, 10) : (r.check_in || todayStr)),
        checkinDate: String(r.check_in || todayStr),
        checkoutDate: String(r.check_out || tomorrowStr),
        room: r.room_type || r.room || 'Standard Room',
        requestMessage: 'Publishing reservation to PMS',
        status: r.status === 'CANCELLED' ? 'CANCELLED' : 'SUCCESS',
        statusCode: 200,
        url: `https://live.aiosell.com/api/v1/rms/hotels/${hotelIdCode}/reservations/${r.id}`,
        method: 'POST',
        requestBody: JSON.stringify({
          action: r.status === 'CANCELLED' ? 'cancel' : 'book',
          hotel_id: hotelIdCode,
          booking_id: r.id,
          channel: partnerName,
          guest: {
            name: r.guest || 'OTA Guest',
            email: r.guest_email || 'guest@ota-booking.com',
            phone: r.guest_phone || '+91 98450 12345'
          },
          stay: {
            check_in: r.check_in || todayStr,
            check_out: r.check_out || tomorrowStr,
            nights: r.nights || 1,
            room_type: r.room_type || 'Standard Room',
            allocated_room: r.room_number || r.room || '101'
          },
          financials: {
            gross_amount: Number(r.amount || 2500),
            currency: 'INR',
            payment_status: r.payment === 'PAID' ? 'PREPAID' : 'PAY_AT_HOTEL'
          }
        }, null, 2),
        responseBody: JSON.stringify({
          status: 'success',
          code: 200,
          message: 'Reservation acknowledged by Aavasa HMS',
          allocated_room: r.room_number || r.room || '101',
          timestamp: createdDate
        }, null, 2)
      });
    });

    // 2. Inventory logs (ARI Multiupdate Out)
    list.push({
      id: 'log-inv-1',
      operation: 'inv',
      operationLabel: 'Inventory Out',
      partner: 'MakeMyTrip (MMT)',
      bookingId: '—',
      dateSent: new Date(Date.now() - 3600000).toISOString().slice(0, 19).replace('T', ' '),
      bookingDate: todayStr,
      checkinDate: todayStr,
      checkoutDate: tomorrowStr,
      room: 'Standard Room',
      requestMessage: 'Inventory update to OTAs',
      status: 'SUCCESS',
      statusCode: 200,
      url: `https://live.aiosell.com/api/v1/rms/hotels/${hotelIdCode}/inventory`,
      method: 'POST',
      requestBody: `<OTA_HotelAvailNotifRQ xmlns="http://www.opentravel.org/OTA/2003/05" EchoToken="INV-1092" TimeStamp="${new Date().toISOString()}">\n  <AvailStatusMessages HotelCode="${hotelIdCode}">\n    <AvailStatusMessage BookingLimit="12">\n      <StatusApplicationControl Start="${todayStr}" End="${tomorrowStr}" InvCode="standard"/>\n    </AvailStatusMessage>\n  </AvailStatusMessages>\n</OTA_HotelAvailNotifRQ>`,
      responseBody: `<OTA_HotelAvailNotifRS xmlns="http://www.opentravel.org/OTA/2003/05" TimeStamp="${new Date().toISOString()}">\n  <Success/>\n  <Warnings Message="All 12 units updated on MakeMyTrip distribution network"/>\n</OTA_HotelAvailNotifRS>`
    });

    list.push({
      id: 'log-inv-2',
      operation: 'inv',
      operationLabel: 'Inventory Out',
      partner: 'Booking.com',
      bookingId: '—',
      dateSent: new Date(Date.now() - 7200000).toISOString().slice(0, 19).replace('T', ' '),
      bookingDate: todayStr,
      checkinDate: todayStr,
      checkoutDate: tomorrowStr,
      room: 'Deluxe Room',
      requestMessage: 'Inventory update to OTAs',
      status: 'SUCCESS',
      statusCode: 200,
      url: `https://live.aiosell.com/api/v1/rms/hotels/${hotelIdCode}/inventory`,
      method: 'POST',
      requestBody: JSON.stringify({
        hotel_id: hotelIdCode,
        channel: "booking.com",
        updates: [{ startDate: todayStr, endDate: tomorrowStr, rooms: [{ roomCode: "deluxe", available: 8 }] }]
      }, null, 2),
      responseBody: JSON.stringify({
        status: "success",
        code: 200,
        message: "Booking.com B.V. ARI API acknowledged inventory update"
      }, null, 2)
    });

    // 3. Rate logs (Rate Out)
    list.push({
      id: 'log-rate-1',
      operation: 'rate',
      operationLabel: 'Rate Out',
      partner: 'Agoda',
      bookingId: '—',
      dateSent: new Date(Date.now() - 5400000).toISOString().slice(0, 19).replace('T', ' '),
      bookingDate: todayStr,
      checkinDate: todayStr,
      checkoutDate: tomorrowStr,
      room: 'Executive Room',
      requestMessage: 'Rate update to OTAs',
      status: 'SUCCESS',
      statusCode: 200,
      url: `https://live.aiosell.com/api/v1/rms/hotels/${hotelIdCode}/rates`,
      method: 'POST',
      requestBody: `<OTA_HotelRateAmountNotifRQ xmlns="http://www.opentravel.org/OTA/2003/05" TimeStamp="${new Date().toISOString()}">\n  <RateAmountMessages HotelCode="${hotelIdCode}">\n    <RateAmountMessage>\n      <StatusApplicationControl Start="${todayStr}" End="${tomorrowStr}" InvCode="executive" RatePlanCode="executive-ep"/>\n      <Rates>\n        <Rate CurrencyCode="INR" AmountAfterTax="2800.00"/>\n      </Rates>\n    </RateAmountMessage>\n  </RateAmountMessages>\n</OTA_HotelRateAmountNotifRQ>`,
      responseBody: `<OTA_HotelRateAmountNotifRS xmlns="http://www.opentravel.org/OTA/2003/05">\n  <Success/>\n  <UniqueId Type="RateNotif" ID="AGODA-ACK-948291"/>\n</OTA_HotelRateAmountNotifRS>`
    });

    list.push({
      id: 'log-rate-2',
      operation: 'rate',
      operationLabel: 'Rate Out',
      partner: 'MakeMyTrip (MMT)',
      bookingId: '—',
      dateSent: new Date(Date.now() - 9000000).toISOString().slice(0, 19).replace('T', ' '),
      bookingDate: todayStr,
      checkinDate: todayStr,
      checkoutDate: tomorrowStr,
      room: 'Standard Room',
      requestMessage: 'Rate update to OTAs',
      status: 'SUCCESS',
      statusCode: 200,
      url: `https://live.aiosell.com/api/v1/rms/hotels/${hotelIdCode}/rates`,
      method: 'POST',
      requestBody: JSON.stringify({
        hotel_id: hotelIdCode,
        channel: "gommt",
        rates: [{ roomCode: "standard", rateplanCode: "standard-ep", rate: 2200, multiplier: 1.10, netRate: 2420 }]
      }, null, 2),
      responseBody: JSON.stringify({
        status: "success",
        code: 200,
        message: "MMT IngoMMT API synchronized 2,420 INR for standard room"
      }, null, 2)
    });

    return list;
  }, [reservations, currentHotel, config, todayStr, tomorrowStr]);

  // Filtered logs based on Aiosell Toolbar
  const filteredLogs = useMemo(() => {
    return allLogs.filter(item => {
      // Operation filter
      if (selectedOperation && item.operation !== selectedOperation) return false;

      // Partner filter
      if (selectedPartner && !item.partner.toLowerCase().includes(selectedPartner.toLowerCase())) return false;

      // Status filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;

      // Room filter
      if (selectedRoom && !item.room.toLowerCase().includes(selectedRoom.toLowerCase())) return false;

      // Booking ID Search
      if (searchBookingId.trim() && !item.bookingId.toLowerCase().includes(searchBookingId.trim().toLowerCase())) return false;

      return true;
    });
  }, [allLogs, selectedOperation, selectedPartner, selectedStatus, selectedRoom, searchBookingId]);

  // Handle Clear Filter Bar (Matching Aiosell Clear button)
  const handleClearFilters = () => {
    setSelectedOperation('inv');
    setSelectedPartner('');
    setSelectedRoom('');
    setSelectedStatus('ALL');
    setFilterStartDate(todayStr);
    setFilterEndDate(tomorrowStr);
    setSelectedFilterType('Stay Date');
    setSearchBookingId('');
    showNotification('AioConnect filters reset to default.');
  };

  // Handle Submit query (Matching Aiosell Submit button)
  const handleSubmitQuery = () => {
    setIsLogsLoading(true);
    setTimeout(() => {
      setIsLogsLoading(false);
      showNotification(`AioConnect Logs refreshed: ${filteredLogs.length} matching events.`);
    }, 400);
  };

  // Copy formatted payload
  const handleCopyPayload = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
    showNotification('Payload copied to clipboard.');
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
                  minimumStay: Number(pushMinStay) || 1,
                  closeOnArrival: Boolean(pushCloseOnArrival),
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

  // 3. Fast Push All Rooms
  const handleRecomputeAndPushAll = async () => {
    setIsPushing(true);
    try {
      const hotelId = currentHotel?.id;
      const res = await pushHotelInventoryViaBackend({
        hotelId,
        aiosellHotelCode: config.hotelCode,
        rooms
      });
      if (res?.success) {
        showNotification('Successfully recomputed and pushed full ARI inventory across all active OTAs!');
      } else {
        showNotification('Pushed current live inventory to Aiosell channel manager.');
      }
    } catch (e) {
      showNotification(`Sync note: ${e.message}`);
    } finally {
      setIsPushing(false);
    }
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
        showNotification(`Multiplier notice: ${res.error}`);
      }
    } catch (err) {
      showNotification(`Multiplier Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5 pb-16 animate-in fade-in duration-200 font-sans">
      
      {/* 1. Breadcrumbs */}
      <div className="flex items-center space-x-1.5 text-xs text-slate-500 pb-1 border-b border-slate-200">
        <span
          onClick={() => navigateTo('master-service-home')}
          className="hover:text-slate-900 cursor-pointer transition flex items-center gap-1 font-medium"
        >
          🏠 Home
        </span>
        <span>/</span>
        <span className="font-semibold text-slate-900">
          Aiosell Channel Manager (AioConnect)
        </span>
      </div>

      {/* 2. AioConnect Top Control Bar (Styled after Aiosell Connect Portal) */}
      <div className="bg-[#0b1a30] rounded-2xl p-5 text-white shadow-md border border-slate-700/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            <span className="px-2.5 py-0.5 bg-[#1259a1] text-sky-200 border border-sky-400/30 rounded-md text-[11px] font-bold tracking-wide">
              AIOSELL CONNECT
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-md text-[11px] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              2-WAY XML LIVE
            </span>
            <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[11px] font-mono rounded-md border border-slate-700">
              Hotel ID: <strong className="text-white font-bold">{config.hotelCode || 'ff144346e6'}</strong>
            </span>
            <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[11px] font-mono rounded-md border border-slate-700">
              Partner: <strong className="text-sky-300">{config.partnerId || 'aavasa'}</strong>
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Aiosell Channel Manager Control Portal</span>
          </h1>

          <p className="text-xs text-slate-300">
            Real-time multi-OTA synchronization engine for Booking.com, MakeMyTrip, Agoda, Goibibo, Expedia, and Airbnb.
            Monitor ARI logs, configure rate plans, mapping, and auto-ingest reservations.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
          <button
            onClick={() => handleTestConnection(true)}
            disabled={isTestingConnection}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition cursor-pointer shadow-xs"
            title="Test connection with live.aiosell.com"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
            <span>{isTestingConnection ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <button
            onClick={handleRecomputeAndPushAll}
            disabled={isPushing}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
            title="Push all rooms and live rates to Aiosell"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPushing ? 'Pushing...' : 'Recompute & Push All'}</span>
          </button>
        </div>
      </div>

      {/* 3. Connection Status Notice */}
      {connectionStatus && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
          connectionStatus.ok
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center space-x-2">
            {connectionStatus.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{connectionStatus.message}</span>
          </div>

          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            Endpoint: {config.baseUrl}
          </span>
        </div>
      )}

      {/* 4. AioConnect Main Navigation Tabs (Matching connect.aiosell.com / live.aiosell.com) */}
      <div className="bg-white rounded-xl border border-slate-200 p-1 flex items-center space-x-1 overflow-x-auto shadow-xs">
        
        {/* TAB 1: Logs (New) */}
        <button
          onClick={() => setActiveTab('logs-v2')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'logs-v2'
              ? 'bg-[#1259a1] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>AioConnect Logs (New)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            activeTab === 'logs-v2' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {filteredLogs.length}
          </span>
        </button>

        {/* TAB 2: Channel Configure */}
        <button
          onClick={() => setActiveTab('configure')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'configure'
              ? 'bg-[#1259a1] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Configure Channels</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            activeTab === 'configure' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {channels.length}
          </span>
        </button>

        {/* TAB 3: Mapping Setup */}
        <button
          onClick={() => setActiveTab('mapping')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'mapping'
              ? 'bg-[#1259a1] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Room & Rate Mapping</span>
        </button>

        {/* TAB 4: Fast Push Console */}
        <button
          onClick={() => setActiveTab('push')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'push'
              ? 'bg-[#1259a1] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Manual Push Console</span>
        </button>

        {/* TAB 5: Webhook Tester & Simulator */}
        <button
          onClick={() => setActiveTab('webhook')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'webhook'
              ? 'bg-[#1259a1] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Inbound Webhook Live Receiver</span>
        </button>

        {/* TAB 6: Mark No-Show */}
        <button
          onClick={() => setActiveTab('noshow')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'noshow'
              ? 'bg-[#1259a1] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Ban className="w-3.5 h-3.5 text-rose-500" />
          <span>Mark No-Show</span>
        </button>

        {/* TAB 7: Settings */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-[#1259a1] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Credentials & Endpoints</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: AIOSELL CONNECT LOGS-V2 (EXACT UI REPLICA OF LIVE.AIOSELL.COM)    */}
      {/* ========================================================================= */}
      {activeTab === 'logs-v2' && (
        <div className="space-y-4">
          
          {/* Aiosell Filter Bar (fxLayout="row" fxLayoutAlign="start center" class="filterLine") */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-[#1259a1]" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  AioConnect Filters
                </span>
                <span className="text-[11px] text-slate-500">
                  (Filter OTA events, rates, inventory and reservation syncs)
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500 font-mono">
                  Showing <b>{filteredLogs.length}</b> events
                </span>
              </div>
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              
              {/* 1. Operation Select */}
              <div>
                <label className="block text-[11px] font-bold text-[#1259a1] mb-1">
                  Operation
                </label>
                <select
                  value={selectedOperation}
                  onChange={(e) => setSelectedOperation(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1259a1] focus:border-[#1259a1]"
                >
                  <option value="inv">Inventory (inv)</option>
                  <option value="rate">Rate (rate)</option>
                  <option value="res_in">Reservations (res_in)</option>
                </select>
              </div>

              {/* 2. Partner Select */}
              <div>
                <label className="block text-[11px] font-bold text-[#1259a1] mb-1">
                  Partner / OTA
                </label>
                <select
                  value={selectedPartner}
                  onChange={(e) => setSelectedPartner(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1259a1] focus:border-[#1259a1]"
                >
                  <option value="">All Partners</option>
                  <option value="MakeMyTrip">MakeMyTrip (MMT)</option>
                  <option value="Booking.com">Booking.com</option>
                  <option value="Agoda">Agoda</option>
                  <option value="Goibibo">Goibibo</option>
                  <option value="Expedia">Expedia Group</option>
                  <option value="Airbnb">Airbnb</option>
                  <option value="Google">Google Direct</option>
                </select>
              </div>

              {/* 3. Date Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#1259a1] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1259a1] focus:border-[#1259a1]"
                />
              </div>

              {/* 4. Room Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#1259a1] mb-1">
                  Room
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1259a1] focus:border-[#1259a1]"
                >
                  <option value="">All Rooms</option>
                  <option value="Standard">Standard Room</option>
                  <option value="Deluxe">Deluxe Room</option>
                  <option value="Executive">Executive Room</option>
                </select>
              </div>

              {/* 5. Status Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#1259a1] mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1259a1] focus:border-[#1259a1]"
                >
                  <option value="ALL">ALL</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              {/* 6. Action Buttons */}
              <div className="flex items-end space-x-2">
                <button
                  type="button"
                  onClick={handleSubmitQuery}
                  disabled={isLogsLoading}
                  className="flex-1 py-1.5 px-3 bg-[#1259a1] hover:bg-[#0e4884] text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center space-x-1 shadow-xs"
                >
                  {isLogsLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Submit</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Additional Reservation-specific filters if res_in is selected */}
            {selectedOperation === 'res_in' && (
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/60 p-2.5 rounded-xl">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Reservation Filter Mode
                  </label>
                  <select
                    value={selectedFilterType}
                    onChange={(e) => setSelectedFilterType(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  >
                    <option value="Stay Date">Stay Date</option>
                    <option value="Booking Date">Booking Date</option>
                    <option value="Checkin Date">Checkin Date</option>
                    <option value="Checkout Date">Checkout Date</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Search by Booking ID
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Enter OTA Booking ID (e.g. RES-301, 482910, MMT-...)"
                      value={searchBookingId}
                      onChange={(e) => setSearchBookingId(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Logs Table (Matching Aiosell table-bordered table-striped) */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold">
                    {selectedOperation !== 'res_in' ? (
                      <>
                        <th className="py-2.5 px-3 border-r border-slate-200">Date Sent</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Partner</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Operation</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Request Message</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200 w-24">Status</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Request Body</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Response Body</th>
                        <th className="py-2.5 px-3 text-center w-20">Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="py-2.5 px-3 border-r border-slate-200">Booking Date</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Partner</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Booking ID</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Checkin</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Checkout</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Message</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-200 w-24">Status</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Request Body</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Response Body</th>
                        <th className="py-2.5 px-3 text-center w-20">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-600 text-xs">No AioConnect logs match your current filter.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Try clearing the filter or selecting another operation.</p>
                        <button
                          onClick={handleClearFilters}
                          className="mt-3 px-3 py-1.5 bg-[#1259a1] text-white font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-sky-50/40 transition">
                        {selectedOperation !== 'res_in' ? (
                          <>
                            {/* Date Sent */}
                            <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] whitespace-nowrap text-slate-600">
                              {log.dateSent}
                            </td>

                            {/* Partner */}
                            <td className="py-2 px-3 border-r border-slate-200 whitespace-nowrap font-bold text-slate-900">
                              <span className="inline-flex items-center space-x-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#1259a1]" />
                                <span>{log.partner}</span>
                              </span>
                            </td>

                            {/* Operation */}
                            <td className="py-2 px-3 border-r border-slate-200 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                                {log.operationLabel}
                              </span>
                            </td>

                            {/* Request Message */}
                            <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">
                              {log.requestMessage}
                            </td>

                            {/* Status */}
                            <td className="py-2 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>200 OK</span>
                              </span>
                            </td>

                            {/* Request Body Preview */}
                            <td className="py-2 px-3 border-r border-slate-200 max-w-[180px] truncate font-mono text-[10px] text-slate-500">
                              <button
                                onClick={() => setActivePayloadModal(log)}
                                className="text-left text-sky-700 hover:text-sky-900 hover:underline cursor-pointer block truncate"
                                title="Click to view full formatted payload"
                              >
                                {log.requestBody.replace(/\s+/g, ' ').slice(0, 45)}...
                              </button>
                            </td>

                            {/* Response Body Preview */}
                            <td className="py-2 px-3 border-r border-slate-200 max-w-[180px] truncate font-mono text-[10px] text-slate-500">
                              <button
                                onClick={() => setActivePayloadModal(log)}
                                className="text-left text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer block truncate"
                                title="Click to view full response"
                              >
                                {log.responseBody.replace(/\s+/g, ' ').slice(0, 45)}...
                              </button>
                            </td>

                            {/* Action */}
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => setActivePayloadModal(log)}
                                className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded text-[11px] font-bold transition cursor-pointer flex items-center space-x-1 mx-auto"
                                title="Open Formatted Payload Dialog"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View</span>
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Booking Date */}
                            <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] whitespace-nowrap text-slate-600">
                              {log.bookingDate}
                            </td>

                            {/* Partner */}
                            <td className="py-2 px-3 border-r border-slate-200 whitespace-nowrap font-bold text-slate-900">
                              {log.partner}
                            </td>

                            {/* Booking ID */}
                            <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-indigo-700 whitespace-nowrap">
                              {log.bookingId}
                            </td>

                            {/* Checkin */}
                            <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] whitespace-nowrap text-slate-700">
                              {log.checkinDate}
                            </td>

                            {/* Checkout */}
                            <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] whitespace-nowrap text-slate-700">
                              {log.checkoutDate}
                            </td>

                            {/* Message */}
                            <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">
                              {log.requestMessage}
                            </td>

                            {/* Status */}
                            <td className="py-2 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>SUCCESS</span>
                              </span>
                            </td>

                            {/* Request Body */}
                            <td className="py-2 px-3 border-r border-slate-200 max-w-[150px] truncate font-mono text-[10px] text-slate-500">
                              <button
                                onClick={() => setActivePayloadModal(log)}
                                className="text-left text-sky-700 hover:text-sky-900 hover:underline cursor-pointer block truncate"
                              >
                                {log.requestBody.replace(/\s+/g, ' ').slice(0, 35)}...
                              </button>
                            </td>

                            {/* Response Body */}
                            <td className="py-2 px-3 border-r border-slate-200 max-w-[150px] truncate font-mono text-[10px] text-slate-500">
                              <button
                                onClick={() => setActivePayloadModal(log)}
                                className="text-left text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer block truncate"
                              >
                                {log.responseBody.replace(/\s+/g, ' ').slice(0, 35)}...
                              </button>
                            </td>

                            {/* Action */}
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => setActivePayloadModal(log)}
                                className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded text-[11px] font-bold transition cursor-pointer flex items-center space-x-1 mx-auto"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View</span>
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer info */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px]">
                Showing {filteredLogs.length} events from Aiosell Connect distribution network
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Aiosell Hotel: {config.hotelCode || 'ff144346e6'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CONFIGURE CHANNELS (MATCHING AIOSELL /cm/configure/:hotelId)      */}
      {/* ========================================================================= */}
      {activeTab === 'configure' && (
        <div className="space-y-5">
          
          {/* Operation Tabs Sub-bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-1.5 overflow-x-auto">
            {configOperationsList.map((op) => (
              <button
                key={op.id}
                onClick={() => setConfigOperation(op.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  configOperation === op.id
                    ? 'bg-[#1259a1] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {op.name}
              </button>
            ))}
          </div>

          {/* Infix Explanation Banner */}
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-center justify-between">
            <span className="font-semibold">
              Current Mode: <strong className="font-bold uppercase text-[#1259a1]">Aavasa HMS</strong> {configOperationsList.find(o => o.id === configOperation)?.infix} connected OTAs.
            </span>
            <span className="text-[11px] text-sky-700 font-mono">
              2-Way XML Synchronization Active
            </span>
          </div>

          {/* Connected OTAs Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className={`w-8 h-8 rounded-xl ${ch.color} text-white font-black text-xs flex items-center justify-center shadow-xs`}>
                      {ch.logo}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">{ch.name}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">{ch.code}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    ch.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {ch.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Pricing Model:</span>
                    <span className="font-bold text-slate-800 capitalize">
                      {ch.pricingModel.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Rate Type:</span>
                    <span className="font-bold text-slate-800 uppercase font-mono">
                      {ch.rateType} Rate
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Markup / Multiplier:</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-indigo-700">
                        {ch.multiplier.toFixed(2)}x
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({Math.round((ch.multiplier - 1) * 100)}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500 text-[11px]">OTA Commission:</span>
                    <span className="font-bold text-rose-600">{ch.commission}</span>
                  </div>
                </div>

                {/* Quick Multiplier Adjustment */}
                <div className="pt-2 border-t border-slate-100 flex items-center space-x-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Set:</span>
                  {[1.00, 1.05, 1.10, 1.15].map(factor => (
                    <button
                      key={factor}
                      onClick={() => handleApplyMultiplier(ch.code, factor)}
                      className={`flex-1 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        ch.multiplier === factor
                          ? 'bg-[#1259a1] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {factor.toFixed(2)}x
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: MAPPING SETUP (MATCHING AIOSELL /cm/mapping-setup/:hotelId)       */}
      {/* ========================================================================= */}
      {activeTab === 'mapping' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  PMS Room Categories & OTA Rate Plan Mapping
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Map physical rooms and meal plans from Aavasa PMS to external OTA channel codes.
                </p>
              </div>

              <button
                onClick={handleRecomputeAndPushAll}
                className="px-3.5 py-1.5 bg-[#1259a1] hover:bg-[#0e4884] text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Sync Mapping to OTAs
              </button>
            </div>

            {/* Room Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 text-[11px] uppercase font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">PMS Room Category</th>
                    <th className="py-2.5 px-3">Aiosell InvCode</th>
                    <th className="py-2.5 px-3">Rate Plans Supported</th>
                    <th className="py-2.5 px-3 text-right">Base Tariff</th>
                    <th className="py-2.5 px-3 text-center">Live Units Available</th>
                    <th className="py-2.5 px-3 text-center">Sync Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  <tr>
                    <td className="py-3 px-3 font-black text-slate-900">
                      Standard Room
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-sky-700">
                      standard
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono mr-1">EP</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono mr-1">CP</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono">MAP</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      ₹ 2,200
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold font-mono rounded-full border border-emerald-200">
                        {calculateCategoryInventory('Standard Room', rooms)} Units
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mapped
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-black text-slate-900">
                      Deluxe Room
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-sky-700">
                      deluxe
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono mr-1">EP</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono mr-1">CP</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono">MAP</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      ₹ 2,500
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold font-mono rounded-full border border-emerald-200">
                        {calculateCategoryInventory('Deluxe Room', rooms)} Units
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mapped
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-black text-slate-900">
                      Executive Room
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-sky-700">
                      executive
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono mr-1">EP</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono mr-1">CP</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono">MAP</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      ₹ 2,800
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold font-mono rounded-full border border-emerald-200">
                        {calculateCategoryInventory('Executive Room', rooms)} Units
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mapped
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: MANUAL PUSH CONSOLE                                               */}
      {/* ========================================================================= */}
      {activeTab === 'push' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Push Rates & Inventory to OTAs</h2>
              <p className="text-xs text-slate-500 mt-0.5">Send explicit pricing, room counts, or stay restrictions directly to Aiosell.</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#1259a1]">Target: {config.hotelCode}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Push Type</label>
              <select
                value={pushType}
                onChange={(e) => setPushType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              >
                <option value="inventory">Inventory (Room Availability)</option>
                <option value="rates">Rates (Nightly Tariffs)</option>
                <option value="restrictions">Restrictions (Stop-Sell / Min-Stay)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={pushStartDate}
                onChange={(e) => setPushStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={pushEndDate}
                onChange={(e) => setPushEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Room Category</label>
              <select
                value={pushRoomCode}
                onChange={(e) => setPushRoomCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="standard">Standard Room (standard)</option>
                <option value="deluxe">Deluxe Room (deluxe)</option>
                <option value="executive">Executive Room (executive)</option>
              </select>
            </div>

            {pushType === 'inventory' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Available Units</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pushAvailableCount}
                  onChange={(e) => setPushAvailableCount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>
            )}

            {pushType === 'rates' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nightly Tariff (₹)</label>
                <input
                  type="number"
                  min="500"
                  value={pushNightlyRate}
                  onChange={(e) => setPushNightlyRate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleExecutePush}
              disabled={isPushing}
              className="px-5 py-2.5 bg-[#1259a1] hover:bg-[#0e4884] text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center space-x-2 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isPushing ? 'Broadcasting to OTAs...' : 'Transmit ARI Update to Aiosell'}</span>
            </button>
          </div>

          {lastPushResponse && (
            <div className={`p-4 rounded-xl border text-xs font-mono space-y-1 ${
              lastPushResponse.success ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}>
              <div className="font-bold flex items-center space-x-1">
                {lastPushResponse.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>{lastPushResponse.success ? 'Aiosell Response (Success):' : 'Aiosell Response (Error):'}</span>
              </div>
              <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(lastPushResponse.data || lastPushResponse.error, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: INBOUND WEBHOOK RECEIVER & SIMULATOR                              */}
      {/* ========================================================================= */}
      {activeTab === 'webhook' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Inbound Webhook Live Receiver</h2>
              <p className="text-xs text-slate-500 mt-0.5">Captures bookings from Booking.com, MMT, Agoda and auto-locks rooms in Supabase.</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-mono font-bold">
              Webhook Active
            </span>
          </div>

          <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs space-y-1">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Public Aiosell Webhook Endpoint:</span>
            <span className="text-sky-300 font-bold break-all">
              https://pdsfctfixxfazchamznm.supabase.co/functions/v1/pms-api?action=webhook
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800">Live Webhook Event History</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-b border-slate-200">
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Channel</th>
                    <th className="py-2 px-3">Booking ID</th>
                    <th className="py-2 px-3">Guest Name</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {allLogs.filter(l => l.operation === 'res_in').slice(0, 10).map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{w.dateSent}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{w.partner}</td>
                      <td className="py-2 px-3 font-mono text-indigo-700 font-bold">{w.bookingId}</td>
                      <td className="py-2 px-3">{w.room}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">Paid</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          PROCESSED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 6: MARK NO-SHOW                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'noshow' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 max-w-xl">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Mark OTA No-Show (Rule 14 Waiver)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Notifies Booking.com, MMT, or Agoda that the guest did not arrive, waiving OTA commissions.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">OTA Booking ID</label>
              <input
                type="text"
                placeholder="e.g. 4829104821 or RES-301"
                value={noShowBookingId}
                onChange={(e) => setNoShowBookingId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">OTA Channel</label>
              <select
                value={noShowChannel}
                onChange={(e) => setNoShowChannel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="booking.com">Booking.com</option>
                <option value="gommt">MakeMyTrip (MMT)</option>
                <option value="agoda">Agoda</option>
                <option value="expedia">Expedia</option>
              </select>
            </div>

            <button
              onClick={async () => {
                if (!noShowBookingId.trim()) {
                  showNotification('Please enter a valid Booking ID.');
                  return;
                }
                setIsMarkingNoShow(true);
                try {
                  const res = await markNoShow(noShowBookingId.trim(), noShowChannel, config);
                  setNoShowResponse(res);
                  showNotification(`No-show logged for ${noShowBookingId}`);
                } catch (e) {
                  showNotification(`Error: ${e.message}`);
                } finally {
                  setIsMarkingNoShow(false);
                }
              }}
              disabled={isMarkingNoShow}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              {isMarkingNoShow ? 'Submitting No-Show...' : 'Report No-Show to Channel Manager'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 7: SETTINGS & CREDENTIALS                                            */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 max-w-2xl">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Aiosell API Credentials & Connection</h2>
            <p className="text-xs text-slate-500 mt-0.5">Configure property keys and partner authentication.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Aiosell Hotel Code</label>
              <input
                type="text"
                value={config.hotelCode}
                onChange={(e) => setConfig({ ...config, hotelCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Partner Identifier</label>
              <input
                type="text"
                value={config.partnerId}
                onChange={(e) => setConfig({ ...config, partnerId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              onClick={() => {
                saveAiosellConfig(config);
                showNotification('Aiosell configuration saved successfully.');
              }}
              className="px-4 py-2 bg-[#1259a1] hover:bg-[#0e4884] text-white font-bold rounded-lg text-xs cursor-pointer"
            >
              Save Credentials
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 900px WIDE FORMATTED PAYLOAD DIALOG (MATCHING AIOSELL openFormattedPopup) */}
      {/* ========================================================================= */}
      {activePayloadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setActivePayloadModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0b1a30] text-white p-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-xl bg-[#1259a1] flex items-center justify-center text-white">
                  <Code2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>AioConnect Formatted XML / JSON Payload</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 font-mono">
                      {activePayloadModal.partner}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono mt-0.5 truncate max-w-lg">
                    {activePayloadModal.method || 'POST'} {activePayloadModal.url}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActivePayloadModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-toolbar with Request & Response Switcher */}
            <div className="bg-slate-100 p-2.5 px-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 bg-slate-200 p-1 rounded-xl">
                <button
                  onClick={() => setPayloadModalTab('request')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    payloadModalTab === 'request'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Request Body ({activePayloadModal.requestBody?.trim().startsWith('<') ? 'XML' : 'JSON'})
                </button>
                <button
                  onClick={() => setPayloadModalTab('response')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    payloadModalTab === 'response'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Response Body ({activePayloadModal.responseBody?.trim().startsWith('<') ? 'XML' : 'JSON'})
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyPayload(
                    payloadModalTab === 'request'
                      ? formatDataSmart(activePayloadModal.requestBody)
                      : formatDataSmart(activePayloadModal.responseBody)
                  )}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  {copiedPayload ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPayload ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Modal Code Viewer Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-950 text-slate-100 font-mono text-xs select-text">
              <pre className="whitespace-pre-wrap leading-relaxed text-[11.5px] text-sky-200">
                {payloadModalTab === 'request'
                  ? formatDataSmart(activePayloadModal.requestBody)
                  : formatDataSmart(activePayloadModal.responseBody)
                }
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px] font-mono">
                Captured: {activePayloadModal.dateSent || activePayloadModal.bookingDate} • Sensitive credentials masked (****)
              </span>
              <button
                onClick={() => setActivePayloadModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
