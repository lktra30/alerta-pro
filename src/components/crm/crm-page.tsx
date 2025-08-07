"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  Trash2,
  Table as TableIcon,
  LayoutGrid
} from "lucide-react"
import type { DateRange } from "react-day-picker"
import { Cliente, EtapaEnum } from "@/types/database"
import { getClientes, updateClienteEtapa, isSupabaseConfigured, deleteCliente } from "@/lib/supabase"
import { NovoClienteCard } from "./novo-cliente-card"
import { ClienteDetailsCard } from "./cliente-details-card"
import { PeriodoFiltro } from "@/components/ui/date-range-filter"

const etapas: EtapaEnum[] = [
  'Lead',
  'Leads Qualificados', 
  'Agendados',
  'Reunioes Feitas',
  'Vendas Realizadas'
]

const getEtapaColor = (etapa: EtapaEnum) => {
  switch (etapa) {
    case 'Lead':
      return 'bg-gray-100 text-gray-800'
    case 'Leads Qualificados':
      return 'bg-blue-100 text-blue-800'
    case 'Agendados':
      return 'bg-yellow-100 text-yellow-800'
    case 'Reunioes Feitas':
      return 'bg-purple-100 text-purple-800'
    case 'Vendas Realizadas':
      return 'bg-green-100 text-green-800'
    default:
      return 'text-gray-600'
  }
}

