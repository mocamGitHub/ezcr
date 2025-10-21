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
    const surveyType = searchParams.get('survey_type') // 'chat', 'post_purchase', 'nps'
    const startDate = searchParams.get('start_date') // ISO date string
    const endDate = searchParams.get('end_date') // ISO date string

    // Build query
    let query = supabase
      .from('survey_responses')
      .select('*')
      .eq('tenant_id', tenant.id)

    if (surveyType) {
      query = query.eq('survey_type', surveyType)
    }

    if (startDate) {
      query = query.gte('submitted_at', startDate)
    }

    if (endDate) {
      query = query.lte('submitted_at', endDate)
    }

    const { data: responses, error } = await query

    if (error) {
      console.error('Error fetching survey responses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch survey data' },
        { status: 500 }
      )
    }

    // Calculate analytics
    const totalResponses = responses?.length || 0

    // Rating analytics (1-5 stars)
    const ratingsData = responses?.filter(r => r.rating) || []
    const avgRating = ratingsData.length > 0
      ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
      : 0
    const ratingDistribution = {
      1: ratingsData.filter(r => r.rating === 1).length,
      2: ratingsData.filter(r => r.rating === 2).length,
      3: ratingsData.filter(r => r.rating === 3).length,
      4: ratingsData.filter(r => r.rating === 4).length,
      5: ratingsData.filter(r => r.rating === 5).length,
    }
    const positiveResponses = ratingsData.filter(r => r.rating >= 4).length
    const negativeResponses = ratingsData.filter(r => r.rating <= 2).length
    const satisfactionRate = ratingsData.length > 0
      ? (positiveResponses / ratingsData.length) * 100
      : 0

    // NPS analytics (0-10 score)
    const npsData = responses?.filter(r => r.nps_score !== null) || []
    const avgNpsScore = npsData.length > 0
      ? npsData.reduce((sum, r) => sum + r.nps_score, 0) / npsData.length
      : 0
    const promoters = npsData.filter(r => r.nps_score >= 9).length
    const passives = npsData.filter(r => r.nps_score >= 7 && r.nps_score <= 8).length
    const detractors = npsData.filter(r => r.nps_score <= 6).length
    const npsScore = npsData.length > 0
      ? ((promoters - detractors) / npsData.length) * 100
      : 0

    // Post-purchase specific analytics
    const postPurchaseData = responses?.filter(r => r.survey_type === 'post_purchase' && r.response_data) || []
    const avgProductRating = postPurchaseData.length > 0
      ? postPurchaseData.reduce((sum, r) => sum + (r.response_data?.product_rating || 0), 0) / postPurchaseData.length
      : 0
    const avgDeliveryRating = postPurchaseData.length > 0
      ? postPurchaseData.reduce((sum, r) => sum + (r.response_data?.delivery_rating || 0), 0) / postPurchaseData.length
      : 0
    const avgInstallationRating = postPurchaseData.filter(r => r.response_data?.installation_rating).length > 0
      ? postPurchaseData
          .filter(r => r.response_data?.installation_rating)
          .reduce((sum, r) => sum + (r.response_data.installation_rating || 0), 0) /
        postPurchaseData.filter(r => r.response_data?.installation_rating).length
      : 0
    const recommendationRate = postPurchaseData.length > 0
      ? (postPurchaseData.filter(r => r.response_data?.would_recommend === 'yes').length / postPurchaseData.length) * 100
      : 0

    // Chat specific analytics
    const chatData = responses?.filter(r => r.survey_type === 'chat' && r.response_data) || []
    const resolutionRate = chatData.length > 0
      ? (chatData.filter(r => r.response_data?.resolution === 'yes').length / chatData.length) * 100
      : 0

    // Time-series data (by day)
    const timeSeriesData: { [key: string]: { count: number; avgRating: number } } = {}
    responses?.forEach((r) => {
      const date = new Date(r.submitted_at).toISOString().split('T')[0]
      if (!timeSeriesData[date]) {
        timeSeriesData[date] = { count: 0, avgRating: 0 }
      }
      timeSeriesData[date].count++
      if (r.rating) {
        timeSeriesData[date].avgRating =
          (timeSeriesData[date].avgRating * (timeSeriesData[date].count - 1) + r.rating) /
          timeSeriesData[date].count
      }
    })

    // Recent feedback (last 10)
    const recentFeedback = responses
      ?.filter(r => r.feedback_text)
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        survey_type: r.survey_type,
        rating: r.rating,
        feedback: r.feedback_text,
        submitted_at: r.submitted_at,
      }))

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalResponses,
          avgRating: Number(avgRating.toFixed(2)),
          satisfactionRate: Number(satisfactionRate.toFixed(1)),
          positiveResponses,
          negativeResponses,
        },
        ratings: {
          distribution: ratingDistribution,
        },
        nps: {
          score: Number(npsScore.toFixed(1)),
          avgScore: Number(avgNpsScore.toFixed(2)),
          promoters,
          passives,
          detractors,
        },
        postPurchase: {
          avgProductRating: Number(avgProductRating.toFixed(2)),
          avgDeliveryRating: Number(avgDeliveryRating.toFixed(2)),
          avgInstallationRating: Number(avgInstallationRating.toFixed(2)),
          recommendationRate: Number(recommendationRate.toFixed(1)),
        },
        chat: {
          resolutionRate: Number(resolutionRate.toFixed(1)),
        },
        timeSeries: Object.entries(timeSeriesData).map(([date, data]) => ({
          date,
          count: data.count,
          avgRating: Number(data.avgRating.toFixed(2)),
        })),
        recentFeedback,
      },
    })
  } catch (error) {
    console.error('Error in survey analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
