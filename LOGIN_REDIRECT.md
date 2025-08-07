# Redirecionamento de Login

## Como funciona

Este projeto implementa um redirecionamento automático da URL `/login` para `/auth/signin` para melhorar a experiência do usuário.

## Implementação

### 1. Middleware (src/middleware.ts)
O middleware intercepta todas as requisições para `/login` e redireciona automaticamente para `/auth/signin`:

```typescript
// Redirecionar /login para /auth/signin
if (req.nextUrl.pathname === "/login") {
  return NextResponse.redirect(new URL("/auth/signin", req.url))
}
```

### 2. Página de Login (src/app/login/page.tsx)
Uma página de fallback que também redireciona para `/auth/signin` usando React Router:

```typescript
useEffect(() => {
  // Redirecionar para a página de signin existente
  router.replace("/auth/signin")
}, [router])
```

## URLs suportadas

- **`/login`** → Redireciona automaticamente para `/auth/signin`
- **`/auth/signin`** → Página de login principal
- **`/auth/error`** → Página de erro de autenticação

## Benefícios

1. **Flexibilidade**: Usuários podem usar tanto `/login` quanto `/auth/signin`
2. **SEO**: URLs mais amigáveis e intuitivas
3. **UX**: Redirecionamento automático sem interrupção
4. **Compatibilidade**: Mantém a estrutura existente do NextAuth

## Teste

Para testar o redirecionamento:

1. Inicie o servidor: `npm run dev`
2. Acesse: `http://localhost:3000/login`
3. Você será redirecionado automaticamente para: `http://localhost:3000/auth/signin`

## Configuração

O redirecionamento está configurado no middleware e funciona tanto em desenvolvimento quanto em produção. 