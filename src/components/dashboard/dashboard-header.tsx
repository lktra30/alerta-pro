"use client"

import { useState } from "react"
import { Menu, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { EditGoalsPopover } from "./edit-goals-popover"
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
    <header className="flex h-16 items-center justify-between border-b bg-background px-3 sm:px-6">
      {/* Left side */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">Dashboard</h1>
        </div>
      </div>


      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Desktop - Editar Metas */}
        <div className="hidden sm:block">
          <EditGoalsPopover />
        </div>

        {/* Sistema de Comissão */}
        <div className="flex">
          <CommissionInfoModal />
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="sm:hidden"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[350px]">
            <SheetHeader>
              <SheetTitle>Configurações</SheetTitle>
              <SheetDescription>
                Gerencie as configurações do dashboard
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-2">
              <EditGoalsPopover />
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* User Navigation */}
        <UserNav />
      </div>
    </header>
  )
}
