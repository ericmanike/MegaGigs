"use client";

import Link from "next/link";
import { ArrowRight, Search, CheckCircle2, XCircle, Clock, Loader2, ArrowLeft, Phone, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

type TrackOrderResult = {
  transaction_id: string;
  bundleName: string;
  network: string;
  price: number;
  status: string;
  createdAt: string;
  phoneNumber: string;
};

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  delivered: { label: "Delivered", icon: CheckCircle2, className: "text-green-600 bg-green-50" },
  failed: { label: "Failed", icon: XCircle, className: "text-red-600 bg-red-50" },
  reversed: { label: "Reversed", icon: XCircle, className: "text-amber-600 bg-amber-50" },
  pending: { label: "Pending", icon: Clock, className: "text-amber-600 bg-amber-50" },
  processing: { label: "Processing", icon: Clock, className: "text-blue-600 bg-blue-50" },
  placed: { label: "Placed", icon: Clock, className: "text-indigo-600 bg-indigo-50" },
};

export default function TrackOrderPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<TrackOrderResult[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneNumber = phone.trim();
    if (!phoneNumber) return;

    setLoading(true);
    setOrders([]);
    setNotFound(false);
    setError("");

    try {
      const res = await fetch(`/api/track-order?phoneNumber=${encodeURIComponent(phoneNumber)}`);
      const data = await res.json();

      if (data.found && data.orders?.length) {
        setOrders(data.orders);
      } else {
        setNotFound(true);
      }
      if (data.error) setError(data.error);
    } catch {
      setError("Could not look up orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
      
      const phone = searchParams.get("ref");
      if (phone) {
        setPhone(phone);
        handleTrack({ preventDefault: () => { } } as React.FormEvent);
      } else{
        console.log("Phone number not reader")
      }
    }, [phone]);

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 to-white pt-24 md:pt-28 pb-12 px-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft size={16} /> Back to home
        </button>

        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-lg shadow-slate-200/50 overflow-hidden">
          {/* Header */}
          <div className="bg-[#E42320] px-5 py-8 text-center">
            <h1 className="font-semibold text-white text-2xl tracking-tight">Track your orders</h1>
            <p className="text-white/80 text-sm mt-1">Enter your phone number — no sign-in needed</p>
            <div className="mt-5 mx-auto max-w-[95%] bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs sm:text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-3 text-left shadow-sm">
              <Info className="shrink-0 text-white opacity-90 mt-0.5" size={18} />
              <span>If you <strong>HAVE MADE PAYMENT</strong> but don't see your order, please <a href="https://wa.me/233509352247" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-white/80 transition-colors">contact support</a>.</span>
            </div>
          </div>

          <div className="p-5 md:p-6">
            {/* Search form */}
         
            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0241234567"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E42320]/25 focus:border-[#E42320] transition-shadow"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="px-5 py-3 rounded-xl bg-[#E42320] text-white font-medium hover:bg-[#E42320]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 transition-colors"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Check status"}
              </button>
            </form>

            {/* Error */}
            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Not found */}
            {notFound && !loading && (
              <div className="mt-4 p-5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <XCircle className="text-slate-400 mx-auto mb-2" size={32} />
                <p className="text-slate-700 text-sm font-medium">No orders found</p>
                <p className="text-slate-500 text-xs mt-1">Check the phone number or contact support.</p>
              </div>
            )}

            {/* Orders list */}
            {orders.length > 0 && !loading && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {orders.length} order{orders.length > 1 ? "s" : ""} found
                </p>
                {orders.map((order) => {
                  const cfg = statusConfig[order.status] || statusConfig.pending;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={order.transaction_id}
                      className="rounded-xl border border-slate-100 overflow-hidden bg-linear-to-b from-slate-50 to-white"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2 p-4 border-b border-slate-100">
                        <span className="text-xs font-mono text-slate-500">#{order.transaction_id}</span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${cfg.className}`}>
                          <Icon size={14} /> {cfg.label}
                        </span>
                      </div>
                      <div className="p-4 space-y-1">
                        <p className="font-semibold text-slate-900">{order.network} · {order.bundleName} GB</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                          <span>{formatCurrency(order.price)}</span>
                          <span>To {order.phoneNumber}</span>
                          <span>{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <Link
                  href="/buy"
                  className="inline-flex items-center gap-1.5 mt-1 text-sm font-medium text-[#E42320] hover:underline"
                >
                  Buy more data <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}
