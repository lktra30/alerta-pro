"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthlyInvestment } from "@/types/meta-ads"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { MetaAdsService } from "@/lib/meta-ads"

interface MonthlyInvestmentChartProps {
  isLoading?: boolean
  allowCurrentMonthCheck?: boolean // Se true, faz verificação especial do mês atual
}

export function MonthlyInvestmentChart({ isLoading, allowCurrentMonthCheck = false }: MonthlyInvestmentChartProps) {
  const [data, setData] = useState<MonthlyInvestment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const metaAdsService = new MetaAdsService()

  useEffect(() => {
    fetchMonthlyData()
  }, [])

  const fetchMonthlyData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Calcular data de 36 meses atrás
      const currentDate = new Date()
      const thirtySevenMonthsAgo = new Date(currentDate)
      thirtySevenMonthsAgo.setMonth(thirtySevenMonthsAgo.getMonth() - 36)
      
      const since = thirtySevenMonthsAgo.toISOString().split('T')[0]
      const until = currentDate.toISOString().split('T')[0]

      console.log('Fetching monthly data from:', since, 'to:', until)

      // Tentar primeiro com dados mensais direto da API
      try {
        const monthlyInsights = await metaAdsService.getMonthlyInsights(since, until)
        
        if (monthlyInsights.data && monthlyInsights.data.length > 0) {
          console.log('Using monthly insights from API:', monthlyInsights.data.length, 'months')
          
          // Criar um Map para facilitar a verificação do mês atual
          const monthlyDataMap = new Map()
          
          // Processar dados da API e adicionar ao Map
          monthlyInsights.data.forEach((insight) => {
            const dateString = insight.date_start || insight.date_stop || '2023-01-01'
            const date = new Date(dateString)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            const spend = parseFloat(insight.spend || "0")
            
            monthlyDataMap.set(monthKey, (monthlyDataMap.get(monthKey) || 0) + spend)
          })
          
          // Lógica inteligente para mês atual - verificar dados específicos do mês
          const now = new Date()
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
          const dayOfMonth = now.getDate()
          
          // Se o mês atual tem valor 0 ou não existe E estamos nos primeiros 10 dias,
          // fazer consulta específica para este mês (APENAS se allowCurrentMonthCheck = true)
          const currentMonthValue = monthlyDataMap.get(currentMonth) || 0
          if (allowCurrentMonthCheck && currentMonthValue === 0 && dayOfMonth <= 10) {
            console.log(`Current month ${currentMonth} has 0 value, checking specific month data...`)
            
            try {
              // Consulta específica para o mês atual
              const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
              const currentMonthEnd = now.toISOString().split('T')[0]
              
              console.log(`Checking current month from ${currentMonthStart} to ${currentMonthEnd}`)
              
              const currentMonthInsights = await metaAdsService.getDailyInsights(currentMonthStart, currentMonthEnd)
              let currentMonthTotal = 0
              
              if (currentMonthInsights.data) {
                currentMonthTotal = currentMonthInsights.data.reduce((sum, insight) => {
                  return sum + parseFloat(insight.spend || "0")
                }, 0)
              }
              
              console.log(`Current month specific check: R$ ${currentMonthTotal}`)
              
              if (currentMonthTotal > 0) {
                monthlyDataMap.set(currentMonth, currentMonthTotal)
                console.log(`Updated current month ${currentMonth} with actual value: R$ ${currentMonthTotal}`)
              } else {
                console.log(`Current month ${currentMonth} confirmed as 0, not including`)
              }
            } catch (error) {
              console.log(`Error checking current month specifically:`, error)
              // Em caso de erro, não incluir o mês
            }
                      } else if (!monthlyDataMap.has(currentMonth) && allowCurrentMonthCheck) {
              monthlyDataMap.set(currentMonth, 0)
              console.log(`Added current month ${currentMonth} with 0 investment to API data`)
            }
          
          const monthlyChartData = Array.from(monthlyDataMap.entries())
            .map(([monthKey, totalSpend]) => ({
              date: monthKey + '-01',
              investido: totalSpend,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .filter(item => {
              // Lógica inteligente para filtrar meses
              const now = new Date()
              const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
              const itemMonth = item.date.substring(0, 7)
              const dayOfMonth = now.getDate()
              
              // Sempre manter meses com investimento > 0
              if (item.investido > 0) return true
              
              // Para o mês atual com investimento = 0:
              // - Se allowCurrentMonthCheck é false (dashboard), sempre incluir
              // - Se allowCurrentMonthCheck é true (Meta Ads), aplicar lógica de filtro
              if (itemMonth === currentMonth) {
                return !allowCurrentMonthCheck || dayOfMonth > 10
              }
              
              // Outros meses com investimento 0: não incluir
              return false
            })
          
          console.log('Final monthly data from API:', monthlyChartData)
          setData(monthlyChartData)
          return
        }
      } catch (monthlyError) {
        console.log('Monthly API failed, falling back to daily aggregation:', monthlyError)
      }

      // Fallback: buscar dados diários e agregar
      const dailyInsights = await metaAdsService.getDailyInsights(since, until)
      
      console.log('Daily insights received:', dailyInsights)
      
      if (!dailyInsights.data) {
        console.log('No data received from API')
        setData([])
        return
      }

      console.log('Total daily insights:', dailyInsights.data.length)

      // Criar um mapa para agrupar por mês
      const monthlyMap = new Map<string, number>()
      
      // Processar dados diários
      dailyInsights.data.forEach((insight, index) => {
        // Calcular a data baseada no índice (assumindo que são dados consecutivos)
        const currentInsightDate = new Date(since)
        currentInsightDate.setDate(currentInsightDate.getDate() + index)
        
        const monthKey = `${currentInsightDate.getFullYear()}-${String(currentInsightDate.getMonth() + 1).padStart(2, '0')}`
        const spend = parseFloat(insight.spend || "0")
        
        if (spend > 0) {
          console.log(`Day ${index}: ${currentInsightDate.toISOString().split('T')[0]} - R$ ${spend} -> Month: ${monthKey}`)
        }
        
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + spend)
      })

      console.log('Monthly aggregation:', Array.from(monthlyMap.entries()))

      // Lógica inteligente para mês atual (agregação diária) - verificar dados específicos
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const dayOfMonth = now.getDate()
      
      // Se o mês atual tem valor 0 E estamos nos primeiros 10 dias, fazer consulta específica (APENAS se allowCurrentMonthCheck = true)
      const currentMonthValue = monthlyMap.get(currentMonth) || 0
      if (allowCurrentMonthCheck && currentMonthValue === 0 && dayOfMonth <= 10) {
        console.log(`Current month ${currentMonth} has 0 value in daily aggregation, checking specific month data...`)
        
        try {
          // Consulta específica para o mês atual
          const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
          const currentMonthEnd = now.toISOString().split('T')[0]
          
          console.log(`Checking current month from ${currentMonthStart} to ${currentMonthEnd}`)
          
          const currentMonthInsights = await metaAdsService.getDailyInsights(currentMonthStart, currentMonthEnd)
          let currentMonthTotal = 0
          
          if (currentMonthInsights.data) {
            currentMonthTotal = currentMonthInsights.data.reduce((sum, insight) => {
              return sum + parseFloat(insight.spend || "0")
            }, 0)
          }
          
          console.log(`Current month specific check (daily aggregation): R$ ${currentMonthTotal}`)
          
          if (currentMonthTotal > 0) {
            monthlyMap.set(currentMonth, currentMonthTotal)
            console.log(`Updated current month ${currentMonth} with actual value: R$ ${currentMonthTotal}`)
          } else {
            console.log(`Current month ${currentMonth} confirmed as 0, not including`)
          }
        } catch (error) {
          console.log(`Error checking current month specifically (daily aggregation):`, error)
          // Em caso de erro, não incluir o mês
        }
              } else if (!monthlyMap.has(currentMonth) && allowCurrentMonthCheck) {
          monthlyMap.set(currentMonth, 0)
          console.log(`Added current month ${currentMonth} with 0 investment`)
        }

      // Converter para array e ordenar
      const monthlyChartData = Array.from(monthlyMap.entries())
        .map(([monthKey, totalSpend]) => ({
          date: monthKey + '-01',
          investido: totalSpend,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .filter(item => {
          // Lógica inteligente para filtrar meses (agregação diária)
          const now = new Date()
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
          const itemMonth = item.date.substring(0, 7)
          const dayOfMonth = now.getDate()
          
          // Sempre manter meses com investimento > 0
          if (item.investido > 0) return true
          
          // Para o mês atual com investimento = 0:
          // - Se allowCurrentMonthCheck é false (dashboard), sempre incluir
          // - Se allowCurrentMonthCheck é true (Meta Ads), aplicar lógica de filtro
          if (itemMonth === currentMonth) {
            return !allowCurrentMonthCheck || dayOfMonth > 10
          }
          
          // Outros meses com investimento 0: não incluir
          return false
        })
      
      console.log('Final monthly data from daily aggregation:', monthlyChartData)
      setData(monthlyChartData)
    } catch (err) {
      console.error("Error fetching monthly Meta Ads data:", err)
      setError("Erro ao carregar dados mensais")
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || loading) {
    return (
      <Card className="col-span-full overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Investimento Mensal em Meta Ads</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="h-64 sm:h-80 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              Carregando dados do gráfico...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', { 
      month: 'short',
      year: '2-digit'
    })
  }

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ value: number }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const date = new Date(label + 'T00:00:00')
      const formattedDate = date.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric'
      })

      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="text-sm font-medium text-foreground mb-1">
            {formattedDate}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Investido: <span className="font-semibold text-foreground">{formatCurrency(data.value)}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="col-span-full overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base sm:text-xl font-semibold text-green-500">
          Investimento Mensal em Meta Ads
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                className="text-muted-foreground text-xs"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                className="text-muted-foreground text-xs"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="investido" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: "#22c55e", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: "#22c55e" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
