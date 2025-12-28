'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface CalendarPrefs {
  defaultView: 'day' | 'week' | 'month'
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday
  timeFormat: '12h' | '24h'
  defaultTimezone: string
  showWeekends: boolean
}

const DEFAULT_PREFS: CalendarPrefs = {
  defaultView: 'week',
  weekStartsOn: 0,
  timeFormat: '12h',
  defaultTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  showWeekends: true,
}

/**
 * Hook for managing user calendar preferences
 * Syncs with database and falls back to localStorage
 */
export function useCalendarPrefs() {
  const [prefs, setPrefs] = useState<CalendarPrefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load preferences
  useEffect(() => {
    loadPrefs()
  }, [])

  const loadPrefs = async () => {
    setLoading(true)

    // Try localStorage first (faster)
    const cached = loadFromStorage()
    if (cached) {
      setPrefs(cached)
    }

    // Then try database
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('nx_user_calendar_prefs')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (data) {
          const dbPrefs: CalendarPrefs = {
            defaultView: data.default_view as CalendarPrefs['defaultView'],
            weekStartsOn: data.week_starts_on as CalendarPrefs['weekStartsOn'],
            timeFormat: data.time_format as CalendarPrefs['timeFormat'],
            defaultTimezone: data.default_timezone,
            showWeekends: data.show_weekends,
          }
          setPrefs(dbPrefs)
          saveToStorage(dbPrefs)
        }
      }
    } catch (error) {
      console.warn('Failed to load calendar prefs from database:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePrefs = useCallback(async (newPrefs: Partial<CalendarPrefs>) => {
    const updatedPrefs = { ...prefs, ...newPrefs }
    setPrefs(updatedPrefs)
    saveToStorage(updatedPrefs)
    setSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('nx_user_calendar_prefs')
          .upsert({
            user_id: user.id,
            default_view: updatedPrefs.defaultView,
            week_starts_on: updatedPrefs.weekStartsOn,
            time_format: updatedPrefs.timeFormat,
            default_timezone: updatedPrefs.defaultTimezone,
            show_weekends: updatedPrefs.showWeekends,
          })
      }
    } catch (error) {
      console.warn('Failed to save calendar prefs to database:', error)
    } finally {
      setSaving(false)
    }
  }, [prefs])

  const resetPrefs = useCallback(async () => {
    setPrefs(DEFAULT_PREFS)
    saveToStorage(DEFAULT_PREFS)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('nx_user_calendar_prefs')
          .delete()
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.warn('Failed to reset calendar prefs:', error)
    }
  }, [])

  return {
    prefs,
    loading,
    saving,
    savePrefs,
    resetPrefs,
  }
}

// LocalStorage helpers

function loadFromStorage(): CalendarPrefs | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem('nx_calendar_prefs')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function saveToStorage(prefs: CalendarPrefs): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem('nx_calendar_prefs', JSON.stringify(prefs))
  } catch {
    // Ignore storage errors
  }
}

export default useCalendarPrefs
