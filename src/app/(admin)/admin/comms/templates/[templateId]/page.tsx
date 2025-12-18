'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Mail, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getTemplate, saveTemplate } from '../../actions'

type Template = {
  id: string
  name: string
  channel: string
  status: string
  active_version_id: string | null
}

type TemplateVersion = {
  id: string
  version_number: number
  subject: string | null
  text_body: string | null
  html_body: string | null
}

export default function TemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.templateId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<Template | null>(null)
  const [version, setVersion] = useState<TemplateVersion | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    status: 'draft',
    subject: '',
    text_body: '',
    html_body: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const { template: templateData, version: versionData } = await getTemplate(templateId)
      setTemplate(templateData)

      if (versionData) {
        setVersion(versionData)
        setFormData({
          name: templateData.name,
          status: templateData.status,
          subject: versionData.subject || '',
          text_body: versionData.text_body || '',
          html_body: versionData.html_body || '',
        })
      } else {
        setFormData({
          name: templateData.name,
          status: templateData.status,
          subject: '',
          text_body: '',
          html_body: '',
        })
      }
    } catch (error) {
      console.error('Error fetching template:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (templateId) {
      fetchData()
    }
  }, [templateId])

  const handleSave = async () => {
    if (!template) return

    setSaving(true)
    try {
      await saveTemplate(
        templateId,
        formData,
        version,
        template.channel
      )

      alert('Template saved successfully!')
      fetchData()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Error saving template')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Template not found</p>
        <Link href="/admin/comms/templates">
          <Button variant="link">Back to Templates</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/comms/templates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {template.channel === 'email' ? (
              <Mail className="h-5 w-5 text-muted-foreground" />
            ) : (
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            )}
            <h1 className="text-2xl font-bold">{template.name}</h1>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Form */}
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {template.channel === 'email' && (
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Thanks for your order {{order.number}}"
            />
            <p className="text-xs text-muted-foreground">
              Use {'{{variable}}'} for dynamic content
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="text_body">
            {template.channel === 'email' ? 'Text Body' : 'Message Body'}
          </Label>
          <Textarea
            id="text_body"
            value={formData.text_body}
            onChange={(e) => setFormData({ ...formData, text_body: e.target.value })}
            rows={6}
            placeholder={template.channel === 'sms'
              ? 'Your SMS message here. Use {{variable}} for personalization.'
              : 'Plain text version of your email...'}
          />
          <p className="text-xs text-muted-foreground">
            {template.channel === 'sms'
              ? 'SMS messages are limited to 160 characters per segment'
              : 'Plain text fallback for email clients that don\'t support HTML'}
          </p>
        </div>

        {template.channel === 'email' && (
          <div className="space-y-2">
            <Label htmlFor="html_body">HTML Body</Label>
            <Textarea
              id="html_body"
              value={formData.html_body}
              onChange={(e) => setFormData({ ...formData, html_body: e.target.value })}
              rows={10}
              placeholder="<p>Your HTML email content here...</p>"
              className="font-mono text-sm"
            />
          </div>
        )}

        {version && (
          <div className="text-xs text-muted-foreground border-t pt-4">
            Version {version.version_number} • Changes create a new version
          </div>
        )}
      </div>
    </div>
  )
}
