"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, Target, Calculator, TrendingUp, Users, Phone, Loader2 } from "lucide-react"
import { getPlanos } from "@/lib/supabase"

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

export function CommissionInfoModal() {
  const [open, setOpen] = useState(false)
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlanos = async () => {
      try {
        setLoading(true)
        const data = await getPlanos()
        setPlanos(data)
      } catch (error) {
        console.error('Erro ao carregar planos:', error)
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      loadPlanos()
    }
  }, [open])

  // Função para calcular valor real do plano
  const getValorReal = (plano: Plano) => {
    return plano.valor - plano.desconto
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="h-4 w-4" />
          <span className="hidden sm:inline">Sistema de Comissão</span>
          <span className="sm:hidden">Comissão</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calculator className="h-5 w-5 sm:h-6 sm:w-6" />
            Sistema de Comissionamento por Checkpoints
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Entenda como funciona o sistema de comissões baseado em checkpoints de performance e bonificações
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 sm:space-y-8">
          {/* Overview dos Checkpoints */}
          <Card className="border-2">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                Como Funcionam os Checkpoints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                O sistema possui <strong>3 níveis</strong> baseados no percentual da meta mensal atingida. 
                Abaixo de 20% da meta, não há comissão. A partir de 20%, recebe frações dos valores fixos.
              </p>
              
              <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted-foreground text-background text-xs sm:text-sm flex items-center justify-center font-bold">
                      1
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm">Checkpoint 1</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">20% - 64% da Meta</p>
                  <Badge variant="secondary" className="text-xs">1/3 dos valores fixos</Badge>
                </div>

                <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted-foreground text-background text-xs sm:text-sm flex items-center justify-center font-bold">
                      2
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm">Checkpoint 2</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">65% - 99% da Meta</p>
                  <Badge variant="secondary" className="text-xs">2/3 dos valores fixos</Badge>
                </div>

                <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted-foreground text-background text-xs sm:text-sm flex items-center justify-center font-bold">
                      3
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm">Checkpoint 3</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">100%+ da Meta</p>
                  <Badge variant="secondary" className="text-xs">Valores fixos completos</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comissões por Função */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {/* SDR */}
            <Card className="border-2">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5" />
                  Comissão SDR
                </CardTitle>
                <CardDescription>Valores baseados em reuniões e checkpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Valores Fixos Máximos (Checkpoint 3):</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
                      <span className="text-sm font-medium">Reunião Qualificada</span>
                      <Badge variant="outline">R$ 5,00</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
                      <span className="text-sm font-medium">Reunião que gerou venda</span>
                      <Badge variant="outline">R$ 15,00</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Bônus Especial:</h4>
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
                    <span className="text-sm font-medium">Ao bater 100% da meta</span>
                    <Badge variant="outline">R$ 300,00</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    * Bônus pago apenas se atingir no mínimo 100% da meta mensal
                  </p>
                </div>

                <div className="bg-muted/20 p-4 rounded-lg border">
                  <h5 className="font-semibold text-sm mb-3">Exemplo de Cálculo:</h5>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div>• Abaixo de 20% da meta: R$ 0,00 (sem comissão)</div>
                    <div>• Checkpoint 1 (20-64% da meta): Reunião qualificada = R$ 1,67</div>
                    <div>• Checkpoint 2 (65-99% da meta): Reunião qualificada = R$ 3,33</div>
                    <div>• Checkpoint 3 (100%+ da meta): Reunião qualificada = R$ 5,00</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Closer */}
            <Card className="border-2">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Comissão Closer
                </CardTitle>
                <CardDescription>Valores baseados em vendas e checkpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Valores Fixos Máximos (Checkpoint 3):</h4>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                  
                  <div className="space-y-3">
                    {loading ? (
                      <div className="space-y-2">
                        <div className="h-12 bg-muted/30 rounded-lg animate-pulse"></div>
                        <div className="h-12 bg-muted/30 rounded-lg animate-pulse"></div>
                        <div className="h-12 bg-muted/30 rounded-lg animate-pulse"></div>
                        <div className="h-12 bg-muted/30 rounded-lg animate-pulse"></div>
                      </div>
                    ) : (
                      planos.map((plano) => (
                        <div key={plano.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">Plano {plano.periodo}</span>
                            {plano.obs && (
                              <span className="text-xs text-muted-foreground">{plano.obs}</span>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            <Badge variant="outline">
                              R$ {plano.periodo === 'Mensal' ? '15,00' : 
                                   plano.periodo === 'Trimestral' ? '30,00' :
                                   plano.periodo === 'Semestral' ? '60,00' : '100,00'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Valor real: R$ {getValorReal(plano).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Bônus por Performance:</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-muted/30 rounded border">
                      <span className="text-sm">100% da meta</span>
                      <Badge variant="outline">R$ 500,00</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/30 rounded border">
                      <span className="text-sm">110% da meta</span>
                      <Badge variant="outline">R$ 800,00</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/30 rounded border">
                      <span className="text-sm">120% da meta</span>
                      <Badge variant="outline">R$ 1.000,00</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sistema de Bonificação */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Sistema de Bonificação por Venda Acima do Valor Base
              </CardTitle>
              <CardDescription>Ganhos extras quando o closer vende acima do preço padrão do plano</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg border">
                  <div className="font-semibold">Mensal</div>
                  <div className="text-2xl font-bold">+50%</div>
                  <div className="text-xs text-muted-foreground">bonificação</div>
                </div>
                
                <div className="text-center p-4 bg-muted/30 rounded-lg border">
                  <div className="font-semibold">Trimestral</div>
                  <div className="text-2xl font-bold">+75%</div>
                  <div className="text-xs text-muted-foreground">bonificação</div>
                </div>
                
                <div className="text-center p-4 bg-muted/30 rounded-lg border">
                  <div className="font-semibold">Semestral</div>
                  <div className="text-2xl font-bold">+100%</div>
                  <div className="text-xs text-muted-foreground">bonificação</div>
                </div>
                
                <div className="text-center p-4 bg-muted/30 rounded-lg border">
                  <div className="font-semibold">Anual</div>
                  <div className="text-2xl font-bold">+125%</div>
                  <div className="text-xs text-muted-foreground">bonificação</div>
                </div>
              </div>

              <div className="bg-muted/20 p-6 rounded-lg border">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Exemplo Prático
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-background p-4 rounded border">
                    <p className="font-semibold mb-2">Closer no Checkpoint 3 vendendo Plano Mensal:</p>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Valor real do plano: R$ 99,90</li>
                      <li>• Vendeu por: R$ 200 (100% acima do valor base)</li>
                      <li>• Comissão fixa: R$ 15,00</li>
                      <li>• Bonificação: 100% × 50% = 50% extra</li>
                      <li>• <strong className="text-foreground">Total: R$ 15,00 + (R$ 15,00 × 50%) = R$ 22,50</strong></li>
                    </ul>
                  </div>
                  
                  <div className="bg-background p-4 rounded border">
                    <p className="font-semibold mb-2">Mesmo closer no Checkpoint 1 (20-64% da meta):</p>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Comissão fixa: R$ 5,00 (1/3 de R$ 15,00)</li>
                      <li>• Bonificação: 100% × 50% = 50% extra</li>
                      <li>• <strong className="text-foreground">Total: R$ 5,00 + (R$ 5,00 × 50%) = R$ 7,50</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">📋 Resumo do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Como funciona:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    <li>• Abaixo de 20% da meta = zero comissão</li>
                    <li>• Checkpoint determinado pelo % da meta mensal atingida</li>
                    <li>• Valores fixos multiplicados pela fração do checkpoint</li>
                    <li>• Bonificação aplicada sobre o valor atual do checkpoint</li>
                    <li>• Bônus especiais apenas acima de 100% da meta</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Importante:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    <li>• Checkpoint é recalculado mensalmente</li>
                    <li>• Bonificação baseada no valor de venda acima do padrão</li>
                    <li>• Valores se ajustam automaticamente ao subir checkpoint</li>
                    <li>• Bônus de meta são valores adicionais fixos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
