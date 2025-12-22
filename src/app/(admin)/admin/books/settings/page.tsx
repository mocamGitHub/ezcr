'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getBooksSettings, updateBooksSettings, type BooksSettings } from '@/actions/books'

export default function BooksSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<BooksSettings | null>(null)

  // Form state
  const [autoLinkThreshold, setAutoLinkThreshold] = useState('90')
  const [amountTolerance, setAmountTolerance] = useState('1.00')
  const [dateWindowDays, setDateWindowDays] = useState('7')
  const [minReceiptConfidence, setMinReceiptConfidence] = useState('60')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await getBooksSettings()
      setSettings(data)

      if (data) {
        setAutoLinkThreshold(String(Math.round(data.auto_link_threshold * 100)))
        setAmountTolerance(String(data.amount_tolerance))
        setDateWindowDays(String(data.date_window_days))
        setMinReceiptConfidence(String(Math.round(data.min_receipt_confidence * 100)))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await updateBooksSettings({
        auto_link_threshold: parseFloat(autoLinkThreshold) / 100,
        amount_tolerance: parseFloat(amountTolerance),
        date_window_days: parseInt(dateWindowDays),
        min_receipt_confidence: parseFloat(minReceiptConfidence) / 100,
      })

      if (result.ok) {
        toast.success('Settings saved')
      } else {
        toast.error(result.error || 'Failed to save settings')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-8 px-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="py-8 px-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/books')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Books Settings</h1>
            <p className="text-muted-foreground mt-1">Configure matching thresholds</p>
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <p className="text-yellow-800 dark:text-yellow-200">
            Books module is not configured for this tenant. Please contact support to enable the Books feature.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 px-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/books')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Books Settings</h1>
          <p className="text-muted-foreground mt-1">Configure matching thresholds and tolerances</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Settings Form */}
      <div className="max-w-2xl space-y-8">
        {/* Matching Thresholds */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Matching Thresholds</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="autoLinkThreshold">Auto-Link Threshold (%)</Label>
              <Input
                id="autoLinkThreshold"
                type="number"
                min="0"
                max="100"
                value={autoLinkThreshold}
                onChange={(e) => setAutoLinkThreshold(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Matches with a score at or above this threshold will be automatically linked without manual review.
                Default: 90%
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minReceiptConfidence">Minimum Receipt Confidence (%)</Label>
              <Input
                id="minReceiptConfidence"
                type="number"
                min="0"
                max="100"
                value={minReceiptConfidence}
                onChange={(e) => setMinReceiptConfidence(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Receipts with OCR confidence below this threshold will be flagged as exceptions.
                Default: 60%
              </p>
            </div>
          </div>
        </div>

        {/* Matching Tolerances */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Matching Tolerances</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amountTolerance">Amount Tolerance ($)</Label>
              <Input
                id="amountTolerance"
                type="number"
                min="0"
                step="0.01"
                value={amountTolerance}
                onChange={(e) => setAmountTolerance(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Allow matches where the receipt and transaction amounts differ by up to this amount.
                Default: $1.00
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateWindowDays">Date Window (days)</Label>
              <Input
                id="dateWindowDays"
                type="number"
                min="1"
                max="30"
                value={dateWindowDays}
                onChange={(e) => setDateWindowDays(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Look for matching transactions within this many days before or after the receipt date.
                Default: 7 days
              </p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-muted/50 border rounded-lg p-6">
          <h3 className="font-medium mb-2">How Matching Works</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>
              <strong>Score Calculation:</strong> Amount proximity (55%) + Date proximity (25%) + Merchant name similarity (20%)
            </li>
            <li>
              <strong>Auto-Link:</strong> Matches above the threshold are automatically confirmed
            </li>
            <li>
              <strong>Suggestions:</strong> Lower-scoring matches appear as suggestions for manual review
            </li>
            <li>
              <strong>Exceptions:</strong> Receipts with low OCR confidence are flagged for manual data entry
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
