// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CartProvider } from '@/contexts/CartContext'
import { CartSheet } from '@/components/cart/CartSheet'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EZ Cycle Ramp - Premium Motorcycle Loading Ramps',
  description: 'Premium folding and standard motorcycle loading ramps for pickups, vans, and trailers. Veteran owned with A+ BBB rating. Free shipping over $500.',
  keywords: ['motorcycle ramp', 'loading ramp', 'truck ramp', 'folding ramp', 'AUN250', 'AUN210'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <Header />
          <main className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
          <Footer />
          <CartSheet />
        </CartProvider>
      </body>
    </html>
  )
}