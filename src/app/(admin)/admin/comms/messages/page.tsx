'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { RefreshCw, Mail, MessageSquare, ArrowUpRight, ArrowDownLeft, Search, X, Send } from 'lucide-react'
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
import { getMessages } from '../actions'

type Message = {
  id: string
  channel: string
  direction: string
  status: string
  provider: string
  to_address: string
  from_address: string | null
  subject: string | null
  text_body: string | null
  sent_at: string | null
  created_at: string
}

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [directionFilter, setDirectionFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>(searchParams?.get('status') || 'all')

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getMessages({
        channel: channelFilter,
        direction: directionFilter,
        status: statusFilter,
        search: searchQuery,
      })
      setMessages(data)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [channelFilter, directionFilter, statusFilter])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700'
      case 'sent': return 'bg-blue-100 text-blue-700'
      case 'failed': return 'bg-red-100 text-red-700'
      case 'bounced': return 'bg-orange-100 text-orange-700'
      case 'queued': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Send className="h-8 w-8" />
            Messages
          </h1>
          <p className="text-muted-foreground mt-1">
            View all sent and received messages
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>

          <Select value={directionFilter} onValueChange={setDirectionFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-card border rounded-lg">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-[72px]" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No messages found
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((msg) => (
              <div key={msg.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {msg.channel === 'email' ? (
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {msg.direction === 'outbound' ? (
                          <ArrowUpRight className="h-3 w-3 text-blue-500" />
                        ) : (
                          <ArrowDownLeft className="h-3 w-3 text-green-500" />
                        )}
                        <span className="font-medium">{msg.to_address}</span>
                      </div>
                      {msg.subject && (
                        <p className="text-sm text-muted-foreground">{msg.subject}</p>
                      )}
                      {msg.text_body && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {msg.text_body.substring(0, 150)}
                          {msg.text_body.length > 150 ? '...' : ''}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="uppercase">{msg.channel}</span>
                        <span>•</span>
                        <span>{msg.provider}</span>
                        <span>•</span>
                        <span>{new Date(msg.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(msg.status)}`}>
                    {msg.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
