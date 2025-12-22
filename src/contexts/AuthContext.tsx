'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface CRMPreferences {
  show_health_score?: boolean
}

interface UserMetadata {
  crm_preferences?: CRMPreferences
}

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'owner' | 'admin' | 'customer_service' | 'viewer' | 'customer'
  is_active: boolean
  tenant_id: string
  metadata?: UserMetadata
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    try {
      // Ensure we have a valid authenticated user before querying
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProfile(null)
        return
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // RLS might prevent access - this is handled by middleware
        // Just log a warning and continue
        if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.warn('Could not fetch profile:', error.message)
        }
        setProfile(null)
        return
      }
      setProfile(data)
    } catch (error: any) {
      // Silently fail - profile fetch is not critical
      setProfile(null)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    // Get initial authenticated user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null)
      if (user) {
        fetchProfile(user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      // For sign out events, clear user immediately
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setProfile(null)
        return
      }

      // For other events, verify user with getUser() to avoid security warning
      // The session.user from onAuthStateChange comes from cookies and may not be authentic
      const { data: { user: verifiedUser } } = await supabase.auth.getUser()

      if (verifiedUser) {
        setUser(verifiedUser)
        fetchProfile(verifiedUser.id)
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
