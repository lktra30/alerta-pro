export type EtapaEnum = 
  | 'Prospecção'
  | 'Contato Feito'
  | 'Reunião Agendada'
  | 'Proposta Enviada'
  | 'Fechado - Ganhou'
  | 'Fechado - Perdido'

export interface Cliente {
  id: number
  nome: string
  email?: string
  telefone?: string
  empresa?: string
  origem?: string
  sdr_id?: string
  closer_id?: string
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
  meta_comercial: number
  meta_closer?: number
  meta_sdr?: number
  meta_diaria?: number
  criado_em: string
  atualizado_em: string
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
        Insert: Omit<Meta, 'id' | 'criado_em' | 'atualizado_em'>
        Update: Partial<Omit<Meta, 'id' | 'criado_em' | 'atualizado_em'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      etapa_enum: EtapaEnum
    }
  }
}
