import { describe, expect, it } from 'vitest'
import { assertCsrfToken, clearCsrfToken, escapeXml, getOrCreateCsrfToken, rotateCsrfToken, safeLabel, safeRemoteImageUrl } from '../lib/security'

describe('security helpers', () => {
  it('escapes XML-sensitive characters for generated SVG text', () => {
    expect(escapeXml('<img src=x onerror=alert(1)>&"\'')).toBe('&lt;img src=x onerror=alert(1)&gt;&amp;&quot;&#39;')
  })

  it('drops non-https remote image URLs', () => {
    expect(safeRemoteImageUrl('javascript:alert(1)')).toBe('')
    expect(safeRemoteImageUrl('http://example.com/car.jpg')).toBe('')
    expect(safeRemoteImageUrl('https://example.com/car.jpg')).toBe('https://example.com/car.jpg')
    expect(safeRemoteImageUrl('https://images.unsplash.com/car.jpg')).toBe('https://images.unsplash.com/car.jpg')
    expect(safeRemoteImageUrl('https://demo.supabase.co/storage/v1/object/public/cars/a.jpg')).toBe('https://demo.supabase.co/storage/v1/object/public/cars/a.jpg')
  })

  it('removes control characters and limits labels', () => {
    expect(safeLabel('  A\u0000B\u001fC  ')).toBe('ABC')
    expect(safeLabel('x'.repeat(200))).toHaveLength(120)
  })

  it('creates, validates, rotates, and clears CSRF tokens', () => {
    clearCsrfToken()

    const first = getOrCreateCsrfToken()
    expect(first).toHaveLength(64)
    expect(getOrCreateCsrfToken()).toBe(first)
    expect(() => assertCsrfToken(first)).not.toThrow()

    const second = rotateCsrfToken()
    expect(second).toHaveLength(64)
    expect(second).not.toBe(first)
    expect(() => assertCsrfToken(first)).toThrow(/CSRF/i)
    expect(() => assertCsrfToken(second)).not.toThrow()

    clearCsrfToken()
    expect(() => assertCsrfToken(second)).toThrow(/CSRF/i)
  })
})
