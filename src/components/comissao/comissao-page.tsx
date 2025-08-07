"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Settings, DollarSign, Users, TrendingUp, Calendar } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { PeriodoFiltro } from "@/components/ui/date-range-filter"
import { getColaboradores, getAllClientes, getAllReunioes } from "@/lib/supabase"
import { 
  getNovaComissaoConfig, 
  calculateComissaoSDRFromClientes,
  calculateComissaoCloserFromClientes,
  type ComissaoSDRResult,
  type ComissaoCloserResult
} from "@/lib/novo-comissionamento"
import { NovaConfiguracaoComissao } from "./nova-configuracao-comissao"
import type { Colaborador, Cliente } from "@/types/database"

interface ComissaoData {
  colaborador: Colaborador
  comissao: ComissaoSDRResult | ComissaoCloserResult
  percentualMeta: number
  tipo: 'sdr' | 'closer'
}

export function ComissaoPage() {
  const [showConfig, setShowConfig] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [reunioes, setReunioes] = useState<any[]>([])
  const [reunioesFiltradas, setReunioesFiltradas] = useState<any[]>([])
  const [periodoFilter, setPeriodoFilter] = useState<string>("esteMes")
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>()
  const [comissoes, setComissoes] = useState<ComissaoData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalComissoes, setTotalComissoes] = useState(0)
  const [mrrTotal, setMrrTotal] = useState(0)

  // Função helper para obter data no fuso horário brasileiro (UTC-3 / São Paulo)
  const getBrazilDate = (date?: Date) => {
    const sourceDate = date || new Date()
    const brazilDateStr = sourceDate.toLocaleDateString('en-CA', { 
      timeZone: 'America/Sao_Paulo' 
    })
    return new Date(brazilDateStr + 'T00:00:00')
  }

  const handleFilterChange = (periodo: string, range?: DateRange) => {
    setPeriodoFilter(periodo)
    setCustomDateRange(range)
  }

  const getMetas = () => {
    const savedConfig = localStorage.getItem('comissao_metas')
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        return {
          meta_sdr: config.meta_sdr || 50,
          meta_closer: config.meta_closer || 15000
        }
      } catch (error) {
        console.error('Error loading metas:', error)
      }
    }
    return { meta_sdr: 50, meta_closer: 15000 }
  }

  const calculateAllComissoes = useCallback(async (colaboradoresData: Colaborador[], clientesData: Cliente[], reunioesData: any[]) => {
    const config = getNovaComissaoConfig()
    const metas = getMetas()
    
    let clientesFiltrados = clientesData
    let reunioesFiltradas = reunioesData
    
    let dataInicio: Date | null = null
    let dataFim: Date | null = null

    if (periodoFilter === 'custom' && customDateRange?.from && customDateRange?.to) {
      dataInicio = customDateRange.from
      dataFim = customDateRange.to
    } else if (periodoFilter !== 'esteMes' && periodoFilter !== 'all') {
      // Usar fuso horário brasileiro para todos os cálculos
      const currentDate = getBrazilDate()
      
      switch (periodoFilter) {
        case 'hoje':
          dataInicio = currentDate
          dataFim = currentDate
          break
        case 'ontem':
          const ontem = new Date(currentDate)
          ontem.setDate(ontem.getDate() - 1)
          dataInicio = ontem
          dataFim = ontem
          break
        case 'ultimos7':
          const setedays = new Date(currentDate)
          setedays.setDate(setedays.getDate() - 7)
          dataInicio = setedays
          dataFim = currentDate
          break
        case 'ultimos30':
          const trintaDias = new Date(currentDate)
          trintaDias.setDate(trintaDias.getDate() - 30)
          dataInicio = trintaDias
          dataFim = currentDate
          break
        case 'mesPassado':
          const firstDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
          const lastDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
          dataInicio = firstDayLastMonth
          dataFim = lastDayLastMonth
          break
      }
    } else if (periodoFilter === 'esteMes') {
      const currentDate = getBrazilDate()
      dataInicio = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      dataFim = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    }

    if (dataInicio && dataFim) {
      // Adicionar 1 dia ao dataFim para incluir o dia inteiro
      const dataFimAjustada = new Date(dataFim)
      dataFimAjustada.setDate(dataFimAjustada.getDate() + 1)
      
      clientesFiltrados = clientesData.filter(cliente => {
        if (!cliente.criado_em) return false
        const clienteDate = new Date(cliente.criado_em)
        return clienteDate >= dataInicio! && clienteDate < dataFimAjustada
      })
      
      reunioesFiltradas = reunioesData.filter(reuniao => {
        if (!reuniao.data_reuniao) return false
        const reuniaoDate = new Date(reuniao.data_reuniao)
        return reuniaoDate >= dataInicio! && reuniaoDate < dataFimAjustada
      })
    }
    
    const comissoesCalculadas: ComissaoData[] = []
    let totalGeral = 0
    let mrrGeral = 0

    for (const colaborador of colaboradoresData) {
      let comissao: ComissaoSDRResult | ComissaoCloserResult
      let percentualMeta = 0
      let tipo: 'sdr' | 'closer' = 'sdr'

      if (colaborador.funcao.toLowerCase() === 'sdr') {
        // Para SDR: calcular baseado em reuniões filtradas
        const reunioesSDR = reunioesFiltradas.filter(r => r.sdr_id === colaborador.id)
        percentualMeta = (reunioesSDR.length / metas.meta_sdr) * 100
        
        comissao = await calculateComissaoSDRFromClientes(
          clientesFiltrados,
          reunioesFiltradas,
          colaborador.id,
          percentualMeta,
          config.sdr
        )
        tipo = 'sdr'
      } else if (colaborador.funcao.toLowerCase() === 'closer') {
        // Para Closer: calcular baseado em MRR
        const vendasCloser = clientesFiltrados.filter(c => 
          c.closer_id === colaborador.id && 
          c.etapa === 'Vendas Realizadas' && 
          c.valor_venda && c.valor_venda > 0
        )
        
        // Calcular MRR das vendas do closer
        const mrrCloser = vendasCloser.reduce((total, venda) => {
          const valorVenda = venda.valor_venda || 0
          const valorMensal = venda.tipo_plano === 'mensal' ? valorVenda :
                             venda.tipo_plano === 'trimestral' ? valorVenda / 3 :
                             venda.tipo_plano === 'semestral' ? valorVenda / 6 :
                             venda.tipo_plano === 'anual' ? valorVenda / 12 : 0
          return total + valorMensal
        }, 0)
        
        percentualMeta = (mrrCloser / metas.meta_closer) * 100
        mrrGeral += mrrCloser
        
        comissao = calculateComissaoCloserFromClientes(
          clientesFiltrados,
          colaborador.id,
          percentualMeta,
          config.closer
        )
        tipo = 'closer'
      } else {
        continue // Pular colaboradores que não são SDR nem Closer
      }

      totalGeral += comissao.total
      comissoesCalculadas.push({
        colaborador,
        comissao,
        percentualMeta,
        tipo
      })
    }

    setComissoes(comissoesCalculadas)
    setTotalComissoes(totalGeral)
    setMrrTotal(mrrGeral)
    setReunioesFiltradas(reunioesFiltradas)
  }, [periodoFilter, customDateRange])

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [colaboradoresData, clientesData, reunioesData] = await Promise.all([
          getColaboradores(),
          getAllClientes(),
          getAllReunioes()
        ])
        
        setClientes(clientesData)
        setReunioes(reunioesData)
        
        // Calcular comissões
        await calculateAllComissoes(colaboradoresData, clientesData, reunioesData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [calculateAllComissoes])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getCheckpointBadge = (percentual: number) => {
    if (percentual < 20) return <Badge variant="destructive">Sem Comissão</Badge>
    if (percentual < 65) return <Badge variant="secondary">Checkpoint 1</Badge>
    if (percentual < 100) return <Badge variant="default">Checkpoint 2</Badge>
    return <Badge variant="default" className="bg-green-600">Checkpoint 3</Badge>
  }

  const getTipoLabel = (tipo: 'sdr' | 'closer') => {
    return tipo === 'sdr' ? 'SDR' : 'Closer'
  }

  const getMetaInfo = (colaborador: ComissaoData) => {
    if (colaborador.tipo === 'sdr') {
      // Agendadas = reuniões na tabela reunioes
      const reunioesSDR = reunioesFiltradas.filter(r => r.sdr_id === colaborador.colaborador.id)
      const agendadas = reunioesSDR.length
      
      // Realizadas = clientes com etapa "Reunioes Feitas" ou "Vendas Realizadas"
      const clientesSDR = clientes.filter(c => c.sdr_id === colaborador.colaborador.id)
      const realizadas = clientesSDR.filter(c => 
        c.etapa === 'Reunioes Feitas' || c.etapa === 'Vendas Realizadas'
      ).length
      
      // Gerou venda = clientes com "Vendas Realizadas" + valor preenchido
      const gerouVenda = clientesSDR.filter(c => 
        c.etapa === 'Vendas Realizadas' && c.valor_venda && c.valor_venda > 0
      ).length
      
      return `${agendadas} agendadas / ${realizadas} realizadas / ${gerouVenda} gerou venda`
    } else {
      const vendas = clientes.filter(c => 
        c.closer_id === colaborador.colaborador.id && 
        c.etapa === 'Vendas Realizadas' && 
        c.valor_venda && c.valor_venda > 0
      )
      const mrr = vendas.reduce((total, venda) => {
        const valorVenda = venda.valor_venda || 0
        const valorMensal = venda.tipo_plano === 'mensal' ? valorVenda :
                           venda.tipo_plano === 'trimestral' ? valorVenda / 3 :
                           venda.tipo_plano === 'semestral' ? valorVenda / 6 :
                           venda.tipo_plano === 'anual' ? valorVenda / 12 : 0
        return total + valorMensal
      }, 0)
      return `MRR: ${formatCurrency(mrr)}`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados de comissionamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              Comissões
            </h1>
            <p className="text-muted-foreground">
              Sistema de comissionamento baseado em desempenho e metas
            </p>
          </div>
          
          <PeriodoFiltro periodo={periodoFilter} onPeriodoChange={handleFilterChange} />
        </div>
        <Button onClick={() => setShowConfig(true)}>
          <Settings className="mr-2 h-4 w-4" />
          Configurar
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalComissoes)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(mrrTotal)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboradores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{comissoes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {periodoFilter === 'hoje' ? 'Comissões Hoje' :
               periodoFilter === 'ontem' ? 'Comissões Ontem' :
               periodoFilter === 'ultimos7' ? 'Comissões (7 dias)' :
               periodoFilter === 'ultimos30' ? 'Comissões (30 dias)' :
               periodoFilter === 'esteMes' ? 'Comissões Este Mês' :
               periodoFilter === 'mesPassado' ? 'Comissões Mês Passado' : 'Comissões Período'}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalComissoes)}</div>
            <p className="text-xs text-muted-foreground mt-1">Comissões no período selecionado</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de SDRs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            SDRs - Reuniões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comissoes.filter(c => c.tipo === 'sdr').map((item) => {
            const comissaoSDR = item.comissao as ComissaoSDRResult
            return (
              <div key={item.colaborador.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{item.colaborador.nome}</h3>
                    <Badge variant="outline">{getTipoLabel(item.tipo)}</Badge>
                    {getCheckpointBadge(item.percentualMeta)}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(comissaoSDR.total)}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mb-2">
                  {getMetaInfo(item)}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Reuniões</span>
                    <div>{comissaoSDR.reunioes.qualificadas}</div>
                    <div className="text-xs text-muted-foreground">{item.percentualMeta.toFixed(1)}% da meta</div>
                  </div>
                  <div>
                    <span className="font-medium">Comissão Base</span>
                    <div className="text-blue-600">{formatCurrency(comissaoSDR.comissaoBase)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Bônus Meta</span>
                    <div className="text-green-600">{formatCurrency(comissaoSDR.bonus)}</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progresso da Meta de Reuniões</span>
                    <span>{item.percentualMeta.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(item.percentualMeta, 100)} className="h-2" />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Lista de Closers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Closers - Vendas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comissoes.filter(c => c.tipo === 'closer').map((item) => {
            const comissaoCloser = item.comissao as ComissaoCloserResult
            return (
              <div key={item.colaborador.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{item.colaborador.nome}</h3>
                    <Badge variant="outline">{getTipoLabel(item.tipo)}</Badge>
                    {getCheckpointBadge(item.percentualMeta)}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(comissaoCloser.total)}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mb-2">
                  MRR no período: {formatCurrency((item.comissao as ComissaoCloserResult).mrrGerado)}
                </div>

                {/* Informações de planos vendidos */}
                <div className="grid grid-cols-4 gap-2 mb-3 p-2 bg-muted/30 rounded text-xs">
                  <div className="text-center">
                    <div className="font-medium text-muted-foreground">Mensal</div>
                    <div className="font-bold">
                      {comissaoCloser.detalhesVendas.filter(v => v.tipo_plano === 'mensal').length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-muted-foreground">Trimestral</div>
                    <div className="font-bold">
                      {comissaoCloser.detalhesVendas.filter(v => v.tipo_plano === 'trimestral').length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-muted-foreground">Semestral</div>
                    <div className="font-bold">
                      {comissaoCloser.detalhesVendas.filter(v => v.tipo_plano === 'semestral').length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-muted-foreground">Anual</div>
                    <div className="font-bold">
                      {comissaoCloser.detalhesVendas.filter(v => v.tipo_plano === 'anual').length}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Vendas</span>
                    <div>{comissaoCloser.detalhesVendas.length}</div>
                    <div className="text-xs text-muted-foreground">{item.percentualMeta.toFixed(1)}% da meta</div>
                  </div>
                  <div>
                    <span className="font-medium">Comissão Vendas</span>
                    <div className="text-blue-600">{formatCurrency(comissaoCloser.comissaoVendas)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Bônus Meta</span>
                    <div className="text-green-600">{formatCurrency(comissaoCloser.bonusMeta)}</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progresso da Meta MRR</span>
                    <span>{item.percentualMeta.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(item.percentualMeta, 100)} className="h-2" />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Modal de Configuração */}
      <NovaConfiguracaoComissao 
        open={showConfig}
        onOpenChange={setShowConfig}
        currentConfig={getNovaComissaoConfig()}
        onConfigSaved={() => {
          // Recarregar dados após salvar configuração
          const loadData = async () => {
            const [colaboradoresData, clientesData, reunioesData] = await Promise.all([
              getColaboradores(),
              getAllClientes(),
              getAllReunioes()
            ])
            setClientes(clientesData)
            await calculateAllComissoes(colaboradoresData, clientesData, reunioesData)
          }
          loadData()
        }}
      />
    </div>
  )
}
