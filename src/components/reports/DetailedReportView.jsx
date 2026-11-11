import React, { useState, useMemo } from 'react';
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

// Initial realistic In-House Guest Data matching user's PMS screenshot (media_1794409601515_d0718a9a.png)
const INITIAL_IN_HOUSE_GUESTS = [
  // Room 100
  {
    id: 'g-100-1',
    roomNumber: '100',
    name: 'Mr. Prasenjit Saha',
    reservationNo: '008697',
    phone: '+91-9874803368',
    email: '',
    city: 'Kolkata',
    country: 'India',
    isVip: false,
    organisation: 'TATA',
    isAddAction: false
  },
  {
    id: 'g-100-2',
    roomNumber: '100',
    name: '',
    reservationNo: '008697',
    phone: '',
    email: '',
    city: '',
    country: '',
    isVip: false,
    organisation: '',
    isAddAction: true
  },
  // Room 101
  {
    id: 'g-101-1',
    roomNumber: '101',
    name: 'Mr. musah',
    reservationNo: '007646',
    phone: '+91-0556965350',
    email: 'HAMIDATUMUSAH8@gmail.com',
    city: '',
    country: 'Ghana',
    isVip: true,
    organisation: '',
    isAddAction: false
  },
  {
    id: 'g-101-2',
    roomNumber: '101',
    name: 'Mr. Abcd',
    reservationNo: '007646',
    phone: '+91-321123456554',
    email: '',
    city: '',
    country: '',
    isVip: false,
    organisation: '',
    isAddAction: false
  },
  {
    id: 'g-101-3',
    roomNumber: '101',
    name: 'Mr. Gftf',
    reservationNo: '007646',
    phone: '',
    email: '',
    city: '',
    country: '',
    isVip: false,
    organisation: '',
    isAddAction: false
  },
  // Room 102
  {
    id: 'g-102-1',
    roomNumber: '102',
    name: 'Mr. Anup Sharma',
    reservationNo: '002419',
    phone: '+91 98450 12345',
    email: 'anup.sharma@gmail.com',
    city: 'Bhubaneswar',
    country: 'India',
    isVip: true,
    organisation: 'Direct Guest',
    isAddAction: false
  },
  // Room 201
  {
    id: 'g-201-1',
    roomNumber: '201',
    name: 'Mr. Rajesh Kumar',
    reservationNo: '008921',
    phone: '+91-9831002233',
    email: 'rajesh.k@tata.com',
    city: 'Mumbai',
    country: 'India',
    isVip: false,
    organisation: 'TATA',
    isAddAction: false
  },
  {
    id: 'g-201-2',
    roomNumber: '201',
    name: 'Mrs. Sunita Kumar',
    reservationNo: '008921',
    phone: '+91-9831002234',
    email: '',
    city: 'Mumbai',
    country: 'India',
    isVip: false,
    organisation: 'TATA',
    isAddAction: false
  },
  // Room 202
  {
    id: 'g-202-1',
    roomNumber: '202',
    name: 'Dr. Vikram Malhotra',
    reservationNo: '009104',
    phone: '+91-9748112233',
    email: 'vikram.m@aiims.edu',
    city: 'Delhi',
    country: 'India',
    isVip: true,
    organisation: 'Corporate',
    isAddAction: false
  },
  {
    id: 'g-202-2',
    roomNumber: '202',
    name: '',
    reservationNo: '009104',
    phone: '',
    email: '',
    city: '',
    country: '',
    isVip: false,
    organisation: '',
    isAddAction: true
  },
  // Room 203
  {
    id: 'g-203-1',
    roomNumber: '203',
    name: 'Ms. Sneha Patel',
    reservationNo: '009255',
    phone: '+91-9988776655',
    email: 'sneha.p@infosys.com',
    city: 'Bengaluru',
    country: 'India',
    isVip: false,
    organisation: 'Infosys',
    isAddAction: false
  },
  // Room 301
  {
    id: 'g-301-1',
    roomNumber: '301',
    name: 'Mr. David Wilson',
    reservationNo: '009411',
    phone: '+44-7700900123',
    email: 'dwilson@corp.co.uk',
    city: 'London',
    country: 'United Kingdom',
    isVip: true,
    organisation: 'Corporate',
    isAddAction: false
  },
  {
    id: 'g-301-2',
    roomNumber: '301',
    name: '',
    reservationNo: '009411',
    phone: '',
    email: '',
    city: '',
    country: '',
    isVip: false,
    organisation: '',
    isAddAction: true
  },
  // Room 302
  {
    id: 'g-302-1',
    roomNumber: '302',
    name: 'Mr. Amit Roy',
    reservationNo: '009580',
    phone: '+91-9820011223',
    email: 'amit.roy@reliance.com',
    city: 'Kolkata',
    country: 'India',
    isVip: false,
    organisation: 'Reliance',
    isAddAction: false
  },
  {
    id: 'g-302-2',
    roomNumber: '302',
    name: 'Mrs. Rina Roy',
    reservationNo: '009580',
    phone: '+91-9820011224',
    email: '',
    city: 'Kolkata',
    country: 'India',
    isVip: false,
    organisation: 'Reliance',
    isAddAction: false
  }
];

