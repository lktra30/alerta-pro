// Este arquivo agora contém utilitários de autenticação para Supabase
// A autenticação foi migrada do NextAuth para Supabase Auth

export interface AuthUser {
  id: string
  email: string
  name: string
}

// Função para validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Função para validar senha (mínimo 6 caracteres)
export function isValidPassword(password: string): boolean {
  return password.length >= 6
}

// Constantes de autenticação
export const AUTH_COOKIE_NAME = 'sb-access-token'
export const REFRESH_COOKIE_NAME = 'sb-refresh-token' 