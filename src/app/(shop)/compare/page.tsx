// src/app/(shop)/compare/page.tsx
import { Metadata } from 'next'
import { getProducts } from '@/lib/supabase/queries'
import { CompareProducts } from '@/components/products/CompareProducts'

export const metadata: Metadata = {
  title: 'Compare Ramps - EZ Cycle Ramp',
  description: 'Compare our motorcycle loading ramps side by side to find the perfect one for your needs.',
}

export default async function ComparePage() {
  const products = await getProducts()

  // Filter to only show main ramp products (not accessories)
  const rampProducts = products.filter(p =>
    p.name.toLowerCase().includes('ramp') ||
    p.name.toLowerCase().includes('aun')
  )

  return <CompareProducts products={rampProducts} />
}
