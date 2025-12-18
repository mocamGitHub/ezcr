/**
 * Seed Sample Tools/Subscriptions
 * Run: npx tsx scripts/seed-sample-tools.ts
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

// Helper to get date X days from now
const daysFromNow = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

const sampleTools = [
  // Payment
  {
    name: 'Stripe',
    description: 'Payment processing for online orders',
    category: 'payment',
    website_url: 'https://stripe.com',
    login_url: 'https://dashboard.stripe.com',
    documentation_url: 'https://stripe.com/docs',
    account_email: 'admin@ezcycleramp.com',
    has_mfa: true,
    mfa_method: 'Authenticator app',
    billing_cycle: 'usage_based',
    cost_amount: null,
    integration_status: 'integrated',
    status: 'active',
    notes: '2.9% + $0.30 per transaction. Primary payment processor.',
  },

  // Email
  {
    name: 'Mailgun',
    description: 'Transactional email service',
    category: 'email',
    website_url: 'https://www.mailgun.com',
    login_url: 'https://app.mailgun.com',
    documentation_url: 'https://documentation.mailgun.com',
    account_email: 'admin@ezcycleramp.com',
    has_mfa: true,
    mfa_method: 'Authenticator app',
    billing_cycle: 'monthly',
    cost_amount: 35,
    renewal_date: daysFromNow(15),
    auto_renew: true,
    integration_status: 'integrated',
    status: 'active',
    notes: 'Flex plan - 50,000 emails/month included.',
  },

  // Analytics
  {
    name: 'Google Analytics 4',
    description: 'Website analytics and tracking',
    category: 'analytics',
    website_url: 'https://analytics.google.com',
    login_url: 'https://analytics.google.com',
    documentation_url: 'https://developers.google.com/analytics',
    account_email: 'admin@ezcycleramp.com',
    has_mfa: true,
    mfa_method: 'Google 2FA',
    billing_cycle: 'free',
    integration_status: 'integrated',
    status: 'active',
    notes: 'Free tier. Connected to website.',
  },
  {
    name: 'Hotjar',
    description: 'Heatmaps and session recordings',
    category: 'analytics',
    website_url: 'https://www.hotjar.com',
    login_url: 'https://insights.hotjar.com',
    account_email: 'admin@ezcycleramp.com',
    has_mfa: false,
    billing_cycle: 'monthly',
    cost_amount: 39,
    renewal_date: daysFromNow(22),
    auto_renew: true,
    integration_status: 'integrated',
    status: 'active',
    notes: 'Plus plan - 100 daily sessions.',
  },

  // Shipping
  {
    name: 'ShipStation',
    description: 'Shipping label management',
    category: 'shipping',
    website_url: 'https://www.shipstation.com',
    login_url: 'https://ss.shipstation.com',
    documentation_url: 'https://help.shipstation.com',
    account_email: 'shipping@ezcycleramp.com',
    has_mfa: true,
    mfa_method: 'Email code',
    billing_cycle: 'monthly',
    cost_amount: 99,
    renewal_date: daysFromNow(8),
    auto_renew: true,
    integration_status: 'not_integrated',
    status: 'active',
    notes: 'Gold plan - 2,000 shipments/month. Consider integrating with store.',
  },

  // Infrastructure
  {
    name: 'Vercel',
    description: 'Website hosting and deployment',
    category: 'infrastructure',
    website_url: 'https://vercel.com',
    login_url: 'https://vercel.com/login',
    documentation_url: 'https://vercel.com/docs',
    account_email: 'admin@ezcycleramp.com',
    has_mfa: true,
    mfa_method: 'Authenticator app',
    billing_cycle: 'monthly',
    cost_amount: 20,
    renewal_date: daysFromNow(30),
    auto_renew: true,
    integration_status: 'integrated',
    status: 'active',
    notes: 'Pro plan. Auto-deploys from GitHub.',
  },
  {
    name: 'Supabase',
    description: 'Database and authentication',
    category: 'infrastructure',
    website_url: 'https://supabase.com',
    login_url: 'https://app.supabase.com',
    documentation_url: 'https://supabase.com/docs',
    account_email: 'admin@ezcycleramp.com',
    has_mfa: true,
    mfa_method: 'Authenticator app',
    billing_cycle: 'monthly',
    cost_amount: 25,
    renewal_date: daysFromNow(12),
    auto_renew: true,
    integration_status: 'integrated',
    status: 'active',
    notes: 'Pro plan. PostgreSQL database + Auth + Storage.',
  },

  // Marketing
  {
    name: 'Google Ads',
    description: 'PPC advertising',
    category: 'marketing',
    website_url: 'https://ads.google.com',
    login_url: 'https://ads.google.com',
    account_email: 'marketing@ezcycleramp.com',
    has_mfa: true,
    mfa_method: 'Google 2FA',
    billing_cycle: 'usage_based',
    integration_status: 'not_integrated',
    status: 'active',
    notes: 'Monthly budget: $500. Conversion tracking needs setup.',
  },
  {
    name: 'Canva Pro',
    description: 'Design and graphics',
    category: 'marketing',
    website_url: 'https://www.canva.com',
    login_url: 'https://www.canva.com/login',
    account_email: 'marketing@ezcycleramp.com',
    has_mfa: false,
    billing_cycle: 'annual',
    cost_amount: 120,
    renewal_date: daysFromNow(90),
    auto_renew: true,
    integration_status: 'not_integrated',
    status: 'active',
    notes: 'Used for social media graphics and marketing materials.',
  },

  // Development
  {
    name: 'GitHub',
    description: 'Code repository and CI/CD',
    category: 'development',
    website_url: 'https://github.com',
    login_url: 'https://github.com/login',
    documentation_url: 'https://docs.github.com',
    account_email: 'dev@ezcycleramp.com',
    has_mfa: true,
    mfa_method: 'Authenticator app',
    billing_cycle: 'monthly',
    cost_amount: 4,
    renewal_date: daysFromNow(18),
    auto_renew: true,
    integration_status: 'integrated',
    status: 'active',
    notes: 'Team plan. Connected to Vercel for auto-deploy.',
  },
  {
    name: 'Claude Code',
    description: 'AI coding assistant',
    category: 'development',
    website_url: 'https://claude.ai',
    login_url: 'https://claude.ai',
    account_email: 'dev@ezcycleramp.com',
    has_mfa: false,
    billing_cycle: 'monthly',
    cost_amount: 20,
    renewal_date: daysFromNow(5),
    auto_renew: true,
    integration_status: 'integrated',
    status: 'active',
    notes: 'Pro plan. Used for development assistance.',
  },

  // Accounting
  {
    name: 'QuickBooks Online',
    description: 'Accounting and bookkeeping',
    category: 'accounting',
    website_url: 'https://quickbooks.intuit.com',
    login_url: 'https://accounts.intuit.com',
    account_email: 'accounting@ezcycleramp.com',
    has_mfa: true,
    mfa_method: 'SMS',
    billing_cycle: 'monthly',
    cost_amount: 80,
    renewal_date: daysFromNow(25),
    auto_renew: true,
    integration_status: 'not_integrated',
    status: 'active',
    notes: 'Plus plan. Bank feeds connected.',
  },

  // Security
  {
    name: '1Password Business',
    description: 'Password management',
    category: 'security',
    website_url: 'https://1password.com',
    login_url: 'https://my.1password.com',
    account_email: 'admin@ezcycleramp.com',
    has_mfa: true,
    mfa_method: 'Secret key + password',
    billing_cycle: 'annual',
    cost_amount: 96,
    renewal_date: daysFromNow(180),
    auto_renew: true,
    integration_status: 'not_integrated',
    status: 'active',
    notes: 'Team plan - 2 users. Stores all service credentials.',
  },
]

async function seedTools() {
  console.log('🌱 Seeding sample tools/subscriptions...\n')

  for (const tool of sampleTools) {
    const { data, error } = await supabase
      .from('tenant_tools')
      .insert({
        tenant_id: tenantId,
        ...tool,
        tags: [],
        cost_currency: 'USD',
        cancellation_notice_days: 30,
      })
      .select()
      .single()

    if (error) {
      console.error(`❌ Failed to create ${tool.name}:`, error.message)
    } else {
      const cost = tool.cost_amount
        ? `$${tool.cost_amount}/${tool.billing_cycle}`
        : tool.billing_cycle
      console.log(`✅ Created: ${tool.name} (${tool.category}) - ${cost}`)
    }
  }

  console.log('\n✨ Done! Created', sampleTools.length, 'sample tools.')
}

seedTools().catch(console.error)
