import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Supabase project URL - identifies which Supabase project to connect to
const SUPABASE_URL = 'https://exnntyelnkqhbhfqhftn.supabase.co'

// Supabase anonymous key - public key for client-side operations
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4bm50eWVsbmtxaGJoZnFoZnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTA4ODMsImV4cCI6MjA5MDUyNjg4M30._6Qs2goroLksMpojYs0hDiMkrDQSpUaC1DTdHmrN66A'

// Create Supabase client instance
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Composable for using Supabase in Vue components
export function useSupabase() {
  return {
    supabase,
  }
}
