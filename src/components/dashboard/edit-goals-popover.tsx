"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, DollarSign, Users, Save, Edit, Loader2 } from "lucide-react"
import { getCurrentMonthMeta, getCurrentMonthMetaSdr, upsertMeta, upsertMetaSdr, isSupabaseConfigured, getWorkingDaysInMonth } from "@/lib/supabase"

interface GoalData {
  id: string
  title: string
  value: number
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const initialGoals: GoalData[] = [
  {
    id: "comercial",
    title: "Meta Comercial",
    value: 800000,
    description: "Meta mensal de vendas (MRR)",
    icon: DollarSign,
    color: "text-green-600"
  },
  {
    id: "sdr",
    title: "Meta SDR",
    value: 50,
    description: "Meta de reuniões marcadas",
    icon: Users,
    color: "text-purple-600"
  }
]

export function EditGoalsPopover() {
  const [goals, setGoals] = useState<GoalData[]>(initialGoals)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  // Load current month meta from Supabase on mount
  useEffect(() => {
    const loadCurrentMetas = async () => {
      if (!isSupabaseConfigured()) {
        return // Use default values if Supabase is not configured
      }

      try {
        setLoading(true)
        
        // Load metas in parallel (only comercial and sdr now)
        const [currentMeta, currentMetaSdr] = await Promise.all([
          getCurrentMonthMeta(),
          getCurrentMonthMetaSdr()
        ])
        
        // Update goals with the current meta values
        setGoals(prev => prev.map(goal => {
          if (goal.id === "comercial" && currentMeta?.valor_meta) {
            return { ...goal, value: currentMeta.valor_meta }
          } else if (goal.id === "sdr" && currentMetaSdr?.valor_meta) {
            return { ...goal, value: currentMetaSdr.valor_meta }
          }
          return goal
        }))
      } catch (error) {
        console.error('Error loading current metas:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCurrentMetas()
  }, [])

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`
    }
    return `R$ ${value.toLocaleString('pt-BR')}`
  }

  const formatValue = (goal: GoalData) => {
    if (goal.id === "sdr") {
      return `${goal.value} reuniões`
    }
    return formatCurrency(goal.value)
  }

  const handleEditStart = (goalId: string, currentValue: number) => {
    setEditingGoal(goalId)
    setTempValue(currentValue.toString())
  }

  const handleEditSave = async (goalId: string) => {
    const newValue = parseFloat(tempValue) || 0
    if (newValue < 0) {
      return // Don't allow negative values
    }
    
    setSaving(goalId)
    
    try {
      // Update local state
      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? { ...goal, value: newValue } : goal
      ))
      
      // If Supabase is configured, save to the appropriate database table
      if (isSupabaseConfigured()) {
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth() + 1
        
        let result
        
        if (goalId === "comercial") {
          result = await upsertMeta(currentYear, currentMonth, newValue)
        } else if (goalId === "sdr") {
          result = await upsertMetaSdr(currentYear, currentMonth, newValue)
        }
        
        if (result && !result.success) {
          console.warn('Failed to save to database:', result.error)
          // You could show a toast notification here
        } else if (result) {
          console.log(`Meta ${goalId} salva no banco de dados: ${newValue}`)
        }
      }
      
      setEditingGoal(null)
      setTempValue("")
      
      console.log(`Meta ${goalId} atualizada para: ${newValue}`)
    } catch (error) {
      console.error('Error saving goal:', error)
      // You could show an error toast here
    } finally {
      setSaving(null)
    }
  }

  const handleEditCancel = () => {
    setEditingGoal(null)
    setTempValue("")
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 hover:bg-secondary"
        >
          <Target className="h-4 w-4" />
          <span className="text-left">Editar Metas</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" side="right" align="start">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
              ) : (
                <Target className="h-5 w-5 text-green-600" />
              )}
              Editar Metas
            </CardTitle>
            <CardDescription>
              Configure as metas de desempenho da equipe
              {!isSupabaseConfigured() && (
                <span className="block text-xs text-amber-600 mt-1">
                  ⚠️ Modo offline - alterações não serão persistidas
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.map((goal) => {
              const IconComponent = goal.icon
              const isEditing = editingGoal === goal.id
              
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className={`h-4 w-4 ${goal.color}`} />
                      <Label htmlFor={goal.id} className="text-sm font-medium">
                        {goal.title}
                      </Label>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStart(goal.id, goal.value)}
                        disabled={saving !== null}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        id={goal.id}
                        type="number"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="flex-1 h-8"
                        placeholder="Digite o valor"
                        min="0"
                        step={goal.id === "sdr" ? "1" : "1000"}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleEditSave(goal.id)
                          } else if (e.key === "Escape") {
                            handleEditCancel()
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleEditSave(goal.id)}
                        disabled={saving === goal.id}
                        className="h-8 w-8 p-0"
                      >
                        {saving === goal.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditCancel}
                        disabled={saving === goal.id}
                        className="h-8 px-2"
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-muted/50 rounded-md p-2">
                      <div className="text-sm font-semibold text-foreground">
                        {formatValue(goal)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {goal.description}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            
            <div className="pt-4 border-t space-y-3">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                  📊 Resumo das Metas
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Meta Total: </span>
                    <span className="font-semibold">
                      {formatCurrency(goals.find(g => g.id === "comercial")?.value || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Meta Diária: </span>
                    <span className="font-semibold">
                      {(() => {
                        const metaComercial = goals.find(g => g.id === "comercial")?.value || 0
                        const currentDate = new Date()
                        const workingDays = getWorkingDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() + 1)
                        return formatCurrency(metaComercial / workingDays)
                      })()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground text-center">
                💡 Use Enter para salvar ou Esc para cancelar
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
