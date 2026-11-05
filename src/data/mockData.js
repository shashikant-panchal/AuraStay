// Clean production data for AuraStay Hospitality & VARO Revenue Management
export const initialMockData = {
  "property": {
    "id": 2259,
    "name": "AuraStay Suite",
    "shortName": "AST",
    "email": "admin@aurastay.com",
    "mobile": "7978578046",
    "managerName": "AuraStay Admin",
    "managerRole": "Property Admin",
    "address": "DLF Cyber City, Patia, Bhubaneswar, Odisha, India - 751024",
    "totalRooms": 0,
    "activeRoomCategories": 0,
    "pricingReadyCategories": 0,
    "currency": "INR",
    "currencySymbol": "₹",
    "masteryPercentage": 0,
    "notificationCount": 0
  },
  "kpis": {
    "period": "Current Cycle",
    "revpar": 0,
    "adr": 0,
    "occupancy": 0,
    "totalRevenue": 0,
    "totalRevenueFormatted": "₹0.00",
    "roomRevenue": 0,
    "nonRoomRevenue": 0,
    "roomNightsSold": 0,
    "totalAvailableNights": 0,
    "goppar": 0,
    "averageBookingValue": 0,
    "totalBookings": 0
  },
  "todayActions": {
    "title": "Today’s Revenue Actions",
    "subtitle": "Real-time pricing exceptions and rate review alerts.",
    "items": []
  },
  "revenueTrend30Days": [],
  "adrOccupancy14Days": [],
  "pickup14Days": [],
  "pace28Days": [],
  "paceSummary": {
    "roomsOnBooks28d": 0,
    "priorYear28d": 0,
    "velocity": 0,
    "prevWeekVelocity": 0,
    "comparisonStatus": "No bookings recorded yet"
  },
  "leadTimeDistribution": {
    "propertyId": 2259,
    "arrivalStartDate": "",
    "arrivalEndDate": "",
    "totalRooms": 0,
    "buckets": []
  },
  "segmentation": {
    "period": "Current Cycle",
    "topCorporateAccounts": [],
    "segmentPerformance": [],
    "channelContribution": []
  },
  "budgetForecast": {
    "period": "November 2026",
    "mtdRevenue": 0,
    "revenueTarget": 0,
    "revenueAchievement": 0,
    "mtdOccupancy": 0,
    "occupancyTarget": 0,
    "occupancyAchievement": 0,
    "mtdAdr": 0,
    "adrTarget": 0,
    "adrAchievement": 0,
    "varianceLast3Months": [],
    "monthlyComparison": []
  },
  "demandForecast": {
    "period": "Next 14 Days",
    "modelInfo": "AuraStay Revenue Engine v4.2",
    "accuracy": "0%",
    "demandSignals": [],
    "occupancyForecast": [],
    "weeklyRevenueForecast": [],
    "manualOverrides": []
  },
  "displacement": {
    "inventoryRooms": 0,
    "historicalNoShowRate": 0,
    "noShowBookings": 0,
    "eligibleArrivals": 0,
    "noShowWindow": "Last 90 Days",
    "overbookingPolicy": "Parity Protection",
    "savedEvaluations": [],
    "missingOperationalEvidence": []
  },
  "configuration": {
    "readinessScore": 0,
    "readinessRatio": "0/0",
    "subtitle": "Suite inventory configuration",
    "categories": []
  },
  "glossary": [
    {
      "term": "RevPAR",
      "meaning": "Revenue Per Available Room = Total Room Revenue / Total Available Rooms"
    },
    {
      "term": "ADR",
      "meaning": "Average Daily Rate = Total Room Revenue / Rooms Sold"
    },
    {
      "term": "Occupancy %",
      "meaning": "Rooms Sold / Total Available Rooms * 100"
    },
    {
      "term": "BAR",
      "meaning": "Best Available Rate = Lowest unrestricted rate offered to guests"
    },
    {
      "term": "GOPPAR",
      "meaning": "Gross Operating Profit Per Available Room"
    },
    {
      "term": "Pace",
      "meaning": "Rate of booking pickup relative to previous periods or targets"
    }
  ]
};
