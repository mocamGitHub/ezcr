'use client'

import { DEFAULT_SEGMENTS } from '@/types/crm'

interface CustomerSegmentTabsProps {
  activeSegment: string
  onSegmentChange: (segmentId: string) => void
}

export function CustomerSegmentTabs({ activeSegment, onSegmentChange }: CustomerSegmentTabsProps) {
  const allSegments = [
    { id: 'all', name: 'All Customers', description: 'View all customers' },
    ...DEFAULT_SEGMENTS,
  ]

  return (
    <div className="border-b">
      <div className="flex gap-1 overflow-x-auto">
        {allSegments.map((segment) => (
          <button
            key={segment.id}
            onClick={() => onSegmentChange(segment.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeSegment === segment.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
            }`}
            title={segment.description}
          >
            {segment.name}
          </button>
        ))}
      </div>
    </div>
  )
}
