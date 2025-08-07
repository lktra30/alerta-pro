"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Target } from "lucide-react"
import { getNovoComissionamentoStats, getMetasIndividuais } from "@/lib/supabase"
import { 
  getNovaComissaoConfig, 
  calculateComissaoSDR, 
  calculateComissaoCloser,
  calculateMRR,
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

export function RankingCards() {
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
  }, [])

  const loadRankingData = async () => {
    try {
      const [comissionamentoData, metasIndividuaisData] = await Promise.all([
        getNovoComissionamentoStats(),
        getMetasIndividuais()
      ])
      
      setMetasIndividuais({
        metaIndividualCloser: metasIndividuaisData.metaIndividualCloser,
        metaIndividualSDR: metasIndividuaisData.metaIndividualSDR,
        totalClosers: metasIndividuaisData.totalClosers || 1,
        totalSDRs: metasIndividuaisData.totalSDRs || 1
      })
      
      const config = getNovaComissaoConfig()
      const { colaboradores, reunioes, vendas, metas } = comissionamentoData
      
      // Meta atual (assumindo que queremos a mais recente)
      const metaAtual = metas[0]
      
      // Processar SDRs
      const sdrsData = colaboradores
        .filter(c => c.funcao.toLowerCase() === 'sdr')
        .map(colaborador => {
          const reunioesColaborador = reunioes.filter(r => r.sdr_id === colaborador.id)
          const reunioesQualificadas = reunioesColaborador.filter(r => r.tipo === 'qualificada').length
          const reunioesGeraramVenda = reunioesColaborador.filter(r => r.tipo === 'gerou_venda').length
          
          const metaReunioesSDR = metaAtual?.meta_reunioes_sdr || 50
          const totalReunioes = reunioesQualificadas + reunioesGeraramVenda
          const percentualMeta = (totalReunioes / metaReunioesSDR) * 100
          
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
      
      // Processar Closers
      const closersData = colaboradores
        .filter(c => c.funcao.toLowerCase() === 'closer')
        .map(colaborador => {
          const vendasColaborador = vendas
            .filter(v => v.closer_id === colaborador.id)
            .map(v => ({
              tipo_plano: (v.tipo_plano || 'mensal') as TipoPlano,
              valor_venda: v.valor_venda || 0,
              valor_base: v.valor_base_plano || config.planos[v.tipo_plano as TipoPlano]?.valor_base || 0
            }))
          
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
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              Ranking de SDRs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Ranking de Closers
            </CardTitle>
          </CardHeader>
          <CardContent>
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
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Ranking SDRs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Ranking de SDRs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sdrs.slice(0, 6).map((sdr, index) => (
              <div key={sdr.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`text-lg font-bold ${getRankColor(index)}`}>
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <div className="font-medium">{sdr.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {sdr.stats.reunioes.qualificadas + sdr.stats.reunioes.gerou_venda} reuniões
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Meta: {metasIndividuais.metaIndividualSDR} reuniões
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {formatCurrency(sdr.stats.total)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(sdr.stats.total / (sdr.stats.reunioes.qualificadas + sdr.stats.reunioes.gerou_venda || 1))} / reunião
                  </div>
                  <div className="text-xs text-green-600">
                    {sdr.stats.percentualMeta.toFixed(1)}%
                  </div>
                </div>
                <div className="w-20">
                  <Progress value={Math.min(sdr.stats.percentualMeta, 100)} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ranking Closers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking de Closers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {closers.slice(0, 6).map((closer, index) => (
              <div key={closer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`text-lg font-bold ${getRankColor(index)}`}>
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <div className="font-medium">{closer.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {closer.stats.detalhesVendas.length} vendas
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Meta: {formatCurrency(metasIndividuais.metaIndividualCloser)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {formatCurrency(closer.stats.total)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(closer.stats.detalhesVendas.length > 0 ? closer.stats.total / closer.stats.detalhesVendas.length : 0)} / venda
                  </div>
                  <div className="text-xs text-green-600">
                    {closer.stats.percentualMeta.toFixed(1)}%
                  </div>
                </div>
                <div className="w-20">
                  <Progress value={Math.min(closer.stats.percentualMeta, 100)} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
