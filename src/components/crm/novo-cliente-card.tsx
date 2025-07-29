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
import { Plus, Save, X, Loader2 } from "lucide-react"
import { createCliente, isSupabaseConfigured } from "@/lib/supabase"
import type { EtapaEnum } from "@/types/database"

interface NovoClienteForm {
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
  'Lead',
  'Leads Qualificados',
  'Agendados',
  'Reunioes Feitas',
  'Vendas Realizadas'
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

interface NovoClienteCardProps {
  onClienteAdicionado?: () => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function NovoClienteCard({ onClienteAdicionado, isOpen, onOpenChange }: NovoClienteCardProps) {
  const [loading, setLoading] = useState(false)
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
    valor_venda: ''
  })

  // Debug log when component mounts
  useEffect(() => {
    console.log('NovoClienteCard component mounted')
    console.log('Button should be visible at bottom-right corner')
  }, [])

  // Debug log when isOpen changes
  useEffect(() => {
    console.log('Modal open state changed:', isOpen)
  }, [isOpen])

  const handleInputChange = (field: keyof NovoClienteForm, value: string | number) => {
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
      valor_venda: ''
    })
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSave = async () => {
    // Basic validation - only name is required
    if (!form.nome.trim()) {
      alert('Nome é obrigatório')
      return
    }

    setLoading(true)

    try {
      if (!isSupabaseConfigured()) {
        // Mock success for demo purposes
        console.log('Cliente criado (modo demo):', form)
        alert('Cliente criado com sucesso! (Modo demo - configure o Supabase para salvar no banco)')
        resetForm()
        onOpenChange(false)
        onClienteAdicionado?.()
        return
      }

      const result = await createCliente({
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
      })

      if (!result.success) {
        alert(`Erro ao criar cliente: ${result.error}`)
        return
      }

      console.log('Cliente criado com sucesso:', result.data)
      alert('Cliente criado com sucesso!')
      resetForm()
      onOpenChange(false)
      onClienteAdicionado?.()

      // Optionally trigger a refresh of the parent component data
      window.dispatchEvent(new CustomEvent('clienteAdicionado'))

    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      alert('Erro ao salvar cliente. Verifique a conexão com o banco.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[1001] flex items-center justify-center p-4"
             onClick={(e) => {
               if (e.target === e.currentTarget) {
                 handleCancel()
               }
             }}
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-[1002]"
                onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  Novo Cliente
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  disabled={loading}
                  className="h-8 w-8"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Adicione um novo cliente ao sistema CRM
                {!isSupabaseConfigured() && (
                  <span className="block text-xs text-amber-600 mt-1">
                    ⚠️ Modo demo - configure o Supabase para salvar no banco
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      Salvar Cliente
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
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
