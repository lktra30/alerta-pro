"use client"

import { useState, useEffect } from "react"
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
  AlertCircle
} from "lucide-react"
import { Cliente, EtapaEnum } from "@/types/database"
import { getClientes, updateClienteEtapa, isSupabaseConfigured } from "@/lib/supabase"
import { NovoClienteCard } from "./novo-cliente-card"
import { ClienteDetailsCard } from "./cliente-details-card"

const etapas: EtapaEnum[] = [
  'Prospecção',
  'Contato Feito', 
  'Reunião Agendada',
  'Proposta Enviada',
  'Fechado - Ganhou',
  'Fechado - Perdido'
]

const getEtapaColor = (etapa: EtapaEnum) => {
  switch (etapa) {
    case 'Prospecção':
      return 'text-gray-600'
    case 'Contato Feito':
      return 'text-blue-600'
    case 'Reunião Agendada':
      return 'text-yellow-600'
    case 'Proposta Enviada':
      return 'text-purple-600'
    case 'Fechado - Ganhou':
      return 'text-green-600'
    case 'Fechado - Perdido':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

export function CRMPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [etapaFilter, setEtapaFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNovoClienteOpen, setIsNovoClienteOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

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

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStage = etapaFilter === "all" || cliente.etapa === etapaFilter
    
    return matchesSearch && matchesStage
  })

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

  // Calculate statistics
  const totalClientes = clientes.length
  const clientesAtivos = clientes.filter(c => !c.etapa.includes('Fechado')).length
  const vendasFechadas = clientes.filter(c => c.etapa === 'Fechado - Ganhou').length
  const valorTotalVendas = clientes
    .filter(c => c.etapa === 'Fechado - Ganhou')
    .reduce((sum, c) => sum + (c.valor_venda || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">CRM</h1>
        <p className="text-muted-foreground">
          Gerencie seus clientes e acompanhe o pipeline de vendas
        </p>
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
              {((vendasFechadas / totalClientes) * 100).toFixed(1)}% taxa de conversão
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
              {formatCurrency(valorTotalVendas)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ticket médio: {formatCurrency(valorTotalVendas / Math.max(vendasFechadas, 1))}
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
            </div>
            
            <Button 
              className="gap-2"
              onClick={() => setIsNovoClienteOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>

          {/* Clients Table */}
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenDetails(cliente)}
                        >
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Client Modal */}
      <NovoClienteCard 
        onClienteAdicionado={loadClientes}
        isOpen={isNovoClienteOpen}
        onOpenChange={setIsNovoClienteOpen}
      />

      {/* Client Details Modal */}
      <ClienteDetailsCard
        cliente={selectedCliente}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onClienteUpdated={loadClientes}
      />
    </div>
  )
}
