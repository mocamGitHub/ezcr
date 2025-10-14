import { createClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/embeddings/generate
 * Generates OpenAI embeddings for all knowledge base entries without embeddings
 * Should be run after seeding knowledge base or adding new content
 */
export async function POST(request: Request) {
  try {
    // Optionally require admin authentication here
    // const { user } = await request.json()
    // if (!user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const openAIKey = process.env.OPENAI_API_KEY

    if (!openAIKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // Get tenant ID from environment-aware configuration
    const tenantSlug = getCurrentTenant()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get all knowledge base entries without embeddings
    const { data: entries, error: fetchError } = await supabase
      .from('knowledge_base')
      .select('id, title, content')
      .eq('tenant_id', tenant.id)
      .is('embedding', null)

    if (fetchError) throw fetchError

    if (!entries || entries.length === 0) {
      return NextResponse.json({
        message: 'No entries need embeddings',
        processed: 0,
      })
    }

    console.log(`Generating embeddings for ${entries.length} entries...`)

    let successCount = 0
    let errorCount = 0

    // Process each entry
    for (const entry of entries) {
      try {
        // Combine title and content for better semantic search
        const textToEmbed = `${entry.title}\n\n${entry.content}`

        // Call OpenAI API to generate embedding
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAIKey}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: textToEmbed,
          }),
        })

        if (!response.ok) {
          console.error(`Failed to generate embedding for entry ${entry.id}`)
          errorCount++
          continue
        }

        const data = await response.json()
        const embedding = data.data[0].embedding

        // Update the entry with the embedding
        const { error: updateError } = await supabase
          .from('knowledge_base')
          .update({ embedding })
          .eq('id', entry.id)

        if (updateError) {
          console.error(`Failed to update entry ${entry.id}:`, updateError)
          errorCount++
        } else {
          successCount++
          console.log(`✓ Generated embedding for: ${entry.title}`)
        }

        // Rate limiting: Wait 100ms between requests to avoid API limits
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Error processing entry ${entry.id}:`, error)
        errorCount++
      }
    }

    return NextResponse.json({
      message: 'Embedding generation complete',
      total: entries.length,
      success: successCount,
      errors: errorCount,
    })
  } catch (error) {
    console.error('Error generating embeddings:', error)
    return NextResponse.json(
      { error: 'Failed to generate embeddings' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/embeddings/generate
 * Returns status of knowledge base embeddings
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get tenant ID from environment-aware configuration
    const tenantSlug = getCurrentTenant()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Count total entries
    const { count: totalCount } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)

    // Count entries with embeddings
    const { count: embeddedCount } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .not('embedding', 'is', null)

    // Count entries needing embeddings
    const { count: pendingCount } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .is('embedding', null)

    return NextResponse.json({
      total: totalCount || 0,
      embedded: embeddedCount || 0,
      pending: pendingCount || 0,
      ready: (embeddedCount || 0) === (totalCount || 0),
    })
  } catch (error) {
    console.error('Error checking embeddings status:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}
