'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Bell, Save, BarChart3 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function SettingsPage() {
  const { refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    order_alerts: true,
    weekly_summary: true,
  })
  const [crmPreferences, setCrmPreferences] = useState({
    show_health_score: true,
  })

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Load CRM preferences from metadata
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('metadata')
          .eq('id', user.id)
          .single()

        if (profileData?.metadata?.crm_preferences) {
          setCrmPreferences({
            show_health_score: profileData.metadata.crm_preferences.show_health_score ?? true,
          })
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCrmPreferences = async () => {
    if (!user) return

    try {
      setSaving(true)
      const supabase = createClient()

      // First get current metadata to merge with
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('metadata')
        .eq('id', user.id)
        .single()

      const currentMetadata = currentProfile?.metadata || {}

      const { error } = await supabase
        .from('user_profiles')
        .update({
          metadata: {
            ...currentMetadata,
            crm_preferences: crmPreferences,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      // Refresh the AuthContext so CRM pages get the new preference
      await refreshProfile()

      toast.success('CRM preferences saved')
    } catch (err) {
      console.error('Error saving CRM preferences:', err)
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences</p>
      </div>

      {/* CRM Preferences Section */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">CRM Preferences</h2>
            <p className="text-sm text-muted-foreground">Configure CRM display options</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium">Show Health Score</div>
              <div className="text-sm text-muted-foreground">
                Display customer health scores in the CRM customer list and detail pages
              </div>
            </div>
            <input
              type="checkbox"
              checked={crmPreferences.show_health_score}
              onChange={(e) => setCrmPreferences({ ...crmPreferences, show_health_score: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>

          <div className="pt-4">
            <button
              onClick={handleSaveCrmPreferences}
              disabled={saving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save CRM Preferences'}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">Configure how you receive updates</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium">Email Notifications</div>
              <div className="text-sm text-muted-foreground">Receive important updates via email</div>
            </div>
            <input
              type="checkbox"
              checked={preferences.email_notifications}
              onChange={(e) => setPreferences({ ...preferences, email_notifications: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>

          <label className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium">Order Alerts</div>
              <div className="text-sm text-muted-foreground">Get notified when new orders come in</div>
            </div>
            <input
              type="checkbox"
              checked={preferences.order_alerts}
              onChange={(e) => setPreferences({ ...preferences, order_alerts: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>

          <label className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium">Weekly Summary</div>
              <div className="text-sm text-muted-foreground">Receive a weekly business summary</div>
            </div>
            <input
              type="checkbox"
              checked={preferences.weekly_summary}
              onChange={(e) => setPreferences({ ...preferences, weekly_summary: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          Note: Notification preferences are coming soon.
        </p>
      </div>
    </div>
  )
}
