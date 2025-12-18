'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCw, Plus, Mail, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getTemplates } from '../actions'

type Template = {
  id: string
  name: string
  channel: string
  status: string
  active_version_id: string | null
  created_at: string
  updated_at: string
}

export default function TemplatesPage() {
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<Template[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'draft': return 'bg-yellow-100 text-yellow-700'
      case 'archived': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground mt-1">
            Manage email and SMS message templates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/admin/comms/templates/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </Link>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[140px] rounded-lg" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-card border rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">No templates yet</p>
          <Link href="/admin/comms/templates/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Template
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Link key={template.id} href={`/admin/comms/templates/${template.id}`}>
              <div className="bg-card border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {template.channel === 'email' ? (
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-xs uppercase text-muted-foreground">
                      {template.channel}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(template.status)}`}>
                    {template.status}
                  </span>
                </div>
                <h3 className="font-semibold mb-2">{template.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(template.updated_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
