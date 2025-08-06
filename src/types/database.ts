export type EtapaEnum = 
  | 'Lead'
  | 'Leads Qualificados'
  | 'Agendados'
  | 'Reunioes Feitas'
  | 'Vendas Realizadas'

export type TipoPlano = 'mensal' | 'trimestral' | 'semestral' | 'anual'

export interface Cliente {
  id: number
  nome: string
  email?: string
  telefone?: string
  empresa?: string
  origem?: string
  sdr_id?: number // Colaborador ID as number
  closer_id?: number // Colaborador ID as number
  valor_venda?: number
  valor_base_plano?: number // Valor base do plano vendido
  tipo_plano?: TipoPlano // Tipo do plano vendido
  data_fechamento?: string
  etapa: EtapaEnum
  endereco?: string
  criado_em: string
  atualizado_em: string
}

export interface Reuniao {
  id: number
  sdr_id: number
  cliente_id?: number
  tipo: 'qualificada' | 'gerou_venda'
  data_reuniao: string
  criado_em: string
}

export interface PlanoConfig {
  mensal: { valor_base: number; periodo_meses: number; fator_bonificacao: number }
  trimestral: { valor_base: number; periodo_meses: number; fator_bonificacao: number }
  semestral: { valor_base: number; periodo_meses: number; fator_bonificacao: number }
  anual: { valor_base: number; periodo_meses: number; fator_bonificacao: number }
}

export interface Meta {
  id: number
  ano: number
  mes: number
  valor_meta_mrr?: number // Meta em MRR para Closers
  meta_reunioes_sdr?: number // Meta em número de reuniões para SDRs
  // Campos antigos mantidos para compatibilidade
  valor_meta: number
  meta_closer?: number
  meta_sdr?: number
}

export interface Sdr {
  id: string
  name: string
  email?: string
  active?: boolean
}

export interface Closer {
  id: string
  name: string
  email?: string
  active?: boolean
}

export interface User {
  id: string
  email?: string
  name?: string
  role?: 'SDR' | 'Closer' | 'Admin'
}

export interface Colaborador {
  id: number
  created_at: string
  nome: string
  funcao: string
}

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: Cliente
        Insert: Omit<Cliente, 'id' | 'criado_em' | 'atualizado_em'>
        Update: Partial<Omit<Cliente, 'id' | 'criado_em' | 'atualizado_em'>>
      }
      metas: {
        Row: Meta
        Insert: Omit<Meta, 'id'>
        Update: Partial<Omit<Meta, 'id'>>
      }
      colaboradores: {
        Row: Colaborador
        Insert: Omit<Colaborador, 'id' | 'created_at'>
        Update: Partial<Omit<Colaborador, 'id' | 'created_at'>>
      }
      reunioes: {
        Row: Reuniao
        Insert: Omit<Reuniao, 'id' | 'criado_em'>
        Update: Partial<Omit<Reuniao, 'id' | 'criado_em'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      etapa_enum: EtapaEnum
    }
  }
}
