"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit, Trash2, User } from "lucide-react"
import { Colaborador } from "@/types/database"
import { updateColaborador, deleteColaborador } from "@/lib/supabase"

interface ColaboradoresTableProps {
  colaboradores: Colaborador[]
  loading: boolean
  onUpdate: () => void
  onDelete: () => void
}

export function ColaboradoresTable({ 
  colaboradores, 
  loading, 
  onUpdate, 
  onDelete 
}: ColaboradoresTableProps) {
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null)
  const [deletingColaborador, setDeletingColaborador] = useState<Colaborador | null>(null)
  const [editNome, setEditNome] = useState("")
  const [editFuncao, setEditFuncao] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState("")

  const handleEditClick = (colaborador: Colaborador) => {
    setEditingColaborador(colaborador)
    setEditNome(colaborador.nome)
    setEditFuncao(colaborador.funcao)
    setError("")
  }

  const handleEditSubmit = async () => {
    if (!editingColaborador || !editNome.trim() || !editFuncao.trim()) {
      setError("Nome e função são obrigatórios")
      return
    }

    setEditLoading(true)
    setError("")

    const result = await updateColaborador(editingColaborador.id, {
      nome: editNome.trim(),
      funcao: editFuncao.trim()
    })

    setEditLoading(false)

    if (result.success) {
      setEditingColaborador(null)
      onUpdate()
    } else {
      setError(result.error || "Erro ao atualizar colaborador")
    }
  }

  const handleDeleteClick = (colaborador: Colaborador) => {
    setDeletingColaborador(colaborador)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingColaborador) return

    setDeleteLoading(true)

    const result = await deleteColaborador(deletingColaborador.id)

    setDeleteLoading(false)

    if (result.success) {
      setDeletingColaborador(null)
      onDelete()
    } else {
      setError(result.error || "Erro ao excluir colaborador")
    }
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

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    )
  }

  if (colaboradores.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">Nenhum colaborador cadastrado</h3>
        <p className="text-muted-foreground">
          Clique em &quot;Novo Colaborador&quot; para adicionar o primeiro colaborador.
        </p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {colaboradores.map((colaborador) => (
            <TableRow key={colaborador.id}>
              <TableCell className="font-medium">
                {colaborador.nome}
              </TableCell>
              <TableCell>
                {colaborador.funcao}
              </TableCell>
              <TableCell>
                {formatDate(colaborador.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(colaborador)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(colaborador)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Dialog */}
      <Dialog open={!!editingColaborador} onOpenChange={() => setEditingColaborador(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Colaborador</DialogTitle>
            <DialogDescription>
              Atualize as informações do colaborador.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome *</Label>
              <Input
                id="edit-nome"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                disabled={editLoading}
                placeholder="Nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-funcao">Função *</Label>
              <Input
                id="edit-funcao"
                value={editFuncao}
                onChange={(e) => setEditFuncao(e.target.value)}
                disabled={editLoading}
                placeholder="Ex: Desenvolvedor, Designer, Gerente"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingColaborador(null)}
              disabled={editLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditSubmit} disabled={editLoading}>
              {editLoading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingColaborador} onOpenChange={() => setDeletingColaborador(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Colaborador</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o colaborador &quot;{deletingColaborador?.nome}&quot;?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeletingColaborador(null)}
              disabled={deleteLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm} 
              disabled={deleteLoading}
            >
              {deleteLoading ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
