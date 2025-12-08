// src/app/(marketing)/gallery/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChatCTA } from '@/components/chat/ChatCTA'
import { X, ChevronLeft, ChevronRight, Play, Image as ImageIcon, Video } from 'lucide-react'

const LIVE_SITE = 'https://ezcycleramp.com'

interface GalleryItem {
  src: string
  alt: string
  category: string
  type: 'image' | 'video'
  thumbnail?: string
  videoId?: string
}

const galleryItems: GalleryItem[] = [
  // In Action - Customer Photos
  {
    src: '/images/hero/10.webp',
    alt: 'Motorcycle being loaded onto truck using EZ Cycle Ramp',
    category: 'In Action',
    type: 'image',
  },
  {
    src: '/images/hero/11.webp',
    alt: 'EZ Cycle Ramp setup demonstration',
    category: 'In Action',
    type: 'image',
  },
  {
    src: '/images/hero/12.webp',
    alt: 'Motorcycle on EZ Cycle Ramp',
    category: 'In Action',
    type: 'image',
  },
  // Products
  {
    src: `${LIVE_SITE}/images/ramp6.webp`,
    alt: 'AUN250 Folding Ramp - Premium folding design',
    category: 'Products',
    type: 'image',
  },
  {
    src: `${LIVE_SITE}/images/ramp4.webp`,
    alt: 'AUN210 Standard Ramp - Heavy-duty construction',
    category: 'Products',
    type: 'image',
  },
  {
    src: `${LIVE_SITE}/images/ramp2.webp`,
    alt: 'AUN200 Basic Ramp - Reliable and affordable',
    category: 'Products',
    type: 'image',
  },
  {
    src: `${LIVE_SITE}/images/ramp1.webp`,
    alt: 'EZ Cycle Ramp product shot',
    category: 'Products',
    type: 'image',
  },
  {
    src: `${LIVE_SITE}/images/ramp3.webp`,
    alt: 'EZ Cycle Ramp detail view',
    category: 'Products',
    type: 'image',
  },
  {
    src: `${LIVE_SITE}/images/ramp5.webp`,
    alt: 'EZ Cycle Ramp configuration options',
    category: 'Products',
    type: 'image',
  },
  // Installation Videos (YouTube embeds)
  {
    src: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder - replace with actual video
    alt: 'How to Set Up Your EZ Cycle Ramp',
    category: 'Videos',
    type: 'video',
    thumbnail: '/images/hero/10.webp',
    videoId: 'dQw4w9WgXcQ',
  },
  {
    src: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder - replace with actual video
    alt: 'Loading a Heavy Cruiser Solo',
    category: 'Videos',
    type: 'video',
    thumbnail: '/images/hero/11.webp',
    videoId: 'dQw4w9WgXcQ',
  },
]

export default function GalleryPage() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [filter, setFilter] = useState<string>('All')
  const [showVideo, setShowVideo] = useState(false)

  const categories = ['All', 'In Action', 'Products', 'Videos']
  const filteredItems = filter === 'All'
    ? galleryItems
    : galleryItems.filter(item => item.category === filter)

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
    setShowVideo(false)
  }

  const closeLightbox = useCallback(() => {
    setSelectedIndex(null)
    setShowVideo(false)
  }, [])

  const nextImage = useCallback(() => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % filteredItems.length)
      setShowVideo(false)
    }
  }, [selectedIndex, filteredItems.length])

  const prevImage = useCallback(() => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + filteredItems.length) % filteredItems.length)
      setShowVideo(false)
    }
  }, [selectedIndex, filteredItems.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return

      switch (e.key) {
        case 'Escape':
          closeLightbox()
          break
        case 'ArrowLeft':
          prevImage()
          break
        case 'ArrowRight':
          nextImage()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, closeLightbox, nextImage, prevImage])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedIndex])

  const currentItem = selectedIndex !== null ? filteredItems[selectedIndex] : null

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Gallery</h1>
          <p className="text-xl text-blue-100">
            See our ramps in action, explore products, and watch installation videos
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="py-8 bg-muted/50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                  filter === category
                    ? 'bg-[#0B5394] text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-700'
                }`}
              >
                {category === 'Videos' && <Video className="w-4 h-4" />}
                {category === 'Products' && <ImageIcon className="w-4 h-4" />}
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No items in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item, index) => (
                <div
                  key={index}
                  onClick={() => openLightbox(index)}
                  className="group cursor-pointer relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.type === 'video' ? item.thumbnail : item.src}
                    alt={item.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Video play icon overlay */}
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-[#F78309] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-white ml-1" fill="white" />
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end">
                    <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-sm font-medium">{item.alt}</p>
                      <span className="text-xs bg-[#F78309] px-2 py-1 rounded mt-1 inline-block">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {selectedIndex !== null && currentItem && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation buttons */}
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Content */}
          <div onClick={(e) => e.stopPropagation()} className="max-w-5xl max-h-[80vh] p-4 w-full">
            {currentItem.type === 'video' ? (
              <div className="relative">
                {!showVideo ? (
                  <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentItem.thumbnail}
                      alt={currentItem.alt}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setShowVideo(true)}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-20 h-20 bg-[#F78309] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                        <Play className="w-10 h-10 text-white ml-1" fill="white" />
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="aspect-video">
                    <iframe
                      src={`${currentItem.src}?autoplay=1`}
                      title={currentItem.alt}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={currentItem.src}
                alt={currentItem.alt}
                className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
              />
            )}
            <div className="text-white text-center mt-4">
              <p className="text-lg">{currentItem.alt}</p>
              <p className="text-sm text-gray-400 mt-1">
                {selectedIndex + 1} of {filteredItems.length} • Use arrow keys to navigate
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat CTA */}
      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ChatCTA
            variant="banner"
            title="Questions About Our Ramps?"
            description="Ask Charli about any product you see in the gallery, or get help finding the right ramp for your setup."
            buttonText="Chat with Charli"
            showIcon={true}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Your Ramp?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Browse our full product lineup or configure your perfect ramp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90">
              <Link href="/products">Shop All Ramps</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/configure-smooth">Configure Your Ramp</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
