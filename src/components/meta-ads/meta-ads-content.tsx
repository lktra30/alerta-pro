"use client"

import { useState, useEffect } from "react"
import { MetaAdsPerformanceCards } from "./meta-ads-performance-cards"
import { MonthlyInvestmentChart } from "./monthly-investment-chart"
import { MetaAdsService } from "@/lib/meta-ads"
import { MetaAdsMetrics, MonthlyInvestment } from "@/types/meta-ads"
import { Button } from "@/components/ui/button"
import { RefreshCw, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MetaAdsContent() {
  const [metrics, setMetrics] = useState<MetaAdsMetrics>({
    totalInvestido: 0,
    investimentoPorLead: 0,
    alcance: 0,
    cpcMedio: 0,
    leadsDoMes: 0,
    leadsQualificados: 0,
    reunioesMarcadas: 0,
    novosClientes: 0,
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyInvestment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const metaAdsService = new MetaAdsService()

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get current month's data
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const since = firstDay.toISOString().split('T')[0]
      const until = lastDay.toISOString().split('T')[0]

      // Fetch monthly insights
      const insights = await metaAdsService.getInsights(since, until)
      const calculatedMetrics = metaAdsService.calculateMetrics(insights)
      setMetrics(calculatedMetrics)

      // Fetch daily insights for chart
      const dailyInsights = await metaAdsService.getDailyInsights(since, until)
      const monthlyChartData = metaAdsService.transformToMonthlyData(dailyInsights)
      setMonthlyData(monthlyChartData)

      setLastUpdated(new Date())
    } catch (err) {
      console.error("Error fetching Meta Ads data:", err)
      setError("Erro ao carregar dados do Meta Ads. Verifique sua conexão e token de acesso.")
      
      // Set mock data for demonstration
      setMetrics({
        totalInvestido: 170247.62,
        investimentoPorLead: 126.11,
        alcance: 1919163,
        cpcMedio: 2.11,
        leadsDoMes: 1350,
        leadsQualificados: 0,
        reunioesMarcadas: 100,
        novosClientes: 97,
      })

      // Generate mock monthly data
      const mockData: MonthlyInvestment[] = []
      for (let i = 30; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        mockData.push({
          date: date.toISOString().split('T')[0],
          investido: Math.random() * 10000 + 45000 + (i * 1000)
        })
      }
      setMonthlyData(mockData)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-green-500">Meta Ads Performance</h1>
        <p className="text-muted-foreground">
          Acompanhe o desempenho dos seus anúncios no Facebook e Instagram
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {lastUpdated 
              ? `Última atualização: ${lastUpdated.toLocaleString('pt-BR')}`
              : "Carregando..."
            }
          </span>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Aviso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
            <p className="text-xs text-muted-foreground">
              Exibindo dados de exemplo. Configure a variável de ambiente NEXT_PUBLIC_META_ACCESS_TOKEN para acessar dados reais.
            </p>
          </CardContent>
        </Card>
      )}

      <MetaAdsPerformanceCards metrics={metrics} isLoading={isLoading} />
      
      <MonthlyInvestmentChart data={monthlyData} isLoading={isLoading} />
    </div>
  )
}
