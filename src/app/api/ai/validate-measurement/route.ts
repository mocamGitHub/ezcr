import { NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/validate-measurement
 * AI-powered measurement validation with smart suggestions
 * Helps users catch common mistakes (unit errors, decimal errors, etc.)
 */
export async function POST(request: Request) {
  // Rate limit: 20 requests per minute for AI endpoints
  const rateLimit = withRateLimit(request, RATE_LIMITS.ai)
  if (rateLimit.limited) {
    return rateLimit.response
  }

  try {
    const { value, field, vehicleType, unitSystem } = await request.json()

    // Validate input
    if (!value || !field || !vehicleType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get OpenAI API key from environment
    const openAIKey = process.env.OPENAI_API_KEY

    if (!openAIKey) {
      console.warn('OpenAI API key not configured, skipping AI validation')
      return NextResponse.json({
        hasWarning: false,
        message: null,
        suggestion: null,
      })
    }

    // Build context for AI
    const fieldContext = getFieldContext(field, vehicleType)

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant for a motorcycle ramp configurator. Your job is to validate measurements and catch common mistakes. Be brief and friendly.

Guidelines:
- Look for obvious errors (too small, too large, wrong units)
- Suggest corrections if the value seems wrong
- If the value seems reasonable, say so briefly
- Consider the vehicle type and field being measured
- Be encouraging and helpful, not critical`,
          },
          {
            role: 'user',
            content: `User is configuring a ramp for a ${vehicleType}.

Field: ${field}
User entered: ${value} ${unitSystem === 'metric' ? 'cm' : 'inches'}
Expected range: ${fieldContext.expectedRange}
Common mistakes: ${fieldContext.commonMistakes}

Analyze if this value seems correct or if there might be an error. If it looks wrong, suggest what they might have meant.

Respond in JSON format:
{
  "hasWarning": boolean,
  "message": "brief message to user (1-2 sentences)",
  "suggestion": number or null (corrected value if applicable)
}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.statusText)
      return NextResponse.json({
        hasWarning: false,
        message: null,
        suggestion: null,
      })
    }

    const data = await response.json()
    const result = JSON.parse(data.choices[0].message.content)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in AI validation:', error)
    // Return no warning on error to not break the user experience
    return NextResponse.json({
      hasWarning: false,
      message: null,
      suggestion: null,
    })
  }
}

/**
 * Get context information for each field type
 */
function getFieldContext(field: string, vehicleType: string) {
  const contexts: Record<string, any> = {
    cargoLength: {
      expectedRange: '53-98 inches (135-250 cm)',
      commonMistakes: 'Entering feet instead of inches (6.5 ft → 65 inches), decimal errors',
      vehicleSpecific: {
        pickup: 'Pickup truck beds are typically 60-96 inches',
        van: 'Van cargo areas are typically 70-140 inches',
        trailer: 'Trailer beds are typically 70-100 inches',
      },
    },
    totalLength: {
      expectedRange: '68-98 inches (173-250 cm)',
      commonMistakes: 'Not measuring with tailgate open, forgetting bumper clearance',
      vehicleSpecific: {
        pickup: 'Total length includes bed + tailgate open',
        van: 'Measure from back door to rear of cargo area',
        trailer: 'Measure full cargo bed length',
      },
    },
    loadHeight: {
      expectedRange: '0-60 inches (0-152 cm)',
      commonMistakes: 'Entering feet instead of inches (3.5 ft → 35 inches), measuring to wrong point',
      vehicleSpecific: {
        pickup: 'Measure from ground to top of tailgate',
        van: 'Measure from ground to cargo floor level',
        trailer: 'Measure from ground to trailer bed',
      },
    },
    motorcycleWeight: {
      expectedRange: '300-1200 lbs (136-544 kg)',
      commonMistakes: 'Guessing weight, not including gear/fuel',
      vehicleSpecific: {},
    },
    wheelbase: {
      expectedRange: '50-75 inches (127-190 cm)',
      commonMistakes: 'Measuring overall length instead of wheelbase',
      vehicleSpecific: {},
    },
    motorcycleLength: {
      expectedRange: '75-100 inches (190-254 cm)',
      commonMistakes: 'Not including fairings/bags',
      vehicleSpecific: {},
    },
  }

  const context = contexts[field] || contexts.cargoLength

  return {
    expectedRange: context.expectedRange,
    commonMistakes: context.commonMistakes,
    vehicleNote: context.vehicleSpecific[vehicleType] || '',
  }
}
