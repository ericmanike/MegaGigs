"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Zap,
  History,
  Crown,
  ShoppingBag,
  Shield,
  Wifi,
  Users,
  User,
  LogOut,
  LogIn,
  X,
  HouseWifi,
} from "lucide-react";
import clsx from "clsx";
import { useSession, signOut } from "next-auth/react";

type Props = {
  open: boolean;
  onClose: () => void;
};

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/transactions", label: "Transactions", icon: Zap, exact: false },
  { href: "/dashboard/orders", label: "Orders History", icon: History, exact: false },
  { href: "/dashboard/upgrade", label: "Become Agent", icon: Crown, exact: false },
];

export default function MobileNavSidebar({ open, onClose }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === "admin";
  const isAgent = session?.user?.role === "agent" || isAdmin;

  const isActive = (href: string, exact: boolean = false) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close menu"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className={clsx(
          "fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 left-0 z-50 h-full w-[min(280px,85vw)] bg-white shadow-xl",
          "flex flex-col overflow-y-auto",
          "transition-transform duration-300 ease-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700 text-white">
              <HouseWifi size={18} strokeWidth={2.5} />
            </div>
            <span className="font-logo font-bold text-slate-800 text-base">MEGA GIGS</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex flex-col gap-1.5 p-3 overflow-y-auto">
          {/* Home */}
          <Link
            href="/"
            onClick={onClose}
            className={clsx(
              "flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap",
              isActive("/", true)
                ? "bg-[#E42320] text-white shadow-md shadow-[#E42320]/20"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
            )}
          >
            <span
              className={clsx(
                "flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0",
                isActive("/", true) ? "bg-white/15" : "bg-zinc-100"
              )}
            >
              <Home size={18} strokeWidth={2} />
            </span>
            Home
          </Link>

          {/* Buy Data */}
          <Link
            href="/buy"
            onClick={onClose}
            className={clsx(
              "flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap text-left",
              isActive("/buy", false)
                ? "bg-[#E42320] text-white shadow-md shadow-[#E42320]/20"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
            )}
          >
            <span
              className={clsx(
                "flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0",
                isActive("/buy", false) ? "bg-white/15" : "bg-zinc-100 text-[#E42320]"
              )}
            >
              <Wifi size={18} strokeWidth={2} />
            </span>
            Buy Data
          </Link>

          {/* Dashboard links (when logged in) */}
          {session && (
            <>
              <div className="pt-2 pb-1 px-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Dashboard
                </span>
              </div>

              {/* Overview */}
              <Link
                href="/dashboard"
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap",
                  isActive("/dashboard", true)
                    ? "bg-[#E42320] text-white shadow-md shadow-[#E42320]/20"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
                )}
              >
                <span
                  className={clsx(
                    "flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0",
                    isActive("/dashboard", true) ? "bg-white/15" : "bg-zinc-100"
                  )}
                >
                  <LayoutDashboard size={18} strokeWidth={2} />
                </span>
                Overview
              </Link>

              {/* Admin link */}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap",
                    pathname?.startsWith("/admin")
                      ? "bg-[#E42320] text-white shadow-md shadow-[#E42320]/20"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
                  )}
                >
                  <span
                    className={clsx(
                      "flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0",
                      pathname?.startsWith("/admin") ? "bg-white/15" : "bg-zinc-100"
                    )}
                  >
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
                  onClick={onClose}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap",
                    isActive(item.href, item.exact)
                      ? "bg-[#E42320] text-white shadow-md shadow-[#E42320]/20"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
                  )}
                >
                  <span
                    className={clsx(
                      "flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0",
                      isActive(item.href, item.exact) ? "bg-white/15" : "bg-zinc-100"
                    )}
                  >
                    <item.icon size={18} strokeWidth={2} />
                  </span>
                  {item.label}
                </Link>
              ))}

              {/* My Store (agents only) */}
              {isAgent && (
                <Link
                  href="/dashboard/store"
                  onClick={onClose}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap",
                    isActive("/dashboard/store", false)
                      ? "bg-[#E42320] text-white shadow-md shadow-[#E42320]/20"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
                  )}
                >
                  <span
                    className={clsx(
                      "flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0",
                      isActive("/dashboard/store", false) ? "bg-white/15" : "bg-zinc-100"
                    )}
                  >
                    <ShoppingBag size={18} strokeWidth={2} />
                  </span>
                  Manage Shop
                </Link>
              )}
            </>
          )}

          {/* Join Community */}
          <a
            href="https://whatsapp.com/channel/0029VbBcIbS7T8beipl8aZ1x"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap text-left text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0 bg-[#25D366]/10 text-[#25D366]">
              <Users size={18} strokeWidth={2} />
            </span>
            Join Community
          </a>

          {/* Account Section */}
          <div className="pt-2 pb-1 px-3 border-t border-zinc-100 mt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Account
            </span>
          </div>

          {session ? (
            <>
              <Link
                href="/profile"
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap",
                  isActive("/profile", true)
                    ? "bg-[#E42320] text-white shadow-md shadow-[#E42320]/20"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
                )}
              >
                <span
                  className={clsx(
                    "flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0",
                    isActive("/profile", true) ? "bg-white/15" : "bg-zinc-100"
                  )}
                >
                  <User size={18} strokeWidth={2} />
                </span>
                Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  signOut();
                }}
                className="flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap text-left text-red-600 hover:bg-red-50 active:scale-[0.98]"
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0 bg-red-50 text-red-600">
                  <LogOut size={18} strokeWidth={2} />
                </span>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0 bg-zinc-100">
                  <LogIn size={18} strokeWidth={2} />
                </span>
                Login
              </Link>
              <Link
                href="/auth/register"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap bg-[#E42320] text-white shadow-md shadow-[#E42320]/20"
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0 bg-white/15">
                  <User size={18} strokeWidth={2} />
                </span>
                Create Account
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
