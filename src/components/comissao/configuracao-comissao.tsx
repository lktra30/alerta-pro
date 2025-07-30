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
import { setComissaoConfig, ComissaoConfig } from "@/lib/supabase"

interface ConfiguracaoComissaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentConfig: ComissaoConfig
  onConfigSaved: (config: ComissaoConfig) => void
}

export function ConfiguracaoComissao({
  open,
  onOpenChange,
  currentConfig,
  onConfigSaved
}: ConfiguracaoComissaoProps) {
  const [sdrRank1, setSdrRank1] = useState(currentConfig.sdr.rank1.toString())
  const [sdrRank2, setSdrRank2] = useState(currentConfig.sdr.rank2.toString())
  const [sdrRank3, setSdrRank3] = useState(currentConfig.sdr.rank3.toString())
  
  const [closerRank1, setCloserRank1] = useState(currentConfig.closer.rank1.toString())
  const [closerRank2, setCloserRank2] = useState(currentConfig.closer.rank2.toString())
  const [closerRank3, setCloserRank3] = useState(currentConfig.closer.rank3.toString())
  
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const newConfig: ComissaoConfig = {
        sdr: {
          rank1: parseFloat(sdrRank1) || 0,
          rank2: parseFloat(sdrRank2) || 0,
          rank3: parseFloat(sdrRank3) || 0
        },
        closer: {
          rank1: parseFloat(closerRank1) || 0,
          rank2: parseFloat(closerRank2) || 0,
          rank3: parseFloat(closerRank3) || 0
        }
      }
      
      setComissaoConfig(newConfig)
      onConfigSaved(newConfig)
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving config:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar Comissões por Rank</DialogTitle>
          <DialogDescription>
            Defina os percentuais de comissão para cada rank e tipo de colaborador
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="sdr" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sdr">SDR</TabsTrigger>
            <TabsTrigger value="closer">Closer</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sdr" className="space-y-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="sdr-rank1">Rank 1 (0-25% da meta) (%)</Label>
                <Input
                  id="sdr-rank1"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={sdrRank1}
                  onChange={(e) => setSdrRank1(e.target.value)}
                  placeholder="Ex: 3"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="sdr-rank2">Rank 2 (26-60% da meta) (%)</Label>
                <Input
                  id="sdr-rank2"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={sdrRank2}
                  onChange={(e) => setSdrRank2(e.target.value)}
                  placeholder="Ex: 5"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="sdr-rank3">Rank 3 (61-100%+ da meta) (%)</Label>
                <Input
                  id="sdr-rank3"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={sdrRank3}
                  onChange={(e) => setSdrRank3(e.target.value)}
                  placeholder="Ex: 7"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="closer" className="space-y-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="closer-rank1">Rank 1 (0-25% da meta) (%)</Label>
                <Input
                  id="closer-rank1"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={closerRank1}
                  onChange={(e) => setCloserRank1(e.target.value)}
                  placeholder="Ex: 6"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="closer-rank2">Rank 2 (26-60% da meta) (%)</Label>
                <Input
                  id="closer-rank2"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={closerRank2}
                  onChange={(e) => setCloserRank2(e.target.value)}
                  placeholder="Ex: 10"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="closer-rank3">Rank 3 (61-100%+ da meta) (%)</Label>
                <Input
                  id="closer-rank3"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={closerRank3}
                  onChange={(e) => setCloserRank3(e.target.value)}
                  placeholder="Ex: 15"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
