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
import WelcomeCard from "@/components/ui/dashboardCard";

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

  const userName = session.user.name?.split(" ")[0] ?? "User";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400">
      <WelcomeCard
        name={userName}
        balance={balance}
      />
    
     
     
     
      {/* Stat Cards */}
      <div className="grid grid-cols-1   items-stretch">
        

        <Link href="/dashboard/orders" className="group h-full">
          <Card className="overflow-hidden   transition-all duration-200 h-full">
            <CardContent className="p-5 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center shrink-0">
                  <ShoppingBag className="text-slate-600" size={20} />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-zinc-500 uppercase tracking-wide">Total Orders</p>
                  <p className="text-[14px] font-bold text-zinc-900 leading-tight">{totalOrders}</p>
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



       <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Available Services
        </p>
        <div className="grid  grid-cols-2  md:grid-cols-3 gap-3">
          {[
            { name: "MTN Data", bg: "#FFCC00", text: "#1a1200", letter: "M", network: "MTN" },
            { name: "Telecel Data", bg: "#E60000", text: "#ffffff", letter: "T", network: "Telecel" },
            { name: "AirtelTigo Data", bg: "#0077C8", text: "#ffffff", letter: "A", network: "AirtelTigo" },

            {name:"Result Checker",bg:"#3905f5ff",text:"#FFFFFF",letter:"R",network:"Result Checker"},
            {name:"Create Data Shop", bg:"#5E7A76",text:"#FFFFFF",letter:"D",network:"Data Shop"}
          ].map((net) => (
            <Link
              key={net.network}
              href={`${net.network =="Result Checker" ? '/dashboard/result-checkers' : net.network =="Data Shop" ? '/dashboard/upgrade': net.network =="AFA" ? '/afa-registration': `/buy?network=${net.network}`}`}
              className="group rounded-2xl overflow-hidden border border-zinc-200/80 hover:-translate-y-1 hover:shadow-md transition-all duration-200 "
            >
              <div
                className="p-4 flex flex-col items-center gap-2 text-center"
                style={{ backgroundColor: net.bg}}
              >
                <div
                  className="w-12 h-12 text-[10px] rounded-full flex items-center justify-center font-black text-lg shadow"
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
