'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTemplate } from '../../actions'

export default function NewTemplatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    channel: 'email',
    subject: '',
    text_body: '',
    html_body: '',
  })

  const handleSave = async () => {
    if (!formData.name) {
      alert('Please enter a template name')
      return
    }

    setSaving(true)
    try {
      const template = await createTemplate({
        name: formData.name,
        channel: formData.channel,
        subject: formData.subject,
        text_body: formData.text_body,
        html_body: formData.html_body,
      })

      router.push(`/admin/comms/templates/${template.id}`)
    } catch (error) {
      console.error('Error creating template:', error)
      alert('Error creating template')
    } finally {
      setSaving(false)
    }
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
          <h1 className="text-2xl font-bold">New Template</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Creating...' : 'Create Template'}
        </Button>
      </div>

      {/* Form */}
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Order Confirmation"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel">Channel *</Label>
            <Select
              value={formData.channel}
              onValueChange={(value) => setFormData({ ...formData, channel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {formData.channel === 'email' && (
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
            {formData.channel === 'email' ? 'Text Body' : 'Message Body'}
          </Label>
          <Textarea
            id="text_body"
            value={formData.text_body}
            onChange={(e) => setFormData({ ...formData, text_body: e.target.value })}
            rows={6}
            placeholder={formData.channel === 'sms'
              ? 'Your SMS message here. Use {{variable}} for personalization.'
              : 'Plain text version of your email...'}
          />
        </div>

        {formData.channel === 'email' && (
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
      </div>
    </div>
  )
}
