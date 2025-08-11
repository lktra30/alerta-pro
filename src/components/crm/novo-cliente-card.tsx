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
import { PhoneInputField } from "@/components/ui/phone-input"
import { Plus, Save, X, Loader2 } from "lucide-react"
import { createCliente, isSupabaseConfigured, getColaboradores, refreshSchemaCache, getPlanos } from "@/lib/supabase"
import { validateVendaRealizadaData } from "@/lib/validations"
import { useToast } from "@/components/ui/toast-provider"
import type { EtapaEnum, Colaborador } from "@/types/database"

interface NovoClienteForm {
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

interface NovoClienteCardProps {
  onClienteAdicionado?: () => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function NovoClienteCard({ onClienteAdicionado, isOpen, onOpenChange }: NovoClienteCardProps) {
  const [loading, setLoading] = useState(false)
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const { success, error } = useToast()
  const [form, setForm] = useState<NovoClienteForm>({
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

  const handleInputChange = (field: keyof NovoClienteForm, value: string | number | boolean) => {
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
      if (field === 'valor_base_plano' && newForm.usar_valor_base_para_venda) {
        newForm.valor_venda = typeof value === 'number' || typeof value === 'string' ? value : undefined
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



  const resetForm = () => {
    setForm({
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
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    // VALIDAÇÃO ESPECIAL: Se tentando criar como "Vendas Realizadas", verificar dados obrigatórios
    if (form.etapa === 'Vendas Realizadas') {
      const validation = validateVendaRealizadaData({
        valor_venda: form.valor_venda,
        tipo_plano: form.tipo_plano,
        valor_base_plano: form.valor_base_plano
      })
      
              if (!validation.isValid) {
          // REMOVIDO: showValidationAlert - usar console.log por enquanto
          console.log('Validation failed:', validation.message)
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
      
      const clienteData: any = {
        nome: form.nome.trim(),
        email: form.email.trim() || null,
        telefone: form.telefone.trim() || null,
        empresa: form.empresa.trim() || null,
        origem: form.origem || null,
        sdr_id: form.sdr_id ? parseInt(form.sdr_id) : null,
        closer_id: form.closer_id ? parseInt(form.closer_id) : null,
        etapa: form.etapa,
        endereco: form.endereco.trim() || null,
        valor_venda: form.valor_venda ? parseFloat(form.valor_venda.toString()) : null,
        tipo_plano: form.tipo_plano || null,
        valor_base_plano: form.valor_base_plano ? parseFloat(form.valor_base_plano.toString()) : null
      }

      // Se etapa é "Vendas Realizadas" e tem valor, preencher data de fechamento
      if (form.etapa === 'Vendas Realizadas' && form.valor_venda) {
        clienteData.data_fechamento = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      }

      const novoCliente = await createCliente(clienteData)
      
      if (novoCliente) {
        console.log('Cliente criado com sucesso:', novoCliente)
        resetForm()
        onClienteAdicionado?.()
        onOpenChange(false)
        success("Cliente Criado", "O cliente foi adicionado com sucesso!")
      } else {
        throw new Error('Failed to create cliente')
      }
          } catch (err) {
        console.error('Error creating cliente:', err)
        error("Erro ao Criar Cliente", "Não foi possível criar o cliente. Tente novamente.")
      } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  // Filter colaboradores by role
  const sdrColaboradores = colaboradores.filter(c => c.funcao.toLowerCase() === 'sdr')
  const closerColaboradores = colaboradores.filter(c => c.funcao.toLowerCase() === 'closer')

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate">Novo Cliente</DialogTitle>
              <DialogDescription className="truncate">Adicione um novo cliente ao sistema</DialogDescription>
            </div>
          </div>
        </DialogHeader>

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

        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.nome.trim()}
            className="flex-1 order-2 sm:order-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Criar Cliente
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 order-1 sm:order-2"
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
