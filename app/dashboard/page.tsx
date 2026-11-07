import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Wallet,
  ShoppingBag,
  ArrowRight,
  Crown,
  CheckCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import BecomeAgent from "@/components/ui/becomeAgent";
import TopUpwallet from "@/components/ui/topUpwallet";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  await dbConnect();

  const [recentOrdersRaw, balanceDoc] = await Promise.all([
    Order.find({ user: session.user.id })
      .sort({ createdAt: -1 })
      .lean(),
    User.findById(session.user.id).select("walletBalance").lean(),
  ]);

  const balance: number = (balanceDoc as any)?.walletBalance ?? 0;

  const totalOrders = recentOrdersRaw.length;
  const delivered  = recentOrdersRaw.filter((o: any) => o.status === "delivered").length;
  const placed   = recentOrdersRaw.filter((o: any) => o.status === "placed").length;
  const processing = recentOrdersRaw.filter((o: any) => o.status === "processing").length;




  

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
        <Card className="overflow-hidden  h-full">
          <CardContent className="p-5 h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Wallet className="text-emerald-600" size={24} />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Wallet Balance
                </p>
                <p className="text-xl font-bold text-zinc-900 mt-0.5">
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
            <div className="mt-auto">
              <TopUpwallet />
            </div>
          </CardContent>
        </Card>

        <Link href="/dashboard/orders" className="group h-full">
          <Card className="overflow-hidden   transition-all duration-200 h-full">
            <CardContent className="p-5 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center shrink-0">
                  <ShoppingBag className="text-slate-600" size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Total Orders</p>
                  <p className="text-xl font-bold text-zinc-900 leading-tight">{totalOrders}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-auto">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
                  <CheckCircle2 size={11} />
                  {delivered} Delivered
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                  <Clock size={11} />
                  {placed} Placed 
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-500">
                  <RefreshCw size={11} />
                  {processing} Processing
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Navigation hint card */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white/60 p-5">
        <p className="text-zinc-600 text-sm">
           Buy Airtime, Data, Result Checker or register for AFA   Using  the buttons below
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link
            href="/dashboard/transactions"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E42320] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Transactions <ArrowRight size={14} />
          </Link>
          <Link
            href="/dashboard/result-checkers"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
             Buy a Result Checker - WASSCE & BECE   <ArrowRight size={14} />
             
          </Link> 
        </div>
      </div>

       <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Available Services
        </p>
        <div className="grid  grid-cols-3 md:grid-cols-4 gap-3">
          {[
            { name: "MTN", bg: "#FFCC00", text: "#1a1200", letter: "M", network: "MTN" },
            { name: "Telecel", bg: "#E60000", text: "#ffffff", letter: "T", network: "Telecel" },
            { name: "AirtelTigo", bg: "#0077C8", text: "#ffffff", letter: "A", network: "AirtelTigo" },
            {name:"AFA Registration",bg:"#109f12db",text:"#FFFFFF",letter:"A",network:"AFA"},
            {name:"Result Checker",bg:"#3905f5ff",text:"#FFFFFF",letter:"R",network:"Result Checker"},
            {name:"Create Data Shop", bg:"#5E7A76",text:"#FFFFFF",letter:"D",network:"Data Shop"}
          ].map((net) => (
            <Link
              key={net.network}
              href={`${net.network =="Result Checker" ? '/dashboard/result-checkers' : net.network =="Data Shop" ? '/dashboard/upgrade': net.network =="AFA" ? '/afa-registration': `/buy?network=${net.network}`}`}
              className="group rounded-2xl overflow-hidden border border-zinc-200/80 hover:-translate-y-1 hover:shadow-md transition-all duration-200"
            >
              <div
                className="p-4 flex flex-col items-center gap-2 text-center"
                style={{ backgroundColor: net.bg}}
              >
                <div
                  className="w-6 h-6 text-[10px] rounded-full flex items-center justify-center font-black text-lg shadow"
                  style={{ backgroundColor: "rgba(0,0,0,0.15)", color: net.text }}
                >
                  {net.letter}
                </div>
                <span className="text-sm font-bold" style={{ color: net.text }}>{net.name}</span>
       
              </div>
            </Link>
          ))}
        </div>
      </div>

    

   

       <div className="w-full flex justify-center">

     
       </div>
  
    </div>
  );
}
