"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Target } from "lucide-react"
import { getNovoComissionamentoStats, getMetasIndividuais, getClientes } from "@/lib/supabase"
import {
  getNovaComissaoConfig,
  calculateComissaoSDR,
  calculateComissaoCloser,
  calculateMRR,
  doesClienteCountForCloser,
  type ComissaoSDRResult,
  type ComissaoCloserResult
} from "@/lib/novo-comissionamento"
import type { Colaborador, TipoPlano } from "@/types/database"

interface ColaboradorSDR extends Colaborador {
  stats: ComissaoSDRResult
}

interface ColaboradorCloser extends Colaborador {
  stats: ComissaoCloserResult
}

interface RankingCardsProps {
  startDate?: string
  endDate?: string
}

const normalizeRole = (funcao?: string) => (funcao || '').toLowerCase()

const isSDRRole = (funcao?: string) => {
  const role = normalizeRole(funcao)
  return role === 'sdr' || role === 'sdr/closer'
}

const isCloserRole = (funcao?: string) => {
  const role = normalizeRole(funcao)
  return role === 'closer' || role === 'sdr/closer'
}

export function RankingCards({ startDate, endDate }: RankingCardsProps = {}) {
  const [sdrs, setSdrs] = useState<ColaboradorSDR[]>([])
  const [closers, setClosers] = useState<ColaboradorCloser[]>([])
  const [loading, setLoading] = useState(true)
  const [metasIndividuais, setMetasIndividuais] = useState({
    metaIndividualCloser: 200000,
    metaIndividualSDR: 25,
    totalClosers: 1,
    totalSDRs: 1
  })

  useEffect(() => {
    loadRankingData()
  }, [startDate, endDate])

  const loadRankingData = async () => {
    try {
      const [comissionamentoData, metasIndividuaisData, todosClientes] = await Promise.all([
        getNovoComissionamentoStats(),
        getMetasIndividuais(),
        getClientes() // Buscar todos os clientes para validar etapas
      ])

      setMetasIndividuais({
        metaIndividualCloser: metasIndividuaisData.metaIndividualCloser,
        metaIndividualSDR: metasIndividuaisData.metaIndividualSDR,
        totalClosers: metasIndividuaisData.totalClosers || 1,
        totalSDRs: metasIndividuaisData.totalSDRs || 1
      })

      const config = getNovaComissaoConfig()
      const { colaboradores, reunioes, metas } = comissionamentoData

      // Filtrar clientes por período, se especificado
      let clientesFiltrados = todosClientes
      if (startDate && endDate) {
        const dataInicio = new Date(startDate + 'T00:00:00')
        const dataFim = new Date(endDate + 'T23:59:59')

        clientesFiltrados = todosClientes.filter(cliente => {
          if (!cliente.criado_em) return false
          const clienteDate = new Date(cliente.criado_em)
          return clienteDate >= dataInicio && clienteDate <= dataFim
        })
      }

      // Filtrar reuniões por período, se especificado
      let reunioesFiltradas = reunioes
      if (startDate && endDate) {
        const dataInicio = new Date(startDate + 'T00:00:00')
        const dataFim = new Date(endDate + 'T23:59:59')

        reunioesFiltradas = reunioes.filter(reuniao => {
          if (!reuniao.data_reuniao) return false
          const reuniaoDate = new Date(reuniao.data_reuniao)
          return reuniaoDate >= dataInicio && reuniaoDate <= dataFim
        })
      }

      // FILTRAR reuniões apenas de clientes em etapas válidas
      const reunioesValidas = reunioesFiltradas.filter(reuniao => {
        if (!reuniao.cliente_id) return false
        const cliente = clientesFiltrados.find(c => c.id === reuniao.cliente_id)
        return cliente && ['Agendados', 'Reunioes Feitas', 'Vendas Realizadas'].includes(cliente.etapa)
      })
      
      // Meta atual (assumindo que queremos a mais recente)
      const metaAtual = metas[0]
      
      // Processar SDRs
      const sdrsData = colaboradores
        .filter(c => isSDRRole(c.funcao))
        .map(colaborador => {
          const clientesSDR = clientesFiltrados.filter(c => c.sdr_id === colaborador.id)
          
          // Contar reuniões realizadas pelos clientes
          const reunioesRealizadas = clientesSDR.filter(c => 
            ['Reunioes Feitas', 'Vendas Realizadas'].includes(c.etapa)
          ).length
          
          // Reuniões na tabela
          const reunioesColaborador = reunioesValidas.filter(r => r.sdr_id === colaborador.id)
          const reunioesQualificadasTabela = reunioesColaborador.filter(r => r.tipo === 'qualificada').length
          const reunioesGeraramVenda = reunioesColaborador.filter(r => r.tipo === 'gerou_venda').length
          const reunioesNaTabela = reunioesQualificadasTabela + reunioesGeraramVenda
          
          // Total de reuniões = MAX entre reuniões na tabela e reuniões realizadas
          const reunioesQualificadas = Math.max(reunioesNaTabela, reunioesRealizadas)
          
          const metaReunioesSDR = metaAtual?.meta_reunioes_sdr || 50
          const percentualMeta = (reunioesQualificadas / metaReunioesSDR) * 100
          
          const stats = calculateComissaoSDR(
            reunioesQualificadas,
            reunioesGeraramVenda,
            percentualMeta,
            config.sdr
          )
          
          return {
            ...colaborador,
            stats
          }
        })
        .sort((a, b) => b.stats.total - a.stats.total)
      
      const clientesComVenda = clientesFiltrados.filter(cliente =>
        cliente.etapa === 'Vendas Realizadas' &&
        cliente.valor_venda && cliente.valor_venda > 0
      )

      // Processar Closers
      const closersData = colaboradores
        .filter(c => isCloserRole(c.funcao))
        .map(colaborador => {
          const includeDualRoleFallback = isSDRRole(colaborador.funcao)

          const vendasColaborador = clientesComVenda
            .filter(cliente => doesClienteCountForCloser(cliente, colaborador.id, includeDualRoleFallback))
            .map(cliente => {
              const tipoPlano = (cliente.tipo_plano || 'mensal') as TipoPlano
              return {
                tipo_plano: tipoPlano,
                valor_venda: cliente.valor_venda || 0,
                valor_base: cliente.valor_base_plano || config.planos[tipoPlano]?.valor_base || 0
              }
            })
          
          const mrrTotal = vendasColaborador.reduce((sum, v) => 
            sum + calculateMRR(v.valor_venda, v.tipo_plano, config.planos), 0
          )
          
          const metaMRR = metaAtual?.valor_meta_mrr || 15000
          const percentualMeta = (mrrTotal / metaMRR) * 100
          
          const stats = calculateComissaoCloser(
            vendasColaborador,
            percentualMeta,
            config.closer,
            config.planos
          )
          
          return {
            ...colaborador,
            stats
          }
        })
        .sort((a, b) => b.stats.total - a.stats.total)
      
      setSdrs(sdrsData)
      setClosers(closersData)
    } catch (error) {
      console.error('Error loading ranking data:', error)
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

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return "🏆"
      case 1: return "🥈" 
      case 2: return "🥉"
      default: return `${index + 1}º`
    }
  }

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return "text-yellow-600"
      case 1: return "text-gray-600"
      case 2: return "text-orange-600"
      default: return "text-muted-foreground"
    }
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 lg:grid lg:grid-cols-2 lg:gap-4 min-w-max lg:min-w-0">
            <Card className="w-96 lg:w-auto flex-shrink-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  Ranking de SDRs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="w-96 lg:w-auto flex-shrink-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                  Ranking de Closers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 lg:grid lg:grid-cols-2 lg:gap-4 min-w-max lg:min-w-0">
          {/* Ranking SDRs */}
          <Card className="w-96 lg:w-auto flex-shrink-0 overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                Ranking de SDRs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                {sdrs.slice(0, 6).map((sdr, index) => (
                  <div key={sdr.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`text-base sm:text-lg font-bold ${getRankColor(index)} flex-shrink-0`}>
                        {getRankIcon(index)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm sm:text-base truncate">{sdr.nome}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
                          {sdr.stats.reunioes.qualificadas} reuniões
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          Meta: {metasIndividuais.metaIndividualSDR} reuniões
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 min-w-0">
                      <div className="font-bold text-green-600 text-sm sm:text-base truncate">
                        {formatCurrency(sdr.stats.total)}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
                        {formatCurrency(sdr.stats.total / (sdr.stats.reunioes.qualificadas || 1))} / reunião
                      </div>
                      <div className="text-xs text-green-600">
                        {sdr.stats.percentualMeta.toFixed(1)}%
                      </div>
                    </div>
                    <div className="w-16 sm:w-20 flex-shrink-0">
                      <Progress value={Math.min(sdr.stats.percentualMeta, 100)} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ranking Closers */}
          <Card className="w-96 lg:w-auto flex-shrink-0 overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                Ranking de Closers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                {closers.slice(0, 6).map((closer, index) => (
                  <div key={closer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`text-base sm:text-lg font-bold ${getRankColor(index)} flex-shrink-0`}>
                        {getRankIcon(index)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm sm:text-base truncate">{closer.nome}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
                          {closer.stats.detalhesVendas.length} vendas
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          Meta: {formatCurrency(metasIndividuais.metaIndividualCloser)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 min-w-0">
                      <div className="font-bold text-green-600 text-sm sm:text-base truncate">
                        {formatCurrency(closer.stats.total)}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
                        {formatCurrency(closer.stats.detalhesVendas.length > 0 ? closer.stats.total / closer.stats.detalhesVendas.length : 0)} / venda
                      </div>
                      <div className="text-xs text-green-600">
                        {closer.stats.percentualMeta.toFixed(1)}%
                      </div>
                    </div>
                    <div className="w-16 sm:w-20 flex-shrink-0">
                      <Progress value={Math.min(closer.stats.percentualMeta, 100)} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
