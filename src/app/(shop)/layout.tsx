// src/app/(shop)/layout.tsx
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container py-8">
      {children}
    </div>
  )
}
