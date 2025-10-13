import type { CustomerTag } from '@/types/crm'

interface CustomerTagBadgesProps {
  tags: CustomerTag[]
  maxDisplay?: number
}

export function CustomerTagBadges({ tags, maxDisplay = 3 }: CustomerTagBadgesProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  const displayTags = tags.slice(0, maxDisplay)
  const remainingCount = tags.length - maxDisplay

  return (
    <div className="flex flex-wrap gap-1">
      {displayTags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full text-white"
          style={{ backgroundColor: tag.color }}
          title={tag.description}
        >
          {tag.name}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
          +{remainingCount}
        </span>
      )}
    </div>
  )
}
