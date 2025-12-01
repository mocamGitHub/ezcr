// src/app/(marketing)/gallery/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const LIVE_SITE = 'https://ezcycleramp.com'

const galleryImages = [
  {
    src: '/images/hero/10.webp',
    alt: 'Motorcycle being loaded onto truck using EZ Cycle Ramp',
    category: 'In Action',
  },
  {
    src: '/images/hero/11.webp',
    alt: 'EZ Cycle Ramp setup demonstration',
    category: 'In Action',
  },
  {
    src: '/images/hero/12.webp',
    alt: 'Motorcycle on EZ Cycle Ramp',
    category: 'In Action',
  },
  {
    src: `${LIVE_SITE}/images/ramp6.webp`,
    alt: 'AUN250 Folding Ramp - Premium folding design',
    category: 'Products',
  },
  {
    src: `${LIVE_SITE}/images/ramp4.webp`,
    alt: 'AUN210 Standard Ramp - Heavy-duty construction',
    category: 'Products',
  },
  {
    src: `${LIVE_SITE}/images/ramp2.webp`,
    alt: 'AUN200 Basic Ramp - Reliable and affordable',
    category: 'Products',
  },
  {
    src: `${LIVE_SITE}/images/ramp1.webp`,
    alt: 'EZ Cycle Ramp product shot',
    category: 'Products',
  },
  {
    src: `${LIVE_SITE}/images/ramp3.webp`,
    alt: 'EZ Cycle Ramp detail view',
    category: 'Products',
  },
  {
    src: `${LIVE_SITE}/images/ramp5.webp`,
    alt: 'EZ Cycle Ramp configuration options',
    category: 'Products',
  },
]

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [filter, setFilter] = useState<string>('All')

  const categories = ['All', 'In Action', 'Products']
  const filteredImages = filter === 'All'
    ? galleryImages
    : galleryImages.filter(img => img.category === filter)

  const openLightbox = (index: number) => setSelectedImage(index)
  const closeLightbox = () => setSelectedImage(null)

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % filteredImages.length)
    }
  }

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + filteredImages.length) % filteredImages.length)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Gallery</h1>
          <p className="text-xl text-blue-100">
            See our ramps in action and explore our product lineup
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
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  filter === category
                    ? 'bg-[#0B5394] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImages.map((image, index) => (
              <div
                key={index}
                onClick={() => openLightbox(index)}
                className="group cursor-pointer relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden hover:shadow-xl transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end">
                  <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-sm font-medium">{image.alt}</p>
                    <span className="text-xs bg-[#F78309] px-2 py-1 rounded mt-1 inline-block">
                      {image.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div onClick={(e) => e.stopPropagation()} className="max-w-5xl max-h-[80vh] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={filteredImages[selectedImage].src}
              alt={filteredImages[selectedImage].alt}
              className="max-w-full max-h-[70vh] object-contain mx-auto"
            />
            <p className="text-white text-center mt-4">
              {filteredImages[selectedImage].alt}
            </p>
          </div>
        </div>
      )}

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
              <Link href="/configure">Configure Your Ramp</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
