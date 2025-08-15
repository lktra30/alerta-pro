// Este arquivo foi migrado para usar Supabase Auth
// NextAuth não é mais usado neste projeto

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Este endpoint foi migrado para Supabase Auth' }, { status: 404 })
}

export async function POST() {
  return NextResponse.json({ message: 'Este endpoint foi migrado para Supabase Auth' }, { status: 404 })
} 