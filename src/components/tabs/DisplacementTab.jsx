import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Split, 
  Calculator, 
  ShieldAlert, 
  HelpCircle, 
  Building2, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Info,
  Check,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function DisplacementTab() {
  const { 
    data, 
    setIsEvaluateGroupModalOpen, 
    saveOverbookingPolicy 
  } = useDashboard();

  const { displacement } = data;
  const { 
    inventoryRooms, 
    historicalNoShowRate, 
    noShowBookings, 
    eligibleArrivals, 
    noShowWindow, 
    overbookingPolicy, 
    savedEvaluations, 
    missingOperationalEvidence 
  } = displacement;

  const [policyEnabled, setPolicyEnabled] = useState(overbookingPolicy.enabled);
  const [maxRooms, setMaxRooms] = useState(overbookingPolicy.maxExtraRooms || 2);
  const [walkCost, setWalkCost] = useState(overbookingPolicy.maxWalkCost || 5000);

  const handleSavePolicy = (e) => {
    e.preventDefault();
    saveOverbookingPolicy({
      enabled: policyEnabled,
      maxExtraRooms: Number(maxRooms),
      maxWalkCost: Number(walkCost)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Split className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Group Displacement Decisions
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Compare expected group value with displaced transient revenue, then record the commercial decision and reason.
          </p>
        </div>

        <button
          onClick={() => setIsEvaluateGroupModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition self-start md:self-auto"
        >
          <Calculator className="w-4 h-4" />
          <span>Evaluate Group Opportunity</span>
        </button>
      </div>

      {/* Decision Support Advisory Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed flex items-start space-x-3">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900">Decision support with explicit assumptions: </span>
          <span>
            Inventory and on-books rooms come from AuraStay PMS. Expected transient occupancy, transient ADR and wash are entered by the RM and stored in the snapshot. AuraStay does not currently capture denied demand or actual group pickup, so this screen does not report Denied Bookings, Revenue Lost or actual Group Wash.
          </span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Active Room Inventory
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {inventoryRooms}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            rooms from PMS Room Setup
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Saved Evaluations
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">
            {savedEvaluations.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            decision snapshots
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Historical No-show Rate
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {historicalNoShowRate.toFixed(2)}%
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {noShowBookings} of {eligibleArrivals} eligible arrivals
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Overbooking Allowance
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {overbookingPolicy.enabled ? `+${overbookingPolicy.maxExtraRooms} Rooms` : 'Disabled'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {overbookingPolicy.enabled ? `Max walk cost: ₹${overbookingPolicy.maxWalkCost}` : 'no rooms may be sold above inventory'}
          </div>
        </div>
      </div>

      {/* Saved Financial Evaluations List */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Saved Financial Evaluations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Departure dates are exclusive. Values are frozen at evaluation time.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {savedEvaluations.length} Evaluated
          </span>
        </div>

        {savedEvaluations.length === 0 ? (
          <div className="p-8 text-center my-4 border-2 border-dashed border-slate-200 rounded-xl">
            <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="text-xs font-semibold text-slate-700">
              No group opportunities have been evaluated.
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Create a scenario to compare a proposed group against transient demand assumptions.
            </p>
            <button
              onClick={() => setIsEvaluateGroupModalOpen(true)}
              className="mt-3 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition"
            >
              Evaluate New Group Opportunity
            </button>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {savedEvaluations.map((ev) => (
              <div key={ev.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{ev.groupName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      ev.decision === 'ACCEPTED' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {ev.decision}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{ev.timestamp}</span>
                  </div>
                  <div className="text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Dates: <b className="text-slate-800">{ev.checkIn} to {ev.checkOut}</b></span>
                    <span>Rooms: <b className="text-slate-800">{ev.rooms}</b></span>
                    <span>Quoted Rate: <b className="text-slate-800">₹{Number(ev.rate).toLocaleString('en-IN')}</b></span>
                    <span>Displaced Rooms: <b className="text-slate-800">{ev.displacedRooms}</b></span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-500">Net Financial Impact:</div>
                  <div className={`text-sm font-extrabold font-mono ${ev.netImpact >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {ev.netImpact >= 0 ? '+' : ''}₹{Number(ev.netImpact).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Historical no-show evidence & Missing operational evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical no-show evidence */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Historical no-show evidence
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {noShowWindow}
              </p>
            </div>

            <div className="my-5 flex items-center space-x-6">
              <div>
                <div className="text-3xl font-extrabold text-indigo-600">
                  {historicalNoShowRate.toFixed(2)}%
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Observed no-show rate
                </div>
              </div>

              <div className="border-l border-slate-200 pl-6 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">NO-SHOWS: </span>
                  <span className="font-bold text-slate-900 font-mono text-sm ml-1">{noShowBookings}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">ELIGIBLE ARRIVALS: </span>
                  <span className="font-bold text-slate-900 font-mono text-sm ml-1">{eligibleArrivals}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500">
            Read-only evidence. It does not automatically set or justify an allowance.
          </div>
        </div>

        {/* Missing operational evidence */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Missing operational evidence
                </h3>
              </div>
              <span className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-medium">
                2 data feeds unavailable
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {missingOperationalEvidence.map(item => (
                <div key={item.title} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{item.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1 text-[11px]">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 p-3 bg-amber-50/70 rounded-lg border border-amber-200/70 text-[11px] text-amber-900">
            Until these feeds exist, saved scenarios retain the RM-entered wash and transient-demand assumptions instead of presenting estimates as actuals.
          </div>
        </div>
      </div>

      {/* Overbooking policy Configuration Form */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            Overbooking policy
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Set a hard property maximum
          </p>
        </div>

        <form onSubmit={handleSavePolicy} className="mt-4 space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="policyEnabled"
              checked={policyEnabled}
              onChange={(e) => setPolicyEnabled(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="policyEnabled" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Policy enabled
            </label>
            <span className="text-xs text-slate-500">
              (When disabled, the stored allowance is zero in effect.)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                MAX EXTRA ROOMS
              </label>
              <input
                type="number"
                min="0"
                max="10"
                disabled={!policyEnabled}
                value={maxRooms}
                onChange={(e) => setMaxRooms(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                MAX WALK COST (₹)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                disabled={!policyEnabled}
                value={walkCost}
                onChange={(e) => setWalkCost(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition"
              >
                Save policy
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Saved for this property. Does not alter PMS inventory or publish availability.
          </p>
        </form>
      </div>
    </div>
  );
}

