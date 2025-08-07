"use client"

import { useState } from "react"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { EditGoalsModal } from "./edit-goals-modal"
import { CommissionInfoModal } from "./commission-info-modal"
import { UserNav } from "@/components/user-nav"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface DashboardHeaderProps {
  onMenuClick?: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="flex h-14 sm:h-16 items-center justify-between border-b bg-background px-3 sm:px-6">
      {/* Left side */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Espaço reservado para breadcrumbs ou título da página específica no futuro */}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
        
        {/* Desktop - Editar Metas */}
        <div className="hidden lg:block">
          <EditGoalsModal variant="button" />
        </div>

        {/* Desktop - Sistema de Comissão */}
        <div className="hidden md:flex">
          <CommissionInfoModal />
        </div>

        {/* Tablet - apenas ícone de comissão */}
        <div className="hidden sm:block md:hidden">
          <CommissionInfoModal />
        </div>

        {/* Theme Toggle - sempre visível mas menor no mobile */}
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
        
        {/* User Navigation - sempre visível */}
        <UserNav />

        {/* Mobile Menu - mais funcionalidades */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="sm:hidden h-8 w-8"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] p-6">
            <SheetHeader className="text-left">
              <SheetTitle className="text-left">Menu</SheetTitle>
              <SheetDescription className="text-left">
                Configurações e ferramentas do dashboard
              </SheetDescription>
            </SheetHeader>
            <div className="mt-8 space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground px-1">Ferramentas</h4>
                <div className="space-y-3">
                  <EditGoalsModal 
                    variant="button" 
                    trigger={
                      <Button variant="outline" className="w-full justify-start gap-3 h-11">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Editar Metas
                      </Button>
                    }
                  />
                  <CommissionInfoModal 
                    trigger={
                      <Button variant="outline" className="w-full justify-start gap-3 h-11">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Sistema de Comissão
                      </Button>
                    }
                  />
                </div>
              </div>
              
              <div className="space-y-4 pt-6 border-t">
                <h4 className="text-sm font-medium text-muted-foreground px-1">Configurações</h4>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm font-medium">Tema</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
