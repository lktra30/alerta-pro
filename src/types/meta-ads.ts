export interface MetaAdsInsights {
  spend: string
  impressions: string
  clicks: string
  reach: string
  date_start?: string
  date_stop?: string
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
  reunioesMarcadas: number
  reunioesRealizadas: number
  novosFechamentos: number
}

export interface MonthlyInvestment {
  date: string
  investido: number
}
