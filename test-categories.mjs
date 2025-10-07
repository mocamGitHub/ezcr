import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const TENANT_ID = '00000000-0000-0000-0000-000000000001'

async function testCategories() {
  console.log('Testing category fetch...')
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
  } else {
    console.log('Categories found:', data.length)
    console.log('Categories:', JSON.stringify(data, null, 2))
  }
}

testCategories()