export function CRMPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [etapaFilter, setEtapaFilter] = useState<string>("all")
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [showNovoCliente, setShowNovoCliente] = useState(false)
  const [periodoFilter, setPeriodoFilter] = useState<string>("all")
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>()
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [totalReceita, setTotalReceita] = useState(0)
  const [totalMRR, setTotalMRR] = useState(0)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [draggedOver, setDraggedOver] = useState<string | null>(null)

  // Função helper para obter data no fuso horário brasileiro (UTC-3 / São Paulo)
  const getBrazilDate = (date?: Date) => {
    const sourceDate = date || new Date()
    const brazilDateStr = sourceDate.toLocaleDateString('en-CA', { 
      timeZone: 'America/Sao_Paulo' 
    })
    return new Date(brazilDateStr + 'T00:00:00')
  }

  const handlePeriodoChange = (periodo: string, range?: DateRange) => {
    setPeriodoFilter(periodo)
    setCustomDateRange(range)
  }

  useEffect(() => {
    loadClientes()
  }, [])

  const loadClientes = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (!isSupabaseConfigured()) {
        setError('Banco de dados não configurado. Configure as variáveis de ambiente do Supabase.')
        setClientes([])
        return
      }

      const data = await getClientes()
      setClientes(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
      setError('Erro ao carregar clientes do banco de dados.')
      setClientes([])
    } finally {
      setLoading(false)
    }
  }

  const filteredClientes = useMemo(() => {
    return clientes.filter(cliente => {
      const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cliente.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStage = etapaFilter === "all" || cliente.etapa === etapaFilter
      
      // Filtro por período usando fuso horário brasileiro
      let matchesPeriod = true
      if (periodoFilter !== "all" && cliente.criado_em) {
        const clienteDate = new Date(cliente.criado_em)
        const currentDate = getBrazilDate()
        
        if (periodoFilter === 'custom' && customDateRange?.from && customDateRange?.to) {
          matchesPeriod = clienteDate >= customDateRange.from && clienteDate <= customDateRange.to
        } else {
          switch (periodoFilter) {
            case 'hoje':
              matchesPeriod = clienteDate.toDateString() === currentDate.toDateString()
              break
            case 'ontem':
              const ontem = new Date(currentDate)
              ontem.setDate(ontem.getDate() - 1)
              matchesPeriod = clienteDate.toDateString() === ontem.toDateString()
              break
            case 'ultimos7':
              const setedays = new Date(currentDate)
              setedays.setDate(setedays.getDate() - 7)
              matchesPeriod = clienteDate >= setedays && clienteDate <= currentDate
              break
            case 'ultimos30':
              const trintaDias = new Date(currentDate)
              trintaDias.setDate(trintaDias.getDate() - 30)
              matchesPeriod = clienteDate >= trintaDias && clienteDate <= currentDate
              break
            case 'esteMes':
              matchesPeriod = clienteDate.getMonth() === currentDate.getMonth() && 
                             clienteDate.getFullYear() === currentDate.getFullYear()
              break
            case 'mesPassado':
              const mesPassado = new Date(currentDate)
              mesPassado.setMonth(mesPassado.getMonth() - 1)
              matchesPeriod = clienteDate.getMonth() === mesPassado.getMonth() && 
                             clienteDate.getFullYear() === mesPassado.getFullYear()
              break
          }
        }
      }
      
      return matchesSearch && matchesStage && matchesPeriod
    })
  }, [clientes, searchTerm, etapaFilter, periodoFilter, customDateRange])

  const handleEtapaChange = async (clienteId: number, newEtapa: EtapaEnum) => {
    try {
      // Update in database
      await updateClienteEtapa(clienteId, newEtapa)
      
      // Update local state
      setClientes(prev => prev.map(cliente => 
        cliente.id === clienteId 
          ? { ...cliente, etapa: newEtapa, atualizado_em: new Date().toISOString() }
          : cliente
      ))
    } catch (error) {
      console.error('Error updating client stage:', error)
    }
  }

  const handleOpenDetails = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setIsDetailsOpen(true)
  }

  const handleDeleteCliente = async (clienteId: number, clienteNome: string) => {
    if (!confirm(`Tem certeza que deseja deletar o cliente "${clienteNome}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const result = await deleteCliente(clienteId)
      if (result.success) {
        setClientes(clientes.filter(c => c.id !== clienteId))
      } else {
        setError(result.error || 'Erro ao deletar cliente')
      }
    } catch (error) {
      console.error('Error deleting cliente:', error)
      setError('Erro ao deletar cliente')
    }
  }

  const formatCurrency = (value?: number) => {
    if (!value) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Kanban View Component
  const renderKanbanView = () => {
    const clientesPorEtapa = {
      'Lead': filteredClientes.filter(c => c.etapa === 'Lead'),
      'Leads Qualificados': filteredClientes.filter(c => c.etapa === 'Leads Qualificados'),
      'Agendados': filteredClientes.filter(c => c.etapa === 'Agendados'),
      'Reunioes Feitas': filteredClientes.filter(c => c.etapa === 'Reunioes Feitas'),
      'Vendas Realizadas': filteredClientes.filter(c => c.etapa === 'Vendas Realizadas')
    }

    const handleCardClick = (cliente: Cliente) => {
      handleOpenDetails(cliente)
    }

    const handleDeleteFromKanban = (e: React.MouseEvent, clienteId: number, clienteNome: string) => {
      e.stopPropagation() // Previne o click do card
      handleDeleteCliente(clienteId, clienteNome)
    }

    const handleEtapaDrop = async (clienteId: number, newEtapa: EtapaEnum) => {
      const cliente = filteredClientes.find(c => c.id === clienteId)
      if (!cliente) return

      // Validação para Vendas Realizadas - verificar se campos obrigatórios estão preenchidos
      if (newEtapa === 'Vendas Realizadas') {
        if (!cliente.valor_venda || !cliente.tipo_plano || !cliente.data_fechamento) {
          // Abrir modal de detalhes para preencher campos obrigatórios
          setSelectedCliente(cliente)
          setIsDetailsOpen(true)
          return
        }
      }

      // Atualizar etapa
      await handleEtapaChange(clienteId, newEtapa)
    }

    return (
      <div className="grid grid-cols-5 gap-6 h-[600px]">
        {etapas.map((etapa) => (
          <div key={etapa} className="flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-semibold text-sm text-muted-foreground">
                {etapa}
              </h3>
              <span className="text-xs bg-muted px-2 py-1 rounded-full">
                {clientesPorEtapa[etapa].length}
              </span>
            </div>
            
            <div 
              className={`flex-1 space-y-3 overflow-y-auto min-h-[200px] p-3 rounded-lg transition-all duration-200 ${
                draggedOver === etapa 
                  ? 'bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-300 dark:border-blue-700' 
                  : 'bg-muted/20 border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDraggedOver(etapa)
              }}
              onDragLeave={() => setDraggedOver(null)}
              onDrop={(e) => {
                e.preventDefault()
                setDraggedOver(null)
                const clienteId = parseInt(e.dataTransfer.getData('clienteId'))
                handleEtapaDrop(clienteId, etapa)
              }}
            >
              {clientesPorEtapa[etapa].length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-12">
                  <div className="text-xs opacity-60">Nenhum cliente</div>
                </div>
              ) : (
                clientesPorEtapa[etapa].map((cliente) => (
                  <Card 
                    key={cliente.id} 
                    className="p-3 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative group border bg-card/80 backdrop-blur-sm"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('clienteId', cliente.id.toString())
                      e.currentTarget.style.opacity = '0.5'
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.style.opacity = '1'
                    }}
                    onClick={() => handleCardClick(cliente)}
                  >
                    <div className="space-y-2">
                      {/* Header com nome e botão delete */}
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm flex-1 text-foreground">{cliente.nome}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={(e) => handleDeleteFromKanban(e, cliente.id, cliente.nome)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Informações principais */}
                      <div className="space-y-1.5">
                        {cliente.email && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{cliente.email}</span>
                          </div>
                        )}
                        
                        {cliente.telefone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span>{cliente.telefone}</span>
                          </div>
                        )}
                        
                        {cliente.empresa && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Building className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{cliente.empresa}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Informações financeiras */}
                      {cliente.valor_venda && (
                        <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded text-xs">
                          <div className="flex items-center gap-1 text-green-700 dark:text-green-400 font-medium">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(cliente.valor_venda)}
                          </div>
                          {cliente.tipo_plano && (
                            <div className="text-green-600 dark:text-green-500 mt-1">
                              {cliente.tipo_plano}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer com origem e datas */}
                      <div className="space-y-1 pt-1 border-t border-border/40">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            {cliente.origem || 'N/A'}
                          </Badge>
                        </div>

                        {cliente.data_fechamento && (
                          <div className="text-xs text-muted-foreground">
                            Fechado: {formatDate(cliente.data_fechamento)}
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground/60">
                          {formatDate(cliente.criado_em)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Função para calcular MRR baseado no tipo de plano
  const calculateMRRFromVenda = (valorVenda: number, tipoPlano: string): number => {
    switch (tipoPlano) {
      case 'mensal': return valorVenda
      case 'trimestral': return valorVenda / 3
      case 'semestral': return valorVenda / 6  
      case 'anual': return valorVenda / 12
      default: return valorVenda // Default para mensal
    }
  }

  // Calculate statistics baseado nos clientes filtrados
  const totalClientes = filteredClientes.length
  const clientesAtivos = filteredClientes.filter(c => c.etapa !== 'Vendas Realizadas').length
  const vendasFechadas = filteredClientes.filter(c => c.etapa === 'Vendas Realizadas').length
  const valorTotalVendas = filteredClientes
    .filter(c => c.etapa === 'Vendas Realizadas')
    .reduce((sum, c) => sum + (c.valor_venda || 0), 0)
  
  // Calcular MRR real baseado nos tipos de plano dos clientes filtrados
  const totalMRRCalculado = filteredClientes
    .filter(c => c.etapa === 'Vendas Realizadas' && c.valor_venda)
    .reduce((sum, c) => {
      const mrr = calculateMRRFromVenda(c.valor_venda!, c.tipo_plano || 'mensal')
      return sum + mrr
    }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">CRM</h1>
            <p className="text-muted-foreground">
              Gerencie seus clientes e acompanhe o pipeline de vendas
            </p>
          </div>
          
          <PeriodoFiltro periodo={periodoFilter} onPeriodoChange={handlePeriodoChange} />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            {error.includes('não configurado') && (
              <p className="text-xs text-muted-foreground mt-2">
                Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalClientes}</div>
            <p className="text-xs text-muted-foreground">
              {clientesAtivos} ativos no pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Fechadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{vendasFechadas}</div>
            <p className="text-xs text-muted-foreground">
              {totalClientes > 0 ? ((vendasFechadas / totalClientes) * 100).toFixed(1) : '0.0'}% taxa de conversão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(valorTotalVendas) !== '-' ? formatCurrency(valorTotalVendas) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              MRR: {formatCurrency(totalMRRCalculado) !== '-' ? formatCurrency(totalMRRCalculado) : 'R$ 0,00'} • Ticket médio: {formatCurrency(vendasFechadas > 0 ? valorTotalVendas / vendasFechadas : 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Ativo</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{clientesAtivos}</div>
            <p className="text-xs text-muted-foreground">
              Oportunidades em andamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os seus clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={etapaFilter} onValueChange={setEtapaFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as etapas</SelectItem>
                  {etapas.map((etapa) => (
                    <SelectItem key={etapa} value={etapa}>
                      {etapa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 px-3"
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="h-8 px-3"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Button 
              className="gap-2"
              onClick={() => setShowNovoCliente(true)}
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>

          {/* Clients View */}
          {viewMode === 'table' ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data Criação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Carregando clientes...
                      </TableCell>
                    </TableRow>
                  ) : filteredClientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Nenhum cliente encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClientes.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{cliente.nome}</div>
                            <div className="text-sm text-muted-foreground">ID: {cliente.id}</div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>{cliente.empresa || '-'}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            {cliente.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span>{cliente.email}</span>
                              </div>
                            )}
                            {cliente.telefone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{cliente.telefone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline">{cliente.origem || 'N/A'}</Badge>
                        </TableCell>
                        
                        <TableCell>
                          <Select
                            value={cliente.etapa}
                            onValueChange={(value: EtapaEnum) => handleEtapaChange(cliente.id, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {etapas.map((etapa) => (
                                <SelectItem key={etapa} value={etapa}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getEtapaColor(etapa).replace('text-', 'bg-')}`} />
                                    {etapa}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatCurrency(cliente.valor_venda)}</div>
                            {cliente.data_fechamento && (
                              <div className="text-xs text-muted-foreground">
                                Fechado: {formatDate(cliente.data_fechamento)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(cliente.criado_em)}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleOpenDetails(cliente)}
                          >
                            Detalhes
                          </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteCliente(cliente.id, cliente.nome)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            renderKanbanView()
          )}
        </CardContent>
      </Card>

      {/* New Client Modal */}
      <NovoClienteCard 
        onClienteAdicionado={loadClientes}
        isOpen={showNovoCliente}
        onOpenChange={setShowNovoCliente}
      />

      {/* Client Details Modal */}
      {selectedCliente && (
        <ClienteDetailsCard
          cliente={selectedCliente}
          isOpen={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onClienteUpdated={loadClientes}
        />
      )}
    </div>
  )
}
