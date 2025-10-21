'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ImageLightbox } from './ImageLightbox'
import { Expand } from 'lucide-react'

interface ProductImage {
  id: string
  url: string
  alt_text?: string | null
  is_primary?: boolean
  display_order?: number
}

interface ProductImageGalleryProps {
  images: ProductImage[]
  productName: string
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Sort images: primary first, then by display_order
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return (a.display_order || 0) - (b.display_order || 0)
  })

  const mainImage = sortedImages[selectedImageIndex] || sortedImages[0]

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index)
    setLightboxOpen(true)
  }

  if (!sortedImages.length) {
    return (
      <div className="aspect-square relative bg-muted rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-muted-foreground">No Image Available</div>
      </div>
    )
  }

  return (
    <div>
      {/* Main Image */}
      <div className="relative group">
        <div
          className="aspect-square relative bg-muted rounded-lg overflow-hidden mb-4 cursor-pointer"
          onClick={() => openLightbox(selectedImageIndex)}
        >
          <Image
            src={mainImage.url}
            alt={mainImage.alt_text || productName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority
          />
          {/* Hover overlay with expand icon */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white rounded-full p-3">
                <Expand className="h-6 w-6 text-gray-900" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail Gallery */}
      {sortedImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedImageIndex(index)}
              onDoubleClick={() => openLightbox(index)}
              className={cn(
                "aspect-square relative bg-muted rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer",
                index === selectedImageIndex
                  ? "border-[#0B5394] ring-2 ring-[#0B5394]/30"
                  : "border-transparent hover:border-[#0B5394]/50"
              )}
            >
              <Image
                src={image.url}
                alt={image.alt_text || `${productName} - Image ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={sortedImages}
        initialIndex={selectedImageIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  )
}
