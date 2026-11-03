// Mock data for AuraStay Hospitality & VARO Revenue Management
export const initialMockData = {
  "property": {
    "id": 2259,
    "name": "AuraStay Suite",
    "shortName": "AST",
    "email": "admin@aurastay.com",
    "mobile": "7978578046",
    "managerName": "Twinkle Bagh",
    "managerRole": "Property Admin",
    "address": "DLF Cyber City, Patia, Bhubaneswar, Odisha, India - 751024",
    "totalRooms": 28,
    "activeRoomCategories": 7,
    "pricingReadyCategories": 1,
    "currency": "INR",
    "currencySymbol": "₹",
    "masteryPercentage": 0,
    "notificationCount": 2
  },
  "kpis": {
    "period": "5 Oct 2026 – 3 Nov 2026 (inclusive)",
    "revpar": 859.56,
    "adr": 3556.81,
    "occupancy": 24.17,
    "totalRevenue": 896122.68,
    "totalRevenueFormatted": "₹8.96L",
    "roomRevenue": 722033.18,
    "nonRoomRevenue": 174089.5,
    "roomNightsSold": 203,
    "totalAvailableNights": 840,
    "goppar": 1066.81,
    "averageBookingValue": 6438.29,
    "totalBookings": 140
  },
  "todayActions": {
    "title": "Today’s Revenue Actions",
    "subtitle": "Persisted exceptions and decisions only. Setup gaps remain in VARO Configuration.",
    "items": [
      {
        "id": "act-1",
        "count": 1,
        "title": "Rate recommendations need review",
        "description": "1 recommendation(s) in the next 30 days contain persisted pricing exceptions.",
        "severity": "ATTENTION",
        "status": "PENDING_REVIEW",
        "evidence": {
          "targetDate": "2026-11-12",
          "roomType": "Standard Room",
          "currentRate": 2000,
          "recommendedRate": 2450,
          "reason": "High demand surge detected for wedding season weekend + competitor price uptick (+22%).",
          "exceptionFlag": "Persisted Floor Guardrail (₹2,000 min, ₹4,500 max)"
        }
      }
    ]
  },
  "revenueTrend30Days": [
    {
      "date": "2026-10-05",
      "totalRevenue": 6800,
      "roomRevenue": 6800,
      "nonRoomRevenue": 0
    },
    {
      "date": "2026-10-06",
      "totalRevenue": 0,
      "roomRevenue": 0,
      "nonRoomRevenue": 0
    },
    {
      "date": "2026-10-07",
      "totalRevenue": 19613,
      "roomRevenue": 18048,
      "nonRoomRevenue": 1565
    },
    {
      "date": "2026-10-08",
      "totalRevenue": 49733.58,
      "roomRevenue": 49177.58,
      "nonRoomRevenue": 556
    },
    {
      "date": "2026-10-09",
      "totalRevenue": 39785.58,
      "roomRevenue": 39329.58,
      "nonRoomRevenue": 456
    },
    {
      "date": "2026-10-10",
      "totalRevenue": 25182.58,
      "roomRevenue": 25028.58,
      "nonRoomRevenue": 154
    },
    {
      "date": "2026-10-11",
      "totalRevenue": 11600,
      "roomRevenue": 11600,
      "nonRoomRevenue": 0
    },
    {
      "date": "2026-10-12",
      "totalRevenue": 18843.1,
      "roomRevenue": 18738.1,
      "nonRoomRevenue": 105
    },
    {
      "date": "2026-10-13",
      "totalRevenue": 39887.82,
      "roomRevenue": 39323.82,
      "nonRoomRevenue": 564
    },
    {
      "date": "2026-10-14",
      "totalRevenue": 43019.38,
      "roomRevenue": 41865.88,
      "nonRoomRevenue": 1153.5
    },
    {
      "date": "2026-10-15",
      "totalRevenue": 66184.44,
      "roomRevenue": 64997.44,
      "nonRoomRevenue": 1187
    },
    {
      "date": "2026-10-16",
      "totalRevenue": 41016.46,
      "roomRevenue": 40756.96,
      "nonRoomRevenue": 259.5
    },
    {
      "date": "2026-10-17",
      "totalRevenue": 31262.49,
      "roomRevenue": 31002.99,
      "nonRoomRevenue": 259.5
    },
    {
      "date": "2026-10-18",
      "totalRevenue": 16342.86,
      "roomRevenue": 16142.86,
      "nonRoomRevenue": 200
    },
    {
      "date": "2026-10-19",
      "totalRevenue": 14142.86,
      "roomRevenue": 14142.86,
      "nonRoomRevenue": 0
    },
    {
      "date": "2026-10-20",
      "totalRevenue": 23642.86,
      "roomRevenue": 23642.86,
      "nonRoomRevenue": 0
    },
    {
      "date": "2026-10-21",
      "totalRevenue": 2571.43,
      "roomRevenue": 2571.43,
      "nonRoomRevenue": 0
    },
    {
      "date": "2026-10-22",
      "totalRevenue": 0,
      "roomRevenue": 0,
      "nonRoomRevenue": 0
    },
    {
      "date": "2026-10-23",
      "totalRevenue": 3809.52,
      "roomRevenue": 3809.52,
      "nonRoomRevenue": 0
    },
    {
      "date": "2026-10-24",
      "totalRevenue": 0,
      "roomRevenue": 0,
      "nonRoomRevenue": 0
    },
    {
      "date": "2026-10-25",
      "totalRevenue": 2000,
      "roomRevenue": 2000,
      "nonRoomRevenue": 0
    },
    {
      "date": "2026-10-26",
      "totalRevenue": 3300,
      "roomRevenue": 3300,
      "nonRoomRevenue": 0
    },
    {
      "date": "2026-10-27",
      "totalRevenue": 5300,
      "roomRevenue": 5300,
      "nonRoomRevenue": 0
    },
    {
      "date": "2026-10-28",
      "totalRevenue": 12097.61,
      "roomRevenue": 11047.61,
      "nonRoomRevenue": 1050
    },
    {
      "date": "2026-10-29",
      "totalRevenue": 294000,
      "roomRevenue": 136500,
      "nonRoomRevenue": 157500
    },
    {
      "date": "2026-10-30",
      "totalRevenue": 23170.09,
      "roomRevenue": 21238.09,
      "nonRoomRevenue": 1932
    },
    {
      "date": "2026-10-31",
      "totalRevenue": 31046.52,
      "roomRevenue": 27309.52,
      "nonRoomRevenue": 3737
    },
    {
      "date": "2026-11-01",
      "totalRevenue": 14713,
      "roomRevenue": 13650,
      "nonRoomRevenue": 1063
    },
    {
      "date": "2026-11-02",
      "totalRevenue": 37229.18,
      "roomRevenue": 35826.18,
      "nonRoomRevenue": 1403
    },
    {
      "date": "2026-11-03",
      "totalRevenue": 19828.34,
      "roomRevenue": 18883.34,
      "nonRoomRevenue": 945
    }
  ],
  "adrOccupancy14Days": [
    {
      "date": "2026-10-21",
      "averageDailyRate": 2571.43,
      "occupancyRate": 3.57,
      "revPar": 91.84
    },
    {
      "date": "2026-10-22",
      "averageDailyRate": 0,
      "occupancyRate": 0,
      "revPar": 0
    },
    {
      "date": "2026-10-23",
      "averageDailyRate": 1904.76,
      "occupancyRate": 7.14,
      "revPar": 136.05
    },
    {
      "date": "2026-10-24",
      "averageDailyRate": 0,
      "occupancyRate": 0,
      "revPar": 0
    },
    {
      "date": "2026-10-25",
      "averageDailyRate": 2000,
      "occupancyRate": 3.57,
      "revPar": 71.43
    },
    {
      "date": "2026-10-26",
      "averageDailyRate": 3300,
      "occupancyRate": 3.57,
      "revPar": 117.86
    },
    {
      "date": "2026-10-27",
      "averageDailyRate": 2650,
      "occupancyRate": 7.14,
      "revPar": 189.29
    },
    {
      "date": "2026-10-28",
      "averageDailyRate": 2209.52,
      "occupancyRate": 17.86,
      "revPar": 394.56
    },
    {
      "date": "2026-10-29",
      "averageDailyRate": 4875,
      "occupancyRate": 100,
      "revPar": 4875
    },
    {
      "date": "2026-10-30",
      "averageDailyRate": 2359.79,
      "occupancyRate": 32.14,
      "revPar": 758.5
    },
    {
      "date": "2026-10-31",
      "averageDailyRate": 2275.79,
      "occupancyRate": 42.86,
      "revPar": 975.34
    },
    {
      "date": "2026-11-01",
      "averageDailyRate": 2730,
      "occupancyRate": 17.86,
      "revPar": 487.5
    },
    {
      "date": "2026-11-02",
      "averageDailyRate": 2559.01,
      "occupancyRate": 50,
      "revPar": 1279.51
    },
    {
      "date": "2026-11-03",
      "averageDailyRate": 2697.62,
      "occupancyRate": 25,
      "revPar": 674.4
    }
  ],
  "pickup14Days": [
    {
      "date": "2026-11-03",
      "roomsOnBooksYesterday": 3,
      "roomsOnBooksToday": 7,
      "netPickup": 4,
      "cumulativePickup": 4
    },
    {
      "date": "2026-11-04",
      "roomsOnBooksYesterday": 1,
      "roomsOnBooksToday": 1,
      "netPickup": 0,
      "cumulativePickup": 4
    },
    {
      "date": "2026-11-05",
      "roomsOnBooksYesterday": 0,
      "roomsOnBooksToday": 0,
      "netPickup": 0,
      "cumulativePickup": 4
    },
    {
      "date": "2026-11-06",
      "roomsOnBooksYesterday": 0,
      "roomsOnBooksToday": 0,
      "netPickup": 0,
      "cumulativePickup": 4
    },
    {
      "date": "2026-11-07",
      "roomsOnBooksYesterday": 0,
      "roomsOnBooksToday": 0,
      "netPickup": 0,
      "cumulativePickup": 4
    },
    {
      "date": "2026-11-08",
      "roomsOnBooksYesterday": 0,
      "roomsOnBooksToday": 0,
      "netPickup": 0,
      "cumulativePickup": 4
    },
    {
      "date": "2026-11-09",
      "roomsOnBooksYesterday": 0,
      "roomsOnBooksToday": 0,
      "netPickup": 0,
      "cumulativePickup": 4
    },
    {
      "date": "2026-11-10",
      "roomsOnBooksYesterday": 0,
      "roomsOnBooksToday": 0,
      "netPickup": 0,
      "cumulativePickup": 4
    },
    {
      "date": "2026-11-11",
      "roomsOnBooksYesterday": 3,
      "roomsOnBooksToday": 3,
      "netPickup": 0,
      "cumulativePickup": 4
    },
    {
      "date": "2026-11-12",
      "roomsOnBooksYesterday": 3,
      "roomsOnBooksToday": 3,
      "netPickup": 0,
      "cumulativePickup": 4
    },
    {
      "date": "2026-11-13",
      "roomsOnBooksYesterday": 0,
      "roomsOnBooksToday": 0,
      "netPickup": 0,
      "cumulativePickup": 4
    },
    {
      "date": "2026-11-14",
      "roomsOnBooksYesterday": 0,
      "roomsOnBooksToday": 0,
      "netPickup": 0,
      "cumulativePickup": 4
    },
    {
      "date": "2026-11-15",
      "roomsOnBooksYesterday": 0,
      "roomsOnBooksToday": 0,
      "netPickup": 0,
      "cumulativePickup": 4
    },
    {
      "date": "2026-11-16",
      "roomsOnBooksYesterday": 0,
      "roomsOnBooksToday": 0,
      "netPickup": 0,
      "cumulativePickup": 4
    }
  ],
  "pace28Days": [
    {
      "daysBeforeArrival": 28,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 27,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 26,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 25,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 24,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 23,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 22,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 21,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 20,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 19,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 18,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 17,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 16,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 15,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 14,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 13,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 12,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 11,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 10,
      "currentYearRooms": 2,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 9,
      "currentYearRooms": 3,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 8,
      "currentYearRooms": 3,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 7,
      "currentYearRooms": 3,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 6,
      "currentYearRooms": 3,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 5,
      "currentYearRooms": 3,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 4,
      "currentYearRooms": 3,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 3,
      "currentYearRooms": 3,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 2,
      "currentYearRooms": 3,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 1,
      "currentYearRooms": 4,
      "priorYearRooms": 0
    },
    {
      "daysBeforeArrival": 0,
      "currentYearRooms": 8,
      "priorYearRooms": 0
    }
  ],
  "paceSummary": {
    "roomsOnBooks28d": 8,
    "priorYear28d": 0,
    "velocity": 0.9,
    "prevWeekVelocity": 0,
    "comparisonStatus": "Comparison unavailable vs LY"
  },
  "leadTimeDistribution": {
    "propertyId": 2259,
    "arrivalStartDate": "2025-11-04",
    "arrivalEndDate": "2026-11-03",
    "totalRooms": 1107,
    "buckets": [
      {
        "code": "D0_3",
        "label": "0–3 days",
        "rooms": 1007,
        "percentage": 91
      },
      {
        "code": "D4_7",
        "label": "4–7 days",
        "rooms": 39,
        "percentage": 3.5
      },
      {
        "code": "D8_14",
        "label": "8–14 days",
        "rooms": 52,
        "percentage": 4.7
      },
      {
        "code": "D15_30",
        "label": "15–30 days",
        "rooms": 9,
        "percentage": 0.8
      },
      {
        "code": "D31_PLUS",
        "label": "31+ days",
        "rooms": 0,
        "percentage": 0
      }
    ]
  },
  "segmentation": {
    "period": "05/10/2026 – 03/11/2026",
    "topCorporateAccounts": [
      {
        "rank": 1,
        "account": "CKS EDUCATION LTD",
        "roomNights": 3,
        "revenue": 8820
      },
      {
        "rank": 2,
        "account": "SHYAM ENGINEERING WORKS",
        "roomNights": 4,
        "revenue": 6401
      },
      {
        "rank": 3,
        "account": "DCC MEDICAL LTD",
        "roomNights": 2,
        "revenue": 5880
      },
      {
        "rank": 4,
        "account": "KCC MEDICAL LTD",
        "roomNights": 1,
        "revenue": 2940
      },
      {
        "rank": 5,
        "account": "ACC CEMENT LTD",
        "roomNights": 1,
        "revenue": 2625
      }
    ],
    "segmentPerformance": [
      {
        "segment": "Booking Engine",
        "roomNights": 1,
        "adr": 17110,
        "revenue": 17110,
        "mixPercentage": 2.2,
        "yoyChange": "—"
      },
      {
        "segment": "Walk-in",
        "roomNights": 202,
        "adr": 3748,
        "revenue": 756999,
        "mixPercentage": 97.8,
        "yoyChange": "—"
      }
    ],
    "channelContribution": [
      {
        "month": "Nov 25",
        "direct": 45000,
        "ota": 12000,
        "walkIn": 210000,
        "corporate": 32000
      },
      {
        "month": "Dec 25",
        "direct": 52000,
        "ota": 18000,
        "walkIn": 340000,
        "corporate": 45000
      },
      {
        "month": "Jan 26",
        "direct": 48000,
        "ota": 15000,
        "walkIn": 280000,
        "corporate": 38000
      },
      {
        "month": "Feb 26",
        "direct": 42000,
        "ota": 14000,
        "walkIn": 260000,
        "corporate": 35000
      },
      {
        "month": "Mar 26",
        "direct": 50000,
        "ota": 20000,
        "walkIn": 310000,
        "corporate": 42000
      },
      {
        "month": "Apr 26",
        "direct": 38000,
        "ota": 11000,
        "walkIn": 240000,
        "corporate": 29000
      },
      {
        "month": "May 26",
        "direct": 44000,
        "ota": 13000,
        "walkIn": 270000,
        "corporate": 31000
      },
      {
        "month": "Jun 26",
        "direct": 41000,
        "ota": 16000,
        "walkIn": 250000,
        "corporate": 33000
      },
      {
        "month": "Jul 26",
        "direct": 36000,
        "ota": 10000,
        "walkIn": 220000,
        "corporate": 27000
      },
      {
        "month": "Aug 26",
        "direct": 47000,
        "ota": 19000,
        "walkIn": 320000,
        "corporate": 40000
      },
      {
        "month": "Sep 26",
        "direct": 53000,
        "ota": 22000,
        "walkIn": 390000,
        "corporate": 48000
      },
      {
        "month": "Oct 26",
        "direct": 68000,
        "ota": 28000,
        "walkIn": 700000,
        "corporate": 62000
      },
      {
        "month": "Nov 26 (MTD)",
        "direct": 17110,
        "ota": 0,
        "walkIn": 51250,
        "corporate": 0
      }
    ]
  },
  "budgetForecast": {
    "period": "Actual stay-date period: 2026-01-01 – 2026-11-03",
    "mtdRevenue": 68360,
    "revenueTarget": 750000,
    "revenueAchievement": 9.11,
    "mtdOccupancy": 31,
    "occupancyTarget": 80,
    "occupancyAchievement": 38.7,
    "mtdAdr": 3418,
    "adrTarget": 3000,
    "adrAchievement": 113.93,
    "varianceLast3Months": [
      {
        "month": "Aug",
        "budget": 550000,
        "budgetFormatted": "₹5.5L",
        "actual": 320000,
        "actualFormatted": "₹3.2L",
        "variance": -42
      },
      {
        "month": "Sep",
        "budget": 550000,
        "budgetFormatted": "₹5.5L",
        "actual": 390000,
        "actualFormatted": "₹3.9L",
        "variance": -29
      },
      {
        "month": "Oct",
        "budget": 900000,
        "budgetFormatted": "₹9.0L",
        "actual": 700000,
        "actualFormatted": "₹7.0L",
        "variance": -22
      }
    ],
    "monthlyComparison": [
      {
        "month": "Jan",
        "budget": 500000,
        "actual": 480000,
        "isCurrent": false
      },
      {
        "month": "Feb",
        "budget": 480000,
        "actual": 440000,
        "isCurrent": false
      },
      {
        "month": "Mar",
        "budget": 520000,
        "actual": 510000,
        "isCurrent": false
      },
      {
        "month": "Apr",
        "budget": 450000,
        "actual": 430000,
        "isCurrent": false
      },
      {
        "month": "May",
        "budget": 500000,
        "actual": 490000,
        "isCurrent": false
      },
      {
        "month": "Jun",
        "budget": 480000,
        "actual": 460000,
        "isCurrent": false
      },
      {
        "month": "Jul",
        "budget": 460000,
        "actual": 420000,
        "isCurrent": false
      },
      {
        "month": "Aug",
        "budget": 550000,
        "actual": 320000,
        "isCurrent": false
      },
      {
        "month": "Sep",
        "budget": 550000,
        "actual": 390000,
        "isCurrent": false
      },
      {
        "month": "Oct",
        "budget": 900000,
        "actual": 700000,
        "isCurrent": false
      },
      {
        "month": "Nov",
        "budget": 750000,
        "actual": 68360,
        "isCurrent": true,
        "note": "Nov actual is month-to-date; budget is full-month"
      },
      {
        "month": "Dec",
        "budget": 1000000,
        "actual": 0,
        "isCurrent": false
      }
    ]
  },
  "demandForecast": {
    "period": "Forecast dates: 2026-11-03 – 2027-01-31 (90 inclusive dates)",
    "modelInfo": {
      "type": "Evidence-backed estimator",
      "method": "SEASONAL_PACE_EVENT_ESTIMATOR_V1",
      "historicalDays": 402,
      "historicalRange": "2024-11-03 to 2026-11-02",
      "description": "This deterministic estimator combines current on-books rooms with property-specific historical booking pace, seasonal weekday analogues and persisted local-event impact. It is recalculated from current evidence on each request; it is not a fitted machine-learning model. The shaded range is the empirical 20th–80th percentile of comparable days, not an arbitrary confidence margin."
    },
    "accuracy": {
      "snapshotsEvaluated": 6,
      "manualOverridesEvaluated": 0,
      "mae": 18.37,
      "insideBandPercent": 16.7,
      "leadTimeBuckets": [
        {
          "bucket": "D0",
          "evaluated": 3,
          "mae": 16.67,
          "insideRange": "0.0% (3)"
        },
        {
          "bucket": "D1-7",
          "evaluated": 3,
          "mae": 20.06,
          "insideRange": "33.3% (3)"
        }
      ]
    },
    "demandSignals": [
      {
        "id": "sig-1",
        "icon": "trending_down",
        "type": "Low Occupancy Period",
        "severity": "LOW",
        "description": "Occupancy drops to 1% on Dec 13. Consider promotions."
      },
      {
        "id": "sig-2",
        "icon": "event",
        "type": "High Demand Surge",
        "severity": "MEDIUM",
        "description": "A surge of higher demand starting around Nov 3 (avg 8% expected)"
      }
    ],
    "occupancyForecast": [
      {
        "date": "2026-11-03",
        "forecast": 25,
        "upperBand": 25,
        "lowerBand": 25,
        "onBooks": 25,
        "seasonalBaseline": 4.76,
        "expectedPickup": 0,
        "eventImpact": 0,
        "bookingCurveCompletion": 100,
        "sampleSize": 17,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 25.0% + expected remaining pickup 0.0% from 17 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-04",
        "forecast": 7.23,
        "upperBand": 14.04,
        "lowerBand": 3.57,
        "onBooks": 3.57,
        "seasonalBaseline": 6.47,
        "expectedPickup": 3.66,
        "eventImpact": 0,
        "bookingCurveCompletion": 43.48,
        "sampleSize": 17,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 3.57% + expected remaining pickup 3.66% from 17 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-05",
        "forecast": 5.96,
        "upperBand": 11.58,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 14.1,
        "expectedPickup": 5.96,
        "eventImpact": 0,
        "bookingCurveCompletion": 57.75,
        "sampleSize": 17,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 5.96% from 17 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-06",
        "forecast": 3.64,
        "upperBand": 8.72,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 5.7,
        "expectedPickup": 3.64,
        "eventImpact": 0,
        "bookingCurveCompletion": 36.11,
        "sampleSize": 17,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 3.64% from 17 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-07",
        "forecast": 4.71,
        "upperBand": 13.99,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 6.23,
        "expectedPickup": 4.71,
        "eventImpact": 0,
        "bookingCurveCompletion": 24.44,
        "sampleSize": 18,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 4.71% from 18 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-08",
        "forecast": 2.19,
        "upperBand": 4.26,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 2.96,
        "expectedPickup": 2.19,
        "eventImpact": 0,
        "bookingCurveCompletion": 26.09,
        "sampleSize": 18,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 2.19% from 18 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-09",
        "forecast": 4.63,
        "upperBand": 6.84,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 5.86,
        "expectedPickup": 4.63,
        "eventImpact": 0,
        "bookingCurveCompletion": 21.05,
        "sampleSize": 18,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 4.63% from 18 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-10",
        "forecast": 2.98,
        "upperBand": 8.22,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 3.44,
        "expectedPickup": 2.98,
        "eventImpact": 0,
        "bookingCurveCompletion": 13.33,
        "sampleSize": 17,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 2.98% from 17 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-11",
        "forecast": 16.31,
        "upperBand": 29.23,
        "lowerBand": 10.71,
        "onBooks": 10.71,
        "seasonalBaseline": 5.6,
        "expectedPickup": 5.6,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 17,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 10.71% + expected remaining pickup 5.6% from 17 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-12",
        "forecast": 17.2,
        "upperBand": 20.66,
        "lowerBand": 10.71,
        "onBooks": 10.71,
        "seasonalBaseline": 11.44,
        "expectedPickup": 6.49,
        "eventImpact": 0,
        "bookingCurveCompletion": 43.28,
        "sampleSize": 17,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 10.71% + expected remaining pickup 6.49% from 17 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-13",
        "forecast": 5.09,
        "upperBand": 13.75,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 5.24,
        "expectedPickup": 5.09,
        "eventImpact": 0,
        "bookingCurveCompletion": 2.86,
        "sampleSize": 17,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 5.09% from 17 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-14",
        "forecast": 5.17,
        "upperBand": 17.78,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 5.17,
        "expectedPickup": 5.17,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 17,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 5.17% from 17 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-15",
        "forecast": 2.23,
        "upperBand": 3.7,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 2.23,
        "expectedPickup": 2.23,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 17,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 2.23% from 17 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-16",
        "forecast": 4.47,
        "upperBand": 4.47,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 4.75,
        "expectedPickup": 4.47,
        "eventImpact": 0,
        "bookingCurveCompletion": 6.06,
        "sampleSize": 17,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 4.47% from 17 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-17",
        "forecast": 2.64,
        "upperBand": 7.41,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 2.64,
        "expectedPickup": 2.64,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 16,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 2.64% from 16 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-18",
        "forecast": 5.67,
        "upperBand": 18.52,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 5.67,
        "expectedPickup": 5.67,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 16,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 5.67% from 16 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-19",
        "forecast": 10.26,
        "upperBand": 18.52,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 10.26,
        "expectedPickup": 10.26,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 16,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 10.26% from 16 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-20",
        "forecast": 4.49,
        "upperBand": 13.64,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 4.49,
        "expectedPickup": 4.49,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 16,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 4.49% from 16 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-21",
        "forecast": 4.64,
        "upperBand": 18.52,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 4.64,
        "expectedPickup": 4.64,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 16,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 4.64% from 16 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-22",
        "forecast": 1.91,
        "upperBand": 3.7,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 1.91,
        "expectedPickup": 1.91,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 16,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 1.91% from 16 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-23",
        "forecast": 5.43,
        "upperBand": 5.43,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 5.43,
        "expectedPickup": 5.43,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 16,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 5.43% from 16 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-24",
        "forecast": 3.16,
        "upperBand": 10.22,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 3.16,
        "expectedPickup": 3.16,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 15,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 3.16% from 15 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-25",
        "forecast": 6.18,
        "upperBand": 18.25,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 6.18,
        "expectedPickup": 6.18,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 15,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 6.18% from 15 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-26",
        "forecast": 9.22,
        "upperBand": 16.36,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 9.22,
        "expectedPickup": 9.22,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 15,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 9.22% from 15 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-27",
        "forecast": 4.2,
        "upperBand": 10,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 4.2,
        "expectedPickup": 4.2,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 15,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 4.2% from 15 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-28",
        "forecast": 4.48,
        "upperBand": 7.64,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 4.48,
        "expectedPickup": 4.48,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 15,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 4.48% from 15 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-29",
        "forecast": 1.26,
        "upperBand": 1.26,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 1.26,
        "expectedPickup": 1.26,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 15,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 1.26% from 15 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-11-30",
        "forecast": 5.31,
        "upperBand": 6.96,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 5.31,
        "expectedPickup": 5.31,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 15,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 5.31% from 15 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-01",
        "forecast": 3.95,
        "upperBand": 11.45,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 3.95,
        "expectedPickup": 3.95,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 14,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 3.95% from 14 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-02",
        "forecast": 6.88,
        "upperBand": 18.32,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 6.88,
        "expectedPickup": 6.88,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 14,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 6.88% from 14 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-03",
        "forecast": 8.78,
        "upperBand": 19.09,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 8.78,
        "expectedPickup": 8.78,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 14,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 8.78% from 14 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-04",
        "forecast": 4.05,
        "upperBand": 9.09,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 4.05,
        "expectedPickup": 4.05,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 14,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 4.05% from 14 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-05",
        "forecast": 5.5,
        "upperBand": 10.73,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 5.5,
        "expectedPickup": 5.5,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 14,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 5.5% from 14 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-06",
        "forecast": 0.69,
        "upperBand": 1.48,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 0.69,
        "expectedPickup": 0.69,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 14,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 0.69% from 14 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-07",
        "forecast": 5.68,
        "upperBand": 10.27,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 5.68,
        "expectedPickup": 5.68,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 14,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 5.68% from 14 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-08",
        "forecast": 5.08,
        "upperBand": 12.18,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 5.08,
        "expectedPickup": 5.08,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 13,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 5.08% from 13 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-09",
        "forecast": 8.85,
        "upperBand": 18.38,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 8.85,
        "expectedPickup": 8.85,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 13,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 8.85% from 13 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-10",
        "forecast": 12.05,
        "upperBand": 30,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 12.05,
        "expectedPickup": 12.05,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 13,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 12.05% from 13 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-11",
        "forecast": 4.92,
        "upperBand": 11.82,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 4.92,
        "expectedPickup": 4.92,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 13,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 4.92% from 13 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-12",
        "forecast": 6.55,
        "upperBand": 21.64,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 6.55,
        "expectedPickup": 6.55,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 13,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 6.55% from 13 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-13",
        "forecast": 0.56,
        "upperBand": 0.56,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 0.56,
        "expectedPickup": 0.56,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 13,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 0.56% from 13 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-14",
        "forecast": 6.15,
        "upperBand": 12.91,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 6.15,
        "expectedPickup": 6.15,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 13,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 6.15% from 13 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-15",
        "forecast": 6.48,
        "upperBand": 12.91,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 6.48,
        "expectedPickup": 6.48,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 6.48% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-16",
        "forecast": 11.04,
        "upperBand": 17.27,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 11.04,
        "expectedPickup": 11.04,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 11.04% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-17",
        "forecast": 10.73,
        "upperBand": 24.55,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 10.73,
        "expectedPickup": 10.73,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 10.73% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-18",
        "forecast": 6.29,
        "upperBand": 12.73,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 6.29,
        "expectedPickup": 6.29,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 6.29% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-19",
        "forecast": 5.88,
        "upperBand": 16.91,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 5.88,
        "expectedPickup": 5.88,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 5.88% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-20",
        "forecast": 0.99,
        "upperBand": 0.99,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 0.99,
        "expectedPickup": 0.99,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 0.99% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-21",
        "forecast": 6.05,
        "upperBand": 8.27,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 6.05,
        "expectedPickup": 6.05,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 6.05% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-22",
        "forecast": 7.2,
        "upperBand": 12.91,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 7.2,
        "expectedPickup": 7.2,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 7.2% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-23",
        "forecast": 12.73,
        "upperBand": 21.82,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 12.73,
        "expectedPickup": 12.73,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 12.73% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-24",
        "forecast": 13.68,
        "upperBand": 25.45,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 13.68,
        "expectedPickup": 13.68,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 13.68% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-25",
        "forecast": 6.66,
        "upperBand": 12.73,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 6.66,
        "expectedPickup": 6.66,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 6.66% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-26",
        "forecast": 6.61,
        "upperBand": 16.91,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 6.61,
        "expectedPickup": 6.61,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 6.61% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-27",
        "forecast": 1.63,
        "upperBand": 3.64,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 1.63,
        "expectedPickup": 1.63,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 1.63% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-28",
        "forecast": 9.15,
        "upperBand": 16.36,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 9.15,
        "expectedPickup": 9.15,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 9.15% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-29",
        "forecast": 9.7,
        "upperBand": 17.27,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 9.7,
        "expectedPickup": 9.7,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 9.7% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-30",
        "forecast": 12.94,
        "upperBand": 21.82,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 12.94,
        "expectedPickup": 12.94,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 12.94% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2026-12-31",
        "forecast": 14.04,
        "upperBand": 25.45,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 14.04,
        "expectedPickup": 14.04,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 14.04% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-01",
        "forecast": 6.65,
        "upperBand": 12.73,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 6.65,
        "expectedPickup": 6.65,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 6.65% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-02",
        "forecast": 8.25,
        "upperBand": 16.91,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 8.25,
        "expectedPickup": 8.25,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 8.25% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-03",
        "forecast": 2.27,
        "upperBand": 4.55,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 2.27,
        "expectedPickup": 2.27,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 2.27% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-04",
        "forecast": 8.71,
        "upperBand": 16.36,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 8.71,
        "expectedPickup": 8.71,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 8.71% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-05",
        "forecast": 11.89,
        "upperBand": 17.27,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 11.89,
        "expectedPickup": 11.89,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 11.89% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-06",
        "forecast": 13.3,
        "upperBand": 21.82,
        "lowerBand": 0.91,
        "onBooks": 0,
        "seasonalBaseline": 13.3,
        "expectedPickup": 13.3,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 13.3% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-07",
        "forecast": 17.68,
        "upperBand": 27.27,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 17.68,
        "expectedPickup": 17.68,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 17.68% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-08",
        "forecast": 8.57,
        "upperBand": 13.64,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 8.57,
        "expectedPickup": 8.57,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 8.57% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-09",
        "forecast": 11.5,
        "upperBand": 22.18,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 11.5,
        "expectedPickup": 11.5,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 11.5% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-10",
        "forecast": 3.33,
        "upperBand": 8.18,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 3.33,
        "expectedPickup": 3.33,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 3.33% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-11",
        "forecast": 8.61,
        "upperBand": 16.36,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 8.61,
        "expectedPickup": 8.61,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 8.61% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-12",
        "forecast": 12.91,
        "upperBand": 17.27,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 12.91,
        "expectedPickup": 12.91,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 12.91% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-13",
        "forecast": 12.14,
        "upperBand": 21.82,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 12.14,
        "expectedPickup": 12.14,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 12.14% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-14",
        "forecast": 19.19,
        "upperBand": 27.27,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 19.19,
        "expectedPickup": 19.19,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 19.19% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-15",
        "forecast": 9.02,
        "upperBand": 13.64,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 9.02,
        "expectedPickup": 9.02,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 9.02% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-16",
        "forecast": 12.41,
        "upperBand": 22.18,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 12.41,
        "expectedPickup": 12.41,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 12.41% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-17",
        "forecast": 3.79,
        "upperBand": 8.18,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 3.79,
        "expectedPickup": 3.79,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 3.79% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-18",
        "forecast": 7.89,
        "upperBand": 16.36,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 7.89,
        "expectedPickup": 7.89,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 7.89% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-19",
        "forecast": 11.41,
        "upperBand": 17.27,
        "lowerBand": 0.91,
        "onBooks": 0,
        "seasonalBaseline": 11.41,
        "expectedPickup": 11.41,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 11.41% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-20",
        "forecast": 10.81,
        "upperBand": 21.82,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 10.81,
        "expectedPickup": 10.81,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 10.81% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-21",
        "forecast": 17.12,
        "upperBand": 27.27,
        "lowerBand": 0.91,
        "onBooks": 0,
        "seasonalBaseline": 17.12,
        "expectedPickup": 17.12,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 17.12% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-22",
        "forecast": 9.6,
        "upperBand": 13.64,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 9.6,
        "expectedPickup": 9.6,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 9.6% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-23",
        "forecast": 10.07,
        "upperBand": 19.09,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 10.07,
        "expectedPickup": 10.07,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 10.07% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-24",
        "forecast": 5.03,
        "upperBand": 8.18,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 5.03,
        "expectedPickup": 5.03,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 5.03% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-25",
        "forecast": 8.06,
        "upperBand": 16.36,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 8.06,
        "expectedPickup": 8.06,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 8.06% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-26",
        "forecast": 10.29,
        "upperBand": 17.27,
        "lowerBand": 0.91,
        "onBooks": 0,
        "seasonalBaseline": 10.29,
        "expectedPickup": 10.29,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 10.29% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-27",
        "forecast": 10.81,
        "upperBand": 21.82,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 10.81,
        "expectedPickup": 10.81,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 10.81% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-28",
        "forecast": 16.12,
        "upperBand": 27.27,
        "lowerBand": 4.55,
        "onBooks": 0,
        "seasonalBaseline": 16.12,
        "expectedPickup": 16.12,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 16.12% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-29",
        "forecast": 9.54,
        "upperBand": 13.64,
        "lowerBand": 0.91,
        "onBooks": 0,
        "seasonalBaseline": 9.54,
        "expectedPickup": 9.54,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 9.54% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-30",
        "forecast": 9.16,
        "upperBand": 19.09,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 9.16,
        "expectedPickup": 9.16,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 9.16% from 12 seasonal weekday samples.",
        "overrideApplied": false
      },
      {
        "date": "2027-01-31",
        "forecast": 5.16,
        "upperBand": 8.18,
        "lowerBand": 0,
        "onBooks": 0,
        "seasonalBaseline": 5.16,
        "expectedPickup": 5.16,
        "eventImpact": 0,
        "bookingCurveCompletion": 0,
        "sampleSize": 12,
        "modelStatus": "EVIDENCE_BACKED",
        "explanation": "On books 0.0% + expected remaining pickup 5.16% from 12 seasonal weekday samples.",
        "overrideApplied": false
      }
    ],
    "weeklyRevenueForecast": [
      {
        "week": "W1",
        "revenue": 24121.44,
        "startDate": "2026-11-03",
        "endDate": "2026-11-09"
      },
      {
        "week": "W2",
        "revenue": 16000.02,
        "startDate": "2026-11-10",
        "endDate": "2026-11-16"
      },
      {
        "week": "W3",
        "revenue": 0,
        "startDate": "2026-11-17",
        "endDate": "2026-11-23"
      },
      {
        "week": "W4",
        "revenue": 0,
        "startDate": "2026-11-24",
        "endDate": "2026-11-30"
      },
      {
        "week": "W5",
        "revenue": 0,
        "startDate": "2026-12-01",
        "endDate": "2026-12-07"
      },
      {
        "week": "W6",
        "revenue": 0,
        "startDate": "2026-12-08",
        "endDate": "2026-12-14"
      },
      {
        "week": "W7",
        "revenue": 0,
        "startDate": "2026-12-15",
        "endDate": "2026-12-21"
      },
      {
        "week": "W8",
        "revenue": 0,
        "startDate": "2026-12-22",
        "endDate": "2026-12-28"
      },
      {
        "week": "W9",
        "revenue": 0,
        "startDate": "2026-12-29",
        "endDate": "2027-01-04"
      },
      {
        "week": "W10",
        "revenue": 0,
        "startDate": "2027-01-05",
        "endDate": "2027-01-11"
      },
      {
        "week": "W11",
        "revenue": 0,
        "startDate": "2027-01-12",
        "endDate": "2027-01-18"
      },
      {
        "week": "W12",
        "revenue": 0,
        "startDate": "2027-01-19",
        "endDate": "2027-01-25"
      }
    ],
    "manualOverrides": []
  },
  "displacement": {
    "inventoryRooms": 28,
    "historicalNoShowRate": 0.1,
    "noShowBookings": 1,
    "eligibleArrivals": 996,
    "noShowWindow": "4 Nov 2025 – 3 Nov 2026",
    "overbookingPolicy": {
      "enabled": false,
      "maxExtraRooms": 0,
      "maxWalkCost": 0
    },
    "savedEvaluations": [],
    "missingOperationalEvidence": [
      {
        "title": "Denied booking demand",
        "status": "Unavailable",
        "detail": "No denial capture exists."
      },
      {
        "title": "Actual group pickup / wash",
        "status": "Unavailable",
        "detail": "Group blocks are not reconciled to picked-up reservations."
      }
    ]
  },
  "configuration": {
    "readinessScore": 45,
    "readinessRatio": "5 of 11 requirements",
    "subtitle": "This measures saved setup, not collector freshness, forecast accuracy or Channel Manager delivery.",
    "categories": [
      {
        "name": "Room Setup",
        "items": [
          {
            "title": "Pricing-ready room categories",
            "status": "Action needed",
            "detail": "1 of 7 active room categories are pricing-ready.",
            "unlocks": "Dynamic Pricing recommendations for every active room category"
          }
        ]
      },
      {
        "name": "Pricing Rules",
        "items": [
          {
            "title": "Rate guardrail",
            "status": "Configured",
            "detail": "A property guardrail is saved.",
            "unlocks": "Safe recommendation and publication limits"
          },
          {
            "title": "Active occupancy bands",
            "status": "Configured",
            "detail": "3 active occupancy bands are configured.",
            "unlocks": "The Occupancy pricing factor"
          },
          {
            "title": "Active seasonal rate plan",
            "status": "Configured",
            "detail": "1 active seasonal rate plan is configured.",
            "unlocks": "The Season pricing factor"
          },
          {
            "title": "Active weekend/holiday rule",
            "status": "Configured",
            "detail": "1 active weekend/holiday rule is configured.",
            "unlocks": "The Weekend/Holiday pricing factor"
          },
          {
            "title": "Active Historic YoY rule",
            "status": "Action needed",
            "detail": "0 active Historic YoY rules are configured.",
            "unlocks": "Historic ADR and occupancy adjustments"
          }
        ]
      },
      {
        "name": "Budget",
        "items": [
          {
            "title": "Current-year accommodation budget",
            "status": "Configured",
            "detail": "12 months configured for 2026.",
            "unlocks": "Budget targets, MTD progress and variance"
          }
        ]
      },
      {
        "name": "External Integrations",
        "items": [
          {
            "title": "Enabled data source",
            "status": "Action needed",
            "detail": "0 enabled data sources are configured.",
            "unlocks": "Configured external feed metadata"
          },
          {
            "title": "Active event intelligence",
            "status": "Action needed",
            "detail": "0 active events are configured.",
            "unlocks": "The Event pricing factor for matching dates"
          },
          {
            "title": "Property coordinates",
            "status": "Action needed",
            "detail": "Link the exact property in CompSet Setup.",
            "unlocks": "PredictHQ and informational Weather collection"
          }
        ]
      },
      {
        "name": "CompSet",
        "items": [
          {
            "title": "CompSet strategy and competitors",
            "status": "Action needed",
            "detail": "Save a CompSet strategy and enable at least 3 competitors.",
            "unlocks": "CompSet rate shopping and pricing factor eligibility"
          }
        ]
      }
    ]
  },
  "glossary": [
    {
      "category": "Core Revenue KPIs",
      "count": 7,
      "terms": [
        {
          "term": "RevPAR (Revenue Per Available Room)",
          "formula": "Total Room Revenue / Total Available Rooms",
          "definition": "RevPAR measures a property’s ability to fill its available rooms at an average rate. It reflects both occupancy and pricing power in a single metric.",
          "example": "₹7,22,033.18 room revenue / 840 available room nights = ₹859.56 RevPAR."
        },
        {
          "term": "ADR (Average Daily Rate)",
          "formula": "Total Room Revenue / Total Rooms Sold",
          "definition": "The average rental revenue realized per occupied room during a given timeframe.",
          "example": "₹7,22,033.18 room revenue / 203 room nights sold = ₹3,556.81 ADR."
        },
        {
          "term": "Occupancy Rate (%)",
          "formula": "(Rooms Sold / Total Available Rooms) × 100",
          "definition": "The percentage of available rooms that were sold over the specified period.",
          "example": "(203 sold / 840 available) × 100 = 24.17% occupancy."
        },
        {
          "term": "Total Revenue",
          "formula": "Room Revenue + Non-Room Revenue (F&B, Banquets, Services, Taxes)",
          "definition": "Gross financial turnover generated across all property operations during the window.",
          "example": "₹7,22,033.18 room + ₹1,74,089.50 other = ₹8,96,122.68."
        },
        {
          "term": "Room Nights Sold",
          "formula": "Sum of occupied room nights across stay dates",
          "definition": "Total volume of individual room night occupancies generated.",
          "example": "203.00 room nights sold across 30 days."
        },
        {
          "term": "GOPPAR (Gross Operating Profit Per Available Room)",
          "formula": "(Gross Revenue - Operating Expenses) / Total Available Rooms",
          "definition": "Measures overall operational profitability per available room, taking into account operating costs.",
          "example": "(₹9,48,198.59 - ₹52,075.97) / 840 = ₹1,066.81."
        },
        {
          "term": "Average Booking Value",
          "formula": "Total Net Revenue / Total Confirmed Bookings",
          "definition": "Average revenue generated per reservation transaction.",
          "example": "₹8,96,122.68 / 140 bookings = ₹6,438.29 per booking."
        }
      ]
    },
    {
      "category": "Demand & Booking Patterns",
      "count": 5,
      "terms": [
        {
          "term": "Active ROB (Rooms on Books)",
          "formula": "Confirmed active reservations scheduled for a specific future stay date",
          "definition": "The current baseline of committed rooms before new pickups or cancellations occur.",
          "example": "Today on-books: 7 rooms for Nov 3."
        },
        {
          "term": "Net Pickup",
          "formula": "Active ROB Now - Active ROB Yesterday (or previous evaluation)",
          "definition": "The net volume of bookings added or cancelled over a measured period for a future date.",
          "example": "Active ROB moved from 3 to 7 = Net pickup of +4 rooms."
        },
        {
          "term": "Booking Velocity",
          "formula": "Total New Room Nights Booked in Window / Days in Window",
          "definition": "Rate at which reservations are materializing per day for upcoming arrival windows.",
          "example": "0.9 rooms/day over the next 28-day window."
        },
        {
          "term": "Lead Time Distribution",
          "formula": "Days between booking creation timestamp and arrival date",
          "definition": "Distribution curve showing how far in advance guests book their stays at your property.",
          "example": "91.0% of bookings occur within 0–3 days (last minute dominance)."
        },
        {
          "term": "Booking Pace vs Last Year",
          "formula": "Current Year ROB at D-X vs Prior Year ROB at same D-X",
          "definition": "Comparison of commitment timing between equivalent historical and future operating periods.",
          "example": "Current 8 rooms vs Prior Year 0 rooms."
        }
      ]
    },
    {
      "category": "Competitive & Market",
      "count": 5,
      "terms": [
        {
          "term": "MPI (Market Penetration Index)",
          "formula": "(Property Occupancy / CompSet Occupancy) × 100",
          "definition": "Indicates whether the hotel is capturing more or less than its fair share of market occupancy (fair share = 100).",
          "example": "Score > 100 implies above-fair-market room utilization."
        },
        {
          "term": "ARI (Average Rate Index)",
          "formula": "(Property ADR / CompSet ADR) × 100",
          "definition": "Indicates whether the hotel’s average daily rate is higher or lower than its competitive set.",
          "example": "Score of 115 means your rates are 15% above the competitor average."
        },
        {
          "term": "RGI (Revenue Generation Index)",
          "formula": "(Property RevPAR / CompSet RevPAR) × 100",
          "definition": "Overall revenue performance index combining market volume and rate competitiveness.",
          "example": "RGI = (MPI × ARI) / 100."
        },
        {
          "term": "CompSet Rate Shopper",
          "formula": "Live scraping of primary OTA & direct competitor rate listings",
          "definition": "Automated rate intelligence benchmarked across designated local competitor properties.",
          "example": "Tracks Standard King rates across 3 local hotel competitors."
        },
        {
          "term": "Rate Guardrail",
          "formula": "Property configured [Floor Price, Ceiling Price] bounds",
          "definition": "Hard limits preventing dynamic pricing recommendations from dropping too low or spiking too high.",
          "example": "Configured guardrail: ₹1,800 min to ₹6,500 max."
        }
      ]
    },
    {
      "category": "Group & Displacement",
      "count": 3,
      "terms": [
        {
          "term": "Group Displacement Analysis",
          "formula": "Proposed Group Net Value - Displaced Transient Revenue",
          "definition": "Evaluates whether accepting a discounted bulk group booking produces more profit than selling those rooms to individual transient guests.",
          "example": "Group total value ₹1,20,000 vs Transient revenue potential ₹95,000 = +₹25,000 net gain."
        },
        {
          "term": "Wash Rate (%)",
          "formula": "((Contracted Group Rooms - Actual Picked Up Rooms) / Contracted Group Rooms) × 100",
          "definition": "The expected percentage of block-reserved group rooms that will go unused and released back to inventory.",
          "example": "A 10% wash assumption on 30 contracted rooms leaves 27 net expected occupied rooms."
        },
        {
          "term": "Overbooking Allowance",
          "formula": "Max additional rooms authorized above physical capacity based on no-show probability",
          "definition": "Controlled authorization allowing bookings beyond physical inventory to offset cancellations and no-shows.",
          "example": "Disabled by default. When enabled with 2 extra rooms, property can book up to 30 rooms."
        }
      ]
    },
    {
      "category": "Budget & Forecast",
      "count": 3,
      "terms": [
        {
          "term": "MTD Target Achievement (%)",
          "formula": "(Month-To-Date Actual / Configured Monthly Target) × 100",
          "definition": "Tracks progress toward meeting the property's operational and financial budget for the active calendar month.",
          "example": "₹68,360 actual / ₹7,50,000 target = 9.11% achieved."
        },
        {
          "term": "Forecast Mean Absolute Error (MAE)",
          "formula": "Average of |Forecast Occupancy - Actual Occupancy| points",
          "definition": "Standard statistical measure of accuracy comparing historical forecasts to actual finalized stay dates.",
          "example": "18.37 points across completed stay date snapshots."
        },
        {
          "term": "Forecast Empirical Band (20th–80th Percentile)",
          "formula": "Interquartile range derived from comparable historical analogue days",
          "definition": "The expected occupancy variance corridor based on past historical trends for similar weekday/seasonal days.",
          "example": "Indicates upper and lower confidence boundaries for expected demand."
        }
      ]
    },
    {
      "category": "VARO-Specific Terms",
      "count": 12,
      "terms": [
        {
          "term": "SEASONAL_PACE_EVENT_ESTIMATOR_V1",
          "formula": "On-Books + Empirical Pace Completion + Seasonal Weekday Weight + Event Surge Delta",
          "definition": "VARO’s deterministic demand forecasting algorithm designed specifically for independent and boutique hotels.",
          "example": "Calibrated across 402 historical inventory days."
        },
        {
          "term": "Mastery Score",
          "formula": "(Completed VARO Training Modules / Total Modules) × 100",
          "definition": "Gamified progress indicator tracking the revenue manager's completion of VARO revenue optimization steps.",
          "example": "Currently at 0% for this property."
        },
        {
          "term": "Action Band",
          "formula": "Real-time exception queue prioritized by commercial urgency [HIGH, ATTENTION, INFO]",
          "definition": "Curated daily feed of rate recommendations, pricing outliers, and configuration actions needing approval.",
          "example": "1 attention item: Rate recommendations need review."
        },
        {
          "term": "Pricing Factors",
          "formula": "Composite multiplier: Base × Occupancy Band × Season × Weekend/Holiday × Event × CompSet",
          "definition": "Configurable rule weights that scale room rates based on multi-dimensional demand drivers.",
          "example": "Occupancy band factor + Weekend surge factor."
        },
        {
          "term": "Forecast Monitoring Trial",
          "formula": "Association monitoring tracking forecast error before vs after weight adjustments",
          "definition": "Records RM-declared factor adjustments to observe whether forecast accuracy improved at lead day targets.",
          "example": "Allows auditing factor effectiveness over consecutive evaluation windows."
        },
        {
          "term": "Empirical Analogue Days",
          "formula": "Matching past calendar dates with similar day-of-week, seasonality, and local holiday status",
          "definition": "Historical reference points used to estimate remaining unbooked pickup curve completion.",
          "example": "Comparing a Friday in November to preceding 3 years of November Fridays."
        },
        {
          "term": "Immutable Forecast Snapshot",
          "formula": "Nightly timestamped freeze of projected occupancy and ADR at D-0, D-1, D-7, D-14, D-30",
          "definition": "Unmodifiable audit snapshot enabling accurate retrospective accuracy evaluation.",
          "example": "Frozen at midnight each day for historical accuracy verification."
        },
        {
          "term": "Walk Cost",
          "formula": "Relocation expense incurred when a confirmed guest is walked to an alternative hotel due to overbooking",
          "definition": "The operational penalty budgeted in overbooking optimization policies.",
          "example": "Covers taxi fare, room difference, and goodwill compensation."
        },
        {
          "term": "Transient ADR",
          "formula": "Average daily rate for unconstrained individual bookings (excluding group contracts)",
          "definition": "The opportunity cost benchmark used in Group Displacement analysis.",
          "example": "₹3,748 Walk-in ADR."
        },
        {
          "term": "Denied Booking Capture",
          "formula": "Log of reservation inquiries turned away due to rate restrictions, minimum stays, or sold-out status",
          "definition": "Unconstrained demand metric currently flagged as unavailable until AuraStay PMS feed integration.",
          "example": "Operational feed currently missing from PMS."
        },
        {
          "term": "Persisted Pricing Exceptions",
          "formula": "Overrides or floor/ceiling limit triggers applied to automated algorithmic rate calculations",
          "definition": "Special pricing conditions that flag a recommendation for mandatory human RM sign-off.",
          "example": "Requires human review before publishing to Channel Manager."
        },
        {
          "term": "Channel Manager Sync Status",
          "formula": "Two-way ARI (Availability, Rates, Inventory) sync verification with OTAs (Agoda, Booking.com, MMT, Expedia)",
          "definition": "Ensures updated rate recommendations are successfully distributed to all connected sales channels.",
          "example": "Synchronized with Channex and Cleartrip feeds."
        }
      ]
    }
  ]
};
