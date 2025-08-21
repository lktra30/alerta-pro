-- SCRIPT RÁPIDO PARA REMOVER FUNÇÕES WHITELABEL
-- Copie e cole este código no SQL Editor do Supabase

-- 1. Remover as 3 funções específicas mostradas na imagem
DROP FUNCTION IF EXISTS public.set_whitelabel_id() CASCADE;
DROP FUNCTION IF EXISTS public.set_whitelabel_on_insert() CASCADE;
DROP FUNCTION IF EXISTS public.custom_access_token_hook(event jsonb) CASCADE;

-- 2. Remover triggers que usam essas funções
DROP TRIGGER IF EXISTS trigger_set_whitelabel_id ON public.clientes CASCADE;
DROP TRIGGER IF EXISTS trigger_set_whitelabel_on_insert ON public.clientes CASCADE;

-- 3. Verificação - deve retornar 0 linhas se tudo foi removido
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('set_whitelabel_id', 'set_whitelabel_on_insert', 'custom_access_token_hook');

-- Mensagem de confirmação
SELECT 'Funções whitelabel removidas com sucesso!' AS resultado;
