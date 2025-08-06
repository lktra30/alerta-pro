"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { setNovaComissaoConfig, type NovaComissaoConfig } from "@/lib/novo-comissionamento"

interface NovaConfiguracaoComissaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentConfig: NovaComissaoConfig
  onConfigSaved: (config: NovaComissaoConfig) => void
}

export function NovaConfiguracaoComissao({
  open,
  onOpenChange,
  currentConfig,
  onConfigSaved
}: NovaConfiguracaoComissaoProps) {
  // Estados para SDR
  const [sdrReuniaQualificada, setSdrReuniaQualificada] = useState(currentConfig.sdr.reuniao_qualificada.toString())
  const [sdrReuniaoGerou, setSdrReuniaoGerou] = useState(currentConfig.sdr.reuniao_gerou_venda.toString())
  const [sdrBonus100, setSdrBonus100] = useState(currentConfig.sdr.bonus_meta_100.toString())

  // Estados para Closer - Valores Fixos
  const [closerMensal, setCloserMensal] = useState(currentConfig.closer.valores_fixos.mensal.toString())
  const [closerTrimestral, setCloserTrimestral] = useState(currentConfig.closer.valores_fixos.trimestral.toString())
  const [closerSemestral, setCloserSemestral] = useState(currentConfig.closer.valores_fixos.semestral.toString())
  const [closerAnual, setCloserAnual] = useState(currentConfig.closer.valores_fixos.anual.toString())

  // Estados para Closer - Bônus Meta
  const [closerBonus100, setCloserBonus100] = useState(currentConfig.closer.bonus_meta.meta_100.toString())
  const [closerBonus110, setCloserBonus110] = useState(currentConfig.closer.bonus_meta.meta_110.toString())
  const [closerBonus120, setCloserBonus120] = useState(currentConfig.closer.bonus_meta.meta_120.toString())

  // Estados para Planos - Valores Base
  const [planoMensalBase, setPlanoMensalBase] = useState(currentConfig.planos.mensal.valor_base.toString())
  const [planoTrimestralBase, setPlanoTrimestralBase] = useState(currentConfig.planos.trimestral.valor_base.toString())
  const [planoSemestralBase, setPlanoSemestralBase] = useState(currentConfig.planos.semestral.valor_base.toString())
  const [planoAnualBase, setPlanoAnualBase] = useState(currentConfig.planos.anual.valor_base.toString())

  // Estados para Planos - Fatores de Bonificação
  const [planoMensalFator, setPlanoMensalFator] = useState(currentConfig.planos.mensal.fator_bonificacao.toString())
  const [planoTrimestralFator, setPlanoTrimestralFator] = useState(currentConfig.planos.trimestral.fator_bonificacao.toString())
  const [planoSemestralFator, setPlanoSemestralFator] = useState(currentConfig.planos.semestral.fator_bonificacao.toString())
  const [planoAnualFator, setPlanoAnualFator] = useState(currentConfig.planos.anual.fator_bonificacao.toString())

  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const newConfig: NovaComissaoConfig = {
        sdr: {
          reuniao_qualificada: parseFloat(sdrReuniaQualificada) || 0,
          reuniao_gerou_venda: parseFloat(sdrReuniaoGerou) || 0,
          bonus_meta_100: parseFloat(sdrBonus100) || 0
        },
        closer: {
          valores_fixos: {
            mensal: parseFloat(closerMensal) || 0,
            trimestral: parseFloat(closerTrimestral) || 0,
            semestral: parseFloat(closerSemestral) || 0,
            anual: parseFloat(closerAnual) || 0
          },
          bonus_meta: {
            meta_100: parseFloat(closerBonus100) || 0,
            meta_110: parseFloat(closerBonus110) || 0,
            meta_120: parseFloat(closerBonus120) || 0
          }
        },
        planos: {
          mensal: { 
            valor_base: parseFloat(planoMensalBase) || 0, 
            periodo_meses: 1, 
            fator_bonificacao: parseFloat(planoMensalFator) || 0 
          },
          trimestral: { 
            valor_base: parseFloat(planoTrimestralBase) || 0, 
            periodo_meses: 3, 
            fator_bonificacao: parseFloat(planoTrimestralFator) || 0 
          },
          semestral: { 
            valor_base: parseFloat(planoSemestralBase) || 0, 
            periodo_meses: 6, 
            fator_bonificacao: parseFloat(planoSemestralFator) || 0 
          },
          anual: { 
            valor_base: parseFloat(planoAnualBase) || 0, 
            periodo_meses: 12, 
            fator_bonificacao: parseFloat(planoAnualFator) || 0 
          }
        },
        checkpoints: currentConfig.checkpoints
      }

      setNovaComissaoConfig(newConfig)
      onConfigSaved(newConfig)
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving configuration:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações de Comissionamento</DialogTitle>
          <DialogDescription>
            Configure os valores e percentuais para o cálculo das comissões de SDRs e Closers
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="sdr" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sdr">SDR</TabsTrigger>
            <TabsTrigger value="closer">Closer</TabsTrigger>
            <TabsTrigger value="planos">Planos</TabsTrigger>
          </TabsList>

          <TabsContent value="sdr" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="sdr-reuniao-qualificada">Comissão por Reunião Qualificada (R$)</Label>
                <Input
                  id="sdr-reuniao-qualificada"
                  value={sdrReuniaQualificada}
                  onChange={(e) => setSdrReuniaQualificada(e.target.value)}
                  placeholder="5.00"
                  type="number"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sdr-reuniao-gerou">Comissão por Reunião que Gerou Venda (R$)</Label>
                <Input
                  id="sdr-reuniao-gerou"
                  value={sdrReuniaoGerou}
                  onChange={(e) => setSdrReuniaoGerou(e.target.value)}
                  placeholder="15.00"
                  type="number"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sdr-bonus-100">Bônus ao Bater 100% da Meta (R$)</Label>
                <Input
                  id="sdr-bonus-100"
                  value={sdrBonus100}
                  onChange={(e) => setSdrBonus100(e.target.value)}
                  placeholder="300.00"
                  type="number"
                  step="0.01"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="closer" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Valores Fixos por Tipo de Plano</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="closer-mensal">Plano Mensal (R$)</Label>
                    <Input
                      id="closer-mensal"
                      value={closerMensal}
                      onChange={(e) => setCloserMensal(e.target.value)}
                      placeholder="15.00"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closer-trimestral">Plano Trimestral (R$)</Label>
                    <Input
                      id="closer-trimestral"
                      value={closerTrimestral}
                      onChange={(e) => setCloserTrimestral(e.target.value)}
                      placeholder="30.00"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closer-semestral">Plano Semestral (R$)</Label>
                    <Input
                      id="closer-semestral"
                      value={closerSemestral}
                      onChange={(e) => setCloserSemestral(e.target.value)}
                      placeholder="60.00"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closer-anual">Plano Anual (R$)</Label>
                    <Input
                      id="closer-anual"
                      value={closerAnual}
                      onChange={(e) => setCloserAnual(e.target.value)}
                      placeholder="100.00"
                      type="number"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Bônus por Meta Atingida</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="closer-bonus-100">100% da Meta (R$)</Label>
                    <Input
                      id="closer-bonus-100"
                      value={closerBonus100}
                      onChange={(e) => setCloserBonus100(e.target.value)}
                      placeholder="500.00"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closer-bonus-110">110% da Meta (R$)</Label>
                    <Input
                      id="closer-bonus-110"
                      value={closerBonus110}
                      onChange={(e) => setCloserBonus110(e.target.value)}
                      placeholder="800.00"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closer-bonus-120">120% da Meta (R$)</Label>
                    <Input
                      id="closer-bonus-120"
                      value={closerBonus120}
                      onChange={(e) => setCloserBonus120(e.target.value)}
                      placeholder="1000.00"
                      type="number"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="planos" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Valores Base dos Planos</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="plano-mensal-base">Plano Mensal - Valor Base (R$)</Label>
                    <Input
                      id="plano-mensal-base"
                      value={planoMensalBase}
                      onChange={(e) => setPlanoMensalBase(e.target.value)}
                      placeholder="100.00"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plano-trimestral-base">Plano Trimestral - Valor Base (R$)</Label>
                    <Input
                      id="plano-trimestral-base"
                      value={planoTrimestralBase}
                      onChange={(e) => setPlanoTrimestralBase(e.target.value)}
                      placeholder="270.00"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plano-semestral-base">Plano Semestral - Valor Base (R$)</Label>
                    <Input
                      id="plano-semestral-base"
                      value={planoSemestralBase}
                      onChange={(e) => setPlanoSemestralBase(e.target.value)}
                      placeholder="480.00"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plano-anual-base">Plano Anual - Valor Base (R$)</Label>
                    <Input
                      id="plano-anual-base"
                      value={planoAnualBase}
                      onChange={(e) => setPlanoAnualBase(e.target.value)}
                      placeholder="840.00"
                      type="number"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Fatores de Bonificação (%)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Percentual aplicado sobre o valor vendido acima do preço base
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="plano-mensal-fator">Plano Mensal - Fator (%)</Label>
                    <Input
                      id="plano-mensal-fator"
                      value={planoMensalFator}
                      onChange={(e) => setPlanoMensalFator(e.target.value)}
                      placeholder="50"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plano-trimestral-fator">Plano Trimestral - Fator (%)</Label>
                    <Input
                      id="plano-trimestral-fator"
                      value={planoTrimestralFator}
                      onChange={(e) => setPlanoTrimestralFator(e.target.value)}
                      placeholder="75"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plano-semestral-fator">Plano Semestral - Fator (%)</Label>
                    <Input
                      id="plano-semestral-fator"
                      value={planoSemestralFator}
                      onChange={(e) => setPlanoSemestralFator(e.target.value)}
                      placeholder="100"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plano-anual-fator">Plano Anual - Fator (%)</Label>
                    <Input
                      id="plano-anual-fator"
                      value={planoAnualFator}
                      onChange={(e) => setPlanoAnualFator(e.target.value)}
                      placeholder="125"
                      type="number"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Como funciona a bonificação:</h4>
                <p className="text-sm text-muted-foreground">
                  Exemplo: Plano mensal vendido por R$ 200 (valor base R$ 100)<br/>
                  • Percentual acima: 100% (vendeu pelo dobro)<br/>
                  • Bonificação: 100% × 50% = 50% adicional sobre a comissão base<br/>
                  • Se comissão base é R$ 15, ganha R$ 15 + (50% de R$ 15) = R$ 22,50
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
