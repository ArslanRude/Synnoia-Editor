import { ref, computed } from 'vue'
import type { User, AuthError } from '@supabase/supabase-js'
import { supabase } from './useSupabase'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: 'free' | 'pro' | 'team' | 'enterprise'
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

// Reactive state (module-level singleton)
const user = ref<User | null>(null)
const profile = ref<UserProfile | null>(null)
const isLoading = ref(true)
const isAuthenticated = computed(() => !!user.value)

// Track if listener is already set up
let authListenerInitialized = false

// Initialize auth state
export function useAuth() {
  // Check auth state on mount
  const checkAuth = async () => {
    isLoading.value = true
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth check error:', error)
        user.value = null
        profile.value = null
        return
      }

      if (session?.user) {
        user.value = session.user
        await fetchProfile(session.user.id)
      } else {
        user.value = null
        profile.value = null
      }
    } catch (error) {
      console.error('Auth check error:', error)
      user.value = null
      profile.value = null
    } finally {
      isLoading.value = false
    }
  }

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role, plan, email, id, created_at, updated_at')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        profile.value = null
        return
      }

      profile.value = data as UserProfile
    } catch (error) {
      console.error('Profile fetch error:', error)
      profile.value = null
    }
  }

  // Sign out
  const signOut = async (): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      user.value = null
      profile.value = null
    }
    return { error }
  }

  // Get display name
  const displayName = computed(() => {
    return profile.value?.full_name 
      || user.value?.user_metadata?.full_name 
      || user.value?.email?.split('@')[0] 
      || 'User'
  })

  // Get avatar URL
  const avatarUrl = computed(() => {
    return profile.value?.avatar_url 
      || user.value?.user_metadata?.avatar_url 
      || null
  })

  // Set up auth state listener once (singleton)
  if (!authListenerInitialized) {
    authListenerInitialized = true
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      if (event === 'SIGNED_IN' && session) {
        user.value = session.user
        fetchProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        user.value = null
        profile.value = null
      } else if (event === 'USER_UPDATED' && session) {
        user.value = session.user
        fetchProfile(session.user.id)
      } else if (event === 'INITIAL_SESSION' && session) {
        user.value = session.user
        fetchProfile(session.user.id)
      }
    })
  }

  return {
    user,
    profile,
    isLoading,
    isAuthenticated,
    displayName,
    avatarUrl,
    checkAuth,
    signOut,
    fetchProfile,
    supabase,
  }
}
