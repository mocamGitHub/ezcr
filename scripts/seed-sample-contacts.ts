/**
 * Seed Sample Business Contacts
 * Run: npx tsx scripts/seed-sample-contacts.ts
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

const sampleContacts = [
  // Freight/Shipping
  {
    contact_type: 'freight',
    company_name: 'TForce Freight',
    contact_name: 'Mike Johnson',
    email: 'dispatch@tforcefreight.com',
    phone: '800-333-7400',
    website: 'https://www.tforcefreight.com',
    address_line1: '1000 Freight Way',
    city: 'Richmond',
    state: 'VA',
    postal_code: '23219',
    country: 'US',
    account_number: 'TF-892341',
    payment_terms: 'Net 30',
    status: 'active',
    notes: 'Primary LTL carrier for ramp shipments. Contact Mike for expedited shipments.',
  },
  {
    contact_type: 'freight',
    company_name: 'Old Dominion Freight Line',
    contact_name: 'Sarah Williams',
    email: 'sales@odfl.com',
    phone: '800-432-6335',
    website: 'https://www.odfl.com',
    address_line1: '500 Old Dominion Way',
    city: 'Thomasville',
    state: 'NC',
    postal_code: '27360',
    country: 'US',
    account_number: 'ODFL-44521',
    payment_terms: 'Net 30',
    status: 'active',
    notes: 'Backup carrier. Good for Southeast deliveries.',
  },

  // Vendors/Suppliers
  {
    contact_type: 'vendor',
    company_name: 'Steel Supply Co.',
    contact_name: 'Robert Chen',
    email: 'orders@steelsupplyco.com',
    phone: '614-555-0123',
    website: 'https://www.steelsupplyco.com',
    address_line1: '2500 Industrial Blvd',
    city: 'Columbus',
    state: 'OH',
    postal_code: '43215',
    country: 'US',
    account_number: 'SSC-7890',
    payment_terms: 'Net 45',
    contract_start_date: '2024-01-01',
    contract_end_date: '2025-12-31',
    status: 'active',
    notes: 'Primary steel supplier. Minimum order $5,000.',
  },
  {
    contact_type: 'vendor',
    company_name: 'Powder Coating Plus',
    contact_name: 'Lisa Martinez',
    email: 'lisa@powdercoatingplus.com',
    phone: '513-555-0456',
    website: 'https://www.powdercoatingplus.com',
    address_line1: '890 Coating Lane',
    city: 'Cincinnati',
    state: 'OH',
    postal_code: '45202',
    country: 'US',
    account_number: 'PCP-2234',
    payment_terms: 'Net 30',
    status: 'active',
    notes: 'Handles all powder coating. 5-7 day turnaround.',
  },

  // Service Providers
  {
    contact_type: 'service_provider',
    company_name: 'QuickBooks Solutions',
    contact_name: 'David Park',
    email: 'support@qbsolutions.com',
    phone: '800-555-7890',
    website: 'https://www.qbsolutions.com',
    city: 'Mountain View',
    state: 'CA',
    country: 'US',
    payment_terms: 'Monthly',
    status: 'active',
    notes: 'Accounting software support and consulting.',
  },
  {
    contact_type: 'service_provider',
    company_name: 'WebDev Agency',
    contact_name: 'Emily Thompson',
    email: 'emily@webdevagency.com',
    phone: '415-555-0199',
    website: 'https://www.webdevagency.com',
    city: 'San Francisco',
    state: 'CA',
    country: 'US',
    payment_terms: 'Net 15',
    status: 'active',
    notes: 'Website development and maintenance.',
  },

  // Financial
  {
    contact_type: 'financial',
    company_name: 'First National Bank',
    contact_name: 'James Wilson',
    email: 'jwilson@fnb.com',
    phone: '614-555-0888',
    website: 'https://www.fnb.com',
    address_line1: '100 Main Street',
    city: 'Columbus',
    state: 'OH',
    postal_code: '43215',
    country: 'US',
    account_number: 'BUS-445566',
    status: 'active',
    notes: 'Primary business banking. James is our relationship manager.',
  },
  {
    contact_type: 'financial',
    company_name: 'ABC Insurance Group',
    contact_name: 'Karen Davis',
    email: 'kdavis@abcinsurance.com',
    phone: '614-555-0777',
    website: 'https://www.abcinsurance.com',
    city: 'Columbus',
    state: 'OH',
    country: 'US',
    payment_terms: 'Annual',
    contract_start_date: '2024-06-01',
    contract_end_date: '2025-05-31',
    status: 'active',
    notes: 'Business liability and property insurance.',
  },

  // Partners
  {
    contact_type: 'partner',
    company_name: 'Motorcycle Dealers Association',
    contact_name: 'Tom Bradley',
    email: 'tbradley@mda.org',
    phone: '800-555-6543',
    website: 'https://www.mda.org',
    city: 'Indianapolis',
    state: 'IN',
    country: 'US',
    status: 'active',
    notes: 'Trade association. Good source for dealer referrals.',
  },
  {
    contact_type: 'partner',
    company_name: 'RevZilla',
    contact_name: 'Affiliate Team',
    email: 'affiliates@revzilla.com',
    phone: '877-792-9455',
    website: 'https://www.revzilla.com',
    city: 'Philadelphia',
    state: 'PA',
    country: 'US',
    account_number: 'AFF-EZCR-001',
    status: 'active',
    notes: 'Affiliate partnership for cross-promotion.',
  },

  // Integration Partners
  {
    contact_type: 'integration',
    company_name: 'Stripe',
    contact_name: 'Support Team',
    email: 'support@stripe.com',
    website: 'https://stripe.com',
    city: 'San Francisco',
    state: 'CA',
    country: 'US',
    status: 'active',
    notes: 'Payment processing integration.',
  },
  {
    contact_type: 'integration',
    company_name: 'Mailgun',
    contact_name: 'Support Team',
    email: 'support@mailgun.com',
    website: 'https://www.mailgun.com',
    city: 'San Antonio',
    state: 'TX',
    country: 'US',
    status: 'active',
    notes: 'Transactional email service.',
  },
]

async function seedContacts() {
  console.log('🌱 Seeding sample business contacts...\n')

  for (const contact of sampleContacts) {
    const { data, error } = await supabase
      .from('tenant_contacts')
      .insert({
        tenant_id: tenantId,
        ...contact,
        tags: [],
      })
      .select()
      .single()

    if (error) {
      console.error(`❌ Failed to create ${contact.company_name}:`, error.message)
    } else {
      console.log(`✅ Created: ${contact.company_name} (${contact.contact_type})`)
    }
  }

  console.log('\n✨ Done! Created', sampleContacts.length, 'sample contacts.')
}

seedContacts().catch(console.error)
