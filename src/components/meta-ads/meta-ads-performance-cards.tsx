"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MetaAdsMetrics } from "@/types/meta-ads"
import { 
  DollarSign, 
  Users, 
  MousePointer, 
  TrendingUp
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface MetaAdsPerformanceCardsProps {
  metrics: MetaAdsMetrics
  isLoading: boolean
  layout?: 'grid' | 'row' | 'vertical' // Nova prop para controlar o layout
  cardSize?: 'normal' | 'large' // Nova prop para controlar o tamanho dos cards
}

export function MetaAdsPerformanceCards({ metrics, isLoading, layout = 'grid' }: MetaAdsPerformanceCardsProps) {
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

  // Função para obter as classes de grid baseadas no layout
  const getGridClasses = () => {
    if (layout === 'row') {
      return "flex gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-4 lg:gap-6 lg:pb-0"
    }
    if (layout === 'vertical') {
      return "flex flex-col gap-3 w-full h-full"
    }
    // Para layout grid, usar scroll horizontal em mobile
    return "flex gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-2 lg:gap-8 lg:pb-0 lg:max-w-6xl lg:mx-auto"
  }

  // Container wrapper para centralizar no layout grid
  const getContainerClasses = () => {
    if (layout === 'vertical') {
      return "w-full h-full"
    }
    if (layout === 'grid') {
      return "w-full"
    }
    return "w-full"
  }

  // Função para obter a altura dos cards
  const getCardHeight = () => {
    if (layout === 'vertical') {
      return "h-[147px] w-full min-w-0" // Responsivo para vertical
    }
    if (layout === 'row') {
      return "h-32 w-72 lg:w-auto flex-shrink-0" // Largura fixa em mobile para scroll
    }
    return "h-32 w-80 lg:w-auto flex-shrink-0" // Largura fixa em mobile para scroll
  }

  const renderCards = (cards: any[]) => (
    <div className={getContainerClasses()}>
      <div className={getGridClasses()}>
        {cards.map((card, index) => {
          const IconComponent = card.icon
          return (
            <Card key={index} className={`${getCardHeight()} overflow-hidden`}>
              <CardContent className="flex items-center justify-center h-full p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4 w-full min-w-0">
                  <div className={`p-2 sm:p-3 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0`}>
                    <IconComponent className={`h-6 w-6 sm:h-8 sm:w-8 ${card.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg sm:text-xl font-bold truncate">{card.value}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{card.subtitle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="w-full">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Performance Meta Ads</h4>
        <div className={getContainerClasses()}>
          <div className={getGridClasses()}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className={`${getCardHeight()} overflow-hidden`}>
                <CardContent className="flex items-center justify-center h-full p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4 w-full min-w-0">
                    <Skeleton className="h-10 w-10 sm:h-14 sm:w-14 rounded-lg flex-shrink-0" />
                    <div className="space-y-2 flex-1 min-w-0">
                      <Skeleton className="h-5 sm:h-6 w-24 sm:w-28" />
                      <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <h4 className="text-sm font-medium text-muted-foreground mb-3">Performance Meta Ads</h4>
      {renderCards(metaAdsCards)}
    </div>
  )
}
