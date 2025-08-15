import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { cookies } from 'next/headers'

// Cliente Supabase com gerenciamento de cookies para rotas API
export const createServerClientWithCookies = async () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const cookieStore = await cookies()
  
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      },
    },
  })
}

// Função para obter usuário autenticado via cookies
export async function getUserFromCookies() {
  try {
    const supabase = await createServerClientWithCookies()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error getting user from cookies:', error)
    return null
  }
}
