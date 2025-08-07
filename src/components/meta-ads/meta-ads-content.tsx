"use client"

import { useState, useEffect } from "react"
import { MetaAdsPerformanceCards } from "./meta-ads-performance-cards"
import { MonthlyInvestmentChart } from "./monthly-investment-chart"
import { MetaAdsService } from "@/lib/meta-ads"
import { MetaAdsMetrics, MonthlyInvestment } from "@/types/meta-ads"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PeriodoFiltro } from "@/components/ui/date-range-filter"
import { getMetaAdsRealStats } from "@/lib/supabase"

export function MetaAdsContent() {
  const [metrics, setMetrics] = useState<MetaAdsMetrics>({
    totalInvestido: 0,
    investimentoPorLead: 0,
    alcance: 0,
    cpcMedio: 0,
    reunioesMarcadas: 0,
    reunioesRealizadas: 0,
    novosFechamentos: 0,
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyInvestment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [periodoFilter, setPeriodoFilter] = useState<string>("esteMes")
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>()

  const metaAdsService = new MetaAdsService()

  // Função helper para obter data no fuso horário brasileiro (UTC-3 / São Paulo)
  const getBrazilDate = (date?: Date) => {
    const sourceDate = date || new Date()
    const brazilDateStr = sourceDate.toLocaleDateString('en-CA', { 
      timeZone: 'America/Sao_Paulo' 
    })
    return new Date(brazilDateStr + 'T00:00:00')
  }

  // Função centralizada para calcular datas
  const calculateDateRange = () => {
    if (periodoFilter === 'custom' && customDateRange?.from && customDateRange?.to) {
      return {
        startDate: customDateRange.from.toISOString().split('T')[0],
        endDate: customDateRange.to.toISOString().split('T')[0]
      }
    }

    const currentDate = getBrazilDate()
    let startDate: string
    let endDate: string

    switch (periodoFilter) {
      case 'hoje':
        startDate = currentDate.toISOString().split('T')[0]
        endDate = currentDate.toISOString().split('T')[0]
        break
      case 'ontem':
        const yesterday = new Date(currentDate)
        yesterday.setDate(yesterday.getDate() - 1)
        startDate = yesterday.toISOString().split('T')[0]
        endDate = yesterday.toISOString().split('T')[0]
        break
      case 'ultimos7':
        const sevenDaysAgo = new Date(currentDate)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        startDate = sevenDaysAgo.toISOString().split('T')[0]
        endDate = currentDate.toISOString().split('T')[0]
        break
      case 'ultimos30':
        const thirtyDaysAgo = new Date(currentDate)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        startDate = thirtyDaysAgo.toISOString().split('T')[0]
        endDate = currentDate.toISOString().split('T')[0]
        break
      case 'esteMes':
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        startDate = firstDayOfMonth.toISOString().split('T')[0]
        endDate = currentDate.toISOString().split('T')[0]
        break
      case 'mesPassado':
        const firstDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        const lastDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
        startDate = firstDayLastMonth.toISOString().split('T')[0]
        endDate = lastDayLastMonth.toISOString().split('T')[0]
        break
      case 'all':
      default:
        const currentBrazilDate = getBrazilDate()
        const thirtySevenMonthsAgo = new Date(currentBrazilDate)
        thirtySevenMonthsAgo.setMonth(thirtySevenMonthsAgo.getMonth() - 37)
        startDate = thirtySevenMonthsAgo.toISOString().split('T')[0]
        endDate = currentBrazilDate.toISOString().split('T')[0]
        break
    }

    return { startDate, endDate }
  }

  const handleFilterChange = (periodo: string, range?: DateRange) => {
    setPeriodoFilter(periodo)
    setCustomDateRange(range)
  }

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { startDate: since, endDate: until } = calculateDateRange()

      const realStats = await getMetaAdsRealStats(since, until)
      const insights = await metaAdsService.getInsights(since, until)
      const calculatedMetrics = metaAdsService.calculateMetrics(insights)
      
      setMetrics({
        ...calculatedMetrics,
        reunioesMarcadas: realStats.reunioesMarcadas,
        reunioesRealizadas: realStats.reunioesRealizadas,
        novosFechamentos: realStats.novosFechamentos,
      })

      const dailyInsights = await metaAdsService.getDailyInsights(since, until)
      const monthlyChartData = metaAdsService.transformToMonthlyData(dailyInsights)
      setMonthlyData(monthlyChartData)

      setLastUpdated(new Date())
    } catch (err) {
      console.error("Error fetching Meta Ads data:", err)
      setError("Erro ao carregar dados do Meta Ads. Verifique sua conexão e token de acesso.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [periodoFilter, customDateRange])

  const handleRefresh = () => {
    fetchData()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Meta Ads Performance</h1>
            <p className="text-muted-foreground">
              Acompanhe o desempenho dos seus anúncios no Facebook e Instagram
            </p>
          </div>
          
          <PeriodoFiltro periodo={periodoFilter} onPeriodoChange={handleFilterChange} />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

      <MetaAdsPerformanceCards 
        metrics={metrics} 
        isLoading={isLoading}
      />
      
      <MonthlyInvestmentChart isLoading={isLoading} />
    </div>
  )
}
