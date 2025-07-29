export interface MetaAdsInsights {
  spend: string
  impressions: string
  clicks: string
  reach: string
}

export interface MetaAdsData {
  data: MetaAdsInsights[]
  paging?: {
    cursors: {
      before: string
      after: string
    }
  }
}

export interface MetaAdsMetrics {
  totalInvestido: number
  investimentoPorLead: number
  alcance: number
  cpcMedio: number
  leadsDoMes: number
  leadsQualificados: number
  reunioesMarcadas: number
  novosClientes: number
}

export interface MonthlyInvestment {
  date: string
  investido: number
}
