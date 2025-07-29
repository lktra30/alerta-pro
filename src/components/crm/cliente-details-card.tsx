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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Save, X, Loader2, User, Mail, Phone, Building, MapPin, DollarSign } from "lucide-react"
import { updateCliente, isSupabaseConfigured } from "@/lib/supabase"
import { Cliente, EtapaEnum } from "@/types/database"

interface ClienteForm {
  nome: string
  email: string
  telefone: string
  empresa: string
  origem: string
  sdr_id: string
  closer_id: string
  etapa: EtapaEnum
  endereco: string
  valor_venda?: number | string
}

const etapas: EtapaEnum[] = [
  'Prospecção',
  'Contato Feito',
  'Reunião Agendada',
  'Proposta Enviada',
  'Fechado - Ganhou',
  'Fechado - Perdido'
]

const origens = [
  'Google Ads',
  'Facebook Ads',
  'LinkedIn',
  'Indicação',
  'Site',
  'Telefone',
  'Email',
  'Evento',
  'Outros'
]

// SDR and Closer names are now stored directly as strings in the database

const getEtapaColor = (etapa: EtapaEnum) => {
  switch (etapa) {
    case 'Prospecção':
      return 'bg-gray-100 text-gray-800'
    case 'Contato Feito':
      return 'bg-blue-100 text-blue-800'
    case 'Reunião Agendada':
      return 'bg-yellow-100 text-yellow-800'
    case 'Proposta Enviada':
      return 'bg-purple-100 text-purple-800'
    case 'Fechado - Ganhou':
      return 'bg-green-100 text-green-800'
    case 'Fechado - Perdido':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

interface ClienteDetailsCardProps {
  cliente: Cliente | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onClienteUpdated?: () => void
}

export function ClienteDetailsCard({ cliente, isOpen, onOpenChange, onClienteUpdated }: ClienteDetailsCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<ClienteForm>({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    origem: '',
    sdr_id: '',
    closer_id: '',
    etapa: 'Prospecção',
    endereco: '',
    valor_venda: ''
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
        sdr_id: cliente.sdr_id || '',
        closer_id: cliente.closer_id || '',
        etapa: cliente.etapa,
        endereco: cliente.endereco || '',
        valor_venda: cliente.valor_venda || ''
      })
    }
  }, [cliente])

  const handleInputChange = (field: keyof ClienteForm, value: string | number) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Format phone number as user types
  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Apply mask: (XX) XXXXX-XXXX
    if (digits.length <= 11) {
      return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
        .replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
        .replace(/(\d{2})(\d{0,5})/, '($1) $2')
        .replace(/(\d*)/, '$1')
    }
    return value
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSdrName = (name: string | null | undefined) => {
    return name || 'N/A'
  }

  const getCloserName = (name: string | null | undefined) => {
    return name || 'N/A'
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (cliente) {
      // Reset form to original values
      setForm({
        nome: cliente.nome || '',
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        empresa: cliente.empresa || '',
        origem: cliente.origem || '',
        sdr_id: cliente.sdr_id || '',
        closer_id: cliente.closer_id || '',
        etapa: cliente.etapa,
        endereco: cliente.endereco || '',
        valor_venda: cliente.valor_venda || ''
      })
    }
  }

  const handleClose = () => {
    setIsEditing(false)
    onOpenChange(false)
  }

  const handleSave = async () => {
    if (!cliente) return

    // Basic validation
    if (!form.nome.trim()) {
      alert('Nome é obrigatório')
      return
    }

    setLoading(true)

    try {
      if (!isSupabaseConfigured()) {
        // Mock success for demo purposes
        console.log('Cliente atualizado (modo demo):', form)
        alert('Cliente atualizado com sucesso! (Modo demo - configure o Supabase para salvar no banco)')
        setIsEditing(false)
        onClienteUpdated?.()
        return
      }

      const updateData = {
        nome: form.nome.trim(),
        email: form.email.trim() || null,
        telefone: form.telefone.trim() || null,
        empresa: form.empresa.trim() || null,
        origem: form.origem || null,
        sdr_id: form.sdr_id || null,
        closer_id: form.closer_id || null,
        etapa: form.etapa,
        endereco: form.endereco.trim() || null,
        valor_venda: typeof form.valor_venda === 'number' ? form.valor_venda : (form.valor_venda ? parseFloat(form.valor_venda.toString()) : null)
      }

      const result = await updateCliente(cliente.id, updateData)

      if (!result.success) {
        alert(`Erro ao atualizar cliente: ${result.error}`)
        return
      }

      console.log('Cliente atualizado com sucesso:', result.data)
      alert('Cliente atualizado com sucesso!')
      setIsEditing(false)
      onClienteUpdated?.()

    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      alert('Erro ao atualizar cliente. Verifique a conexão com o banco.')
    } finally {
      setLoading(false)
    }
  }

  if (!cliente) return null

  return (
    <>
      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[1001] flex items-center justify-center p-4"
             onClick={(e) => {
               if (e.target === e.currentTarget) {
                 handleClose()
               }
             }}
        >
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-[1002]"
                onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Edit className="h-5 w-5 text-blue-600" />
                      Editar Cliente
                    </>
                  ) : (
                    <>
                      <Eye className="h-5 w-5 text-green-600" />
                      Detalhes do Cliente
                    </>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      disabled={loading}
                      size="sm"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    disabled={loading}
                    className="h-8 w-8"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {isEditing ? 'Edite as informações do cliente' : 'Visualize as informações detalhadas do cliente'}
                {!isSupabaseConfigured() && (
                  <span className="block text-xs text-amber-600 mt-1">
                    ⚠️ Modo demo - configure o Supabase para salvar no banco
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status and Meta Info */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge className={getEtapaColor(cliente.etapa)}>
                    {cliente.etapa}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    ID: #{cliente.id}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div>Criado: {formatDate(cliente.criado_em)}</div>
                  <div>Atualizado: {formatDate(cliente.atualizado_em)}</div>
                </div>
              </div>

              {isEditing ? (
                /* Edit Mode */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={form.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      placeholder="Nome completo"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="email@exemplo.com"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={form.telefone}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value)
                        handleInputChange('telefone', formatted)
                      }}
                      placeholder="(11) 99999-9999"
                      disabled={loading}
                      maxLength={15}
                    />
                  </div>

                  <div>
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input
                      id="empresa"
                      value={form.empresa}
                      onChange={(e) => handleInputChange('empresa', e.target.value)}
                      placeholder="Nome da empresa"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="origem">Origem</Label>
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

                  <div>
                    <Label htmlFor="sdr">SDR</Label>
                    <Input
                      id="sdr"
                      value={form.sdr_id}
                      onChange={(e) => handleInputChange('sdr_id', e.target.value)}
                      placeholder="Nome do SDR"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="closer">Closer</Label>
                    <Input
                      id="closer"
                      value={form.closer_id}
                      onChange={(e) => handleInputChange('closer_id', e.target.value)}
                      placeholder="Nome do Closer"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="etapa">Etapa</Label>
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

                  <div>
                    <Label htmlFor="valor_venda">Valor da Venda (R$)</Label>
                    <Input
                      id="valor_venda"
                      type="number"
                      value={form.valor_venda || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        handleInputChange('valor_venda', value ? parseFloat(value) : '')
                      }}
                      placeholder="0,00"
                      min="0"
                      step="0.01"
                      disabled={loading}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{cliente.nome}</div>
                        <div className="text-sm text-muted-foreground">Nome completo</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{cliente.email || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">Email</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{cliente.telefone || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">Telefone</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{cliente.empresa || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">Empresa</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">O</span>
                      </div>
                      <div>
                        <div className="font-medium">{cliente.origem || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">Origem</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded bg-green-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-green-600">S</span>
                      </div>
                      <div>
                        <div className="font-medium">{getSdrName(cliente.sdr_id)}</div>
                        <div className="text-sm text-muted-foreground">SDR</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded bg-purple-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-purple-600">C</span>
                      </div>
                      <div>
                        <div className="font-medium">{getCloserName(cliente.closer_id)}</div>
                        <div className="text-sm text-muted-foreground">Closer</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {cliente.valor_venda ? formatCurrency(cliente.valor_venda) : 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">Valor da venda</div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                      <div>
                        <div className="font-medium">{cliente.endereco || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">Endereço</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons - only show in edit mode */}
              {isEditing && (
                <div className="flex gap-3 pt-6 border-t">
                  <Button
                    onClick={handleSave}
                    disabled={loading || !form.nome.trim()}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
