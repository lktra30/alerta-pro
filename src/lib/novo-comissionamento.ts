import { TipoPlano } from '@/types/database'

// Configurações do novo sistema de comissionamento
export interface ComissaoSDRConfig {
  reuniao_qualificada: number // R$5
  reuniao_gerou_venda: number // R$15
  bonus_meta_100: number // R$300
}

export interface ComissaoCloserConfig {
  valores_fixos: {
    mensal: number // R$15
    trimestral: number // R$30
    semestral: number // R$60
    anual: number // R$100
  }
  bonus_meta: {
    meta_100: number // R$500
    meta_110: number // R$800
    meta_120: number // R$1000
  }
}

export interface PlanoConfig {
  mensal: { valor_base: number; periodo_meses: number; fator_bonificacao: number }
  trimestral: { valor_base: number; periodo_meses: number; fator_bonificacao: number }
  semestral: { valor_base: number; periodo_meses: number; fator_bonificacao: number }
  anual: { valor_base: number; periodo_meses: number; fator_bonificacao: number }
}

export interface NovaComissaoConfig {
  sdr: ComissaoSDRConfig
  closer: ComissaoCloserConfig
  planos: PlanoConfig
  checkpoints: {
    checkpoint_1: number // 0-19% = 1/3 do valor (0.333...)
    checkpoint_2: number // 20-64% = 2/3 do valor (0.666...)
    checkpoint_3: number // 65-100%+ = valor total (1.0)
  }
}

export interface VendaDetalhe {
  tipo_plano: string
  valor_venda: number
  valor_base: number
  valor_fixo: number
  valor_fixo_checkpoint: number
  percentual_acima: number
  bonificacao: number
  comissao_total: number
}

export interface ReunioesSDR {
  qualificadas: number
  gerou_venda: number
}

export interface ComissaoSDRResult {
  comissaoBase: number
  bonus: number
  total: number
  reunioes: ReunioesSDR
  percentualMeta: number
}

export interface ComissaoCloserResult {
  comissaoVendas: number
  bonusMeta: number
  total: number
  detalhesVendas: VendaDetalhe[]
  mrrTotal: number
  percentualMeta: number
}

// Configuração padrão do novo sistema
export function getNovaComissaoConfig(): NovaComissaoConfig {
  if (typeof window === 'undefined') {
    return getDefaultComissaoConfig()
  }
  
  const config = localStorage.getItem('nova_comissao_config')
  if (!config) {
    return getDefaultComissaoConfig()
  }
  
  try {
    return JSON.parse(config)
  } catch {
    return getDefaultComissaoConfig()
  }
}

function getDefaultComissaoConfig(): NovaComissaoConfig {
  return {
    sdr: {
      reuniao_qualificada: 5,
      reuniao_gerou_venda: 15,
      bonus_meta_100: 300
    },
    closer: {
      valores_fixos: {
        mensal: 15,
        trimestral: 30,
        semestral: 60,
        anual: 100
      },
      bonus_meta: {
        meta_100: 500,
        meta_110: 800,
        meta_120: 1000
      }
    },
    planos: {
      mensal: { valor_base: 100, periodo_meses: 1, fator_bonificacao: 50 },
      trimestral: { valor_base: 270, periodo_meses: 3, fator_bonificacao: 75 },
      semestral: { valor_base: 480, periodo_meses: 6, fator_bonificacao: 100 },
      anual: { valor_base: 840, periodo_meses: 12, fator_bonificacao: 125 }
    },
    checkpoints: {
      checkpoint_1: 1/3, // 0-19% = 1/3 do valor
      checkpoint_2: 2/3, // 20-64% = 2/3 do valor  
      checkpoint_3: 1.0  // 65-100%+ = valor total
    }
  }
}

export function setNovaComissaoConfig(config: NovaComissaoConfig) {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('nova_comissao_config', JSON.stringify(config))
}

// Função para calcular checkpoint baseado no percentual da meta
export function calculateCheckpoint(percentualMeta: number): 'checkpoint_1' | 'checkpoint_2' | 'checkpoint_3' {
  if (percentualMeta < 20) return 'checkpoint_1'
  if (percentualMeta < 65) return 'checkpoint_2'
  return 'checkpoint_3'
}

