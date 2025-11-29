// src/app/(marketing)/about/page.tsx
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'About Us - EZ Cycle Ramp',
  description: 'Learn about EZ Cycle Ramp - a veteran-owned business providing premium motorcycle loading ramps since 1999.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About EZ Cycle Ramp
            </h1>
            <p className="text-xl text-blue-100">
              Veteran-owned, American-made motorcycle loading solutions trusted by riders since 1999.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  EZ Cycle Ramp was founded by motorcycle enthusiasts who understood the challenges of safely loading heavy bikes into trucks and trailers. After years of struggling with flimsy, unsafe ramps, we decided to build something better.
                </p>
                <p>
                  As a veteran-owned business, we bring military-grade quality and precision to everything we do. Our ramps are engineered to handle the heaviest touring motorcycles while providing the stability and safety that riders deserve.
                </p>
                <p>
                  Today, we are proud to serve thousands of satisfied customers across the country, all while maintaining our commitment to American manufacturing and exceptional customer service.
                </p>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-8">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-[#0B5394]">25+</div>
                  <div className="text-sm text-muted-foreground">Years in Business</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-[#0B5394]">10,000+</div>
                  <div className="text-sm text-muted-foreground">Happy Customers</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-[#0B5394]">A+</div>
                  <div className="text-sm text-muted-foreground">BBB Rating</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-[#0B5394]">100%</div>
                  <div className="text-sm text-muted-foreground">Made in USA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-8 rounded-lg border">
              <div className="w-12 h-12 bg-[#0B5394] rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Safety First</h3>
              <p className="text-muted-foreground">
                Every product is engineered with safety as the top priority. Our ramps are designed to handle loads well beyond their rated capacity.
              </p>
            </div>
            <div className="bg-background p-8 rounded-lg border">
              <div className="w-12 h-12 bg-[#0B5394] rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">American Made</h3>
              <p className="text-muted-foreground">
                All our products are designed and manufactured in the USA, supporting American workers and ensuring the highest quality standards.
              </p>
            </div>
            <div className="bg-background p-8 rounded-lg border">
              <div className="w-12 h-12 bg-[#0B5394] rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Customer Focus</h3>
              <p className="text-muted-foreground">
                We stand behind every product with industry-leading warranties and customer support that treats you like family.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Veteran Owned Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block bg-[#0B5394] text-white px-6 py-3 rounded-full text-lg font-semibold mb-6">
            Proudly Veteran Owned
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Serving Those Who Served
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            As veterans ourselves, we understand the importance of quality, reliability, and standing by your word. These values are built into everything we do.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90">
              <Link href="/products">Shop Our Products</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
