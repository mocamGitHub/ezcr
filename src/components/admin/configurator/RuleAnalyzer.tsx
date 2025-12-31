'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Lightbulb,
  TrendingUp,
} from 'lucide-react'
import type { ConfiguratorRule } from '@/types/configurator-rules'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface AIAnalysisResult {
  summary: string
  issues: AIIssue[]
  suggestions: AISuggestion[]
  coverageAnalysis: string
}

interface AIIssue {
  severity: 'error' | 'warning' | 'info'
  title: string
  description: string
  affectedRuleKeys: string[]
}

interface AISuggestion {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

interface RuleAnalyzerProps {
  rules: ConfiguratorRule[]
  onRuleClick?: (ruleId: string) => void
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    className: 'border-red-500/50 bg-red-50 dark:bg-red-950/20',
    textClass: 'text-red-800 dark:text-red-200',
    iconClass: 'text-red-600',
    label: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20',
    textClass: 'text-amber-800 dark:text-amber-200',
    iconClass: 'text-amber-600',
    label: 'Warning',
  },
  info: {
    icon: Info,
    className: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/20',
    textClass: 'text-blue-800 dark:text-blue-200',
    iconClass: 'text-blue-600',
    label: 'Info',
  },
}

export function RuleAnalyzer({ rules, onRuleClick }: RuleAnalyzerProps) {
  const [isAIExpanded, setIsAIExpanded] = useState(true)
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/admin/configurator/rules/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      setAIAnalysis(data)
      setIsAIExpanded(true)
      toast.success('AI analysis complete')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to analyze rules')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Helper to find rule by key
  const findRuleByKey = (key: string) => rules.find(r => r.rule_key === key)

  return (
    <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-foreground">AI-Powered Analysis</h3>
            {aiAnalysis && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Complete
              </Badge>
            )}
          </div>
          <Button
            onClick={handleAIAnalysis}
            disabled={isAnalyzing || rules.length === 0}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {aiAnalysis ? 'Re-analyze' : 'Analyze with AI'}
              </>
            )}
          </Button>
        </div>

        {!aiAnalysis && !isAnalyzing && (
          <div className="p-6 text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Get deeper insights into your rules configuration using AI analysis.
            </p>
            <p className="text-xs mt-1 opacity-75">
              Detects semantic issues, missing coverage, and suggests improvements.
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-purple-500" />
            <p className="text-sm text-muted-foreground">Analyzing your rules...</p>
          </div>
        )}

        {aiAnalysis && !isAnalyzing && (
          <div className="p-4 space-y-4">
            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm">{aiAnalysis.summary}</p>
            </div>

            {/* AI Issues */}
            {aiAnalysis.issues.length > 0 && (
              <div>
                <button
                  onClick={() => setIsAIExpanded(!isAIExpanded)}
                  className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"
                >
                  {isAIExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Issues ({aiAnalysis.issues.length})
                </button>
                {isAIExpanded && (
                  <div className="space-y-2">
                    {aiAnalysis.issues.map((issue, idx) => (
                      <AIIssueCard
                        key={idx}
                        issue={issue}
                        onRuleClick={(key) => {
                          const rule = findRuleByKey(key)
                          if (rule) onRuleClick?.(rule.id)
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Suggestions */}
            {aiAnalysis.suggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Suggestions
                </div>
                <div className="space-y-2">
                  {aiAnalysis.suggestions.map((suggestion, idx) => (
                    <SuggestionCard key={idx} suggestion={suggestion} />
                  ))}
                </div>
              </div>
            )}

            {/* Coverage Analysis */}
            {aiAnalysis.coverageAnalysis && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Coverage Analysis
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">{aiAnalysis.coverageAnalysis}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
  )
}

function AIIssueCard({
  issue,
  onRuleClick,
}: {
  issue: AIIssue
  onRuleClick?: (ruleKey: string) => void
}) {
  const config = severityConfig[issue.severity]
  const Icon = config.icon

  return (
    <div className={`rounded-lg border p-3 ${config.className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-4 w-4 mt-0.5 ${config.iconClass}`} />
        <div className="flex-1">
          <p className={`font-medium text-sm ${config.textClass}`}>{issue.title}</p>
          <p className={`text-sm mt-1 ${config.textClass} opacity-80`}>{issue.description}</p>
          {issue.affectedRuleKeys.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {issue.affectedRuleKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => onRuleClick?.(key)}
                  className="text-xs px-2 py-0.5 rounded bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 transition-colors"
                >
                  {key}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SuggestionCard({ suggestion }: { suggestion: AISuggestion }) {
  const priorityColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-4 w-4 mt-0.5 text-amber-600" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-sm text-amber-800 dark:text-amber-200">{suggestion.title}</p>
            <Badge className={`text-xs ${priorityColors[suggestion.priority]}`}>
              {suggestion.priority}
            </Badge>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300">{suggestion.description}</p>
        </div>
      </div>
    </div>
  )
}
