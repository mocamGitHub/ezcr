import { NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { aiChatSchema, validateRequest } from '@/lib/validations/api-schemas'
import { PRODUCT_INFO, MEASUREMENT_GUIDELINES, CONVERSATIONAL_TIPS } from '@/lib/ai/constants'

export const dynamic = 'force-dynamic'

// Configuration context type for chat
interface ConfigurationContext {
  vehicleType?: string
  cargoLength?: number
  totalLength?: number
  loadHeight?: number
  motorcycleType?: string
  motorcycleWeight?: number
  wheelbase?: number
  motorcycleLength?: number
  selectedModel?: string
  accessories?: string[]
}

/**
 * POST /api/ai/chat
 * Configurator chat assistant powered by GPT-4
 * Helps users through the configuration process conversationally
 */
export async function POST(request: Request) {
  // Rate limit: 20 requests per minute for AI endpoints
  const rateLimit = withRateLimit(request, RATE_LIMITS.ai)
  if (rateLimit.limited) {
    return rateLimit.response
  }

  try {
    const body = await request.json()

    // Validate input using Zod schema
    const validation = validateRequest(aiChatSchema, body)
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 })
    }

    const { messages, configurationContext } = validation.data

    // Get OpenAI API key
    const openAIKey = process.env.OPENAI_API_KEY

    if (!openAIKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(configurationContext)

    // Call OpenAI API with configurable model
    const aiModel = process.env.OPENAI_CHAT_MODEL || 'gpt-4'
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
        functions: [
          {
            name: 'update_configurator',
            description: 'Update the configurator form with extracted measurements and selections',
            parameters: {
              type: 'object',
              properties: {
                vehicleType: {
                  type: 'string',
                  enum: ['pickup', 'van', 'trailer'],
                  description: 'Type of vehicle',
                },
                cargoLength: {
                  type: 'number',
                  description: 'Cargo area length in inches',
                },
                totalLength: {
                  type: 'number',
                  description: 'Total length with tailgate open in inches',
                },
                loadHeight: {
                  type: 'number',
                  description: 'Height from ground to cargo bed in inches',
                },
                motorcycleType: {
                  type: 'string',
                  enum: ['sport', 'cruiser', 'adventure'],
                  description: 'Type of motorcycle',
                },
                motorcycleWeight: {
                  type: 'number',
                  description: 'Weight of motorcycle in pounds',
                },
                wheelbase: {
                  type: 'number',
                  description: 'Motorcycle wheelbase in inches',
                },
                motorcycleLength: {
                  type: 'number',
                  description: 'Motorcycle overall length in inches',
                },
              },
            },
          },
          {
            name: 'get_product_recommendation',
            description: 'Get specific product recommendations based on measurements',
            parameters: {
              type: 'object',
              properties: {
                height: {
                  type: 'number',
                  description: 'Load height in inches',
                },
                weight: {
                  type: 'number',
                  description: 'Motorcycle weight in pounds',
                },
              },
              required: ['height', 'weight'],
            },
          },
        ],
        function_call: 'auto',
      }),
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.statusText)
      return NextResponse.json(
        { error: 'Failed to get AI response' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const choice = data.choices[0]

    // Check if AI wants to call a function
    if (choice.message.function_call) {
      const functionName = choice.message.function_call.name
      const functionArgs = JSON.parse(choice.message.function_call.arguments)

      return NextResponse.json({
        type: 'function_call',
        function: functionName,
        arguments: functionArgs,
        message: choice.message,
      })
    }

    // Regular text response
    return NextResponse.json({
      type: 'message',
      content: choice.message.content,
      message: choice.message,
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Build system prompt with current configuration context
 */
function buildSystemPrompt(context: ConfigurationContext | undefined) {
  return `You are a friendly and knowledgeable assistant for EZ Cycle Ramp, helping customers configure the perfect motorcycle loading ramp.

Your role:
- Help users measure their vehicle correctly
- Extract measurements from natural language (e.g., "about 6 and a half feet" → 78 inches)
- Recommend the right ramp model and extensions
- Explain WHY certain products are needed
- Be encouraging and patient, especially with elderly customers (45-65 age group)
- Ask clarifying questions if measurements seem unusual

Current configuration context:
${JSON.stringify(context, null, 2)}

${PRODUCT_INFO}

${MEASUREMENT_GUIDELINES}

${CONVERSATIONAL_TIPS}

When you have enough information, use the update_configurator function to fill in the form.
When asked for recommendations, use the get_product_recommendation function.

Celebrate when configuration is complete!`
}
