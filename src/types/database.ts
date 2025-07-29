export type EtapaEnum = 
  | 'Lead'
  | 'Leads Qualificados'
  | 'Agendados'
  | 'Reunioes Feitas'
  | 'Vendas Realizadas'

export interface Cliente {
  id: number
  nome: string
  email?: string
  telefone?: string
  empresa?: string
  origem?: string
  sdr_id?: string // UUID as string
  closer_id?: string // UUID as string
  valor_venda?: number
  data_fechamento?: string
  etapa: EtapaEnum
  endereco?: string
  criado_em: string
  atualizado_em: string
}

export interface Meta {
  id: number
  ano: number
  mes: number
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      etapa_enum: EtapaEnum
    }
  }
}
