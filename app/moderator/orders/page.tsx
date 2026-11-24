"use client";

import { useState, useEffect } from "react";
import {
  Search, CheckCircle2, XCircle, Clock, ShoppingBag, Copy, Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { CopyOrderId } from "@/components/ui/CopyOrderId";

export default function ModeratorOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/admin/orders");
        if (res.ok) setOrders(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleMarkOrderDelivered = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" }),
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(orders.map((o) => (o._id === orderId ? updatedOrder : o)));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update order");
      }
    } catch {
      alert("Error updating order");
    }
  };

  const filteredOrders = orders.filter((order) =>
    (order.transaction_id?.toLowerCase() || "").includes(orderSearchQuery.toLowerCase()) ||
    (order.user?.name?.toLowerCase() || "").includes(orderSearchQuery.toLowerCase()) ||
    (order.phoneNumber?.toLowerCase() || "").includes(orderSearchQuery.toLowerCase()) ||
    (order.network?.toLowerCase() || "").includes(orderSearchQuery.toLowerCase()) ||
    (order.bundleName?.toLowerCase() || "").includes(orderSearchQuery.toLowerCase()) ||
    (order.status?.toLowerCase() || "").includes(orderSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-slate-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">Order Management</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Process and monitor customer data deliveries.</p>
      </div>

      <Card className="border-zinc-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 md:p-6 border-b border-zinc-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white">
          <h3 className="text-base font-semibold text-zinc-900">
            Active Orders <span className="text-zinc-400 font-normal text-sm">({filteredOrders.length})</span>
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search by ID, phone, or name..."
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-900 focus:outline-none focus:border-slate-400 transition-colors w-full placeholder-zinc-400"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-zinc-500 font-medium whitespace-nowrap">
              <tr>
                <th className="px-6 py-4 border-b">Order Detail</th>
                <th className="px-6 py-4 border-b">Customer</th>
                <th className="px-6 py-4 border-b">Bundle</th>
                <th className="px-6 py-4 border-b">Amount</th>
                <th className="px-6 py-4 border-b">Status</th>
                <th className="px-6 py-4 border-b text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 whitespace-nowrap">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 min-w-0">
                      <CopyOrderId id={order.transaction_id} maxWidth="max-w-[130px] lg:max-w-[170px]" />
                      <span className="text-[11px] text-zinc-400">
                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-zinc-900">{order.user?.name || "Guest"}</span>
                      <span className="text-xs text-zinc-500 font-mono">{order.phoneNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider
                      ${order.network === "MTN" ? "bg-[#FFCC00] text-[#51291e]" :
                        order.network === "Telecel" ? "bg-[#E60000] text-white" : "bg-blue-600 text-white"}`}>
                      {order.network} {order.bundleName} GB
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-zinc-900">{formatCurrency(order.price)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border
                      ${order.status === "delivered" ? "bg-green-600 text-white border-green-700 shadow-sm shadow-green-200" :
                        order.status === "failed" ? "bg-red-100 text-red-700 border-red-200" :
                          "bg-amber-100 text-amber-700 border-amber-200"}`}>
                      {order.status === "delivered" ? <CheckCircle2 size={12} /> : order.status === "failed" ? <XCircle size={12} /> : <Clock size={12} />}
                      <span className="capitalize">{order.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {order.status !== "delivered" && (
                      <button
                        onClick={() => handleMarkOrderDelivered(order._id)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white transition-all transform active:scale-95"
                      >
                        <CheckCircle2 size={14} /> Deliver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-zinc-100 p-4 space-y-4">
           {filteredOrders.map((order) => (
             <div key={order._id} className="pt-2">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex flex-col min-w-0 flex-1">
                    <CopyOrderId id={order.transaction_id} maxWidth="max-w-[120px] xs:max-w-[160px] sm:max-w-[200px]" className="mb-0.5" />
                    <span className="font-black text-zinc-900 truncate">{order.user?.name || "Guest"}</span>
                    <span className="text-xs text-zinc-500 font-mono truncate">{order.phoneNumber}</span>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase
                    ${order.network === "MTN" ? "bg-[#FFCC00] text-[#51291e]" :
                      order.network === "Telecel" ? "bg-[#E60000] text-white" : "bg-blue-600 text-white"}`}>
                    {order.network}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-4">
                   <span className="text-sm font-medium text-zinc-700">{order.bundleName} GB</span>
                   <span className="text-sm font-black text-zinc-900">{formatCurrency(order.price)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                   <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border
                    ${order.status === "delivered" ? "bg-green-600 text-white border-green-700" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                    {order.status}
                   </span>
                   {order.status !== "delivered" && (
                      <button
                        onClick={() => handleMarkOrderDelivered(order._id)}
                        className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 shadow-sm"
                      >
                        Mark as Delivered
                      </button>
                   )}
                </div>
             </div>
           ))}
        </div>
      </Card>
    </div>
  );
}
