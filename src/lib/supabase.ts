import { createClient } from '@supabase/supabase-js'

// Replace with your real Supabase project URL and anon key
// from https://app.supabase.com → Project Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
const authStorage = typeof window === 'undefined' ? undefined : window.sessionStorage

export const isSupabaseConfigured =
  import.meta.env.MODE !== 'test' &&
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY) &&
  !SUPABASE_URL.includes('your-project') &&
  SUPABASE_ANON_KEY !== 'your-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: true,
    storage: authStorage,
  },
})
