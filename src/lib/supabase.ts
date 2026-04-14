import { createClient } from '@supabase/supabase-js'

// Replace with your real Supabase project URL and anon key
// from https://app.supabase.com → Project Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const isSupabaseConfigured =
  import.meta.env.MODE !== 'test' &&
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY) &&
  !SUPABASE_URL.includes('your-project') &&
  SUPABASE_ANON_KEY !== 'your-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Auth helpers ──────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, meta: Record<string, any>) {
  return supabase.auth.signUp({ email, password, options: { data: meta } })
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession() {
  return supabase.auth.getSession()
}

// ─── Database helpers (ready to wire up) ──────────────────────────────────────

export async function fetchCars(filters?: { city?: string; cat?: string }) {
  let q = supabase.from('cars').select('*')
  if (filters?.city) q = q.eq('city', filters.city)
  if (filters?.cat)  q = q.eq('category', filters.cat)
  return q
}

export async function fetchMyOrders(userId: string) {
  return supabase.from('orders').select('*, cars(*)').eq('user_id', userId)
}

export async function createOrder(order: Record<string, any>) {
  return supabase.from('orders').insert(order).select().single()
}

export async function cancelOrder(orderId: string) {
  return supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
}

export async function updateOrderStatus(orderId: string, status: string) {
  return supabase.from('orders').update({ status }).eq('id', orderId)
}

export async function createPayment(payment: Record<string, any>) {
  return supabase.from('payments').insert(payment).select().single()
}
