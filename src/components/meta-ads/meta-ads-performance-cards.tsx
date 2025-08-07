"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetaAdsMetrics } from "@/types/meta-ads"
import { 
  DollarSign, 
  Target, 
  Users, 
  MousePointer, 
  UserCheck, 
  CheckCircle, 
  Calendar,
  Trophy,
  TrendingUp
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface MetaAdsPerformanceCardsProps {
  metrics: MetaAdsMetrics
  isLoading: boolean
}

export function MetaAdsPerformanceCards({ metrics, isLoading }: MetaAdsPerformanceCardsProps) {
  const metaAdsCards = [
    {
      title: "Total Investido",
      value: `R$ ${metrics.totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: "em Meta Ads",
      icon: DollarSign,
      iconColor: "text-green-500"
    },
    {
      title: "Investimento por Lead",
      value: `R$ ${metrics.investimentoPorLead.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: "custo médio",
      icon: TrendingUp,
      iconColor: "text-blue-500"
    },
    {
      title: "Alcance",
      value: metrics.alcance.toLocaleString('pt-BR'),
      subtitle: "pessoas alcançadas",
      icon: Users,
      iconColor: "text-purple-500"
    },
    {
      title: "CPC Médio",
      value: `R$ ${metrics.cpcMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: "custo por clique",
      icon: MousePointer,
      iconColor: "text-orange-500"
    }
  ]

  const renderCards = (cards: any[]) => (
    <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
      {cards.map((card, index) => {
        const IconComponent = card.icon
        return (
          <Card key={index} className="h-32">
            <CardContent className="flex items-center justify-center h-full p-6">
              <div className="flex items-center space-x-4 w-full">
                <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0`}>
                  <IconComponent className={`h-7 w-7 ${card.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold truncate">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  if (isLoading) {
    return (
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Performance Meta Ads</h4>
        <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-32">
              <CardContent className="flex items-center justify-center h-full p-6">
                <div className="flex items-center space-x-4 w-full">
                  <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground mb-3">Performance Meta Ads</h4>
      {renderCards(metaAdsCards)}
    </div>
  )
}
