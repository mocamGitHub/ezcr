'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface AnimatedCTAButtonProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function AnimatedCTAButton({ href, children, className = '' }: AnimatedCTAButtonProps) {
  return (
    <Link href={href} className={`group relative inline-flex items-center justify-center ${className}`}>
      {/* Outer container with rotating border */}
      <div className="relative rounded-lg p-[2px] overflow-hidden">
        {/* Rotating conic gradient border beam */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            overflow: 'visible',
          }}
        >
          <div
            style={{
              width: '200%',
              height: '0',
              paddingBottom: '200%',
              background: 'conic-gradient(from 0deg, transparent 0deg, transparent 170deg, #F78309 180deg, #F78309 200deg, #FFB347 210deg, white 215deg, transparent 220deg, transparent 360deg)',
              animation: 'beam-rotate 4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
          />
        </div>

        {/* Inner button content */}
        <div className="relative flex items-center gap-2 rounded-lg bg-gray-200 dark:bg-slate-900 border border-[#0B5394] px-8 py-3 h-[52px] text-lg font-medium text-foreground transition-all duration-300 group-hover:bg-gray-300 dark:group-hover:bg-slate-800">
          {/* Text content */}
          <span className="relative z-10">{children}</span>

          {/* Arrow icon */}
          <ArrowRight className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>

      {/* External glow on hover */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl bg-gradient-to-r from-[#F78309]/30 to-[#0B5394]/30 -z-10 scale-110" />
    </Link>
  )
}
