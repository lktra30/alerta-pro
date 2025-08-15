import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'

// Cliente para middleware (compatível com edge runtime)
// Este arquivo não importa o cliente completo do Supabase para evitar problemas com Edge Runtime
export const createMiddlewareClient = (request: NextRequest, response: NextResponse) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })
}
