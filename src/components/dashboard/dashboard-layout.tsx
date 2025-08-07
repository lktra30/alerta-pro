"use client"

import { useState } from "react"
import { DashboardHeader } from "./dashboard-header"
import { DashboardSidebar } from "./dashboard-sidebar"
import { MobileBottomNav } from "./mobile-bottom-nav"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar - Now Minimal */}
      <div className="hidden md:flex flex-shrink-0">
        <DashboardSidebar />
      </div>

      {/* Mobile Sidebar - Not used anymore since we have bottom nav */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de Navegação</SheetTitle>
            <SheetDescription>
              Menu principal de navegação do dashboard
            </SheetDescription>
          </SheetHeader>
          <DashboardSidebar className="w-full" />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-3 sm:p-6 pb-20 md:pb-6">
          <div className="max-w-full mx-auto">
            {children}
            {/* Espaço extra para mobile bottom nav */}
            <div className="h-8 md:hidden" aria-hidden="true" />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
