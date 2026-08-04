import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import WhatsAppWidget from "@/components/layout/WhatsAppWidget";
import ContactDeveloper from "@/components/ui/ContactDeveloper";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["600", "700"],
});

//https://documenter.getpostman.com/view/9357868/2sB3BBqrsR  api docs

export const metadata: Metadata = {
  metadataBase: new URL('https://megagigs.net'),
  alternates: {
    canonical: '/',
  },
  title: "MegaGigs - Buy Data Bundles at lower prices",
  description: "Cheapest and trusted data bundle reseller in Ghana. Buy data bundles at lower prices for all  your studies and research (MTN, Telecel, AirtelTigo). Simple checkout, instant delivery with no hidden charges.",
  keywords: ["data bundles", "Ghana data", "MTN data", "Telecel data", "AirtelTigo data", "buy data online", "instant data delivery", "MegaGigs"],
  authors: [{ name: "MegaGigs Team" }],
  creator: "MegaGigs",
  publisher: "MegaGigs",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE",
  },
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://megagigs.net",
    title: "MegaGigs - Buy Data Bundles Instantly",
    description: "Cheapest data bundles for all in Ghana. Instant delivery.",
    siteName: "MegaGigs",
    images: [
      {
        url: "https://megagigs.net/og_image.png",
        width: 683,
        height: 1024,
        alt: "MegaGigs - Data Bundles for MTN, Telecel & AirtelTigo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MegaGigs - Buy Data Bundles Instantly",
    description: "Cheapest data bundles for your research and studies. Instant delivery.",
    creator: "@megagigs",
    images: ["https://megagigs.net/og_image.png"],
  },
  category: "technology",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased bg-zinc-50 text-zinc-900`}
        suppressHydrationWarning
      >
        <AuthProvider>
          
          <Navbar />
          <main className="min-h-screen z-0">
            {children} 
            <ContactDeveloper />
          </main>  
          <WhatsAppWidget /> 
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "MegaGigs",
                "url": "https://megagigs.net",
                "logo": "https://megagigs.net/logo.png",
                "sameAs": [
                  "https://twitter.com/megagigs",
                  "https://whatsapp.com/channel/..."
                ],
                "contactPoint": {
                  "@type": "ContactPoint",
                  "telephone": "+233-543-442-518",
                  "contactType": "customer service",
                  "areaServed": "GH",
                  "availableLanguage": "en"
                }
              })
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "MegaGigs",
                "url": "https://megagigs.net",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://megagigs.net/buy?search={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              })
            }}
          />

       

        </AuthProvider>
      </body>
    </html>
  );
}
