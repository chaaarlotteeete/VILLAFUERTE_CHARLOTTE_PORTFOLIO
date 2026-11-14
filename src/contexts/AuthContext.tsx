import type { Session, User } from '@supabase/supabase-js'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { supabase } from '@/lib/supabase'
import { fetchIsAdmin } from '@/services/admin'

interface AuthContextValue {
  session: Session | null
  user: User | null
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    return await fetchIsAdmin(userId)
  } catch (error) {
    // Table/policies may not exist until migrations are applied.
    console.warn(
      'Admin check skipped or failed:',
      error instanceof Error ? error.message : error,
    )
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const syncAdmin = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setIsAdmin(false)
      return
    }
    const admin = await checkIsAdmin(nextUser.id)
    setIsAdmin(admin)
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      await syncAdmin(data.session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      await syncAdmin(nextSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [syncAdmin])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setIsAdmin(false)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}admin/login`
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    return { error: error?.message ?? null }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user,
      isAdmin,
      loading,
      signIn,
      signOut,
      resetPassword,
    }),
    [session, user, isAdmin, loading, signIn, signOut, resetPassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
