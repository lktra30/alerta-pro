"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getMonthlySalesData, getMonthlySalesSummary, isSupabaseConfigured, getAllClientes } from "@/lib/supabase"

interface MonthlySalesData {
  month: string
  sales: number
  mrr: number
  clientCount: number
}

// Função para calcular MRR baseado no tipo de plano
const calculateMRRFromVenda = (valorVenda: number, tipoPlano: string): number => {
  switch (tipoPlano) {
    case 'mensal':
      return valorVenda
    case 'trimestral':
      return valorVenda / 3
    case 'semestral':
      return valorVenda / 6
    case 'anual':
      return valorVenda / 12
    default:
      return valorVenda // Default para mensal
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
    currentMonthMRR: 0,
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
          currentMonthMRR: 0,
          totalSales: 0,
          averageTicket: 0
        })
        return
      }

      // Fetch chart data, summary statistics and clientes
      const [chartData, summaryData, clientes] = await Promise.all([
        getMonthlySalesData(),
        getMonthlySalesSummary(),
        getAllClientes()
      ])
      
      // Calcular MRR real por mês baseado nos clientes
      const chartDataWithRealMRR = chartData.map((item: any) => {
        // Buscar clientes vendidos neste mês
        const clientesDoMes = clientes.filter((cliente: any) => {
          if (!cliente.criado_em || cliente.etapa !== 'Vendas Realizadas' || !cliente.valor_venda) return false
          
          const clienteDate = new Date(cliente.criado_em)
          // Parse "agosto de 25" format to proper date
          const parseMonth = (monthStr: string) => {
            const [monthName, year] = monthStr.split(' de ')
            const monthNames = [
              'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
              'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
            ]
            const monthIndex = monthNames.indexOf(monthName.toLowerCase())
            return new Date(2000 + parseInt(year), monthIndex)
          }
          
          const itemDate = parseMonth(item.month)
          
          return clienteDate.getFullYear() === itemDate.getFullYear() && 
                 clienteDate.getMonth() === itemDate.getMonth()
        })
        
        // Calcular MRR real baseado nos tipos de plano
        let mrrReal = 0
        clientesDoMes.forEach((cliente: any) => {
          const mrr = calculateMRRFromVenda(cliente.valor_venda, cliente.tipo_plano || 'mensal')
          mrrReal += mrr
        })
        
        return {
          ...item,
          mrr: mrrReal,
          clientCount: clientesDoMes.length
        }
      })
      
      // Calcular MRR atual do mês
      const currentDate = new Date()
      const clientesDoMesAtual = clientes.filter((cliente: any) => {
        if (!cliente.criado_em || cliente.etapa !== 'Vendas Realizadas' || !cliente.valor_venda) return false
        
        const clienteDate = new Date(cliente.criado_em)
        return clienteDate.getFullYear() === currentDate.getFullYear() && 
               clienteDate.getMonth() === currentDate.getMonth()
      })
      
      let currentMonthMRR = 0
      clientesDoMesAtual.forEach((cliente: any) => {
        const mrr = calculateMRRFromVenda(cliente.valor_venda, cliente.tipo_plano || 'mensal')
        currentMonthMRR += mrr
      })
      
      setMonthlySalesData(chartDataWithRealMRR)
      setSummaryStats({
        currentMonthSales: summaryData.currentMonthSales,
        currentMonthMRR: currentMonthMRR,
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
        currentMonthMRR: 0,
        totalSales: 0,
        averageTicket: 0
      })
    } finally {
      setLoading(false)
    }
  }
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Vendas Mensais</CardTitle>
        <CardDescription className="text-sm">
          Evolução das vendas nos últimos meses
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col min-h-[500px] p-4 sm:p-6">
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
          <>
            {/* Gráfico centralizado */}
            <div className="flex-1 flex items-center justify-center py-4">
              <div className="h-[250px] sm:h-[300px] w-full max-w-4xl">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlySalesData}
                  margin={{
                    top: 20,
                    right: 15,
                    left: 10,
                    bottom: 20
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 10 }}
                    tickFormatter={formatCurrencyShort}
                  />
                  <Tooltip 
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        const ticketMedio = data.clientCount > 0 ? data.sales / data.clientCount : 0
                        return (
                          <div className="bg-background border border-border rounded-md p-3 shadow-md max-w-xs">
                            <p className="font-medium mb-2 text-sm">{label}</p>
                            <div className="space-y-1">
                              <p className="text-xs">
                                <span className="text-green-600">📊 Quantidade:</span> {data.clientCount} venda{data.clientCount !== 1 ? 's' : ''}
                              </p>
                              <p className="text-xs">
                                <span className="text-green-600">📈 MRR:</span> {formatCurrency(data.mrr)}
                              </p>
                              <p className="text-xs">
                                <span className="text-green-600">💰 Faturamento:</span> {formatCurrency(data.sales)}
                              </p>
                              <p className="text-xs">
                                <span className="text-green-600">🎯 Ticket Médio:</span> {formatCurrency(ticketMedio)}
                              </p>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, stroke: 'hsl(var(--chart-1))', strokeWidth: 2 }}
                    name="Vendas"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mrr" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, stroke: '#22c55e', strokeWidth: 2 }}
                    name="MRR"
                  />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </div>
            
            {/* Summary Stats - Parte inferior */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t mt-auto">
              <div className="text-center min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                  {summaryStats.totalSales}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Vendas no Período</p>
              </div>
              <div className="text-center min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                  {formatCurrency(summaryStats.currentMonthMRR)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  MRR em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
                </p>
              </div>
              <div className="text-center min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                  {formatCurrency(summaryStats.currentMonthSales)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vendas em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
                </p>
              </div>
              <div className="text-center min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                  {formatCurrency(summaryStats.averageTicket)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Ticket Médio</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
