// Re-export all auth-related modules for cleaner imports
export { supabase, useSupabase } from './client'
export { useAuth } from './useAuth'
export { requireAuth, getCurrentUser, isAuthenticated as checkIsAuthenticated } from './auth-guard'
export type { UserProfile } from './useAuth'
