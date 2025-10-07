// src/app/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Load Your Bike with Confidence
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Premium folding and standard motorcycle loading ramps. Made in USA. 
              Veteran owned. A+ BBB rating. Free shipping over $500.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90 text-white">
                <Link href="/products">Shop All Ramps</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                <Link href="/configure">Find Your Perfect Ramp</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4 font-bold text-[#0B5394]">Heavy Duty</div>
              <h3 className="font-semibold text-lg mb-2">Built Tough</h3>
              <p className="text-muted-foreground">Built to handle heavy motorcycles with ease</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4 font-bold text-[#0B5394]">Adjustable</div>
              <h3 className="font-semibold text-lg mb-2">Perfect Fit</h3>
              <p className="text-muted-foreground">Fits various truck bed heights perfectly</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4 font-bold text-[#0B5394]">Easy Setup</div>
              <h3 className="font-semibold text-lg mb-2">Quick Install</h3>
              <p className="text-muted-foreground">Simple installation in under an hour</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Ramps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-lg mb-2">AUN250 Folding Ramp</h3>
              <p className="text-2xl font-bold text-[#F78309] mb-4">$1,299</p>
              <Button asChild className="w-full bg-[#0B5394] hover:bg-[#0B5394]/90">
                <Link href="/products/aun250">View Details</Link>
              </Button>
            </div>
            <div className="bg-background border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-lg mb-2">AUN210 Standard Ramp</h3>
              <p className="text-2xl font-bold text-[#F78309] mb-4">$999</p>
              <Button asChild className="w-full bg-[#0B5394] hover:bg-[#0B5394]/90">
                <Link href="/products/aun210">View Details</Link>
              </Button>
            </div>
            <div className="bg-background border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-lg mb-2">AUN200 Basic Ramp</h3>
              <p className="text-2xl font-bold text-[#F78309] mb-4">$799</p>
              <Button asChild className="w-full bg-[#0B5394] hover:bg-[#0B5394]/90">
                <Link href="/products/aun200">View Details</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#F78309] text-white py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Not Sure Which Ramp Is Right?</h2>
          <p className="text-lg mb-8">Use our configurator to find the perfect ramp for your setup.</p>
          <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
            <Link href="/configure">Start Configurator</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}