'use client'

import { useState } from 'react'
import Image from 'next/image'
import { GalleryItem } from '@/lib/supabase/queries'
import { ImageLightbox } from './ImageLightbox'
import { VideoPlayer } from './VideoPlayer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, Video } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GalleryGridProps {
  items: GalleryItem[]
  columns?: 2 | 3 | 4
  showFilters?: boolean
}

export function GalleryGrid({ items, columns = 3, showFilters = true }: GalleryGridProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all')

  // Filter items
  const filteredItems = items.filter(item => {
    if (filter === 'all') return true
    return item.item_type === filter
  })

  // Get only images for lightbox
  const imageItems = filteredItems.filter(item => item.item_type === 'image')

  const openLightbox = (itemId: string) => {
    const index = imageItems.findIndex(item => item.id === itemId)
    if (index !== -1) {
      setSelectedImageIndex(index)
      setLightboxOpen(true)
    }
  }

  const gridColumns = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  return (
    <div>
      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({items.length})
            </Button>
            <Button
              variant={filter === 'image' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('image')}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Images ({items.filter(i => i.item_type === 'image').length})
            </Button>
            <Button
              variant={filter === 'video' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('video')}
            >
              <Video className="h-4 w-4 mr-2" />
              Videos ({items.filter(i => i.item_type === 'video').length})
            </Button>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      <div className={cn('grid gap-6', gridColumns[columns])}>
        {filteredItems.map((item) => (
          <div key={item.id} className="group">
            {item.item_type === 'image' ? (
              <div
                className="relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer"
                onClick={() => openLightbox(item.id)}
              >
                <Image
                  src={item.image_url || ''}
                  alt={item.alt_text || item.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {item.is_featured && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-[#F78309] text-white">Featured</Badge>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-white font-semibold">{item.title}</h3>
                  {item.caption && (
                    <p className="text-white/80 text-sm line-clamp-2">{item.caption}</p>
                  )}
                </div>
              </div>
            ) : (
              <VideoPlayer
                videoUrl={item.video_url || ''}
                videoProvider={item.video_provider}
                videoEmbedId={item.video_embed_id}
                thumbnailUrl={item.thumbnail_url}
                title={item.title}
                description={item.description}
              />
            )}

            {/* Item Info */}
            <div className="mt-2">
              <h3 className="font-semibold text-sm">{item.title}</h3>
              {item.gallery_category && (
                <p className="text-xs text-muted-foreground">
                  {item.gallery_category.name}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No items found</p>
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={imageItems.map(item => ({
          id: item.id,
          url: item.image_url || '',
          alt_text: item.alt_text,
          caption: item.caption,
        }))}
        initialIndex={selectedImageIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  )
}
