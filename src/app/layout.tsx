// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CartProvider } from '@/contexts/CartContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { WishlistProvider } from '@/contexts/WishlistContext'
import { CartSheet } from '@/components/cart/CartSheet'
import { ChatWidgetWrapper } from '@/components/chat/ChatWidgetWrapper'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { PageTransition } from '@/components/ui/PageTransition'
import { FOMOBanner } from '@/components/marketing/FOMOBanner'
import { ToastProvider } from '@/components/ui/toast'
import { OrganizationSchema, LocalBusinessSchema, WebsiteSchema } from '@/components/seo/StructuredData'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Force dynamic rendering for all pages to avoid static generation issues
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export const metadata: Metadata = {
  title: {
    default: 'EZ Cycle Ramp - Premium Motorcycle Loading Ramps',
    template: '%s | EZ Cycle Ramp',
  },
  description: 'Premium folding and standard motorcycle loading ramps for pickups, vans, and trailers. Veteran owned since 1999 with A+ BBB rating. Free shipping over $500.',
  keywords: ['motorcycle ramp', 'loading ramp', 'truck ramp', 'folding ramp', 'AUN250', 'AUN210', 'motorcycle loading', 'bike ramp', 'pickup truck ramp'],
  authors: [{ name: 'EZ Cycle Ramp' }],
  creator: 'EZ Cycle Ramp',
  publisher: 'NEO-DYNE',
  metadataBase: new URL('https://ezcycleramp.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ezcycleramp.com',
    siteName: 'EZ Cycle Ramp',
    title: 'EZ Cycle Ramp - Premium Motorcycle Loading Ramps',
    description: 'Premium folding and standard motorcycle loading ramps for pickups, vans, and trailers. Veteran owned since 1999 with A+ BBB rating.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'EZ Cycle Ramp - Premium Motorcycle Loading Ramps',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EZ Cycle Ramp - Premium Motorcycle Loading Ramps',
    description: 'Premium folding and standard motorcycle loading ramps for pickups, vans, and trailers.',
    images: ['/images/og-image.jpg'],
  },
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
    // Add verification codes when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Theme initialization
                try {
                  const theme = localStorage.getItem('site-theme') || 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}

                // Scroll to top on page load
                if ('scrollRestoration' in history) {
                  history.scrollRestoration = 'manual';
                }
                window.scrollTo(0, 0);
              })();
            `,
          }}
        />
        {/* Structured Data */}
        <OrganizationSchema />
        <LocalBusinessSchema />
        <WebsiteSchema />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
              <ToastProvider>
                <FOMOBanner />
                <Header />
                <main className="min-h-[calc(100vh-4rem)]">
                  <PageTransition>
                    {children}
                  </PageTransition>
                </main>
                <Footer />
                <CartSheet />
                <ScrollToTop />
                <ChatWidgetWrapper />
              </ToastProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}