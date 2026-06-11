import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { LS_USUARIO } from '../lib/localStore'

const AuthContext = createContext()

function lerUsuarioLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_USUARIO)) || null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  // Em modo local, restaura o usuario salvo no dispositivo
  const [user, setUser] = useState(() => (isSupabaseConfigured ? null : lerUsuarioLocal()))
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    let mounted = true

    async function init() {
      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(data.session)
        setUser(data.session?.user ?? null)
      } catch {
        // falha silenciosa (ex: Supabase indisponivel)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase nao configurado.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email, password, nome) => {
    if (!supabase) throw new Error('Supabase nao configurado.')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    })
    if (error) throw error
  }

  // Login do modo local: identifica o usuario apenas pelo nome (dados ficam no dispositivo)
  const signInLocal = (nome) => {
    const u = { id: 'local', email: '', user_metadata: { nome } }
    localStorage.setItem(LS_USUARIO, JSON.stringify(u))
    setUser(u)
  }

  const signOut = async () => {
    if (!supabase) {
      localStorage.removeItem(LS_USUARIO)
      setUser(null)
      return
    }
    await supabase.auth.signOut()
  }

  const value = {
    session,
    user,
    loading,
    isSupabaseConfigured,
    signIn,
    signUp,
    signInLocal,
    signOut,
    nomeUsuario: user?.user_metadata?.nome || user?.email || 'Usuario',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
