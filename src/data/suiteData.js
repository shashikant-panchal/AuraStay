// Empty production datasets for AuraStay
// Ready for live creation & Supabase synchronization

export const mockRooms = [];
export const mockReservations = [];
export const mockFnbOrders = [];
export const mockStaffUsers = [];
export const mockOtaChannels = [
  { name: "Booking.com", status: "CONNECTED", syncStatus: "Real-time", mappedRooms: 0, activeBookings: 0, commission: "15%" },
  { name: "Agoda", status: "CONNECTED", syncStatus: "Real-time", mappedRooms: 0, activeBookings: 0, commission: "14%" },
  { name: "MakeMyTrip / Goibibo", status: "CONNECTED", syncStatus: "Real-time", mappedRooms: 0, activeBookings: 0, commission: "18%" },
  { name: "Expedia", status: "CONNECTED", syncStatus: "Real-time", mappedRooms: 0, activeBookings: 0, commission: "16%" },
  { name: "Direct Booking Engine", status: "ACTIVE", syncStatus: "Real-time", mappedRooms: 0, activeBookings: 0, commission: "0%" },
];
