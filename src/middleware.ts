import { NextRequest, NextResponse } from "next/server"
import { createMiddlewareClient } from '@/lib/supabase-middleware'

export async function middleware(request: NextRequest) {
  try {
    // Criar resposta
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Verificar autenticação para rotas protegidas
    const isAuthRoute = request.nextUrl.pathname.startsWith('/auth/') || 
                       request.nextUrl.pathname.startsWith('/api/auth/') ||
                       request.nextUrl.pathname === '/login'
    
    // Permitir acesso a assets estáticos
    const isStaticAsset = request.nextUrl.pathname.startsWith('/_next/') ||
                         request.nextUrl.pathname.startsWith('/api/') ||
                         request.nextUrl.pathname.includes('.')

    if (isStaticAsset) {
      return response
    }

    // Redirecionar /login para /auth/signin
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    // Para rotas de auth, permitir acesso sem verificação
    if (isAuthRoute) {
      return response
    }

    // Tentar criar cliente Supabase
    const supabase = createMiddlewareClient(request, response)
    
    if (!supabase) {
      // Se Supabase não está configurado, usar verificação simples de cookie
      const accessToken = request.cookies.get('sb-access-token')
      if (!accessToken) {
        return NextResponse.redirect(new URL('/auth/signin', request.url))
      }
      return response
    }

    // Verificar autenticação via Supabase
    const { data: { user }, error } = await supabase.auth.getUser()

    // Se não há usuário ou erro, redirecionar para login
    if (error || !user) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    return response
  } catch (error) {
    console.error('Erro no middleware:', error)
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (Auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
} 