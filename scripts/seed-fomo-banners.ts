/**
 * Seed FOMO Banners
 * Run: npx tsx scripts/seed-fomo-banners.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper to get date X days from now
const daysFromNow = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

const sampleBanners = [
  // Limited Time Offer
  {
    enabled: true,
    type: 'countdown',
    message: 'Holiday Sale: 15% off all ramps! Use code HOLIDAY15 at checkout.',
    end_date: daysFromNow(7),
    background_color: '#FEF3C7',
    text_color: '#92400E',
    accent_color: '#F78309',
    position: 'top',
    dismissible: true,
    show_icon: true,
    priority: 1,
  },
  // Low Stock Alert
  {
    enabled: true,
    type: 'stock',
    message: 'Only {{stock_count}} Heavy-Duty Ramps left in stock!',
    stock_count: 3,
    stock_threshold: 5,
    background_color: '#FEE2E2',
    text_color: '#991B1B',
    accent_color: '#DC2626',
    position: 'top',
    dismissible: true,
    show_icon: true,
    priority: 2,
  },
  // Recent Purchase Social Proof
  {
    enabled: true,
    type: 'social_proof',
    message: 'Join over 500 satisfied customers who chose EZ Cycle Ramp!',
    recent_purchases: [
      { name: 'Mike R.', location: 'Atlanta, GA', product: 'Heavy-Duty Ramp', time: '2 hours ago' },
      { name: 'Sarah T.', location: 'Dallas, TX', product: 'Standard Ramp', time: '4 hours ago' },
      { name: 'James K.', location: 'Denver, CO', product: 'Pro Ramp Kit', time: '6 hours ago' },
    ],
    background_color: '#DCFCE7',
    text_color: '#166534',
    accent_color: '#22C55E',
    position: 'bottom',
    dismissible: true,
    show_icon: true,
    priority: 3,
  },
  // Visitor Count
  {
    enabled: true,
    type: 'visitors',
    message: '{{visitor_count}} people are viewing this product right now!',
    visitor_count: 24,
    background_color: '#DBEAFE',
    text_color: '#1E40AF',
    accent_color: '#3B82F6',
    position: 'top',
    dismissible: true,
    show_icon: true,
    priority: 4,
  },
  // Free Shipping Threshold
  {
    enabled: true,
    type: 'shipping',
    message: 'FREE shipping on all orders over $500! Most orders ship within 24 hours.',
    background_color: '#F3E8FF',
    text_color: '#6B21A8',
    accent_color: '#9333EA',
    position: 'top',
    dismissible: true,
    show_icon: true,
    priority: 5,
  },
  // Seasonal/Event Banner (disabled by default)
  {
    enabled: false,
    type: 'event',
    message: 'Spring Riding Season is here! Get your ramp before the rush.',
    start_date: new Date().toISOString(),
    end_date: daysFromNow(30),
    background_color: '#ECFDF5',
    text_color: '#065F46',
    accent_color: '#10B981',
    position: 'top',
    dismissible: true,
    show_icon: true,
    priority: 6,
  },
]

async function seedFomoBanners() {
  console.log('🌱 Seeding FOMO banners...\n')

  // First, check if there are existing banners
  const { data: existing, error: checkError } = await supabase
    .from('fomo_banners')
    .select('id')
    .limit(1)

  if (checkError) {
    console.error('❌ Error checking existing banners:', checkError.message)
    return
  }

  if (existing && existing.length > 0) {
    console.log('⚠️  FOMO banners already exist. Skipping seed.')
    console.log('   To re-seed, delete existing banners first.')
    return
  }

  for (const banner of sampleBanners) {
    const { data, error } = await supabase
      .from('fomo_banners')
      .insert(banner)
      .select()
      .single()

    if (error) {
      console.error(`❌ Failed to create ${banner.type} banner:`, error.message)
    } else {
      const status = banner.enabled ? '✅' : '⏸️'
      console.log(`${status} Created: ${banner.type} banner - "${banner.message.substring(0, 50)}..."`)
    }
  }

  console.log('\n✨ Done! Created', sampleBanners.length, 'FOMO banners.')
}

seedFomoBanners().catch(console.error)
