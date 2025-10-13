import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/chat
 * Configurator chat assistant powered by GPT-4
 * Helps users through the configuration process conversationally
 */
export async function POST(request: Request) {
  try {
    const { messages, configurationContext } = await request.json()

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

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
function buildSystemPrompt(context: any) {
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

Important product information:
- AUN250: Heavy-duty folding ramp, 2,500 lb capacity, $1,299
- AUN210: Standard folding ramp, 2,000 lb capacity, $999
- AC001-1 Extension: For load heights 35-42 inches, $149
- AC001-2 Extension: For load heights 43-51 inches, $249
- AC001-3 Extension: For load heights 52-60 inches, $349
- Cargo extension: Needed if cargo area >80 inches

Measurement guidelines:
- Pickup trucks: Bed length typically 60-96 inches, height 30-45 inches
- Vans: Cargo area 70-140 inches, height 20-35 inches
- Trailers: Bed length 70-100 inches, height 20-40 inches
- Motorcycles: Most cruisers 700-900 lbs, sport bikes 400-500 lbs, adventure 500-600 lbs

Conversational tips:
- Use simple language, avoid technical jargon
- Convert feet to inches naturally (6.5 ft = 78 inches)
- Provide ranges when guessing (e.g., "Most Ford F-150s are about 36-40 inches high")
- Offer to help with specific measurements
- Celebrate when configuration is complete

When you have enough information, use the update_configurator function to fill in the form.
When asked for recommendations, use the get_product_recommendation function.

Be concise but warm - aim for 2-3 sentences per response unless explaining complex measurements.`
}
