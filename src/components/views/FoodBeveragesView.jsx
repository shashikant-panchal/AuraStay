import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  UtensilsCrossed, 
  Plus, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Search,
  Coffee,
  Pizza
} from 'lucide-react';

export default function FoodBeveragesView() {
  const { fnbOrders, showNotification, rooms = [] } = useDashboard();
  const [orders, setOrders] = useState(fnbOrders);

  useEffect(() => {
    setOrders(fnbOrders);
  }, [fnbOrders]);
  const [newRoom, setNewRoom] = useState(rooms.length > 0 ? `Room ${rooms[0].roomNumber}` : 'Table 1 (Dine-in)');
  const [newItems, setNewItems] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleCreateOrder = (e) => {
    e.preventDefault();
    const newOrd = {
      orderId: `AST-O-${Date.now().toString().slice(-4)}`,
      roomTable: newRoom,
      guest: 'Checked-in Guest',
      items: newItems,
      total: Number(newAmount),
      status: 'PREPARING',
      time: 'Just now'
    };
    setOrders([newOrd, ...orders]);
    setIsFormOpen(false);
    setNewItems('');
    setNewAmount('');
    showNotification(`F&B Order ${newOrd.orderId} sent to kitchen KOT!`);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o));
    showNotification(`Order ${orderId} marked as ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <UtensilsCrossed className="w-5 h-5 text-green-600" />
            <h2 className="text-base font-bold text-slate-900">
              Food & Beverages — POS & Order Dashboard
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kitchen Order Tickets (KOT), room service billing, and live restaurant dining tabs.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Take New Order</span>
        </button>
      </div>

      {/* New Order Form */}
      {isFormOpen && (
        <form onSubmit={handleCreateOrder} className="bg-white p-5 rounded-xl border border-green-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-green-800">
            Create Kitchen Order Ticket (KOT)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Room / Table</label>
              <select
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {rooms.map(r => (
                  <option key={r.roomNumber} value={`Room ${r.roomNumber}`}>Room {r.roomNumber}</option>
                ))}
                <option value="Table 1 (Dine-in)">Table 1 (Dine-in)</option>
                <option value="Table 2 (Dine-in)">Table 2 (Dine-in)</option>
                <option value="Table 3 (Dine-in)">Table 3 (Dine-in)</option>
                <option value="Table 4 (Dine-in)">Table 4 (Dine-in)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ordered Dishes / Items</label>
              <input
                type="text"
                placeholder="e.g. Masala Dosa (2), Filter Coffee (2)"
                value={newItems}
                onChange={(e) => setNewItems(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Bill Amount (₹)</label>
              <input
                type="number"
                placeholder="e.g. 420"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Submit Order to Kitchen
            </button>
          </div>
        </form>
      )}

      {/* Orders List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 text-xs font-bold text-slate-700">
          Active Food & Beverage Orders ({orders.length})
        </div>

        <div className="divide-y divide-slate-100">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No active food & beverage orders. Click <button onClick={() => setIsFormOpen(true)} className="text-indigo-600 font-bold underline hover:text-indigo-800">Take New Order</button> to place an order.
            </div>
          ) : (
            orders.map(order => (
            <div key={order.orderId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 transition">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-slate-900">{order.orderId}</span>
                  <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {order.roomTable}
                  </span>
                  <span className="text-slate-400">· {order.guest}</span>
                  <span className="text-slate-400 font-mono text-[11px]">({order.time})</span>
                </div>
                <p className="text-slate-600 mt-1 font-medium">
                  {order.items}
                </p>
              </div>

              <div className="flex items-center space-x-4 self-start sm:self-auto shrink-0">
                <span className="font-mono font-extrabold text-sm text-slate-900">
                  ₹{order.total}
                </span>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  order.status === 'DELIVERED' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : order.status === 'PREPARING'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {order.status}
                </span>

                {order.status !== 'DELIVERED' && (
                  <button
                    onClick={() => updateOrderStatus(order.orderId, 'DELIVERED')}
                    className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-[11px] font-semibold rounded border border-green-200 transition"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          )))}
        </div>
      </div>
    </div>
  );
}

