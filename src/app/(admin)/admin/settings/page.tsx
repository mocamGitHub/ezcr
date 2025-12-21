'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { User, Bell, Palette, Shield, Save } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  })
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    order_alerts: true,
    weekly_summary: true,
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
        // Load profile
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile({
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            phone: profileData.phone || '',
          })
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setSaving(true)
      const supabase = createClient()

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      toast.success('Profile updated successfully')
    } catch (err) {
      console.error('Error saving profile:', err)
      toast.error('Failed to save profile')
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
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Profile</h2>
            <p className="text-sm text-muted-foreground">Your personal information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border rounded-md bg-muted text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">Contact admin to change email</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text"
                value={profile.first_name}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text"
                value={profile.last_name}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="pt-4">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Profile'}
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

      {/* Security Section */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Security</h2>
            <p className="text-sm text-muted-foreground">Manage your account security</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium">Password</div>
              <div className="text-sm text-muted-foreground">Last changed: Unknown</div>
            </div>
            <button className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors">
              Change Password
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
            </div>
            <span className="text-sm text-muted-foreground">Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}
