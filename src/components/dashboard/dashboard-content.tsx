"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  DollarSign, 
  TrendingUp,
  Calculator,
  AlertCircle,
  Users,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import type { DateRange } from "react-day-picker"
import { SalesFunnelChart } from "./sales-funnel-chart"
import { MonthlySalesChart } from "./monthly-sales-chart"
import { LeadsEvolutionChart } from "./leads-evolution-chart"
import { RankingCards } from "./ranking-cards"
import { MetaAdsPerformanceCards } from "@/components/meta-ads/meta-ads-performance-cards"
import { MonthlyInvestmentChart } from "@/components/meta-ads/monthly-investment-chart"
import { MetaAdsService } from "@/lib/meta-ads"
import { getAdvancedDashboardStats, getTopClosers, getTopSDRs, getMetaAdsRealStats, getDailyMeetings, type TopCloser, type TopSDR } from "@/lib/supabase"
import type { MetaAdsMetrics, MonthlyInvestment } from "@/types/meta-ads"
import { PeriodoFiltro } from "@/components/ui/date-range-filter"

interface AdvancedDashboardStats {
  totalFaturamento: number
  totalMRR: number
  metaMensal: number
  metaDiaria: number
  faturamentoDiario: number
  progressoMetaDiaria: number
  diasUteis: number
  diasUteisDecorridos: number
  ticketMedio: number
  totalVendas: number
  clientesAdquiridos: number
  totalReunioesMarcadas: number
  metaReunioesSdr: number
  metaDiariaReunioes: number
  reunioesDiarias: number
  progressoMetaDiariaReunioes: number
  planosMensais: number
  planosTrimestrais: number
  planosSemestrais: number
  planosAnuais: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
  }).format(value)
}