// Função para calcular MRR de uma venda
export function calculateMRR(valorVenda: number, tipoPlano: TipoPlano, config: PlanoConfig): number {
  const plano = config[tipoPlano]
  if (!plano) return 0
  
  return valorVenda / plano.periodo_meses
}

// Função para calcular comissão do SDR
export function calculateComissaoSDR(
  reunioesQualificadas: number,
  reunioesGeraramVenda: number,
  percentualMeta: number,
  config: ComissaoSDRConfig
): ComissaoSDRResult {
  const comissaoBase = (reunioesQualificadas * config.reuniao_qualificada) + 
                      (reunioesGeraramVenda * config.reuniao_gerou_venda)
  
  const bonus = percentualMeta >= 100 ? config.bonus_meta_100 : 0
  
  return {
    comissaoBase,
    bonus,
    total: comissaoBase + bonus,
    reunioes: {
      qualificadas: reunioesQualificadas,
      gerou_venda: reunioesGeraramVenda
    },
    percentualMeta
  }
}

// Função para calcular comissão do Closer
export function calculateComissaoCloser(
  vendas: Array<{
    tipo_plano: TipoPlano
    valor_venda: number
    valor_base: number
  }>,
  percentualMeta: number,
  config: ComissaoCloserConfig,
  planosConfig: PlanoConfig
): ComissaoCloserResult {
  const checkpoint = calculateCheckpoint(percentualMeta)
  const fatorCheckpoint = checkpoint === 'checkpoint_1' ? 1/3 :
                         checkpoint === 'checkpoint_2' ? 2/3 : 1
  
  let comissaoVendas = 0
  let mrrTotal = 0
  const detalhesVendas: VendaDetalhe[] = []

  vendas.forEach(venda => {
    const valorFixo = config.valores_fixos[venda.tipo_plano] || 0
    const valorFixoCheckpoint = valorFixo * fatorCheckpoint

    // Calcular MRR
    const mrr = calculateMRR(venda.valor_venda, venda.tipo_plano, planosConfig)
    mrrTotal += mrr

    // Calcular bonificação por venda acima do valor base
    const percentualAcima = venda.valor_base > 0 ? ((venda.valor_venda - venda.valor_base) / venda.valor_base) * 100 : 0
    const fatorBonificacao = planosConfig[venda.tipo_plano]?.fator_bonificacao || 0
    const bonificacaoPercentual = (percentualAcima * fatorBonificacao) / 100
    const bonificacao = valorFixoCheckpoint * (bonificacaoPercentual / 100)

    const comissaoVenda = valorFixoCheckpoint + bonificacao

    comissaoVendas += comissaoVenda

    detalhesVendas.push({
      tipo_plano: venda.tipo_plano,
      valor_venda: venda.valor_venda,
      valor_base: venda.valor_base,
      valor_fixo: valorFixo,
      valor_fixo_checkpoint: valorFixoCheckpoint,
      percentual_acima: percentualAcima,
      bonificacao,
      comissao_total: comissaoVenda
    })
  })

  // Calcular bônus por meta
  let bonusMeta = 0
  if (percentualMeta >= 120) {
    bonusMeta = config.bonus_meta.meta_120
  } else if (percentualMeta >= 110) {
    bonusMeta = config.bonus_meta.meta_110
  } else if (percentualMeta >= 100) {
    bonusMeta = config.bonus_meta.meta_100
  }

  return {
    comissaoVendas,
    bonusMeta,
    total: comissaoVendas + bonusMeta,
    detalhesVendas,
    mrrTotal,
    percentualMeta
  }
}

// Função para obter informações do checkpoint
export function getCheckpointInfo(percentualMeta: number): { name: string; color: string; range: string; fator: number } {
  if (percentualMeta < 20) {
    return { name: 'Iniciante', color: 'bg-red-500', range: '0-19%', fator: 1/3 }
  } else if (percentualMeta < 65) {
    return { name: 'Desenvolvendo', color: 'bg-yellow-500', range: '20-64%', fator: 1/3 }
  } else if (percentualMeta < 100) {
    return { name: 'Avançado', color: 'bg-blue-500', range: '65-99%', fator: 2/3 }
  } else {
    return { name: 'Expert', color: 'bg-green-500', range: '100%+', fator: 1 }
  }
}
