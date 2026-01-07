'use client'

import { useEffect, useRef } from 'react'
import { trackEcommerceEvent } from './GoogleAnalytics'
import { trackMetaEvent } from './MetaPixel'

interface ProductViewTrackerProps {
  productId: string
  productName: string
  productSku?: string | null
  productPrice: number
  productCategory?: string | null
}

export function ProductViewTracker({
  productId,
  productName,
  productSku,
  productPrice,
  productCategory,
}: ProductViewTrackerProps) {
  const hasTracked = useRef(false)

  useEffect(() => {
    if (hasTracked.current) return
    hasTracked.current = true

    // Track view_item for GA4
    trackEcommerceEvent('view_item', {
      currency: 'USD',
      value: productPrice,
      items: [{
        item_id: productSku || productId,
        item_name: productName,
        price: productPrice,
        quantity: 1,
      }],
    })

    // Track ViewContent for Meta Pixel
    trackMetaEvent('ViewContent', {
      content_ids: [productSku || productId],
      content_name: productName,
      content_type: 'product',
      currency: 'USD',
      value: productPrice,
    })
  }, [productId, productName, productSku, productPrice, productCategory])

  return null
}
