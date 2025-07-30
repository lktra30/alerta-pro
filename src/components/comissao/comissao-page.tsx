"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Settings, DollarSign, TrendingUp, Users } from "lucide-react"
import { getComissaoStats, getComissaoConfig, calculateRank, getComissaoPercentual, getRankInfo, ComissaoConfig } from "@/lib/supabase"
import { Colaborador } from "@/types/database"
import { ConfiguracaoComissao } from "./configuracao-comissao"

interface ColaboradorComissao extends Colaborador {
  totalVendas: number
  valorTotal: number
  comissaoTotal: number
  vendasCount: number
  percentualMeta: number
  rank: 1 | 2 | 3
  comissaoPercentual: number
}

export function ComissaoPage() {
  const [colaboradoresComissao, setColaboradoresComissao] = useState<ColaboradorComissao[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfig, setShowConfig] = useState(false)
  const [comissaoConfig, setComissaoConfigState] = useState<ComissaoConfig>({
    sdr: { rank1: 3, rank2: 5, rank3: 7 },
    closer: { rank1: 6, rank2: 10, rank3: 15 }
  })

  useEffect(() => {
    loadComissaoData()
    setComissaoConfigState(getComissaoConfig())
  }, [])

  const loadComissaoData = async () => {
    setLoading(true)
    try {
      const { colaboradores, vendas } = await getComissaoStats()
      const config = getComissaoConfig()
      
      const colaboradoresWithComissao = colaboradores.map(colaborador => {
        // Filtrar vendas do colaborador (SDR ou Closer)
        const vendasColaborador = vendas.filter(venda => 
          (colaborador.funcao.toLowerCase() === 'sdr' && venda.sdr_id === colaborador.id) ||
          (colaborador.funcao.toLowerCase() === 'closer' && venda.closer_id === colaborador.id)
        )

        const valorTotal = vendasColaborador.reduce((sum, venda) => sum + (venda.valor_venda || 0), 0)
        
        // Para o percentual da meta, vamos usar um exemplo baseado no valor total
        // Em um cenário real, isso viria da tabela metas
        const metaExemplo = colaborador.funcao.toLowerCase() === 'sdr' ? 50000 : 100000
        const percentualMeta = Math.min((valorTotal / metaExemplo) * 100, 100)
        
        // Calcular rank baseado no percentual da meta
        const rank = calculateRank(percentualMeta)
        
        // Obter percentual de comissão baseado no rank
        const comissaoPercentual = getComissaoPercentual(colaborador.funcao, rank, config)
        
        const comissaoTotal = (valorTotal * comissaoPercentual) / 100

        return {
          ...colaborador,
          totalVendas: valorTotal,
          valorTotal,
          comissaoTotal,
          vendasCount: vendasColaborador.length,
          percentualMeta,
          rank,
          comissaoPercentual
        }
      })

      setColaboradoresComissao(colaboradoresWithComissao)
    } catch (error) {
      console.error('Error loading comissao data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500"
    if (percentage >= 80) return "bg-green-400"
    if (percentage >= 60) return "bg-yellow-500"
    return "bg-green-300"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Comissões</h1>
            <p className="text-muted-foreground">Acompanhe o desempenho e comissões dos seus colaboradores</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                <div className="h-8 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const totalComissoes = colaboradoresComissao.reduce((sum, col) => sum + col.comissaoTotal, 0)
  const totalVendas = colaboradoresComissao.reduce((sum, col) => sum + col.valorTotal, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-green-500" />
            Comissões
          </h1>
          <p className="text-muted-foreground">Acompanhe o desempenho e comissões dos seus colaboradores</p>
        </div>
        <Button onClick={() => setShowConfig(true)} variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurar
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(totalComissoes)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Vendas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalVendas)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboradores Ativos</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{colaboradoresComissao.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Seção Closers */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-green-500" />
          Closers
        </h2>
        <div className="space-y-4">
          {colaboradoresComissao
            .filter(col => col.funcao.toLowerCase() === 'closer')
            .map(colaborador => (
              <Card key={colaborador.id} className="bg-card/50 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{colaborador.nome}</h3>
                      <p className="text-sm text-muted-foreground">{colaborador.vendasCount} vendas</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className={`${getRankInfo(colaborador.rank).color}/10 text-${getRankInfo(colaborador.rank).color.replace('bg-', '')} border-${getRankInfo(colaborador.rank).color.replace('bg-', '')}/20`}>
                        {getRankInfo(colaborador.rank).name}
                      </Badge>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                        Closer - {colaborador.comissaoPercentual}%
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Vendido</p>
                      <p className="text-lg font-semibold">{formatCurrency(colaborador.valorTotal)}</p>
                      <p className="text-xs text-muted-foreground">{colaborador.percentualMeta.toFixed(1)}% da meta</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Comissão Atual</p>
                      <p className="text-lg font-semibold text-green-500">{formatCurrency(colaborador.comissaoTotal)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Próximo Rank</p>
                      <p className="text-lg font-semibold">
                        {colaborador.rank === 3 ? 'Rank Máximo' : `Rank ${colaborador.rank + 1}`}
                      </p>
                      <p className="text-xs text-green-500">
                        {colaborador.rank === 3 ? 'Parabéns!' : `${colaborador.rank === 1 ? '26%' : '61%'} da meta para próximo rank`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso da Meta</span>
                      <span>{colaborador.percentualMeta.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={colaborador.percentualMeta} 
                      className="h-2"
                    />
                    <style jsx>{`
                      .progress-indicator {
                        ${getProgressColor(colaborador.percentualMeta)}
                      }
                    `}</style>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Seção SDRs */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-green-500" />
          SDRs
        </h2>
        <div className="space-y-4">
          {colaboradoresComissao
            .filter(col => col.funcao.toLowerCase() === 'sdr')
            .map(colaborador => (
              <Card key={colaborador.id} className="bg-card/50 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{colaborador.nome}</h3>
                      <p className="text-sm text-muted-foreground">{colaborador.vendasCount} vendas</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className={`${getRankInfo(colaborador.rank).color}/10 text-${getRankInfo(colaborador.rank).color.replace('bg-', '')} border-${getRankInfo(colaborador.rank).color.replace('bg-', '')}/20`}>
                        {getRankInfo(colaborador.rank).name}
                      </Badge>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                        SDR - {colaborador.comissaoPercentual}%
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Vendido</p>
                      <p className="text-lg font-semibold">{formatCurrency(colaborador.valorTotal)}</p>
                      <p className="text-xs text-muted-foreground">{colaborador.percentualMeta.toFixed(1)}% da meta</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Comissão Atual</p>
                      <p className="text-lg font-semibold text-green-500">{formatCurrency(colaborador.comissaoTotal)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Próximo Rank</p>
                      <p className="text-lg font-semibold">
                        {colaborador.rank === 3 ? 'Rank Máximo' : `Rank ${colaborador.rank + 1}`}
                      </p>
                      <p className="text-xs text-green-500">
                        {colaborador.rank === 3 ? 'Parabéns!' : `${colaborador.rank === 1 ? '26%' : '61%'} da meta para próximo rank`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso da Meta</span>
                      <span>{colaborador.percentualMeta.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={colaborador.percentualMeta} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Modal de Configuração */}
      <ConfiguracaoComissao
        open={showConfig}
        onOpenChange={setShowConfig}
        currentConfig={comissaoConfig}
        onConfigSaved={(newConfig) => {
          setComissaoConfigState(newConfig)
          loadComissaoData()
        }}
      />
    </div>
  )
}
