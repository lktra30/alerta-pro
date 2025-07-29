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
  Trophy
} from "lucide-react"

interface MetaAdsPerformanceCardsProps {
  metrics: MetaAdsMetrics
  isLoading?: boolean
}

export function MetaAdsPerformanceCards({ metrics, isLoading }: MetaAdsPerformanceCardsProps) {
  const cards = [
    {
      title: "Total Investido",
      value: `R$ ${metrics.totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: "em anúncios",
      icon: DollarSign,
      iconColor: "text-green-500"
    },
    {
      title: "Investimento por Lead",
      value: `R$ ${metrics.investimentoPorLead.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: "por lead",
      icon: Target,
      iconColor: "text-green-600"
    },
    {
      title: "Alcance",
      value: metrics.alcance.toLocaleString('pt-BR'),
      subtitle: "pessoas únicas",
      icon: Users,
      iconColor: "text-green-400"
    },
    {
      title: "CPC Médio",
      value: `R$ ${metrics.cpcMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${(metrics.alcance * 0.05).toFixed(0)} cliques`,
      icon: MousePointer,
      iconColor: "text-green-600"
    },
    {
      title: "Leads do Mês",
      value: metrics.leadsDoMes.toString(),
      subtitle: "total de leads",
      icon: UserCheck,
      iconColor: "text-green-500"
    },
    {
      title: "Leads Qualificados",
      value: metrics.leadsQualificados.toString(),
      subtitle: "no mês",
      icon: CheckCircle,
      iconColor: "text-green-600"
    },
    {
      title: "Reuniões Marcadas",
      value: metrics.reunioesMarcadas.toString(),
      subtitle: "no mês",
      icon: Calendar,
      iconColor: "text-green-500"
    },
    {
      title: "Novos Clientes",
      value: metrics.novosClientes.toString(),
      subtitle: "do mês",
      icon: Trophy,
      iconColor: "text-green-600"
    }
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-20 mb-1"></div>
              <div className="h-3 bg-muted rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {card.subtitle}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
