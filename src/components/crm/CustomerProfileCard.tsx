'use client'

import { useState, useEffect } from 'react'
import type { CustomerProfile, CustomerTag } from '@/types/crm'
import { HealthScoreBadge } from './HealthScoreBadge'
import { CustomerTagBadges } from './CustomerTagBadges'
import { formatCurrency } from '@/lib/utils'
import { getCustomerTags, addTagToCustomer, removeTagFromCustomer, calculateHealthScore } from '@/actions/crm'
import { toast } from 'sonner'

interface CustomerProfileCardProps {
  customer: CustomerProfile
  onUpdate: () => void
}

export function CustomerProfileCard({ customer, onUpdate }: CustomerProfileCardProps) {
  const [availableTags, setAvailableTags] = useState<CustomerTag[]>([])
  const [showTagMenu, setShowTagMenu] = useState(false)
  const [refreshingScore, setRefreshingScore] = useState(false)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      const tags = await getCustomerTags()
      setAvailableTags(tags)
    } catch (err) {
      console.error('Failed to load tags:', err)
    }
  }

  const handleAddTag = async (tagId: string) => {
    try {
      await addTagToCustomer(customer.customer_email, tagId)
      onUpdate()
      setShowTagMenu(false)
    } catch (err) {
      console.error('Failed to add tag:', err)
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    try {
      await removeTagFromCustomer(customer.customer_email, tagId)
      onUpdate()
    } catch (err) {
      console.error('Failed to remove tag:', err)
    }
  }

  const handleRefreshHealthScore = async () => {
    try {
      setRefreshingScore(true)
      await calculateHealthScore(customer.customer_email)
      onUpdate()
    } catch (err) {
      console.error('Failed to refresh health score:', err)
    } finally {
      setRefreshingScore(false)
    }
  }

  const customerTags = customer.tags || []
  const assignedTagIds = customerTags.map(t => t.id)
  const unassignedTags = availableTags.filter(t => !assignedTagIds.includes(t.id))

  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="flex items-start justify-between">
        {/* Left: Customer Info */}
        <div className="flex-1">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
              {customer.name?.charAt(0).toUpperCase() || customer.customer_email.charAt(0).toUpperCase()}
            </div>

            {/* Details */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{customer.name || 'Unknown'}</h1>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>📧</span>
                  <a href={`mailto:${customer.customer_email}`} className="hover:underline">
                    {customer.customer_email}
                  </a>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <a href={`tel:${customer.phone}`} className="hover:underline">
                      {customer.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="mt-3 flex items-center gap-2">
                <CustomerTagBadges tags={customerTags} maxDisplay={10} />
                <div className="relative">
                  <button
                    onClick={() => setShowTagMenu(!showTagMenu)}
                    className="px-2 py-1 text-xs border rounded hover:bg-muted transition-colors"
                  >
                    + Tag
                  </button>
                  
                  {showTagMenu && (
                    <div className="absolute left-0 top-full mt-1 w-48 bg-card border rounded-lg shadow-lg z-10">
                      <div className="p-2 max-h-64 overflow-y-auto">
                        {unassignedTags.length === 0 ? (
                          <div className="text-sm text-muted-foreground text-center py-2">
                            All tags assigned
                          </div>
                        ) : (
                          unassignedTags.map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => handleAddTag(tag.id)}
                              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                            >
                              <span
                                className="inline-block w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: tag.color }}
                              ></span>
                              {tag.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Remove tag buttons */}
              {customerTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {customerTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleRemoveTag(tag.id)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      title={`Remove ${tag.name} tag`}
                    >
                      ✕ {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="flex gap-4">
          {/* Health Score */}
          <div className="flex flex-col items-center">
            <div className="text-xs text-muted-foreground mb-1">Health Score</div>
            {customer.health_score !== undefined ? (
              <HealthScoreBadge score={customer.health_score} />
            ) : (
              <div className="text-xs text-muted-foreground">Not calculated</div>
            )}
            <button
              onClick={handleRefreshHealthScore}
              disabled={refreshingScore}
              className="mt-2 text-xs text-primary hover:underline disabled:opacity-50"
            >
              {refreshingScore ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
        <div>
          <div className="text-2xl font-bold">{customer.order_count}</div>
          <div className="text-xs text-muted-foreground">Total Orders</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{formatCurrency(customer.lifetime_value)}</div>
          <div className="text-xs text-muted-foreground">Lifetime Value</div>
        </div>
        <div>
          <div className="text-2xl font-bold">
            {customer.last_order_date
              ? new Date(customer.last_order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Never'}
          </div>
          <div className="text-xs text-muted-foreground">Last Order</div>
        </div>
        <div>
          <div className="text-2xl font-bold">
            {customer.first_order_date
              ? new Date(customer.first_order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Unknown'}
          </div>
          <div className="text-xs text-muted-foreground">First Order</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-6 pt-6 border-t">
        <a
          href={`mailto:${customer.customer_email}`}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          📧 Send Email
        </a>
        {customer.phone && (
          <a
            href={`tel:${customer.phone}`}
            className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted transition-colors"
          >
            📞 Call
          </a>
        )}
        <button
          onClick={() => {
            navigator.clipboard.writeText(customer.customer_email)
            toast.success('Email copied to clipboard')
          }}
          className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted transition-colors"
        >
          📋 Copy Email
        </button>
      </div>
    </div>
  )
}
