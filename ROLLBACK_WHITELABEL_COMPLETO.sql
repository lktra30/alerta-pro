-- =====================================================
-- ROLLBACK COMPLETO - REMOÇÃO DE TODAS AS FUNCIONALIDADES WHITELABEL
-- Execute no SQL Editor do Supabase
-- =====================================================

-- ⚠️ ATENÇÃO: Este script remove COMPLETAMENTE todas as funcionalidades whitelabel
-- ⚠️ Backup dos dados antes de executar se necessário!

-- =====================================================
-- 1. REMOVER TODAS AS POLÍTICAS RLS RELACIONADAS AO WHITELABEL
-- =====================================================

-- Remover política dos clientes (todas as variações)
DROP POLICY IF EXISTS "whitelabel_policy_clientes" ON public.clientes;
DROP POLICY IF EXISTS "Isolamento whitelabel clientes" ON public.clientes;
DROP POLICY IF EXISTS "isolamento_whitelabel_clientes" ON public.clientes;

-- Remover política dos colaboradores (todas as variações)
DROP POLICY IF EXISTS "whitelabel_policy_colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Isolamento whitelabel colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "isolamento_whitelabel_colaboradores" ON public.colaboradores;

-- Remover política das metas (todas as variações)
DROP POLICY IF EXISTS "whitelabel_policy_metas" ON public.metas;
DROP POLICY IF EXISTS "Isolamento whitelabel metas" ON public.metas;
DROP POLICY IF EXISTS "isolamento_whitelabel_metas" ON public.metas;

-- Remover política das reuniões (todas as variações)
DROP POLICY IF EXISTS "whitelabel_policy_reunioes" ON public.reunioes;
DROP POLICY IF EXISTS "Isolamento whitelabel reunioes" ON public.reunioes;
DROP POLICY IF EXISTS "isolamento_whitelabel_reunioes" ON public.reunioes;

-- Remover política dos whitelabels (todas as variações)
DROP POLICY IF EXISTS "whitelabel_policy_whitelabels" ON public.whitelabels;
DROP POLICY IF EXISTS "Isolamento whitelabel whitelabels" ON public.whitelabels;
DROP POLICY IF EXISTS "isolamento_whitelabel_whitelabels" ON public.whitelabels;

-- Remover TODAS as políticas das tabelas (método mais agressivo)
-- Isto remove qualquer política que possa estar causando dependência
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Remover todas as políticas da tabela clientes
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'clientes'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.clientes';
    END LOOP;
    
    -- Remover todas as políticas da tabela colaboradores
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'colaboradores'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.colaboradores';
    END LOOP;
    
    -- Remover todas as políticas da tabela metas
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'metas'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.metas';
    END LOOP;
    
    -- Remover todas as políticas da tabela reunioes
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'reunioes'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.reunioes';
    END LOOP;
    
    -- Remover todas as políticas da tabela whitelabels (se existir)
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'whitelabels'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.whitelabels';
    END LOOP;
END $$;

-- =====================================================
-- 2. REMOVER TODOS OS TRIGGERS RELACIONADOS AO WHITELABEL
-- =====================================================

-- Remover triggers de inserção automática de whitelabel_id
DROP TRIGGER IF EXISTS trigger_set_whitelabel_id_clientes ON public.clientes;
DROP TRIGGER IF EXISTS trigger_set_whitelabel_id_colaboradores ON public.colaboradores;
DROP TRIGGER IF EXISTS trigger_set_whitelabel_id_metas ON public.metas;
DROP TRIGGER IF EXISTS trigger_set_whitelabel_id_reunioes ON public.reunioes;

-- Remover trigger de atualização da tabela whitelabels
DROP TRIGGER IF EXISTS update_whitelabels_updated_at ON public.whitelabels;

-- =====================================================
-- 3. REMOVER TODAS AS FUNÇÕES RELACIONADAS AO WHITELABEL
-- =====================================================

-- Remover funções de inserção automática
DROP FUNCTION IF EXISTS public.set_whitelabel_id_clientes();
DROP FUNCTION IF EXISTS public.set_whitelabel_id_colaboradores();
DROP FUNCTION IF EXISTS public.set_whitelabel_id_metas();
DROP FUNCTION IF EXISTS public.set_whitelabel_id_reunioes();

-- Remover funções de obtenção de whitelabel_id
DROP FUNCTION IF EXISTS public.get_current_user_whitelabel_id();
DROP FUNCTION IF EXISTS public.get_user_whitelabel_id();
DROP FUNCTION IF EXISTS public.get_user_whitelabel_id_by_email(text);

-- Remover função de atualização da tabela whitelabels
DROP FUNCTION IF EXISTS public.update_whitelabels_updated_at();

-- =====================================================
-- 4. REMOVER COLUNAS whitelabel_id DAS TABELAS PRINCIPAIS
-- =====================================================

-- ⚠️ ATENÇÃO: Isto removerá permanentemente os dados de associação ao whitelabel
-- Se você tem dados importantes, faça backup antes!

-- Remover coluna whitelabel_id da tabela clientes (com CASCADE para dependências)
ALTER TABLE public.clientes DROP COLUMN IF EXISTS whitelabel_id CASCADE;

