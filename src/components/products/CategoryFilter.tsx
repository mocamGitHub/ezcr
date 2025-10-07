'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ProductCategory } from '@/lib/supabase/queries'

interface CategoryFilterProps {
  categories: ProductCategory[]
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category')

  const handleCategoryClick = (categorySlug: string | null) => {
    if (categorySlug) {
      router.push(`/products?category=${categorySlug}`)
    } else {
      router.push('/products')
    }
  }

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryClick(null)}
          className={`px-4 py-2 rounded-full border-2 font-medium transition-colors ${
            !activeCategory
              ? 'border-[#0B5394] bg-[#0B5394] text-white'
              : 'border-gray-300 hover:border-[#0B5394] hover:text-[#0B5394]'
          }`}
        >
          All Products
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.slug)}
            className={`px-4 py-2 rounded-full border-2 font-medium transition-colors ${
              activeCategory === category.slug
                ? 'border-[#0B5394] bg-[#0B5394] text-white'
                : 'border-gray-300 hover:border-[#0B5394] hover:text-[#0B5394]'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  )
}
