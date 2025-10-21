import { createClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/chat-rag
 * Site-wide RAG chatbot with knowledge base integration
 * Can answer any business-related questions using vector similarity search
 */
export async function POST(request: Request) {
  try {
    const { messages, sessionId, context } = await request.json()

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

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
        { error: `Tenant not found: ${tenantSlug}` },
        { status: 404 }
      )
    }

    const tenantId = tenant.id

    // Get the last user message for RAG search
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop()

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400 }
      )
    }

    // Generate embedding for the user's question
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: lastUserMessage.content,
      }),
    })

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate embedding')
    }

    const embeddingData = await embeddingResponse.json()
    const questionEmbedding = embeddingData.data[0].embedding

    // Search knowledge base using vector similarity
    const { data: relevantKnowledge, error: searchError } = await supabase
      .rpc('search_knowledge_base', {
        query_embedding: questionEmbedding,
        similarity_threshold: 0.7,
        max_results: 5,
        search_tenant_id: tenantId,
      })

    if (searchError) {
      console.error('Knowledge base search error:', searchError)
    }

    // Build context from relevant knowledge
    let knowledgeContext = ''
    if (relevantKnowledge && relevantKnowledge.length > 0) {
      knowledgeContext = '\n\nRelevant information from our knowledge base:\n\n'
      relevantKnowledge.forEach((item, index) => {
        knowledgeContext += `[Source ${index + 1}] ${item.title}\n${item.content}\n\n`
      })
    }

    // Build comprehensive system prompt
    const systemPrompt = buildSystemPrompt(context, knowledgeContext)

    // Define function tools for order tracking, appointments, and customer service
    const tools = [
      {
        type: 'function',
        function: {
          name: 'get_order_status',
          description: 'Get the status, delivery date, and history of a customer order',
          parameters: {
            type: 'object',
            properties: {
              order_number: {
                type: 'string',
                description: 'The order number or confirmation number',
              },
              email: {
                type: 'string',
                description: 'Customer email address associated with the order',
              },
            },
            required: ['order_number', 'email'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'schedule_appointment',
          description: 'Schedule or modify a delivery/installation appointment',
          parameters: {
            type: 'object',
            properties: {
              order_number: {
                type: 'string',
                description: 'The order number',
              },
              email: {
                type: 'string',
                description: 'Customer email address',
              },
              preferred_date: {
                type: 'string',
                description: 'Preferred appointment date (YYYY-MM-DD format)',
              },
              preferred_time: {
                type: 'string',
                description: 'Preferred time slot (morning, afternoon, evening)',
              },
              action: {
                type: 'string',
                enum: ['schedule', 'modify', 'cancel'],
                description: 'Type of appointment action',
              },
            },
            required: ['order_number', 'email', 'action'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'recommend_product',
          description: 'Recommend the best ramp model based on customer requirements (motorcycle weight, truck type, budget)',
          parameters: {
            type: 'object',
            properties: {
              motorcycle_weight: {
                type: 'number',
                description: 'Weight of the motorcycle in pounds',
              },
              truck_bed_height: {
                type: 'number',
                description: 'Truck bed height in inches from ground',
              },
              budget: {
                type: 'string',
                enum: ['budget', 'standard', 'premium', 'any'],
                description: 'Customer budget preference',
              },
              motorcycle_type: {
                type: 'string',
                description: 'Type of motorcycle (cruiser, sport bike, touring, dirt bike, etc.)',
              },
            },
            required: ['motorcycle_weight'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'calculate_shipping',
          description: 'Calculate shipping cost and estimated delivery time based on customer location',
          parameters: {
            type: 'object',
            properties: {
              zip_code: {
                type: 'string',
                description: 'Customer ZIP code or postal code',
              },
              product_sku: {
                type: 'string',
                description: 'Product SKU (AUN250, AUN210, or AUN200)',
              },
              country: {
                type: 'string',
                description: 'Country code (US, CA, etc.)',
                default: 'US',
              },
            },
            required: ['zip_code'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'search_faq',
          description: 'Search FAQ knowledge base for quick answers to common questions',
          parameters: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                description: 'The customer question to search for in FAQs',
              },
              category: {
                type: 'string',
                enum: ['product', 'installation', 'shipping', 'warranty', 'returns', 'general'],
                description: 'FAQ category to search within (optional)',
              },
            },
            required: ['question'],
          },
        },
      },
    ]

    // Call OpenAI API with RAG context and function calling
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
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 700,
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
    const assistantChoice = data.choices[0]

    // Handle function calls if present
    if (assistantChoice.message.tool_calls) {
      const toolCalls = assistantChoice.message.tool_calls
      let functionResults = []

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)

        let functionResult
        if (functionName === 'get_order_status') {
          functionResult = await getOrderStatus(supabase, tenantId, functionArgs)

          // Trigger n8n order inquiry handler (non-blocking)
          if (functionResult.success) {
            triggerOrderInquiryWebhook(functionArgs, functionResult).catch(console.error)
          }
        } else if (functionName === 'schedule_appointment') {
          functionResult = await scheduleAppointment(supabase, tenantId, functionArgs)

          // Trigger n8n appointment automation (non-blocking)
          if (functionResult.success) {
            triggerAppointmentWebhook(functionArgs, functionResult).catch(console.error)
          }
        } else if (functionName === 'recommend_product') {
          functionResult = await recommendProduct(supabase, tenantId, functionArgs)
        } else if (functionName === 'calculate_shipping') {
          functionResult = await calculateShipping(functionArgs)
        } else if (functionName === 'search_faq') {
          functionResult = await searchFAQ(supabase, tenantId, functionArgs)
        }

        functionResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult),
        })
      }

      // Call GPT-4 again with function results
      const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            assistantChoice.message,
            ...functionResults,
          ],
          temperature: 0.7,
          max_tokens: 700,
        }),
      })

      if (!secondResponse.ok) {
        throw new Error('Failed to get function response from OpenAI')
      }

      const secondData = await secondResponse.json()
      var assistantMessage = secondData.choices[0].message.content
    } else {
      var assistantMessage = assistantChoice.message.content
    }

    // Generate suggested follow-up questions
    const suggestedQuestions = generateSuggestedQuestions(lastUserMessage.content, assistantMessage)

    // Store conversation in database
    if (sessionId) {
      try {
        // Check if session exists
        const { data: existingSession } = await supabase
          .from('chat_sessions')
          .select('id')
          .eq('session_id', sessionId)
          .single()

        if (!existingSession) {
          // Create new session
          const { data: newSession } = await supabase
            .from('chat_sessions')
            .insert({
              tenant_id: tenantId,
              session_id: sessionId,
              context: context || {},
            })
            .select('id')
            .single()

          if (newSession) {
            // Store user message
            await supabase.from('chat_messages').insert({
              tenant_id: tenantId,
              session_id: newSession.id,
              role: 'user',
              content: lastUserMessage.content,
              embedding: questionEmbedding,
            })

            // Store assistant message
            await supabase.from('chat_messages').insert({
              tenant_id: tenantId,
              session_id: newSession.id,
              role: 'assistant',
              content: assistantMessage,
            })
          }
        } else {
          // Add messages to existing session
          await supabase.from('chat_messages').insert([
            {
              tenant_id: tenantId,
              session_id: existingSession.id,
              role: 'user',
              content: lastUserMessage.content,
              embedding: questionEmbedding,
            },
            {
              tenant_id: tenantId,
              session_id: existingSession.id,
              role: 'assistant',
              content: assistantMessage,
            },
          ])
        }
      } catch (dbError) {
        console.error('Error storing conversation:', dbError)
        // Continue anyway - don't fail the request
      }
    }

    return NextResponse.json({
      type: 'message',
      content: assistantMessage,
      sources: relevantKnowledge?.map((k) => ({
        title: k.title,
        category: k.category,
        similarity: k.similarity,
      })) || [],
      suggestedQuestions,
    })
  } catch (error) {
    console.error('Error in RAG chat API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get order status from database
 */
async function getOrderStatus(supabase: any, tenantId: string, args: { order_number: string; email: string }) {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          products (name, sku)
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('order_number', args.order_number)
      .eq('customer_email', args.email)
      .single()

    if (error || !order) {
      return {
        success: false,
        message: 'Order not found. Please verify your order number and email address.',
      }
    }

    return {
      success: true,
      order: {
        order_number: order.order_number,
        status: order.status,
        order_date: order.created_at,
        total: order.total_amount,
        items: order.order_items,
        shipping_address: order.shipping_address,
        expected_delivery: order.expected_delivery_date,
        appointment_date: order.appointment_date,
        tracking_number: order.tracking_number,
      },
    }
  } catch (error) {
    console.error('Error fetching order:', error)
    return {
      success: false,
      message: 'An error occurred while retrieving your order. Please contact support.',
    }
  }
}

/**
 * Schedule or modify appointment
 */
async function scheduleAppointment(
  supabase: any,
  tenantId: string,
  args: {
    order_number: string
    email: string
    action: 'schedule' | 'modify' | 'cancel'
    preferred_date?: string
    preferred_time?: string
  }
) {
  try {
    // First verify the order exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, status')
      .eq('tenant_id', tenantId)
      .eq('order_number', args.order_number)
      .eq('customer_email', args.email)
      .single()

    if (orderError || !order) {
      return {
        success: false,
        message: 'Order not found. Please verify your order number and email address.',
      }
    }

    if (args.action === 'cancel') {
      const { error } = await supabase
        .from('orders')
        .update({ appointment_date: null, appointment_time_slot: null })
        .eq('id', order.id)

      if (error) throw error

      return {
        success: true,
        message: 'Your appointment has been cancelled successfully.',
      }
    }

    if (args.action === 'schedule' || args.action === 'modify') {
      if (!args.preferred_date) {
        return {
          success: false,
          message: 'Please provide a preferred date for the appointment.',
        }
      }

      const { error } = await supabase
        .from('orders')
        .update({
          appointment_date: args.preferred_date,
          appointment_time_slot: args.preferred_time || 'morning',
        })
        .eq('id', order.id)

      if (error) throw error

      return {
        success: true,
        message: `Your ${args.action === 'modify' ? 'appointment has been updated' : 'appointment has been scheduled'} for ${args.preferred_date} (${args.preferred_time || 'morning'}).`,
        appointment: {
          date: args.preferred_date,
          time_slot: args.preferred_time || 'morning',
        },
      }
    }

    return {
      success: false,
      message: 'Invalid action specified.',
    }
  } catch (error) {
    console.error('Error scheduling appointment:', error)
    return {
      success: false,
      message: 'An error occurred while scheduling your appointment. Please contact support.',
    }
  }
}

/**
 * Trigger n8n appointment automation webhook (non-blocking)
 */
async function triggerAppointmentWebhook(args: any, functionResult: any) {
  try {
    const webhookUrl = process.env.N8N_APPOINTMENT_WEBHOOK
    if (!webhookUrl) {
      console.warn('N8N_APPOINTMENT_WEBHOOK not configured')
      return
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_number: args.order_number,
        customer_email: args.email,
        appointment_date: functionResult.appointment?.date || args.preferred_date,
        appointment_time_slot: functionResult.appointment?.time_slot || args.preferred_time || 'morning',
        action: args.action,
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (error) {
    // Log but don't fail - user already got confirmation
    console.error('Failed to trigger appointment automation:', error)
  }
}

/**
 * Trigger n8n order inquiry handler webhook (non-blocking)
 */
async function triggerOrderInquiryWebhook(args: any, functionResult: any) {
  try {
    const webhookUrl = process.env.N8N_ORDER_INQUIRY_WEBHOOK
    if (!webhookUrl) {
      console.warn('N8N_ORDER_INQUIRY_WEBHOOK not configured')
      return
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_number: args.order_number,
        customer_email: args.email,
        status: functionResult.order?.status || 'unknown',
        inquiry_type: 'status_check',
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (error) {
    // Log but don't fail - user already got their answer
    console.error('Failed to trigger order inquiry handler:', error)
  }
}

/**
 * Generate suggested follow-up questions based on conversation context
 */
function generateSuggestedQuestions(userQuestion: string, assistantResponse: string): string[] {
  const lowerQuestion = userQuestion.toLowerCase()
  const lowerResponse = assistantResponse.toLowerCase()

  // Product-related questions
  if (lowerQuestion.includes('aun250') || lowerResponse.includes('aun250')) {
    return [
      'What is the weight capacity of the AUN250?',
      'How much does the AUN250 cost with shipping?',
      'Does the AUN250 come with tie-down straps?',
    ]
  }

  if (lowerQuestion.includes('aun210') || lowerResponse.includes('aun210')) {
    return [
      'What is the difference between AUN250 and AUN210?',
      'Is the AUN210 suitable for a Gold Wing?',
      'Can I add extensions to the AUN210?',
    ]
  }

  // Shipping-related questions
  if (lowerQuestion.includes('shipping') || lowerQuestion.includes('delivery')) {
    return [
      'How much is shipping to my location?',
      'When will my order arrive?',
      'Do you offer free shipping?',
    ]
  }

  // Installation-related questions
  if (lowerQuestion.includes('install') || lowerQuestion.includes('assembly')) {
    return [
      'Do you offer professional installation services?',
      'How long does installation take?',
      'What tools do I need for installation?',
    ]
  }

  // Warranty-related questions
  if (lowerQuestion.includes('warranty') || lowerQuestion.includes('return')) {
    return [
      'What is covered under the warranty?',
      'How long is the warranty period?',
      'What is your return policy?',
    ]
  }

  // Order tracking questions
  if (lowerQuestion.includes('order') || lowerQuestion.includes('track')) {
    return [
      'How do I track my order?',
      'Can I change my delivery address?',
      'When can I schedule an installation appointment?',
    ]
  }

  // Default suggested questions
  return [
    'Which ramp is best for my motorcycle?',
    'What are your shipping costs?',
    'Do you offer installation services?',
  ]
}

/**
 * Recommend product based on customer requirements
 */
async function recommendProduct(
  supabase: any,
  tenantId: string,
  args: {
    motorcycle_weight: number
    truck_bed_height?: number
    budget?: string
    motorcycle_type?: string
  }
) {
  try {
    // Product database with specifications
    const products = [
      {
        sku: 'AUN250',
        name: 'AUN250 Folding Ramp',
        weight_capacity: 1000,
        price: 1299,
        category: 'premium',
        features: ['Folding design', 'Highest capacity', 'Maximum adjustability', 'Best for heavy touring bikes'],
        bed_height_range: [18, 48],
      },
      {
        sku: 'AUN210',
        name: 'AUN210 Standard Ramp',
        weight_capacity: 800,
        price: 999,
        category: 'standard',
        features: ['Excellent versatility', 'Most popular model', 'Great value', 'Fits most motorcycles'],
        bed_height_range: [18, 42],
      },
      {
        sku: 'AUN200',
        name: 'AUN200 Basic Ramp',
        weight_capacity: 600,
        price: 799,
        category: 'budget',
        features: ['Budget-friendly', 'Perfect for lighter bikes', 'Solid construction', 'Easy to use'],
        bed_height_range: [18, 36],
      },
    ]

    // Filter by weight capacity (with safety margin)
    let suitable = products.filter((p) => p.weight_capacity >= args.motorcycle_weight * 1.2)

    if (suitable.length === 0) {
      return {
        success: false,
        message: `For a ${args.motorcycle_weight} lb motorcycle, we recommend our AUN250 with 1,000 lb capacity for safety. Contact us at 800-687-4410 for heavy-duty options.`,
      }
    }

    // Filter by truck bed height if provided
    if (args.truck_bed_height) {
      suitable = suitable.filter(
        (p) => args.truck_bed_height! >= p.bed_height_range[0] && args.truck_bed_height! <= p.bed_height_range[1]
      )
    }

    // Filter by budget if provided
    if (args.budget && args.budget !== 'any') {
      suitable = suitable.filter((p) => p.category === args.budget)
    }

    // Sort by price (budget-conscious first, unless premium requested)
    if (args.budget === 'premium') {
      suitable.sort((a, b) => b.price - a.price)
    } else {
      suitable.sort((a, b) => a.price - b.price)
    }

    const recommended = suitable[0]
    const alternatives = suitable.slice(1)

    return {
      success: true,
      recommended: {
        sku: recommended.sku,
        name: recommended.name,
        price: recommended.price,
        weight_capacity: recommended.weight_capacity,
        features: recommended.features,
        fit_assessment: `Perfect fit for your ${args.motorcycle_weight} lb ${args.motorcycle_type || 'motorcycle'}`,
      },
      alternatives: alternatives.map((p) => ({
        sku: p.sku,
        name: p.name,
        price: p.price,
        weight_capacity: p.weight_capacity,
      })),
      reasoning: `Based on your ${args.motorcycle_weight} lb motorcycle, the ${recommended.name} provides ${recommended.weight_capacity} lb capacity with a comfortable safety margin.`,
    }
  } catch (error) {
    console.error('Error recommending product:', error)
    return {
      success: false,
      message: 'Error finding the right product. Please call us at 800-687-4410 for personalized recommendations.',
    }
  }
}

/**
 * Calculate shipping cost and delivery estimate
 */
async function calculateShipping(args: { zip_code: string; product_sku?: string; country?: string }) {
  try {
    const country = args.country || 'US'
    const zipCode = args.zip_code

    // Shipping zones (simplified - in production, use actual carrier API)
    const getShippingZone = (zip: string): number => {
      const firstDigit = parseInt(zip[0])
      // Zone 1: East Coast (0-2), Zone 2: Central (3-6), Zone 3: West Coast (7-9)
      if (firstDigit <= 2) return 1
      if (firstDigit <= 6) return 2
      return 3
    }

    if (country !== 'US') {
      return {
        success: true,
        cost: 150,
        delivery_days: '10-14',
        notes: 'International shipping. Additional customs fees may apply. Contact us for exact quote.',
      }
    }

    const zone = getShippingZone(zipCode)
    const baseCost = [49, 59, 69][zone - 1] // Zone-based pricing

    // Free shipping on orders over $500
    const orderValue = args.product_sku === 'AUN200' ? 799 : args.product_sku === 'AUN210' ? 999 : 1299

    const finalCost = orderValue >= 500 ? 0 : baseCost
    const deliveryDays = ['5-7', '6-8', '7-9'][zone - 1]

    return {
      success: true,
      cost: finalCost,
      delivery_days: deliveryDays,
      free_shipping: finalCost === 0,
      message: finalCost === 0
        ? `Free shipping! Your order qualifies for free standard ground shipping (${deliveryDays} business days).`
        : `Shipping to ${zipCode}: $${finalCost} (${deliveryDays} business days). Orders over $500 ship free!`,
      expedited_available: true,
      expedited_cost: finalCost === 0 ? 89 : finalCost + 40,
      expedited_days: '2-3',
    }
  } catch (error) {
    console.error('Error calculating shipping:', error)
    return {
      success: false,
      message: 'Unable to calculate shipping. Please call 800-687-4410 for a quote.',
    }
  }
}

/**
 * Search FAQ for quick answers
 */
async function searchFAQ(supabase: any, tenantId: string, args: { question: string; category?: string }) {
  try {
    // Search knowledge base for FAQ entries
    let query = supabase
      .from('knowledge_base')
      .select('title, content, category')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .ilike('content', `%${args.question}%`)
      .limit(3)

    if (args.category) {
      query = query.eq('category', args.category)
    }

    const { data: faqs, error } = await query

    if (error) throw error

    if (!faqs || faqs.length === 0) {
      return {
        success: false,
        message: 'No matching FAQ found. Let me search our full knowledge base for you.',
      }
    }

    return {
      success: true,
      results: faqs.map((faq) => ({
        question: faq.title,
        answer: faq.content,
        category: faq.category,
      })),
      message: `Found ${faqs.length} relevant FAQ ${faqs.length === 1 ? 'entry' : 'entries'}`,
    }
  } catch (error) {
    console.error('Error searching FAQ:', error)
    return {
      success: false,
      message: 'Error searching FAQs. Please visit our FAQ page at /faq for answers.',
    }
  }
}

/**
 * Build system prompt with business context and RAG knowledge
 */
function buildSystemPrompt(pageContext: any, knowledgeContext: string) {
  return `You are a helpful and knowledgeable customer service assistant for EZ Cycle Ramp, a company that manufactures premium motorcycle loading ramps.

Your role:
- Answer any business-related questions about products, shipping, installation, warranty, and policies
- Help customers choose the right ramp and accessories for their needs
- Provide accurate information based on the knowledge base
- Use the get_order_status function when customers ask about their orders (requires order number and email)
- Use the schedule_appointment function when customers want to schedule, modify, or cancel delivery/installation appointments
- Use the recommend_product function when customers need help choosing the right ramp (ask for motorcycle weight, truck type, budget)
- Use the calculate_shipping function when customers ask about shipping costs (ask for ZIP code)
- Use the search_faq function for quick answers to common questions
- Be friendly, professional, and patient
- Guide customers to complete their purchase when appropriate
- Never share sensitive business information (costs, margins, internal processes)
- If you don't know something, be honest and offer to connect them with a human agent

Current page context:
${JSON.stringify(pageContext, null, 2)}

${knowledgeContext}

Important guidelines:
- Always base your answers on the knowledge base information provided above
- If the knowledge base doesn't have the answer, say "I don't have that specific information, but I can connect you with our team at 800-687-4410"
- Be concise but thorough - aim for 2-4 sentences unless more detail is needed
- Use natural, conversational language
- Include specific product details (model numbers, prices, dimensions) when relevant
- Proactively suggest related products or services when helpful
- For safety-critical questions, always recommend calling for personalized advice

Key contact information:
- Phone: 800-687-4410
- Email: support@ezcycleramp.com
- Business hours: Monday-Friday 8 AM - 6 PM EST, Saturday 9 AM - 2 PM EST

Remember: You represent EZ Cycle Ramp. Be helpful, accurate, and always prioritize customer safety and satisfaction.`
}
