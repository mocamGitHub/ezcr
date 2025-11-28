// src/lib/supabase/client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Hardcoded values for client-side - these are public/anon keys, safe to expose
const SUPABASE_URL = 'https://supabase.nexcyte.com'
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1OTEwNTM4MCwiZXhwIjo0OTE0Nzc4OTgwLCJyb2xlIjoiYW5vbiJ9.LEjES7ZdligKvnm15fl1ssmOHDXw9_1-ophSf9fKbm8'

let client: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (client) return client

  client = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return client
}
