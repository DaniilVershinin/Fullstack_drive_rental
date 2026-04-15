const MAX_LABEL_LENGTH = 120
const TRUSTED_IMAGE_HOSTS = new Set(['source.unsplash.com', 'images.unsplash.com'])
const CSRF_STORAGE_KEY = 'drivego.csrf'

function isTrustedImageHost(hostname: string) {
  return TRUSTED_IMAGE_HOSTS.has(hostname) || hostname.endsWith('.supabase.co')
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function safeLabel(value: unknown, fallback = '') {
  return String(value ?? fallback).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_LABEL_LENGTH)
}

export function safeRemoteImageUrl(value: unknown) {
  if (typeof value !== 'string') return ''

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return ''
    if (!isTrustedImageHost(url.hostname)) return ''
    return url.toString()
  } catch {
    return ''
  }
}

function randomToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function getOrCreateCsrfToken() {
  if (typeof window === 'undefined') return ''

  const current = window.sessionStorage.getItem(CSRF_STORAGE_KEY)
  if (current) return current

  const next = randomToken()
  window.sessionStorage.setItem(CSRF_STORAGE_KEY, next)
  return next
}

export function rotateCsrfToken() {
  if (typeof window === 'undefined') return ''

  const next = randomToken()
  window.sessionStorage.setItem(CSRF_STORAGE_KEY, next)
  return next
}

export function clearCsrfToken() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(CSRF_STORAGE_KEY)
}

export function assertCsrfToken(token?: string) {
  if (typeof window === 'undefined') return

  const expected = window.sessionStorage.getItem(CSRF_STORAGE_KEY)
  if (!expected || !token || token !== expected) {
    throw new Error('Недействительный CSRF token')
  }
}
