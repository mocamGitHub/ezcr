// src/lib/supabase/client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Use environment variables (exposed via next.config.ts env object)
// Fallback to hardcoded values only for development if env vars not set
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supabase.nexcyte.com'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1OTEwNTM4MCwiZXhwIjo0OTE0Nzc4OTgwLCJyb2xlIjoiYW5vbiJ9.LEjES7ZdligKvnm15fl1ssmOHDXw9_1-ophSf9fKbm8'

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
