'use server'

import { createClient } from '@supabase/supabase-js'

// Server-side client with service role key to bypass RLS
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function getCommsStats() {
  const supabase = getAdminClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { count: totalMessages },
    { count: sentToday },
    { count: emailsSent },
    { count: smsSent },
    { count: totalContacts },
    { count: totalTemplates },
    { data: recentMessages },
  ] = await Promise.all([
    supabase.from('comms_messages').select('*', { count: 'exact', head: true }),
    supabase.from('comms_messages').select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString()).eq('direction', 'outbound'),
    supabase.from('comms_messages').select('*', { count: 'exact', head: true })
      .eq('channel', 'email').eq('direction', 'outbound'),
    supabase.from('comms_messages').select('*', { count: 'exact', head: true })
      .eq('channel', 'sms').eq('direction', 'outbound'),
    supabase.from('comms_contacts').select('*', { count: 'exact', head: true }),
    supabase.from('comms_templates').select('*', { count: 'exact', head: true }),
    supabase.from('comms_messages')
      .select('id, channel, direction, status, to_address, subject, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return {
    totalMessages: totalMessages || 0,
    sentToday: sentToday || 0,
    emailsSent: emailsSent || 0,
    smsSent: smsSent || 0,
    totalContacts: totalContacts || 0,
    totalTemplates: totalTemplates || 0,
    recentMessages: recentMessages || [],
  }
}

export async function getMessages(filters: {
  channel?: string
  direction?: string
  status?: string
}) {
  const supabase = getAdminClient()

  let query = supabase
    .from('comms_messages')
    .select('id, channel, direction, status, provider, to_address, from_address, subject, text_body, sent_at, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (filters.channel && filters.channel !== 'all') {
    query = query.eq('channel', filters.channel)
  }
  if (filters.direction && filters.direction !== 'all') {
    query = query.eq('direction', filters.direction)
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getTemplates() {
  const supabase = getAdminClient()

  const { data, error } = await supabase
    .from('comms_templates')
    .select('id, name, channel, status, active_version_id, created_at, updated_at')
    .is('archived_at', null)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getTemplate(templateId: string) {
  const supabase = getAdminClient()

  const { data: template, error: templateError } = await supabase
    .from('comms_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (templateError) throw templateError

  let version = null
  if (template.active_version_id) {
    const { data: versionData } = await supabase
      .from('comms_template_versions')
      .select('*')
      .eq('id', template.active_version_id)
      .single()
    version = versionData
  }

  return { template, version }
}

export async function saveTemplate(
  templateId: string,
  data: {
    name: string
    status: string
    subject: string
    text_body: string
    html_body: string
  },
  currentVersion: { version_number: number } | null,
  channel: string
) {
  const supabase = getAdminClient()
  const tenantId = process.env.EZCR_TENANT_ID!

  // Update template
  await supabase
    .from('comms_templates')
    .update({ name: data.name, status: data.status })
    .eq('id', templateId)

  // Check if content changed
  const contentChanged = data.subject || data.text_body || data.html_body

  if (contentChanged) {
    const newVersionNumber = currentVersion ? currentVersion.version_number + 1 : 1

    const { data: newVersion, error: versionError } = await supabase
      .from('comms_template_versions')
      .insert({
        tenant_id: tenantId,
        template_id: templateId,
        version_number: newVersionNumber,
        channel: channel,
        subject: data.subject || null,
        text_body: data.text_body || null,
        html_body: data.html_body || null,
      })
      .select()
      .single()

    if (versionError) throw versionError

    await supabase
      .from('comms_templates')
      .update({ active_version_id: newVersion.id })
      .eq('id', templateId)
  }

  return { success: true }
}

export async function createTemplate(data: {
  name: string
  channel: string
  subject: string
  text_body: string
  html_body: string
}) {
  const supabase = getAdminClient()
  const tenantId = process.env.EZCR_TENANT_ID!

  const { data: template, error: templateError } = await supabase
    .from('comms_templates')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      channel: data.channel,
      status: 'draft',
    })
    .select()
    .single()

  if (templateError) throw templateError

  if (data.subject || data.text_body || data.html_body) {
    const { data: version, error: versionError } = await supabase
      .from('comms_template_versions')
      .insert({
        tenant_id: tenantId,
        template_id: template.id,
        version_number: 1,
        channel: data.channel,
        subject: data.subject || null,
        text_body: data.text_body || null,
        html_body: data.html_body || null,
      })
      .select()
      .single()

    if (versionError) throw versionError

    await supabase
      .from('comms_templates')
      .update({ active_version_id: version.id })
      .eq('id', template.id)
  }

  return template
}

export async function getContacts(search?: string) {
  const supabase = getAdminClient()

  let query = supabase
    .from('comms_contacts')
    .select(`
      id, email, phone_e164, display_name, created_at,
      comms_channel_preferences (channel, consent_status)
    `)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (search) {
    query = query.or(`email.ilike.%${search}%,phone_e164.ilike.%${search}%,display_name.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error

  return data?.map(c => ({
    ...c,
    preferences: c.comms_channel_preferences
  })) || []
}

export async function createContact(data: {
  email: string
  phone: string
  display_name: string
}) {
  const supabase = getAdminClient()
  const tenantId = process.env.EZCR_TENANT_ID!

  const { error } = await supabase
    .from('comms_contacts')
    .insert({
      tenant_id: tenantId,
      email: data.email || null,
      phone_e164: data.phone || null,
      display_name: data.display_name || null,
    })

  if (error) throw error
  return { success: true }
}

export async function getConversations(filters: {
  channel?: string
  status?: string
}) {
  const supabase = getAdminClient()

  let query = supabase
    .from('comms_conversations')
    .select(`
      id, channel, subject, status, created_at, updated_at,
      comms_contacts (id, email, phone_e164, display_name)
    `)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (filters.channel && filters.channel !== 'all') {
    query = query.eq('channel', filters.channel)
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data: convData, error: convError } = await query
  if (convError) throw convError

  // Get message counts and last messages
  const conversationsWithDetails = await Promise.all(
    (convData || []).map(async (conv) => {
      const { count } = await supabase
        .from('comms_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)

      const { data: lastMsg } = await supabase
        .from('comms_messages')
        .select('text_body, direction, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      return {
        ...conv,
        contact: conv.comms_contacts,
        message_count: count || 0,
        last_message: lastMsg || null,
      }
    })
  )

  return conversationsWithDetails
}

export async function getConversation(conversationId: string) {
  const supabase = getAdminClient()

  const { data: convData, error: convError } = await supabase
    .from('comms_conversations')
    .select(`
      id, channel, subject, status,
      comms_contacts (id, email, phone_e164, display_name)
    `)
    .eq('id', conversationId)
    .single()

  if (convError) throw convError

  const { data: messages, error: msgError } = await supabase
    .from('comms_messages')
    .select('id, direction, status, text_body, html_body, subject, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (msgError) throw msgError

  return {
    conversation: {
      ...convData,
      contact: convData.comms_contacts
    },
    messages: messages || []
  }
}
