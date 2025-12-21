'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  RefreshCw,
  Mail,
  MessageSquare,
  Send,
  Users,
  Inbox,
  FileText,
  ChevronRight,
  Search,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCommsStats } from './actions'

type CommsStats = {
  totalMessages: number
  sentToday: number
  emailsSent: number
  smsSent: number
  totalContacts: number
  totalTemplates: number
  recentMessages: Array<{
    id: string
    channel: string
    direction: string
    status: string
    to_address: string
    subject: string | null
    created_at: string
  }>
}

export default function CommsOverviewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CommsStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getCommsStats()
      setStats(data)
    } catch (error) {
      console.error('Error fetching comms stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/admin/comms/messages?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    if (status !== 'all') {
      router.push(`/admin/comms/messages?status=${status}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Mail className="h-8 w-8" />
            Communications
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage email and SMS messaging
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Quick Filter */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer email or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/comms/inbox">
            <div className="bg-card border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-2">
                <Inbox className="h-6 w-6 text-primary" />
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold">Inbox</h3>
              <p className="text-sm text-muted-foreground">View conversations</p>
            </div>
          </Link>
          <Link href="/admin/comms/templates">
            <div className="bg-card border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-2">
                <FileText className="h-6 w-6 text-primary" />
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold">Templates</h3>
              <p className="text-sm text-muted-foreground">Email & SMS templates</p>
            </div>
          </Link>
          <Link href="/admin/comms/messages">
            <div className="bg-card border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-2">
                <Send className="h-6 w-6 text-primary" />
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold">Messages</h3>
              <p className="text-sm text-muted-foreground">View sent messages</p>
            </div>
          </Link>
          <Link href="/admin/comms/contacts">
            <div className="bg-card border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-6 w-6 text-primary" />
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold">Contacts</h3>
              <p className="text-sm text-muted-foreground">Manage contacts</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-[100px] rounded-lg" />
              ))}
            </>
          ) : (
            <>
              <div className="bg-muted/50 border rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <Send className="h-4 w-4" />
                  <span className="text-sm">Total Messages</span>
                </div>
                <p className="text-3xl font-bold">{stats?.totalMessages || 0}</p>
              </div>
              <div className="bg-muted/50 border rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Emails Sent</span>
                </div>
                <p className="text-3xl font-bold">{stats?.emailsSent || 0}</p>
              </div>
              <div className="bg-muted/50 border rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">SMS Sent</span>
                </div>
                <p className="text-3xl font-bold">{stats?.smsSent || 0}</p>
              </div>
              <div className="bg-muted/50 border rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Contacts</span>
                </div>
                <p className="text-3xl font-bold">{stats?.totalContacts || 0}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Messages</h3>
          <Link href="/admin/comms/messages">
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[48px]" />
            ))}
          </div>
        ) : stats?.recentMessages.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats?.recentMessages.map((msg) => (
              <Link
                key={msg.id}
                href={`/admin/comms/messages?search=${encodeURIComponent(msg.to_address)}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  {msg.channel === 'email' ? (
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{msg.to_address}</p>
                    <p className="text-xs text-muted-foreground">
                      {msg.subject || (msg.channel === 'sms' ? 'SMS' : 'No subject')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    msg.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' :
                    msg.status === 'sent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' :
                    msg.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {msg.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
