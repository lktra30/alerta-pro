import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import CryptoJS from "crypto-js"

// Função para verificar credenciais usando a chave de criptografia
function validateCredentials(username: string, password: string): boolean {
  const encryptKey = process.env.ENCRYPTO_KEY
  if (!encryptKey) {
    console.error('ENCRYPTO_KEY not found in environment variables')
    return false
  }

  // Usuários válidos (criptografados)
  const validUsers = [
    {
      username: "admin1",
      password: "1admin"
    },
    {
      username: "admin2", 
      password: "2admin"
    }
  ]

  // Verificar se o usuário existe
  const user = validUsers.find(u => u.username === username)
  if (!user) return false

  // Criar hash da senha fornecida usando a chave de criptografia
  const providedPasswordHash = CryptoJS.HmacSHA256(password, encryptKey).toString()
  const validPasswordHash = CryptoJS.HmacSHA256(user.password, encryptKey).toString()

  // Comparar hashes
  return providedPasswordHash === validPasswordHash
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const isValid = validateCredentials(credentials.username, credentials.password)
        
        if (isValid) {
          return {
            id: credentials.username,
            name: credentials.username,
            email: `${credentials.username}@licitamax.com.br`
          }
        }

        return null
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 horas
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 horas
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET
} 