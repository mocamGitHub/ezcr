// scripts/seed-testimonials.ts
// Run with: npx ts-node --esm scripts/seed-testimonials.ts

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://supabase.nexcyte.com'
const SUPABASE_SERVICE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1OTEwNTM4MCwiZXhwIjo0OTE0Nzc4OTgwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.eJi_5yIeVN64jC-Vg_vdZLGUthLcWqY7dtMoRiE56YY'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function seedTestimonials() {
  console.log('Seeding testimonials...')

  // First, get the tenant_id
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)

  if (tenantError || !tenants?.length) {
    console.error('Error fetching tenant:', tenantError)
    return
  }

  const tenantId = tenants[0].id
  console.log('Using tenant_id:', tenantId)

  // Get a user_id (or create a dummy one)
  const { data: users, error: userError } = await supabase
    .from('user_profiles')
    .select('id')
    .limit(1)

  if (userError || !users?.length) {
    console.error('Error fetching user:', userError)
    console.log('Creating testimonials without user reference...')
  }

  const userId = users?.[0]?.id

  // Sample testimonials
  const testimonials = [
    {
      tenant_id: tenantId,
      user_id: userId,
      customer_name: 'Mike R.',
      customer_email: 'mike.r@example.com',
      rating: 5,
      review_text: 'This ramp is absolutely incredible! I have a heavy Harley Road King and was always nervous loading it into my truck. The EZ Cycle Ramp made it so easy and safe. Worth every penny. The build quality is outstanding and it folds up nicely for storage.',
      status: 'approved',
      is_featured: true,
      is_verified_customer: true,
    },
    {
      tenant_id: tenantId,
      user_id: userId,
      customer_name: 'Sarah T.',
      customer_email: 'sarah.t@example.com',
      rating: 5,
      review_text: 'As a woman who rides solo, I was looking for a safe way to load my bike without help. This ramp is perfect! The adjustable height feature means it works great with my SUV. Customer service was also top-notch when I had questions about installation.',
      status: 'approved',
      is_featured: true,
      is_verified_customer: true,
    },
    {
      tenant_id: tenantId,
      user_id: userId,
      customer_name: 'James K.',
      customer_email: 'james.k@example.com',
      rating: 5,
      review_text: 'Been using motorcycle ramps for 30 years and this is by far the best one I have ever owned. The heavy-duty construction gives me complete confidence. Made in America by veterans - that matters to me. Highly recommend to anyone who needs to transport their bike.',
      status: 'approved',
      is_featured: true,
      is_verified_customer: true,
    },
    {
      tenant_id: tenantId,
      user_id: userId,
      customer_name: 'David M.',
      customer_email: 'david.m@example.com',
      rating: 4,
      review_text: 'Great ramp overall. Setup was straightforward and it handles my Goldwing with ease. Only giving 4 stars because shipping took a bit longer than expected, but the product itself is excellent quality. Would definitely buy again.',
      status: 'approved',
      is_featured: false,
      is_verified_customer: true,
    },
    {
      tenant_id: tenantId,
      user_id: userId,
      customer_name: 'Robert H.',
      customer_email: 'robert.h@example.com',
      rating: 5,
      review_text: 'I have owned three different motorcycle ramps over the years and none compare to this one. The folding mechanism is smooth and the overall build quality is exceptional. My back thanks me every time I use it - no more struggling with flimsy aluminum ramps!',
      status: 'approved',
      is_featured: false,
      is_verified_customer: true,
    },
    {
      tenant_id: tenantId,
      user_id: userId,
      customer_name: 'Tom W.',
      customer_email: 'tom.w@example.com',
      rating: 5,
      review_text: 'Finally a ramp that can handle a real touring bike! I have an Indian Chieftain that weighs over 800 lbs and this ramp does not even flinch. The grip surface keeps my tires from slipping and the side rails give me peace of mind. Excellent product!',
      status: 'approved',
      is_featured: true,
      is_verified_customer: true,
    },
    {
      tenant_id: tenantId,
      user_id: userId,
      customer_name: 'Chris L.',
      customer_email: 'chris.l@example.com',
      rating: 4,
      review_text: 'Very solid ramp. I use it to load my adventure bike into my truck bed regularly. The adjustable feature is great for different vehicle heights. Only wish it was slightly lighter for easier handling, but the trade-off is worth it for the strength.',
      status: 'approved',
      is_featured: false,
      is_verified_customer: true,
    },
    {
      tenant_id: tenantId,
      user_id: userId,
      customer_name: 'Jennifer P.',
      customer_email: 'jennifer.p@example.com',
      rating: 5,
      review_text: 'Bought this for my husband as a birthday gift and he absolutely loves it! He has been raving about how much easier it makes loading his Ducati. The quality is impressive and it looks like it will last for many years. Great purchase!',
      status: 'approved',
      is_featured: false,
      is_verified_customer: true,
    },
  ]

  // Insert testimonials
  const { data, error } = await supabase
    .from('testimonials')
    .insert(testimonials)
    .select()

  if (error) {
    console.error('Error inserting testimonials:', error)
    return
  }

  console.log(`Successfully inserted ${data.length} testimonials!`)
  console.log('Featured testimonials:', data.filter(t => t.is_featured).length)
}

seedTestimonials()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
