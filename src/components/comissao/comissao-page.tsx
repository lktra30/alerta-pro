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
          setedays.setDate(setedays.getDate() - 6) // -6 para ter exatamente 7 dias incluindo hoje
          dataInicio = setedays
          dataFim = currentDate
          break
        case 'ultimos30':
          const trintaDias = new Date(currentDate)
          trintaDias.setDate(trintaDias.getDate() - 29) // -29 para ter exatamente 30 dias incluindo hoje
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
        const clientesSDR = clientesFiltrados.filter(c => c.sdr_id === colaborador.id)
        
        // Contar reuniões realizadas pelos clientes
        const reunioesRealizadas = clientesSDR.filter(c => 
          ['Reunioes Feitas', 'Vendas Realizadas'].includes(c.etapa)
        ).length
        
        // Para SDR: calcular baseado em reuniões filtradas APENAS de clientes em etapas válidas
        const reunioesSDR = reunioesFiltradas.filter(r => {
          if (r.sdr_id !== colaborador.id) return false
          
          // Verificar se cliente está em etapa válida
          if (r.cliente_id) {
            const cliente = clientesFiltrados.find(c => c.id === r.cliente_id)
            return cliente && ['Agendados', 'Reunioes Feitas', 'Vendas Realizadas'].includes(cliente.etapa)
          }
          return false
        })
        const reunioesNaTabela = reunioesSDR.length
        
        // Total de reuniões = MAX entre reuniões na tabela e reuniões realizadas
        const totalReunioes = Math.max(reunioesNaTabela, reunioesRealizadas)
        percentualMeta = (totalReunioes / metas.meta_sdr) * 100
        
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
      const clientesSDR = clientes.filter(c => c.sdr_id === colaborador.colaborador.id)
      
      // Realizadas = clientes com etapa "Reunioes Feitas" ou "Vendas Realizadas"
      const realizadas = clientesSDR.filter(c => 
        c.etapa === 'Reunioes Feitas' || c.etapa === 'Vendas Realizadas'
      ).length
      
      // Reuniões na tabela reunioes APENAS de clientes em etapas válidas
      const reunioesSDR = reunioesFiltradas.filter(r => {
        if (r.sdr_id !== colaborador.colaborador.id) return false
        
        // Verificar se cliente associado está em etapa válida
        if (r.cliente_id) {
          const cliente = clientes.find(c => c.id === r.cliente_id)
          return cliente && ['Agendados', 'Reunioes Feitas', 'Vendas Realizadas'].includes(cliente.etapa)
        }
        return false
      })
      const reunioesNaTabela = reunioesSDR.length
      
      // Agendadas = MAX entre reuniões na tabela e reuniões realizadas
      // Isso garante que toda reunião realizada também conte como agendada
      const agendadas = Math.max(reunioesNaTabela, realizadas)
      
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
      {/* Header Responsivo */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 truncate">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
                Comissões
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Sistema de comissionamento baseado em desempenho e metas
              </p>
            </div>
            
            <div className="w-full sm:w-auto">
              <PeriodoFiltro periodo={periodoFilter} onPeriodoChange={handleFilterChange} />
            </div>
          </div>
          <Button onClick={() => setShowConfig(true)} className="w-full sm:w-auto flex-shrink-0">
            <Settings className="mr-2 h-4 w-4" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo - Responsivo com scroll horizontal */}
      <div className="w-full">
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 lg:grid lg:grid-cols-4 lg:gap-6 min-w-max lg:min-w-0">
            <Card className="w-80 lg:w-auto flex-shrink-0 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total em Comissões</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="text-xl sm:text-2xl font-bold text-green-600 truncate">{formatCurrency(totalComissoes)}</div>
              </CardContent>
            </Card>

            <Card className="w-80 lg:w-auto flex-shrink-0 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MRR Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 truncate">{formatCurrency(mrrTotal)}</div>
              </CardContent>
            </Card>

            <Card className="w-80 lg:w-auto flex-shrink-0 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Colaboradores Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{comissoes.length}</div>
              </CardContent>
            </Card>

            <Card className="w-80 lg:w-auto flex-shrink-0 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium truncate">
                  {periodoFilter === 'hoje' ? 'Comissões Hoje' :
                   periodoFilter === 'ontem' ? 'Comissões Ontem' :
                   periodoFilter === 'ultimos7' ? 'Comissões (7 dias)' :
                   periodoFilter === 'ultimos30' ? 'Comissões (30 dias)' :
                   periodoFilter === 'esteMes' ? 'Comissões Este Mês' :
                   periodoFilter === 'mesPassado' ? 'Comissões Mês Passado' : 'Comissões Período'}
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="text-xl sm:text-2xl font-bold text-orange-600 truncate">{formatCurrency(totalComissoes)}</div>
                <p className="text-xs text-muted-foreground mt-1">Comissões no período selecionado</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Lista de SDRs - Responsiva */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
            SDRs - Reuniões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {comissoes.filter(c => c.tipo === 'sdr').map((item) => {
            const comissaoSDR = item.comissao as ComissaoSDRResult
            return (
              <div key={item.colaborador.id} className="border rounded-lg p-3 sm:p-4 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <h3 className="font-semibold truncate">{item.colaborador.nome}</h3>
                    <Badge variant="outline" className="flex-shrink-0">{getTipoLabel(item.tipo)}</Badge>
                    <div className="flex-shrink-0">{getCheckpointBadge(item.percentualMeta)}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg sm:text-xl font-bold text-green-600 truncate">
                      {formatCurrency(comissaoSDR.total)}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mb-2 truncate">
                  {getMetaInfo(item)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium">Total Reuniões</span>
                    <div>{comissaoSDR.reunioes.qualificadas}</div>
                    <div className="text-xs text-muted-foreground">{item.percentualMeta.toFixed(1)}% da meta</div>
                  </div>
                  <div className="min-w-0">
                    <span className="font-medium">Comissão Base</span>
                    <div className="text-blue-600 truncate">{formatCurrency(comissaoSDR.comissaoBase)}</div>
                  </div>
                  <div className="min-w-0">
                    <span className="font-medium">Bônus Meta</span>
                    <div className="text-green-600 truncate">{formatCurrency(comissaoSDR.bonus)}</div>
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

      {/* Lista de Closers - Responsiva */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
            Closers - Vendas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {comissoes.filter(c => c.tipo === 'closer').map((item) => {
            const comissaoCloser = item.comissao as ComissaoCloserResult
            return (
              <div key={item.colaborador.id} className="border rounded-lg p-3 sm:p-4 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <h3 className="font-semibold truncate">{item.colaborador.nome}</h3>
                    <Badge variant="outline" className="flex-shrink-0">{getTipoLabel(item.tipo)}</Badge>
                    <div className="flex-shrink-0">{getCheckpointBadge(item.percentualMeta)}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg sm:text-xl font-bold text-green-600 truncate">
                      {formatCurrency(comissaoCloser.total)}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mb-2 truncate">
                  MRR no período: {formatCurrency((item.comissao as ComissaoCloserResult).mrrGerado)}
                </div>

                {/* Informações de planos vendidos - Responsiva */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 p-2 bg-muted/30 rounded text-xs">
                  <div className="text-center min-w-0">
                    <div className="font-medium text-muted-foreground">Mensal</div>
                    <div className="font-bold">
                      {comissaoCloser.detalhesVendas.filter(v => v.tipo_plano === 'mensal').length}
                    </div>
                  </div>
                  <div className="text-center min-w-0">
                    <div className="font-medium text-muted-foreground">Trimestral</div>
                    <div className="font-bold">
                      {comissaoCloser.detalhesVendas.filter(v => v.tipo_plano === 'trimestral').length}
                    </div>
                  </div>
                  <div className="text-center min-w-0">
                    <div className="font-medium text-muted-foreground">Semestral</div>
                    <div className="font-bold">
                      {comissaoCloser.detalhesVendas.filter(v => v.tipo_plano === 'semestral').length}
                    </div>
                  </div>
                  <div className="text-center min-w-0">
                    <div className="font-medium text-muted-foreground">Anual</div>
                    <div className="font-bold">
                      {comissaoCloser.detalhesVendas.filter(v => v.tipo_plano === 'anual').length}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium">Vendas</span>
                    <div>{comissaoCloser.detalhesVendas.length}</div>
                    <div className="text-xs text-muted-foreground">{item.percentualMeta.toFixed(1)}% da meta</div>
                  </div>
                  <div className="min-w-0">
                    <span className="font-medium">Comissão Vendas</span>
                    <div className="text-blue-600 truncate">{formatCurrency(comissaoCloser.comissaoVendas)}</div>
                  </div>
                  <div className="min-w-0">
                    <span className="font-medium">Bônus Meta</span>
                    <div className="text-green-600 truncate">{formatCurrency(comissaoCloser.bonusMeta)}</div>
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
