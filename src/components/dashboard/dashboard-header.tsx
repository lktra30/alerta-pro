"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { EditGoalsPopover } from "./edit-goals-popover"
import { CommissionInfoModal } from "./commission-info-modal"

interface DashboardHeaderProps {
  onMenuClick?: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>
      </div>


      {/* Right side */}
      <div className="flex items-center gap-4">
        
        <div className="transform">
          <EditGoalsPopover />
        </div>

        <div className="transform">
          <CommissionInfoModal />
        </div>
        
        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  )
}
