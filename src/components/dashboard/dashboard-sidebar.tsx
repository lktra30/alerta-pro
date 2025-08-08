"use client"

import { 
  LayoutDashboard, 
  Home, 
  Settings, 
  Users,
  DollarSign,
  Target,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import Image from "next/image"

const sidebarItems = [
  {
    title: "Visão Geral",
    icon: Home,
    href: "/"
  },
  {
    title: "Meta Ads",
    icon: Target,
    href: "/meta-ads"
  },
  {
    title: "Comissão",
    icon: DollarSign,
    href: "/comissao"
  },
  {
    title: "CRM",
    icon: Users,
    href: "/crm"
  },
  {
    title: "Configurações",
    icon: Settings,
    href: "/configuracoes"
  }
]

interface DashboardSidebarProps {
  className?: string
}

export function DashboardSidebar({ className }: DashboardSidebarProps = {}) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div 
      className={cn(
        "group flex h-full flex-col border-r bg-background transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-16",
        className
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/" className="flex items-center w-full">
          {/* Ícone de Dashboard - só aparece quando colapsado */}
          <div className={cn(
            "h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 transition-all duration-300",
            isExpanded ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* Logo completa - centralizada quando expandido */}
          <div className={cn(
            "flex items-center justify-center w-full transition-all duration-300 overflow-hidden",
            isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none w-0"
          )}>
            <Image
              src="/304x88-na-cor-preta.png"
              alt="AlertaPro"
              width={140}
              height={40}
              className="object-contain dark:hidden"
              priority
            />
            <Image
              src="/304x88-na-cor-branca.png"
              alt="AlertaPro"
              width={140}
              height={40}
              className="object-contain hidden dark:block"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <li key={item.title}>
                <Link href={item.href} className="block">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-12 px-3 transition-all duration-200",
                      isActive && "bg-primary/10 text-primary border border-primary/20",
                      !isActive && "hover:bg-muted/50"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium transition-all duration-300",
                      isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none",
                      isActive ? "text-primary" : "text-foreground"
                    )}>
                      {item.title}
                    </span>
                    {isActive && (
                      <ChevronRight className={cn(
                        "h-4 w-4 ml-auto transition-all duration-300",
                        isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
                      )} />
                    )}
                  </Button>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      
      {/* Expand indicator */}
      <div className="p-2 border-t">
        <div className={cn(
          "text-xs text-muted-foreground text-center transition-all duration-300",
          isExpanded ? "opacity-100" : "opacity-0"
        )}>
          Passe o mouse para expandir
        </div>
      </div>
    </div>
  )
}
