'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Mail, MessageSquare, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [directionFilter, setDirectionFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getMessages({
        channel: channelFilter,
        direction: directionFilter,
        status: statusFilter,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">
            View all sent and received messages
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

          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
