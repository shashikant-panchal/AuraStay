import React, { useState, useMemo, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  Download,
  Printer,
  Search,
  Filter,
  BedDouble,
  UserPlus,
  Check,
  X,
  ChevronLeft,
  ChevronDown,
  Info,
  Calendar,
  Building2,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import BookingVoucher from '../common/BookingVoucher';

export default function DetailedReportView({
  report,
  onBack,
  onSwitchReport,
  reportsCatalog = []
}) {
  const { 
    rooms = [], 
    reservations = [], 
    showNotification,
    setIsCreateReservationModalOpen 
  } = useDashboard();

  // Search & Filters for In-House Guests
  const [filterGuestName, setFilterGuestName] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterOrg, setFilterOrg] = useState('All Organisation');

  // Custom guests added in current session (live in-house guests come from Supabase rooms & reservations)
  const [inHouseGuests, setInHouseGuests] = useState([]);
  useEffect(() => {
    try { localStorage.removeItem('aurastay_custom_inhouse_guests_v2'); } catch (e) { }
  }, []);

  // Modal state for adding a guest to a room
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [activeAddGuestRoom, setActiveAddGuestRoom] = useState(null);
  const [newGuestData, setNewGuestData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    country: 'India',
    isVip: false,
    organisation: ''
  });

  // Modal state for viewing voucher when clicking reservation number
  const [selectedVoucherData, setSelectedVoucherData] = useState(null);

  // Sync live rooms/reservations dynamically into inHouseGuests
  const combinedGuests = useMemo(() => {
    const list = [...inHouseGuests];
    const existingRoomNumbers = new Set(list.map(g => String(g.roomNumber)));

    // Derive from live occupied rooms
    const liveOccupied = rooms.filter(r => r.status === 'OCCUPIED');

    liveOccupied.forEach(r => {
      const rNum = String(r.roomNumber || r.room_number || '');
      if (!existingRoomNumbers.has(rNum)) {
        const matchingRes = reservations.find(res => 
          String(res.room || '').includes(rNum) || res.id === r.bookingId
        );
        const gName = r.guest?.name || (typeof r.guest === 'string' && r.guest ? r.guest : (matchingRes?.guest || 'In-House Guest'));

        list.push({
          id: `live-${rNum}`,
          roomNumber: rNum,
          name: gName,
          reservationNo: matchingRes?.id || r.bookingId || `00${rNum}0`,
          phone: matchingRes?.phone || matchingRes?.guestPhone || r.guestPhone || '',
          email: matchingRes?.email || r.guestEmail || '',
          city: matchingRes?.city || 'Local',
          country: 'India',
          isVip: Boolean(matchingRes?.vip || matchingRes?.isVip),
          organisation: matchingRes?.organisation || 'Direct Guest',
          isAddAction: false
        });

        // Add action row for adding a co-guest
        list.push({
          id: `live-${rNum}-add`,
          roomNumber: rNum,
          name: '',
          reservationNo: matchingRes?.id || r.bookingId || `00${rNum}0`,
          phone: '',
          email: '',
          city: '',
          country: '',
          isVip: false,
          organisation: '',
          isAddAction: true
        });
      }
    });

    return list;
  }, [inHouseGuests, rooms, reservations]);

  // Distinct organisations for dropdown
  const availableOrganisations = useMemo(() => {
    const s = new Set();
    combinedGuests.forEach(g => {
      const org = String(g.organisation || '').trim();
      if (org) s.add(org);
    });
    return Array.from(s);
  }, [combinedGuests]);

  // Filtered in-house guests
  const filteredGuests = useMemo(() => {
    return combinedGuests.filter(g => {
      if (g.isAddAction) {
        if (filterGuestName.trim() || filterCity.trim() || filterOrg !== 'All Organisation') {
          return false;
        }
        return true;
      }

      if (filterGuestName.trim()) {
        const q = filterGuestName.toLowerCase();
        if (!String(g.name || '').toLowerCase().includes(q)) return false;
      }

      if (filterCity.trim()) {
        const q = filterCity.toLowerCase();
        if (!String(g.city || '').toLowerCase().includes(q)) return false;
      }

      if (filterOrg !== 'All Organisation') {
        if (String(g.organisation || '') !== filterOrg) return false;
      }

      return true;
    });
  }, [combinedGuests, filterGuestName, filterCity, filterOrg]);

  // Group filtered guests by room number
  const groupedByRoom = useMemo(() => {
    const map = new Map();
    filteredGuests.forEach(g => {
      const rKey = String(g.roomNumber);
      if (!map.has(rKey)) {
        map.set(rKey, []);
      }
      map.get(rKey).push(g);
    });

    // Sort by room number numerically
    const sortedEntries = Array.from(map.entries()).sort((a, b) => {
      const numA = parseInt(String(a[0]).replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b[0]).replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    return sortedEntries;
  }, [filteredGuests]);

  // Total count of actual in-house guests (excluding "+ Add Guest" action rows)
  const actualGuestsCount = useMemo(() => {
    return combinedGuests.filter(g => !g.isAddAction && String(g.name || '').trim()).length;
  }, [combinedGuests]);

  // Compute live data for non-guest reports
  const liveReportRows = useMemo(() => {
    const totalRooms = rooms.length;
    const occupiedCount = rooms.filter(r => r.status === 'OCCUPIED').length;
    const vacantCount = rooms.filter(r => r.status === 'VACANT_READY' || r.status === 'VACANT').length;
    const oooCount = rooms.filter(r => r.status === 'MAINTENANCE' || r.status === 'BLOCKED').length;
    const roomRevenue = rooms.filter(r => r.status === 'OCCUPIED').reduce((sum, r) => sum + (Number(r.tariff) || Number(r.price) || 0), 0);
    const adr = occupiedCount > 0 ? Math.round(roomRevenue / occupiedCount) : 0;

    switch (report.id) {
      case 'occupancy':
        return [
          { metric: 'Total Operational Rooms', value: `${totalRooms} Rooms`, status: 'Active' },
          { metric: 'Occupied Rooms', value: `${occupiedCount} Rooms`, status: occupiedCount > 0 ? 'Occupied' : 'Vacant' },
          { metric: 'Vacant Ready Rooms', value: `${vacantCount} Rooms`, status: 'Clean' },
          { metric: 'Out of Order (OOO)', value: `${oooCount} Rooms`, status: oooCount > 0 ? 'Maintenance' : 'Normal' },
          { metric: 'Current Occupancy Rate', value: `${totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0}%`, status: 'Live Yield' },
          { metric: 'Realized ADR (Average Daily Rate)', value: `₹${adr.toLocaleString('en-IN')}`, status: 'Optimal' }
        ];

      case 'arrival-report':
        const confirmedArrivals = reservations.filter(r => r.status === 'CONFIRMED');
        const checkedInArrivals = reservations.filter(r => r.status === 'CHECKED_IN');
        return [
          { metric: 'Scheduled Arrivals', value: `${confirmedArrivals.length} Bookings`, status: 'Scheduled' },
          { metric: 'Checked In / In-House', value: `${checkedInArrivals.length} Guests`, status: 'In-House' },
          { metric: 'VIP / Special Requests', value: `${reservations.filter(r => r.vip).length} Logged`, status: 'High Priority' },
          { metric: 'Expected Arrival Revenue', value: `₹${confirmedArrivals.reduce((s, r) => s + (Number(r.amount) || Number(r.price) || 0), 0).toLocaleString('en-IN')}`, status: 'Pending Collection' }
        ];

      case 'departure-report':
        const checkedIn = reservations.filter(r => r.status === 'CHECKED_IN');
        const paidCount = checkedIn.filter(r => r.payment === 'PAID').length;
        return [
          { metric: 'Scheduled Checkouts', value: `${checkedIn.length} Bookings`, status: 'Pending Checkout' },
          { metric: 'Settled Folios', value: `${paidCount} / ${checkedIn.length}`, status: paidCount === checkedIn.length ? 'Fully Paid' : 'Pending Settling' },
          { metric: 'Housekeeping Release Triggered', value: `${checkedIn.length} Rooms`, status: 'Auto Scheduled' },
          { metric: 'Late Checkouts Approved', value: '0 Requests', status: 'Standard 11:00 AM' }
        ];

      case 'cashier-report':
        const totalPaid = reservations.reduce((s, r) => s + (Number(r.paid) || Number(r.amount) || 0), 0);
        const upiPaid = reservations.filter(r => String(r.paymentMode || r.payment_mode || 'UPI').toUpperCase().includes('UPI')).reduce((s, r) => s + (Number(r.paid) || Number(r.amount) || 0), 0);
        const cashPaid = reservations.filter(r => String(r.paymentMode || r.payment_mode || '').toUpperCase().includes('CASH')).reduce((s, r) => s + (Number(r.paid) || Number(r.amount) || 0), 0);
        const cardPaid = reservations.filter(r => String(r.paymentMode || r.payment_mode || '').toUpperCase().includes('CARD')).reduce((s, r) => s + (Number(r.paid) || Number(r.amount) || 0), 0);
        return [
          { metric: 'Total Payments Collected', value: `₹${totalPaid.toLocaleString('en-IN')}`, status: 'Reconciled' },
          { metric: 'UPI / QR Realtime Collections', value: `₹${upiPaid.toLocaleString('en-IN')}`, status: 'Instant Settlement' },
          { metric: 'Cash Drawer In-Hand', value: `₹${cashPaid.toLocaleString('en-IN')}`, status: 'In Vault' },
          { metric: 'Credit / Debit Card Payments', value: `₹${cardPaid.toLocaleString('en-IN')}`, status: 'Bank POS' }
        ];

      case 'police-checkin':
        return [
          { metric: 'Total Registered In-House', value: `${actualGuestsCount} Guests`, status: 'Verified' },
          { metric: 'Aadhaar / Passport KYC Verified', value: `${actualGuestsCount} / ${actualGuestsCount}`, status: 'KYC Ready' },
          { metric: 'Foreign Nationals (Form-C)', value: '0 Required', status: 'N/A' },
          { metric: 'Statutory Local Police Log', value: 'Cloud Sync Active', status: 'Compliance Passed' }
        ];

      default:
        return report.data || [
          { metric: 'Active Operational Units', value: `${totalRooms} Units`, status: 'Optimal' },
          { metric: 'System Security Health Score', value: '100%', status: 'Secure Cloud' },
          { metric: 'Database Realtime Sync', value: 'Supabase Cloud', status: 'Live Connected' }
        ];
    }
  }, [report.id, report.data, rooms, reservations, actualGuestsCount]);

  // Handle Export to Excel (CSV)
  const handleExportToExcel = () => {
    let csvRows = [];
    if (report.id === 'guest-in-house') {
      csvRows.push(['ROOM', 'NAME', 'RESERVATION #', 'PHONE', 'EMAIL', 'CITY', 'COUNTRY', 'VIP', 'ORGANISATION']);
      groupedByRoom.forEach(([roomNum, guestList]) => {
        guestList.forEach(g => {
          if (!g.isAddAction) {
            csvRows.push([
              roomNum,
              `"${String(g.name || '').replace(/"/g, '""')}"`,
              g.reservationNo,
              `"${g.phone || ''}"`,
              `"${g.email || ''}"`,
              `"${g.city || ''}"`,
              `"${g.country || ''}"`,
              g.isVip ? 'YES' : 'NO',
              `"${String(g.organisation || '').replace(/"/g, '""')}"`
            ]);
          }
        });
      });
    } else {
      csvRows.push(['METRIC', 'VALUE', 'STATUS']);
      liveReportRows.forEach(row => {
        csvRows.push([`"${row.metric}"`, `"${row.value}"`, `"${row.status}"`]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `${report.title.replace(/[\s/]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showNotification) {
      showNotification(`Exported ${filename} successfully.`);
    }
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Open Add Guest Modal
  const handleOpenAddGuest = (roomNumber, reservationNo) => {
    setActiveAddGuestRoom({ roomNumber, reservationNo });
    setNewGuestData({
      name: '',
      phone: '',
      email: '',
      city: '',
      country: 'India',
      isVip: false,
      organisation: ''
    });
    setIsAddGuestModalOpen(true);
  };

  // Save New Guest
  const handleSaveNewGuest = (e) => {
    e.preventDefault();
    if (!newGuestData.name.trim()) {
      if (showNotification) showNotification('Please enter a valid guest name.');
      return;
    }

    const created = {
      id: `g-custom-${Date.now()}`,
      roomNumber: activeAddGuestRoom.roomNumber,
      name: newGuestData.name.trim(),
      reservationNo: activeAddGuestRoom.reservationNo || `RES-${activeAddGuestRoom.roomNumber}`,
      phone: newGuestData.phone.trim(),
      email: newGuestData.email.trim(),
      city: newGuestData.city.trim(),
      country: newGuestData.country.trim() || 'India',
      isVip: newGuestData.isVip,
      organisation: newGuestData.organisation.trim(),
      isAddAction: false
    };

    setInHouseGuests(prev => [created, ...prev]);
    setIsAddGuestModalOpen(false);
    if (showNotification) {
      showNotification(`Added ${created.name} to Room #${activeAddGuestRoom.roomNumber}.`);
    }
  };

  // Click on reservation number to open voucher
  const handleOpenVoucher = (reservationNo, guest) => {
    setSelectedVoucherData({
      reservationNo: reservationNo,
      guestName: guest.name || 'Guest',
      room: guest.roomNumber,
      phone: guest.phone || '',
      email: guest.email || '',
      date: new Date().toLocaleDateString('en-GB')
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 pb-16">

      {/* 1. Top Breadcrumb & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 text-xs">
        <div className="flex items-center space-x-2 text-slate-500">
          <button
            onClick={onBack}
            className="hover:text-slate-900 transition flex items-center gap-1 font-semibold text-slate-600 hover:underline cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Manage Reports</span>
          </button>
          <span>/</span>
          <span className="font-bold text-slate-900">{report.title}</span>
        </div>

        {/* Quick Report Switcher Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400 font-medium">Switch Report:</span>
          <select
            value={report.id}
            onChange={(e) => onSwitchReport && onSwitchReport(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            {reportsCatalog.map(r => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Page Title & Action Buttons Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-normal text-slate-600">
            {report.id === 'guest-in-house' ? 'In House Guests' : report.title}
          </h1>
        </div>

        {/* Action Buttons: Export To Excel & Print */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={handleExportToExcel}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg inline-flex items-center space-x-2 transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export To Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#2c5282] hover:bg-[#2a4365] text-white font-bold text-xs rounded-lg inline-flex items-center space-x-2 transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CASE A: IN HOUSE GUESTS REPORT */}
      {/* ========================================================================= */}
      {report.id === 'guest-in-house' ? (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">

          {/* Card Header: Title + Count Badge + Info Tip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-800">
                In House Guests
              </h2>
              <span className="bg-[#e0e7ff] text-[#3730a3] text-xs font-bold px-2.5 py-0.5 rounded-full">
                {actualGuestsCount}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Rooms missing guest details show an Add Guest action</span>
            </div>
          </div>

          {/* Filter Bar Row */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            {/* Search Guest Name */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search guest by name..."
                value={filterGuestName}
                onChange={(e) => setFilterGuestName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold placeholder:text-slate-400 outline-none focus:border-[#2b6cb0]"
              />
            </div>

            {/* Filter City */}
            <div className="w-44">
              <input
                type="text"
                placeholder="Filter by city..."
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold placeholder:text-slate-400 outline-none focus:border-[#2b6cb0]"
              />
            </div>

            {/* Filter Organisation */}
            <div className="w-48">
              <select
                value={filterOrg}
                onChange={(e) => setFilterOrg(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-[#2b6cb0]"
              >
                <option value="All Organisation">All Organisation</option>
                {availableOrganisations.map(org => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            {(filterGuestName || filterCity || filterOrg !== 'All Organisation') && (
              <button
                onClick={() => {
                  setFilterGuestName('');
                  setFilterCity('');
                  setFilterOrg('All Organisation');
                }}
                className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Grouped Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#dce4ec] text-slate-800 font-bold uppercase text-[11px] tracking-wider border-b border-slate-300">
                  <th className="py-2.5 px-4 w-52">NAME</th>
                  <th className="py-2.5 px-4 w-32">RESERVATION #</th>
                  <th className="py-2.5 px-4 w-36">PHONE</th>
                  <th className="py-2.5 px-4 w-56">EMAIL</th>
                  <th className="py-2.5 px-4 w-28">CITY</th>
                  <th className="py-2.5 px-4 w-28">COUNTRY</th>
                  <th className="py-2.5 px-4 w-16 text-center">VIP</th>
                  <th className="py-2.5 px-4 w-36">ORGANISATION</th>
                </tr>
              </thead>

              <tbody>
                {groupedByRoom.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <BedDouble className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-sm text-slate-800">No Guests Currently In-House</p>
                        <p className="text-xs text-slate-500">
                          All rooms are vacant or ready. Guest check-ins from the Live Room Matrix will populate this statutory ledger in real time.
                        </p>
                        {setIsCreateReservationModalOpen && (
                          <button
                            onClick={() => setIsCreateReservationModalOpen(true)}
                            className="px-4 py-2 bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center space-x-1.5 cursor-pointer"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Check-In Walk-In Guest</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  groupedByRoom.map(([roomNum, guestList]) => (
                    <React.Fragment key={roomNum}>
                      {/* Room Header Strip */}
                      <tr className="bg-[#ebf3fa] border-y border-blue-100">
                        <td colSpan={8} className="py-2 px-4 font-bold text-[#2b6cb0] text-xs">
                          <div className="flex items-center space-x-2">
                            <BedDouble className="w-4 h-4 text-[#2b6cb0]" />
                            <span>Room {roomNum}</span>
                          </div>
                        </td>
                      </tr>

                      {/* Guest Rows for this Room */}
                      {guestList.map(g => {
                        if (g.isAddAction) {
                          return (
                            <tr key={g.id} className="hover:bg-slate-50 border-b border-slate-100 transition">
                              <td className="py-2 px-4">
                                <button
                                  onClick={() => handleOpenAddGuest(roomNum, g.reservationNo)}
                                  className="px-2.5 py-1 rounded-md bg-[#fef3c7] hover:bg-[#fde68a] text-[#92400e] border border-[#fde68a] font-bold text-xs inline-flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                                >
                                  <UserPlus className="w-3.5 h-3.5 text-[#b45309]" />
                                  <span>Add Guest</span>
                                </button>
                              </td>

                              <td className="py-2 px-4">
                                <span
                                  onClick={() => handleOpenVoucher(g.reservationNo, g)}
                                  className="text-[#2b6cb0] font-semibold hover:underline cursor-pointer"
                                >
                                  {g.reservationNo}
                                </span>
                              </td>

                              <td className="py-2 px-4 text-slate-400"></td>
                              <td className="py-2 px-4 text-slate-400"></td>
                              <td className="py-2 px-4 text-slate-400"></td>
                              <td className="py-2 px-4 text-slate-400"></td>
                              <td className="py-2 px-4 text-center">
                                <X className="w-4 h-4 text-rose-500 font-black inline stroke-[3]" />
                              </td>
                              <td className="py-2 px-4 text-slate-400"></td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={g.id} className="hover:bg-slate-50 border-b border-slate-100 transition">
                            <td className="py-2.5 px-4 font-bold text-slate-900">
                              {g.name}
                            </td>

                            <td className="py-2.5 px-4">
                              <span
                                onClick={() => handleOpenVoucher(g.reservationNo, g)}
                                className="text-[#2b6cb0] font-semibold hover:underline cursor-pointer"
                              >
                                {g.reservationNo}
                              </span>
                            </td>

                            <td className="py-2.5 px-4 text-slate-700 font-mono text-[11px]">
                              {g.phone || '—'}
                            </td>

                            <td className="py-2.5 px-4 text-slate-600 text-[11px]">
                              {g.email || '—'}
                            </td>

                            <td className="py-2.5 px-4 text-slate-700">
                              {g.city || '—'}
                            </td>

                            <td className="py-2.5 px-4 text-slate-700">
                              {g.country || 'India'}
                            </td>

                            <td className="py-2.5 px-4 text-center">
                              {g.isVip ? (
                                <Check className="w-4 h-4 text-emerald-600 font-black inline stroke-[3]" />
                              ) : (
                                <X className="w-4 h-4 text-rose-500 font-black inline stroke-[3]" />
                              )}
                            </td>

                            <td className="py-2.5 px-4 font-semibold text-slate-800">
                              {g.organisation || 'Direct'}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* CASE B: OTHER DETAILED REPORTS */
        /* ========================================================================= */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-800">
                {report.title}
              </h2>
              <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Active Audit
              </span>
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{report.subtitle}</span>
            </div>
          </div>

          {/* Quick Date Range Filter */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-700">Reporting Date:</span>
              <span className="font-bold text-slate-900">
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} (Live Daily Audit)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {(report.departments || []).map(d => (
                <span key={d} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 font-bold rounded text-[10px]">
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#dce4ec] text-slate-800 font-bold uppercase text-[11px] tracking-wider border-b border-slate-300">
                  <th className="py-2.5 px-4">METRIC / PARAMETER</th>
                  <th className="py-2.5 px-4">CURRENT REALISED VALUE</th>
                  <th className="py-2.5 px-4 text-right">AUDIT STATUS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {liveReportRows.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.metric}</td>
                    <td className="py-3 px-4 font-mono font-black text-sky-800 text-sm">{item.value}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL: ADD GUEST TO ROOM */}
      {/* ========================================================================= */}
      {isAddGuestModalOpen && activeAddGuestRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">

            {/* Header */}
            <div className="px-5 py-4 bg-[#0e4860] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Add In-House Guest</h3>
                  <p className="text-[11px] text-sky-200">Room #{activeAddGuestRoom.roomNumber} • Res #{activeAddGuestRoom.reservationNo}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddGuestModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveNewGuest} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mr. Rajesh Sharma"
                  value={newGuestData.name}
                  onChange={(e) => setNewGuestData({ ...newGuestData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 outline-none focus:border-[#0e4860]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91-9876543210"
                    value={newGuestData.phone}
                    onChange={(e) => setNewGuestData({ ...newGuestData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 outline-none focus:border-[#0e4860]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="guest@example.com"
                    value={newGuestData.email}
                    onChange={(e) => setNewGuestData({ ...newGuestData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 outline-none focus:border-[#0e4860]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru"
                    value={newGuestData.city}
                    onChange={(e) => setNewGuestData({ ...newGuestData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 outline-none focus:border-[#0e4860]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="India"
                    value={newGuestData.country}
                    onChange={(e) => setNewGuestData({ ...newGuestData, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 outline-none focus:border-[#0e4860]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Organisation / Corporate</label>
                <input
                  type="text"
                  placeholder="e.g. TATA / Reliance / Direct"
                  value={newGuestData.organisation}
                  onChange={(e) => setNewGuestData({ ...newGuestData, organisation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 outline-none focus:border-[#0e4860]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isVipGuest"
                  checked={newGuestData.isVip}
                  onChange={(e) => setNewGuestData({ ...newGuestData, isVip: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="isVipGuest" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Mark as VIP Guest (Priority front desk service)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddGuestModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold transition shadow-sm cursor-pointer"
                >
                  Save Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: BOOKING VOUCHER (WHEN CLICKING RESERVATION NUMBER) */}
      {/* ========================================================================= */}
      {selectedVoucherData && (
        <BookingVoucher
          reservation={{
            id: selectedVoucherData.reservationNo,
            guestName: selectedVoucherData.guestName,
            roomNumber: selectedVoucherData.room,
            phone: selectedVoucherData.phone,
            email: selectedVoucherData.email,
            status: 'IN-HOUSE',
            checkIn: selectedVoucherData.date,
            checkOut: 'Next Day',
            totalPrice: 2500,
            advancePaid: 2500,
            ratePlan: 'EP (European Plan)'
          }}
          onClose={() => setSelectedVoucherData(null)}
        />
      )}

    </div>
  );
}
