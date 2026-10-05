'use client'
import { usePathname } from "next/navigation"
import { FaWhatsapp, FaPhone } from "react-icons/fa"
import Link from "next/link"
export default function ContactHeader() {
    const pathname = usePathname()

    if(pathname.startsWith('/dashboard') || pathname.startsWith('/auth') || pathname.startsWith('/admin')) {
        return null
    }
    return (
       <>

        <footer className="mt-auto w-full px-6 py-10 border-t border-zinc-200/80">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row flex-wrap justify-around gap-3">

            
            <a
              href="https://wa.me/233509352247"
              target="_blank"
              className="flex items-center justify-center gap-2 bg-[#E42320] text-white rounded-xl px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <FaWhatsapp size={18} /> Contact Admin
            </a>
            <Link
              href="/terms"
              className="flex items-center justify-center gap-2 bg-[#E42320] text-white rounded-xl px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Terms of Service
            </Link>
            
          </div>


        </footer>
  
      
   
       </>
    )
}