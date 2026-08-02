"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        try {
            await signIn("google", { callbackUrl: "/dashboard" });
        } catch (err) {
            console.error("Google sign in error", err);
            setGoogleLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };
 
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Something went wrong");
            }
    const email = formData?.email
    const password = formData?.password
    const phone = formData?.phone
    if(!email || !password || !phone){
        alert('something went wrong missing email and paddword')
        return
    }
    if(phone.length !== 10){
        alert('phone number must be 10 digits')
        return
    } 

   const Loginres =  await signIn("credentials",{
          email,
          password,
          redirect:false,
             }
             )
            if (Loginres?.error) {
                setError(Loginres.error);
            } else {
                router.push("/dashboard");
                router.refresh();
            }

         console.log(Loginres)

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen overflow-y-auto  px-4" >
            <Card className="w-full max-w-md ">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-slate-900">Create An Account</CardTitle>
                    
                </CardHeader>
                <CardContent>
                    <button
                        type="button"
                        disabled={googleLoading || loading}
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {googleLoading ? (
                            <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                        )}
                        {googleLoading ? "Please wait..." : "Continue with Google"}
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-500">Or </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100 w-full text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900">Full Name</label>
                            <input
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 text-black rounded-lg border border-slate-300 bg-white/10 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                                placeholder="Your Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900">Email</label>
                            <input
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 text-black rounded-lg border border-slate-300 bg-white/10 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                                placeholder="your email @gmail.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900">Phone Number</label>
                            <input
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 text-black rounded-lg border border-slate-300 bg-white/10 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                                placeholder="024XXXXXXX"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900">Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 text-black rounded-lg border border-slate-300 bg-white/10 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all pr-10"
                                    placeholder="Create a password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || googleLoading}
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : "Create Account"}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-sm text-slate-500">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="text-slate-800 hover:underline font-bold">
                            Sign In
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div >
    );
}
