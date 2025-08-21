-- =====================================================
-- ROLLBACK AGRESSIVO - REMOÇÃO FORÇADA DE WHITELABEL
-- Execute APENAS se o script principal falhar
-- =====================================================

-- ⚠️ ESTE SCRIPT É MAIS AGRESSIVO E REMOVE TUDO À FORÇA
-- Use apenas se o script principal falhar com erros de dependência

-- =====================================================
-- 1. REMOVER TODAS AS POLÍTICAS RLS DE TODAS AS TABELAS
-- =====================================================

-- Listar e remover todas as políticas existentes
DO $$
DECLARE
    pol RECORD;
    tabela TEXT;
BEGIN
    -- Lista de tabelas para processar
    FOR tabela IN SELECT unnest(ARRAY['clientes', 'colaboradores', 'metas', 'reunioes', 'whitelabels'])
    LOOP
        -- Verificar se a tabela existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tabela) THEN
            -- Remover todas as políticas da tabela
            FOR pol IN 
                SELECT policyname 
                FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = tabela
            LOOP
                BEGIN
                    EXECUTE 'DROP POLICY "' || pol.policyname || '" ON public.' || tabela;
                    RAISE NOTICE 'Política removida: % da tabela %', pol.policyname, tabela;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Erro ao remover política %: %', pol.policyname, SQLERRM;
                END;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 2. DESABILITAR RLS EM TODAS AS TABELAS
-- =====================================================

-- Desabilitar RLS para evitar conflitos
DO $$
DECLARE
    tabela TEXT;
BEGIN
    FOR tabela IN SELECT unnest(ARRAY['clientes', 'colaboradores', 'metas', 'reunioes', 'whitelabels'])
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tabela) THEN
            BEGIN
                EXECUTE 'ALTER TABLE public.' || tabela || ' DISABLE ROW LEVEL SECURITY';
                RAISE NOTICE 'RLS desabilitado para: %', tabela;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao desabilitar RLS para %: %', tabela, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 3. REMOVER TRIGGERS COM FORÇA
-- =====================================================

-- Remover todos os triggers relacionados ao whitelabel
DO $$
DECLARE
    trig RECORD;
BEGIN
    FOR trig IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
        AND (
            trigger_name ILIKE '%whitelabel%'
            OR trigger_name ILIKE '%set_whitelabel%'
            OR trigger_name ILIKE '%update_whitelabels%'
        )
    LOOP
        BEGIN
            EXECUTE 'DROP TRIGGER IF EXISTS ' || trig.trigger_name || ' ON public.' || trig.event_object_table;
            RAISE NOTICE 'Trigger removido: % da tabela %', trig.trigger_name, trig.event_object_table;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao remover trigger %: %', trig.trigger_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- 4. REMOVER FUNÇÕES COM FORÇA
-- =====================================================

-- Remover todas as funções relacionadas ao whitelabel
DO $$
DECLARE
    func RECORD;
BEGIN
    FOR func IN 
        SELECT routine_name, routine_type
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND (
            routine_name ILIKE '%whitelabel%' 
            OR routine_name ILIKE '%set_whitelabel%'
            OR routine_name ILIKE '%get_whitelabel%'
            OR routine_name ILIKE '%get_current_user_whitelabel%'
            OR routine_name ILIKE '%get_user_whitelabel%'
            OR routine_name = 'update_whitelabels_updated_at'
        )
    LOOP
        BEGIN
            EXECUTE 'DROP ' || func.routine_type || ' IF EXISTS public.' || func.routine_name || ' CASCADE';
            RAISE NOTICE 'Função removida: %', func.routine_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao remover função %: %', func.routine_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- 5. REMOVER FOREIGN KEYS RELACIONADAS AO WHITELABEL
-- =====================================================

-- Remover todas as foreign keys que referenciam whitelabel_id
DO $$
DECLARE
    fk RECORD;
BEGIN
    FOR fk IN 
        SELECT 
            tc.table_name, 
            tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND kcu.column_name = 'whitelabel_id'
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE public.' || fk.table_name || ' DROP CONSTRAINT IF EXISTS ' || fk.constraint_name;
            RAISE NOTICE 'Foreign key removida: % da tabela %', fk.constraint_name, fk.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao remover foreign key %: %', fk.constraint_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- 6. REMOVER COLUNAS whitelabel_id COM CASCADE
-- =====================================================

-- Forçar remoção das colunas whitelabel_id
DO $$
DECLARE
    tabela TEXT;
BEGIN
    FOR tabela IN SELECT unnest(ARRAY['clientes', 'colaboradores', 'metas', 'reunioes'])
    LOOP
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = tabela 
            AND column_name = 'whitelabel_id'
        ) THEN
            BEGIN
                EXECUTE 'ALTER TABLE public.' || tabela || ' DROP COLUMN whitelabel_id CASCADE';
                RAISE NOTICE 'Coluna whitelabel_id removida da tabela: %', tabela;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao remover coluna whitelabel_id de %: %', tabela, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 7. REMOVER TABELA WHITELABELS COM CASCADE
-- =====================================================

-- Forçar remoção da tabela whitelabels
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whitelabels') THEN
        BEGIN
            DROP TABLE public.whitelabels CASCADE;
            RAISE NOTICE 'Tabela whitelabels removida com sucesso';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao remover tabela whitelabels: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Tabela whitelabels não existe';
    END IF;
END $$;

-- =====================================================
-- 8. VERIFICAÇÃO FINAL DETALHADA
-- =====================================================

-- Verificar se restou alguma coisa relacionada ao whitelabel
SELECT 
    'VERIFICAÇÃO FINAL' as categoria,
    'Resultado' as item,
    'Status' as valor

UNION ALL

-- Funções restantes
SELECT 
    'Funções' as categoria,
    routine_name as item,
    'AINDA EXISTE' as valor
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND (
        routine_name ILIKE '%whitelabel%' 
        OR routine_name ILIKE '%set_whitelabel%'
        OR routine_name ILIKE '%get_whitelabel%'
    )

UNION ALL

-- Tabelas restantes
SELECT 
    'Tabelas' as categoria,
    table_name as item,
    'AINDA EXISTE' as valor
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name ILIKE '%whitelabel%'

UNION ALL

-- Colunas restantes
SELECT 
    'Colunas' as categoria,
    table_name || '.' || column_name as item,
    'AINDA EXISTE' as valor
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND column_name = 'whitelabel_id'

UNION ALL

-- Políticas restantes
SELECT 
    'Políticas' as categoria,
    tablename || '.' || policyname as item,
    'AINDA EXISTE' as valor
FROM pg_policies 
WHERE schemaname = 'public'
    AND policyname ILIKE '%whitelabel%'

UNION ALL

-- Triggers restantes
SELECT 
    'Triggers' as categoria,
    event_object_table || '.' || trigger_name as item,
    'AINDA EXISTE' as valor
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND trigger_name ILIKE '%whitelabel%'

UNION ALL

-- Constraints restantes
SELECT 
    'Constraints' as categoria,
    table_name || '.' || constraint_name as item,
    'AINDA EXISTE' as valor
FROM information_schema.table_constraints 
WHERE table_schema = 'public'
    AND constraint_name ILIKE '%whitelabel%'

ORDER BY categoria, item;

-- Mensagem final
SELECT 
    '✅ ROLLBACK AGRESSIVO CONCLUÍDO!' as status,
    'Verificação executada - veja resultados acima' as detalhes;
