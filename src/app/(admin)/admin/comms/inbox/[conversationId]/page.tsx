'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Mail, MessageSquare, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { getConversation } from '../../actions'

type Message = {
  id: string
  direction: string
  status: string
  text_body: string | null
  html_body: string | null
  subject: string | null
  created_at: string
}

type Conversation = {
  id: string
  channel: string
  subject: string | null
  status: string
  contact: {
    id: string
    email: string | null
    phone_e164: string | null
    display_name: string | null
  } | null
}

export default function ConversationDetailPage() {
  const params = useParams()
  const conversationId = params?.conversationId as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [replyText, setReplyText] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getConversation(conversationId)
      // Transform API response to match component's expected type
      const conv = data.conversation
      const contact = conv.comms_contacts?.[0] ?? null
      setConversation({
        id: conv.id,
        channel: conv.channel,
        subject: conv.subject,
        status: conv.status,
        contact: contact ? {
          id: contact.id,
          email: contact.email,
          phone_e164: contact.phone_e164,
          display_name: contact.display_name,
        } : null,
      })
      setMessages(data.messages)
    } catch (error) {
      console.error('Error fetching conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (conversationId) {
      fetchData()
    }
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendReply = async () => {
    if (!replyText.trim() || !conversation) return

    setSending(true)
    try {
      // Call the comms send API
      const response = await fetch('/api/comms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nc-internal-key': process.env.NEXT_PUBLIC_NC_INTERNAL_API_KEY || '',
        },
        body: JSON.stringify({
          tenantId: process.env.NEXT_PUBLIC_TENANT_ID || '174bed32-89ff-4920-94d7-4527a3aba352',
          contactId: conversation.contact?.id,
          channel: conversation.channel,
          conversationId: conversation.id,
          // For direct reply without template, we'd need a raw send endpoint
          // This is a simplified version
          variables: {
            message: replyText,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setReplyText('')
      fetchData()
    } catch (error) {
      console.error('Error sending reply:', error)
      alert('Error sending reply. Note: Direct replies require a template or raw send endpoint.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[500px]" />
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Conversation not found</p>
        <Link href="/admin/comms/inbox">
          <Button variant="link">Back to Inbox</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/admin/comms/inbox">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {conversation.channel === 'email' ? (
              <Mail className="h-5 w-5 text-muted-foreground" />
            ) : (
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <h1 className="text-xl font-bold">
                {conversation.contact?.display_name || conversation.contact?.email || conversation.contact?.phone_e164}
              </h1>
              {conversation.subject && (
                <p className="text-sm text-muted-foreground">{conversation.subject}</p>
              )}
            </div>
          </div>
        </div>
        <Button onClick={fetchData} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-card border rounded-lg p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages in this conversation
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.direction === 'outbound'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {msg.subject && msg.direction === 'inbound' && (
                  <p className="font-medium text-sm mb-1">{msg.subject}</p>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.text_body}</p>
                <div className={`text-xs mt-2 ${
                  msg.direction === 'outbound' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {new Date(msg.created_at).toLocaleString()}
                  {msg.direction === 'outbound' && (
                    <span className="ml-2">• {msg.status}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Box */}
      <div className="flex-shrink-0 bg-card border rounded-lg p-4">
        <div className="flex gap-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply via ${conversation.channel}...`}
            rows={2}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSendReply()
              }
            }}
          />
          <Button onClick={handleSendReply} disabled={sending || !replyText.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Cmd+Enter to send
        </p>
      </div>
    </div>
  )
}
