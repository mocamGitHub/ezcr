import { createClient } from '@/lib/supabase/server'
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

    // Get tenant ID
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'ezcr-01')
      .single()

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
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

    // Define function tools for order tracking and appointments
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
        } else if (functionName === 'schedule_appointment') {
          functionResult = await scheduleAppointment(supabase, tenantId, functionArgs)
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
