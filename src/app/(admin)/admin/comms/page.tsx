'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCw, Mail, MessageSquare, Send, Users, Inbox, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CommsStats | null>(null)

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Communications</h1>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/admin/comms/inbox">
          <div className="bg-card border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer">
            <Inbox className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">Inbox</h3>
            <p className="text-sm text-muted-foreground">View conversations</p>
          </div>
        </Link>
        <Link href="/admin/comms/templates">
          <div className="bg-card border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer">
            <FileText className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">Templates</h3>
            <p className="text-sm text-muted-foreground">Email & SMS templates</p>
          </div>
        </Link>
        <Link href="/admin/comms/messages">
          <div className="bg-card border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer">
            <Send className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">Messages</h3>
            <p className="text-sm text-muted-foreground">View sent messages</p>
          </div>
        </Link>
        <Link href="/admin/comms/contacts">
          <div className="bg-card border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer">
            <Users className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">Contacts</h3>
            <p className="text-sm text-muted-foreground">Manage contacts</p>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[100px] rounded-lg" />
            ))}
          </>
        ) : (
          <>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Send className="h-4 w-4" />
                <span className="text-sm">Total Messages</span>
              </div>
              <p className="text-2xl font-bold">{stats?.totalMessages || 0}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Mail className="h-4 w-4" />
                <span className="text-sm">Emails Sent</span>
              </div>
              <p className="text-2xl font-bold">{stats?.emailsSent || 0}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">SMS Sent</span>
              </div>
              <p className="text-2xl font-bold">{stats?.smsSent || 0}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">Contacts</span>
              </div>
              <p className="text-2xl font-bold">{stats?.totalContacts || 0}</p>
            </div>
          </>
        )}
      </div>

      {/* Recent Messages */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Messages</h3>
          <Link href="/admin/comms/messages">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[48px]" />
            ))}
          </div>
        ) : stats?.recentMessages.length === 0 ? (
          <p className="text-muted-foreground text-sm">No messages yet</p>
        ) : (
          <div className="space-y-2">
            {stats?.recentMessages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
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
                    msg.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    msg.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                    msg.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {msg.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
