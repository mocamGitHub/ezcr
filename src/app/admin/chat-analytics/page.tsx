'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, TrendingUp, Users, Star, CheckCircle, BarChart3 } from 'lucide-react'

interface ChatAnalytics {
  overview: {
    totalChats: number
    totalSurveys: number
    avgRating: number
    resolutionRate: number
    surveyResponseRate: number
    avgChatsPerDay: number
  }
  timeSeries: Array<{ date: string; count: number }>
  topTopics: Array<{ topic: string; count: number }>
  recentChats: Array<{
    id: string
    customer_id: string | null
    notes: string
    created_at: string
  }>
}

export default function ChatAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      // Calculate date range
      if (dateRange !== 'all') {
        const days = parseInt(dateRange)
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        params.append('start_date', startDate.toISOString())
      }

      const response = await fetch(`/api/analytics/chat?${params.toString()}`)
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

  const maxChats = Math.max(...analytics.timeSeries.map(d => d.count), 1)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Chat Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor chat volume, topics, and performance metrics</p>
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
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Chats</p>
              <MessageCircle className="w-5 h-5 text-[#0B5394]" />
            </div>
            <p className="text-3xl font-bold mb-1">{analytics.overview.totalChats}</p>
            <p className="text-sm text-muted-foreground">
              {analytics.overview.avgChatsPerDay.toFixed(1)} per day
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Avg Satisfaction</p>
              <Star className="w-5 h-5 text-[#F78309]" />
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <p className="text-3xl font-bold">{analytics.overview.avgRating}</p>
              <p className="text-sm text-muted-foreground">/ 5.0</p>
            </div>
            <p className="text-sm text-muted-foreground">
              From {analytics.overview.totalSurveys} surveys
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold mb-1">{analytics.overview.resolutionRate}%</p>
            <p className="text-sm text-muted-foreground">
              Issues resolved successfully
            </p>
          </div>
        </div>

        {/* Chat Volume Chart */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-[#0B5394]" />
            <h2 className="text-xl font-bold">Chat Volume Over Time</h2>
          </div>
          {analytics.timeSeries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No data available</p>
          ) : (
            <div className="space-y-3">
              {analytics.timeSeries.map((data) => {
                const percentage = (data.count / maxChats) * 100
                return (
                  <div key={data.date} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium">
                      {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-8 overflow-hidden">
                      <div
                        className="bg-[#0B5394] h-full flex items-center px-3 text-white text-sm font-medium transition-all"
                        style={{ width: `${Math.max(percentage, 10)}%` }}
                      >
                        {data.count}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top Topics */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-[#F78309]" />
            <h2 className="text-xl font-bold">Most Common Topics</h2>
          </div>
          {analytics.topTopics.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No topics detected</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.topTopics.map((topic) => {
                const maxCount = analytics.topTopics[0]?.count || 1
                const percentage = (topic.count / maxCount) * 100

                return (
                  <div key={topic.topic} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium capitalize">
                        {topic.topic.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-muted-foreground">{topic.count} chats</span>
                    </div>
                    <div className="bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-[#F78309] h-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Chats */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-[#0B5394]" />
            <h2 className="text-xl font-bold">Recent Chat Sessions</h2>
          </div>
          {analytics.recentChats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No recent chats</p>
          ) : (
            <div className="space-y-4">
              {analytics.recentChats.map((chat) => (
                <div key={chat.id} className="border-l-4 border-[#0B5394] pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {chat.customer_id ? `Customer ${chat.customer_id.slice(0, 8)}...` : 'Anonymous'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(chat.created_at).toLocaleDateString()} at{' '}
                      {new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-2">{chat.notes || 'No notes available'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
