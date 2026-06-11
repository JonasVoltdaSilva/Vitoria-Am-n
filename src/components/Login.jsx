import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Activity, Moon, Sun, AlertTriangle } from 'lucide-react'

export default function Login() {
  const { signIn, signUp, isSupabaseConfigured } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [modo, setModo] = useState('login') // 'login' | 'cadastro'
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [carregando, setCarregando] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setAviso('')
    setCarregando(true)
    try {
      if (modo === 'login') {
        await signIn(email, senha)
      } else {
        await signUp(email, senha, nome)
        setAviso('Cadastro realizado! Verifique seu e-mail para confirmar e depois faca login.')
        setModo('login')
      }
    } catch (err) {
      setErro(err.message || 'Falha na autenticacao.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4 dark:from-slate-950 dark:to-slate-900">
      <button
        onClick={toggleTheme}
        className="btn-ghost absolute right-4 top-4 !p-3"
        aria-label="Alternar tema"
      >
        {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
      </button>

      <div className="card w-full max-w-md p-7">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Activity className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-extrabold">Controle de Exames</h1>
          <p className="text-slate-500 dark:text-slate-400">Oncologia &middot; APACs e Laudos</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-100 p-3 text-sm text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <span>
              Supabase nao configurado. Crie um arquivo <code>.env</code> com{' '}
              <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>.
            </span>
          </div>
        )}

        {erro && (
          <div className="mb-4 rounded-xl bg-red-100 p-3 text-sm font-medium text-red-700 dark:bg-red-900/40 dark:text-red-200">
            {erro}
          </div>
        )}
        {aviso && (
          <div className="mb-4 rounded-xl bg-emerald-100 p-3 text-sm font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
            {aviso}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {modo === 'cadastro' && (
            <div>
              <label className="label">Nome completo</label>
              <input
                className="input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                required
              />
            </div>
          )}
          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@hospital.com"
              required
            />
          </div>
          <div>
            <label className="label">Senha</label>
            <input
              type="password"
              className="input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={carregando}>
            {carregando ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
          {modo === 'login' ? (
            <button onClick={() => setModo('cadastro')} className="font-semibold text-brand-600 hover:underline">
              Nao tem conta? Cadastre-se
            </button>
          ) : (
            <button onClick={() => setModo('login')} className="font-semibold text-brand-600 hover:underline">
              Ja tem conta? Faca login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
