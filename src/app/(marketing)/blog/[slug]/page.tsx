// src/app/(marketing)/blog/[slug]/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getBlogPostBySlug, getBlogPosts } from '@/lib/supabase/queries'
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react'

// Base URL for images from live site (fallback)
const LIVE_SITE = 'https://ezcycleramp.com'

// Fallback blog posts data (same as in blog/page.tsx)
const FALLBACK_POSTS = [
  {
    slug: 'how-to-choose-motorcycle-loading-ramp',
    title: 'How to Choose the Right Motorcycle Loading Ramp',
    excerpt: 'Choosing the right motorcycle loading ramp depends on several key factors: your bike\'s weight, your truck bed height, and how often you\'ll be loading. In this guide, we break down everything you need to know.',
    content: `
## Finding the Perfect Ramp for Your Needs

Choosing the right motorcycle loading ramp depends on several key factors: your bike's weight, your truck bed height, and how often you'll be loading. In this guide, we break down everything you need to know.

### Weight Capacity Matters

The most critical factor when selecting a loading ramp is ensuring it can handle your motorcycle's weight. Our ramps are rated for up to 1,500 lbs, which accommodates everything from lightweight sport bikes to heavy touring motorcycles like the Honda Gold Wing.

**Key considerations:**
- Always add 20% to your bike's weight for safety margin
- Consider the weight of any gear or luggage
- Factor in your own weight when walking the bike up

### Measuring Your Truck Bed Height

Before purchasing a ramp, you need to know your truck bed height. Here's how to measure:

1. Park your truck on level ground
2. Lower the tailgate
3. Measure from the ground to the top of the tailgate

Most pickup trucks have bed heights between 18" and 36", and our adjustable ramps accommodate this full range.

### Ramp Length and Angle

The length of your ramp determines the loading angle. A gentler angle (longer ramp) makes loading easier and safer, especially for heavier bikes. Our AUN250 folding ramp provides an optimal balance between length and portability.

### Storage and Portability

If you'll be transporting your ramp frequently, consider:
- **Folding ramps** (like the AUN250) fold in half for easy storage
- **Standard ramps** (like the AUN210) are one-piece but may require more storage space

### Bottom Line

The right ramp makes loading your motorcycle safe and stress-free. Consider your specific needs, measure your truck bed, and choose a ramp with appropriate weight capacity and length for your situation.
    `,
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Buying Guide',
    read_time: '5 min read',
    image_url: `${LIVE_SITE}/images/ramp6.webp`,
    author_name: 'EZ Cycle Ramp Team',
  },
  {
    slug: 'motorcycle-loading-safety-tips',
    title: '10 Essential Safety Tips for Loading Your Motorcycle',
    excerpt: 'Loading a motorcycle onto a truck or trailer can be dangerous if not done correctly. Follow these essential safety tips to protect yourself and your bike every time you load.',
    content: `
## Safety First: Loading Your Motorcycle

Loading a motorcycle onto a truck or trailer can be dangerous if not done correctly. Follow these essential safety tips to protect yourself and your bike every time you load.

### 1. Use Quality Equipment

Never compromise on ramp quality. A cheap, flimsy ramp can bend, slip, or collapse under load. Invest in a heavy-duty aluminum ramp with proper weight ratings.

### 2. Inspect Before Every Use

Before loading, check:
- Ramp surface for damage or debris
- Attachment points and hooks
- Adjustable legs are secure
- No cracks or bends in the frame

### 3. Secure the Ramp Properly

Your ramp should be firmly attached to your truck bed or trailer. Our ramps feature heavy-duty hooks that grip the tailgate securely.

### 4. Choose the Right Surface

Park on level, solid ground. Avoid:
- Loose gravel
- Wet grass
- Sloped driveways
- Soft soil

### 5. Use a Spotter

Even experienced riders benefit from having someone watch and guide. A spotter can:
- Alert you to alignment issues
- Provide an extra set of hands if needed
- Call for help in an emergency

### 6. Keep the Bike Straight

Walk your motorcycle straight up the ramp. Any turning or twisting increases the risk of tipping. If you need to adjust, stop, stabilize, and reposition.

### 7. Use First Gear

Keep your motorcycle in first gear when loading. This gives you better control and prevents the bike from rolling back.

### 8. Don't Rush

Take your time. A slow, steady approach is safer than trying to power up quickly.

### 9. Secure Immediately

Once loaded, immediately secure your motorcycle with quality tie-down straps before doing anything else.

### 10. Practice Empty First

If you're new to loading, practice the motion without the bike first. Walk up and down the ramp to get comfortable with the angle and surface.

### Stay Safe Out There

Following these tips will help ensure safe, stress-free motorcycle loading for years to come.
    `,
    published_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Safety',
    read_time: '4 min read',
    image_url: `${LIVE_SITE}/images/ramp4.webp`,
    author_name: 'EZ Cycle Ramp Team',
  },
  {
    slug: 'folding-vs-standard-ramps',
    title: 'Folding vs Standard Ramps: Which Is Right for You?',
    excerpt: 'Both folding and standard motorcycle ramps have their advantages. Learn the pros and cons of each type to make the best decision for your hauling needs.',
    content: `
## Folding vs Standard Ramps

Both folding and standard motorcycle ramps have their advantages. Learn the pros and cons of each type to make the best decision for your hauling needs.

### Folding Ramps (AUN250)

**Pros:**
- Compact storage when folded in half
- Easier to transport
- Fits in smaller spaces
- Same strength as standard ramps

**Cons:**
- Slightly more complex setup
- Hinge point requires occasional maintenance

**Best for:**
- Riders with limited storage space
- Those who travel frequently
- Multiple vehicle use

### Standard Ramps (AUN210)

**Pros:**
- Simpler design with no moving parts
- Quick setup
- Slightly lighter weight
- Lower price point

**Cons:**
- Requires more storage space
- Harder to transport in smaller vehicles

**Best for:**
- Dedicated truck/trailer use
- Riders with ample storage
- Budget-conscious buyers

### Making Your Decision

Consider these factors:
1. **Storage space** - How much room do you have?
2. **Frequency of transport** - Will the ramp stay in one place or travel with you?
3. **Budget** - Standard ramps are typically less expensive
4. **Convenience** - How important is quick setup?

### Our Recommendation

For most riders, the AUN250 folding ramp offers the best balance of features. The folding design adds versatility without sacrificing strength or safety.
    `,
    published_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Comparison',
    read_time: '6 min read',
    image_url: `${LIVE_SITE}/images/ramp2.webp`,
    author_name: 'EZ Cycle Ramp Team',
  },
  {
    slug: 'maintaining-your-motorcycle-ramp',
    title: 'How to Maintain Your Motorcycle Ramp for Years of Use',
    excerpt: 'A quality motorcycle ramp is an investment. With proper care and maintenance, your EZ Cycle Ramp will provide safe, reliable service for many years. Here\'s how to keep it in top condition.',
    content: `
## Ramp Maintenance Guide

A quality motorcycle ramp is an investment. With proper care and maintenance, your EZ Cycle Ramp will provide safe, reliable service for many years. Here's how to keep it in top condition.

### Regular Cleaning

After each use, especially in wet or muddy conditions:
- Wipe down with a damp cloth
- Remove any dirt or debris from the surface
- Clean the hooks and attachment points
- Dry thoroughly before storage

### Inspect Key Components

Monthly, check:
- **Surface grip** - Ensure the textured surface is intact
- **Hinges** (folding models) - Should move smoothly
- **Hooks** - Check for bends or wear
- **Legs** - Adjustable components should lock securely

### Lubrication

For folding ramps, apply a light lubricant to hinges every few months. Use:
- Silicone spray
- White lithium grease
- Avoid petroleum-based products on rubber components

### Storage Tips

Proper storage extends ramp life:
- Store in a dry location
- Avoid direct sunlight for extended periods
- Don't stack heavy items on top
- Keep folded (for folding models) or lying flat

### Signs of Wear

Replace your ramp if you notice:
- Cracks in the frame
- Bent or warped sections
- Worn-out grip surface
- Damaged attachment hooks
- Legs that won't lock securely

### Warranty Coverage

Remember, your EZ Cycle Ramp comes with a 2-year warranty. If you experience any defects in materials or workmanship, contact us for support.
    `,
    published_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Maintenance',
    read_time: '3 min read',
    image_url: `${LIVE_SITE}/images/ramp1.webp`,
    author_name: 'EZ Cycle Ramp Team',
  },
  {
    slug: 'loading-heavy-touring-motorcycles',
    title: 'Loading Heavy Touring Motorcycles: A Complete Guide',
    excerpt: 'Touring motorcycles like the Honda Gold Wing or Harley-Davidson Road Glide require special consideration when loading. This guide covers techniques and equipment for safely loading bikes over 800 lbs.',
    content: `
## Loading Heavy Touring Motorcycles

Touring motorcycles like the Honda Gold Wing or Harley-Davidson Road Glide require special consideration when loading. This guide covers techniques and equipment for safely loading bikes over 800 lbs.

### Understanding the Challenge

Heavy touring bikes present unique challenges:
- **Weight** - 800-1,000+ lbs fully loaded
- **Size** - Wider than sport bikes
- **Center of gravity** - Higher with luggage
- **Value** - Often $25,000+ investments

### Equipment Requirements

For bikes over 800 lbs, ensure:
- Ramp rated for at least 1,500 lbs
- Wide track width (our ramps are 7.5" wide)
- Secure attachment points
- Low loading angle

### Recommended Technique

1. **Prepare the truck** - Lower tailgate, secure ramp, check level
2. **Remove luggage** - Reduce weight and improve balance
3. **Use first gear** - Maximum control during loading
4. **Walk beside the bike** - Never ride up the ramp
5. **Steady throttle** - Maintain momentum without acceleration
6. **Have a spotter** - Essential for heavy bikes

### Securing Heavy Bikes

After loading:
- Use 4-point tie-down system
- Compress front suspension slightly
- Check side-to-side stability
- Double-check all straps before driving

### Common Mistakes to Avoid

- **Rushing** - Take your time
- **Wrong gear** - Always use first
- **No spotter** - Don't go solo with heavy bikes
- **Weak straps** - Use rated tie-downs

### Our Recommendation

The AUN250 folding ramp is ideal for touring motorcycles, offering the weight capacity and stability needed for safe loading of even the heaviest bikes.
    `,
    published_at: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'How-To',
    read_time: '7 min read',
    image_url: `${LIVE_SITE}/images/ramp3.webp`,
    author_name: 'EZ Cycle Ramp Team',
  },
  {
    slug: 'why-veteran-owned-matters',
    title: 'Why Buying from a Veteran-Owned Business Matters',
    excerpt: 'EZ Cycle Ramp is proud to be veteran-owned and operated. Learn about our commitment to quality, integrity, and customer service that comes from our military background.',
    content: `
## Why Veteran-Owned Matters

EZ Cycle Ramp is proud to be veteran-owned and operated. Learn about our commitment to quality, integrity, and customer service that comes from our military background.

### Our Story

EZ Cycle Ramp was founded by veterans who understood one thing above all: when you commit to something, you give it everything you've got. That military mindset shapes every aspect of our business.

### Values That Drive Us

**Integrity**
We say what we mean and mean what we say. Our product descriptions are honest, our warranties are real, and our customer service is genuine.

**Quality**
In the military, equipment failures can cost lives. While motorcycle ramps aren't life-or-death, we build them with the same attention to quality. Every ramp is inspected before shipping.

**Service**
We served our country, and now we serve our customers. When you call EZ Cycle Ramp, you talk to real people who care about solving your problem.

### Supporting Veterans

When you buy from a veteran-owned business:
- You support veteran employment
- You contribute to veteran entrepreneurship
- You help build stronger communities

### Our Commitment

We're committed to:
- American quality standards
- Honest business practices
- Exceptional customer service
- Standing behind our products

### Join the EZ Cycle Ramp Family

When you choose EZ Cycle Ramp, you're not just buying a ramp—you're supporting a veteran-owned business that puts quality, integrity, and service first.

Thank you for your support.
    `,
    published_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Company',
    read_time: '4 min read',
    image_url: `${LIVE_SITE}/images/ramp5.webp`,
    author_name: 'EZ Cycle Ramp Team',
  },
]

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  // Try database first
  const post = await getBlogPostBySlug(slug)

  // Fall back to static data
  const fallbackPost = FALLBACK_POSTS.find(p => p.slug === slug)
  const displayPost = post || fallbackPost

  if (!displayPost) {
    return {
      title: 'Post Not Found - EZ Cycle Ramp',
    }
  }

  return {
    title: `${displayPost.title} - EZ Cycle Ramp Blog`,
    description: displayPost.excerpt || displayPost.title,
  }
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