export function DashboardContent() {
  const [stats, setStats] = useState<AdvancedDashboardStats>({
    totalFaturamento: 0,
    totalMRR: 0,
    metaMensal: 10000,
    metaDiaria: 476.19,
    faturamentoDiario: 0,
    progressoMetaDiaria: 0,
    diasUteis: 21,
    diasUteisDecorridos: 15,
    ticketMedio: 0,
    totalVendas: 0,
    clientesAdquiridos: 0,
    totalReunioesMarcadas: 0,
    metaReunioesSdr: 50,
    metaDiariaReunioes: 2.38,
    reunioesDiarias: 0,
    progressoMetaDiariaReunioes: 0,
    planosMensais: 0,
    planosTrimestrais: 0,
    planosSemestrais: 0,
    planosAnuais: 0
  })
  
  // Estados para os cards de ROAS e CAC
  const [roas, setRoas] = useState(0)
  const [cac, setCac] = useState(0)
  const [totalInvestido, setTotalInvestido] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [periodoFilter, setPeriodoFilter] = useState<string>("esteMes")
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>()
  const [showMeetingsGoal, setShowMeetingsGoal] = useState(false)

  // Rankings state
  const [topClosers, setTopClosers] = useState<TopCloser[]>([])
  const [topSDRs, setTopSDRs] = useState<TopSDR[]>([])
  const [rankingsLoading, setRankingsLoading] = useState(true)

  // Meta Ads state
  const [metaAdsMetrics, setMetaAdsMetrics] = useState<MetaAdsMetrics>({
    totalInvestido: 0,
    investimentoPorLead: 0,
    alcance: 0,
    cpcMedio: 0,
    reunioesMarcadas: 0,
    reunioesRealizadas: 0,
    novosFechamentos: 0,
  })
  const [monthlyInvestmentData, setMonthlyInvestmentData] = useState<MonthlyInvestment[]>([])
  const [metaAdsLoading, setMetaAdsLoading] = useState(true)

  const handleFilterChange = (value: string, range?: DateRange) => {
    setPeriodoFilter(value)
    if (value === "custom" && range) {
      setCustomDateRange(range)
    } else {
      setCustomDateRange(undefined)
    }
  }

  // Função helper para obter data no fuso horário brasileiro (UTC-3 / São Paulo)
  const getBrazilDate = (date?: Date) => {
    const sourceDate = date || new Date()
    // Criar data no fuso horário de São Paulo
    const brazilDateStr = sourceDate.toLocaleDateString('en-CA', { 
      timeZone: 'America/Sao_Paulo' 
    })
    return new Date(brazilDateStr + 'T00:00:00')
  }

  // Função centralizada para calcular datas
  const calculateDateRange = () => {
    // Se é filtro personalizado, usar o range customizado
    if (periodoFilter === 'custom' && customDateRange?.from && customDateRange?.to) {
      return {
        startDate: customDateRange.from.toISOString().split('T')[0],
        endDate: customDateRange.to.toISOString().split('T')[0]
      }
    }

    // Para todos os outros filtros, usar fuso horário brasileiro
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
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6) // -6 para ter exatamente 7 dias incluindo hoje
        startDate = sevenDaysAgo.toISOString().split('T')[0]
        endDate = currentDate.toISOString().split('T')[0]
        break
      case 'ultimos30':
        const thirtyDaysAgo = new Date(currentDate)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29) // -29 para ter exatamente 30 dias incluindo hoje
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
        // Para 'all', usar uma data bem antiga (37 meses atrás) até hoje
        const currentBrazilDate = getBrazilDate()
        const thirtySevenMonthsAgo = new Date(currentBrazilDate)
        thirtySevenMonthsAgo.setMonth(thirtySevenMonthsAgo.getMonth() - 37)
        startDate = thirtySevenMonthsAgo.toISOString().split('T')[0]
        endDate = currentBrazilDate.toISOString().split('T')[0]
        break
    }

    return { startDate, endDate }
  }

  useEffect(() => {
    const { startDate, endDate } = calculateDateRange()
    loadDashboardData(startDate, endDate)
    loadRankingsData(startDate, endDate)
    loadMetaAdsData(startDate, endDate)
  }, [periodoFilter, customDateRange])

  const loadDashboardData = async (startDate?: string, endDate?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const dashboardStats = await getAdvancedDashboardStats(periodoFilter, startDate, endDate)
      setStats(dashboardStats)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Erro de conexão: Verifique se o Supabase está configurado corretamente')
      setStats({
        totalFaturamento: 0, totalMRR: 0, metaMensal: 0, metaDiaria: 0,
        faturamentoDiario: 0, progressoMetaDiaria: 0, diasUteis: 0, diasUteisDecorridos: 0,
        ticketMedio: 0, totalVendas: 0, clientesAdquiridos: 0, totalReunioesMarcadas: 0,
        metaReunioesSdr: 0, metaDiariaReunioes: 0, reunioesDiarias: 0, progressoMetaDiariaReunioes: 0,
        planosMensais: 0, planosTrimestrais: 0, planosSemestrais: 0, planosAnuais: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const loadRankingsData = async (startDate?: string, endDate?: string) => {
    setRankingsLoading(true)
    try {
      const [closersData, sdrsData] = await Promise.all([
        getTopClosers(startDate, endDate),
        getTopSDRs(startDate, endDate)
      ])
      
      setTopClosers(closersData)
      setTopSDRs(sdrsData)
    } catch (error) {
      console.error('Error loading rankings data:', error)
      setTopClosers([])
      setTopSDRs([])
    } finally {
      setRankingsLoading(false)
    }
  }

  const loadMetaAdsData = async (startDate: string, endDate: string) => {
    setMetaAdsLoading(true)
    try {
      const metaAdsService = new MetaAdsService()
      const realStats = await getMetaAdsRealStats(startDate, endDate)
      
      // Determinar período para API do Meta Ads
      let since: string
      let until: string
      
      if (periodoFilter === 'all') {
        // Para "todos os períodos", limitar a 37 meses devido à restrição da API do Facebook
        const currentBrazilDate = getBrazilDate()
        const thirtySevenMonthsAgo = new Date(currentBrazilDate)
        thirtySevenMonthsAgo.setMonth(thirtySevenMonthsAgo.getMonth() - 37)
        since = thirtySevenMonthsAgo.toISOString().split('T')[0]
        until = currentBrazilDate.toISOString().split('T')[0]
      } else {
        // Para outros períodos, usar as datas do filtro para Meta Ads também
        since = startDate
        until = endDate
      }
      
      const insights = await metaAdsService.getInsights(since, until)
      const calculatedMetrics = metaAdsService.calculateMetrics(insights)
      const dailyInsights = await metaAdsService.getDailyInsights(since, until)
      
      setTotalInvestido(calculatedMetrics.totalInvestido)
      
      setMetaAdsMetrics({
        ...calculatedMetrics,
        reunioesMarcadas: realStats.reunioesMarcadas,
        reunioesRealizadas: realStats.reunioesRealizadas,
        novosFechamentos: realStats.novosFechamentos,
      })

      const monthlyChartData = metaAdsService.transformToMonthlyData(dailyInsights)
      setMonthlyInvestmentData(monthlyChartData)
    } catch (error) {
      console.error("Error fetching Meta Ads data:", error)
      setTotalInvestido(0) // Resetar em caso de erro
      // Manter o restante do comportamento de fallback...
    } finally {
      setMetaAdsLoading(false)
    }
  }
  
  // Recalcular ROAS e CAC quando stats ou totalInvestido mudarem
  useEffect(() => {
    if (totalInvestido > 0) {
      setRoas(stats.totalFaturamento / totalInvestido)
      setCac(stats.clientesAdquiridos > 0 ? totalInvestido / stats.clientesAdquiridos : totalInvestido)
    } else {
      setRoas(0)
      setCac(0)
    }
  }, [stats.totalFaturamento, stats.clientesAdquiridos, totalInvestido])


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold truncate">Visão Geral</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Acompanhamento de vendas e performance</p>
            </div>
            
            <div className="w-full sm:w-auto">
              <PeriodoFiltro periodo={periodoFilter} onPeriodoChange={handleFilterChange} />
            </div>
          </div>
          
          <div className="flex-shrink-0 w-full sm:w-auto lg:text-right bg-muted/30 p-4 rounded-lg lg:bg-transparent lg:p-0">
            {/* Toggle entre MRR e Reuniões */}
            <div className="flex items-center justify-center lg:justify-end mb-3 gap-2">
              <DollarSign className={`h-4 w-4 ${!showMeetingsGoal ? 'text-green-600' : 'text-muted-foreground'}`} />
              <button
                onClick={() => setShowMeetingsGoal(!showMeetingsGoal)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showMeetingsGoal ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              </button>
              <Calendar className={`h-4 w-4 ${showMeetingsGoal ? 'text-green-600' : 'text-muted-foreground'}`} />
            </div>
            
            <div className="text-center lg:text-right">
              {!showMeetingsGoal ? (
                // Card de Meta MRR
                <>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    {loading ? "..." : `${stats.progressoMetaDiaria.toFixed(1)}%`}
                  </div>
                  <div className="text-sm text-muted-foreground">Meta Diária MRR</div>
                  <div className="text-xs text-muted-foreground">
                    {loading ? "..." : `${formatCurrency(stats.faturamentoDiario)} de ${formatCurrency(stats.metaDiaria)}`}
                  </div>
                  <div className="w-full lg:w-48 mt-2 mx-auto lg:mx-0">
                    <Progress value={Math.min(stats.progressoMetaDiaria, 100)} className="h-2" />
                  </div>
                </>
              ) : (
                // Card de Meta Reuniões
                <>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    {loading ? "..." : `${stats.progressoMetaDiariaReunioes.toFixed(1)}%`}
                  </div>
                  <div className="text-sm text-muted-foreground">Meta Diária Reuniões</div>
                  <div className="text-xs text-muted-foreground">
                    {loading ? "..." : `${stats.reunioesDiarias} de ${stats.metaDiariaReunioes.toFixed(1)} reuniões`}
                  </div>
                  <div className="w-full lg:w-48 mt-2 mx-auto lg:mx-0">
                    <Progress value={Math.min(stats.progressoMetaDiariaReunioes, 100)} className="h-2" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            {error.includes('não configurado') && (
              <p className="text-xs text-muted-foreground mt-2">
                Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Grid - Responsivo com scroll horizontal */}
      <div className="w-full">
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 lg:grid lg:grid-cols-4 lg:gap-4 min-w-max lg:min-w-0">
            <Card className="min-h-[140px] flex flex-col w-80 lg:w-auto flex-shrink-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total em Vendas</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>Mensal: {stats.planosMensais}</span>
                  <span>Trimestral: {stats.planosTrimestrais}</span>
                  <span>Semestral: {stats.planosSemestrais}</span>
                  <span>Anual: {stats.planosAnuais}</span>
                </div>
                <div className="pt-2 mt-auto">
                  <div className="text-xl sm:text-2xl font-bold text-green-600 truncate">
                    {loading ? "..." : formatCurrency(stats.totalFaturamento)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-green-500 truncate">{stats.totalVendas} vendas no período</span>
                    <span className="text-xs truncate">MRR: {formatCurrency(stats.totalMRR)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="min-h-[140px] flex flex-col w-80 lg:w-auto flex-shrink-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <Calculator className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 truncate">
                  {loading ? "..." : formatCurrency(stats.ticketMedio)}
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <span className="text-blue-500">por venda</span>
                </div>
              </CardContent>
            </Card>

            <Card className="min-h-[140px] flex flex-col w-80 lg:w-auto flex-shrink-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROAS</CardTitle>
                <TrendingUp className={`h-4 w-4 ${roas < 1 ? 'text-red-500' : 'text-green-500'}`} />
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className={`text-xl sm:text-2xl font-bold ${roas < 1 ? 'text-red-600' : 'text-green-600'} truncate`}>
                  {loading ? "..." : `${roas.toFixed(2)}x`}
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <span className={`${roas < 1 ? 'text-red-500' : 'text-green-500'} truncate`}>{formatCurrency(totalInvestido)} investidos</span>
                </div>
              </CardContent>
            </Card>

            <Card className="min-h-[140px] flex flex-col w-80 lg:w-auto flex-shrink-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CAC</CardTitle>
                <Users className={`h-4 w-4 ${roas >= 1 ? 'text-green-500' : 'text-red-500'}`} />
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className={`text-xl sm:text-2xl font-bold ${roas >= 1 ? 'text-green-600' : 'text-red-600'} truncate`}>
                  {loading ? "..." : formatCurrency(cac)}
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <span className={`${roas >= 1 ? 'text-green-500' : 'text-red-500'} truncate`}>{stats.clientesAdquiridos} clientes adquiridos</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Progress Indicators - Responsivo */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Progresso da Meta Comercial</CardTitle>
            <CardDescription className="text-sm">
              R$ {stats.totalMRR.toLocaleString('pt-BR')} de R$ {stats.metaMensal.toLocaleString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">Meta Mensal (MRR)</p>
                  <Badge variant="secondary" className="flex-shrink-0">{((stats.totalMRR / stats.metaMensal) * 100).toFixed(2)}%</Badge>  
                </div>
                <Progress value={(stats.totalMRR / stats.metaMensal) * 100} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Progresso de Reuniões Marcadas</CardTitle>
            <CardDescription className="text-sm">
              {stats.totalReunioesMarcadas} de {stats.metaReunioesSdr} reuniões
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">Meta Mensal SDR</p>
                  <Badge variant="secondary" className="flex-shrink-0">{((stats.totalReunioesMarcadas / stats.metaReunioesSdr) * 100).toFixed(1)}%</Badge>  
                </div>
                <Progress value={(stats.totalReunioesMarcadas / stats.metaReunioesSdr) * 100} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers - Responsivo */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Closer */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              🏆 Top Closer
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {rankingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Carregando rankings...</div>
              </div>
            ) : topClosers.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-semibold flex-shrink-0">
                    🏆
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-base sm:text-lg font-semibold truncate">{topClosers[0].nome}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Closer líder em MRR</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-lg sm:text-xl font-bold text-green-600 truncate">
                        {formatCurrency(topClosers[0].totalMRR)}
                      </span>
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500 flex-shrink-0">
                        {topClosers[0].percentualVendas.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {topClosers[0].numeroVendas} vendas • {formatCurrency(topClosers[0].totalVendas / topClosers[0].numeroVendas)} / venda
                    </p>
                    <p className="text-xs text-green-600">das vendas totais</p>
                    
                    {/* Detalhamento por tipo de plano */}
                    <div className="mt-3 pt-3 border-t space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Vendas por período:</p>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {topClosers[0].vendasPorTipo.mensal.quantidade > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="truncate">Mensal: {topClosers[0].vendasPorTipo.mensal.quantidade}x</span>
                            <span className="flex-shrink-0 ml-2">{formatCurrency(topClosers[0].vendasPorTipo.mensal.valor)}</span>
                          </div>
                        )}
                        {topClosers[0].vendasPorTipo.trimestral.quantidade > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="truncate">Trimestral: {topClosers[0].vendasPorTipo.trimestral.quantidade}x</span>
                            <span className="flex-shrink-0 ml-2">{formatCurrency(topClosers[0].vendasPorTipo.trimestral.valor)}</span>
                          </div>
                        )}
                        {topClosers[0].vendasPorTipo.semestral.quantidade > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="truncate">Semestral: {topClosers[0].vendasPorTipo.semestral.quantidade}x</span>
                            <span className="flex-shrink-0 ml-2">{formatCurrency(topClosers[0].vendasPorTipo.semestral.valor)}</span>
                          </div>
                        )}
                        {topClosers[0].vendasPorTipo.anual.quantidade > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="truncate">Anual: {topClosers[0].vendasPorTipo.anual.quantidade}x</span>
                            <span className="flex-shrink-0 ml-2">{formatCurrency(topClosers[0].vendasPorTipo.anual.valor)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-4xl mb-2">🪶</div>
                <p className="text-sm font-medium text-muted-foreground">Nenhum Closer com vendas</p>
                <p className="text-xs text-muted-foreground">Aguardando primeiras vendas...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top SDR */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              🏆 Top SDR
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {rankingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Carregando rankings...</div>
              </div>
            ) : topSDRs.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 font-semibold flex-shrink-0">
                    🎯
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-base sm:text-lg font-semibold truncate">{topSDRs[0].nome}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">SDR líder em reuniões marcadas</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-lg sm:text-xl font-bold text-orange-600 truncate">
                        {topSDRs[0].totalReunioes} reuniões
                      </span>
                      <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-500 flex-shrink-0">
                        {topSDRs[0].percentualReunioes.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {topSDRs[0].vendasGeradas} vendas • MRR: {formatCurrency(topSDRs[0].totalMRRGerado)}
                    </p>
                    <p className="text-xs text-orange-600">das reuniões totais</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-4xl mb-2">🪶</div>
                <p className="text-sm font-medium text-muted-foreground">Nenhum SDR com reuniões</p>
                <p className="text-xs text-muted-foreground">Aguardando primeiras reuniões...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Funnel e Meta Ads Performance lado a lado - Responsivo */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Funnel (Filtrável por Período) */}
        <div className="overflow-hidden">
          <SalesFunnelChart startDate={calculateDateRange().startDate} endDate={calculateDateRange().endDate} />
        </div>

        {/* Meta Ads Performance Section (Filtrável por Período) */}
        <div className="flex flex-col h-full space-y-4 overflow-hidden">
          <div className="flex items-center justify-between flex-shrink-0 px-2">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-green-500 truncate">Meta Ads Performance</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Acompanhe o desempenho dos seus anúncios no Facebook e Instagram
              </p>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <MetaAdsPerformanceCards 
              metrics={metaAdsMetrics}
              isLoading={metaAdsLoading}
              layout="vertical"
            />
          </div>
        </div>
      </div>

      {/* Rankings (Filtráveis por Período) - Responsivo */}
      <div className="overflow-hidden">
        <RankingCards />
      </div>

      {/* Separador Visual */}
      <div className="flex items-center gap-3 my-8">
        <div className="h-[1px] flex-1 bg-border"></div>
        <h2 className="text-base sm:text-lg font-semibold text-muted-foreground flex items-center gap-2 flex-shrink-0">
          📈 Análises Históricas
          <span className="text-xs bg-secondary px-2 py-1 rounded">Não Filtráveis</span>
        </h2>
        <div className="h-[1px] flex-1 bg-border"></div>
      </div>

      {/* Análises Históricas - Responsivo */}
      <div className="space-y-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Análises Históricas</h3>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="overflow-hidden">
            <MonthlySalesChart />
          </div>
          <div className="overflow-hidden">
            <LeadsEvolutionChart />
          </div>
          <div className="overflow-hidden">
            <MonthlyInvestmentChart />
          </div>
        </div>
      </div>
    </div>
  )
}
