# Migração do Funil de Vendas

## Comandos SQL para Supabase

Execute estes comandos SQL no Supabase SQL Editor na seguinte ordem:

### 1. Criar novo tipo ENUM

```sql
-- Criar um novo tipo ENUM com os valores desejados
CREATE TYPE etapa_enum_new AS ENUM (
  'Lead',
  'Leads Qualificados', 
  'Agendados',
  'Reunioes Feitas',
  'Vendas Realizadas'
);
```

### 2. Mapear dados existentes para os novos valores

```sql
-- Atualizar os dados existentes para os novos valores
UPDATE clientes SET etapa = CASE 
  WHEN etapa = 'Prospecção' THEN 'Lead'::etapa_enum_new
  WHEN etapa = 'Contato Feito' THEN 'Lead'::etapa_enum_new
  WHEN etapa = 'Reunião Agendada' THEN 'Agendados'::etapa_enum_new
  WHEN etapa = 'Proposta Enviada' THEN 'Reunioes Feitas'::etapa_enum_new
  WHEN etapa = 'Fechado - Ganhou' THEN 'Vendas Realizadas'::etapa_enum_new
  WHEN etapa = 'Fechado - Perdido' THEN 'Lead'::etapa_enum_new
  ELSE 'Lead'::etapa_enum_new
END::text::etapa_enum_new;
```

### 3. Substituir o tipo ENUM na tabela

```sql
-- Alterar a coluna para usar o novo tipo
ALTER TABLE clientes ALTER COLUMN etapa TYPE etapa_enum_new USING etapa::text::etapa_enum_new;
```

### 4. Limpar tipos antigos

```sql
-- Remover o tipo antigo e renomear o novo
DROP TYPE etapa_enum;
ALTER TYPE etapa_enum_new RENAME TO etapa_enum;
```

## Mapeamento de Valores

| **Valor Antigo**    | **Valor Novo**       | **Descrição**                           |
|---------------------|---------------------|-----------------------------------------|
| Prospecção          | Lead                | Leads iniciais                          |
| Contato Feito       | Lead                | Consolidado como leads iniciais         |
| Reunião Agendada    | Agendados           | Reuniões agendadas                      |
| Proposta Enviada    | Reunioes Feitas     | Reuniões realizadas                     |
| Fechado - Ganhou    | Vendas Realizadas   | Vendas fechadas com sucesso             |
| Fechado - Perdido   | Lead                | Retorna para status de lead             |

## Novo Funil de Vendas

O novo funil agora possui 5 etapas:

1. **Lead** - Leads iniciais e contatos feitos
2. **Leads Qualificados** - Leads que demonstraram interesse
3. **Agendados** - Reuniões agendadas
4. **Reunioes Feitas** - Reuniões realizadas
5. **Vendas Realizadas** - Vendas fechadas com sucesso

## Arquivos Modificados

### Arquivos TypeScript atualizados:

- `src/types/database.ts` - Definição dos novos tipos ENUM
- `src/lib/supabase.ts` - Funções de busca e análise de dados
- `src/components/crm/crm-page.tsx` - Página principal do CRM
- `src/components/crm/novo-cliente-card.tsx` - Formulário de novo cliente
- `src/components/crm/cliente-details-card.tsx` - Detalhes do cliente
- `src/components/dashboard/novo-cliente-popover.tsx` - Popover do dashboard
- `src/components/dashboard/sales-funnel-chart.tsx` - Gráfico do funil de vendas

### Principais mudanças no código:

1. **Tipo EtapaEnum atualizado** com os novos valores
2. **Função getFunnelData()** adaptada para o novo funil
3. **Filtros de vendas fechadas** agora usam `'Vendas Realizadas'`
4. **Componentes de formulário** usam `'Lead'` como valor padrão
5. **Cores e labels** atualizados para refletir as novas etapas
6. **Lógica de leads qualificados** ajustada para o novo fluxo

## Executar após a migração

Após executar os comandos SQL no Supabase, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

O sistema agora funcionará com o novo funil de vendas de 5 etapas.
