'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  MessageCircle,
  Star,
  TrendingUp,
  Users,
  CheckCircle,
  Package,
  ThumbsUp,
  ArrowRight,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CombinedAnalytics {
  chat: {
    totalChats: number
    avgRating: number
    resolutionRate: number
    avgChatsPerDay: number
  }
  surveys: {
    totalResponses: number
    avgRating: number
    satisfactionRate: number
    npsScore: number
  }
  postPurchase: {
    avgProductRating: number
    avgDeliveryRating: number
    recommendationRate: number
  }
}

export default function AnalyticsOverview() {
  const [analytics, setAnalytics] = useState<CombinedAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      // Calculate date range
      const days = parseInt(dateRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      params.append('start_date', startDate.toISOString())

      // Fetch both chat and survey analytics in parallel
      const [chatResponse, surveyResponse] = await Promise.all([
        fetch(`/api/analytics/chat?${params.toString()}`),
        fetch(`/api/surveys/analytics?${params.toString()}`),
      ])

      const [chatData, surveyData] = await Promise.all([
        chatResponse.json(),
        surveyResponse.json(),
      ])

      if (chatData.success && surveyData.success) {
        setAnalytics({
          chat: {
            totalChats: chatData.analytics.overview.totalChats,
            avgRating: chatData.analytics.overview.avgRating,
            resolutionRate: chatData.analytics.overview.resolutionRate,
            avgChatsPerDay: chatData.analytics.overview.avgChatsPerDay,
          },
          surveys: {
            totalResponses: surveyData.analytics.overview.totalResponses,
            avgRating: surveyData.analytics.overview.avgRating,
            satisfactionRate: surveyData.analytics.overview.satisfactionRate,
            npsScore: surveyData.analytics.nps.score,
          },
          postPurchase: {
            avgProductRating: surveyData.analytics.postPurchase.avgProductRating,
            avgDeliveryRating: surveyData.analytics.postPurchase.avgDeliveryRating,
            recommendationRate: surveyData.analytics.postPurchase.recommendationRate,
          },
        })
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

  // Calculate overall health score (0-100)
  const healthScore = Math.round(
    (analytics.chat.avgRating / 5) * 20 +
    (analytics.chat.resolutionRate / 100) * 20 +
    (analytics.surveys.avgRating / 5) * 20 +
    (analytics.surveys.satisfactionRate / 100) * 20 +
    (analytics.postPurchase.recommendationRate / 100) * 20
  )

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics Overview</h1>
          <p className="text-muted-foreground">
            Comprehensive view of customer support and satisfaction metrics
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="mb-8">
          <label className="text-sm font-medium mb-2 block">Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border rounded-lg bg-background"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>

        {/* Overall Health Score */}
        <div className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white rounded-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Customer Experience Health Score</h2>
              <p className="text-blue-100">
                Based on chat performance, satisfaction ratings, and customer feedback
              </p>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold">{healthScore}</div>
              <div className="text-sm uppercase tracking-wide text-blue-100">/ 100</div>
              <div className="mt-2 text-sm">
                {healthScore >= 80 ? '🎉 Excellent' : healthScore >= 60 ? '👍 Good' : '⚠️ Needs Improvement'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Chats</p>
              <MessageCircle className="w-5 h-5 text-[#0B5394]" />
            </div>
            <p className="text-3xl font-bold">{analytics.chat.totalChats}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {analytics.chat.avgChatsPerDay.toFixed(1)} per day
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
              <Star className="w-5 h-5 text-[#F78309]" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{analytics.surveys.avgRating}</p>
              <p className="text-sm text-muted-foreground">/ 5.0</p>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Satisfaction</p>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold">{analytics.surveys.satisfactionRate}%</p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">NPS Score</p>
              <ThumbsUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold">{analytics.surveys.npsScore}</p>
          </div>
        </div>

        {/* Chat Performance Section */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-[#0B5394]" />
              <h2 className="text-2xl font-bold">Chat Performance</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/chat-analytics" className="flex items-center gap-2">
                View Details <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Avg Chat Rating</p>
              <div className="flex items-center justify-center gap-2">
                <Star className="w-5 h-5 fill-[#F78309] text-[#F78309]" />
                <p className="text-2xl font-bold">{analytics.chat.avgRating}</p>
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Resolution Rate</p>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-2xl font-bold">{analytics.chat.resolutionRate}%</p>
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Daily Volume</p>
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#0B5394]" />
                <p className="text-2xl font-bold">{analytics.chat.avgChatsPerDay.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Satisfaction Section */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 text-[#F78309]" />
              <h2 className="text-2xl font-bold">Customer Satisfaction</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/surveys" className="flex items-center gap-2">
                View Details <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Total Surveys</p>
              <p className="text-2xl font-bold">{analytics.surveys.totalResponses}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Avg Rating</p>
              <div className="flex items-center justify-center gap-2">
                <Star className="w-5 h-5 fill-[#F78309] text-[#F78309]" />
                <p className="text-2xl font-bold">{analytics.surveys.avgRating}</p>
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Positive Rate</p>
              <p className="text-2xl font-bold text-green-600">{analytics.surveys.satisfactionRate}%</p>
            </div>
          </div>
        </div>

        {/* Post-Purchase Metrics Section */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-[#0B5394]" />
              <h2 className="text-2xl font-bold">Post-Purchase Experience</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Product Rating</span>
                <span className="font-bold">{analytics.postPurchase.avgProductRating} / 5.0</span>
              </div>
              <div className="bg-muted rounded-full h-3">
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
              <div className="bg-muted rounded-full h-3">
                <div
                  className="bg-[#0B5394] h-full rounded-full"
                  style={{ width: `${(analytics.postPurchase.avgDeliveryRating / 5) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Would Recommend</span>
                <span className="font-bold text-green-600">{analytics.postPurchase.recommendationRate}%</span>
              </div>
              <div className="bg-muted rounded-full h-3">
                <div
                  className="bg-green-600 h-full rounded-full"
                  style={{ width: `${analytics.postPurchase.recommendationRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/chat-analytics"
            className="border rounded-lg p-6 hover:border-[#0B5394] hover:bg-[#0B5394]/5 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">Chat Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Detailed chat volume, topics, and performance metrics
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-[#0B5394] transition-colors" />
            </div>
          </Link>
          <Link
            href="/admin/surveys"
            className="border rounded-lg p-6 hover:border-[#F78309] hover:bg-[#F78309]/5 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">Survey Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Customer satisfaction ratings and feedback analysis
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-[#F78309] transition-colors" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
