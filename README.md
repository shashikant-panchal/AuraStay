# AuraStay Hospitality & VARO Revenue Management Suite (Enhanced Edition)

A high-performance, production-ready hospitality platform and revenue intelligence engine featuring a Master Service Suite and full VARO Revenue Management analytics.

---

## 🚀 Quick Start

### PowerShell Execution Policy Note
If PowerShell displays:
```powershell
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.
```

Run using **`npm.cmd`** or enable script execution:

```powershell
# Directly run with npm.cmd (no admin/execution policy required):
npm.cmd run dev

# Or enable PowerShell scripts once:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🌟 Modules Implemented

### 1. Master Service Home (`/#/master-service/home`)
- **14 Complete Service Modules**:
  1. Front Office
  2. Food & Beverages
  3. Stock Management
  4. Housekeeping
  5. Services
  6. Guest CRM
  7. Account & Finance
  8. Channel Manager
  9. Reports
  10. Staff & Admin
  11. HR & Payroll
  12. Promotions
  13. Reputation Management
  14. Revenue Management
- **Interactive "View More" Popovers**: Every card expands into its complete list of sub-modules.
- **Header & Navigation**: Property Selector (`AuraStay Suite`), Role (`Twinkle Bagh - Property Admin`), Greeting (`GOOD EVENING`), Search (`Ctrl + K`), Language, Notification Badge, and User Profile.
- **Dark Vertical Sidebar**: Matches the brand icon strip and active highlights.

### 2. VARO Revenue Management Dashboard (`/#/revenue-management/dashboard`)
- **Overview Tab**: Live KPIs, Today's Revenue Actions, 30-Day Revenue Trend, ADR vs Occupancy dual-axis chart, and RevPAR curve.
- **Pickup & Pace Tab**: Net pickup tracking, Lead Time Distribution, and Pace charts.
- **Segmentation Tab**: Channel breakdown and segment contributions.
- **Budget & Forecast Tab**: Actuals vs Budget variance analysis and 12-month budget configuration.
- **Demand Forecast Tab**: 90-day unconstrained demand curve and compression alerts.
- **Displacement Tab**: Hurdle rates, wash factors, and group displacement calculator.
- **7 Interactive Modals**: Glossary (35 terms), Configuration Readiness (11 reqs), Evidence, Set Budget, Group Displacement Evaluation, Monitoring, and Tour.

### 3. Integrated PMS Operations
- **Front Office**: Live room occupancy grid (28 rooms across 4 categories).
- **Reservation Management**: Check-in, bill/folio views, and new reservation creation.
- **Food & Beverages**: POS orders and live KOT delivery statuses.
- **Housekeeping**: Room cleanliness board (`Clean & Ready`, `Dirty`, `Occupied`, `Maintenance`).
- **Channel Manager**: Real-time 2-way sync with Booking.com, Agoda, MakeMyTrip, and Expedia.
- **Reports & Accounts**: Night audit, occupancy reports, and invoice logs.
