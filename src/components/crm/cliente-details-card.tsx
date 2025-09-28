"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { PhoneInputField } from "@/components/ui/phone-input"
import { Eye, Edit, Save, X, Loader2, User, Mail, Phone, Building, MapPin, DollarSign } from "lucide-react"
import { updateCliente, isSupabaseConfigured, getColaboradores, refreshSchemaCache, getPlanos } from "@/lib/supabase"
import { validateVendaRealizadaData, isVendaRealizadaDataComplete } from "@/lib/validations"
import { useToast } from "@/components/ui/toast-provider"
import { Cliente, EtapaEnum, Colaborador } from "@/types/database"

interface ClienteForm {
  nome: string
  email: string
  telefone: string
  empresa: string
  origem: string
  sdr_id: string // Mantemos como string no formulário para compatibilidade com Select
  closer_id: string // Mantemos como string no formulário para compatibilidade com Select
  etapa: EtapaEnum
  endereco: string
  valor_venda?: number | string
  tipo_plano: string
  valor_base_plano?: number | string
  usar_valor_base_para_venda: boolean
}

interface Plano {
  id: number
  nome: string
  periodo: string
  valor: number
  desconto: number
  trial: boolean
  obs: string
  nivel: number
  qtde_dias_trial: number
}

const etapas: EtapaEnum[] = [
  'Lead',
  'Leads Qualificados',
  'Agendados',
  'Reunioes Feitas',
  'Vendas Realizadas'
]

const origens = [
  'Facebook Ads',
  'Google Ads',
  'Instagram',
  'LinkedIn',
  'Site',
  'Indicação',
  'Outros'
]

const tiposPlano = [
  'mensal',
  'trimestral',
  'semestral',
  'anual'
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
      return 'bg-gray-100 text-gray-800'
  }
}

interface ClienteDetailsCardProps {
  cliente: Cliente
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onClienteUpdated?: () => void
}

