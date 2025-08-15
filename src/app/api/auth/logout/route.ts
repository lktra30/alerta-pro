import { NextResponse } from 'next/server'
import { createServerClientWithCookies } from '@/lib/supabase-cookies'

export async function POST() {
  try {
    const supabase = await createServerClientWithCookies()
    
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Erro no logout:', error.message)
      return NextResponse.json(
        { error: 'Erro ao fazer logout' },
        { status: 500 }
      )
    }

    // Criar resposta e limpar cookies
    const response = NextResponse.json({ message: 'Logout realizado com sucesso' })
    
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')

    return response
  } catch (error) {
    console.error('Erro no servidor de logout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
