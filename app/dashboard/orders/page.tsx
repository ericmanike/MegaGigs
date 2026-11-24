import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Order from "@/models/Order";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import {
  CreditCard,
  Wifi,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import clsx from "clsx";
import { CopyOrderId } from "@/components/ui/CopyOrderId";

export const metadata = {
  title: "Orders History | MegaGigs Dashboard",
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  await dbConnect();

  const recentOrdersRaw = await Order.find({ user: session.user.id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const recentOrders = recentOrdersRaw.map((o: any) => ({
    _id: String(o._id),
    transaction_id: o.transaction_id,
    bundleName: o.bundleName,
    network: o.network,
    price: o.price,
    status: o.status,
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
  }));

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Orders History</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Your recent data purchases</p>
        </div>
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          View all <ChevronRight size={16} />
        </Link>
      </div>

      <Card className="overflow-hidden border-zinc-200/80">
        <CardContent className="p-0 divide-y divide-zinc-100">
          {recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                <CreditCard size={24} className="text-zinc-400" />
              </div>
              <p className="text-zinc-600 font-medium">No recent orders</p>
              <p className="text-sm text-zinc-500 mt-1">Your orders will appear here</p>
              <Link
                href="/buy"
                className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Buy data <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            recentOrders.map((order) => (
              <div
                key={order._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={clsx(
                      "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                      order.network === "MTN" && "bg-amber-400 text-amber-950",
                      order.network === "Telecel" && "bg-red-500 text-white",
                      order.network !== "MTN" && order.network !== "Telecel" && "bg-blue-600 text-white"
                    )}
                  >
                    <Wifi size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-900 truncate">
                      {order.network} {order.bundleName} GB
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-zinc-500 shrink-0">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-zinc-400 shrink-0">•</span>
                      <CopyOrderId id={order.transaction_id} maxWidth="max-w-[110px] sm:max-w-[200px]" />
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-start sm:items-end gap-1 sm:gap-1.5">
                  <p className="font-bold text-zinc-900">{formatCurrency(order.price)}</p>
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                      order.status === "delivered" && "bg-green-500 text-white",
                      order.status === "pending"   && "bg-amber-100 text-amber-700 border border-amber-200",
                      order.status === "placed"    && "bg-amber-100 text-amber-700 border border-amber-200",
                      order.status === "processing" && "bg-zinc-100 text-zinc-500 border border-zinc-200",
                      order.status === "failed"    && "bg-red-50 text-red-700 border border-red-200",
                      order.status === "reversed"  && "bg-red-50 text-red-700 border border-red-200"
                    )}
                  >
                    {order.status === "delivered" && <CheckCircle2 size={12} className="shrink-0 text-green-200" />}
                    {order.status === "pending" && <Clock size={12} className="shrink-0" />}
                    {order.status === "placed" && <Clock size={12} className="shrink-0" />}
                    {order.status === "processing" && <Clock size={12} className="shrink-0" />}
                    {order.status === "failed" && <XCircle size={12} className="shrink-0" />}
                    {order.status === "reversed" && <XCircle size={12} className="shrink-0" />}
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
