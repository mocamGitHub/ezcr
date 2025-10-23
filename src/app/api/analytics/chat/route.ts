import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get tenant from headers or use default
    const tenantSlug = request.headers.get('x-tenant-slug') || 'ezcr-dev'

    // Get tenant_id
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

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Fetch chat activities (from CRM activity table)
    let activitiesQuery = supabase
      .from('activities')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('activity_type', 'chat')

    if (startDate) {
      activitiesQuery = activitiesQuery.gte('created_at', startDate)
    }

    if (endDate) {
      activitiesQuery = activitiesQuery.lte('created_at', endDate)
    }

    const { data: activities, error: activitiesError } = await activitiesQuery

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError)
      return NextResponse.json(
        { error: 'Failed to fetch chat data' },
        { status: 500 }
      )
    }

    // Fetch chat survey responses for satisfaction metrics
    let surveyQuery = supabase
      .from('survey_responses')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('survey_type', 'chat')

    if (startDate) {
      surveyQuery = surveyQuery.gte('submitted_at', startDate)
    }

    if (endDate) {
      surveyQuery = surveyQuery.lte('submitted_at', endDate)
    }

    const { data: surveys } = await surveyQuery

    // Calculate metrics
    const totalChats = activities?.length || 0

    // Group by date for time series
    const chatsByDate: { [key: string]: number } = {}
    activities?.forEach((activity) => {
      const date = new Date(activity.created_at).toISOString().split('T')[0]
      chatsByDate[date] = (chatsByDate[date] || 0) + 1
    })

    // Extract common topics/questions from notes
    const topics: { [key: string]: number } = {}
    activities?.forEach((activity) => {
      if (activity.notes) {
        const note = activity.notes.toLowerCase()
        // Simple keyword extraction (you could use more sophisticated NLP)
        if (note.includes('shipping')) topics['shipping'] = (topics['shipping'] || 0) + 1
        if (note.includes('warranty')) topics['warranty'] = (topics['warranty'] || 0) + 1
        if (note.includes('installation')) topics['installation'] = (topics['installation'] || 0) + 1
        if (note.includes('price') || note.includes('cost')) topics['pricing'] = (topics['pricing'] || 0) + 1
        if (note.includes('product') || note.includes('ramp')) topics['product_info'] = (topics['product_info'] || 0) + 1
        if (note.includes('return')) topics['returns'] = (topics['returns'] || 0) + 1
      }
    })

    // Survey metrics
    const totalSurveys = surveys?.length || 0
    const avgRating = surveys && surveys.length > 0
      ? surveys.reduce((sum, s) => sum + (s.rating || 0), 0) / surveys.filter(s => s.rating).length
      : 0
    const resolutionRate = surveys && surveys.length > 0
      ? (surveys.filter(s => s.response_data?.resolution === 'yes').length / surveys.length) * 100
      : 0

    // Recent chats
    const recentChats = activities
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(activity => ({
        id: activity.id,
        customer_id: activity.customer_id,
        notes: activity.notes,
        created_at: activity.created_at,
      }))

    // Calculate average chats per day
    const uniqueDates = Object.keys(chatsByDate).length
    const avgChatsPerDay = uniqueDates > 0 ? totalChats / uniqueDates : 0

    // Top topics sorted by frequency
    const topTopics = Object.entries(topics)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalChats,
          totalSurveys,
          avgRating: Number(avgRating.toFixed(2)),
          resolutionRate: Number(resolutionRate.toFixed(1)),
          surveyResponseRate: totalChats > 0 ? Number(((totalSurveys / totalChats) * 100).toFixed(1)) : 0,
          avgChatsPerDay: Number(avgChatsPerDay.toFixed(1)),
        },
        timeSeries: Object.entries(chatsByDate)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        topTopics,
        recentChats: recentChats || [],
      },
    })
  } catch (error) {
    console.error('Error in chat analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
