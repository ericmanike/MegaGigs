"use client";

import { useState, useEffect } from "react";
import {
  Search, CheckCircle2, XCircle, Clock, ShoppingBag, Trash2, Copy, RefreshCw,
  CreditCard, Users, Shield, Megaphone
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ users: 0, orders: 0, sales: 0 });
  const [dakaziStats, setDakaziStats] = useState({ AccountBalance: { "Wallet Balance": 0 }, spendlessBalance: null as any });
  const [ordersClosed, setOrdersClosed] = useState(false);
  const [ordersClosedUpdating, setOrdersClosedUpdating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("dakazina");
  const [savingProvider, setSavingProvider] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [bundles, setBundles] = useState<any[]>([]);
  const [newOrder, setNewOrder] = useState({ network: "MTN", bundleName: "", phoneNumber: "" });

  useEffect(() => {
    const fetchEverything = async () => {
      try {
        const [ordersRes, statsRes, dakaziRes, ordersClosedRes, bundlesRes] = await Promise.all([
          fetch("/api/admin/orders"),
          fetch("/api/admin/stats"),
          fetch("/api/testingDakazi"),
          fetch("/api/admin/settings/orders-closed"),
          fetch("/api/bundles"),
        ]);

        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
        if (dakaziRes.ok) setDakaziStats(await dakaziRes.json());
        if (ordersClosedRes.ok) {
          const data = await ordersClosedRes.json();
          setOrdersClosed(Boolean(data?.ordersClosed));
          if (data?.provider) setSelectedProvider(data.provider);
        }
        if (bundlesRes.ok) {
          const data = await bundlesRes.json();
          setBundles(data.filter((b: any) => b.isActive));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEverything();
  }, []);

  const handleToggleOrdersClosed = async () => {
    const nextValue = !ordersClosed;
    setOrdersClosedUpdating(true);
    try {
      const res = await fetch("/api/admin/settings/orders-closed", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordersClosed: nextValue }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrdersClosed(Boolean(data?.ordersClosed));
      } else {
        alert("Failed to update setting");
      }
    } catch {
      alert("Error updating setting");
    } finally {
      setOrdersClosedUpdating(false);
    }
  };

  const handleProviderChange = async (provider: string) => {
    setSelectedProvider(provider);
    setSavingProvider(true);
    try {
      const res = await fetch("/api/admin/settings/orders-closed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) {
        alert("Failed to update provider");
      }
    } catch {
      alert("Error updating provider");
    } finally {
      setSavingProvider(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, id: orderId }),
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(orders.map((o) => (o._id === orderId ? updatedOrder : o)));
      } else {
        const data = await res.json().catch(() => ({}));
        alert("Error: " + (data.error || "Failed to update status"));
      }
    } catch {
      alert("Error updating status");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRetryOrder = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending" }),
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(orders.map((o) => (o._id === orderId ? updatedOrder : o)));
      } else {
        const data = await res.json().catch(() => ({}));
        alert("Retry failed: " + (data.error || "Failed to retry order"));
      }
    } catch {
      alert("Error retrying order");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
      if (res.ok) setOrders(orders.filter((o) => o._id !== orderId));
      else alert("Failed to delete order");
    } catch {
      alert("Error deleting order");
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.network || !newOrder.bundleName || !newOrder.phoneNumber) {
      alert("Please fill in all fields.");
      return;
    }
    setCreatingOrder(true);
    try {
      const res = await fetch("/api/admin/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders([data.order, ...orders]);
        setIsCreateModalOpen(false);
        setNewOrder({ network: "MTN", bundleName: "", phoneNumber: "" });
        alert("Order created successfully!");
      } else {
        const data = await res.json().catch(() => ({}));
        alert("Failed to create order: " + (data.message || "Unknown error"));
      }
    } catch {
      alert("Error creating order");
    } finally {
      setCreatingOrder(false);
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-400">
      {/* Stats Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Platform Stats</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Live overview of your platform</p>
        </div>
        <button
          type="button"
          onClick={handleToggleOrdersClosed}
          disabled={ordersClosedUpdating}
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs md:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            ${ordersClosed
              ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            }`}
          title={ordersClosed ? "Orders are closed. Click to open." : "Orders are open. Click to close."}
        >
          <ShoppingBag size={14} />
          {ordersClosed ? "Open Orders" : "Close Orders"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-zinc-200 hover:border-green-400 transition-colors bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <CreditCard size={16} />
              </div>
              <p className="text-zinc-500 text-xs font-medium">Account Balances</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-500">Dakazina</span>
                <span className="text-sm font-bold text-zinc-900">
                  {formatCurrency(dakaziStats.AccountBalance["Wallet Balance"])}
                </span>
              </div>
              <div className="border-t border-zinc-100" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-500">Spendless</span>
                <span className="text-sm font-bold text-zinc-900">
                  {dakaziStats.spendlessBalance?.data?.balance != null
                    ? dakaziStats.spendlessBalance.data.balance
                    : "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 hover:border-green-400 transition-colors bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <CreditCard size={16} />
              </div>
              <p className="text-zinc-500 text-xs font-medium">Total Sales</p>
            </div>
            <h3 className="text-xl font-bold text-zinc-900">{formatCurrency(stats.sales)}</h3>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 hover:border-purple-400 transition-colors bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <ShoppingBag size={16} />
              </div>
              <p className="text-zinc-500 text-xs font-medium">Total Orders</p>
            </div>
            <h3 className="text-xl font-bold text-zinc-900">{stats.orders}</h3>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 hover:border-slate-300 transition-colors bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <Users size={16} />
              </div>
              <p className="text-zinc-500 text-xs font-medium">Total Users</p>
            </div>
            <h3 className="text-xl font-bold text-zinc-900">{stats.users}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/admin/orders", label: "Manage Orders", icon: ShoppingBag, color: "bg-purple-600 text-white border-purple-600 hover:bg-purple-700" },
          { href: "/admin/users", label: "Manage Users", icon: Users, color: "bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100" },
          { href: "/admin/bundles", label: "Manage Bundles", icon: Shield, color: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100" },
          { href: "/admin/broadcast", label: "Broadcast", icon: Megaphone, color: "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${item.color}`}
          >
            <item.icon size={16} />
            {item.label}
          </Link>
        ))}
      </div>

      {/* API Providers */}
      <Card className="border-zinc-200 bg-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-900">API Provider</h3>
            {savingProvider && (
              <span className="text-xs text-zinc-400 animate-pulse">Saving...</span>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { value: "dakazina", label: "Dakazina" },
              { value: "spendless", label: "Spendless" },
              { value: "datamart", label: "Datamart" },
              { value: "databundleshub", label: "Data Bundles Hub" }
            ].map((provider) => (
              <label
                key={provider.value}
                className={`inline-flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-lg border text-sm font-medium transition-all select-none
                  ${selectedProvider === provider.value
                    ? "border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600"
                    : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100"}`}
              >
                <input
                  type="radio"
                  name="apiProvider"
                  value={provider.value}
                  checked={selectedProvider === provider.value}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="accent-purple-600 w-4 h-4"
                />
                {provider.label}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="pt-4">
        <h2 className="text-lg font-bold text-zinc-900">Orders</h2>
        <p className="text-sm text-zinc-500 mt-0.5">View and manage all customer orders</p>
      </div>

      <Card className="border-zinc-200 bg-white overflow-hidden">
        <div className="p-4 md:p-6 border-b border-zinc-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white">
          <div className="flex items-center gap-4">
            <h3 className="text-base font-semibold text-zinc-900">
              All Orders <span className="text-zinc-400 font-normal text-sm">({filteredOrders.length})</span>
            </h3>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              + Create Order
            </button>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search orders..."
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-900 focus:outline-none focus:border-slate-400 transition-colors w-full placeholder-zinc-400"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-zinc-500 font-medium whitespace-nowrap">
              <tr>
                <th className="px-6 py-4 border-b">Order ID</th>
                <th className="px-6 py-4 border-b">User</th>
                <th className="px-6 py-4 border-b">Bundle</th>
                <th className="px-6 py-4 border-b">Amount</th>
                <th className="px-6 py-4 border-b">Date</th>
                <th className="px-6 py-4 border-b">Status</th>
                <th className="px-6 py-4 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 whitespace-nowrap">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-zinc-500 max-w-[140px] truncate">
                        #{order.transaction_id}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(order.transaction_id).catch(() => alert("Failed to copy ID"))}
                        className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                        title="Copy transaction ID"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-900">{order.user?.name || "Unknown"}</span> 
                      <span className="text-xs text-zinc-500"><Link href={`https://wa.me/233${order.phoneNumber}`}  target="_blank" >{order.phoneNumber}</Link></span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
                      ${order.network === "MTN" ? "bg-yellow-400 text-yellow-950" :
                        order.network === "Telecel" ? "bg-red-500 text-white" : "bg-blue-600 text-white"}`}>
                      {order.network} {order.bundleName} GB
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-700">{formatCurrency(order.price)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-zinc-600">
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          weekday: "short", year: "numeric", month: "short", day: "numeric",
                        })}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                      disabled={processingId === order._id}
                      className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all shadow-sm
                        ${order.status === "delivered" ? "bg-green-600 text-white border-green-700 hover:bg-green-700" :
                          order.status === "completed" ? "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600" :
                            order.status === "failed" ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" :
                              order.status === "processing" ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700" :
                                "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"}
                        ${processingId === order._id ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <option value="pending" className="bg-white text-zinc-900">Pending</option>
                      <option value="processing" className="bg-white text-zinc-900">Processing</option>
                      <option value="delivered" className="bg-white text-zinc-900">Delivered</option>
                      <option value="completed" className="bg-white text-zinc-900">Completed</option>
                      <option value="failed" className="bg-white text-zinc-900">Failed</option>
                      <option value="placed" className="bg-white text-zinc-900">Placed</option>
                      <option value="reversed" className="bg-white text-zinc-900">Reversed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(order.status !== "delivered" && order.transaction_id?.startsWith('paid_')) && (
                        <button
                          onClick={() => handleRetryOrder(order._id)}
                          disabled={processingId === order._id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
                            ${processingId === order._id
                              ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                              : "border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white"}`}
                        >
                          {processingId === order._id ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            "Retry"
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteOrder(order._id)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete order"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    <ShoppingBag size={32} className="mx-auto mb-2 opacity-30 text-zinc-400" />
                    <p>No orders found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4 p-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-zinc-500 max-w-[160px] truncate">
                      #{order.transaction_id}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(order.transaction_id).catch(() => alert("Failed to copy"))}
                      className="p-1 rounded hover:bg-zinc-100 text-zinc-400"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                  <span className="font-semibold text-zinc-900">{order.user?.name || "Unknown"}</span>
                  <span className="text-xs text-zinc-500">{order.phoneNumber}</span>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
                  ${order.network === "MTN" ? "bg-yellow-400 text-yellow-950" :
                    order.network === "Telecel" ? "bg-red-500 text-white" : "bg-blue-600 text-white"}`}>
                  {order.network} {order.bundleName} GB
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div>
                  <p className="text-zinc-500 text-xs">Amount</p>
                  <p className="font-semibold text-zinc-900">{formatCurrency(order.price)}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Date</p>
                  <p className="text-[11px] text-zinc-700">
                    {new Date(order.createdAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <select
                  value={order.status}
                  onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                  disabled={processingId === order._id}
                  className={`w-full cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border-2 focus:outline-none transition-all
                    ${order.status === "delivered" ? "bg-green-600 text-white border-green-700 hover:bg-green-700" :
                      order.status === "completed" ? "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600" :
                        order.status === "failed" ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" :
                          order.status === "processing" ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700" :
                            "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"}
                    ${processingId === order._id ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <option value="pending" className="bg-white text-zinc-900">Pending</option>
                  <option value="processing" className="bg-white text-zinc-900">Processing</option>
                  <option value="delivered" className="bg-white text-zinc-900">Delivered</option>
                  <option value="completed" className="bg-white text-zinc-900">Completed</option>
                  <option value="failed" className="bg-white text-zinc-900">Failed</option>
                  <option value="placed" className="bg-white text-zinc-900">Placed</option>
                  <option value="reversed" className="bg-white text-zinc-900">Reversed</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-zinc-100">
                {order.status !== "delivered" && (
                   <button
                    onClick={() => order.transaction_id?.startsWith('paid_') ? handleRetryOrder(order._id) : handleUpdateStatus(order._id, 'delivered')}
                    disabled={processingId === order._id}
                    className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-all text-sm font-medium
                      ${processingId === order._id
                        ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                        : order.transaction_id?.startsWith('paid_')
                          ? "text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
                          : "text-green-600 border-green-600 hover:bg-green-600 hover:text-white"}`}
                  >
                    {processingId === order._id ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : order.transaction_id?.startsWith('paid_') ? (
                      <>
                        <RefreshCw size={16} /> 
                        Retry order
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} /> 
                        Mark delivered
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleDeleteOrder(order._id)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded-lg transition-all text-sm font-medium"
                >
                  <Trash2 size={16} /> Delete order
                </button>
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
            <div className="py-12 text-center text-zinc-500">
              <ShoppingBag size={32} className="mx-auto mb-2 opacity-30 text-zinc-400" />
              <p>No orders found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-zinc-900">Create Order</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-500 hover:text-zinc-900">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Network</label>
                <select
                  value={newOrder.network}
                  onChange={(e) => {
                    setNewOrder({ ...newOrder, network: e.target.value, bundleName: "" });
                  }}
                  className="w-full border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="MTN">MTN</option>
                  <option value="Telecel">Telecel</option>
                  <option value="AT">AT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Bundle</label>
                <select
                  value={newOrder.bundleName}
                  onChange={(e) => setNewOrder({ ...newOrder, bundleName: e.target.value })}
                  className="w-full border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Select Bundle</option>
                  {bundles
                    .filter((b) => b.network === newOrder.network)
                    .map((bundle) => (
                      <option key={bundle._id} value={bundle.name.replace("GB", "")}>
                        {bundle.name} - {formatCurrency(bundle.price)}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Beneficiary Phone Number</label>
                <input
                  type="tel"
                  value={newOrder.phoneNumber}
                  onChange={(e) => setNewOrder({ ...newOrder, phoneNumber: e.target.value })}
                  className="w-full border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 024XXXXXXX"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={creatingOrder}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {creatingOrder ? "Processing..." : "Create Order"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
