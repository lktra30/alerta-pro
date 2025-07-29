"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getMonthlySalesData, getMonthlySalesSummary, isSupabaseConfigured } from "@/lib/supabase"

interface MonthlySalesData {
  month: string
  sales: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatCurrencyShort = (value: number) => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`
  }
  return formatCurrency(value)
}

export function MonthlySalesChart() {
  const [monthlySalesData, setMonthlySalesData] = useState<MonthlySalesData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summaryStats, setSummaryStats] = useState({
    currentMonthSales: 0,
    totalSales: 0,
    averageTicket: 0
  })

  useEffect(() => {
    loadMonthlySalesData()
  }, [])

  const loadMonthlySalesData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (!isSupabaseConfigured()) {
        setError('Banco de dados não configurado')
        // Set empty fallback data
        setMonthlySalesData([])
        setSummaryStats({
          currentMonthSales: 0,
          totalSales: 0,
          averageTicket: 0
        })
        return
      }

      // Fetch both chart data and summary statistics
      const [chartData, summaryData] = await Promise.all([
        getMonthlySalesData(),
        getMonthlySalesSummary()
      ])
      
      setMonthlySalesData(chartData)
      setSummaryStats({
        currentMonthSales: summaryData.currentMonthSales,
        totalSales: summaryData.currentMonthCount,
        averageTicket: summaryData.averageTicket
      })
      
    } catch (error) {
      console.error('Error loading monthly sales data:', error)
      setError('Erro ao carregar dados de vendas mensais')
      // Set empty fallback data
      setMonthlySalesData([])
      setSummaryStats({
        currentMonthSales: 0,
        totalSales: 0,
        averageTicket: 0
      })
    } finally {
      setLoading(false)
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas Mensais</CardTitle>
        <CardDescription>
          Evolução das vendas nos últimos meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p className="text-sm">{error}</p>
          </div>
        )}
        {loading && !error && (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p className="text-sm">Carregando dados de vendas...</p>
          </div>
        )}
        {!loading && !error && monthlySalesData.length === 0 && (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p className="text-sm">Nenhum dado de vendas disponível</p>
          </div>
        )}
        {!loading && !error && monthlySalesData.length > 0 && (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlySalesData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatCurrencyShort}
                />
                <Tooltip 
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Vendas']}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--chart-1))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Summary Stats */}
        {!error && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {loading ? "..." : formatCurrency(summaryStats.currentMonthSales)}
              </p>
              <p className="text-xs text-muted-foreground">
                Vendas em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {loading ? "..." : summaryStats.totalSales}
              </p>
              <p className="text-xs text-muted-foreground">Vendas no Período</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {loading ? "..." : formatCurrency(summaryStats.averageTicket)}
              </p>
              <p className="text-xs text-muted-foreground">Ticket Médio</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
