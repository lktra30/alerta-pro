"use client"

import { useState } from "react"
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
import { Info, Target, Calculator, TrendingUp, Users, Phone } from "lucide-react"

export function CommissionInfoModal() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="h-4 w-4" />
          Sistema de Comissão
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calculator className="h-6 w-6" />
            Sistema de Comissionamento por Checkpoints
          </DialogTitle>
          <DialogDescription className="text-base">
            Entenda como funciona o sistema de comissões baseado em checkpoints de performance e bonificações
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* Overview dos Checkpoints */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5" />
                Como Funcionam os Checkpoints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                O sistema possui <strong>4 níveis</strong> baseados no percentual da meta mensal atingida. 
                Abaixo de 20% da meta, não há comissão. A partir de 20%, recebe frações dos valores fixos.
              </p>
              
              <div className="grid gap-4 lg:grid-cols-4">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border-l-4 border-l-gray-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-500 text-white text-sm flex items-center justify-center font-bold">
                      0
                    </div>
                    <h4 className="font-semibold">Sem Comissão</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">0% - 19% da Meta</p>
                  <Badge variant="secondary" className="bg-gray-50 text-gray-700">R$ 0,00</Badge>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border-l-4 border-l-red-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-red-500 text-white text-sm flex items-center justify-center font-bold">
                      1
                    </div>
                    <h4 className="font-semibold">Checkpoint 1</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">20% - 64% da Meta</p>
                  <Badge variant="secondary" className="bg-red-50 text-red-700">1/3 dos valores fixos</Badge>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">
                      2
                    </div>
                    <h4 className="font-semibold">Checkpoint 2</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">65% - 99% da Meta</p>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">2/3 dos valores fixos</Badge>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border-l-4 border-l-green-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white text-sm flex items-center justify-center font-bold">
                      3
                    </div>
                    <h4 className="font-semibold">Checkpoint 3</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">100%+ da Meta</p>
                  <Badge variant="secondary" className="bg-green-50 text-green-700">Valores fixos completos</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comissões por Função */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* SDR */}
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5 text-orange-500" />
                  Comissão SDR
                </CardTitle>
                <CardDescription>Valores baseados em reuniões e checkpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Valores Fixos Máximos (Checkpoint 3):</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <span className="text-sm font-medium">Reunião Qualificada</span>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">R$ 5,00</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <span className="text-sm font-medium">Reunião que gerou venda</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">R$ 15,00</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Bônus Especial:</h4>
                  <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <span className="text-sm font-medium">Ao bater 100% da meta</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">R$ 300,00</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    * Bônus pago apenas se atingir no mínimo 100% da meta mensal
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h5 className="font-semibold text-sm mb-3">Exemplo de Cálculo:</h5>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div>• Abaixo de 20% da meta: R$ 0,00 (sem comissão)</div>
                    <div>• Checkpoint 1 (45% da meta): Reunião qualificada = R$ 1,67</div>
                    <div>• Checkpoint 2 (80% da meta): Reunião qualificada = R$ 3,33</div>
                    <div>• Checkpoint 3 (100% da meta): Reunião qualificada = R$ 5,00</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Closer */}
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-green-500" />
                  Comissão Closer
                </CardTitle>
                <CardDescription>Valores baseados em vendas e checkpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Valores Fixos Máximos (Checkpoint 3):</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <span className="text-sm font-medium">Plano Mensal</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">R$ 15,00</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                      <span className="text-sm font-medium">Plano Trimestral</span>
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">R$ 30,00</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <span className="text-sm font-medium">Plano Semestral</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">R$ 60,00</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-pink-50 dark:bg-pink-950 rounded-lg">
                      <span className="text-sm font-medium">Plano Anual</span>
                      <Badge variant="secondary" className="bg-pink-100 text-pink-700">R$ 100,00</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Bônus por Performance:</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-950 rounded">
                      <span className="text-sm">100% da meta</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">R$ 500,00</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-emerald-50 dark:bg-emerald-950 rounded">
                      <span className="text-sm">110% da meta</span>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">R$ 800,00</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-teal-50 dark:bg-teal-950 rounded">
                      <span className="text-sm">120% da meta</span>
                      <Badge variant="secondary" className="bg-teal-100 text-teal-700">R$ 1.000,00</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sistema de Bonificação */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Sistema de Bonificação por Venda Acima do Valor Base
              </CardTitle>
              <CardDescription>Ganhos extras quando o closer vende acima do preço padrão do plano</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
                  <div className="font-semibold text-blue-700 dark:text-blue-300">Mensal</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">+50%</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">bonificação</div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-lg">
                  <div className="font-semibold text-indigo-700 dark:text-indigo-300">Trimestral</div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">+75%</div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400">bonificação</div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-b from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg">
                  <div className="font-semibold text-purple-700 dark:text-purple-300">Semestral</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">+100%</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">bonificação</div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-b from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 rounded-lg">
                  <div className="font-semibold text-pink-700 dark:text-pink-300">Anual</div>
                  <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">+125%</div>
                  <div className="text-xs text-pink-600 dark:text-pink-400">bonificação</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-6 rounded-lg">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Exemplo Prático
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-white dark:bg-gray-900 p-4 rounded border-l-4 border-l-green-500">
                    <p className="font-semibold mb-2">Closer no Checkpoint 3 vendendo Plano Mensal:</p>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Valor base do plano: R$ 100</li>
                      <li>• Vendeu por: R$ 200 (100% acima do valor base)</li>
                      <li>• Comissão fixa: R$ 15,00</li>
                      <li>• Bonificação: 100% × 50% = 50% extra</li>
                      <li>• <strong className="text-green-600">Total: R$ 15,00 + (R$ 15,00 × 50%) = R$ 22,50</strong></li>
                    </ul>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-900 p-4 rounded border-l-4 border-l-blue-500">
                    <p className="font-semibold mb-2">Mesmo closer no Checkpoint 1 (45% da meta):</p>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Comissão fixa: R$ 5,00 (1/3 de R$ 15,00)</li>
                      <li>• Bonificação: 100% × 50% = 50% extra</li>
                      <li>• <strong className="text-blue-600">Total: R$ 5,00 + (R$ 5,00 × 50%) = R$ 7,50</strong></li>
                    </ul>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-900 p-4 rounded border-l-4 border-l-gray-500">
                    <p className="font-semibold mb-2">Closer com 15% da meta (abaixo de 20%):</p>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Comissão fixa: R$ 0,00 (sem comissão)</li>
                      <li>• Bonificação: Não aplicável</li>
                      <li>• <strong className="text-gray-600">Total: R$ 0,00</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          <Card className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
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
