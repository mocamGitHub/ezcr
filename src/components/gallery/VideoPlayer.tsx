'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Play, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface VideoPlayerProps {
  videoUrl: string
  videoProvider?: 'youtube' | 'vimeo' | 'direct' | null
  videoEmbedId?: string | null
  thumbnailUrl?: string | null
  title: string
  description?: string | null
  className?: string
}

export function VideoPlayer({
  videoUrl,
  videoProvider,
  videoEmbedId,
  thumbnailUrl,
  title,
  description,
  className,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const getEmbedUrl = () => {
    if (!videoProvider || !videoEmbedId) return videoUrl

    switch (videoProvider) {
      case 'youtube':
        return `https://www.youtube.com/embed/${videoEmbedId}?autoplay=1`
      case 'vimeo':
        return `https://player.vimeo.com/video/${videoEmbedId}?autoplay=1`
      default:
        return videoUrl
    }
  }

  return (
    <>
      {/* Video Thumbnail */}
      <div
        className={cn(
          "relative group cursor-pointer overflow-hidden rounded-lg bg-muted",
          className
        )}
        onClick={() => setIsPlaying(true)}
      >
        {/* Thumbnail Image */}
        {thumbnailUrl ? (
          <div className="relative aspect-video">
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <Play className="h-16 w-16 text-white/50" />
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="bg-white rounded-full p-4 shadow-lg transform transition-transform group-hover:scale-110">
            <Play className="h-8 w-8 text-[#0B5394] fill-current" />
          </div>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          {description && (
            <p className="text-white/80 text-sm line-clamp-2">{description}</p>
          )}
        </div>
      </div>

      {/* Video Modal */}
      <Dialog open={isPlaying} onOpenChange={setIsPlaying}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] w-full p-0 overflow-hidden"
          showCloseButton={false}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 text-white bg-black/50 hover:bg-black/70 rounded-full"
            onClick={() => setIsPlaying(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Video Player */}
          <div className="relative aspect-video w-full bg-black">
            <iframe
              src={getEmbedUrl()}
              title={title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Video Info */}
          {description && (
            <div className="p-4 bg-background">
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
