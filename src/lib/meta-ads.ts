import { MetaAdsData, MetaAdsMetrics, MonthlyInvestment } from "@/types/meta-ads"

const FACEBOOK_API_BASE = "https://graph.facebook.com/v23.0"
const AD_ACCOUNT_ID = "act_1021480798184024"

export class MetaAdsService {
  private accessToken: string

  constructor() {
    this.accessToken = process.env.NEXT_PUBLIC_META_ACCESS_TOKEN || ""
    
    if (!this.accessToken) {
      console.warn("Meta access token not configured. Using mock data.")
    }
  }

  async getInsights(since: string, until: string): Promise<MetaAdsData> {
    if (!this.accessToken) {
      throw new Error("Meta access token not configured")
    }

    const url = `${FACEBOOK_API_BASE}/${AD_ACCOUNT_ID}/insights`
    const params = new URLSearchParams({
      fields: "spend,impressions,clicks,reach",
      "time_range[since]": since,
      "time_range[until]": until,
      access_token: this.accessToken,
    })

    try {
      const response = await fetch(`${url}?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Facebook API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error("Error fetching Meta Ads insights:", error)
      throw error
    }
  }

  async getDailyInsights(since: string, until: string): Promise<MetaAdsData> {
    if (!this.accessToken) {
      throw new Error("Meta access token not configured")
    }

    const url = `${FACEBOOK_API_BASE}/${AD_ACCOUNT_ID}/insights`
    const params = new URLSearchParams({
      fields: "spend,impressions,clicks,reach",
      "time_range[since]": since,
      "time_range[until]": until,
      time_increment: "1",
      access_token: this.accessToken,
    })

    try {
      const response = await fetch(`${url}?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Facebook API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error("Error fetching daily Meta Ads insights:", error)
      throw error
    }
  }

  calculateMetrics(insights: MetaAdsData): MetaAdsMetrics {
    if (!insights.data || insights.data.length === 0) {
      return {
        totalInvestido: 0,
        investimentoPorLead: 0,
        alcance: 0,
        cpcMedio: 0,
        leadsDoMes: 0,
        leadsQualificados: 0,
        reunioesMarcadas: 0,
        novosClientes: 0,
      }
    }

    const totalData = insights.data.reduce(
      (acc, curr) => ({
        spend: acc.spend + parseFloat(curr.spend || "0"),
        impressions: acc.impressions + parseInt(curr.impressions || "0"),
        clicks: acc.clicks + parseInt(curr.clicks || "0"),
        reach: acc.reach + parseInt(curr.reach || "0"),
      }),
      { spend: 0, impressions: 0, clicks: 0, reach: 0 }
    )

    // Mock calculations for leads and other metrics (you can replace with actual data)
    const estimatedLeads = Math.floor(totalData.clicks * 0.15) // 15% conversion rate
    const qualifiedLeads = Math.floor(estimatedLeads * 0.3) // 30% qualification rate
    const meetings = Math.floor(qualifiedLeads * 0.6) // 60% meeting rate
    const newClients = Math.floor(meetings * 0.4) // 40% closing rate

    return {
      totalInvestido: totalData.spend,
      investimentoPorLead: estimatedLeads > 0 ? totalData.spend / estimatedLeads : 0,
      alcance: totalData.reach,
      cpcMedio: totalData.clicks > 0 ? totalData.spend / totalData.clicks : 0,
      leadsDoMes: estimatedLeads,
      leadsQualificados: qualifiedLeads,
      reunioesMarcadas: meetings,
      novosClientes: newClients,
    }
  }

  transformToMonthlyData(dailyInsights: MetaAdsData): MonthlyInvestment[] {
    if (!dailyInsights.data) return []

    return dailyInsights.data.map((insight, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (dailyInsights.data.length - 1 - index))
      
      return {
        date: date.toISOString().split('T')[0],
        investido: parseFloat(insight.spend || "0"),
      }
    })
  }
}