export function ClienteDetailsCard({ cliente, isOpen, onOpenChange, onClienteUpdated }: ClienteDetailsCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const { success, error, warning } = useToast()
  const [form, setForm] = useState<ClienteForm>({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    origem: '',
    sdr_id: '',
    closer_id: '',
    etapa: 'Lead',
    endereco: '',
    valor_venda: '',
    tipo_plano: '',
    valor_base_plano: '',
    usar_valor_base_para_venda: true
  })

  // Update form when cliente changes
  useEffect(() => {
    if (cliente) {
      setForm({
        nome: cliente.nome || '',
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        empresa: cliente.empresa || '',
        origem: cliente.origem || '',
        sdr_id: cliente.sdr_id ? cliente.sdr_id.toString() : '',
        closer_id: cliente.closer_id ? cliente.closer_id.toString() : '',
        etapa: cliente.etapa,
        endereco: cliente.endereco || '',
        valor_venda: cliente.valor_venda || '',
        tipo_plano: cliente.tipo_plano || '',
        valor_base_plano: cliente.valor_base_plano || '',
        usar_valor_base_para_venda: cliente.valor_venda === cliente.valor_base_plano
      })
      
      // DETECTAR VENDAS REALIZADAS AQUI, APÓS ATUALIZAR O FORM
      if (isOpen && cliente.etapa === 'Vendas Realizadas') {
        const hasCompleteData = isVendaRealizadaDataComplete({
          valor_venda: cliente.valor_venda,
          tipo_plano: cliente.tipo_plano,
          valor_base_plano: cliente.valor_base_plano
        })
        
        if (!hasCompleteData) {
          // Ativar modo edição automaticamente
          setIsEditing(true)
          warning(
            "Dados Obrigatórios",
            "Para finalizar como 'Vendas Realizadas', preencha os dados obrigatórios"
          )
        }
      }
    }
  }, [cliente, isOpen])

  // Load colaboradores and planos when component mounts
  useEffect(() => {
    const loadData = async () => {
      const [colaboradoresData, planosData] = await Promise.all([
        getColaboradores(),
        getPlanos()
      ])
      setColaboradores(colaboradoresData)
      setPlanos(planosData)
    }
    loadData()
  }, [])

  // Modal cleanup effect (removed toast state)

  const handleInputChange = (field: keyof ClienteForm, value: string | number | boolean) => {
    setForm(prev => {
      const newForm = {
        ...prev,
        [field]: value
      }

      // Se mudou a etapa e não é "Vendas Realizadas", limpar campos de venda
      if (field === 'etapa' && value !== 'Vendas Realizadas') {
        newForm.valor_venda = ''
        newForm.tipo_plano = ''
        newForm.valor_base_plano = ''
        newForm.usar_valor_base_para_venda = true
      }

      // Se selecionou um tipo de plano, preencher valor base automaticamente
      if (field === 'tipo_plano' && value) {
        const planoSelecionado = planos.find(p => p.periodo.toLowerCase() === value)
        if (planoSelecionado) {
          const valorBase = planoSelecionado.valor - planoSelecionado.desconto
          newForm.valor_base_plano = valorBase
          // Se checkbox está marcado, preencher valor da venda também
          if (newForm.usar_valor_base_para_venda) {
            newForm.valor_venda = valorBase
          }
        }
      }

      // Se mudou o checkbox "usar valor base para venda"
      if (field === 'usar_valor_base_para_venda') {
        if (value && newForm.valor_base_plano) {
          // Se marcou o checkbox, preencher valor da venda com valor base
          newForm.valor_venda = newForm.valor_base_plano
        }
      }

      // Se mudou o valor base e checkbox está marcado, atualizar valor da venda
      if (field === 'valor_base_plano' && newForm.usar_valor_base_para_venda && typeof value === 'number') {
        newForm.valor_venda = value
      }

      return newForm
    })
  }

  // Validação antes de salvar
  const validateForm = () => {
    if (!form.nome.trim()) {
      // REMOVIDO: alert - usar validação silenciosa
      return false
    }

    // Se etapa é "Vendas Realizadas", validar campos obrigatórios
    if (form.etapa === 'Vendas Realizadas') {
      if (!form.valor_venda || parseFloat(form.valor_venda.toString()) <= 0) {
        // REMOVIDO: alert de valor da venda
        return false
      }
      if (!form.tipo_plano) {
        // REMOVIDO: alert de tipo do plano
        return false
      }
      if (!form.valor_base_plano || parseFloat(form.valor_base_plano.toString()) <= 0) {
        // REMOVIDO: alert de valor base
        return false
      }
    }

    return true
  }



  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Verificar se botão salvar deve estar habilitado
  const isSaveButtonEnabled = () => {
    if (!validateForm()) return false
    
    // Se etapa é "Vendas Realizadas", verificar dados obrigatórios
    if (form.etapa === 'Vendas Realizadas') {
      return isVendaRealizadaDataComplete({
        valor_venda: form.valor_venda,
        tipo_plano: form.tipo_plano,
        valor_base_plano: form.valor_base_plano
      })
    }
    
    return true
  }

  // Função para lidar com clique no botão salvar desabilitado
  const handleDisabledSaveClick = () => {
    if (form.etapa === 'Vendas Realizadas') {
      const validation = validateVendaRealizadaData({
        valor_venda: form.valor_venda,
        tipo_plano: form.tipo_plano,
        valor_base_plano: form.valor_base_plano
      })
      
      error(
        "Dados Obrigatórios", 
        `Preencha os campos:\n• ${validation.missingFields.join('\n• ')}`
      )
    }
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

          // VALIDAÇÃO ESPECIAL: Se tentando marcar como "Vendas Realizadas", verificar dados obrigatórios
      if (form.etapa === 'Vendas Realizadas') {
        const validation = validateVendaRealizadaData({
          valor_venda: form.valor_venda,
          tipo_plano: form.tipo_plano,
          valor_base_plano: form.valor_base_plano
        })
        
        if (!validation.isValid) {
          // Usar novo sistema de toast
          error(
            "Dados Obrigatórios",
            `Preencha os campos:\n• ${validation.missingFields.join('\n• ')}`
          )
          return
        }
      }

    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured. Cannot save changes.')
      console.log('Configuração do banco de dados não encontrada.')
      return
    }

    setLoading(true)
    try {
      await refreshSchemaCache()
      
      const updateData: any = {
        nome: form.nome,
        email: form.email || null,
        telefone: form.telefone || null,
        empresa: form.empresa || null,
        origem: form.origem || null,
        sdr_id: form.sdr_id ? parseInt(form.sdr_id) : null,
        closer_id: form.closer_id ? parseInt(form.closer_id) : null,
        etapa: form.etapa,
        endereco: form.endereco || null,
        valor_venda: form.valor_venda ? parseFloat(form.valor_venda.toString()) : null,
        tipo_plano: form.tipo_plano || null,
        valor_base_plano: form.valor_base_plano ? parseFloat(form.valor_base_plano.toString()) : null
      }

      // LÓGICA DE FECHAMENTO E LIMPEZA
      if (form.etapa === 'Vendas Realizadas' && form.valor_venda) {
        // Se etapa é "Vendas Realizadas" e tem valor, preencher data de fechamento
        updateData.data_fechamento = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      } else if (cliente.etapa === 'Vendas Realizadas' && form.etapa !== 'Vendas Realizadas') {
        // Se estava em "Vendas Realizadas" e está saindo, limpar dados de fechamento
        console.log(`Cliente ${cliente.id}: Saindo de "Vendas Realizadas" para "${form.etapa}" - Limpando dados de fechamento`)
        updateData.valor_venda = null
        updateData.data_fechamento = null
        updateData.tipo_plano = null
        updateData.valor_base_plano = null
        
        // Atualizar formulário local também
        setForm(prev => ({
          ...prev,
          valor_venda: '',
          tipo_plano: '',
          valor_base_plano: ''
        }))
      }

      const updatedCliente = await updateCliente(cliente.id, updateData)
      
      if (updatedCliente) {
        console.log('Cliente updated successfully:', updatedCliente)
        setIsEditing(false)
        onClienteUpdated?.()
        success("Cliente Atualizado", "As informações do cliente foram salvas com sucesso!")
      } else {
        throw new Error('Failed to update cliente')
      }
          } catch (err) {
        console.error('Error updating cliente:', err)
        error("Erro ao Atualizar", "Não foi possível salvar as alterações. Tente novamente.")
      } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original values
    if (cliente) {
      setForm({
        nome: cliente.nome || '',
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        empresa: cliente.empresa || '',
        origem: cliente.origem || '',
        sdr_id: cliente.sdr_id ? cliente.sdr_id.toString() : '',
        closer_id: cliente.closer_id ? cliente.closer_id.toString() : '',
        etapa: cliente.etapa,
        endereco: cliente.endereco || '',
        valor_venda: cliente.valor_venda || '',
        tipo_plano: cliente.tipo_plano || '',
        valor_base_plano: cliente.valor_base_plano || '',
        usar_valor_base_para_venda: cliente.valor_venda === cliente.valor_base_plano
      })
    }
    setIsEditing(false)
  }

  if (!isOpen) return null

  // Filter colaboradores by role
  const sdrColaboradores = colaboradores.filter(c => {
    const role = c.funcao.toLowerCase()
    return role === 'sdr' || role === 'sdr/closer'
  })
  const closerColaboradores = colaboradores.filter(c => {
    const role = c.funcao.toLowerCase()
    return role === 'closer' || role === 'sdr/closer'
  })

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate">Editar Cliente</DialogTitle>
                <DialogDescription className="truncate">Edite as informações do cliente</DialogDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
              <Badge className={getEtapaColor(cliente.etapa)} variant="outline">
                {cliente.etapa}
              </Badge>
              <span className="text-sm text-muted-foreground whitespace-nowrap">ID: #{cliente.id}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="truncate">Criado: {new Date(cliente.criado_em).toLocaleString('pt-BR')}</div>
              <div className="truncate">Atualizado: {new Date(cliente.atualizado_em).toLocaleString('pt-BR')}</div>
            </div>
            <div className="flex gap-2 sm:flex-shrink-0">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} disabled={loading} className="w-full sm:w-auto">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button onClick={handleCancel} variant="outline" disabled={loading} className="flex-1 sm:flex-none">
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    onClick={isSaveButtonEnabled() ? handleSave : handleDisabledSaveClick} 
                    disabled={loading || !isSaveButtonEnabled()} 
                    className="flex-1 sm:flex-none"
                    variant={!isSaveButtonEnabled() ? "secondary" : "default"}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {isEditing ? (
            /* Edit Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="nome" className="text-sm font-medium">Nome *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Nome completo"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                  disabled={loading}
                />
              </div>

                              <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-sm font-medium">Telefone</Label>
                  <PhoneInputField
                    value={form.telefone}
                    onChange={(value) => handleInputChange('telefone', value || '')}
                    placeholder="(11) 99999-9999"
                    disabled={loading}
                  />
                </div>

              <div className="space-y-2">
                <Label htmlFor="empresa" className="text-sm font-medium">Empresa</Label>
                <Input
                  id="empresa"
                  value={form.empresa}
                  onChange={(e) => handleInputChange('empresa', e.target.value)}
                  placeholder="Nome da empresa"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="origem" className="text-sm font-medium">Origem</Label>
                <Select
                  value={form.origem}
                  onValueChange={(value) => handleInputChange('origem', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent className="z-[1003]">
                    {origens.map((origem) => (
                      <SelectItem key={origem} value={origem}>
                        {origem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sdr" className="text-sm font-medium">SDR</Label>
                <Select
                  value={form.sdr_id || "none"}
                  onValueChange={(value) => handleInputChange('sdr_id', value === "none" ? "" : value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um SDR" />
                  </SelectTrigger>
                  <SelectContent className="z-[1003]">
                    <SelectItem value="none">Nenhum SDR</SelectItem>
                    {sdrColaboradores.map((colaborador) => (
                      <SelectItem key={colaborador.id} value={colaborador.id.toString()}>
                        {colaborador.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="closer" className="text-sm font-medium">Closer</Label>
                <Select
                  value={form.closer_id || "none"}
                  onValueChange={(value) => handleInputChange('closer_id', value === "none" ? "" : value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um Closer" />
                  </SelectTrigger>
                  <SelectContent className="z-[1003]">
                    <SelectItem value="none">Nenhum Closer</SelectItem>
                    {closerColaboradores.map((colaborador) => (
                      <SelectItem key={colaborador.id} value={colaborador.id.toString()}>
                        {colaborador.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="etapa" className="text-sm font-medium">Etapa</Label>
                <Select
                  value={form.etapa}
                  onValueChange={(value) => handleInputChange('etapa', value as EtapaEnum)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[1003]">
                    {etapas.map((etapa) => (
                      <SelectItem key={etapa} value={etapa}>
                        {etapa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campos de venda - só aparecem se etapa for "Vendas Realizadas" */}
              {form.etapa === 'Vendas Realizadas' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tipo_plano" className="text-sm font-medium">Tipo do Plano *</Label>
                    <Select
                      value={form.tipo_plano}
                      onValueChange={(value) => handleInputChange('tipo_plano', value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent className="z-[1003]">
                        {planos.map((plano) => (
                          <SelectItem key={plano.id} value={plano.periodo.toLowerCase()}>
                            {plano.periodo} - R$ {(plano.valor - plano.desconto).toFixed(2)} {plano.obs}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor_base_plano" className="text-sm font-medium">Valor Base do Plano (R$) *</Label>
                    <Input
                      id="valor_base_plano"
                      type="number"
                      value={form.valor_base_plano || ''}
                      placeholder="0,00"
                      min="0"
                      step="0.01"
                      disabled={loading}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Valor preenchido automaticamente baseado no tipo do plano selecionado
                    </p>
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="usar_valor_base"
                        checked={form.usar_valor_base_para_venda}
                        onChange={(e) => handleInputChange('usar_valor_base_para_venda', e.target.checked)}
                        disabled={loading}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <Label htmlFor="usar_valor_base" className="text-sm font-medium cursor-pointer">
                        Usar valor base para venda
                      </Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="valor_venda" className="text-sm font-medium">Valor da Venda (R$) *</Label>
                      <Input
                        id="valor_venda"
                        type="number"
                        value={form.valor_venda || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          handleInputChange('valor_venda', value ? parseFloat(value) : '')
                          // Se mudou manualmente o valor, desmarcar o checkbox
                          if (value && parseFloat(value) !== parseFloat(form.valor_base_plano?.toString() || '0')) {
                            handleInputChange('usar_valor_base_para_venda', false)
                          }
                        }}
                        placeholder="0,00"
                        min="0"
                        step="0.01"
                        disabled={loading || form.usar_valor_base_para_venda}
                      />
                      {form.usar_valor_base_para_venda && (
                        <p className="text-xs text-muted-foreground">
                          Valor preenchido automaticamente com o valor base do plano
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="endereco" className="text-sm font-medium">Endereço</Label>
                <Input
                  id="endereco"
                  value={form.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  placeholder="Endereço completo"
                  disabled={loading}
                />
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{cliente.nome}</div>
                    <div className="text-sm text-muted-foreground">Nome completo</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{cliente.email || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">Email</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{cliente.telefone || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">Telefone</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{cliente.empresa || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">Empresa</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{cliente.endereco || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">Endereço</div>
                  </div>
                </div>

                {cliente.valor_venda && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{formatCurrency(cliente.valor_venda)}</div>
                      <div className="text-sm text-muted-foreground">Valor da venda</div>
                    </div>
                  </div>
                )}

                {cliente.tipo_plano && (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{cliente.tipo_plano}</div>
                      <div className="text-sm text-muted-foreground">Tipo do plano</div>
                    </div>
                  </div>
                )}

                {cliente.data_fechamento && (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{new Date(cliente.data_fechamento).toLocaleDateString('pt-BR')}</div>
                      <div className="text-sm text-muted-foreground">Data de fechamento</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
