"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import { useState, useEffect } from "react";

export default function WhatsAppWidget() {
    const pathname = usePathname();
    const [isHovered, setIsHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // slight delay before showing the widget for a smooth entrance
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    // Hide on specific administrative routes
    const hiddenRoutes = [ "/admin", "/moderator"];
    const isHiddenRoute = hiddenRoutes.some(route => pathname?.startsWith(route));

    if (isHiddenRoute || !isVisible) return null;

    return (
        <div 
            className="fixed bottom-6 right-6 z-50 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-5 duration-700"
        >
            {/* Tooltip text bubble (shows on hover for desktop) */}
            <div 
                className={`  flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl transition-all duration-300 origin-right ${
                    isHovered ? 'scale-100 opacity-100 translate-x-0' : 'scale-95 opacity-0 pointer-events-none translate-x-4'
                }`}
            >
                <div className="h-2.5 w-2.5 rounded-full bg-[#25D366] animate-pulse"></div>
                <span className=" text-[9px] md:text-sm  font-semibold text-zinc-700 whitespace-nowrap">Need help? Chat with us!</span>
            </div>

            {/* Floating Action Button */}
            <Link 
                href="https://wa.me/233509352247" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative flex md:h-[60px] md:w-[60px] h-[45px] w-[45px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-all duration-300 hover:scale-110 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-[#25D366]/50"
                aria-label="Chat with us on WhatsApp"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Ping animation ring */}
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-30"></span>
                <FaWhatsapp className="relative z-10 h-8 w-8 transition-transform duration-300 group-hover:rotate-12" />
            </Link>
        </div>
    );
}
