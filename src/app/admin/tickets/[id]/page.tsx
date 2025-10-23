'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, User, Bot, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface TicketMessage {
  id: string
  message_type: string
  sender_type: string
  sender_email: string | null
  sender_name: string | null
  body: string
  is_internal: boolean
  created_at: string
}

interface TicketDetails {
  id: string
  ticket_number: string
  subject: string
  description: string
  status: string
  priority: string
  category: string | null
  customer_email: string
  customer_name: string | null
  created_at: string
  updated_at: string
  messages: TicketMessage[]
  tags: string[]
  customer: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    phone: string | null
  } | null
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [ticket, setTicket] = useState<TicketDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyMessage, setReplyMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    fetchTicket()
  }, [resolvedParams.id])

  const fetchTicket = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tickets/${resolvedParams.id}`)
      const data = await response.json()

      if (data.success) {
        setTicket(data.ticket)
        setNewStatus(data.ticket.status)
      }
    } catch (error) {
      console.error('Error fetching ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async () => {
    if (!replyMessage.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/tickets/${resolvedParams.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_type: 'email',
          sender_type: 'agent',
          sender_name: 'Support Team',
          message_body: replyMessage,
          is_internal: false,
        }),
      })

      if (response.ok) {
        setReplyMessage('')
        fetchTicket() // Refresh ticket to show new message
      }
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (newStatusValue: string) => {
    try {
      const response = await fetch(`/api/tickets/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatusValue }),
      })

      if (response.ok) {
        fetchTicket()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-muted-foreground">Ticket not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/tickets"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{ticket.ticket_number}</h1>
                <select
                  value={newStatus}
                  onChange={(e) => {
                    setNewStatus(e.target.value)
                    handleStatusChange(e.target.value)
                  }}
                  className="px-3 py-1 border rounded-lg text-sm"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting">Waiting</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  ticket.priority === 'low' ? 'bg-gray-100 text-gray-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {ticket.priority}
                </span>
              </div>
              <h2 className="text-xl mb-2">{ticket.subject}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>{ticket.customer_email}</span>
                {ticket.customer?.phone && (
                  <>
                    <span>•</span>
                    <span>{ticket.customer.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        {ticket.customer && (
          <div className="bg-card border rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0B5394] text-white rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">
                  {ticket.customer.first_name && ticket.customer.last_name
                    ? `${ticket.customer.first_name} ${ticket.customer.last_name}`
                    : ticket.customer_name || 'Unknown Customer'}
                </p>
                <p className="text-sm text-muted-foreground">{ticket.customer.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4 mb-6">
          {/* Initial description */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">
                    {ticket.customer_name || ticket.customer_email}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(ticket.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>
          </div>

          {/* Message thread */}
          {ticket.messages.map((message) => (
            <div
              key={message.id}
              className={`bg-card border rounded-lg p-6 ${
                message.is_internal ? 'border-yellow-300 bg-yellow-50/50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender_type === 'customer' ? 'bg-muted' :
                  message.sender_type === 'agent' ? 'bg-[#0B5394] text-white' :
                  'bg-gray-300'
                }`}>
                  {message.sender_type === 'customer' ? <User className="w-4 h-4" /> :
                   message.sender_type === 'agent' ? <User className="w-4 h-4" /> :
                   <Bot className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">
                      {message.sender_name || message.sender_email || 'System'}
                    </span>
                    {message.is_internal && (
                      <span className="px-2 py-0.5 rounded text-xs bg-yellow-200 text-yellow-800">
                        Internal Note
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{message.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Box */}
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Reply to Customer</h3>
          <Textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Type your reply here..."
            rows={6}
            className="mb-4"
          />
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleReply}
              disabled={!replyMessage.trim() || isSubmitting}
              className="bg-[#0B5394] hover:bg-[#0B5394]/90"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Reply
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
