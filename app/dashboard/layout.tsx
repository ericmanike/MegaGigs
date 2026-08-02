"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Zap,
  History,
  Crown,
  ShoppingBag,
  Shield,
  X,
  Menu,
  Wifi,
  Users,
} from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";


const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/transactions", label: "Transactions", icon: Zap, exact: false },
  { href: "/dashboard/orders", label: "Orders History", icon: History, exact: false },
  { href: "/dashboard/upgrade", label: "Become Agent", icon: Crown, exact: false },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = session?.user?.role === "admin";
  const isAgent = session?.user?.role === "agent" || isAdmin;

  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);


  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const userName = session?.user?.name?.split(" ")[0] ?? "User";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col md:flex-row md:pt-28 pt-24 z-0 min-h-screen bg-gradient-to-b from-zinc-50/80 to-white">
    
      {/* Mobile backdrop */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close menu"
        onClick={() => setSidebarOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
        className={clsx(
          "fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 md:hidden",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 left-0 z-50 h-full w-[min(280px,85vw)] md:w-60 md:min-h-[calc(100vh-7rem)] md:top-28",
          "flex flex-col gap-1.5 overflow-y-auto",
          "px-4 py-6 bg-white border-r border-zinc-200/80",
          "transition-transform duration-300 ease-out md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Sidebar header — user greeting - hidden on desktop */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100 md:hidden">
          <div className="text-slate-600 text-2xl font-bold">
             Dashboard
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 pt-2 md:pt-0">
          {/* Overview */}
          <Link
            href="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={clsx(
              "flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap",
              isActive("/dashboard", true)
                ? "bg-[#E42320] text-white shadow-md shadow-[#E42320]/20"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
            )}
          >
            <span className={clsx(
              "flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0",
              isActive("/dashboard", true) ? "bg-white/15" : "bg-zinc-100"
            )}>
              <LayoutDashboard size={18} strokeWidth={2} />
            </span>
            Overview
          </Link>

          {/* Admin link */}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap",
                pathname?.startsWith("/admin")
                  ? "bg-[#E42320] text-white shadow-md shadow-[#E42320]/20"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
              )}
            >
              <span className={clsx(
                "flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0",
                pathname?.startsWith("/admin") ? "bg-white/15" : "bg-zinc-100"
              )}>
                <Shield size={18} strokeWidth={2} />
              </span>
              Admin
            </Link>
          )}

          {/* Quick Actions, Orders, Upgrade */}
          {navItems.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap",
                isActive(item.href, item.exact)
                  ? "bg-[#E42320] text-white shadow-md shadow-[#E42320]/20"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
              )}
            >
              <span className={clsx(
                "flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0",
                isActive(item.href, item.exact) ? "bg-white/15" : "bg-zinc-100"
              )}>
                <item.icon size={18} strokeWidth={2} />
              </span>
              {item.label}
            </Link>
          ))}



          {/* My Store (agents only) */}
          {isAgent && (
            <Link
              href="/dashboard/store"
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap",
                isActive("/dashboard/store", false)
                  ? "bg-[#E42320] text-white shadow-md shadow-[#E42320]/20"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
              )}
            >
              <span className={clsx(
                "flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0",
                isActive("/dashboard/store", false) ? "bg-white/15" : "bg-zinc-100"
              )}>
                <ShoppingBag size={18} strokeWidth={2} />
              </span>
              Manage Shop
            </Link>
          )}
          
          
          {/* Additional static links */}
          <Link
            href="/buy"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap text-left text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0 bg-zinc-100 text-[#E42320]">
              <Wifi size={18} strokeWidth={2} />
            </span>
            Buy Data
          </Link>
          
          <a
            href="https://whatsapp.com/channel/0029VbBcIbS7T8beipl8aZ1x"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap text-left text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0 bg-[#25D366]/10 text-[#25D366]">
              <Users size={18} strokeWidth={2} />
            </span>
            Join Community
          </a>        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex justify-center p-4 md:p-6 md:pl-60 lg:pl-64 w-full">
        <div className="w-full max-w-4xl space-y-8">
          {/* Top header bar — mobile only */}
          <div className="flex md:hidden flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 pl-2.5 pr-3.5 py-2 rounded-xl bg-white border border-zinc-200/80 text-zinc-700 hover:bg-zinc-50 transition-colors text-sm font-semibold shrink-0"
              aria-label="Open dashboard menu"
            >
              <Menu size={18} />
              Menu
            </button>

            {/* Greeting — right side on mobile */}
            <div className="text-center min-w-0">
              <p className="text-sm font-bold text-zinc-900 leading-tight truncate">
                {greeting} 👋
              </p>
              <p className="text-[11px] font-semibold text-zinc-900">{userName}</p>
            </div>
          </div>

          {/* Desktop header greeting */}
          <div className="hidden md:block mb-2">
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
              {greeting}, {userName}! 👋
            </h1>
            <p className="text-zinc-500 font-medium text-sm mt-1">
              Welcome back to your dashboard.
            </p>
          </div>

          {/* Page content */}
          {children}
        </div>
      </div>
    </div>
  );
}
