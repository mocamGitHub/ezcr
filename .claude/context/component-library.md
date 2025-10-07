# Component Library Reference

**Last Updated**: October 7, 2025  
**UI Library**: ShadCN UI  
**Styling**: Tailwind CSS  
**Animation**: Framer Motion

---

## Design System

### Color Tokens
```typescript
// tailwind.config.ts
colors: {
  'brand-black': '#1a1a1a',
  'brand-orange': '#ff6b35',
  'brand-silver': '#c0c0c0',
  'background': '#ffffff',
  'muted': '#f5f5f5',
}
```

### Typography Scale
```css
--text-base: 1rem;      /* 16px minimum */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
```

### Spacing Scale
```css
--spacing-4: 1rem;      /* 16px base */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-12: 3rem;     /* 48px */
```

---

## Core Components

### Button
```tsx
import { Button } from '@/components/ui/button'

// Variants
<Button variant="default">Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
<Button variant="destructive">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// With icon
<Button>
  <ShoppingCart className="mr-2 h-4 w-4" />
  Add to Cart
</Button>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Product Name</CardTitle>
    <CardDescription>Short description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Form Elements
```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

<div>
  <Label htmlFor="email">Email *</Label>
  <Input id="email" type="email" required />
</div>

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

## Layout Components

### Header
```tsx
// src/components/layout/Header.tsx
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center">
        {/* Logo, Navigation, Actions */}
      </div>
    </header>
  )
}
```

### Footer
```tsx
// src/components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        {/* Links, Contact Info, Newsletter */}
      </div>
    </footer>
  )
}
```

---

## Product Components

### ProductCard
```tsx
// src/components/products/ProductCard.tsx
interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <div className="aspect-square relative">
        <Image src={product.images[0]} alt={product.name} fill />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-2xl font-bold">${product.price}</p>
        <Button className="w-full">Add to Cart</Button>
      </CardContent>
    </Card>
  )
}
```

### ProductGrid
```tsx
// src/components/products/ProductGrid.tsx
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

---

## Form Components with Validation

### Using React Hook Form + Zod
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export function ContactForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema)
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input id="email" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <Button type="submit">Submit</Button>
    </form>
  )
}
```

---

## Interactive Components

### Loading Skeleton
```tsx
import { Skeleton } from '@/components/ui/skeleton'

export function ProductCardSkeleton() {
  return (
    <Card>
      <Skeleton className="aspect-square" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}
```

### Animation with Framer Motion
```tsx
import { motion } from 'framer-motion'

export function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
```

---

## Accessibility Patterns

### Focus Management
```tsx
// Always show focus indicators
className="focus:ring-2 focus:ring-brand-orange focus:outline-none"
```

### ARIA Labels
```tsx
<Button aria-label="Add AUN250 to cart">
  <ShoppingCart />
</Button>
```

### Screen Reader Text
```tsx
<span className="sr-only">Loading...</span>
```

---

## Responsive Patterns

### Mobile-First Grid
```tsx
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
```

### Responsive Typography
```tsx
className="text-2xl md:text-3xl lg:text-4xl"
```

### Show/Hide Elements
```tsx
className="hidden md:block"  // Hide on mobile, show on tablet+
className="md:hidden"         // Show on mobile, hide on tablet+
```

---

**All components must follow these patterns for consistency and accessibility.**