// src/app/(marketing)/blog/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChatCTA } from '@/components/chat/ChatCTA'
import { getBlogPosts } from '@/lib/supabase/queries'

// Base URL for images from live site (fallback)
const LIVE_SITE = 'https://ezcycleramp.com'

// Fallback blog posts if database is empty
const FALLBACK_POSTS = [
  {
    slug: 'how-to-choose-motorcycle-loading-ramp',
    title: 'How to Choose the Right Motorcycle Loading Ramp',
    excerpt: 'Choosing the right motorcycle loading ramp depends on several key factors: your bike\'s weight, your truck bed height, and how often you\'ll be loading. In this guide, we break down everything you need to know.',
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Buying Guide',
    read_time: '5 min read',
    image_url: `${LIVE_SITE}/images/ramp6.webp`,
  },
  {
    slug: 'motorcycle-loading-safety-tips',
    title: '10 Essential Safety Tips for Loading Your Motorcycle',
    excerpt: 'Loading a motorcycle onto a truck or trailer can be dangerous if not done correctly. Follow these essential safety tips to protect yourself and your bike every time you load.',
    published_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Safety',
    read_time: '4 min read',
    image_url: `${LIVE_SITE}/images/ramp4.webp`,
  },
  {
    slug: 'folding-vs-standard-ramps',
    title: 'Folding vs Standard Ramps: Which Is Right for You?',
    excerpt: 'Both folding and standard motorcycle ramps have their advantages. Learn the pros and cons of each type to make the best decision for your hauling needs.',
    published_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Comparison',
    read_time: '6 min read',
    image_url: `${LIVE_SITE}/images/ramp2.webp`,
  },
  {
    slug: 'maintaining-your-motorcycle-ramp',
    title: 'How to Maintain Your Motorcycle Ramp for Years of Use',
    excerpt: 'A quality motorcycle ramp is an investment. With proper care and maintenance, your EZ Cycle Ramp will provide safe, reliable service for many years. Here\'s how to keep it in top condition.',
    published_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Maintenance',
    read_time: '3 min read',
    image_url: `${LIVE_SITE}/images/ramp1.webp`,
  },
  {
    slug: 'loading-heavy-touring-motorcycles',
    title: 'Loading Heavy Touring Motorcycles: A Complete Guide',
    excerpt: 'Touring motorcycles like the Honda Gold Wing or Harley-Davidson Road Glide require special consideration when loading. This guide covers techniques and equipment for safely loading bikes over 800 lbs.',
    published_at: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'How-To',
    read_time: '7 min read',
    image_url: `${LIVE_SITE}/images/ramp3.webp`,
  },
  {
    slug: 'why-veteran-owned-matters',
    title: 'Why Buying from a Veteran-Owned Business Matters',
    excerpt: 'EZ Cycle Ramp is proud to be veteran-owned and operated. Learn about our commitment to quality, integrity, and customer service that comes from our military background.',
    published_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Company',
    read_time: '4 min read',
    image_url: `${LIVE_SITE}/images/ramp5.webp`,
  },
]

export const metadata = {
  title: 'Blog - EZ Cycle Ramp',
  description: 'Tips, guides, and news about motorcycle loading ramps, safety, and maintenance from EZ Cycle Ramp.',
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function BlogPage() {
  // Fetch posts from database
  const posts = await getBlogPosts()

  // Use fallback if database is empty
  const displayPosts = posts.length > 0 ? posts : FALLBACK_POSTS

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-blue-100">
            Tips, guides, and news about motorcycle loading
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {displayPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No blog posts available at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayPosts.map((post) => (
                <article
                  key={post.slug}
                  className="bg-background border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <Link href={`/blog/${post.slug}`}>
                    <div className="aspect-[16/9] relative bg-gray-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.image_url || `${LIVE_SITE}/images/ramp6.webp`}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {post.category && (
                        <span className="absolute top-3 left-3 bg-[#F78309] text-white text-xs font-medium px-3 py-1 rounded-full">
                          {post.category}
                        </span>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                        <span>{formatDate(post.published_at)}</span>
                        {post.read_time && (
                          <>
                            <span>•</span>
                            <span>{post.read_time}</span>
                          </>
                        )}
                      </div>
                      <h2 className="text-xl font-semibold mb-3 group-hover:text-[#0B5394] transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <span className="text-[#0B5394] font-medium">
                        Read More →
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Chat CTA */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ChatCTA
            variant="card"
            title="Have Questions About Ramps?"
            description="Ask Charli for personalized recommendations based on your truck and motorcycle."
            buttonText="Ask Charli"
          />
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get the latest tips, guides, and news delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0B5394]"
            />
            <Button className="bg-[#F78309] hover:bg-[#F78309]/90">
              Subscribe
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#0B5394] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your <span className="text-[#F78309]">Perfect Ramp</span>?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Browse our selection of premium motorcycle loading ramps.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90">
              <Link href="/products">Shop All Ramps</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
              <Link href="/configure">Configure Your Ramp</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
