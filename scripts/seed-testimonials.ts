/**
 * Seed Sample Testimonials
 * Run: npx tsx scripts/seed-testimonials.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const tenantId = process.env.EZCR_TENANT_ID!

if (!supabaseUrl || !supabaseKey || !tenantId) {
  console.error('Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, EZCR_TENANT_ID')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const sampleTestimonials = [
  // Approved and Featured
  {
    customer_name: 'Mike R.',
    customer_email: 'mike.r@example.com',
    rating: 5,
    review_text: 'This ramp is absolutely incredible! I have a heavy Harley Road King and was always nervous loading it into my truck. The EZ Cycle Ramp made it so easy and safe. Worth every penny. The build quality is outstanding and it folds up nicely for storage.',
    status: 'approved',
    is_featured: true,
    is_verified_customer: true,
  },
  {
    customer_name: 'Sarah T.',
    customer_email: 'sarah.t@example.com',
    rating: 5,
    review_text: 'As a woman who rides solo, I was looking for a safe way to load my bike without help. This ramp is perfect! The adjustable height feature means it works great with my SUV. Customer service was also top-notch when I had questions about installation.',
    status: 'approved',
    is_featured: true,
    is_verified_customer: true,
  },
  {
    customer_name: 'James K.',
    customer_email: 'james.k@example.com',
    rating: 5,
    review_text: 'Been using motorcycle ramps for 30 years and this is by far the best one I have ever owned. The heavy-duty construction gives me complete confidence. Made in America by veterans - that matters to me. Highly recommend to anyone who needs to transport their bike.',
    status: 'approved',
    is_featured: true,
    is_verified_customer: true,
  },
  {
    customer_name: 'Tom W.',
    customer_email: 'tom.w@example.com',
    rating: 5,
    review_text: 'Finally a ramp that can handle a real touring bike! I have an Indian Chieftain that weighs over 800 lbs and this ramp does not even flinch. The grip surface keeps my tires from slipping and the side rails give me peace of mind. Excellent product!',
    status: 'approved',
    is_featured: true,
    is_verified_customer: true,
  },

  // Approved but not featured
  {
    customer_name: 'David M.',
    customer_email: 'david.m@example.com',
    rating: 4,
    review_text: 'Great ramp overall. Setup was straightforward and it handles my Goldwing with ease. Only giving 4 stars because shipping took a bit longer than expected, but the product itself is excellent quality. Would definitely buy again.',
    status: 'approved',
    is_featured: false,
    is_verified_customer: true,
  },
  {
    customer_name: 'Robert H.',
    customer_email: 'robert.h@example.com',
    rating: 5,
    review_text: 'I have owned three different motorcycle ramps over the years and none compare to this one. The folding mechanism is smooth and the overall build quality is exceptional. My back thanks me every time I use it - no more struggling with flimsy aluminum ramps!',
    status: 'approved',
    is_featured: false,
    is_verified_customer: true,
  },
  {
    customer_name: 'Chris L.',
    customer_email: 'chris.l@example.com',
    rating: 4,
    review_text: 'Very solid ramp. I use it to load my adventure bike into my truck bed regularly. The adjustable feature is great for different vehicle heights. Only wish it was slightly lighter for easier handling, but the trade-off is worth it for the strength.',
    status: 'approved',
    is_featured: false,
    is_verified_customer: true,
  },
  {
    customer_name: 'Jennifer P.',
    customer_email: 'jennifer.p@example.com',
    rating: 5,
    review_text: 'Bought this for my husband as a birthday gift and he absolutely loves it! He has been raving about how much easier it makes loading his Ducati. The quality is impressive and it looks like it will last for many years. Great purchase!',
    status: 'approved',
    is_featured: false,
    is_verified_customer: true,
  },

  // Pending testimonials (awaiting review)
  {
    customer_name: 'Mark S.',
    customer_email: 'mark.s@example.com',
    rating: 5,
    review_text: 'Just received my ramp last week and used it for the first time yesterday. Everything went smoothly loading my Street Glide into my trailer. Very happy with this purchase!',
    status: 'pending',
    is_featured: false,
    is_verified_customer: true,
  },
  {
    customer_name: 'Linda B.',
    customer_email: 'linda.b@example.com',
    rating: 4,
    review_text: 'Good quality ramp. Assembly instructions could be clearer but once together it works great. Would recommend to friends.',
    status: 'pending',
    is_featured: false,
    is_verified_customer: false,
  },
  {
    customer_name: 'Kevin R.',
    customer_email: 'kevin.r@example.com',
    rating: 5,
    review_text: 'This ramp changed my life! No more asking neighbors for help loading my bike. The non-slip surface is fantastic and I feel completely safe using it alone.',
    status: 'pending',
    is_featured: false,
    is_verified_customer: true,
  },

  // Rejected testimonials (for various reasons)
  {
    customer_name: 'Anonymous',
    customer_email: 'test@test.com',
    rating: 1,
    review_text: 'Did not receive product yet but giving 1 star.',
    status: 'rejected',
    is_featured: false,
    is_verified_customer: false,
    rejection_reason: 'Review submitted before receiving product. Please submit review after using the ramp.',
  },
  {
    customer_name: 'John D.',
    customer_email: 'johnd123@example.com',
    rating: 3,
    review_text: 'Check out my website for better deals www.spam-site.com',
    status: 'rejected',
    is_featured: false,
    is_verified_customer: false,
    rejection_reason: 'Contains promotional/spam content.',
  },
]

async function seedTestimonials() {
  console.log('Seeding sample testimonials...\n')

  // Get a user_id from user_profiles (testimonials require a user reference)
  const { data: users, error: userError } = await supabase
    .from('user_profiles')
    .select('id')
    .limit(1)

  if (userError || !users?.length) {
    console.error('Error: Could not find a user in user_profiles.')
    console.error('Please ensure at least one user exists before running this script.')
    if (userError) console.error('Database error:', userError.message)
    process.exit(1)
  }

  const userId = users[0].id
  console.log(`Using user_id: ${userId}\n`)

  for (const testimonial of sampleTestimonials) {
    const { data, error } = await supabase
      .from('testimonials')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        ...testimonial,
      })
      .select()
      .single()

    if (error) {
      console.error(`Failed to create testimonial from ${testimonial.customer_name}:`, error.message)
    } else {
      const statusIcon = testimonial.status === 'approved' ? 'check' : testimonial.status === 'pending' ? 'hourglass' : 'x'
      const featuredIcon = testimonial.is_featured ? ' star' : ''
      console.log(`Created: ${testimonial.customer_name} - ${testimonial.rating} stars (${testimonial.status})${featuredIcon}`)
    }
  }

  // Print summary
  const approved = sampleTestimonials.filter(t => t.status === 'approved').length
  const pending = sampleTestimonials.filter(t => t.status === 'pending').length
  const rejected = sampleTestimonials.filter(t => t.status === 'rejected').length
  const featured = sampleTestimonials.filter(t => t.is_featured).length

  console.log('\nDone! Summary:')
  console.log(`  Total: ${sampleTestimonials.length}`)
  console.log(`  Approved: ${approved} (${featured} featured)`)
  console.log(`  Pending: ${pending}`)
  console.log(`  Rejected: ${rejected}`)
}

seedTestimonials().catch(console.error)
