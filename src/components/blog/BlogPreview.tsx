// src/components/blog/BlogPreview.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getFeaturedBlogPosts, getBlogPosts } from '@/lib/supabase/queries'

// Base URL for images from live site (fallback)
const LIVE_SITE = 'https://ezcycleramp.com'

// Fallback blog posts if database is empty
const FALLBACK_POSTS = [
  {
    slug: 'how-to-choose-motorcycle-loading-ramp',
    title: 'How to Choose the Right Motorcycle Loading Ramp',
    excerpt: 'Choosing the right ramp depends on your bike\'s weight, truck bed height, and loading frequency.',
    category: 'Buying Guide',
    image_url: `${LIVE_SITE}/images/ramp6.webp`,
  },
  {
    slug: 'motorcycle-loading-safety-tips',
    title: '10 Essential Safety Tips for Loading Your Motorcycle',
    excerpt: 'Loading a motorcycle can be dangerous. Follow these tips to protect yourself and your bike.',
    category: 'Safety',
    image_url: `${LIVE_SITE}/images/ramp4.webp`,
  },
  {
    slug: 'folding-vs-standard-ramps',
    title: 'Folding vs Standard Ramps: Which Is Right for You?',
    excerpt: 'Both folding and standard ramps have advantages. Learn the pros and cons of each type.',
    category: 'Comparison',
    image_url: `${LIVE_SITE}/images/ramp2.webp`,
  },
]

export async function BlogPreview() {
  // Try to get featured blog posts first, then fall back to recent posts
  let posts = await getFeaturedBlogPosts(3)

  // If no featured posts, get the 3 most recent posts
  if (posts.length === 0) {
    posts = await getBlogPosts(3)
  }

  // Use fallback if database is empty
  const displayPosts = posts.length > 0 ? posts : FALLBACK_POSTS

  return (
    <section className="py-16 bg-gradient-to-br from-gray-200 via-orange-50 to-gray-200 dark:bg-muted/50 dark:from-transparent dark:via-transparent dark:to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Some of <span className="text-[#F78309]">Our Stories</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tips, guides, and news about motorcycle loading
          </p>
        </div>
        <div className="relative">
          {/* Glow effects */}
          <div className="absolute inset-0 bg-[#F78309]/15 dark:bg-[#F78309]/20 blur-3xl rounded-full scale-90" />
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-[#F78309]/20 dark:bg-[#F78309]/25 blur-3xl rounded-full" />
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-[#F78309]/20 dark:bg-[#F78309]/25 blur-3xl rounded-full" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
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
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-[#0B5394] transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
        <div className="text-center mt-8">
          <Button asChild variant="outline" className="border-[#0B5394] text-[#0B5394] hover:bg-[#0B5394]/10 dark:border-white dark:text-white dark:hover:bg-white/10">
            <Link href="/blog">View All Articles</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
