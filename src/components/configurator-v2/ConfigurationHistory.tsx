'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trash2, ExternalLink, Calendar, DollarSign, Package } from 'lucide-react'
import { formatDistance } from 'date-fns'

interface SavedConfiguration {
  id: string
  name: string
  configuration: any
  calculated_price: number
  created_at: string
  updated_at: string
  is_saved: boolean
}

export function ConfigurationHistory() {
  const router = useRouter()
  const [configurations, setConfigurations] = useState<SavedConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchConfigurations()
  }, [])

  const fetchConfigurations = async () => {
    try {
      const response = await fetch('/api/configurator/save')
      if (response.ok) {
        const data = await response.json()
        setConfigurations(data.configurations || [])
      }
    } catch (error) {
      console.error('Error fetching configurations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoad = (id: string) => {
    router.push(`/configure?load=${id}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/configurator/delete/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setConfigurations((prev) => prev.filter((config) => config.id !== id))
      } else {
        alert('Failed to delete configuration')
      }
    } catch (error) {
      console.error('Error deleting configuration:', error)
      alert('Failed to delete configuration')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading configurations...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/configure">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Configurator
            </Button>
          </Link>

          <h1 className="text-4xl font-bold mb-2">Configuration History</h1>
          <p className="text-lg text-muted-foreground">
            View and manage your saved ramp configurations
          </p>
        </div>

        {/* Configurations Grid */}
        {configurations.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Saved Configurations</h2>
            <p className="text-muted-foreground mb-6">
              Start configuring your ramp and save your progress to see it here.
            </p>
            <Link href="/configure">
              <Button className="gap-2">
                <Package className="h-4 w-4" />
                Start Configuring
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configurations.map((config) => (
              <div
                key={config.id}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                {/* Config Name */}
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                  {config.name || 'Untitled Configuration'}
                </h3>

                {/* Price */}
                <div className="flex items-center gap-2 text-2xl font-bold text-primary mb-4">
                  <DollarSign className="h-5 w-5" />
                  {config.calculated_price.toFixed(2)}
                </div>

                {/* Meta Info */}
                <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Saved {formatDistance(new Date(config.created_at), new Date(), { addSuffix: true })}
                    </span>
                  </div>
                  {config.configuration?.vehicle && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="capitalize">{config.configuration.vehicle}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleLoad(config.id)}
                    className="flex-1 gap-2"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Load
                  </Button>
                  <Button
                    onClick={() => handleDelete(config.id)}
                    variant="outline"
                    size="sm"
                    disabled={deletingId === config.id}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingId === config.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