-- Remover coluna whitelabel_id da tabela colaboradores (com CASCADE para dependências)
ALTER TABLE public.colaboradores DROP COLUMN IF EXISTS whitelabel_id CASCADE;

-- Remover coluna whitelabel_id da tabela metas (com CASCADE para dependências)
ALTER TABLE public.metas DROP COLUMN IF EXISTS whitelabel_id CASCADE;

-- Remover coluna whitelabel_id da tabela reunioes (com CASCADE para dependências)
ALTER TABLE public.reunioes DROP COLUMN IF EXISTS whitelabel_id CASCADE;

-- =====================================================
-- 5. REMOVER TABELA WHITELABELS COMPLETAMENTE
-- =====================================================

-- ⚠️ ATENÇÃO: Isto removerá TODOS os dados de whitelabel!
-- Faça backup se necessário!

-- Primeiro desabilitar RLS se estiver ativo
ALTER TABLE IF EXISTS public.whitelabels DISABLE ROW LEVEL SECURITY;

-- Remover a tabela whitelabels
DROP TABLE IF EXISTS public.whitelabels CASCADE;

-- =====================================================
-- 6. RESTAURAR POLÍTICAS RLS ORIGINAIS (SE NECESSÁRIO)
-- =====================================================

-- Se você tinha políticas RLS originais nas tabelas, adicione-as aqui
-- Exemplo de políticas básicas (ajuste conforme sua necessidade):

-- Política básica para clientes (permite todos para usuários autenticados)
-- DROP POLICY IF EXISTS "basic_policy_clientes" ON public.clientes;
-- CREATE POLICY "basic_policy_clientes" ON public.clientes
-- FOR ALL USING (auth.uid() IS NOT NULL);

-- Política básica para colaboradores (permite todos para usuários autenticados)
-- DROP POLICY IF EXISTS "basic_policy_colaboradores" ON public.colaboradores;
-- CREATE POLICY "basic_policy_colaboradores" ON public.colaboradores
-- FOR ALL USING (auth.uid() IS NOT NULL);

-- Política básica para metas (permite todos para usuários autenticados)
-- DROP POLICY IF EXISTS "basic_policy_metas" ON public.metas;
-- CREATE POLICY "basic_policy_metas" ON public.metas
-- FOR ALL USING (auth.uid() IS NOT NULL);

-- Política básica para reuniões (permite todos para usuários autenticados)
-- DROP POLICY IF EXISTS "basic_policy_reunioes" ON public.reunioes;
-- CREATE POLICY "basic_policy_reunioes" ON public.reunioes
-- FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 7. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as funções relacionadas foram removidas
SELECT 
    'Funções restantes relacionadas ao whitelabel' as tipo,
    routine_name as nome
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND (
        routine_name ILIKE '%whitelabel%' 
        OR routine_name ILIKE '%set_whitelabel%'
        OR routine_name ILIKE '%get_whitelabel%'
        OR routine_name ILIKE '%get_current_user_whitelabel%'
        OR routine_name ILIKE '%get_user_whitelabel%'
    )

UNION ALL

-- Verificar se todas as tabelas relacionadas foram removidas
SELECT 
    'Tabelas restantes relacionadas ao whitelabel' as tipo,
    table_name as nome
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name ILIKE '%whitelabel%'

UNION ALL

-- Verificar se todas as colunas whitelabel_id foram removidas
SELECT 
    'Colunas whitelabel_id restantes' as tipo,
    table_name || '.' || column_name as nome
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND column_name = 'whitelabel_id'

UNION ALL

-- Verificar se todas as políticas relacionadas foram removidas
SELECT 
    'Políticas restantes relacionadas ao whitelabel' as tipo,
    tablename || '.' || policyname as nome
FROM pg_policies 
WHERE schemaname = 'public'
    AND policyname ILIKE '%whitelabel%'

UNION ALL

-- Verificar se todos os triggers relacionados foram removidos
SELECT 
    'Triggers restantes relacionados ao whitelabel' as tipo,
    event_object_table || '.' || trigger_name as nome
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND (
        trigger_name ILIKE '%whitelabel%'
        OR trigger_name ILIKE '%set_whitelabel%'
    );

-- =====================================================
-- 8. LIMPEZA DE METADADOS DOS USUÁRIOS (OPCIONAL)
-- =====================================================

-- Se você quiser remover os whitelabel_id dos metadados dos usuários:
-- ⚠️ CUIDADO: Isto pode afetar o funcionamento da autenticação!

-- Descomente apenas se tiver certeza:
/*
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data - 'whitelabel_id'
WHERE raw_user_meta_data ? 'whitelabel_id';
*/

-- =====================================================
-- ROLLBACK CONCLUÍDO!
-- =====================================================

-- Mensagem de confirmação
SELECT 
    '✅ ROLLBACK WHITELABEL CONCLUÍDO!' as status,
    'Todas as funcionalidades whitelabel foram removidas.' as detalhes,
    'Execute a verificação acima para confirmar.' as proximos_passos;
