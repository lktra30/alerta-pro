"use client"

import { 
  BarChart3, 
  Home, 
  Settings, 
  Users,
  DollarSign,
  Search,
  Target
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// import { EditGoalsPopover } from "./edit-goals-popover"
import Link from "next/link"
import { usePathname } from "next/navigation"

const sidebarItems = [
  {
    title: "Visão Geral",
    icon: Home,
    badge: null,
    href: "/"
  },
  {
    title: "Meta Ads",
    icon: Target,
    badge: null,
    href: "/meta-ads"
  },
  {
    title: "Comissão",
    icon: DollarSign,
    badge: null,
    href: "/comissao"
  },
  {
    title: "CRM",
    icon: Users,
    badge: null,
    href: "/crm"
  },
  {
    title: "Configurações",
    icon: Settings,
    badge: null,
    href: "/configuracoes"
  }
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold">Alerta Pro</h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-1">
          {sidebarItems.map((item) => (
            <li key={item.title}>
              <Link href={item.href} className="block">
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    pathname === item.href && "bg-secondary text-secondary-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            </li>
          ))}
          
          {/* Special Edit Goals Item
          <li>
            <EditGoalsPopover />
          </li> */}
        </ul>
      </nav>
    </div>
  )
}
