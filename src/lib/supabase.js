import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  // Aviso amigavel no console caso o .env nao esteja configurado
  console.warn(
    '[Supabase] Variaveis de ambiente ausentes. Copie .env.example para .env e preencha ' +
      'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
  )
}

// Cria o cliente mesmo sem config para evitar crash; chamadas falharao com erro claro.
export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'public-anon-key',
)

// Nome do bucket de Storage usado para os documentos dos pacientes
export const STORAGE_BUCKET = 'documentos'
