import * as React from "react"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  // Build full items list with Home
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: "Home", href: "/" }, ...items]
    : items

  return (
    <>
      {/* Schema.org BreadcrumbList for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: allItems.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.label,
              ...(item.href && { item: `https://ezcycleramp.com${item.href}` }),
            })),
          }),
        }}
      />

      {/* Visual breadcrumb navigation */}
      <nav
        aria-label="Breadcrumb"
        className={cn("flex items-center text-sm text-muted-foreground", className)}
      >
        <ol className="flex items-center flex-wrap gap-1">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1

            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" aria-hidden="true" />
                )}

                {isLast || !item.href ? (
                  <span
                    className={cn(
                      "px-1 py-0.5",
                      isLast && "font-medium text-foreground"
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {index === 0 && showHome ? (
                      <span className="flex items-center gap-1">
                        <Home className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">{item.label}</span>
                      </span>
                    ) : (
                      item.label
                    )}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="px-1 py-0.5 hover:text-foreground transition-colors rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    {index === 0 && showHome ? (
                      <span className="flex items-center gap-1">
                        <Home className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">{item.label}</span>
                      </span>
                    ) : (
                      item.label
                    )}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
