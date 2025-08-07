"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthlyInvestment } from "@/types/meta-ads"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { MetaAdsService } from "@/lib/meta-ads"

interface MonthlyInvestmentChartProps {
  isLoading?: boolean
}

export function MonthlyInvestmentChart({ isLoading }: MonthlyInvestmentChartProps) {
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
          
          const monthlyChartData = monthlyInsights.data
            .map((insight) => {
              // Usar date_start real da API ao invés de calcular por índice
              const dateString = insight.date_start || insight.date_stop || '2023-01-01'
              const date = new Date(dateString)
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
              
              return {
                date: monthKey + '-01',
                investido: parseFloat(insight.spend || "0"),
                originalData: insight // Manter dados originais para debug
              }
            })
            .filter(item => item.investido > 0) // Remover meses com investimento zero
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          
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

      // Converter para array e ordenar
      const monthlyChartData = Array.from(monthlyMap.entries())
        .map(([monthKey, totalSpend]) => ({
          date: monthKey + '-01',
          investido: totalSpend,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .filter(item => item.investido > 0) // Remover meses com investimento zero
      
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
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Investimento Mensal em Meta Ads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
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
        day: '2-digit',
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
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-green-500">
          Investimento Mensal em Meta Ads
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                className="text-muted-foreground text-xs"
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                className="text-muted-foreground text-xs"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="investido" 
                stroke="#22c55e" 
                strokeWidth={3}
                dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#22c55e" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
