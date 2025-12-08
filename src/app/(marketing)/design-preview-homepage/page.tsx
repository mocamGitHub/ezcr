'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronDown, Play, Star, Shield, Truck, Award, Phone, ArrowRight, Check } from 'lucide-react'

// Base URL for images
const LIVE_SITE = 'https://ezcycleramp.com'

// ==============================================
// HERO SECTION ALTERNATIVES
// ==============================================

// CURRENT: Rotating Slider
function HeroCurrent() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = [
    { image: `${LIVE_SITE}/revolution/assets/10.webp`, headline: 'Creative + Unique + Wow', subtext: 'The EZ Cycle Ramp combines creativity with distinctive styling' },
    { image: `${LIVE_SITE}/revolution/assets/11.webp`, headline: 'And Then SOME', subtext: 'Awe-inspiring in its ease and efficiency' },
    { image: `${LIVE_SITE}/revolution/assets/12.webp`, headline: 'Revolutionizing', subtext: 'A safe and stress-free motorcycle loading experience' },
  ]

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  return (
    <div className="relative h-[400px] overflow-hidden bg-black rounded-xl">
      {slides.map((slide, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10" />
          <img src={slide.image} alt={slide.headline} className="w-full h-full object-cover" />
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="px-6 max-w-lg">
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{slide.headline}</h1>
              <p className="text-sm md:text-lg text-gray-200 mb-4">{slide.subtext}</p>
              <div className="flex gap-3">
                <Button size="sm" className="bg-[#F78309] hover:bg-[#F78309]/90">Shop Ramps</Button>
                <Button size="sm" variant="outline" className="text-white border-white hover:bg-white/20">Find Your Ramp</Button>
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full transition-colors ${i === currentSlide ? 'bg-[#F78309]' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  )
}

// OPTION A: Split Hero with Video Thumbnail
function HeroOptionA() {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-[#0B5394] to-slate-900 rounded-xl overflow-hidden">
      <div className="grid md:grid-cols-2 gap-6 p-6 md:p-10">
        {/* Left: Content */}
        <div className="flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 px-3 py-1 rounded-full text-xs mb-4 w-fit">
            <Shield className="w-3 h-3" /> Veteran Owned • BBB A+ Rated
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Load Your Motorcycle
            <span className="text-[#F78309]"> Safely</span>
          </h1>
          <p className="text-blue-100 mb-6 text-lg">
            Premium folding ramps engineered for pickup trucks, cargo vans, and trailers. Made in USA.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90 text-white">
              Shop Ramps <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10">
              Configure Your Ramp
            </Button>
          </div>
          {/* Trust indicators */}
          <div className="flex items-center gap-6 mt-8 text-sm text-blue-200">
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-400" /> Free Shipping $500+
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-400" /> Lifetime Warranty
            </div>
          </div>
        </div>

        {/* Right: Video/Image with play button */}
        <div className="relative">
          <div className="aspect-video rounded-xl overflow-hidden bg-black/20">
            <img src={`${LIVE_SITE}/images/ramp6.webp`} alt="EZ Cycle Ramp" className="w-full h-full object-cover" />
          </div>
          <button className="absolute inset-0 flex items-center justify-center group">
            <div className="w-16 h-16 rounded-full bg-[#F78309] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>
          </button>
          <p className="text-center text-blue-200 text-sm mt-3">Watch how it works</p>
        </div>
      </div>
    </div>
  )
}

// OPTION B: Centered Hero with Floating Product
function HeroOptionB() {
  return (
    <div className="relative bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl overflow-hidden py-12 px-6">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px'}} />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#F78309]/20 text-[#F78309] px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Award className="w-4 h-4" /> #1 Rated Motorcycle Loading Ramp
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          The Last Ramp You&apos;ll
          <br />
          <span className="text-[#F78309]">Ever Need</span>
        </h1>

        <p className="text-xl text-gray-300 mb-8 max-w-xl mx-auto">
          Premium motorcycle loading ramps built to last a lifetime. Trusted by 10,000+ riders.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
          <Button size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90 text-lg px-8">
            Shop Now
          </Button>
          <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10 text-lg px-8">
            Find Your Fit
          </Button>
        </div>

        {/* Floating product image */}
        <div className="relative">
          <div className="absolute inset-0 bg-[#F78309]/20 blur-3xl rounded-full" />
          <img
            src={`${LIVE_SITE}/images/ramp6.webp`}
            alt="EZ Cycle Ramp"
            className="relative mx-auto max-h-[250px] object-contain drop-shadow-2xl"
          />
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-8 mt-8 pt-8 border-t border-white/10">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">10K+</p>
            <p className="text-sm text-gray-400">Happy Customers</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">25+</p>
            <p className="text-sm text-gray-400">Years Experience</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">A+</p>
            <p className="text-sm text-gray-400">BBB Rating</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// OPTION C: Bold Typography Hero
function HeroOptionC() {
  return (
    <div className="relative h-[500px] rounded-xl overflow-hidden">
      {/* Background image */}
      <img src={`${LIVE_SITE}/revolution/assets/10.webp`} alt="Background" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6 md:p-10">
        {/* Top: Trust badges */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur px-3 py-1 rounded-full text-white text-xs flex items-center gap-1">
              <Shield className="w-3 h-3" /> Veteran Owned
            </div>
            <div className="bg-white/10 backdrop-blur px-3 py-1 rounded-full text-white text-xs">
              BBB A+ Rated
            </div>
          </div>
          <Button size="sm" variant="outline" className="text-white border-white/30 hover:bg-white/10">
            <Phone className="w-4 h-4 mr-2" /> 800-687-4410
          </Button>
        </div>

        {/* Center: Big text */}
        <div className="text-center">
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tight">
            LOAD.<br />
            <span className="text-[#F78309]">RIDE.</span><br />
            REPEAT.
          </h1>
        </div>

        {/* Bottom: CTA */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90 text-lg px-10">
            Shop Ramps
          </Button>
          <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 text-lg px-10">
            Configure
          </Button>
        </div>
      </div>
    </div>
  )
}

// OPTION D: Product-Focused Hero with Benefits
function HeroOptionD() {
  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden">
      <div className="grid lg:grid-cols-5 gap-0">
        {/* Left side - Benefits (2 cols) */}
        <div className="lg:col-span-2 p-6 md:p-8 flex flex-col justify-center bg-gradient-to-br from-[#0B5394] to-[#0B5394]/80">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
            Why Choose<br />
            <span className="text-[#F78309]">EZ Cycle Ramp?</span>
          </h1>

          <div className="space-y-4">
            {[
              { icon: Shield, title: 'Lifetime Warranty', desc: 'Built to last forever' },
              { icon: Truck, title: 'Free Shipping', desc: 'On orders over $500' },
              { icon: Award, title: 'Made in USA', desc: 'Veteran-owned business' },
              { icon: Star, title: '5-Star Reviews', desc: 'Thousands of happy riders' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-[#F78309]" />
                </div>
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-sm text-blue-200">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Button size="lg" className="mt-8 bg-[#F78309] hover:bg-[#F78309]/90 w-full sm:w-auto">
            Shop All Ramps <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Right side - Product showcase (3 cols) */}
        <div className="lg:col-span-3 relative bg-gradient-to-br from-slate-800 to-slate-900 p-6 md:p-8">
          <div className="absolute top-4 right-4 bg-[#F78309] text-white text-sm font-bold px-3 py-1 rounded-full">
            BEST SELLER
          </div>

          <div className="text-center">
            <img
              src={`${LIVE_SITE}/images/ramp6.webp`}
              alt="AUN250 Ramp"
              className="mx-auto max-h-[200px] object-contain mb-6"
            />

            <h2 className="text-2xl font-bold text-white mb-2">AUN250 Folding Ramp</h2>
            <p className="text-gray-400 mb-4">2,500 lb capacity • 8ft length • Folds for storage</p>

            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-4xl font-bold text-white">$1,299</span>
              <span className="text-lg text-gray-500 line-through">$1,499</span>
              <span className="bg-green-500/20 text-green-400 text-sm px-2 py-0.5 rounded">Save $200</span>
            </div>

            <div className="flex justify-center gap-3">
              <Button size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90">
                Add to Cart
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10">
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==============================================
// FEATURES SECTION ALTERNATIVES
// ==============================================

// CURRENT: Simple 3-column text
function FeaturesCurrent() {
  return (
    <div className="py-12 bg-background rounded-xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
        {[
          { title: 'Heavy Duty', subtitle: 'Built Tough', desc: 'Built to handle heavy motorcycles with ease' },
          { title: 'Adjustable', subtitle: 'Perfect Fit', desc: 'Fits various truck bed heights perfectly' },
          { title: 'Easy Setup', subtitle: 'Quick Install', desc: 'Simple installation in under an hour' },
        ].map((f, i) => (
          <div key={i} className="text-center">
            <div className="text-3xl font-bold text-[#0B5394] mb-2">{f.title}</div>
            <h3 className="font-semibold text-lg mb-1">{f.subtitle}</h3>
            <p className="text-muted-foreground text-sm">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// OPTION A: Icon Cards with Hover
function FeaturesOptionA() {
  const features = [
    { icon: Shield, title: '2,500 lb Capacity', desc: 'Handle any motorcycle with confidence' },
    { icon: Award, title: 'Lifetime Warranty', desc: 'Built to last, guaranteed forever' },
    { icon: Truck, title: 'Free Shipping', desc: 'On all orders over $500' },
    { icon: Star, title: '5-Star Service', desc: 'Expert support when you need it' },
  ]

  return (
    <div className="py-8 px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {features.map((f, i) => (
          <div key={i} className="group bg-card border border-border rounded-xl p-4 text-center hover:border-[#F78309] hover:shadow-lg hover:shadow-[#F78309]/10 transition-all cursor-pointer">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#0B5394]/10 flex items-center justify-center group-hover:bg-[#F78309]/10 transition-colors">
              <f.icon className="w-6 h-6 text-[#0B5394] group-hover:text-[#F78309] transition-colors" />
            </div>
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// OPTION B: Horizontal Scroll Badges (Mobile-Friendly)
function FeaturesOptionB() {
  const features = [
    { emoji: '💪', text: '2,500 lb Capacity' },
    { emoji: '🛡️', text: 'Lifetime Warranty' },
    { emoji: '🚚', text: 'Free Shipping $500+' },
    { emoji: '🇺🇸', text: 'Made in USA' },
    { emoji: '⭐', text: '5-Star Reviews' },
    { emoji: '🎖️', text: 'Veteran Owned' },
  ]

  return (
    <div className="py-6 -mx-4 px-4 overflow-x-auto">
      <div className="flex gap-3 min-w-max">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2 bg-[#0B5394]/10 px-4 py-2 rounded-full whitespace-nowrap">
            <span className="text-lg">{f.emoji}</span>
            <span className="font-medium text-sm">{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// OPTION C: Stats Bar
function FeaturesOptionC() {
  return (
    <div className="bg-[#0B5394] rounded-xl py-6 px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
        <div>
          <p className="text-3xl md:text-4xl font-bold">10K+</p>
          <p className="text-sm text-blue-200">Ramps Sold</p>
        </div>
        <div>
          <p className="text-3xl md:text-4xl font-bold">25</p>
          <p className="text-sm text-blue-200">Years in Business</p>
        </div>
        <div>
          <p className="text-3xl md:text-4xl font-bold">A+</p>
          <p className="text-sm text-blue-200">BBB Rating</p>
        </div>
        <div>
          <p className="text-3xl md:text-4xl font-bold">4.9</p>
          <p className="text-sm text-blue-200">Star Rating</p>
        </div>
      </div>
    </div>
  )
}

// ==============================================
// PRODUCT SHOWCASE ALTERNATIVES
// ==============================================

// CURRENT: Two-column with gradient background
function ProductShowcaseCurrent() {
  return (
    <div className="bg-gradient-to-br from-gray-200 via-orange-50 to-gray-200 dark:from-slate-900 dark:via-[#0B5394] dark:to-slate-900 rounded-xl p-8">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <div className="inline-block bg-[#F78309]/15 text-[#F78309] px-4 py-1 rounded-full text-sm font-semibold mb-4">
            Made in USA • Veteran Owned
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Load Your Bike<br />
            <span className="text-[#F78309]">With Confidence</span>
          </h2>
          <p className="text-muted-foreground mb-6">
            Premium folding and standard motorcycle loading ramps. Engineered for safety, built to last.
          </p>
          <div className="flex gap-4">
            <Button className="bg-[#F78309] hover:bg-[#F78309]/90">Shop All Ramps</Button>
            <Button variant="outline">Configure Your Ramp</Button>
          </div>
        </div>
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-[#F78309]/15 blur-3xl rounded-full scale-75" />
          <img src={`${LIVE_SITE}/images/ramp6.webp`} alt="Ramp" className="relative max-h-[300px] object-contain" />
        </div>
      </div>
    </div>
  )
}

// OPTION A: Product Cards Grid
function ProductShowcaseOptionA() {
  const products = [
    { name: 'AUN250', desc: 'Folding Ramp', price: 1299, capacity: '2,500 lbs', badge: 'Best Seller' },
    { name: 'AUN210', desc: 'Standard Ramp', price: 999, capacity: '2,000 lbs', badge: null },
    { name: 'AUN200', desc: 'Basic Ramp', price: 799, capacity: '1,500 lbs', badge: 'Budget Pick' },
  ]

  return (
    <div className="py-8 px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Choose Your Ramp</h2>
        <p className="text-muted-foreground">All ramps include lifetime warranty and free shipping over $500</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {products.map((p, i) => (
          <div key={i} className="relative bg-card border border-border rounded-2xl p-6 hover:border-[#F78309] transition-colors group">
            {p.badge && (
              <span className="absolute top-4 right-4 bg-[#F78309] text-white text-xs font-bold px-2 py-1 rounded-full">
                {p.badge}
              </span>
            )}
            <div className="h-32 flex items-center justify-center mb-4">
              <img src={`${LIVE_SITE}/images/ramp6.webp`} alt={p.name} className="max-h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-xl font-bold">{p.name}</h3>
            <p className="text-muted-foreground text-sm mb-2">{p.desc}</p>
            <p className="text-sm text-[#0B5394] mb-4">{p.capacity} capacity</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">${p.price}</span>
              <Button size="sm" className="bg-[#F78309] hover:bg-[#F78309]/90">View</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// OPTION B: Comparison Style
function ProductShowcaseOptionB() {
  return (
    <div className="bg-slate-900 rounded-xl p-6 md:p-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Find Your Perfect Fit</h2>
        <p className="text-gray-400">Compare our ramp models side by side</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="text-gray-400 text-sm">
              <th className="text-left py-3 px-4">Model</th>
              <th className="text-center py-3 px-4">Capacity</th>
              <th className="text-center py-3 px-4">Length</th>
              <th className="text-center py-3 px-4">Price</th>
              <th className="text-center py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'AUN250', capacity: '2,500 lbs', length: '8 ft', price: 1299, highlight: true },
              { name: 'AUN210', capacity: '2,000 lbs', length: '7 ft', price: 999 },
              { name: 'AUN200', capacity: '1,500 lbs', length: '6 ft', price: 799 },
            ].map((p, i) => (
              <tr key={i} className={`border-t border-white/10 ${p.highlight ? 'bg-[#F78309]/10' : ''}`}>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center">
                      <img src={`${LIVE_SITE}/images/ramp6.webp`} alt="" className="max-h-8" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{p.name}</p>
                      {p.highlight && <span className="text-xs text-[#F78309]">Most Popular</span>}
                    </div>
                  </div>
                </td>
                <td className="text-center text-white py-4 px-4">{p.capacity}</td>
                <td className="text-center text-white py-4 px-4">{p.length}</td>
                <td className="text-center py-4 px-4">
                  <span className="text-xl font-bold text-white">${p.price}</span>
                </td>
                <td className="text-center py-4 px-4">
                  <Button size="sm" className={p.highlight ? 'bg-[#F78309] hover:bg-[#F78309]/90' : ''}>
                    Shop
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==============================================
// CTA SECTION ALTERNATIVES
// ==============================================

// CURRENT: Simple orange banner
function CTACurrent() {
  return (
    <div className="bg-[#F78309] rounded-xl py-10 px-6 text-center text-white">
      <h2 className="text-2xl md:text-3xl font-bold mb-3">Not Sure Which Ramp Is Right?</h2>
      <p className="text-lg mb-6 opacity-90">Use our configurator to find the perfect ramp for your setup.</p>
      <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
        Start Configurator
      </Button>
    </div>
  )
}

// OPTION A: Split CTA with Image
function CTAOptionA() {
  return (
    <div className="bg-gradient-to-r from-[#0B5394] to-[#0B5394]/80 rounded-xl overflow-hidden">
      <div className="grid md:grid-cols-2 gap-0">
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
            Need Help<br />Choosing?
          </h2>
          <p className="text-blue-100 mb-6">
            Our interactive configurator will find the perfect ramp based on your vehicle and motorcycle specs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90">
              Use Configurator
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10">
              <Phone className="w-4 h-4 mr-2" /> Call Us
            </Button>
          </div>
        </div>
        <div className="hidden md:block relative bg-black/20">
          <img src={`${LIVE_SITE}/revolution/assets/11.webp`} alt="" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B5394] to-transparent" />
        </div>
      </div>
    </div>
  )
}

// OPTION B: Steps CTA
function CTAOptionB() {
  return (
    <div className="bg-slate-900 rounded-xl py-10 px-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Get Your Perfect Ramp in 3 Steps</h2>
        <p className="text-gray-400">It only takes 2 minutes</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {[
          { step: 1, title: 'Enter Your Vehicle', desc: 'Truck, van, or trailer' },
          { step: 2, title: 'Add Your Bike Specs', desc: 'Weight and dimensions' },
          { step: 3, title: 'Get Recommendations', desc: 'Perfect match guaranteed' },
        ].map((s, i) => (
          <div key={i} className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F78309] text-white flex items-center justify-center text-xl font-bold">
              {s.step}
            </div>
            <h3 className="font-semibold text-white mb-1">{s.title}</h3>
            <p className="text-sm text-gray-400">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90 px-10">
          Start Now <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// OPTION C: Urgent/FOMO CTA
function CTAOptionC() {
  return (
    <div className="relative bg-black rounded-xl overflow-hidden">
      <img src={`${LIVE_SITE}/revolution/assets/12.webp`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <div className="relative z-10 py-12 px-6 text-center">
        <div className="inline-block bg-red-500 text-white text-sm font-bold px-4 py-1 rounded-full mb-4 animate-pulse">
          LIMITED TIME OFFER
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Save $200 on AUN250
        </h2>
        <p className="text-xl text-gray-300 mb-6">
          Free shipping + lifetime warranty included
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90 text-lg px-8">
            Shop Now - $1,299
          </Button>
          <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 text-lg px-8">
            Learn More
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-4">Offer ends soon. No code needed.</p>
      </div>
    </div>
  )
}

// ==============================================
// MAIN PAGE
// ==============================================

export default function HomepageDesignPreview() {
  const [activeSection, setActiveSection] = useState<'hero' | 'features' | 'products' | 'cta'>('hero')
  const [mobileView, setMobileView] = useState(true)

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Homepage Design Alternatives</h1>
          <p className="text-muted-foreground">Compare different design options for homepage sections</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setActiveSection('hero')} className={`px-4 py-2 text-sm font-medium ${activeSection === 'hero' ? 'bg-primary text-white' : 'hover:bg-muted'}`}>
              Hero
            </button>
            <button onClick={() => setActiveSection('features')} className={`px-4 py-2 text-sm font-medium ${activeSection === 'features' ? 'bg-primary text-white' : 'hover:bg-muted'}`}>
              Features
            </button>
            <button onClick={() => setActiveSection('products')} className={`px-4 py-2 text-sm font-medium ${activeSection === 'products' ? 'bg-primary text-white' : 'hover:bg-muted'}`}>
              Products
            </button>
            <button onClick={() => setActiveSection('cta')} className={`px-4 py-2 text-sm font-medium ${activeSection === 'cta' ? 'bg-primary text-white' : 'hover:bg-muted'}`}>
              CTA
            </button>
          </div>

          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setMobileView(true)} className={`px-4 py-2 text-sm font-medium ${mobileView ? 'bg-orange-500 text-white' : 'hover:bg-muted'}`}>
              📱 Mobile
            </button>
            <button onClick={() => setMobileView(false)} className={`px-4 py-2 text-sm font-medium ${!mobileView ? 'bg-orange-500 text-white' : 'hover:bg-muted'}`}>
              🖥️ Desktop
            </button>
          </div>
        </div>

        {/* Preview container */}
        <div className={`mx-auto ${mobileView ? 'max-w-[375px]' : 'max-w-[1000px]'} transition-all duration-300`}>
          <div className="bg-muted/20 rounded-2xl p-4 border-4 border-muted space-y-8">

            {/* Hero Section */}
            {activeSection === 'hero' && (
              <>
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center">Current: Rotating Slider</h2>
                  <HeroCurrent />
                </div>
                <div className="h-px bg-border" />
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-green-500">Option A: Split with Video</h2>
                  <HeroOptionA />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-blue-500">Option B: Centered with Stats</h2>
                  <HeroOptionB />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-purple-500">Option C: Bold Typography</h2>
                  <HeroOptionC />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-orange-500">Option D: Product-Focused</h2>
                  <HeroOptionD />
                </div>
              </>
            )}

            {/* Features Section */}
            {activeSection === 'features' && (
              <>
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center">Current: Simple Text</h2>
                  <FeaturesCurrent />
                </div>
                <div className="h-px bg-border" />
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-green-500">Option A: Icon Cards</h2>
                  <FeaturesOptionA />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-blue-500">Option B: Horizontal Scroll</h2>
                  <FeaturesOptionB />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-purple-500">Option C: Stats Bar</h2>
                  <FeaturesOptionC />
                </div>
              </>
            )}

            {/* Products Section */}
            {activeSection === 'products' && (
              <>
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center">Current: Two-Column</h2>
                  <ProductShowcaseCurrent />
                </div>
                <div className="h-px bg-border" />
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-green-500">Option A: Product Cards</h2>
                  <ProductShowcaseOptionA />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-blue-500">Option B: Comparison Table</h2>
                  <ProductShowcaseOptionB />
                </div>
              </>
            )}

            {/* CTA Section */}
            {activeSection === 'cta' && (
              <>
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center">Current: Simple Banner</h2>
                  <CTACurrent />
                </div>
                <div className="h-px bg-border" />
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-green-500">Option A: Split with Image</h2>
                  <CTAOptionA />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-blue-500">Option B: Steps CTA</h2>
                  <CTAOptionB />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-center text-purple-500">Option C: Urgency/FOMO</h2>
                  <CTAOptionC />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-center">Homepage Recommendations</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-card rounded-xl p-4 border">
              <h3 className="font-semibold text-green-500 mb-2">Hero</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Option A or B</strong> - Video/image focus increases engagement. Stats build trust.
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <h3 className="font-semibold text-blue-500 mb-2">Features</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Option B + C</strong> - Horizontal scroll for mobile, stats bar for social proof.
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <h3 className="font-semibold text-purple-500 mb-2">Products</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Option A</strong> - Card grid with badges drives clicks. Clear pricing.
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <h3 className="font-semibold text-orange-500 mb-2">CTA</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Option B</strong> - Steps CTA explains the configurator process clearly.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation to other preview */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-2">Also see configurator designs:</p>
          <Button variant="outline" asChild>
            <a href="/design-preview">View Configurator Alternatives →</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
