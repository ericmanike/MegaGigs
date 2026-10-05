"use client"
import { useRouter } from "next/navigation"
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { X, Wallet, CreditCard, Send, ChevronRight, Copy } from 'lucide-react'
import { useSession } from "next-auth/react"
import clsx from "clsx"

type Props = {
  isOpen: boolean
  amount: number | null
  setAmount: (amount: number | null) => void
  setIsOpen: (isOpen: boolean) => void
  handleTopUp: () => void
}

export default function RechargeModal({ isOpen, setAmount, amount, setIsOpen, handleTopUp }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user
  
  const [activeTab, setActiveTab] = useState<'paystack' | 'manual'>('paystack')

  if (!isOpen) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-[22rem] sm:max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">
              <Wallet size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Top Up Wallet</h2>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">Add funds to your account</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="w-7 h-7 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
            
          {/* Method Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
                className={clsx(
                    "flex-1 py-1.5 text-[13px] font-semibold rounded-lg transition-all",
                    activeTab === 'paystack' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
                onClick={() => setActiveTab('paystack')}
            >
                Auto (Paystack)
            </button>
            <button
                className={clsx(
                    "flex-1 py-1.5 text-[13px] font-semibold rounded-lg transition-all",
                    activeTab === 'manual' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
                onClick={() => setActiveTab('manual')}
            >
                Manual (MoMo)
            </button>
          </div>

          {activeTab === 'paystack' ? (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2.5">
                    <div className="text-blue-600 mt-0.5"><CreditCard size={16} /></div>
                    <div className="text-[12px] text-blue-900 leading-relaxed">
                        Instant top-up via Paystack. Funds reflect immediately.
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[12px] font-semibold text-slate-700 ml-1">Amount to Top Up (GH₵)</label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">₵</span>
                        <input
                            type="number"
                            placeholder="0.00"
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300"
                            onChange={(e) => {
                                const value = e.target.value
                                setAmount(value ? Number(value) : null)
                            }}
                            value={amount ?? ""}
                            min={10}
                        />
                    </div>
                </div>

                {amount && amount >= 10 ? (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Top up amount</span>
                            <span className="font-semibold text-slate-700">{formatCurrency(amount)}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Transaction fee (2%)</span>
                            <span className="font-semibold text-slate-700">{formatCurrency(amount * 0.02)}</span>
                        </div>
                        <div className="pt-2 mt-1.5 border-t border-slate-200 flex justify-between">
                            <span className="font-semibold text-slate-900 text-[13px]">Total to pay</span>
                            <span className="font-bold text-blue-600 text-[15px]">{formatCurrency(amount + (amount * 0.02))}</span>
                        </div>
                    </div>
                ) : amount && amount < 10 ? (
                    <p className="text-red-500 text-[11px] font-medium ml-1 flex items-center gap-1">
                        Minimum top-up amount is GH₵ 10.00
                    </p>
                ) : null}

                <button
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-[13px] font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleTopUp}
                    disabled={!amount || amount < 10}
                >
                    Proceed to Payment <ChevronRight size={16} />
                </button>
            </div>
          ) : (
             <div className="space-y-4 animate-in slide-in-from-left-4 fade-in duration-300">
                 <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2.5">
                    <div className="text-amber-600 mt-0.5"><Send size={16} /></div>
                    <div className="text-[12px] text-amber-900 leading-relaxed">
                        Send MoMo to the number below. <span className="font-bold text-red-600">MUST</span> use your email as the reference!
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-3 space-y-3">
                        <div>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Send Mobile Money To</p>
                            <div className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-lg">
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">054 344 2518</p>
                                    <p className="text-[10px] text-slate-500 font-medium">Eric Manike Haare</p>
                                </div>
                                <button onClick={() => copyToClipboard('0543442518')} className="p-1.5 bg-slate-50 text-slate-600 rounded-md hover:bg-slate-100 transition-colors" title="Copy Number">
                                    <Copy size={14} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Required Reference</p>
                            <div className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-lg border-l-4 border-l-blue-500">
                                <div className="truncate pr-2">
                                    <p className="font-bold text-slate-900 text-xs truncate">{user?.email}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Enter exactly as transfer reference</p>
                                </div>
                                <button onClick={() => copyToClipboard(user?.email || '')} className="p-1.5 bg-slate-50 text-slate-600 rounded-md hover:bg-slate-100 transition-colors shrink-0" title="Copy Reference">
                                    <Copy size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <p className="text-[10px] text-center text-slate-500 font-medium px-2">
                    After sending, your wallet will be credited once verified.
                </p>

                <button
                    className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-bold hover:bg-slate-200 transition-all active:scale-[0.98]"
                    onClick={() => setIsOpen(false)}
                >
                    I have made payment
                </button>
             </div>
          )}

        </div>
      </div>
    </div>
  )
}