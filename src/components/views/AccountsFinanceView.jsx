import React, { useState, useMemo, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Wallet, 
  Plus, 
  Download, 
  CheckCircle, 
  Search, 
  Filter, 
  FileText, 
  Printer, 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Building, 
  X, 
  Check, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function AccountsFinanceView() {
  const { data, showNotification, reservations = [], currentHotel = { name: 'AuraStay Suite', id: 'hotel_aurastay_01' } } = useDashboard();

  // Active Tab: 'invoices' | 'expenses' | 'cashiering'
  const [activeTab, setActiveTab] = useState('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isGenerateInvoiceModalOpen, setIsGenerateInvoiceModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);

  // Custom Invoices & Vouchers State
  const [customInvoices, setCustomInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_custom_invoices');
      if (saved) return JSON.parse(saved);
    } catch(e){}
    return [];
  });

  // Hotel Expenses State
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_hotel_expenses');
      if (saved) return JSON.parse(saved);
    } catch(e){}
    return [
      { id: 'EXP-101', payee: 'BESCOM City Electricity', category: 'Utility Bills', amount: 28500, date: '10-11-2026', mode: 'Bank NEFT', status: 'PAID' },
      { id: 'EXP-102', payee: 'Metro Cash & Carry', category: 'F&B Provisions', amount: 14200, date: '11-11-2026', mode: 'Company Card', status: 'PAID' },
      { id: 'EXP-103', payee: 'HVAC Aircon Maintenance Co.', category: 'Repairs & Maintenance', amount: 6500, date: '11-11-2026', mode: 'UPI', status: 'PAID' }
    ];
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aurastay_custom_invoices', JSON.stringify(customInvoices));
    } catch(e){}
  }, [customInvoices]);

  useEffect(() => {
    try {
      localStorage.setItem('aurastay_hotel_expenses', JSON.stringify(expenses));
    } catch(e){}
  }, [expenses]);

  // Form State for Generate Custom Invoice
  const [invClient, setInvClient] = useState('');
  const [invPhone, setInvPhone] = useState('');
  const [invCategory, setInvCategory] = useState('Room Stay Accommodation');
  const [invSubtotal, setInvSubtotal] = useState('5000');
  const [invGstRate, setInvGstRate] = useState('12');
  const [invMode, setInvMode] = useState('UPI');
  const [invStatus, setInvStatus] = useState('PAID');

  // Form State for Expense
  const [expPayee, setExpPayee] = useState('');
  const [expCategory, setExpCategory] = useState('Utility Bills');
  const [expAmount, setExpAmount] = useState('2500');
  const [expMode, setExpMode] = useState('UPI');

  // Generate combined list of invoices from: Live Reservations + Custom Invoices
  const allInvoices = useMemo(() => {
    const reservationInvoices = (reservations || []).map((r, i) => {
      const totalAmt = Number(r.amount) || 2000;
      const isPaid = r.payment === 'PAID';
      const paidVal = r.paid !== undefined ? Number(r.paid) : (isPaid ? totalAmt : 0);
      const dueVal = Math.max(0, totalAmt - paidVal);

      // 12% GST calculation
      const sub = Math.round(totalAmt / 1.12);
      const gst = totalAmt - sub;
      const cgst = Math.round(gst / 2);
      const sgst = gst - cgst;

      return {
        id: `INV-${String(r.id || i + 1)}`,
        bookingId: r.id,
        client: r.guest || 'Walk-in Guest',
        phone: r.guest_phone || r.phone || '—',
        category: `Room Booking (${r.room || 'Standard'})`,
        date: r.checkIn || 'Today',
        subtotal: sub,
        cgst: cgst,
        sgst: sgst,
        total: totalAmt,
        paid: paidVal,
        due: dueVal,
        status: isPaid ? 'PAID' : dueVal <= 0 ? 'PAID' : 'PENDING',
        mode: r.payment_mode || 'UPI'
      };
    });

    return [...customInvoices, ...reservationInvoices];
  }, [reservations, customInvoices]);

  // Create Custom Invoice
  const handleCreateInvoice = (e) => {
    e.preventDefault();
    if (!invClient.trim()) return;

    const sub = Number(invSubtotal) || 1000;
    const rate = Number(invGstRate) || 12;
    const gstTotal = Math.round((sub * rate) / 100);
    const cgst = Math.round(gstTotal / 2);
    const sgst = gstTotal - cgst;
    const total = sub + gstTotal;

    const newInv = {
      id: `INV-MAN-${Date.now().toString().slice(-4)}`,
      client: invClient.trim(),
      phone: invPhone.trim() || '—',
      category: invCategory,
      date: new Date().toISOString().split('T')[0],
      subtotal: sub,
      cgst,
      sgst,
      total,
      paid: invStatus === 'PAID' ? total : 0,
      due: invStatus === 'PAID' ? 0 : total,
      status: invStatus,
      mode: invMode
    };

    setCustomInvoices(prev => [newInv, ...prev]);
    showNotification(`Invoice #${newInv.id} generated for ${newInv.client}!`);
    setIsGenerateInvoiceModalOpen(false);
    setInvClient('');
    setInvPhone('');
  };

  // Create Expense
  const handleCreateExpense = (e) => {
    e.preventDefault();
    if (!expPayee.trim()) return;

    const newExp = {
      id: `EXP-${Date.now().toString().slice(-4)}`,
      payee: expPayee.trim(),
      category: expCategory,
      amount: Number(expAmount) || 0,
      date: new Date().toLocaleDateString('en-GB'),
      mode: expMode,
      status: 'PAID'
    };

    setExpenses(prev => [newExp, ...prev]);
    showNotification(`Expense voucher #${newExp.id} of ₹${newExp.amount} recorded.`);
    setIsAddExpenseModalOpen(false);
    setExpPayee('');
  };

  // Mark invoice settled / paid
  const handleSettleInvoice = (invId) => {
    setCustomInvoices(prev => prev.map(inv => {
      if (inv.id === invId) {
        return { ...inv, status: 'PAID', paid: inv.total, due: 0 };
      }
      return inv;
    }));
    showNotification(`Invoice #${invId} settled in full.`);
  };

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(inv => {
      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        inv.id.toLowerCase().includes(q) ||
        inv.client.toLowerCase().includes(q) ||
        inv.category.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [allInvoices, statusFilter, searchQuery]);

  // Financial Metrics
  const totalBilled = allInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalCollected = allInvoices.reduce((sum, inv) => sum + (Number(inv.paid) || 0), 0);
  const totalReceivables = Math.max(0, totalBilled - totalCollected);
  const totalTaxCollected = allInvoices.reduce((sum, inv) => sum + (Number(inv.cgst || 0) + Number(inv.sgst || 0)), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      
      {/* 1. Header */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider bg-lime-50 text-lime-800 border border-lime-300 px-2.5 py-0.5 rounded-full shadow-2xs">
              ACCOUNTS, FINANCE & TAX INVOICING
            </span>
            <span className="text-xs text-slate-400 font-semibold">• GST Compliance (CGST + SGST)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
            Accounts, Invoices & Cashiering
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage guest billing folios, corporate receivables, tax invoices, GST ledger breakdowns, and hotel expense disbursements.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsAddExpenseModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 font-bold text-xs flex items-center space-x-1.5 transition shadow-xs"
          >
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
            <span>Record Expense</span>
          </button>

          <button
            onClick={() => setIsGenerateInvoiceModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-lime-700 hover:bg-lime-800 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-md shadow-lime-700/20"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* 2. Financial KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">TOTAL REVENUE BILLED</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">₹{totalBilled.toLocaleString()}</div>
          <span className="text-[11px] font-bold text-emerald-700 mt-1 block">Across {allInvoices.length} Invoices</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">COLLECTIONS RECEIVED</span>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">₹{totalCollected.toLocaleString()}</div>
          <span className="text-[11px] font-bold text-emerald-700 mt-1 block">Cash / UPI / Cards</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">ACCOUNTS RECEIVABLE (DUE)</span>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">₹{totalReceivables.toLocaleString()}</div>
          <span className="text-[11px] font-bold text-amber-700 mt-1 block">Pending settlement</span>
        </div>

        <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">HOTEL EXPENSES</span>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">₹{totalExpenses.toLocaleString()}</div>
          <span className="text-[11px] font-bold text-rose-700 mt-1 block">Utilities & maintenance</span>
        </div>
      </div>

      {/* 3. Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'invoices'
              ? 'bg-lime-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Tax Invoices & Ledgers ({allInvoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'expenses'
              ? 'bg-lime-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>Expense Vouchers ({expenses.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INVOICES & FOLIO LEDGERS */}
      {/* ========================================================================= */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by invoice number, guest name, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-lime-600"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white outline-none"
              >
                <option value="ALL">All Payment Status</option>
                <option value="PAID">Paid / Settled</option>
                <option value="PENDING">Due Balance</option>
              </select>

              <button
                onClick={() => setIsGenerateInvoiceModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-lime-700 hover:bg-lime-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Invoice</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10.5px] border-b border-slate-200">
                    <th className="py-3 px-4 font-bold">Invoice #</th>
                    <th className="py-3 px-4 font-bold">Client / Guest</th>
                    <th className="py-3 px-4 font-bold">Category</th>
                    <th className="py-3 px-4 font-bold">Date</th>
                    <th className="py-3 px-4 font-bold text-right">Subtotal</th>
                    <th className="py-3 px-4 font-bold text-right">GST (12%)</th>
                    <th className="py-3 px-4 font-bold text-right">Total (₹)</th>
                    <th className="py-3 px-4 font-bold text-center">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No invoices recorded. Generate a tax invoice or create room/banquet bookings to populate folios automatically.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => {
                      const isPaid = inv.status === 'PAID';
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{inv.id}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{inv.client}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{inv.phone}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">{inv.category}</td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono">{inv.date}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-600">₹{inv.subtotal.toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-500">₹{(inv.cgst + inv.sgst).toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">₹{inv.total.toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedInvoiceForPrint(inv)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                                title="Print GST Invoice"
                              >
                                <Printer className="w-3 h-3 text-slate-500" />
                                <span>Print</span>
                              </button>

                              {!isPaid && (
                                <button
                                  onClick={() => handleSettleInvoice(inv.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs"
                                >
                                  Settle ✓
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXPENSES */}
      {/* ========================================================================= */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Hotel Expense Vouchers</h3>
              <p className="text-xs text-slate-500">Track operations disbursements, vendor payments, and maintenance costs.</p>
            </div>
            <button
              onClick={() => setIsAddExpenseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10.5px] border-b border-slate-200">
                  <th className="py-3 px-4 font-bold">Voucher #</th>
                  <th className="py-3 px-4 font-bold">Payee / Vendor</th>
                  <th className="py-3 px-4 font-bold">Expense Category</th>
                  <th className="py-3 px-4 font-bold">Disbursement Date</th>
                  <th className="py-3 px-4 font-bold">Payment Mode</th>
                  <th className="py-3 px-4 font-bold text-right">Amount (₹)</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-700">{exp.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{exp.payee}</td>
                    <td className="py-3.5 px-4 text-slate-600">{exp.category}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">{exp.date}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{exp.mode}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-rose-700 text-sm">₹{exp.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {exp.status}
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
      {/* MODAL: GENERATE TAX INVOICE */}
      {/* ========================================================================= */}
      {isGenerateInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900">Generate GST Tax Invoice</h3>
              <button onClick={() => setIsGenerateInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Guest / Client Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arvind Mehta"
                  value={invClient}
                  onChange={(e) => setInvClient(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Guest Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+91 98450 12345"
                  value={invPhone}
                  onChange={(e) => setInvPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Billing Service Category</label>
                <select
                  value={invCategory}
                  onChange={(e) => setInvCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                >
                  <option value="Room Stay Accommodation">Room Stay Accommodation</option>
                  <option value="Banquet & Event Catering">Banquet & Event Catering</option>
                  <option value="Restaurant & Room Service F&B">Restaurant & Room Service F&B</option>
                  <option value="Airport Pickup & Transfer">Airport Pickup & Transfer</option>
                  <option value="Laundry & Dry Cleaning">Laundry & Dry Cleaning</option>
                  <option value="Corporate Event Settlement">Corporate Event Settlement</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Taxable Subtotal (₹)</label>
                  <input
                    type="number"
                    required
                    value={invSubtotal}
                    onChange={(e) => setInvSubtotal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GST Rate</label>
                  <select
                    value={invGstRate}
                    onChange={(e) => setInvGstRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                  >
                    <option value="12">12% (6% CGST + 6% SGST)</option>
                    <option value="5">5% (2.5% CGST + 2.5% SGST)</option>
                    <option value="18">18% (9% CGST + 9% SGST)</option>
                    <option value="0">0% (Exempt)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={invMode}
                    onChange={(e) => setInvMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / QR)</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash Currency</option>
                    <option value="Bank NEFT">Bank NEFT / RTGS</option>
                    <option value="Direct Bill to Company">Direct Bill to Company</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={invStatus}
                    onChange={(e) => setInvStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                  >
                    <option value="PAID">Paid in Full</option>
                    <option value="PENDING">Due Balance</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGenerateInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-lime-700 hover:bg-lime-800 text-white font-bold text-xs shadow-md"
                >
                  Issue Tax Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD EXPENSE */}
      {/* ========================================================================= */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900">Record Hotel Expense Voucher</h3>
              <button onClick={() => setIsAddExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payee / Vendor *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BESCOM Electricity or City Water Supply"
                  value={expPayee}
                  onChange={(e) => setExpPayee(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                  >
                    <option value="Utility Bills">Utility Bills (Power/Water)</option>
                    <option value="F&B Provisions">F&B Provisions & Dairy</option>
                    <option value="Repairs & Maintenance">Repairs & Maintenance</option>
                    <option value="Staff Petty Cash">Staff Petty Cash</option>
                    <option value="Marketing & OTA Commissions">Marketing & OTA Fees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={expMode}
                    onChange={(e) => setExpMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Company Card">Company Card</option>
                    <option value="Bank NEFT">Bank NEFT</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Disbursement Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-md"
                >
                  Record Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINT GST TAX INVOICE */}
      {/* ========================================================================= */}
      {selectedInvoiceForPrint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-lime-700 uppercase">Original Tax Invoice</span>
                <h3 className="font-serif text-lg font-bold text-slate-900">{selectedInvoiceForPrint.id}</h3>
              </div>
              <button onClick={() => setSelectedInvoiceForPrint(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Invoice Card */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs space-y-3 font-mono">
              <div className="border-b border-slate-200 pb-2 text-center">
                <h4 className="font-bold text-sm text-slate-900 font-serif">{currentHotel.name}</h4>
                <p className="text-[10px] text-slate-500 font-sans">GSTIN: 29AABCU9603R1ZM • Official Tax Invoice</p>
              </div>

              <div className="flex justify-between">
                <span>Date: {selectedInvoiceForPrint.date}</span>
                <span>Mode: {selectedInvoiceForPrint.mode}</span>
              </div>

              <div className="border-t border-b border-slate-200 py-2 space-y-1">
                <div className="flex justify-between">
                  <span className="font-sans font-bold text-slate-800">Guest: {selectedInvoiceForPrint.client}</span>
                  <span>{selectedInvoiceForPrint.phone}</span>
                </div>
                <div className="text-slate-500 font-sans">{selectedInvoiceForPrint.category}</div>
              </div>

              <div className="space-y-1 text-slate-700 pt-1">
                <div className="flex justify-between">
                  <span>Taxable Subtotal:</span>
                  <span className="font-bold">₹{selectedInvoiceForPrint.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>CGST (6%):</span>
                  <span>₹{selectedInvoiceForPrint.cgst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>SGST (6%):</span>
                  <span>₹{selectedInvoiceForPrint.sgst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-300 font-black text-sm text-slate-900">
                  <span>Grand Total:</span>
                  <span>₹{selectedInvoiceForPrint.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Amount Paid:</span>
                  <span>₹{selectedInvoiceForPrint.paid.toLocaleString()}</span>
                </div>
                {selectedInvoiceForPrint.due > 0 && (
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>Balance Due:</span>
                    <span>₹{selectedInvoiceForPrint.due.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-lime-700 hover:bg-lime-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setSelectedInvoiceForPrint(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
