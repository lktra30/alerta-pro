"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getLeadsEvolutionData, isSupabaseConfigured } from "@/lib/supabase"

interface LeadsEvolutionData {
  month: string
  leadsTotal: number
  reunioesAgendadas: number
  reunioesRealizadas: number
  vendas: number
}

export function LeadsEvolutionChart() {
  const [leadsEvolutionData, setLeadsEvolutionData] = useState<LeadsEvolutionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLeadsEvolutionData()
  }, [])

  const loadLeadsEvolutionData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (!isSupabaseConfigured()) {
        setError('Banco de dados não configurado')
        return
      }

      const data = await getLeadsEvolutionData()
      setLeadsEvolutionData(data)
    } catch (error) {
      console.error('Error loading leads evolution data:', error)
      setError('Erro ao carregar evolução de leads')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Evolução de Leads e Vendas por Mês</CardTitle>
        <CardDescription>
          Acompanhamento do pipeline de vendas ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            <p className="text-sm">{error}</p>
          </div>
        )}
        {loading && !error && (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            <p className="text-sm">Carregando evolução de leads...</p>
          </div>
        )}
        {!loading && !error && leadsEvolutionData.length === 0 && (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            <p className="text-sm">Nenhum dado de evolução disponível</p>
          </div>
        )}
        {!loading && !error && leadsEvolutionData.length > 0 && (
          <>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={leadsEvolutionData}
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
                        return (
                          <div className="bg-background border border-border rounded-md p-3 shadow-md">
                            <p className="font-medium mb-2">{label}</p>
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="text-green-600">🟢 Leads Totais:</span> {data.leadsTotal}
                              </p>
                              <p className="text-sm">
                                <span className="text-green-400">🟡 Reuniões Agendadas:</span> {data.reunioesAgendadas}
                              </p>
                              <p className="text-sm">
                                <span className="text-blue-500">🔵 Reuniões Realizadas:</span> {data.reunioesRealizadas}
                              </p>
                              <p className="text-sm">
                                <span className="text-pink-500">🔴 Vendas:</span> {data.vendas}
                              </p>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="leadsTotal" 
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                    name="Leads Totais"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="reunioesAgendadas" 
                    stroke="#06d6a0"
                    strokeWidth={2}
                    dot={{ fill: '#06d6a0', strokeWidth: 2, r: 3 }}
                    name="Reuniões Agendadas"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="reunioesRealizadas" 
                    stroke="#118ab2"
                    strokeWidth={2}
                    dot={{ fill: '#118ab2', strokeWidth: 2, r: 3 }}
                    name="Reuniões Realizadas"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="#ef476f"
                    strokeWidth={2}
                    dot={{ fill: '#ef476f', strokeWidth: 2, r: 3 }}
                    name="Vendas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Current Month Summary */}
            {leadsEvolutionData.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">
                  Resumo - {leadsEvolutionData[leadsEvolutionData.length - 1]?.month}:
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">
                      <strong>Leads Totais:</strong> {leadsEvolutionData[leadsEvolutionData.length - 1]?.leadsTotal || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
                    <span className="text-sm">
                      <strong>Reuniões Agendadas:</strong> {leadsEvolutionData[leadsEvolutionData.length - 1]?.reunioesAgendadas || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">
                      <strong>Reuniões Realizadas:</strong> {leadsEvolutionData[leadsEvolutionData.length - 1]?.reunioesRealizadas || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                    <span className="text-sm">
                      <strong>Vendas:</strong> {leadsEvolutionData[leadsEvolutionData.length - 1]?.vendas || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
