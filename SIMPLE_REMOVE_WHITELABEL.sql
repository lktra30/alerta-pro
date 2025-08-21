-- VERSÃO SUPER SIMPLES - SEM VERIFICAÇÃO
-- Remover as 3 funções problemáticas

DROP FUNCTION IF EXISTS public.set_whitelabel_id() CASCADE;
DROP FUNCTION IF EXISTS public.set_whitelabel_on_insert() CASCADE;
DROP FUNCTION IF EXISTS public.custom_access_token_hook(event jsonb) CASCADE;

-- Remover triggers relacionados
DROP TRIGGER IF EXISTS trigger_set_whitelabel_id ON public.clientes CASCADE;
DROP TRIGGER IF EXISTS trigger_set_whitelabel_on_insert ON public.clientes CASCADE;

SELECT 'Concluído!' AS status;
