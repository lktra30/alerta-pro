-- Script para remover completamente as funções relacionadas ao whitelabel
-- Execute este script no SQL Editor do Supabase

-- =====================================================
-- 1. REMOVER TODOS OS TRIGGERS RELACIONADOS AO WHITELABEL
-- =====================================================

-- Remover triggers que usam as funções whitelabel
DROP TRIGGER IF EXISTS trigger_set_whitelabel_id_clientes ON public.clientes;
DROP TRIGGER IF EXISTS trigger_set_whitelabel_id_colaboradores ON public.colaboradores;
DROP TRIGGER IF EXISTS trigger_set_whitelabel_id_metas ON public.metas;
DROP TRIGGER IF EXISTS trigger_set_whitelabel_id_reunioes ON public.reunioes;
DROP TRIGGER IF EXISTS trigger_set_whitelabel_on_insert_clientes ON public.clientes;
DROP TRIGGER IF EXISTS trigger_set_whitelabel_on_insert_colaboradores ON public.colaboradores;
DROP TRIGGER IF EXISTS trigger_set_whitelabel_on_insert_metas ON public.metas;
DROP TRIGGER IF EXISTS trigger_set_whitelabel_on_insert_reunioes ON public.reunioes;

-- Remover qualquer trigger que possa usar custom_access_token_hook
DROP TRIGGER IF EXISTS custom_access_token_trigger ON auth.users;

-- =====================================================
-- 2. REMOVER AS FUNÇÕES PROBLEMÁTICAS
-- =====================================================

-- Remover função set_whitelabel_id (todas as variações)
DROP FUNCTION IF EXISTS public.set_whitelabel_id() CASCADE;
DROP FUNCTION IF EXISTS public.set_whitelabel_id_clientes() CASCADE;
DROP FUNCTION IF EXISTS public.set_whitelabel_id_colaboradores() CASCADE;
DROP FUNCTION IF EXISTS public.set_whitelabel_id_metas() CASCADE;
DROP FUNCTION IF EXISTS public.set_whitelabel_id_reunioes() CASCADE;

-- Remover função set_whitelabel_on_insert (todas as variações)
DROP FUNCTION IF EXISTS public.set_whitelabel_on_insert() CASCADE;
DROP FUNCTION IF EXISTS public.set_whitelabel_on_insert_clientes() CASCADE;
DROP FUNCTION IF EXISTS public.set_whitelabel_on_insert_colaboradores() CASCADE;
DROP FUNCTION IF EXISTS public.set_whitelabel_on_insert_metas() CASCADE;
DROP FUNCTION IF EXISTS public.set_whitelabel_on_insert_reunioes() CASCADE;

-- Remover função custom_access_token_hook
DROP FUNCTION IF EXISTS public.custom_access_token_hook(event jsonb) CASCADE;
DROP FUNCTION IF EXISTS auth.custom_access_token_hook(event jsonb) CASCADE;

-- =====================================================
-- 3. REMOVER OUTRAS FUNÇÕES RELACIONADAS
-- =====================================================

-- Remover funções de obtenção de whitelabel_id
DROP FUNCTION IF EXISTS public.get_current_user_whitelabel_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_whitelabel_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_whitelabel_id_by_email(text) CASCADE;

-- =====================================================
-- 4. LIMPAR POLÍTICAS RLS QUE POSSAM USAR ESSAS FUNÇÕES
-- =====================================================

-- Verificar e remover políticas que usam funções whitelabel
DO $$
DECLARE
    pol record;
BEGIN
    -- Remover todas as políticas que contenham referências a whitelabel
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE definition LIKE '%whitelabel%' 
           OR definition LIKE '%get_current_user_whitelabel_id%'
           OR definition LIKE '%get_user_whitelabel_id%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Política removida: % da tabela %.%', 
                     pol.policyname, pol.schemaname, pol.tablename;
    END LOOP;
END $$;

-- =====================================================
-- 5. VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se ainda existem funções relacionadas
SELECT 
    schemaname,
    functionname,
    arguments
FROM pg_functions 
WHERE functionname LIKE '%whitelabel%' 
   OR functionname LIKE '%custom_access_token_hook%';

-- Verificar se ainda existem triggers relacionados
SELECT 
    schemaname,
    tablename,
    triggername
FROM pg_triggers 
WHERE triggername LIKE '%whitelabel%' 
   OR triggername LIKE '%custom_access_token%';

-- Verificar se ainda existem políticas relacionadas
SELECT 
    schemaname,
    tablename,
    policyname,
    definition
FROM pg_policies 
WHERE definition LIKE '%whitelabel%' 
   OR definition LIKE '%get_current_user_whitelabel_id%'
   OR definition LIKE '%get_user_whitelabel_id%';

-- Mensagem de sucesso
SELECT 'Limpeza de funções whitelabel concluída! Verifique os resultados das consultas acima.' AS status;
