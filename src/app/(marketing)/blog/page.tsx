// src/app/(marketing)/blog/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const blogPosts = [
  {
    slug: 'how-to-choose-motorcycle-loading-ramp',
    title: 'How to Choose the Right Motorcycle Loading Ramp',
    excerpt: 'Choosing the right motorcycle loading ramp depends on several key factors: your bike\'s weight, your truck bed height, and how often you\'ll be loading. In this guide, we break down everything you need to know.',
    date: 'November 28, 2025',
    category: 'Buying Guide',
    readTime: '5 min read',
    image: 'https://ezcycleramp.com/images/ramp6.webp',
  },
  {
    slug: 'motorcycle-loading-safety-tips',
    title: '10 Essential Safety Tips for Loading Your Motorcycle',
    excerpt: 'Loading a motorcycle onto a truck or trailer can be dangerous if not done correctly. Follow these essential safety tips to protect yourself and your bike every time you load.',
    date: 'November 20, 2025',
    category: 'Safety',
    readTime: '4 min read',
    image: 'https://ezcycleramp.com/images/ramp4.webp',
  },
  {
    slug: 'folding-vs-standard-ramps',
    title: 'Folding vs Standard Ramps: Which Is Right for You?',
    excerpt: 'Both folding and standard motorcycle ramps have their advantages. Learn the pros and cons of each type to make the best decision for your hauling needs.',
    date: 'November 15, 2025',
    category: 'Comparison',
    readTime: '6 min read',
    image: 'https://ezcycleramp.com/images/ramp2.webp',
  },
  {
    slug: 'maintaining-your-motorcycle-ramp',
    title: 'How to Maintain Your Motorcycle Ramp for Years of Use',
    excerpt: 'A quality motorcycle ramp is an investment. With proper care and maintenance, your EZ Cycle Ramp will provide safe, reliable service for many years. Here\'s how to keep it in top condition.',
    date: 'November 10, 2025',
    category: 'Maintenance',
    readTime: '3 min read',
    image: 'https://ezcycleramp.com/images/ramp1.webp',
  },
  {
    slug: 'loading-heavy-touring-motorcycles',
    title: 'Loading Heavy Touring Motorcycles: A Complete Guide',
    excerpt: 'Touring motorcycles like the Honda Gold Wing or Harley-Davidson Road Glide require special consideration when loading. This guide covers techniques and equipment for safely loading bikes over 800 lbs.',
    date: 'November 5, 2025',
    category: 'How-To',
    readTime: '7 min read',
    image: 'https://ezcycleramp.com/images/ramp3.webp',
  },
  {
    slug: 'why-veteran-owned-matters',
    title: 'Why Buying from a Veteran-Owned Business Matters',
    excerpt: 'EZ Cycle Ramp is proud to be veteran-owned and operated. Learn about our commitment to quality, integrity, and customer service that comes from our military background.',
    date: 'October 28, 2025',
    category: 'Company',
    readTime: '4 min read',
    image: 'https://ezcycleramp.com/images/ramp5.webp',
  },
]

export const metadata = {
  title: 'Blog - EZ Cycle Ramp',
  description: 'Tips, guides, and news about motorcycle loading ramps, safety, and maintenance from EZ Cycle Ramp.',
}

export default function BlogPage() {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.slug}
                className="bg-background border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="aspect-[16/9] relative bg-gray-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 bg-[#F78309] text-white text-xs font-medium px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className="text-xl font-semibold mb-3 group-hover:text-[#0B5394] transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <Button asChild variant="link" className="p-0 h-auto text-[#0B5394]">
                    <Link href={`/blog/${post.slug}`}>
                      Read More →
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
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
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Perfect Ramp?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Browse our selection of premium motorcycle loading ramps.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90">
              <Link href="/products">Shop All Ramps</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
              <Link href="/configure">Configure Your Ramp</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
