import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null) // row from public.users
  const [loading, setLoading] = useState(true)
  const authSeq = useRef(0)
  const profileSeq = useRef(0)

  async function loadProfile(userId) {
    const seq = ++profileSeq.current

    if (!userId) {
      if (seq === profileSeq.current) setProfile(null)
      return null
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (seq !== profileSeq.current) return null

    if (error) {
      console.error('Failed to load profile:', error)
      setProfile(null)
      return null
    }

    setProfile(data || null)
    return data || null
  }

  async function syncSession(nextSession) {
    const seq = ++authSeq.current
    setLoading(true)
    setSession(nextSession)
    setProfile(null)

    try {
      if (nextSession?.user?.id) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', nextSession.user.id)
          .maybeSingle()

        if (seq !== authSeq.current) return

        if (error) {
          console.error('Failed to load profile:', error)
          setProfile(null)
          return
        }

        setProfile(data || null)
      }
    } finally {
      if (seq === authSeq.current) setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      syncSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        syncSession(session)
      }
    )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function signUp({ email, password, fullName, phone }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    if (error) throw error
    // The row in public.users is created by a DB trigger (see migration)
    // that copies id/email/full_name from auth.users on insert.
    if (data.user && phone) {
      await supabase.from('users').update({ phone }).eq('id', data.user.id)
    }
    return data
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        profile,
        isAdmin,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile: () => loadProfile(session?.user?.id)
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