// Simple markdown-like rendering (handles ## headers, **bold**, lists)
function renderContent(content: string) {
  const lines = content.trim().split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let inList = false

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-2 mb-6 text-muted-foreground">
          {listItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
      listItems = []
      inList = false
    }
  }

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()

    // Skip empty lines
    if (!trimmedLine) {
      flushList()
      return
    }

    // H2 headers
    if (trimmedLine.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-foreground">
          {trimmedLine.replace('## ', '')}
        </h2>
      )
      return
    }

    // H3 headers
    if (trimmedLine.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={index} className="text-xl font-semibold mt-6 mb-3 text-foreground">
          {trimmedLine.replace('### ', '')}
        </h3>
      )
      return
    }

    // List items
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      inList = true
      // Handle **bold** in list items
      let itemText = trimmedLine.slice(2)
      listItems.push(itemText.replace(/\*\*(.*?)\*\*/g, '$1'))
      return
    }

    // Numbered list items
    if (/^\d+\.\s/.test(trimmedLine)) {
      if (listItems.length > 0 && !inList) {
        flushList()
      }
      inList = true
      const itemText = trimmedLine.replace(/^\d+\.\s/, '')
      listItems.push(itemText.replace(/\*\*(.*?)\*\*/g, '$1'))
      return
    }

    // Regular paragraphs
    flushList()
    // Handle **bold** text
    const formattedText = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    elements.push(
      <p
        key={index}
        className="text-muted-foreground mb-4 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
    )
  })

  flushList()
  return elements
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params

  // Try database first
  const dbPost = await getBlogPostBySlug(slug)

  // Fall back to static data
  const fallbackPost = FALLBACK_POSTS.find(p => p.slug === slug)
  const post = dbPost || fallbackPost

  if (!post) {
    notFound()
  }

  // Get related posts (other posts, excluding current)
  const allPosts = await getBlogPosts()
  const relatedFromDb = allPosts.filter(p => p.slug !== slug).slice(0, 3)
  const relatedPosts = relatedFromDb.length > 0
    ? relatedFromDb
    : FALLBACK_POSTS.filter(p => p.slug !== slug).slice(0, 3)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center text-blue-200 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>

          {post.category && (
            <span className="inline-flex items-center bg-[#F78309] text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
              <Tag className="w-3 h-3 mr-1" />
              {post.category}
            </span>
          )}

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-blue-100">
            {post.published_at && (
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {formatDate(post.published_at)}
              </span>
            )}
            {post.read_time && (
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {post.read_time}
              </span>
            )}
            {post.author_name && (
              <span>By {post.author_name}</span>
            )}
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {post.image_url && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="rounded-lg overflow-hidden shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <article className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            {post.content ? (
              renderContent(post.content)
            ) : post.excerpt ? (
              <p className="text-muted-foreground text-lg leading-relaxed">
                {post.excerpt}
              </p>
            ) : null}
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.slug}
                  href={`/blog/${relatedPost.slug}`}
                  className="bg-background border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {relatedPost.image_url && (
                    <div className="aspect-[16/9] relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={relatedPost.image_url}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:text-[#0B5394] transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {relatedPost.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
