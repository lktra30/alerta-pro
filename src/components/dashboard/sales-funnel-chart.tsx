"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, Target, CheckCircle2, Calendar, XCircle } from "lucide-react"
import { getFunnelData, isSupabaseConfigured } from "@/lib/supabase"

interface FunnelStage {
  stage: string
  value: number
  percentage: number
  color: string
}

interface SalesFunnelChartProps {
  startDate?: string
  endDate?: string
}

const stageIcons = {
  "Leads": Users,
  "Agendados": Calendar,
  "Reuniões Feitas": CheckCircle2,
  "Vendas Realizadas": TrendingUp,
  "Reuniões sem Fechamento": XCircle,
}

export function SalesFunnelChart({ startDate, endDate }: SalesFunnelChartProps) {
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFunnelData()
  }, [startDate, endDate])

  const loadFunnelData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (!isSupabaseConfigured()) {
        setError('Banco de dados não configurado')
        return
      }

      const data = await getFunnelData(startDate, endDate)
      setFunnelData(data)
    } catch (error) {
      console.error('Error loading funnel data:', error)
      setError('Erro ao carregar dados do funil')
    } finally {
      setLoading(false)
    }
  }

  return (
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
                      <StageIcon className={`h-4 w-4 ${stage.stage === 'Reuniões sem Fechamento' ? 'text-red-600' : 'text-green-600'}`} />
                      <span className="text-sm font-medium">{stage.stage}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{stage.value}</span>
                  </div>
                  
                  <div 
                    className="h-12 bg-gradient-to-r from-green-200 to-green-300 relative overflow-hidden"
                    style={{ 
                      width: `${width}%`,
                      backgroundColor: stage.color,
                      backgroundImage: `linear-gradient(90deg, ${stage.color}dd, ${stage.color})`
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-medium text-white drop-shadow-sm">
                        {stage.value}
                      </span>
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
  )
}
