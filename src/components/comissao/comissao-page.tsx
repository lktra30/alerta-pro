"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Settings, DollarSign, TrendingUp, Users, Target, Zap } from "lucide-react"
import { getNovoComissionamentoStats } from "@/lib/supabase"
import { 
  getNovaComissaoConfig, 
  calculateComissaoSDR, 
  calculateComissaoCloser,
  calculateMRR,
  getCheckpointInfo,
  type ComissaoSDRResult,
  type ComissaoCloserResult,
  type NovaComissaoConfig
} from "@/lib/novo-comissionamento"
import { Colaborador, TipoPlano } from "@/types/database"
import { NovaConfiguracaoComissao } from "./nova-configuracao-comissao"

interface ColaboradorComissao extends Colaborador {
  sdrStats?: ComissaoSDRResult
  closerStats?: ComissaoCloserResult
  planosMensais?: number
  planosTrimestrais?: number
  planosSemestrais?: number
  planosAnuais?: number
}

export function ComissaoPage() {
  const [colaboradoresComissao, setColaboradoresComissao] = useState<ColaboradorComissao[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfig, setShowConfig] = useState(false)
  const [comissaoConfig, setComissaoConfigState] = useState<NovaComissaoConfig>()

  useEffect(() => {
    loadComissaoData()
    setComissaoConfigState(getNovaComissaoConfig())
  }, [])

  const loadComissaoData = async () => {
    setLoading(true)
    try {
      const { colaboradores, reunioes, vendas, metas } = await getNovoComissionamentoStats()
      const config = getNovaComissaoConfig()
      
      // Pegar meta atual (janeiro 2024 como exemplo)
      const metaAtual = metas.find(m => m.ano === 2024 && m.mes === 1) || {
        valor_meta_mrr: 15000,
        meta_reunioes_sdr: 50
      }

      const colaboradoresWithComissao = colaboradores.map(colaborador => {
        if (colaborador.funcao.toLowerCase() === 'sdr') {
          // Calcular estatísticas do SDR
          const reunioesColaborador = reunioes.filter(r => r.sdr_id === colaborador.id)
          const reunioesQualificadas = reunioesColaborador.filter(r => r.tipo === 'qualificada').length
          const reunioesGeraramVenda = reunioesColaborador.filter(r => r.tipo === 'gerou_venda').length
          const totalReunioes = reunioesQualificadas + reunioesGeraramVenda
          
          // Contar planos das vendas geradas pelo SDR (através das reuniões)
          const reunioesComVenda = reunioesColaborador.filter(r => r.tipo === 'gerou_venda')
          const vendasDoSDR = vendas.filter(v => 
            reunioesComVenda.some(r => r.cliente_id === v.id)
          )
          const planosMensais = vendasDoSDR.filter(v => v.tipo_plano === 'mensal').length
          const planosTrimestrais = vendasDoSDR.filter(v => v.tipo_plano === 'trimestral').length
          const planosSemestrais = vendasDoSDR.filter(v => v.tipo_plano === 'semestral').length
          const planosAnuais = vendasDoSDR.filter(v => v.tipo_plano === 'anual').length
          
          const percentualMeta = metaAtual.meta_reunioes_sdr ? 
            (totalReunioes / metaAtual.meta_reunioes_sdr) * 100 : 0

          const sdrStats = calculateComissaoSDR(
            reunioesQualificadas,
            reunioesGeraramVenda,
            percentualMeta,
            config.sdr
          )

          return {
            ...colaborador,
            sdrStats,
            planosMensais,
            planosTrimestrais,
            planosSemestrais,
            planosAnuais
          }
        } else if (colaborador.funcao.toLowerCase() === 'closer') {
          // Calcular estatísticas do Closer
          const vendasColaborador = vendas.filter(v => v.closer_id === colaborador.id)
          
          // Contar planos por tipo
          const planosMensais = vendasColaborador.filter(v => v.tipo_plano === 'mensal').length
          const planosTrimestrais = vendasColaborador.filter(v => v.tipo_plano === 'trimestral').length
          const planosSemestrais = vendasColaborador.filter(v => v.tipo_plano === 'semestral').length
          const planosAnuais = vendasColaborador.filter(v => v.tipo_plano === 'anual').length
          
          // Calcular MRR total
          let mrrTotal = 0
          const vendasFormatadas = vendasColaborador.map(venda => {
            const mrr = calculateMRR(
              venda.valor_venda || 0, 
              (venda.tipo_plano || 'mensal') as TipoPlano, 
              config.planos
            )
            mrrTotal += mrr

            return {
              tipo_plano: (venda.tipo_plano || 'mensal') as TipoPlano,
              valor_venda: venda.valor_venda || 0,
              valor_base: venda.valor_base_plano || 0
            }
          })

          const percentualMeta = metaAtual.valor_meta_mrr ? 
            (mrrTotal / metaAtual.valor_meta_mrr) * 100 : 0

          const closerStats = calculateComissaoCloser(
            vendasFormatadas,
            percentualMeta,
            config.closer,
            config.planos
          )

          return {
            ...colaborador,
            closerStats: {
              ...closerStats,
              mrrTotal,
              percentualMeta
            },
            planosMensais,
            planosTrimestrais,
            planosSemestrais,
            planosAnuais
          }
        }

        return colaborador
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

  const totalComissoes = colaboradoresComissao.reduce((sum, col) => 
    sum + (col.sdrStats?.total || 0) + (col.closerStats?.total || 0), 0)
  
  const totalMRR = colaboradoresComissao.reduce((sum, col) => 
    sum + (col.closerStats?.mrrTotal || 0), 0)

  const sdrs = colaboradoresComissao.filter(col => col.funcao.toLowerCase() === 'sdr')
  const closers = colaboradoresComissao.filter(col => col.funcao.toLowerCase() === 'closer')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-green-500" />
            Comissões
          </h1>
          <p className="text-muted-foreground">Sistema de comissionamento baseado em desempenho e metas</p>
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
            <CardTitle className="text-sm font-medium">MRR Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMRR)}</div>
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
      {/* Seção SDRs */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          SDRs - Reuniões
        </h2>
        <div className="space-y-4">
          {sdrs.map(colaborador => {
            const checkpointInfo = getCheckpointInfo(colaborador.sdrStats?.percentualMeta || 0)
            
            return (
              <Card key={colaborador.id} className="bg-card/50 border-blue-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{colaborador.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {colaborador.sdrStats?.reunioes.qualificadas || 0} qualificadas + {colaborador.sdrStats?.reunioes.gerou_venda || 0} que geraram venda
                      </p>
                      <div className="text-xs text-muted-foreground mt-1">
                        Planos gerados: M:{colaborador.planosMensais || 0} T:{colaborador.planosTrimestrais || 0} S:{colaborador.planosSemestrais || 0} A:{colaborador.planosAnuais || 0}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className={`${checkpointInfo.color}/10 text-blue-600 border-blue-500/20`}>
                        {checkpointInfo.name}
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        SDR
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Reuniões</p>
                      <p className="text-lg font-semibold">
                        {(colaborador.sdrStats?.reunioes.qualificadas || 0) + (colaborador.sdrStats?.reunioes.gerou_venda || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">{colaborador.sdrStats?.percentualMeta.toFixed(1) || 0}% da meta</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Comissão Base</p>
                      <p className="text-lg font-semibold text-blue-500">{formatCurrency(colaborador.sdrStats?.comissaoBase || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bônus Meta</p>
                      <p className="text-lg font-semibold text-green-500">{formatCurrency(colaborador.sdrStats?.bonus || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(colaborador.sdrStats?.total || 0)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso da Meta de Reuniões</span>
                      <span>{colaborador.sdrStats?.percentualMeta.toFixed(1) || 0}%</span>
                    </div>
                    <Progress 
                      value={Math.min(colaborador.sdrStats?.percentualMeta || 0, 100)} 
                      className="h-2"
                    />
                  </div>

                  {(colaborador.sdrStats?.percentualMeta || 0) >= 100 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Meta batida! Bônus de {formatCurrency(colaborador.sdrStats?.bonus || 0)} aplicado!</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Seção Closers */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          Closers - Vendas MRR
        </h2>
        <div className="space-y-4">
          {closers.map(colaborador => {
            const checkpointInfo = getCheckpointInfo(colaborador.closerStats?.percentualMeta || 0)
            
            return (
              <Card key={colaborador.id} className="bg-card/50 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{colaborador.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {colaborador.closerStats?.detalhesVendas.length || 0} vendas - MRR: {formatCurrency(colaborador.closerStats?.mrrTotal || 0)}
                      </p>
                      <div className="text-xs text-muted-foreground mt-1">
                        Planos vendidos: M:{colaborador.planosMensais || 0} T:{colaborador.planosTrimestrais || 0} S:{colaborador.planosSemestrais || 0} A:{colaborador.planosAnuais || 0}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className={`${checkpointInfo.color}/10 text-green-600 border-green-500/20`}>
                        {checkpointInfo.name} ({(checkpointInfo.fator * 100).toFixed(0)}%)
                      </Badge>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                        Closer
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">MRR Gerado</p>
                      <p className="text-lg font-semibold">{formatCurrency(colaborador.closerStats?.mrrTotal || 0)}</p>
                      <p className="text-xs text-muted-foreground">{colaborador.closerStats?.percentualMeta.toFixed(1) || 0}% da meta</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Comissão Vendas</p>
                      <p className="text-lg font-semibold text-green-500">{formatCurrency(colaborador.closerStats?.comissaoVendas || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bônus Meta</p>
                      <p className="text-lg font-semibold text-green-500">{formatCurrency(colaborador.closerStats?.bonusMeta || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(colaborador.closerStats?.total || 0)}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Progresso da Meta MRR</span>
                      <span>{colaborador.closerStats?.percentualMeta.toFixed(1) || 0}%</span>
                    </div>
                    <Progress 
                      value={Math.min(colaborador.closerStats?.percentualMeta || 0, 100)} 
                      className="h-2"
                    />
                  </div>

                  {/* Detalhes das vendas */}
                  {colaborador.closerStats?.detalhesVendas && colaborador.closerStats.detalhesVendas.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Detalhes das Vendas:</h4>
                      {colaborador.closerStats.detalhesVendas.map((venda, index) => (
                        <div key={index} className="text-xs p-2 bg-muted/50 rounded border">
                          <div className="flex justify-between items-center">
                            <span className="font-medium capitalize">{venda.tipo_plano}</span>
                            <span className="text-green-600 font-medium">{formatCurrency(venda.comissao_total)}</span>
                          </div>
                          <div className="text-muted-foreground mt-1">
                            Vendido: {formatCurrency(venda.valor_venda)} | Base: {formatCurrency(venda.valor_base)} 
                            {venda.percentual_acima > 0 && (
                              <span className="text-green-600"> (+{venda.percentual_acima.toFixed(1)}%)</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {(colaborador.closerStats?.bonusMeta || 0) > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Bônus por meta: {formatCurrency(colaborador.closerStats?.bonusMeta || 0)} 
                          ({(colaborador.closerStats?.percentualMeta || 0) >= 120 ? '120%+' : 
                            (colaborador.closerStats?.percentualMeta || 0) >= 110 ? '110%+' : '100%+'} da meta)
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Modal de Configuração */}
      <NovaConfiguracaoComissao
        open={showConfig}
        onOpenChange={setShowConfig}
        currentConfig={comissaoConfig || getNovaComissaoConfig()}
        onConfigSaved={(newConfig: NovaComissaoConfig) => {
          setComissaoConfigState(newConfig)
          loadComissaoData()
        }}
      />
    </div>
  )
}
