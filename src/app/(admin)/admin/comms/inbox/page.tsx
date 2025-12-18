'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCw, Mail, MessageSquare, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getConversations } from '../actions'

type Conversation = {
  id: string
  channel: string
  subject: string | null
  status: string
  created_at: string
  updated_at: string
  contact: {
    id: string
    email: string | null
    phone_e164: string | null
    display_name: string | null
  } | null
  message_count: number
  last_message: {
    text_body: string | null
    direction: string
    created_at: string
  } | null
}

export default function InboxPage() {
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getConversations({
        channel: channelFilter,
        status: statusFilter,
      })
      setConversations(data)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [channelFilter, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700'
      case 'closed': return 'bg-gray-100 text-gray-700'
      case 'archived': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Inbox</h1>
          <p className="text-muted-foreground mt-1">
            View and manage conversations
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-card border rounded-lg">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-[80px]" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <Link key={conv.id} href={`/admin/comms/inbox/${conv.id}`}>
                <div className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-1">
                        {conv.channel === 'email' ? (
                          <Mail className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">
                            {conv.contact?.display_name || conv.contact?.email || conv.contact?.phone_e164 || 'Unknown'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(conv.status)}`}>
                            {conv.status}
                          </span>
                        </div>
                        {conv.subject && (
                          <p className="text-sm font-medium truncate">{conv.subject}</p>
                        )}
                        {conv.last_message?.text_body && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.last_message.direction === 'inbound' ? '← ' : '→ '}
                            {conv.last_message.text_body.substring(0, 100)}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{conv.message_count} message{conv.message_count !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{new Date(conv.updated_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
