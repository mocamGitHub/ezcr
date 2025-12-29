import { LucideIcon } from 'lucide-react'
import { Button } from './button'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="border rounded-lg p-8 sm:p-12 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
        {description}
      </p>
      {action && (
        action.href ? (
          <Button asChild variant="outline">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : action.onClick ? (
          <Button variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        ) : null
      )}
    </div>
  )
}

// Inline version for table cells
interface EmptyStateInlineProps {
  colSpan: number
  icon?: LucideIcon
  message: string
}

export function EmptyStateInline({ colSpan, icon: Icon, message }: EmptyStateInlineProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-12">
        <div className="flex flex-col items-center gap-2">
          {Icon && (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <p className="text-muted-foreground">{message}</p>
        </div>
      </td>
    </tr>
  )
}
