"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, Target, CheckCircle2, Calendar } from "lucide-react"
import { getFunnelData, isSupabaseConfigured } from "@/lib/supabase"

interface FunnelStage {
  stage: string
  value: number
  percentage: number
  color: string
}

const stageIcons = {
  "Leads": Users,
  "Leads Qualificados": Target,
  "Agendados": Calendar,
  "Reuniões Feitas": CheckCircle2,
  "Vendas Realizadas": TrendingUp
}

export function SalesFunnelChart() {
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFunnelData()
  }, [])

  const loadFunnelData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (!isSupabaseConfigured()) {
        setError('Banco de dados não configurado')
        return
      }

      const data = await getFunnelData()
      setFunnelData(data)
    } catch (error) {
      console.error('Error loading funnel data:', error)
      setError('Erro ao carregar dados do funil')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Sales Funnel (All) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-500">Funil de Vendas (Todos)</CardTitle>
          <CardDescription>Pipeline de vendas completo</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <p className="text-sm">{error}</p>
            </div>
          )}
          {loading && !error && (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <p className="text-sm">Carregando dados do funil...</p>
            </div>
          )}
          {!loading && !error && (
            <div className="space-y-4">
              {funnelData.map((stage, index) => {
                const width = Math.max(stage.percentage, 10) // Minimum width for visibility
                const StageIcon = stageIcons[stage.stage as keyof typeof stageIcons] || Users
                
                return (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StageIcon className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">{stage.stage}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stage.value.toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Funnel Shape */}
                    <div className="relative">
                      <div 
                        className="h-12 bg-gradient-to-r from-green-500 to-green-600 relative overflow-hidden"
                        style={{ 
                          width: `${width}%`,
                          clipPath: index === 0 ? 'none' : `polygon(0 0, ${100 - index * 2}% 0, ${98 - index * 2}% 100%, 2% 100%)`
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {stage.value.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-1 text-xs text-muted-foreground">
                      {stage.percentage.toFixed(1)}% do total
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Qualified Leads Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Funil de Vendas (Qualificados)</CardTitle>
          <CardDescription>Leads qualificados no pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <p className="text-sm">{error}</p>
            </div>
          )}
          {loading && !error && (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <p className="text-sm">Carregando dados qualificados...</p>
            </div>
          )}
          {!loading && !error && (
            <div className="space-y-4">
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Leads Qualificados</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {funnelData.find(stage => stage.stage === 'Reuniões Feitas')?.value || 0}
                  </span>
                </div>
                
                <div 
                  className="h-12 bg-gradient-to-r from-green-200 to-green-300 relative overflow-hidden border-2 border-dashed border-green-300"
                  style={{ width: '100%' }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-green-700 font-semibold text-sm">
                      {funnelData.find(stage => stage.stage === 'Reuniões Feitas')?.value || 0} reuniões realizadas
                    </span>
                  </div>
                </div>
                
                <div className="mt-1 text-xs text-muted-foreground">
                  {((funnelData.find(stage => stage.stage === 'Vendas Realizadas')?.value || 0) / 
                    Math.max(funnelData.find(stage => stage.stage === 'Reuniões Feitas')?.value || 1, 1) * 100).toFixed(1)}% de conversão
                </div>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-muted-foreground">
                  Pipeline qualificado baseado nos dados do CRM
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
