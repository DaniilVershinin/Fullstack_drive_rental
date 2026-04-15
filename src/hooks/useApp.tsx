import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getCurrentUser } from '../lib/api'
import { getOrCreateCsrfToken, rotateCsrfToken } from '../lib/security'
import type { AuthUser, Role } from '../types'

interface Toast { id: number; msg: string; type: 'success' | 'error' | 'warning' }

interface AppCtx {
  user: AuthUser | null
  role: Role
  setUser: (u: AuthUser | null) => void
  toasts: Toast[]
  toast: (msg: string, type?: 'success' | 'error' | 'warning') => void
  csrfToken: string
  rotateCsrf: () => string
}

const Ctx = createContext<AppCtx>(null!)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [csrfToken, setCsrfToken] = useState(() => getOrCreateCsrfToken())
  const [toasts, setToasts] = useState<Toast[]>([])
  const role: Role = user?.role ?? 'client'

  useEffect(() => {
    getCurrentUser()
      .then(currentUser => {
        if (currentUser) setUser(currentUser)
      })
      .catch(() => {
        // Keep the demo fallback usable when Supabase is not configured yet.
      })
  }, [])

  const toast = useCallback((msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  const rotateCsrf = useCallback(() => {
    const next = rotateCsrfToken()
    setCsrfToken(next)
    return next
  }, [])

  return <Ctx.Provider value={{ user, role, setUser, toasts, toast, csrfToken, rotateCsrf }}>{children}</Ctx.Provider>
}

export const useApp = () => useContext(Ctx)
