import { NextResponse } from 'next/server'
import { getUserFromCookies } from '@/lib/supabase-cookies'

export async function GET() {
  try {
    const user = await getUserFromCookies()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email
      }
    })
  } catch (error) {
    console.error('Erro ao verificar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
