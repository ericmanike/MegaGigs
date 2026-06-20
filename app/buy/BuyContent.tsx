"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Loader2, Wifi } from "lucide-react";
import clsx from "clsx";
import { formatCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react"
import Link from "next/link";




declare global {
    interface Window {
        PaystackPop: {
            setup: (options: {
                key: string
                email: string
                currency: string
                amount: number
                metadata?: PaystackMetadata,
                ref: string
                onClose: () => void
                // callback: (response: { reference: string }) => void
            }) => {
                openIframe: () => void
            }
        }
    }
}
const NETWORKS = [
    { id: "MTN", name: "MTN", color: "bg-[#FFCC00]", textColor: "text-[#51291e]" },
    { id: "Telecel", name: "Telecel", color: "bg-[#E60000]", textColor: "text-white" },
    { id: "AirtelTigo", name: "AirtelTigo", color: "bg-blue-600", textColor: "text-white" },
];

interface PaystackMetadata {
    phoneNumber: string;
    network: string;
    bundleId: string;
    bundleName: string;
    provider: string;
    price: number;
    paymentType: 'standard' | 'agent_store' | 'top_up';
    userId: string;
    agentId: string | null;

}




export default function BuyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialNetwork = searchParams.get("network");

 

    const [step, setStep] = useState(1);
    const [selectedNetwork, setSelectedNetwork] = useState(initialNetwork || "MTN");
    const [selectedBundle, setSelectedBundle] = useState<any>(null);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [bundles, setBundles] = useState<any[]>([]);
    const [loadingBundles, setLoadingBundles] = useState(false);
    const [activeCategory, setActiveCategory] = useState<'all' | 'promo'>('all');
    const [hasAutoSwitched, setHasAutoSwitched] = useState(false);
    const { data: session } = useSession()
    const [message, setMessage] = useState("")
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const networkConfig = NETWORKS.find(n => n.id === selectedNetwork);

    useEffect(() => {
        if (session?.user?.id) {
            fetch('/api/wallet/balance')
                .then(res => res.json())
                .then(data => {
                    if (data.balance !== undefined) {
                        setWalletBalance(data.balance);
                    }
                })
                .catch(err => console.error("Failed to fetch wallet balance:", err));
        }
    }, [session]);

    const loadPaystackScript = () => {
        const script = document.createElement('script')
        script.src = 'https://js.paystack.co/v1/inline.js'
        script.async = true
        document.body.appendChild(script)
    }

    // Fetch bundles when network is selected
    useEffect(() => {
        if (selectedNetwork) {
            fetchBundles();
            loadPaystackScript();
        }
    }, [selectedNetwork, session, activeCategory]);

    // Auto-fill phone number from profile
    useEffect(() => {
        const fetchUserPhone = async () => {
            if (session?.user.email && !phoneNumber) {
                try {
                    const res = await fetch('/api/profile/phone');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.phone && data.phone.trim()) {
                            setPhoneNumber(data.phone.trim());
                        } 
                    }
                } catch (error) {
                    console.error('Error fetching phone:', error);
                }
            }
        };
        fetchUserPhone();
    }, [session]);

    const fetchBundles = async () => {
        setLoadingBundles(true);
        try {
            const res = await fetch('/api/bundles');
            if (res.ok) {
                const data = await res.json();
                const userRole = session?.user?.role || 'user'; // Default to user for visibility

                // Filter bundles by selected network, active status, and audience
                const isBundleVisible = (b: any) => {
                    if (!b.isActive) return false;
                    if (activeCategory === 'promo' && b.audience !== 'promo') return false;
                    if (b.audience === 'agent') return userRole === 'agent' || userRole === 'admin';
                    if (b.audience === 'promo' && !session) return false;
                    return true;
                };

                const filtered = data.filter((b: any) => b.network === selectedNetwork && isBundleVisible(b));

                if (filtered.length === 0 && selectedNetwork === "MTN" && !initialNetwork && !hasAutoSwitched) {
                    setHasAutoSwitched(true);
                    const telecelBundles = data.filter((b: any) => b.network === "Telecel" && isBundleVisible(b));
                    if (telecelBundles.length > 0) {
                        setSelectedNetwork("Telecel");
                        return;
                    } else {
                        const airtelTigoBundles = data.filter((b: any) => b.network === "AirtelTigo" && isBundleVisible(b));
                        if (airtelTigoBundles.length > 0) {
                            setSelectedNetwork("AirtelTigo");
                            return;
                        }
                    }
                }

                setBundles(filtered);
            }
        } catch (error) {
            console.error('Failed to fetch bundles:', error);
        } finally {
            setLoadingBundles(false);
        }
    };

    const handlePurchase = async () => {

        if (phoneNumber.length < 10 ) {
            alert("Valid Phone number is required")
            setLoading(false);
            return  
        }

        setLoading(true);
        try {

            const reference = Date.now().toString()

            const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
            if (!paystackKey) {
                console.log('   Paystack public key not found', paystackKey)
                throw new Error('Paystack public key not found');

            }
            if (!window.PaystackPop) {
                console.log('Paystack script not loaded');
                return;
            }


            const price = selectedBundle.price
            const tax = 0.02 * price
            let total = price + tax

            const handler = window.PaystackPop.setup({
                key: paystackKey!,
                email: `${phoneNumber}@megagigs.net`,
                currency: 'GHS',
                amount: Math.round(total * 100), // Convert to kobo
                metadata : ({
                    phoneNumber,
                    network: selectedNetwork,
                    bundleId: selectedBundle._id,
                    bundleName: selectedBundle.name,
                    provider: selectedBundle.provider,
                    price: price,
                    paymentType: 'standard',
                    agentId: 'default-none',
                    userId: session?.user?.id as string
                 
                }),
                ref: reference,
                onClose: () => {
                   
                },
            //   callback: function (response) {
            //         (async () => {
            //             try {
            //                 const verifyResponse = await fetch('/api/orders', {
            //                     method: 'POST',
            //                     headers: { 'Content-Type': 'application/json' },
            //                     body: JSON.stringify({
            //                         network: selectedNetwork,
            //                         bundleName: selectedBundle.name.slice(0, -2),
            //                         price: selectedBundle.price,
            //                         phoneNumber,
            //                         reference,
            //                     }),
            //                 });

            //                 if (verifyResponse.ok) {
            //                     console.log('Payment verified');
                               
            //                         if (session) {
            //                             router.push('/dashboard');
            //                         } else {
            //                             router.push(`/track-order?phone=${phoneNumber}`);
            //                         }
                                
            //                     setMessage("Payment successful");
            //                 } else {
            //                     console.log('Payment verification failed');
                                
            //                 } 
            //             } catch (err: any) {
            //                 console.error('Error verifying payment', err);
            //                 setMessage(err.message);
            //                 alert("Something went wrong with the purchase. Please try again.");
            //             } 
            //         })();
            //     },

            })



            handler.openIframe()
        } catch (error) {

            console.log(error)
            console.error(error);
            alert("Something went wrong with the purchase.");
        } finally {
            setLoading(false);
        }
    };

    const handleWalletPurchase = async () => {
        if (phoneNumber.length < 10) {
            alert("Valid Phone number is required")
            return
        }

        setLoading(true);
        try {
            const response = await fetch('/api/walletPurchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    network: selectedNetwork,
                    bundleName: selectedBundle.name.slice(0, -2),
                    price: selectedBundle.price,
                    phoneNumber,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage("Purchase successful! Redirecting...");
                ;

            } else {
                alert(data.message || "Wallet purchase failed");
                setMessage(data.message || "Purchase failed");
            }
        } catch (error: any) {
            console.error('Wallet purchase error:', error);
            alert("Something went wrong with the wallet purchase.");
            setMessage(error.message);
        } finally {

            setLoading(false);

                if (session) {
                    router.push('/dashboard');
                } else {
                    router.push('/');
                }
        }
    };

    return (
        <div className="p-4 w-full md:w-[80%] mx-auto min-h-screen md:pt-35 pt-24 z-0">
            <h1 className="text-2xl font-bold mb-4"> Stay Connected 24/7</h1>

            {/* BUNDLE SELECTION VIEW */}
            {step !== 3 && (
                <div className="space-y-4">
                    {/* Network Filter Tabs */}
                    <div className="flex gap-2">
                        {NETWORKS.map((net) => (
                            <button
                                key={net.id}
                                onClick={() => setSelectedNetwork(net.id)}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border-2",
                                    selectedNetwork === net.id
                                        ? `${net.color} ${net.textColor} border-slate-700`
                                        : "bg-white text-zinc-600 border-slate-300 hover:border-slate-500"
                                )}
                            >
                                <span className={clsx(
                                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black",
                                    selectedNetwork === net.id ? "bg-black/15" : net.color + " " + net.textColor
                                )}>
                                    {net.name[0]}
                                </span>
                                {net.name}
                            </button>
                        ))}
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={clsx(
                                "flex-1 py-2 rounded-xl text-xs font-bold transition-all border-2",
                                activeCategory === 'all'
                                    ? "bg-zinc-900 text-white border-zinc-900 shadow-md"
                                    : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
                            )}
                        >
                            All Bundles
                        </button>
                        <button
                            onClick={() => setActiveCategory('promo')}
                            className={clsx(
                                "flex-1 py-2 rounded-xl text-xs font-bold transition-all border-2 flex items-center justify-center gap-1.5",
                                activeCategory === 'promo'
                                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                                    : "bg-white text-blue-600 border-blue-100 hover:border-blue-200"
                            )}
                        >
                            {activeCategory === 'promo' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            )}
                            Promo Offers
                        </button>
                    </div>

                    {/* Bundle Cards */}
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Select Bundle</p>

                    {loadingBundles ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-3">
                            <Loader2 className="animate-spin text-slate-600" size={36} />
                            <p className="text-sm font-medium text-zinc-400 animate-pulse">Fetching best deals...</p>
                        </div>
                    )  : activeCategory=== 'promo' && !session?.user.role ? (
                        <div className="text-center py-12">
                            <p className="text-slate-700 text-2xl my-2 font-bold"> Promo offers currently  available for customers with accounts </p>
                                 <p className="my-3"> Sign Up  to get access to promo data  bundles! <br /> Enjoy <span className=" text-red-500 font-bold my-3"> Over 10% discount</span></p>
                           
                           <Link href="/auth/login">
                            <button className="bg-red-600 my-4 text-white px-8 py-2  font-bold rounded-xl">Sign In</button>
                           </Link>
                        </div>
                     )
                    
                    
                    
                    : bundles.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-zinc-500">No bundles available for {selectedNetwork} (Out of Stock)</p>
                        </div>
                    ):  
                       (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                            {bundles.map((bundle: any) => (
                                <button
                                    key={bundle._id}
                                    onClick={() => {
                                        setSelectedBundle(bundle);
                                        setStep(3);
                                    }}
                                    className={clsx(
                                        "flex flex-col items-center justify-between p-4 py-8 rounded-2xl transition-all text-center min-h-[180px] relative overflow-hidden",
                                        "hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:shadow-sm border-2 border-transparent",
                                        networkConfig ? `${networkConfig.color} ${networkConfig.textColor}` : "bg-white text-zinc-900"
                                    )}
                                >
                                    {/* Network Badge */}
                                    <div className="absolute top-0 left-0">
                                        <div className="bg-white text-black backdrop-blur-md text-[12px] font-black px-3 py-1.5 rounded-br-2xl uppercase tracking-widest border-r border-b border-white/10">
                                            {bundle.network}
                                        </div>
                                    </div>

                                    {bundle.audience === 'promo' && (
                                        <div className="absolute top-0 right-0">
                                            <div className="bg-zinc-950 text-white text-[10px] font-black px-4 py-2 rounded-bl-2xl shadow-xl uppercase tracking-[0.15em] border-l border-b border-white/10 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                Promo
                                            </div>
                                        </div>
                                    )}

                                      
                      
                   
           

                                    {/* Wifi icon */}
                                    <div className={clsx(
                                        "w-12 h-12 rounded-full flex items-center justify-center mb-4 shadow-xl border-2 border-white/30",
                                        networkConfig ? "bg-black/10" : "bg-zinc-100"
                                    )}>
                                        <Wifi size={22} strokeWidth={2.5} />
                                    </div>

                                    {/* Bundle name */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h5 className=" font-black tracking-tight leading-none mb-2">{bundle.name} - {formatCurrency(bundle.price)}</h5>
                                        <div className="flex flex-col gap-1.5 mb-4">
                                            <p className="text-[7px] font-black uppercase tracking-[0.2em] opacity-80">Data Bundle</p>
                                            <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full self-center border border-white/10">
                                                <div className="w-1 h-1 rounded-full bg-current" />
                                                <p className="text-[10px] font-black uppercase tracking-tighter">Non Expire </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price badge */}
                                    <div className={clsx(
                                        "w-full py-2.5 px-2 rounded-2xl font-black text-base shadow-inner",
                                        networkConfig ? "bg-white text-black" : "bg-zinc-900 text-white"
                                    )}>
                                       Buy Now
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* CHECKOUT VIEW */}
            {step === 3 && (
                <div className="space-y-6 w-[100%] md:w-[80%] mx-auto">
                    <div className="flex items-center gap-2 mb-4">
                        <button onClick={() => setStep(1)} className="text-sm text-zinc-500 hover:text-zinc-900">
                            ← Back
                        </button>
                        <span className="text-zinc-300">/</span>
                        <span className="text-sm font-semibold">{selectedNetwork}</span>
                        <span className="text-zinc-300">/</span>
                        <span className="text-sm font-semibold">{selectedBundle?.name}</span>
                    </div>

                    <Card>
                        <CardContent className="p-6">

                            <div className="text-red-900  bg-red-100 p-2 rounded-xl text-center text-sm mb-6 font-bold shadow-lg"> 
                                <strong className="text-red-900 font-extrabold">Notice! </strong> After momo approval, click on I've completed payment  
                                   to verify your payment.
                         
                            
                            </div>
                            <div className="mb-3">
                                <label className="text-sm font-medium text-black mb-2 block">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-900 bg-white text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 text-lg tracking-wide"
                                    placeholder="024 XXX XXXX"
                                    autoFocus
                                />
                              
                            </div>

                            <div className={clsx(
                                "p-4 rounded-xl space-y-2 mb-6 border",
                                networkConfig ? `${networkConfig.color} ${networkConfig.textColor} border-transparent` : "bg-slate-600 text-white border-slate-500"
                            )}>
                                <div className="flex justify-between text-sm">
                                    <span className="opacity-80">Network</span>
                                    <span className="font-bold">{selectedNetwork}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="opacity-80">Package</span>
                                    <span className="font-bold">{selectedBundle?.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="opacity-80">Price</span>
                                    <span className="font-bold ">{formatCurrency(selectedBundle?.price)}</span>
                                </div>

                                {/* <div className="border-t border-black/10 my-2 pt-2 flex justify-between items-center">
                                    <span className="opacity-80 "> Paystack charges (2%)</span>
                                    <span className=" font-black text-sm md:text-xl">{formatCurrency(0.02 * selectedBundle?.price)}</span>
                                </div> */}

                                <div className="border-t border-black/10 my-2 pt-2 flex justify-between items-center">
                                    <span className="opacity-80">Total Price</span>
                                    <span className="text-sm md:text-xl font-black">{formatCurrency(selectedBundle?.price /*+ 0.02 * selectedBundle?.price*/)}</span>
                                </div>
                            </div>

                            {message && <p className="text-center text-green-600 font-semibold">{message}</p>}

                            <div className={`md:gap-2 ${session?.user.email ? 'md:gap-2 grid grid-cols-1'  : 'grid-cols-1'}` }>
                                <button
                                    onClick={handlePurchase}
                                    disabled={loading || (phoneNumber.length < 10 || phoneNumber.length > 10)}
                                    className="w-full py-2 text-white hover:bg-slate-700 bg-slate-600 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={10} /> : "Pay with MoMo - Paystack"}
                                </button>

                             {session?.user.email && (
                                <div className="flex flex-col w-full mt-4 md:mt-2">
                                    <button
                                        onClick={handleWalletPurchase}
                                        disabled={loading || (phoneNumber.length !== 10) || (walletBalance !== null && walletBalance < selectedBundle?.price)}
                                        className="w-full py-2 text-white hover:bg-green-700 bg-green-600 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={10} /> : `Buy with Wallet ${walletBalance !== null ? `(${formatCurrency(walletBalance)})` : ''}`}
                                    </button>
                                    {walletBalance !== null && selectedBundle && walletBalance < selectedBundle.price && (
                                        <Link href="/dashboard" className="text-red-500 text-xs text-center font-bold mt-2 hover:underline flex items-center justify-center gap-1">
                                            Insufficient balance. Top up your wallet here.
                                        </Link>
                                    )}
                                </div>
                             )}

                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

        </div>
    );
}

