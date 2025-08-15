import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Server-side Supabase client - URLs não expostas no frontend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar se as variáveis estão disponíveis
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Cliente para operações administrativas (server-side only) - Comentado até service key ser adicionado
// export const supabaseAdmin = isConfigured ? createClient<Database>(supabaseUrl!, supabaseServiceKey!, {
//   auth: {
//     autoRefreshToken: false,
//     persistSession: false
//   }
// }) : null

// Cliente simples para edge runtime
export const createServerClient = () => {
  if (!isConfigured || !supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase not configured - environment variables missing')
    return null
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Função para validar sessão do usuário
export async function getUser() {
  const supabase = createServerClient()
  
  if (!supabase) {
    return null
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

// Função para verificar se usuário está autenticado
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser()
  return !!user
}

// Função para verificar se Supabase está configurado
export function isSupabaseConfigured(): boolean {
  return isConfigured
}
