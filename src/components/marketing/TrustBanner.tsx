'use client'

// Parallax Trust Banner
// Full-width section with parallax background and trust stats
// Light mode: Light gradient with subtle texture
// Dark mode: Dark gradient with depth

import { useEffect, useRef, useState } from 'react'

interface Stat {
  value: string
  label: string
}

const STATS: Stat[] = [
  { value: '1,200', label: 'lb Capacity' },
  { value: '2', label: 'Year Warranty' },
  { value: 'A+', label: 'BBB Rating' },
  { value: '10K+', label: 'Riders Trust Us' },
]

export function TrustBanner() {
  const sectionRef = useRef<HTMLElement>(null)
  const [parallaxOffset, setParallaxOffset] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect()
        const windowHeight = window.innerHeight

        // Check if section is in view
        if (rect.top < windowHeight && rect.bottom > 0) {
          setIsVisible(true)

          // Calculate parallax: how far into view the section is
          // Range from -1 (just entering bottom) to 1 (just leaving top)
          const scrollProgress = 1 - (rect.top / windowHeight)
          // Multiply by pixels to move (negative moves up as you scroll down)
          const offset = scrollProgress * 100
          setParallaxOffset(offset)
        } else {
          setIsVisible(false)
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative h-[400px] md:h-[450px] lg:h-[500px] overflow-hidden"
    >
      {/* === LIGHT MODE BACKGROUND === */}
      <div
        className="absolute inset-0 w-full h-[200%] -top-[50%] dark:hidden"
        style={{
          transform: `translateY(${parallaxOffset}px)`,
          willChange: 'transform',
          transition: 'transform 0.1s ease-out',
        }}
      >
        {/* Light mode gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-amber-100/50 to-slate-300" />

        {/* Geometric pattern overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Radial glow */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-200/40 rounded-full blur-3xl" />
        </div>
      </div>

      {/* === DARK MODE BACKGROUND === */}
      <div
        className="absolute inset-0 w-full h-[200%] -top-[50%] hidden dark:block"
        style={{
          transform: `translateY(${parallaxOffset}px)`,
          willChange: 'transform',
          transition: 'transform 0.1s ease-out',
        }}
      >
        {/* Dark mode gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-slate-950 to-zinc-900" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 0h40v1H0zM0 0h1v40H0z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Ambient glow spots */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        {/* Noise texture for depth */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Gradient fade edges - match adjacent sections */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-zinc-100 dark:from-zinc-950 to-transparent z-10" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-100 dark:from-gray-900 to-transparent z-10" />

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center px-4">
        {/* Headline */}
        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-800 dark:text-white text-center mb-4"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease-out',
          }}
        >
          Built for Real Riders
        </h2>

        {/* Subheadline */}
        <p
          className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 text-center mb-10 md:mb-14 max-w-2xl"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease-out 0.1s',
          }}
        >
          Trusted by thousands of motorcycle enthusiasts across America
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 max-w-4xl w-full">
          {STATS.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
                transition: `all 0.6s ease-out ${0.2 + index * 0.1}s`,
              }}
            >
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-amber-500 dark:text-amber-400 mb-2">
                {stat.value}
              </div>
              <div className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TrustBanner
