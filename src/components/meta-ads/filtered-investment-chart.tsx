"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts"
import { MetaAdsService } from "@/lib/meta-ads"

interface FilteredInvestmentChartProps {
  startDate: string
  endDate: string
  isLoading?: boolean
}

interface DayData {
  date: string // Data ISO para tooltip
  investido: number
  formatted: string // Data formatada para exibição
  fullDate: Date // Data completa para tooltip
}

export function FilteredInvestmentChart({ startDate, endDate, isLoading }: FilteredInvestmentChartProps) {
  const [data, setData] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const metaAdsService = new MetaAdsService()

  useEffect(() => {
    if (startDate && endDate) {
      fetchFilteredData()
    }
  }, [startDate, endDate])

  const fetchFilteredData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching filtered data from:', startDate, 'to:', endDate)

      const dailyInsights = await metaAdsService.getDailyInsights(startDate, endDate)
      
      if (!dailyInsights.data || dailyInsights.data.length === 0) {
        console.log('No data received from API')
        setData([])
        return
      }

      // Calcular todos os dias do período
      const start = new Date(startDate)
      const end = new Date(endDate)
      const chartData: DayData[] = []
      
      // Calcular o número exato de dias no período
      const timeDiff = end.getTime() - start.getTime()
      const dayCount = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1
      
      console.log(`Start: ${startDate}, End: ${endDate}`)
      console.log(`TimeDiff: ${timeDiff}, DayCount calculated: ${dayCount}`)
      
      console.log(`Expected ${dayCount} days from ${startDate} to ${endDate}`)
      console.log(`API returned ${dailyInsights.data.length} data points`)
      
      // Gerar dados para cada dia do período
      for (let dayIndex = 0; dayIndex < dayCount; dayIndex++) {
        const currentDate = new Date(start)
        currentDate.setDate(start.getDate() + dayIndex)
        
        const dateString = currentDate.toISOString().split('T')[0]
        
        // Pegar dados da API se disponível, senão usar 0
        let spend = 0
        if (dayIndex < dailyInsights.data.length && dailyInsights.data[dayIndex]) {
          spend = parseFloat(dailyInsights.data[dayIndex].spend || "0")
        }
        
        chartData.push({
          date: dateString,
          investido: spend,
          formatted: currentDate.toLocaleDateString('pt-BR', { 
            day: '2-digit',
            month: 'short'
          }),
          fullDate: new Date(currentDate.getTime()) // Garantir uma cópia exata da data
        })
      }

      console.log(`Filtered chart data: ${chartData.length} days processed`)
      console.log('First few days:', chartData.slice(0, 3))
      console.log('Last few days:', chartData.slice(-3))
      
      // Debug de datas para identificar problema do ano 2025
      chartData.forEach((item, index) => {
        if (index < 3 || index >= chartData.length - 3) {
          console.log(`Day ${index}: ${item.date} -> fullDate: ${item.fullDate.toISOString()} -> formatted: ${item.formatted}`)
        }
      })
      setData(chartData)
    } catch (err) {
      console.error("Error fetching filtered Meta Ads data:", err)
      setError("Erro ao carregar dados do período")
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || loading) {
    return (
      <Card className="col-span-full overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Investimento no Período Selecionado</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="h-64 sm:h-80 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              Carregando dados do período...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="col-span-full overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Investimento no Período Selecionado</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="h-64 sm:h-80 flex items-center justify-center">
            <div className="text-muted-foreground">
              {error}
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

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ value: number; payload: DayData }>
    label?: string
  }) => {
    if (active && payload && payload.length && payload[0].payload) {
      const dataPoint = payload[0].payload
      const formattedDate = dataPoint.fullDate.toLocaleDateString('pt-BR', {
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
            Investido: <span className="font-semibold text-foreground">{formatCurrency(dataPoint.investido)}</span>
          </p>
        </div>
      )
    }
    return null
  }

  // Decidir entre gráfico de linha ou barras baseado na quantidade de dias
  const dayCount = data.length
  const useBarChart = dayCount <= 31 // Barras para períodos de até 1 mês

  return (
    <Card className="col-span-full overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base sm:text-xl font-semibold text-green-500">
          Investimento no Período Selecionado
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {data.length > 0 ? `${data.length} dias com dados` : 'Nenhum dado disponível'}
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {useBarChart ? (
              <BarChart data={data} margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="formatted"
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
                <Bar 
                  dataKey="investido" 
                  fill="#22c55e" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart data={data} margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="formatted"
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
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 