export default function DetailedReportView({
  report,
  onBack,
  onSwitchReport,
  reportsCatalog = []
}) {
  const { rooms = [], reservations = [], showNotification } = useDashboard();

  // Search & Filters for In-House Guests
  const [filterGuestName, setFilterGuestName] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterOrg, setFilterOrg] = useState('All Organisation');

  // Local state for in-house guests list
  const [inHouseGuests, setInHouseGuests] = useState(INITIAL_IN_HOUSE_GUESTS);

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

  // Sync live rooms/reservations into inHouseGuests if live data exists
  const combinedGuests = useMemo(() => {
    // If user has live occupied rooms in context, merge or append them
    const liveOccupied = rooms.filter(r => r.status === 'OCCUPIED' && r.guest);
    if (!liveOccupied.length) return inHouseGuests;

    const existingRoomNumbers = new Set(inHouseGuests.map(g => String(g.roomNumber)));
    const additional = [];

    liveOccupied.forEach(r => {
      const rNum = String(r.roomNumber || r.room_number);
      if (!existingRoomNumbers.has(rNum)) {
        const gName = typeof r.guest === 'string' ? r.guest : (r.guest?.name || 'In-House Guest');
        additional.push({
          id: `live-${rNum}`,
          roomNumber: rNum,
          name: gName,
          reservationNo: r.bookingId || `00${Math.floor(1000 + Math.random() * 9000)}`,
          phone: r.guest?.phone || '+91 98000 00000',
          email: r.guest?.email || '',
          city: r.guest?.city || 'Local',
          country: 'India',
          isVip: false,
          organisation: 'Direct Guest',
          isAddAction: false
        });
      }
    });

    return [...additional, ...inHouseGuests];
  }, [inHouseGuests, rooms]);

  // Distinct organisations for dropdown
  const availableOrganisations = useMemo(() => {
    const s = new Set();
    combinedGuests.forEach(g => {
      if (g.organisation && g.organisation.trim()) {
        s.add(g.organisation.trim());
      }
    });
    return Array.from(s);
  }, [combinedGuests]);

  // Filtered in-house guests
  const filteredGuests = useMemo(() => {
    return combinedGuests.filter(g => {
      // If it's an "+ Add Guest" action row, keep it with its room unless searching for a specific name
      if (g.isAddAction) {
        if (filterGuestName.trim() || filterCity.trim() || filterOrg !== 'All Organisation') {
          return false;
        }
        return true;
      }

      if (filterGuestName.trim()) {
        const q = filterGuestName.toLowerCase();
        if (!g.name.toLowerCase().includes(q)) return false;
      }

      if (filterCity.trim()) {
        const q = filterCity.toLowerCase();
        if (!g.city.toLowerCase().includes(q)) return false;
      }

      if (filterOrg !== 'All Organisation') {
        if (g.organisation !== filterOrg) return false;
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
      const numA = parseInt(a[0].replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b[0].replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    return sortedEntries;
  }, [filteredGuests]);

  // Total count of actual in-house guests (excluding "+ Add Guest" action rows)
  const actualGuestsCount = useMemo(() => {
    return combinedGuests.filter(g => !g.isAddAction && g.name.trim()).length;
  }, [combinedGuests]);

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
              `"${g.name.replace(/"/g, '""')}"`,
              g.reservationNo,
              `"${g.phone}"`,
              `"${g.email}"`,
              `"${g.city}"`,
              `"${g.country}"`,
              g.isVip ? 'YES' : 'NO',
              `"${g.organisation}"`
            ]);
          }
        });
      });
    } else {
      // Generic report export
      csvRows.push(['METRIC', 'VALUE', 'STATUS']);
      (report.data || []).forEach(row => {
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

    showNotification(`Exported ${filename} successfully.`);
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
      showNotification('Please enter a valid guest name.');
      return;
    }

    const created = {
      id: `g-custom-${Date.now()}`,
      roomNumber: activeAddGuestRoom.roomNumber,
      name: newGuestData.name.trim(),
      reservationNo: activeAddGuestRoom.reservationNo || '008697',
      phone: newGuestData.phone.trim(),
      email: newGuestData.email.trim(),
      city: newGuestData.city.trim(),
      country: newGuestData.country.trim() || 'India',
      isVip: newGuestData.isVip,
      organisation: newGuestData.organisation.trim(),
      isAddAction: false
    };

    setInHouseGuests(prev => {
      // Insert right before the "+ Add Guest" action of that room
      return [created, ...prev];
    });

    setIsAddGuestModalOpen(false);
    showNotification(`Added ${created.name} to Room #${activeAddGuestRoom.roomNumber}.`);
  };

  // Click on reservation number to open voucher
  const handleOpenVoucher = (reservationNo, guest) => {
    setSelectedVoucherData({
      reservationNo: reservationNo,
      guestName: guest.name || 'Guest',
      room: guest.roomNumber,
      phone: guest.phone || '+91-9874803368',
      email: guest.email || 'guest@aurastay.com',
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

      {/* 2. Page Title & Action Buttons Header Row (Screenshot 1: media_1794409601515_d0718a9a.png) */}
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
      {/* CASE A: IN HOUSE GUESTS REPORT (EXACT MATCH FOR USER SCREENSHOT) */}
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

          {/* Filter & Search Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <input
              type="text"
              placeholder="Guest Name"
              value={filterGuestName}
              onChange={(e) => setFilterGuestName(e.target.value)}
              className="w-48 sm:w-56 px-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
            />

            <input
              type="text"
              placeholder="City"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-36 sm:w-44 px-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
            />

            <select
              value={filterOrg}
              onChange={(e) => setFilterOrg(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-700 bg-white outline-none focus:border-blue-500 cursor-pointer min-w-[140px]"
            >
              <option value="All Organisation">All Organisation</option>
              {availableOrganisations.map(org => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>

            <button
              onClick={() => showNotification(`Showing results for in-house guests.`)}
              className="px-4 py-1.5 rounded-md bg-[#337ab7] hover:bg-[#286090] text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>

            {(filterGuestName || filterCity || filterOrg !== 'All Organisation') && (
              <button
                onClick={() => {
                  setFilterGuestName('');
                  setFilterCity('');
                  setFilterOrg('All Organisation');
                }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition"
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
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      No in-house guests found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  groupedByRoom.map(([roomNum, guestList]) => (
                    <React.Fragment key={roomNum}>
                      {/* Room Header Strip (Screenshot 1: soft blue/lavender background with bed icon) */}
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
                              {/* Add Guest Button */}
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

                              {/* Red X for VIP */}
                              <td className="py-2 px-4 text-center">
                                <X className="w-4 h-4 text-rose-500 font-black inline stroke-[3]" />
                              </td>

                              <td className="py-2 px-4 text-slate-400"></td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={g.id} className="hover:bg-slate-50 border-b border-slate-100 transition">
                            {/* Guest Name */}
                            <td className="py-2.5 px-4 font-bold text-slate-900">
                              {g.name}
                            </td>

                            {/* Reservation # */}
                            <td className="py-2.5 px-4">
                              <span
                                onClick={() => handleOpenVoucher(g.reservationNo, g)}
                                className="text-[#2b6cb0] font-semibold hover:underline cursor-pointer"
                              >
                                {g.reservationNo}
                              </span>
                            </td>

                            {/* Phone */}
                            <td className="py-2.5 px-4 text-slate-700 font-mono text-[11px]">
                              {g.phone || ''}
                            </td>

                            {/* Email */}
                            <td className="py-2.5 px-4 text-slate-600 text-[11px]">
                              {g.email || ''}
                            </td>

                            {/* City */}
                            <td className="py-2.5 px-4 text-slate-700">
                              {g.city || ''}
                            </td>

                            {/* Country */}
                            <td className="py-2.5 px-4 text-slate-700">
                              {g.country || ''}
                            </td>

                            {/* VIP Status Check / Cross */}
                            <td className="py-2.5 px-4 text-center">
                              {g.isVip ? (
                                <Check className="w-4 h-4 text-emerald-600 font-black inline stroke-[3]" />
                              ) : (
                                <X className="w-4 h-4 text-rose-500 font-black inline stroke-[3]" />
                              )}
                            </td>

                            {/* Organisation */}
                            <td className="py-2.5 px-4 font-semibold text-slate-800">
                              {g.organisation || ''}
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
        /* CASE B: OTHER DETAILED REPORTS (Occupancy, Cashier, Arrival, Departure, etc.) */
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
              {report.departments.map(d => (
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
                {report.data?.map((item, idx) => (
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
                    placeholder="e.g. Kolkata"
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
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0e4860] hover:bg-[#135d7c] text-white font-bold transition shadow-sm"
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
            totalPrice: 4500,
            advancePaid: 4500,
            ratePlan: 'EP (European Plan)'
          }}
          onClose={() => setSelectedVoucherData(null)}
        />
      )}

    </div>
  );
}
