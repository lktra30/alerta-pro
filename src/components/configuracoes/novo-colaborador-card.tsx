"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { UserPlus, X } from "lucide-react"
import { createColaborador } from "@/lib/supabase"

interface NovoColaboradorCardProps {
  onCancel: () => void
  onSuccess: () => void
}

export function NovoColaboradorCard({ onCancel, onSuccess }: NovoColaboradorCardProps) {
  const [nome, setNome] = useState("")
  const [funcao, setFuncao] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nome.trim() || !funcao.trim()) {
      setError("Nome e função são obrigatórios")
      return
    }

    setLoading(true)
    setError("")

    const result = await createColaborador({
      nome: nome.trim(),
      funcao: funcao.trim()
    })

    setLoading(false)

    if (result.success) {
      onSuccess()
    } else {
      setError(result.error || "Erro ao criar colaborador")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Novo Colaborador
            </CardTitle>
            <CardDescription>
              Adicione um novo colaborador à sua equipe
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="funcao">Função *</Label>
              <Select
                value={funcao || undefined}
                onValueChange={(value) => setFuncao(value)}
                disabled={loading}
              >
                <SelectTrigger id="funcao">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SDR">SDR</SelectItem>
                  <SelectItem value="Closer">Closer</SelectItem>
                  <SelectItem value="SDR/Closer">SDR/Closer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar Colaborador"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
