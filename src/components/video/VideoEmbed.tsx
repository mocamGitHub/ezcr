'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'

interface VideoEmbedProps {
  videoId: string
  title: string
  thumbnail?: string
  className?: string
}

/**
 * VideoEmbed - A YouTube video embed component with a play button overlay
 *
 * @param videoId - YouTube video ID
 * @param title - Video title for accessibility
 * @param thumbnail - Optional custom thumbnail URL (defaults to YouTube thumbnail)
 * @param className - Additional CSS classes
 */
export function VideoEmbed({ videoId, title, thumbnail, className = '' }: VideoEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const thumbnailUrl = thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  if (isPlaying) {
    return (
      <div className={`aspect-video rounded-xl overflow-hidden ${className}`}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsPlaying(true)}
      className={`relative aspect-video rounded-xl overflow-hidden group cursor-pointer w-full ${className}`}
      aria-label={`Play video: ${title}`}
    >
      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnailUrl}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => {
          // Fallback to medium quality if maxres fails
          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-[#F78309] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="white" />
        </div>
      </div>

      {/* Title overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-white font-medium text-sm md:text-base">{title}</p>
      </div>
    </button>
  )
}

interface VideoGalleryProps {
  videos: { videoId: string; title: string; thumbnail?: string }[]
  className?: string
}

/**
 * VideoGallery - A grid of video embeds
 */
export function VideoGallery({ videos, className = '' }: VideoGalleryProps) {
  if (videos.length === 0) return null

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      {videos.map((video, index) => (
        <VideoEmbed
          key={index}
          videoId={video.videoId}
          title={video.title}
          thumbnail={video.thumbnail}
        />
      ))}
    </div>
  )
}
