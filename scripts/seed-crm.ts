/**
 * Seed CRM Data (Tags, Notes, Tasks, Activities)
 * Run: npx tsx scripts/seed-crm.ts
 *
 * Note: Run seed-orders.ts first, as CRM data references customer emails from orders.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const tenantId = process.env.EZCR_TENANT_ID!

if (!supabaseUrl || !supabaseKey || !tenantId) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper to get date X days ago
const daysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

// Helper to get date X days from now
const daysFromNow = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

// Sample customer emails (should match orders seed)
const customerEmails = [
  'mike.reynolds@example.com',
  'sarah.thompson@example.com',
  'james.kimball@example.com',
  'david.martinez@example.com',
  'jennifer.parker@example.com',
  'robert.hughes@example.com',
  'tom.wilson@example.com',
  'chris.larson@example.com',
]

// Sample notes for customers
const sampleNotes = [
  {
    customer_email: customerEmails[0],
    note: 'VIP customer - has purchased multiple ramps. Very knowledgeable about product line. Prefers phone calls over email.',
    is_pinned: true,
  },
  {
    customer_email: customerEmails[0],
    note: 'Called on 12/5 to discuss potential upgrade to AUN250. Interested in folding feature for smaller garage.',
    is_pinned: false,
  },
  {
    customer_email: customerEmails[1],
    note: 'First-time buyer. Had questions about installation. Sent video tutorial link.',
    is_pinned: false,
  },
  {
    customer_email: customerEmails[2],
    note: 'Runs a motorcycle club in Denver. Potential for bulk referral orders. Follow up in January.',
    is_pinned: true,
  },
  {
    customer_email: customerEmails[3],
    note: 'Currently waiting on shipped order. Called to confirm delivery window - carrier scheduled for Friday.',
    is_pinned: false,
  },
  {
    customer_email: customerEmails[4],
    note: 'Had a minor issue with packaging - offered 10% off next accessory purchase as goodwill gesture. Very satisfied with resolution.',
    is_pinned: false,
  },
  {
    customer_email: customerEmails[5],
    note: 'New order placed today. Processing payment. Customer requested expedited shipping if possible.',
    is_pinned: false,
  },
]

// Sample tasks
const sampleTasks = [
  {
    customer_email: customerEmails[0],
    title: 'Follow up on upgrade interest',
    description: 'Mike expressed interest in upgrading to AUN250. Check in to see if ready to proceed.',
    due_date: daysFromNow(3),
    status: 'pending',
    priority: 'high',
  },
  {
    customer_email: customerEmails[2],
    title: 'Send bulk order info',
    description: 'James runs a motorcycle club. Prepare bulk order pricing sheet and referral program info.',
    due_date: daysFromNow(7),
    status: 'pending',
    priority: 'medium',
  },
  {
    customer_email: customerEmails[3],
    title: 'Confirm delivery received',
    description: 'Call to confirm David received his shipment and everything arrived in good condition.',
    due_date: daysFromNow(2),
    status: 'pending',
    priority: 'medium',
  },
  {
    customer_email: customerEmails[4],
    title: 'Request testimonial',
    description: 'Jennifer was very satisfied with support resolution. Good candidate for testimonial request.',
    due_date: daysFromNow(5),
    status: 'pending',
    priority: 'low',
  },
  {
    customer_email: customerEmails[5],
    title: 'Check expedited shipping status',
    description: 'Robert requested expedited shipping. Verify with warehouse that order is prioritized.',
    due_date: daysFromNow(1),
    status: 'in_progress',
    priority: 'high',
  },
  {
    customer_email: customerEmails[1],
    title: 'Send installation follow-up',
    description: 'Follow up with Sarah to see if she was able to complete installation successfully.',
    due_date: daysAgo(2),
    status: 'completed',
    priority: 'medium',
    completed_at: daysAgo(1),
  },
]

// Sample activities
const sampleActivities = [
  {
    customer_email: customerEmails[0],
    activity_type: 'order_placed',
    activity_data: { order_number: 'EZCR-202412-01001', total: 2244.00 },
  },
  {
    customer_email: customerEmails[0],
    activity_type: 'order_delivered',
    activity_data: { order_number: 'EZCR-202412-01001', tracking: 'PRO123456789' },
  },
  {
    customer_email: customerEmails[0],
    activity_type: 'phone_call',
    activity_data: { direction: 'inbound', duration_minutes: 15, notes: 'Discussed upgrade options' },
  },
  {
    customer_email: customerEmails[1],
    activity_type: 'order_placed',
    activity_data: { order_number: 'EZCR-202412-01002', total: 1975.00 },
  },
  {
    customer_email: customerEmails[1],
    activity_type: 'email_sent',
    activity_data: { subject: 'Installation Video Tutorial', template: 'installation-tips' },
  },
  {
    customer_email: customerEmails[2],
    activity_type: 'order_placed',
    activity_data: { order_number: 'EZCR-202412-01003', total: 1885.00 },
  },
  {
    customer_email: customerEmails[3],
    activity_type: 'order_shipped',
    activity_data: { order_number: 'EZCR-202412-01004', carrier: 'LTL Freight' },
  },
  {
    customer_email: customerEmails[4],
    activity_type: 'support_ticket',
    activity_data: { issue: 'Packaging concern', status: 'resolved', resolution: '10% discount offered' },
  },
  {
    customer_email: customerEmails[5],
    activity_type: 'order_placed',
    activity_data: { order_number: 'EZCR-202412-01006', total: 2199.00 },
  },
]

// Tag assignments (using tag names - we'll look up IDs)
const tagAssignments = [
  { customer_email: customerEmails[0], tag_name: 'VIP' },
  { customer_email: customerEmails[0], tag_name: 'Repeat Customer' },
  { customer_email: customerEmails[1], tag_name: 'New Customer' },
  { customer_email: customerEmails[2], tag_name: 'Repeat Customer' },
  { customer_email: customerEmails[2], tag_name: 'Referral Source' },
  { customer_email: customerEmails[3], tag_name: 'New Customer' },
  { customer_email: customerEmails[4], tag_name: 'Satisfied' },
  { customer_email: customerEmails[5], tag_name: 'New Customer' },
  { customer_email: customerEmails[5], tag_name: 'High Intent' },
]

// Health score overrides
const healthScores = [
  { customer_email: customerEmails[0], score: 92, factors: { recency: 40, frequency: 30, monetary: 15, engagement: 7 } },
  { customer_email: customerEmails[1], score: 65, factors: { recency: 30, frequency: 15, monetary: 12, engagement: 8 } },
  { customer_email: customerEmails[2], score: 78, factors: { recency: 30, frequency: 20, monetary: 20, engagement: 8 } },
  { customer_email: customerEmails[3], score: 55, factors: { recency: 40, frequency: 10, monetary: 5, engagement: 0 } },
  { customer_email: customerEmails[4], score: 70, factors: { recency: 30, frequency: 15, monetary: 15, engagement: 10 } },
]

async function seedCRM() {
  console.log('🌱 Seeding CRM data...\n')

  // First, verify orders exist (we need customer data)
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('customer_email')
    .eq('tenant_id', tenantId)
    .limit(1)

  if (orderError || !orders?.length) {
    console.log('⚠️  No orders found. Run seed-orders.ts first for best results.')
    console.log('   Proceeding with CRM seed anyway...\n')
  }

  // Get existing tags
  const { data: tags, error: tagError } = await supabase
    .from('customer_tags')
    .select('id, name')
    .eq('tenant_id', tenantId)

  if (tagError) {
    console.error('❌ Error fetching tags:', tagError.message)
    return
  }

  if (!tags?.length) {
    console.log('⚠️  No customer tags found. Tags should be seeded via migration.')
    console.log('   Skipping tag assignments.\n')
  }

  const tagMap = new Map(tags?.map(t => [t.name, t.id]) || [])

  // === SEED NOTES ===
  console.log('📝 Seeding customer notes...')
  for (const note of sampleNotes) {
    const { error } = await supabase
      .from('customer_notes')
      .insert({
        tenant_id: tenantId,
        customer_email: note.customer_email,
        note: note.note,
        is_pinned: note.is_pinned,
      })

    if (error) {
      if (error.code === '23505') {
        console.log(`   ⏭️  Note already exists for ${note.customer_email}`)
      } else {
        console.error(`   ❌ Failed to create note:`, error.message)
      }
    } else {
      console.log(`   ✅ Created note for ${note.customer_email}`)
    }
  }

  // === SEED TASKS ===
  console.log('\n📋 Seeding customer tasks...')
  for (const task of sampleTasks) {
    const { error } = await supabase
      .from('customer_tasks')
      .insert({
        tenant_id: tenantId,
        customer_email: task.customer_email,
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        status: task.status,
        priority: task.priority,
        completed_at: task.completed_at || null,
      })

    if (error) {
      console.error(`   ❌ Failed to create task "${task.title}":`, error.message)
    } else {
      const icon = task.status === 'completed' ? '✓' : task.priority === 'high' ? '🔴' : '🟡'
      console.log(`   ${icon} Created: "${task.title}" (${task.status})`)
    }
  }

  // === SEED TAG ASSIGNMENTS ===
  if (tagMap.size > 0) {
    console.log('\n🏷️  Seeding tag assignments...')
    for (const assignment of tagAssignments) {
      const tagId = tagMap.get(assignment.tag_name)
      if (!tagId) {
        console.log(`   ⚠️  Tag "${assignment.tag_name}" not found, skipping`)
        continue
      }

      const { error } = await supabase
        .from('customer_tag_assignments')
        .insert({
          tenant_id: tenantId,
          customer_email: assignment.customer_email,
          tag_id: tagId,
        })

      if (error) {
        if (error.code === '23505') {
          console.log(`   ⏭️  Tag "${assignment.tag_name}" already assigned to ${assignment.customer_email}`)
        } else {
          console.error(`   ❌ Failed to assign tag:`, error.message)
        }
      } else {
        console.log(`   ✅ Assigned "${assignment.tag_name}" to ${assignment.customer_email}`)
      }
    }
  }

  // === SEED ACTIVITIES ===
  console.log('\n📊 Seeding CRM activities...')
  for (const activity of sampleActivities) {
    const { error } = await supabase
      .from('crm_activities')
      .insert({
        tenant_id: tenantId,
        customer_email: activity.customer_email,
        activity_type: activity.activity_type,
        activity_data: activity.activity_data,
      })

    if (error) {
      console.error(`   ❌ Failed to create activity:`, error.message)
    } else {
      console.log(`   ✅ Created: ${activity.activity_type} for ${activity.customer_email}`)
    }
  }

  // === SEED HEALTH SCORES ===
  console.log('\n💚 Seeding customer health scores...')
  for (const hs of healthScores) {
    const { error } = await supabase
      .from('customer_health_scores')
      .upsert({
        tenant_id: tenantId,
        customer_email: hs.customer_email,
        score: hs.score,
        factors: hs.factors,
        calculated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,customer_email',
      })

    if (error) {
      console.error(`   ❌ Failed to set health score:`, error.message)
    } else {
      const scoreIcon = hs.score >= 80 ? '🟢' : hs.score >= 60 ? '🟡' : '🔴'
      console.log(`   ${scoreIcon} Set score ${hs.score} for ${hs.customer_email}`)
    }
  }

  console.log('\n✨ Done! CRM data seeded successfully.')
}

seedCRM().catch(console.error)
