'use client'

import { Star, ThumbsUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface TestimonialCardProps {
  id: string
  customerName: string
  customerLocation?: string
  title?: string
  content: string
  rating: number
  helpfulCount: number
  createdAt: Date
  isFeatured?: boolean
  productName?: string
  onVoteHelpful?: (testimonialId: string) => Promise<void>
}

export function TestimonialCard({
  id,
  customerName,
  customerLocation,
  title,
  content,
  rating,
  helpfulCount,
  createdAt,
  isFeatured = false,
  productName,
  onVoteHelpful,
}: TestimonialCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [localHelpfulCount, setLocalHelpfulCount] = useState(helpfulCount)
  const [hasVoted, setHasVoted] = useState(false)

  const handleVoteHelpful = async () => {
    if (isVoting || hasVoted) return

    setIsVoting(true)
    try {
      await onVoteHelpful?.(id)
      setLocalHelpfulCount(prev => prev + 1)
      setHasVoted(true)
    } catch (error) {
      console.error('Failed to vote:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`h-full ${isFeatured ? 'border-[#F78309] border-2' : ''}`}>
        <CardContent className="p-6">
          {/* Header with Rating and Featured Badge */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < rating
                      ? 'fill-[#F78309] text-[#F78309]'
                      : 'fill-muted text-muted'
                  }`}
                />
              ))}
            </div>
            {isFeatured && (
              <Badge className="bg-[#F78309] text-white">Featured</Badge>
            )}
          </div>

          {/* Title */}
          {title && (
            <h3 className="font-semibold text-lg mb-3 line-clamp-2">{title}</h3>
          )}

          {/* Content */}
          <p className="text-muted-foreground mb-4 line-clamp-4">{content}</p>

          {/* Product Reference */}
          {productName && (
            <div className="mb-4">
              <Badge variant="outline" className="text-xs">
                Product: {productName}
              </Badge>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            {/* Customer Info */}
            <div>
              <p className="font-medium text-sm">{customerName}</p>
              {customerLocation && (
                <p className="text-xs text-muted-foreground">{customerLocation}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(createdAt)}
              </p>
            </div>

            {/* Helpful Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoteHelpful}
                disabled={isVoting || hasVoted}
                className={`gap-2 ${hasVoted ? 'text-[#0B5394]' : ''}`}
              >
                <ThumbsUp className={`h-4 w-4 ${hasVoted ? 'fill-current' : ''}`} />
                <span className="text-xs">
                  Helpful ({localHelpfulCount})
                </span>
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
