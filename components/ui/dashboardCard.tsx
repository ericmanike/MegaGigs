"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Wifi, Wallet, History, Plus } from "lucide-react";
import RechargeModal from "./rechargeModal";

interface WelcomeCardProps {
  name?: string;
  balance?: number;
  onBuyData?: () => void;
  onTopUp?: () => void;
  onHistory?: () => void;
}

export default function WelcomeCard({
  name = "User",
  balance = 0,
  onBuyData,
  onTopUp,
  onHistory,
}: WelcomeCardProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [greeting, setGreeting] = useState("Welcome back");
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  // Load Paystack inline script for recharge modal fallback
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleTopUpPaystack = () => {
    if (!session) {
      alert("Please login to continue");
      return;
    }

    if (!amount) {
      alert("Please enter an amount");
      return;
    }

    try {
      const reference = Date.now().toString();
      const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      if (!paystackKey) {
        throw new Error("Paystack public key not found");
      }
      if (!window.PaystackPop) {
        console.log("Paystack script not loaded");
        return;
      }

      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: session?.user?.email!,
        currency: "GHS",
        amount: Math.round((amount + amount * 0.02) * 100),
        ref: reference,
        metadata: {
          purchaseType: "top_up",
          userId: session?.user?.id,
          amount: amount,
        },
        onClose: () => {},
        callback: function () {
          (async () => {
            try {
              const verifyResponse = await fetch("/api/topupWallet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: session?.user?.email!,
                  amount,
                  reference,
                }),
              });

              if (verifyResponse.ok) {
                window.location.reload();
              }
            } catch (err) {
              console.error("Error verifying payment", err);
            }
          })();
        },
      });

      handler.openIframe();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenTopUp = () => {
    if (onTopUp) {
      onTopUp();
    } else {
      setIsRechargeOpen(true);
    }
  };

  const actions = [
    {
      label: "Buy data",
      icon: Wifi,
      onClick: onBuyData,
      href: "/buy",
    },
    {
      label: "Top up wallet",
      icon: Wallet,
      onClick: handleOpenTopUp,
    },
    {
      label: "Transactions",
      icon: History,
      onClick: onHistory,
      href: "/dashboard/transactions",
    },
  ];

  return (
    <>
      <RechargeModal
        isOpen={isRechargeOpen}
        handleTopUp={handleTopUpPaystack}
        setIsOpen={setIsRechargeOpen}
        setAmount={setAmount}
        amount={amount}
      />

      <section
        aria-label="Account summary"
        className="w-full overflow-hidden rounded-[15px] bg-slate-700 border border-slate-800 p-5 sm:p-8 text-white shadow-xl shadow-slate-950/20 relative"
      >
        <p className="text-[18px] sm:text-sm text-slate-400 font-medium">{greeting},</p>
        <h1 className="mt-0.5 text-2xl sm:text-4xl font-bold tracking-tight text-white">{name}</h1>

        {/* Wallet */}
        <div className="mt-5 sm:mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">Wallet balance</p>
            <p className="mt-1 text-2xl sm:text-4xl font-bold tabular-nums text-white">
              <span className="mr-1.5 text-lg sm:text-2xl font-semibold text-amber-400">GH₵</span>
              {balance.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenTopUp}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-slate-100 px-4 py-2 sm:px-5 sm:py-2.5 text-[16px] sm:text-sm font-semibold text-slate-900 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <Plus size={15} strokeWidth={2.5} />
            Add money
          </button>
        </div>
      </section>
    </>
  );
}
