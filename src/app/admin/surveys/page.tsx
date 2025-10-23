'use client'

import { useState, useEffect } from 'react'
import { Star, TrendingUp, Users, MessageCircle, Package, ThumbsUp } from 'lucide-react'

interface SurveyAnalytics {
  overview: {
    totalResponses: number
    avgRating: number
    satisfactionRate: number
    positiveResponses: number
    negativeResponses: number
  }
  ratings: {
    distribution: { [key: number]: number }
  }
  nps: {
    score: number
    avgScore: number
    promoters: number
    passives: number
    detractors: number
  }
  postPurchase: {
    avgProductRating: number
    avgDeliveryRating: number
    avgInstallationRating: number
    recommendationRate: number
  }
  chat: {
    resolutionRate: number
  }
  timeSeries: Array<{ date: string; count: number; avgRating: number }>
  recentFeedback: Array<{
    id: string
    survey_type: string
    rating: number
    feedback: string
    submitted_at: string
  }>
}

export default function SurveyAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [surveyType, setSurveyType] = useState<'all' | 'chat' | 'post_purchase'>('all')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [surveyType, dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (surveyType !== 'all') {
        params.append('survey_type', surveyType)
      }

      // Calculate date range
      if (dateRange !== 'all') {
        const days = parseInt(dateRange)
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        params.append('start_date', startDate.toISOString())
      }

      const response = await fetch(`/api/surveys/analytics?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground">Failed to load analytics</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Customer Satisfaction Analytics</h1>
          <p className="text-muted-foreground">Track and analyze customer feedback and satisfaction</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <div>
            <label className="text-sm font-medium mb-2 block">Survey Type</label>
            <select
              value={surveyType}
              onChange={(e) => setSurveyType(e.target.value as any)}
              className="px-4 py-2 border rounded-lg bg-background"
            >
              <option value="all">All Surveys</option>
              <option value="chat">Chat Surveys</option>
              <option value="post_purchase">Post-Purchase Surveys</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 border rounded-lg bg-background"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Responses</p>
              <Users className="w-5 h-5 text-[#0B5394]" />
            </div>
            <p className="text-3xl font-bold">{analytics.overview.totalResponses}</p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
              <Star className="w-5 h-5 text-[#F78309]" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{analytics.overview.avgRating}</p>
              <p className="text-sm text-muted-foreground">/ 5.0</p>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Satisfaction Rate</p>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold">{analytics.overview.satisfactionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.overview.positiveResponses} positive / {analytics.overview.negativeResponses} negative
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">NPS Score</p>
              <ThumbsUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold">{analytics.nps.score}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.nps.promoters} promoters / {analytics.nps.detractors} detractors
            </p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">Rating Distribution</h2>
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = analytics.ratings.distribution[rating] || 0
              const percentage = analytics.overview.totalResponses > 0
                ? (count / analytics.overview.totalResponses) * 100
                : 0

              return (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-24">
                    <span className="font-medium">{rating}</span>
                    <Star className="w-4 h-4 fill-[#F78309] text-[#F78309]" />
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-[#F78309] h-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-24 text-right">
                    <span className="font-medium">{count}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Post-Purchase & Chat Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Post-Purchase Metrics */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-[#F78309]" />
              <h2 className="text-xl font-bold">Post-Purchase Metrics</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Product Rating</span>
                  <span className="font-bold">{analytics.postPurchase.avgProductRating} / 5.0</span>
                </div>
                <div className="bg-muted rounded-full h-2">
                  <div
                    className="bg-[#F78309] h-full rounded-full"
                    style={{ width: `${(analytics.postPurchase.avgProductRating / 5) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Delivery Rating</span>
                  <span className="font-bold">{analytics.postPurchase.avgDeliveryRating} / 5.0</span>
                </div>
                <div className="bg-muted rounded-full h-2">
                  <div
                    className="bg-[#0B5394] h-full rounded-full"
                    style={{ width: `${(analytics.postPurchase.avgDeliveryRating / 5) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Installation Rating</span>
                  <span className="font-bold">
                    {analytics.postPurchase.avgInstallationRating > 0
                      ? `${analytics.postPurchase.avgInstallationRating} / 5.0`
                      : 'N/A'}
                  </span>
                </div>
                <div className="bg-muted rounded-full h-2">
                  <div
                    className="bg-green-600 h-full rounded-full"
                    style={{ width: `${(analytics.postPurchase.avgInstallationRating / 5) * 100}%` }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="font-medium">Would Recommend</span>
                  <span className="text-2xl font-bold text-green-600">
                    {analytics.postPurchase.recommendationRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Metrics */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <MessageCircle className="w-5 h-5 text-[#0B5394]" />
              <h2 className="text-xl font-bold">Chat Support Metrics</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Resolution Rate</span>
                  <span className="text-2xl font-bold text-green-600">
                    {analytics.chat.resolutionRate}%
                  </span>
                </div>
                <div className="bg-muted rounded-full h-3">
                  <div
                    className="bg-green-600 h-full rounded-full"
                    style={{ width: `${analytics.chat.resolutionRate}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Percentage of chats where customer's question was resolved
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-6">Recent Feedback</h2>
          <div className="space-y-4">
            {analytics.recentFeedback.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No feedback available</p>
            ) : (
              analytics.recentFeedback.map((feedback) => (
                <div key={feedback.id} className="border-l-4 border-[#F78309] pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium px-2 py-1 bg-muted rounded">
                        {feedback.survey_type === 'chat' ? 'Chat' : 'Post-Purchase'}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(feedback.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-[#F78309] text-[#F78309]" />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(feedback.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{feedback.feedback}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
