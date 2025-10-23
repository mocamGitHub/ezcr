'use client'

import Lottie from 'lottie-react'
import loadingAnimation from '@/public/animations/loading.json'

interface LoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
}

export function LoadingAnimation({ size = 'md', className = '' }: LoadingAnimationProps) {
  return (
    <div className={`${sizeMap[size]} ${className}`}>
      <Lottie
        animationData={loadingAnimation}
        loop={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
