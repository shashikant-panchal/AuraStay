export const mockRooms = [
  { roomNumber: "101", floor: "1st", type: "Standard Room", bed: "King", status: "VACANT_READY", price: 2000, guest: null },
  { roomNumber: "102", floor: "1st", type: "Standard Room", bed: "King", status: "OCCUPIED", price: 2000, guest: "Shashank Verma", bookingId: "AST-B-857", checkOut: "2026-11-05" },
  { roomNumber: "103", floor: "1st", type: "Standard Room", bed: "King", status: "DIRTY", price: 2000, guest: null },
  { roomNumber: "104", floor: "1st", type: "Standard Room", bed: "King", status: "VACANT_READY", price: 2000, guest: null },
  { roomNumber: "105", floor: "1st", type: "Standard Room", bed: "King", status: "MAINTENANCE", price: 2000, guest: null },
  { roomNumber: "201", floor: "2nd", type: "Deluxe King", bed: "King", status: "OCCUPIED", price: 3200, guest: "Dr. Alok Mishra (DCC Medical)", bookingId: "AST-B-858", checkOut: "2026-11-06" },
  { roomNumber: "202", floor: "2nd", type: "Deluxe King", bed: "King", status: "VACANT_READY", price: 3200, guest: null },
  { roomNumber: "203", floor: "2nd", type: "Deluxe King", bed: "King", status: "OCCUPIED", price: 3200, guest: "Priya Sundaram", bookingId: "AST-B-859", checkOut: "2026-11-04" },
  { roomNumber: "301", floor: "3rd", type: "Executive Suite", bed: "King + Sofa", status: "VACANT_READY", price: 4500, guest: null },
  { roomNumber: "302", floor: "3rd", type: "Executive Suite", bed: "King + Sofa", status: "OCCUPIED", price: 4500, guest: "Rajesh Sen (CKS Education)", bookingId: "AST-B-860", checkOut: "2026-11-07" },
  { roomNumber: "401", floor: "4th", type: "Presidential Suite", bed: "Super King", status: "VACANT_READY", price: 7500, guest: null },
  { roomNumber: "402", floor: "4th", type: "Presidential Suite", bed: "Super King", status: "VACANT_READY", price: 7500, guest: null },
];

export const mockReservations = [
  { id: "AST-B-857", guest: "Shashank Verma", room: "102 (Standard)", checkIn: "2026-11-03", checkOut: "2026-11-05", source: "Walk-in", amount: 4000, status: "CONFIRMED", payment: "PAID" },
  { id: "AST-B-858", guest: "Dr. Alok Mishra", room: "201 (Deluxe)", checkIn: "2026-11-02", checkOut: "2026-11-06", source: "Corporate (DCC Medical)", amount: 12800, status: "CHECKED_IN", payment: "DIRECT_BILL" },
  { id: "AST-B-859", guest: "Priya Sundaram", room: "203 (Deluxe)", checkIn: "2026-11-01", checkOut: "2026-11-04", source: "Booking.com OTA", amount: 9600, status: "CHECKED_IN", payment: "OTA_VCC" },
  { id: "AST-B-860", guest: "Rajesh Sen", room: "302 (Suite)", checkIn: "2026-11-03", checkOut: "2026-11-07", source: "Corporate (CKS Education)", amount: 18000, status: "CHECKED_IN", payment: "PAID" },
  { id: "AST-B-861", guest: "Amitabh Choudhury", room: "101 (Standard)", checkIn: "2026-11-04", checkOut: "2026-11-06", source: "Direct Website", amount: 4000, status: "CONFIRMED", payment: "PENDING" },
  { id: "AST-B-862", guest: "Meera Patel", room: "202 (Deluxe)", checkIn: "2026-11-05", checkOut: "2026-11-08", source: "Agoda", amount: 9600, status: "CONFIRMED", payment: "PAID" },
];

export const mockFnbOrders = [
  { orderId: "AST-O-363", roomTable: "Room 102", guest: "Shashank Verma", items: "Paneer Butter Masala (1), Butter Naan (3), Sweet Lassi (2)", total: 780, status: "DELIVERED", time: "8:15 PM" },
  { orderId: "AST-O-364", roomTable: "Table 4 (Restaurant)", guest: "Walk-in Diner", items: "Chicken Biryani (2), Raita (2), Masala Coke (2)", total: 950, status: "PREPARING", time: "8:42 PM" },
  { orderId: "AST-O-365", roomTable: "Room 302", guest: "Rajesh Sen", items: "Club Sandwich (1), Espresso (2)", total: 460, status: "PENDING", time: "9:05 PM" },
];

export const mockStaffUsers = [
  { id: 3550, name: "Twinkle Bagh", role: "Property Admin", email: "admin@aurastay.com", phone: "+91 76089 28399", department: "Management", status: "ACTIVE" },
  { id: 3551, name: "Samir Nayak", role: "Front Desk Manager", email: "samir.frontdesk@aurastay.com", phone: "+91 94370 12345", department: "Front Office", status: "ACTIVE" },
  { id: 3552, name: "Anita Mohanty", role: "Housekeeping Executive", email: "anita.hk@aurastay.com", phone: "+91 98610 98765", department: "Housekeeping", status: "ACTIVE" },
  { id: 3553, name: "Chef Debabrata", role: "Executive Chef", email: "fnb.kitchen@aurastay.com", phone: "+91 70081 23456", department: "Food & Beverages", status: "ACTIVE" },
  { id: 3554, name: "Bikram Keshari", role: "Accounts Lead", email: "accounts@aurastay.com", phone: "+91 82490 56789", department: "Finance", status: "ACTIVE" },
];

export const mockOtaChannels = [
  { name: "Booking.com", status: "CONNECTED", syncStatus: "2 mins ago", mappedRooms: 4, activeBookings: 18, commission: "15%" },
  { name: "Agoda", status: "CONNECTED", syncStatus: "Just now", mappedRooms: 4, activeBookings: 12, commission: "14%" },
  { name: "MakeMyTrip / Goibibo", status: "CONNECTED", syncStatus: "5 mins ago", mappedRooms: 4, activeBookings: 24, commission: "18%" },
  { name: "Expedia", status: "CONNECTED", syncStatus: "12 mins ago", mappedRooms: 4, activeBookings: 7, commission: "16%" },
  { name: "Direct Booking Engine", status: "ACTIVE", syncStatus: "Real-time", mappedRooms: 4, activeBookings: 32, commission: "0%" },
];

