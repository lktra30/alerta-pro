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
  Users
} from "lucide-react"
import { SalesFunnelChart } from "./sales-funnel-chart"
import { MonthlySalesChart } from "./monthly-sales-chart"
import { LeadsEvolutionChart } from "./leads-evolution-chart"
import { MRRChart } from "./mrr-chart"
import { RankingCards } from "./ranking-cards"
import { MetaAdsPerformanceCards } from "@/components/meta-ads/meta-ads-performance-cards"
import { MonthlyInvestmentChart } from "@/components/meta-ads/monthly-investment-chart"
import { MetaAdsService } from "@/lib/meta-ads"
import { getAdvancedDashboardStats, isSupabaseConfigured, getTopClosers, getTopSDRs, type TopCloser, type TopSDR } from "@/lib/supabase"
import type { MetaAdsMetrics, MonthlyInvestment } from "@/types/meta-ads"

interface AdvancedDashboardStats {
  totalFaturamento: number
  metaMensal: number
  metaDiaria: number
  faturamentoDiario: number
  progressoMetaDiaria: number
  diasUteis: number
  diasUteisDecorridos: number
  ticketMedio: number
  totalVendas: number
  totalInvestido: number
  cac: number
  roas: number
  clientesAdquiridos: number
  totalReunioesMarcadas: number
  metaReunioesSdr: number
  planosMensais: number
  planosTrimestrais: number
  planosSemestrais: number
  planosAnuais: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function DashboardContent() {
  const [stats, setStats] = useState<AdvancedDashboardStats>({
    totalFaturamento: 0,
    metaMensal: 0,
    metaDiaria: 0,
    faturamentoDiario: 0,
    progressoMetaDiaria: 0,
    diasUteis: 0,
    diasUteisDecorridos: 0,
    ticketMedio: 0,
    totalVendas: 0,
    totalInvestido: 0,
    cac: 0,
    roas: 0,
    clientesAdquiridos: 0,
    totalReunioesMarcadas: 0,
    metaReunioesSdr: 50,
    planosMensais: 0,
    planosTrimestrais: 0,
    planosSemestrais: 0,
    planosAnuais: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    leadsDoMes: 0,
    leadsQualificados: 0,
    reunioesMarcadas: 0,
    novosClientes: 0,
  })
  const [monthlyInvestmentData, setMonthlyInvestmentData] = useState<MonthlyInvestment[]>([])
  const [metaAdsLoading, setMetaAdsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    loadRankingsData()
    loadMetaAdsData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (!isSupabaseConfigured()) {
        setError('Banco de dados não configurado. Configure as variáveis de ambiente do Supabase.')
      }
      
      const dashboardStats = await getAdvancedDashboardStats()
      setStats(dashboardStats)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadRankingsData = async () => {
    setRankingsLoading(true)
    try {
      const [closersData, sdrsData] = await Promise.all([
        getTopClosers(),
        getTopSDRs()
      ])
      
      setTopClosers(closersData)
      setTopSDRs(sdrsData)
    } catch (error) {
      console.error('Error loading rankings data:', error)
    } finally {
      setRankingsLoading(false)
    }
  }

  const loadMetaAdsData = async () => {
    setMetaAdsLoading(true)
    try {
      const metaAdsService = new MetaAdsService()
      
      // Get current month date range
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      const since = firstDay.toISOString().split('T')[0]
      const until = lastDay.toISOString().split('T')[0]

      // Fetch monthly insights
      const insights = await metaAdsService.getInsights(since, until)
      const calculatedMetrics = metaAdsService.calculateMetrics(insights)
      setMetaAdsMetrics(calculatedMetrics)

      // Fetch daily insights for chart
      const dailyInsights = await metaAdsService.getDailyInsights(since, until)
      const monthlyChartData = metaAdsService.transformToMonthlyData(dailyInsights)
      setMonthlyInvestmentData(monthlyChartData)
    } catch (error) {
      console.error("Error fetching Meta Ads data:", error)
      
      // Set mock data for demonstration
      setMetaAdsMetrics({
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
      setMonthlyInvestmentData(mockData)
    } finally {
      setMetaAdsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Daily Goal */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visão Geral</h2>
          <p className="text-muted-foreground">Acompanhamento de vendas e performance</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {loading ? "..." : `${stats.progressoMetaDiaria.toFixed(1)}%`}
          </div>
          <div className="text-sm text-muted-foreground">Meta Diária MRR</div>
          <div className="text-xs text-muted-foreground">
            {loading ? "..." : `${formatCurrency(stats.faturamentoDiario)} de ${formatCurrency(stats.metaDiaria)}`}
          </div>
          <div className="w-48 mt-2">
            <Progress value={Math.min(stats.progressoMetaDiaria, 100)} className="h-2" />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
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

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Vendas</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : formatCurrency(stats.totalFaturamento)}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <span className="text-green-500">{stats.totalVendas} vendas no período</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <span>Mensal: {stats.planosMensais}</span>
                <span>Trimestral: {stats.planosTrimestrais}</span>
                <span>Semestral: {stats.planosSemestrais}</span>
                <span>Anual: {stats.planosAnuais}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Calculator className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? "..." : formatCurrency(stats.ticketMedio)}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <span className="text-blue-500">por venda</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROAS</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : `${stats.roas.toFixed(1)}x`}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <span className="text-green-500">{formatCurrency(stats.totalInvestido)} investidos</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CAC</CardTitle>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? "..." : formatCurrency(stats.cac)}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <span className="text-red-500">{stats.clientesAdquiridos} clientes adquiridos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers and Daily Progress */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Closer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏆 Top Closer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Carregando rankings...</div>
              </div>
            ) : topClosers.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-semibold">
                    🏆
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-lg font-semibold">{topClosers[0].nome}</p>
                    <p className="text-sm text-muted-foreground">Closer líder em MRR</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(topClosers[0].totalMRR)}
                      </span>
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">
                        {topClosers[0].percentualVendas.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {topClosers[0].numeroVendas} vendas • {formatCurrency(topClosers[0].totalVendas / topClosers[0].numeroVendas)} / venda
                    </p>
                    <p className="text-xs text-green-600">das vendas totais</p>
                    
                    {/* Detalhamento por tipo de plano */}
                    <div className="mt-3 pt-3 border-t space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Vendas por período:</p>
                      {topClosers[0].vendasPorTipo.mensal.quantidade > 0 && (
                        <div className="flex justify-between text-xs">
                          <span>Mensal: {topClosers[0].vendasPorTipo.mensal.quantidade}x</span>
                          <span>{formatCurrency(topClosers[0].vendasPorTipo.mensal.valor)}</span>
                        </div>
                      )}
                      {topClosers[0].vendasPorTipo.trimestral.quantidade > 0 && (
                        <div className="flex justify-between text-xs">
                          <span>Trimestral: {topClosers[0].vendasPorTipo.trimestral.quantidade}x</span>
                          <span>{formatCurrency(topClosers[0].vendasPorTipo.trimestral.valor)}</span>
                        </div>
                      )}
                      {topClosers[0].vendasPorTipo.semestral.quantidade > 0 && (
                        <div className="flex justify-between text-xs">
                          <span>Semestral: {topClosers[0].vendasPorTipo.semestral.quantidade}x</span>
                          <span>{formatCurrency(topClosers[0].vendasPorTipo.semestral.valor)}</span>
                        </div>
                      )}
                      {topClosers[0].vendasPorTipo.anual.quantidade > 0 && (
                        <div className="flex justify-between text-xs">
                          <span>Anual: {topClosers[0].vendasPorTipo.anual.quantidade}x</span>
                          <span>{formatCurrency(topClosers[0].vendasPorTipo.anual.valor)}</span>
                        </div>
                      )}
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏆 Top SDR
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Carregando rankings...</div>
              </div>
            ) : topSDRs.length > 0 ? (
              <div className="flex items-start space-x-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 font-semibold">
                  🏆
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-lg font-semibold">{topSDRs[0].nome}</p>
                  <p className="text-sm text-muted-foreground">SDR líder em MRR gerado</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-orange-600">
                      {formatCurrency(topSDRs[0].totalMRRGerado)}
                    </span>
                    <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-500">
                      {topSDRs[0].percentualReunioes.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {topSDRs[0].vendasGeradas} vendas • {topSDRs[0].totalReunioes} reuniões
                  </p>
                  <p className="text-xs text-orange-600">das reuniões totais</p>
                  <p className="text-xs text-muted-foreground">
                    {topSDRs[0].reunioesQualificadas} reuniões qualificadas
                  </p>
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

      {/* Progress Indicators */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progresso da Meta Comercial</CardTitle>
            <CardDescription>
              R$ {stats.totalFaturamento.toLocaleString('pt-BR')} de R$ {stats.metaMensal.toLocaleString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Meta Mensal (MRR)</p>
                  <Badge variant="secondary">{((stats.totalFaturamento / stats.metaMensal) * 100).toFixed(1)}%</Badge>  
                </div>
                <Progress value={(stats.totalFaturamento / stats.metaMensal) * 100} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progresso de Reuniões Marcadas</CardTitle>
            <CardDescription>
              {stats.totalReunioesMarcadas} de {stats.metaReunioesSdr} reuniões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Meta Mensal SDR</p>
                  <Badge variant="secondary">{((stats.totalReunioesMarcadas / stats.metaReunioesSdr) * 100).toFixed(1)}%</Badge>  
                </div>
                <Progress value={(stats.totalReunioesMarcadas / stats.metaReunioesSdr) * 100} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Funnel Charts */}
      <SalesFunnelChart />

      {/* MRR Chart */}
      <MRRChart />

      {/* Rankings */}
      <RankingCards />

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlySalesChart />
        <LeadsEvolutionChart />
      </div>

      {/* Meta Ads Performance Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-500">Meta Ads Performance</h3>
            <p className="text-sm text-muted-foreground">
              Acompanhe o desempenho dos seus anúncios no Facebook e Instagram
            </p>
          </div>
        </div>
        
        <MetaAdsPerformanceCards metrics={metaAdsMetrics} isLoading={metaAdsLoading} />
        
        <MonthlyInvestmentChart data={monthlyInvestmentData} isLoading={metaAdsLoading} />
      </div>
    </div>
  )
}
