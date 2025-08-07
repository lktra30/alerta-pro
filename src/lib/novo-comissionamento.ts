import { TipoPlano } from '@/types/database'

// Adicionar tipo Cliente para usar na função
interface Cliente {
  id: number
  closer_id?: number
  sdr_id?: number
  etapa: string
  valor_venda?: number
  tipo_plano?: string
  criado_em?: string
}

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
  mrrGerado: number;
  detalhesVendas: VendaDetalhe[]
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
      mensal: { valor_base: 99.90, periodo_meses: 1, fator_bonificacao: 50 },
      trimestral: { valor_base: 269.80, periodo_meses: 3, fator_bonificacao: 75 }, // 299.70 - 29.90
      semestral: { valor_base: 479.90, periodo_meses: 6, fator_bonificacao: 100 }, // 599.40 - 119.50
      anual: { valor_base: 839.90, periodo_meses: 12, fator_bonificacao: 125 } // 1198.80 - 358.90
    },
    checkpoints: {
      checkpoint_1: 1/3, // 20-64% = 1/3 do valor
      checkpoint_2: 2/3, // 65-99% = 2/3 do valor  
      checkpoint_3: 1.0  // 100%+ = valor total
    }
  }
}

export function setNovaComissaoConfig(config: NovaComissaoConfig) {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('nova_comissao_config', JSON.stringify(config))
}

// Função para calcular checkpoint baseado no percentual da meta
export function calculateCheckpoint(percentualMeta: number): 'none' | 'checkpoint_1' | 'checkpoint_2' | 'checkpoint_3' {
  if (percentualMeta < 20) return 'none'           // Abaixo de 20% = sem comissão
  if (percentualMeta < 65) return 'checkpoint_1'   // 20-64% = checkpoint 1 (1/3)
  if (percentualMeta < 100) return 'checkpoint_2'  // 65-99% = checkpoint 2 (2/3)
  return 'checkpoint_3'                            // 100%+ = checkpoint 3 (100%)
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
  // Calcular o checkpoint e o fator correspondente
  const checkpoint = calculateCheckpoint(percentualMeta)
  const fatorCheckpoint = checkpoint === 'none' ? 0 :
                         checkpoint === 'checkpoint_1' ? 1/3 :
                         checkpoint === 'checkpoint_2' ? 2/3 : 1
  
  // Aplicar o fator do checkpoint nos valores das comissões
  const comissaoBase = (reunioesQualificadas * config.reuniao_qualificada * fatorCheckpoint) + 
                      (reunioesGeraramVenda * config.reuniao_gerou_venda * fatorCheckpoint)
  
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
  const fatorCheckpoint = checkpoint === 'none' ? 0 :
                         checkpoint === 'checkpoint_1' ? 1/3 :
                         checkpoint === 'checkpoint_2' ? 2/3 : 1
  
  let comissaoVendas = 0
  let mrrGerado = 0
  const detalhesVendas: VendaDetalhe[] = []

  vendas.forEach(venda => {
    const valorFixo = config.valores_fixos[venda.tipo_plano] || 0
    const valorFixoCheckpoint = valorFixo * fatorCheckpoint

    // Calcular MRR
    const mrr = calculateMRR(venda.valor_venda, venda.tipo_plano, planosConfig)
    mrrGerado += mrr

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

  const total = comissaoVendas + bonusMeta

  return {
    total,
    comissaoVendas,
    bonusMeta,
    mrrGerado,
    detalhesVendas,
    percentualMeta,
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

// Função para calcular comissão do SDR baseado nos clientes e reuniões
export async function calculateComissaoSDRFromClientes(
  clientes: any[],
  reunioes: any[],
  sdrId: number,
  percentualMeta: number,
  config: ComissaoSDRConfig
): Promise<ComissaoSDRResult> {
  // Filtrar reuniões do SDR
  const reunioesSDR = reunioes.filter(reuniao => reuniao.sdr_id === sdrId)
  
  // Contar reuniões qualificadas (todas as reuniões do SDR)
  const reunioesQualificadas = reunioesSDR.length
  
  // Contar reuniões que geraram venda (clientes com etapa "Vendas Realizadas" e valor_venda preenchido)
  const clientesSDR = clientes.filter(cliente => cliente.sdr_id === sdrId)
  const reunioesGeraramVenda = clientesSDR.filter(cliente => 
    cliente.etapa === 'Vendas Realizadas' && 
    cliente.valor_venda && 
    cliente.valor_venda > 0
  ).length

  return calculateComissaoSDR(reunioesQualificadas, reunioesGeraramVenda, percentualMeta, config)
}

// Função para calcular comissão do Closer baseado nos clientes
export function calculateComissaoCloserFromClientes(
  clientes: Cliente[],
  closerId: number,
  percentualMeta: number,
  config: ComissaoCloserConfig
): ComissaoCloserResult {
  const vendasCloser = clientes.filter(c =>
    c.closer_id === closerId &&
    c.etapa === 'Vendas Realizadas' &&
    c.valor_venda && c.valor_venda > 0
  );

  // Calcular checkpoint baseado no percentual da meta
  const checkpoint = calculateCheckpoint(percentualMeta)
  const fatorCheckpoint = checkpoint === 'none' ? 0 :
                         checkpoint === 'checkpoint_1' ? 1/3 :
                         checkpoint === 'checkpoint_2' ? 2/3 : 1

  let comissaoVendas = 0;
  let mrrGerado = 0;
  const detalhesVendas: VendaDetalhe[] = [];

  for (const venda of vendasCloser) {
    const valorVenda = venda.valor_venda || 0;
    const tipoPlano = venda.tipo_plano || 'mensal';
    
    // Usar valores fixos com checkpoint
    const valorFixo = config.valores_fixos[tipoPlano as keyof typeof config.valores_fixos] || 0;
    const valorFixoComCheckpoint = valorFixo * fatorCheckpoint;
    comissaoVendas += valorFixoComCheckpoint;

    const valorMensal = tipoPlano === 'mensal' ? valorVenda :
                       tipoPlano === 'trimestral' ? valorVenda / 3 :
                       tipoPlano === 'semestral' ? valorVenda / 6 :
                       tipoPlano === 'anual' ? valorVenda / 12 : 0;
    mrrGerado += valorMensal;

    // Adicionar detalhes da venda
    detalhesVendas.push({
      tipo_plano: tipoPlano,
      valor_venda: valorVenda,
      valor_base: 0, // Não temos valor base na estrutura Cliente
      valor_fixo: valorFixo,
      valor_fixo_checkpoint: valorFixoComCheckpoint,
      percentual_acima: 0, // Sem valor base, não há percentual acima
      bonificacao: 0, // Sem bonificação por enquanto
      comissao_total: valorFixoComCheckpoint
    });
  }

  const bonusMeta = percentualMeta >= 100 ? config.bonus_meta.meta_100 : 0;
  const total = comissaoVendas + bonusMeta;

  return {
    total,
    comissaoVendas,
    bonusMeta,
    mrrGerado,
    detalhesVendas,
    percentualMeta,
  };
}

// Função auxiliar para obter fator de bonificação por tipo de plano
function getFatorBonificacao(tipoPlano: string): number {
  const fatores = {
    'mensal': 50,     // 50%
    'trimestral': 75, // 75%
    'semestral': 100, // 100%
    'anual': 125      // 125%
  }
  return fatores[tipoPlano as keyof typeof fatores] || 50
}
