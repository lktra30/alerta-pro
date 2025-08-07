# Configuração de Autenticação

## ⚠️ ERRO DE CONFIGURAÇÃO DETECTADO

O NextAuth está retornando erro porque as variáveis de ambiente não estão configuradas.

## Variáveis de Ambiente Necessárias

**Crie um arquivo `.env` na raiz do projeto** com as seguintes variáveis:

```env
# Next Auth - OBRIGATÓRIO
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_secret_muito_forte_aqui_pelo_menos_32_caracteres

# Chave de Criptografia para validação de usuários - OBRIGATÓRIO
ENCRYPTO_KEY=ce4ff14e89a62f0664eb7db4126ea495598ba47d1084eeabfea6f8c08802a0b2

# Supabase (se já configurado)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚨 Ação Necessária

1. **Pare o servidor** (Ctrl+C)
2. **Crie o arquivo `.env`** na pasta `alerta-pro/`
3. **Adicione as variáveis** acima
4. **Gere um NEXTAUTH_SECRET** forte (pode usar: `openssl rand -base64 32`)
5. **Reinicie o servidor** (`npm run dev`)

## Usuários Válidos

- **Usuário:** `admin1` | **Senha:** `1admin`
- **Usuário:** `admin2` | **Senha:** `2admin`

## Exemplo do arquivo .env

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=AbCdEf1234567890AbCdEf1234567890
ENCRYPTO_KEY=ce4ff14e89a62f0664eb7db4126ea495598ba47d1084eeabfea6f8c08802a0b2
``` 