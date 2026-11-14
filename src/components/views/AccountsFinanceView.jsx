import React, { useState, useMemo, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  Wallet,
  Receipt,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  X,
  CreditCard,
  Building,
  Calendar,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Check,
  Percent
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function AccountsFinanceView() {
  const {
    data,
    showNotification,
    reservations = [],
    updateReservationPayment,
    currentHotel = {},
    activeTab: contextActiveTab,
    setActiveTab: setContextActiveTab
  } = useDashboard();

  // Resolve active tab from context
  const resolveTab = (tab) => {
    if (tab === 'ledger' || tab === 'expenses') return 'expenses';
    if (tab === 'tax-reports') return 'tax-reports';
    return 'invoices';
  };

  const [activeTab, setActiveTab] = useState(() => resolveTab(contextActiveTab));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (contextActiveTab) {
      setActiveTab(resolveTab(contextActiveTab));
    }
  }, [contextActiveTab]);

  const handleTabChange = (t) => {
    setActiveTab(t);
    if (setContextActiveTab) {
      if (t === 'invoices') setContextActiveTab('cash-book');
      else if (t === 'expenses') setContextActiveTab('ledger');
      else if (t === 'tax-reports') setContextActiveTab('tax-reports');
    }
  };

  // Modals state
  const [isGenerateInvoiceModalOpen, setIsGenerateInvoiceModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);

  // Custom Invoices & Vouchers State - driven by Supabase financial_invoices
  const [customInvoices, setCustomInvoices] = useState([]);

  // Hotel Expenses State - driven by Supabase hotel_expenses
  const [expenses, setExpenses] = useState([]);

  // New Invoice Form State
  const [invClientName, setInvClientName] = useState('');
  const [invPhone, setInvPhone] = useState('');
  const [invCategory, setInvCategory] = useState('Room Stay Accommodation');
  const [invSubtotal, setInvSubtotal] = useState('5000');
  const [invPaymentMode, setInvPaymentMode] = useState('UPI');
  const [invStatus, setInvStatus] = useState('PAID');
  const [invNotes, setInvNotes] = useState('');

  // New Expense Form State
  const [expPayee, setExpPayee] = useState('');
  const [expCategory, setExpCategory] = useState('Utility Bills');
  const [expAmount, setExpAmount] = useState('2500');
  const [expMode, setExpMode] = useState('UPI');
  const [expNotes, setExpNotes] = useState('');

  // Merge Live Reservations into Invoices
  const allInvoices = useMemo(() => {
    const reservationInvoices = reservations.map(r => {
      const total = Number(r.amount || r.price || r.totalPrice || r.totalAmount || 0);
      const paid = Number(r.paid !== undefined ? r.paid : (r.payment === 'PAID' ? total : 0));
      const isSettled = r.payment === 'PAID' || (total > 0 && paid >= total);
      const guestName = typeof r.guest === 'string' && r.guest ? r.guest : (r.guestName || r.guest?.name || 'Valued Guest');
      const guestPhone = r.phone || r.guestPhone || r.guest?.phone || '—';
      const guestRoom = String(r.room_number || r.room || '101').replace(/Room\s*/i, '');
      const paymentMode = r.payment_mode || r.paymentMode || r.paymentMethod || 'UPI';
      const invDate = r.check_in || r.checkIn || r.checkInDate || new Date().toLocaleDateString('en-GB');

      return {
        id: `INV-${String(r.id).replace(/\D/g, '').slice(-4) || String(r.id).slice(-4)}`,
        refId: r.id,
        clientName: guestName,
        clientPhone: guestPhone,
        room: guestRoom,
        category: 'Room Stay Accommodation',
        sacCode: '9963',
        subtotal: Math.round(total / 1.12),
        cgst: Math.round((total / 1.12) * 0.06),
        sgst: Math.round((total / 1.12) * 0.06),
        total,
        paid,
        due: Math.max(0, total - paid),
        paymentMode: paymentMode,
        status: isSettled ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'PENDING'),
        date: invDate
      };
    });

    return [...customInvoices, ...reservationInvoices];
  }, [reservations, customInvoices]);

  // Compute Financial Totals
  const totalBilled = allInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const totalCollected = allInvoices.reduce((sum, i) => sum + (i.paid || 0), 0);
  const totalReceivables = allInvoices.reduce((sum, i) => sum + (i.due || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netDailyProfit = totalCollected - totalExpenses;

  // GST Calculation Breakdown
  const gstBreakdown = useMemo(() => {
    let roomTaxable = 0;
    let roomCGST = 0;
    let roomSGST = 0;

    let fnbTaxable = 0;
    let fnbCGST = 0;
    let fnbSGST = 0;

    let banquetTaxable = 0;
    let banquetCGST = 0;
    let banquetSGST = 0;

    allInvoices.forEach(inv => {
      if (inv.category === 'Room Stay Accommodation') {
        roomTaxable += inv.subtotal || Math.round(inv.total / 1.12);
        roomCGST += inv.cgst || Math.round((inv.total / 1.12) * 0.06);
        roomSGST += inv.sgst || Math.round((inv.total / 1.12) * 0.06);
      } else if (inv.category === 'Restaurant & F&B Dining') {
        fnbTaxable += inv.subtotal || Math.round(inv.total / 1.05);
        fnbCGST += Math.round((inv.total / 1.05) * 0.025);
        fnbSGST += Math.round((inv.total / 1.05) * 0.025);
      } else {
        banquetTaxable += inv.subtotal || Math.round(inv.total / 1.18);
        banquetCGST += Math.round((inv.total / 1.18) * 0.09);
        banquetSGST += Math.round((inv.total / 1.18) * 0.09);
      }
    });

    const totalOutputGst = roomCGST + roomSGST + fnbCGST + fnbSGST + banquetCGST + banquetSGST;
    const inputTaxCredit = Math.round(totalExpenses * 0.12);
    const netGstPayable = Math.max(0, totalOutputGst - inputTaxCredit);

    return {
      roomTaxable,
      roomCGST,
      roomSGST,
      fnbTaxable,
      fnbCGST,
      fnbSGST,
      banquetTaxable,
      banquetCGST,
      banquetSGST,
      totalOutputGst,
      inputTaxCredit,
      netGstPayable
    };
  }, [allInvoices, totalExpenses]);

  // Load from Supabase on mount / hotel change (strictly tenant-isolated)
  useEffect(() => {
    if (!isSupabaseConfigured || !currentHotel?.id) return;

    let isMounted = true;
    const fetchFinanceData = async () => {
      try {
        const hotelId = currentHotel.id;
        const [invRes, expRes] = await Promise.all([
          supabase.from('financial_invoices').select('*').eq('hotel_id', hotelId),
          supabase.from('hotel_expenses').select('*').eq('hotel_id', hotelId)
        ]);

        if (!isMounted) return;

        if (invRes.data && invRes.data.length > 0) {
          const mappedInvs = invRes.data.map(inv => {
            const sub = Number(inv.subtotal) || 0;
            const cgst = Number(inv.cgst) || 0;
            const sgst = Number(inv.sgst) || 0;
            const total = Number(inv.total_amount) || 0;
            const paid = Number(inv.paid_amount) || 0;
            const due = Math.max(0, total - paid);
            return {
              id: inv.id,
              clientName: inv.client_name,
              clientPhone: inv.client_phone || '—',
              category: inv.category || 'Room Stay Accommodation',
              sacCode: inv.category === 'Restaurant & F&B Dining' ? '996331' : inv.category === 'Banquet & Events' ? '9985' : '9963',
              subtotal: sub,
              cgst: cgst,
              sgst: sgst,
              total: total,
              paid: paid,
              due: due,
              paymentMode: inv.payment_mode || 'UPI',
              status: inv.status || 'PAID',
              date: inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')
            };
          });

          setCustomInvoices(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = mappedInvs.filter(m => !existingIds.has(m.id));
            return [...prev, ...newOnes];
          });
        }

        if (expRes.data && expRes.data.length > 0) {
          const mappedExps = expRes.data.map(exp => ({
            id: exp.id,
            payee: exp.payee,
            category: exp.category,
            amount: Number(exp.amount) || 0,
            mode: exp.payment_mode || 'UPI',
            status: exp.status || 'PAID',
            date: exp.expense_date || (exp.created_at ? new Date(exp.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'))
          }));
          setExpenses(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = mappedExps.filter(m => !existingIds.has(m.id));
            return [...prev, ...newOnes];
          });
        }
      } catch (err) {
        console.warn('Failed to load finance data from Supabase:', err);
      }
    };

    fetchFinanceData();
    return () => { isMounted = false; };
  }, [currentHotel]);

  // Create Custom Invoice
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invClientName) return;

    const sub = Number(invSubtotal) || 0;
    const cgst = Math.round(sub * 0.06);
    const sgst = Math.round(sub * 0.06);
    const total = sub + cgst + sgst;
    const paid = invStatus === 'PAID' ? total : 0;

    const newInv = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      clientName: invClientName,
      clientPhone: invPhone,
      category: invCategory,
      sacCode: invCategory === 'Restaurant & F&B Dining' ? '996331' : invCategory === 'Banquet & Events' ? '9985' : '9963',
      subtotal: sub,
      cgst,
      sgst,
      total,
      paid,
      due: Math.max(0, total - paid),
      paymentMode: invPaymentMode,
      status: invStatus,
      date: new Date().toLocaleDateString('en-GB')
    };

    setCustomInvoices(prev => [newInv, ...prev]);
    setIsGenerateInvoiceModalOpen(false);
    showNotification(`Generated GST Tax Invoice #${newInv.id} for ${newInv.clientName}`);
    setInvClientName('');
    setInvPhone('');

    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        await supabase.from('financial_invoices').upsert([{
          id: newInv.id,
          hotel_id: currentHotel.id,
          client_name: newInv.clientName,
          client_phone: newInv.clientPhone,
          category: newInv.category,
          subtotal: newInv.subtotal,
          cgst: newInv.cgst,
          sgst: newInv.sgst,
          total_amount: newInv.total,
          paid_amount: newInv.paid,
          payment_mode: newInv.paymentMode,
          status: newInv.status,
          notes: invNotes
        }]);
      } catch (err) {
        console.warn('Failed to insert invoice into Supabase:', err);
      }
    }
  };

  // Record Hotel Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expPayee) return;

    const newExp = {
      id: `EXP-${Date.now().toString().slice(-4)}`,
      payee: expPayee,
      category: expCategory,
      amount: Number(expAmount) || 0,
      mode: expMode,
      status: 'PAID',
      date: new Date().toLocaleDateString('en-GB')
    };

    setExpenses(prev => [newExp, ...prev]);
    setIsAddExpenseModalOpen(false);
    showNotification(`Expense voucher #${newExp.id} of ₹${newExp.amount} recorded.`);
    setExpPayee('');

    if (isSupabaseConfigured && currentHotel?.id) {
      try {
        await supabase.from('hotel_expenses').insert([{
          id: newExp.id,
          hotel_id: currentHotel.id,
          payee: newExp.payee,
          category: newExp.category,
          amount: newExp.amount,
          payment_mode: newExp.mode,
          status: newExp.status,
          expense_date: newExp.date,
          notes: expNotes
        }]);
      } catch (err) {
        console.warn('Failed to insert expense into Supabase:', err);
      }
    }
  };

  // Settle Invoice Balance
  const handleSettleInvoice = async (inv) => {
    setCustomInvoices(prev => prev.map(item => {
      if (item.id === inv.id) {
        return {
          ...item,
          paid: item.total,
          due: 0,
          status: 'PAID'
        };
      }
      return item;
    }));
    if (inv.refId && updateReservationPayment) {
      updateReservationPayment(inv.refId, { paid: inv.total, due: 0, paymentStatus: 'PAID' });
    }
    if (isSupabaseConfigured) {
      try {
        await supabase.from('financial_invoices').update({
          paid_amount: inv.total,
          status: 'PAID'
        }).eq('id', inv.id);
      } catch (err) {
        console.warn('Failed to update invoice in Supabase:', err);
      }
    }
    showNotification(`Invoice #${inv.id} settled in full.`);
  };

  // Filter Invoices
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(inv => {
      const matchSearch = String(inv.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(inv.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(inv.clientPhone || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [allInvoices, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* 1. Header Banner */}
        <div className="bg-gradient-to-r from-[#173024] via-[#204231] to-[#2b5943] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACCOUNTS & FINANCIAL CONTROLS
              </span>
              <span className="text-xs text-emerald-200/80 font-mono">• Exceed HMS Module</span>
            </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                Accounts, Billing & GST Compliance
              </h1>
                <p className="text-xs text-emerald-200 mt-1 max-w-xl leading-relaxed">
                  Live folio ledgers, cash drawer settlement, automated CGST/SGST tax calculations, and official GST filing statements.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeTab === 'invoices' && (
                  <button
                    onClick={() => setIsGenerateInvoiceModalOpen(true)}
                    className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Generate Tax Invoice</span>
                  </button>
                )}

                {activeTab === 'expenses' && (
                  <button
                    onClick={() => setIsAddExpenseModalOpen(true)}
                    className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Record Expense Voucher</span>
                  </button>
                )}

                {activeTab === 'tax-reports' && (
                  <button
                    onClick={() => window.print()}
                    className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Export GST Statement</span>
                  </button>
                )}
              </div>
          </div>

          {/* 2. Top Financial KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Card 1: Total Revenue Billed */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Revenue Billed</span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-slate-700" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">₹{totalBilled.toLocaleString('en-IN')}</div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-slate-500">
                    <span>Rooms, F&B & Banquets</span>
                  </div>
                </div>
              </div>

                {/* Card 2: Collections Received */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Collections Received</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">₹{totalCollected.toLocaleString('en-IN')}</div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Cleared in Bank / Drawer</span>
                    </div>
                  </div>
                </div>

                  {/* Card 3: Accounts Receivable (Due) */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Accounts Receivable (Due)</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">₹{totalReceivables.toLocaleString('en-IN')}</div>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>Pending settlement</span>
                      </div>
                    </div>
                  </div>

                    {/* Card 4: Hotel Expenses */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Hotel Expenses</span>
                        <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                          <ArrowDownRight className="w-4 h-4 text-rose-600" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">₹{totalExpenses.toLocaleString('en-IN')}</div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-slate-500">
                          <span>Utilities & maintenance</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Navigation Sub-Tabs */}
                    <div className="bg-white rounded-2xl p-1.5 border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleTabChange('invoices')}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${activeTab === 'invoices'
                              ? 'bg-[#204231] text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                            }`}
                        >
                          <Receipt className="w-4 h-4" />
                          <span>Cash Book & Invoices ({allInvoices.length})</span>
                        </button>

                        <button
                          onClick={() => handleTabChange('expenses')}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${activeTab === 'expenses'
                              ? 'bg-[#204231] text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                            }`}
                        >
                          <Wallet className="w-4 h-4" />
                          <span>General Ledger & Expenses ({expenses.length})</span>
                        </button>

                        <button
                          onClick={() => handleTabChange('tax-reports')}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${activeTab === 'tax-reports'
                              ? 'bg-[#204231] text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                            }`}
                        >
                          <Percent className="w-4 h-4" />
                          <span>GST Tax Reports & Balance Sheet</span>
                        </button>
                      </div>

                      {/* Right status indicator */}
                      <div className="hidden sm:flex items-center gap-2 pr-3 text-[11px] font-semibold text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Financial Ledger In Sync</span>
                      </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* TAB 1: CASH BOOK & INVOICES */}
                    {/* ========================================================================= */}
                    {activeTab === 'invoices' && (
                      <div className="space-y-4">
                        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Search invoice #, client, or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              />
                            </div>

                            <select
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 outline-none"
                            >
                              <option value="ALL">All Payments</option>
                              <option value="PAID">Settled (Paid)</option>
                              <option value="PENDING">Pending (Due)</option>
                              <option value="PARTIAL">Partial</option>
                            </select>
                          </div>

                          <div className="text-xs font-semibold text-slate-500">
                            Showing {filteredInvoices.length} of {allInvoices.length} invoices
                          </div>
                        </div>

                        {filteredInvoices.length === 0 ? (
                          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
                            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                              <Receipt className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">No Invoices or Folios Found</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                              No billing transactions recorded yet. Invoices populate automatically when guests book rooms, or you can generate manual tax bills.
                            </p>
                            <button
                              onClick={() => setIsGenerateInvoiceModalOpen(true)}
                              className="mt-4 px-4 py-2 bg-[#204231] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                            >
                              + Generate Tax Invoice
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                  <tr>
                                    <th className="py-3.5 px-4">Invoice #</th>
                                    <th className="py-3.5 px-4">Client / Guest</th>
                                    <th className="py-3.5 px-4">Particulars</th>
                                    <th className="py-3.5 px-4">SAC Code</th>
                                    <th className="py-3.5 px-4">Subtotal</th>
                                    <th className="py-3.5 px-4">CGST (6%)</th>
                                    <th className="py-3.5 px-4">SGST (6%)</th>
                                    <th className="py-3.5 px-4">Total Amount</th>
                                    <th className="py-3.5 px-4">Paid Mode</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {filteredInvoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-950">{inv.id}</td>
                                      <td className="py-3.5 px-4 font-bold text-slate-900">
                                        {inv.clientName}
                                        {inv.room && <span className="block text-[10px] text-sky-700 font-normal">Room {inv.room}</span>}
                                      </td>
                                      <td className="py-3.5 px-4 text-slate-600">{inv.category}</td>
                                      <td className="py-3.5 px-4 font-mono text-slate-500">{inv.sacCode || '9963'}</td>
                                      <td className="py-3.5 px-4 font-mono text-slate-800">₹{inv.subtotal.toLocaleString()}</td>
                                      <td className="py-3.5 px-4 font-mono text-slate-500">₹{inv.cgst.toLocaleString()}</td>
                                      <td className="py-3.5 px-4 font-mono text-slate-500">₹{inv.sgst.toLocaleString()}</td>
                                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">₹{inv.total.toLocaleString()}</td>
                                      <td className="py-3.5 px-4">
                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
                                          {inv.paymentMode}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                                            inv.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
                                              'bg-rose-100 text-rose-800'
                                          }`}>
                                          {inv.status}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-right space-x-1">
                                        <button
                                          onClick={() => setSelectedInvoiceForPrint(inv)}
                                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition cursor-pointer"
                                        >
                                          Print Tax Bill
                                        </button>
                                        {inv.status !== 'PAID' && (
                                          <button
                                            onClick={() => handleSettleInvoice(inv)}
                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                                          >
                                            Settle ✓
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 2: GENERAL LEDGER & EXPENSES */}
                    {/* ========================================================================= */}
                    {activeTab === 'expenses' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">Hotel Operational Expense Vouchers</h3>
                            <p className="text-xs text-slate-500">Log utility bills, linen laundry, vendor procurement, and property maintenance payouts.</p>
                          </div>
                          <button
                            onClick={() => setIsAddExpenseModalOpen(true)}
                            className="px-3.5 py-2 bg-[#204231] hover:bg-[#173024] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Record Expense Voucher</span>
                          </button>
                        </div>

                        {expenses.length === 0 ? (
                          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
                            <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto mb-3">
                              <ArrowDownRight className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">No Expense Vouchers Recorded</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                              You haven't logged any property expenses yet. Click below to record utility bills, laundry, or vendor disbursements.
                            </p>
                            <button
                              onClick={() => setIsAddExpenseModalOpen(true)}
                              className="mt-4 px-4 py-2 bg-[#204231] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                            >
                              + Record Expense Voucher
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                  <tr>
                                    <th className="py-3.5 px-4">Voucher ID</th>
                                    <th className="py-3.5 px-4">Payee / Vendor</th>
                                    <th className="py-3.5 px-4">Expense Head</th>
                                    <th className="py-3.5 px-4">Payment Mode</th>
                                    <th className="py-3.5 px-4">Disbursement Date</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Amount Paid</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {expenses.map(e => (
                                    <tr key={e.id} className="hover:bg-slate-50/60 transition">
                                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{e.id}</td>
                                      <td className="py-3.5 px-4 font-bold text-slate-900">{e.payee}</td>
                                      <td className="py-3.5 px-4 text-slate-600">{e.category}</td>
                                      <td className="py-3.5 px-4 font-mono text-slate-700">{e.mode}</td>
                                      <td className="py-3.5 px-4 font-mono text-slate-500">{e.date}</td>
                                      <td className="py-3.5 px-4">
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                          CLEARED ✓
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-right font-mono font-black text-rose-700 text-sm">
                                        -₹{e.amount.toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 3: GST TAX REPORTS & BALANCE SHEET */}
                    {/* ========================================================================= */}
                    {activeTab === 'tax-reports' && (
                      <div className="space-y-6">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">GST COMPLIANCE SUMMARY (SAC MASTER)</span>
                              <h3 className="font-bold text-xl text-slate-900 mt-0.5">Goods & Services Tax (GST) Liability</h3>
                              <span className="text-xs text-slate-500">Official SAC Code breakdown for GSTR-1 and GSTR-3B filings.</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">Net GST Payable to Govt</span>
                              <span className="font-mono font-black text-2xl text-emerald-800">₹{gstBreakdown.netGstPayable.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-900 text-sm">SAC 9963: Hotel Rooms</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-100 text-sky-800 rounded">12% GST</span>
                              </div>
                              <div className="text-xs text-slate-600 space-y-1 pt-1">
                                <div className="flex justify-between">
                                  <span>Taxable Turnover:</span>
                                  <span className="font-mono font-semibold">₹{gstBreakdown.roomTaxable.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>CGST (6%):</span>
                                  <span className="font-mono font-semibold">₹{gstBreakdown.roomCGST.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>SGST (6%):</span>
                                  <span className="font-mono font-semibold">₹{gstBreakdown.roomSGST.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-900 text-sm">SAC 996331: Restaurant & F&B</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">5% GST</span>
                              </div>
                              <div className="text-xs text-slate-600 space-y-1 pt-1">
                                <div className="flex justify-between">
                                  <span>Taxable Turnover:</span>
                                  <span className="font-mono font-semibold">₹{gstBreakdown.fnbTaxable.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>CGST (2.5%):</span>
                                  <span className="font-mono font-semibold">₹{gstBreakdown.fnbCGST.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>SGST (2.5%):</span>
                                  <span className="font-mono font-semibold">₹{gstBreakdown.fnbSGST.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-900 text-sm">SAC 9985: Banquets & Events</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">18% GST</span>
                              </div>
                              <div className="text-xs text-slate-600 space-y-1 pt-1">
                                <div className="flex justify-between">
                                  <span>Taxable Turnover:</span>
                                  <span className="font-mono font-semibold">₹{gstBreakdown.banquetTaxable.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>CGST (9%):</span>
                                  <span className="font-mono font-semibold">₹{gstBreakdown.banquetCGST.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>SGST (9%):</span>
                                  <span className="font-mono font-semibold">₹{gstBreakdown.banquetSGST.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div>
                              <span className="font-bold text-emerald-950 block">Input Tax Credit (ITC) Offset</span>
                              <span className="text-emerald-800">12% GST credit claimed from vendor expenses and laundry invoices: ₹{gstBreakdown.inputTaxCredit.toLocaleString()}</span>
                            </div>
                            <button
                              onClick={() => window.print()}
                              className="px-4 py-2 bg-[#204231] hover:bg-[#173024] text-white rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                              <span>Print Official Tax Statement</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* MODAL: GENERATE TAX INVOICE */}
                    {/* ========================================================================= */}
                    {isGenerateInvoiceModalOpen && (
                      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-900">Generate GST Tax Invoice</h3>
                            <button onClick={() => setIsGenerateInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Client / Guest Full Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Anand Murthy"
                                value={invClientName}
                                onChange={(e) => setInvClientName(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Phone Number</label>
                                <input
                                  type="tel"
                                  placeholder="e.g. +91 98765 43210"
                                  value={invPhone}
                                  onChange={(e) => setInvPhone(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Particulars Category</label>
                                <select
                                  value={invCategory}
                                  onChange={(e) => setInvCategory(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                  <option value="Room Stay Accommodation">Room Stay Accommodation</option>
                                  <option value="Restaurant & F&B Dining">Restaurant & F&B Dining</option>
                                  <option value="Banquet & Events">Banquet & Events</option>
                                  <option value="Laundry & Spa Services">Laundry & Spa Services</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Taxable Amount (₹)</label>
                              <input
                                type="number"
                                value={invSubtotal}
                                onChange={(e) => setInvSubtotal(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-base"
                                required
                              />
                            </div>

                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                              <div className="flex justify-between">
                                <span>CGST (6%):</span>
                                <span className="font-mono">₹{Math.round(Number(invSubtotal) * 0.06)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>SGST (6%):</span>
                                <span className="font-mono">₹{Math.round(Number(invSubtotal) * 0.06)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 mt-1">
                                <span>Total Payable:</span>
                                <span className="font-mono">₹{Math.round(Number(invSubtotal) * 1.12)}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Payment Mode</label>
                                <select
                                  value={invPaymentMode}
                                  onChange={(e) => setInvPaymentMode(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                  <option value="UPI">UPI / QR Code</option>
                                  <option value="Card">Credit / Debit Card</option>
                                  <option value="Cash">Cash in Drawer</option>
                                  <option value="Bank NEFT">Bank NEFT / RTGS</option>
                                </select>
                              </div>

                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Payment Status</label>
                                <select
                                  value={invStatus}
                                  onChange={(e) => setInvStatus(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                  <option value="PAID">Paid in Full</option>
                                  <option value="PENDING">Pending (Credit)</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setIsGenerateInvoiceModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-[#204231] hover:bg-[#173024] text-white font-bold shadow-md cursor-pointer"
                              >
                                Generate Invoice
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* MODAL: ADD EXPENSE VOUCHER */}
                    {/* ========================================================================= */}
                    {isAddExpenseModalOpen && (
                      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-900">Record Hotel Expense</h3>
                            <button onClick={() => setIsAddExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Payee / Vendor Name</label>
                              <input
                                type="text"
                                placeholder="e.g. BESCOM Electricity, CleanWash Laundry"
                                value={expPayee}
                                onChange={(e) => setExpPayee(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Expense Head</label>
                                <select
                                  value={expCategory}
                                  onChange={(e) => setExpCategory(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                  <option value="Utility Bills">Utility Bills</option>
                                  <option value="Linen Laundry">Linen Laundry</option>
                                  <option value="F&B Provisions">F&B Provisions</option>
                                  <option value="Property Maintenance">Property Maintenance</option>
                                  <option value="Staff Welfare">Staff Welfare</option>
                                </select>
                              </div>

                              <div>
                                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Disbursement Mode</label>
                                <select
                                  value={expMode}
                                  onChange={(e) => setExpMode(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                  <option value="UPI">UPI</option>
                                  <option value="Bank NEFT">Bank NEFT</option>
                                  <option value="Company Card">Company Card</option>
                                  <option value="Petty Cash">Petty Cash</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">Amount Paid (₹)</label>
                              <input
                                type="number"
                                value={expAmount}
                                onChange={(e) => setExpAmount(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-base text-rose-700"
                                required
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setIsAddExpenseModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-[#204231] hover:bg-[#173024] text-white font-bold shadow-md cursor-pointer"
                              >
                                Save Voucher
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* MODAL: PRINTABLE GST TAX INVOICE */}
                    {/* ========================================================================= */}
                    {selectedInvoiceForPrint && (
                      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                                TAX INVOICE / GUEST FOLIO
                              </span>
                                <h3 className="font-bold text-xl text-slate-900 mt-1">
                                  Invoice #{selectedInvoiceForPrint.id}
                                </h3>
                                <span className="text-xs text-slate-500 font-semibold">{currentHotel.name} • GSTIN: 29AAACH7409R1ZZ</span>
                            </div>
                            <button onClick={() => setSelectedInvoiceForPrint(null)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="py-4 space-y-3 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500 font-medium">Billed To (Guest):</span>
                              <span className="font-bold text-slate-900">{selectedInvoiceForPrint.clientName}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500 font-medium">Contact:</span>
                              <span className="font-mono text-slate-900">{selectedInvoiceForPrint.clientPhone}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500 font-medium">Service Particulars:</span>
                              <span className="font-bold text-slate-800">{selectedInvoiceForPrint.category} (SAC {selectedInvoiceForPrint.sacCode || '9963'})</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-500 font-medium">Invoice Date:</span>
                              <span className="font-mono text-slate-900">{selectedInvoiceForPrint.date}</span>
                            </div>

                            <div className="pt-2 space-y-1">
                              <div className="flex justify-between py-1">
                                <span className="text-slate-600">Taxable Subtotal:</span>
                                <span className="font-mono font-bold">₹{selectedInvoiceForPrint.subtotal.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between py-1 text-slate-500">
                                <span>Central GST (CGST @ 6%):</span>
                                <span className="font-mono">₹{selectedInvoiceForPrint.cgst.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between py-1 text-slate-500">
                                <span>State GST (SGST @ 6%):</span>
                                <span className="font-mono">₹{selectedInvoiceForPrint.sgst.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between py-2 border-t border-slate-200 font-black text-sm text-slate-900">
                                <span>Total Invoice Value:</span>
                                <span className="font-mono">₹{selectedInvoiceForPrint.total.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between py-1 text-emerald-800 font-bold">
                                <span>Amount Paid ({selectedInvoiceForPrint.paymentMode}):</span>
                                <span className="font-mono">₹{selectedInvoiceForPrint.paid.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                              onClick={() => window.print()}
                              className="px-4 py-2 bg-[#204231] hover:bg-[#173024] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                              <span>Print Official GST Bill</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                  );
}
