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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie os colaboradores da sua empresa
          </p>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Colaboradores
              </CardTitle>
              <CardDescription>
                Gerencie os colaboradores da sua empresa
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowNovoColaborador(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Colaborador
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
