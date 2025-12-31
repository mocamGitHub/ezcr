import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { RULE_TYPE_INFO, type ConfiguratorRule } from '@/types/configurator-rules'

export const dynamic = 'force-dynamic'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface AIAnalysisResult {
  summary: string
  issues: AIIssue[]
  suggestions: AISuggestion[]
  coverageAnalysis: string
}

export interface AIIssue {
  severity: 'error' | 'warning' | 'info'
  title: string
  description: string
  affectedRuleKeys: string[]
}

export interface AISuggestion {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

/**
 * POST /api/admin/configurator/rules/analyze
 * AI-powered analysis of configurator rules
 */
export async function POST(request: Request) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI analysis is not configured. ANTHROPIC_API_KEY is missing.' },
        { status: 503 }
      )
    }

    const { rules } = await request.json() as { rules: ConfiguratorRule[] }

    if (!rules || !Array.isArray(rules)) {
      return NextResponse.json(
        { error: 'Rules array is required' },
        { status: 400 }
      )
    }

    if (rules.length === 0) {
      return NextResponse.json({
        summary: 'No rules to analyze.',
        issues: [],
        suggestions: [{
          title: 'Create your first rules',
          description: 'Start by adding rules for your most common product configurations.',
          priority: 'high'
        }],
        coverageAnalysis: 'No rules defined yet.'
      })
    }

    // Format rules for the prompt
    const rulesDescription = formatRulesForPrompt(rules)

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are an expert business rules analyst for a motorcycle ramp configurator e-commerce system. Analyze the following configurator rules and provide insights.

## Rule Types Available
${Object.entries(RULE_TYPE_INFO).map(([type, info]) => `- **${type}**: ${info.description}`).join('\n')}

## Current Rules
${rulesDescription}

## Analysis Request
Please analyze these rules and provide:

1. **Summary**: A 2-3 sentence overview of the rules configuration health
2. **Issues**: Problems found (conflicts, gaps, inconsistencies, dead rules)
3. **Suggestions**: Improvements to consider
4. **Coverage Analysis**: How well do the rules cover the product configuration space?

Consider:
- Do height ranges (for AC001 extensions) have gaps or overlaps?
- Are there conflicting recommendations for the same conditions?
- Are any rules redundant or will never fire?
- Are important scenarios missing (e.g., heavy motorcycles, tall trucks)?
- Is the priority ordering sensible?
- Are inactive rules cluttering the configuration?

Respond in this exact JSON format:
{
  "summary": "Brief overview of rules health",
  "issues": [
    {
      "severity": "error|warning|info",
      "title": "Short issue title",
      "description": "Detailed explanation",
      "affectedRuleKeys": ["rule_key_1", "rule_key_2"]
    }
  ],
  "suggestions": [
    {
      "title": "Suggestion title",
      "description": "What to do and why",
      "priority": "high|medium|low"
    }
  ],
  "coverageAnalysis": "Analysis of how well rules cover different scenarios"
}`
        }
      ],
    })

    // Extract the text content from the response
    const textContent = message.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI')
    }

    // Parse the JSON response
    const responseText = textContent.text

    // Try to extract JSON from the response (Claude sometimes adds markdown code blocks)
    let jsonStr = responseText
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const analysis = JSON.parse(jsonStr) as AIAnalysisResult

    return NextResponse.json(analysis)

  } catch (error) {
    console.error('Error in AI analysis:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'AI analysis failed. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * Format rules into a readable format for the AI prompt
 */
function formatRulesForPrompt(rules: ConfiguratorRule[]): string {
  // Group by type
  const byType: Record<string, ConfiguratorRule[]> = {}
  for (const rule of rules) {
    if (!byType[rule.rule_type]) {
      byType[rule.rule_type] = []
    }
    byType[rule.rule_type].push(rule)
  }

  const sections: string[] = []

  for (const [type, typeRules] of Object.entries(byType)) {
    const typeInfo = RULE_TYPE_INFO[type as keyof typeof RULE_TYPE_INFO]
    sections.push(`### ${typeInfo?.label || type} (${typeRules.length} rules)`)

    // Sort by priority
    const sorted = typeRules.sort((a, b) => a.priority - b.priority)

    for (const rule of sorted) {
      const status = rule.is_active ? 'ACTIVE' : 'INACTIVE'
      sections.push(`
**${rule.rule_key}** [${status}] (priority: ${rule.priority})
- Condition: ${JSON.stringify(rule.condition)}
- Action: ${JSON.stringify(rule.action)}
${rule.message ? `- Message: "${rule.message}"` : ''}`)
    }
  }

  return sections.join('\n')
}
