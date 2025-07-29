"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  DollarSign, 
  TrendingUp,
  ArrowUpRight,
  Target,
  Calculator,
  AlertCircle
} from "lucide-react"
import { SalesFunnelChart } from "./sales-funnel-chart"
import { MonthlySalesChart } from "./monthly-sales-chart"
import { LeadsEvolutionChart } from "./leads-evolution-chart"
import { MetaAdsPerformanceCards } from "@/components/meta-ads/meta-ads-performance-cards"
import { MonthlyInvestmentChart } from "@/components/meta-ads/monthly-investment-chart"
import { MetaAdsService } from "@/lib/meta-ads"
import { getDashboardStats, getTopPerformers, getCurrentMonthMeta, getDailySales, isSupabaseConfigured } from "@/lib/supabase"
import type { Meta } from "@/types/database"
import type { MetaAdsMetrics, MonthlyInvestment } from "@/types/meta-ads"

interface DashboardStats {
  totalVendas: number
  valorTotal: number
  ticketMedio: number
  taxaConversao: number
  clientesAtivos: number
  vendasFechadas: number
}

interface TopPerformer {
  name: string
  value: number
  sales: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVendas: 0,
    valorTotal: 0,
    ticketMedio: 0,
    taxaConversao: 0,
    clientesAtivos: 0,
    vendasFechadas: 0
  })
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [currentMeta, setCurrentMeta] = useState<Meta | null>(null)
  const [dailySales, setDailySales] = useState(0)
  const [dailyGoal, setDailyGoal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    loadMetaAdsData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (!isSupabaseConfigured()) {
        setError('Banco de dados não configurado. Configure as variáveis de ambiente do Supabase.')
        // Use mock data when Supabase is not configured
        setStats({
          totalVendas: 42,
          valorTotal: 127500,
          ticketMedio: 3035,
          taxaConversao: 15.8,
          clientesAtivos: 18,
          vendasFechadas: 14
        })
        setTopPerformers([
          { name: "João Silva", value: 45000, sales: 8 },
          { name: "Maria Santos", value: 32000, sales: 6 }
        ])
        setCurrentMeta({ id: 0, meta_comercial: 800000, ano: 2025, mes: 7, criado_em: '', atualizado_em: '' })
        setDailySales(4250)
        setDailyGoal(26667)
        return
      }

      const [dashboardStats, performers, metaData, dailyData] = await Promise.all([
        getDashboardStats(),
        getTopPerformers(),
        getCurrentMonthMeta(),
        getDailySales()
      ])

      setStats(dashboardStats)
      setTopPerformers(performers)
      setCurrentMeta(metaData)
      setDailySales(dailyData.dailySales)
      setDailyGoal(dailyData.dailyGoal)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Erro ao carregar dados do dashboard. Verifique a conexão com o banco.')
      
      // Fallback to mock data on error
      setStats({
        totalVendas: 0,
        valorTotal: 0,
        ticketMedio: 0,
        taxaConversao: 0,
        clientesAtivos: 0,
        vendasFechadas: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMetaAdsData = async () => {
    setMetaAdsLoading(true)
    
    try {
      const metaAdsService = new MetaAdsService()
      
      // Get current month's data
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

  // Calculate meta values
  const metaComercial = currentMeta?.meta_comercial || 0
  const progressoMeta = metaComercial > 0 ? (stats.valorTotal / metaComercial) * 100 : 0
  const metaDiaria = metaComercial / 30 // Rough daily goal
  const progressoDiario = dailyGoal > 0 ? (dailySales / dailyGoal) * 100 : 0

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
            {loading ? "..." : `${progressoDiario.toFixed(1)}%`}
          </div>
          <div className="text-sm text-muted-foreground">Meta Diária</div>
          <div className="text-xs text-muted-foreground">
            {loading ? "..." : `${formatCurrency(dailySales)} de ${formatCurrency(metaDiaria)}`}
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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : formatCurrency(stats.valorTotal)}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+{progressoMeta.toFixed(1)}%</span>
              <span>{stats.vendasFechadas} vendas no período</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Comercial</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : formatCurrency(metaComercial)}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+{progressoMeta > 100 ? '100' : progressoMeta.toFixed(1)}%</span>
              <span>Meta mensal</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : formatCurrency(stats.ticketMedio)}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-500">
                {stats.vendasFechadas > 0 ? `+${((stats.ticketMedio / (stats.valorTotal / stats.vendasFechadas || 1) - 1) * 100).toFixed(1)}%` : '+0%'}
              </span>
              <span>por venda</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : `${stats.taxaConversao.toFixed(1)}%`}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-500">
                {stats.taxaConversao > 0 ? `+${stats.taxaConversao.toFixed(1)}%` : '0%'}
              </span>
              <span>{stats.clientesAtivos} clientes ativos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Funnel Charts */}
      <SalesFunnelChart />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>
              Melhores vendedores do período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                ))
              ) : topPerformers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum dado de performance disponível
                </p>
              ) : (
                topPerformers.slice(0, 5).map((performer, index) => (
                  <div key={performer.name} className="flex items-start space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-semibold text-sm">
                      {index === 0 ? "🏆" : "⭐"}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {performer.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {index === 0 ? "Closer líder em vendas" : "Top performer"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(performer.value)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {((performer.value / stats.valorTotal) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {performer.sales} vendas
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>Progresso da Meta</CardTitle>
            <CardDescription>
              Acompanhamento mensal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Meta Comercial</p>
                  <Badge variant="secondary">{progressoMeta.toFixed(1)}%</Badge>  
                </div>
                <Progress value={progressoMeta} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(stats.valorTotal)} / {formatCurrency(metaComercial)}</span>
                  <span>Restam {formatCurrency(metaComercial - stats.valorTotal)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Vendas vs Clientes</p>
                  <Badge variant="default">
                    {stats.taxaConversao > 20 ? 'Excelente' : stats.taxaConversao > 10 ? 'Bom' : 'Regular'}
                  </Badge>  
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="text-lg font-semibold text-green-600">
                      {loading ? "..." : stats.vendasFechadas}
                    </div>
                    <div className="text-xs text-muted-foreground">Vendas</div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="text-lg font-semibold text-green-600">
                      {loading ? "..." : stats.totalVendas}
                    </div>
                    <div className="text-xs text-muted-foreground">Clientes</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Sistema</CardTitle>
            <CardDescription>
              Informações do banco de dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {loading ? "Carregando..." : "Dados atualizados"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalVendas} clientes no sistema
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Última atualização: agora
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Vendas Fechadas
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stats.vendasFechadas} vendas confirmadas
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Taxa de conversão: {stats.taxaConversao.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Pipeline Ativo
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stats.clientesAtivos} oportunidades em andamento
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ticket médio: {formatCurrency(stats.ticketMedio)}
                  </p>
                </div>
              </div>

              {!isSupabaseConfigured() && (
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 rounded-full bg-red-500 mt-2" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none text-destructive">
                      Banco não configurado
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Configure as variáveis do Supabase
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Verificar .env.local
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
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
