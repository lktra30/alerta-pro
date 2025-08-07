"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"
import { Colaborador } from "@/types/database"
import { getColaboradores, isSupabaseConfigured } from "@/lib/supabase"
import { NovoColaboradorCard } from "./novo-colaborador-card"
import { ColaboradoresTable } from "./colaboradores-table"

export function ConfiguracoesPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [showNovoColaborador, setShowNovoColaborador] = useState(false)

  useEffect(() => {
    loadColaboradores()
  }, [])

  const loadColaboradores = async () => {
    setLoading(true)
    
    const data = await getColaboradores()
    setColaboradores(data)
    setLoading(false)
  }

  const handleColaboradorAdded = () => {
    setShowNovoColaborador(false)
    loadColaboradores()
  }

  const handleColaboradorUpdated = () => {
    loadColaboradores()
  }

  const handleColaboradorDeleted = () => {
    loadColaboradores()
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
            <p className="text-muted-foreground">
              Gerencie os colaboradores da sua empresa
            </p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Colaboradores
            </CardTitle>
            <CardDescription>
              Configure o Supabase para gerenciar colaboradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Para usar esta funcionalidade, você precisa configurar as variáveis de ambiente do Supabase.
            </p>
          </CardContent>
        </Card>
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
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configurações</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Gerencie os colaboradores da sua empresa
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Colaborador Card */}
      {showNovoColaborador && (
        <NovoColaboradorCard
          onCancel={() => setShowNovoColaborador(false)}
          onSuccess={handleColaboradorAdded}
        />
      )}

      {/* Colaboradores Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">Colaboradores</span>
              </CardTitle>
              <CardDescription className="mt-1">
                Gerencie os colaboradores da sua empresa
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowNovoColaborador(true)}
              className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Novo Colaborador</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ColaboradoresTable
            colaboradores={colaboradores}
            loading={loading}
            onUpdate={handleColaboradorUpdated}
            onDelete={handleColaboradorDeleted}
          />
        </CardContent>
      </Card>
    </div>
  )
}
