"use client"

import { 
  Home, 
  Settings, 
  Users,
  DollarSign,
  Target
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

const bottomNavItems = [
  {
    title: "Início",
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
    title: "Config",
    icon: Settings,
    href: "/configuracoes"
  }
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <nav className="flex items-center justify-around px-2 py-2">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "flex flex-col items-center justify-center gap-1 h-12 w-full max-w-[72px] p-1",
                "text-xs font-medium transition-colors",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
              )}
            >
              <Link href={item.href}>
                <item.icon className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="text-[10px] font-medium leading-none">
                  {item.title}
                </span>
              </Link>
            </Button>
          )
        })}
      </nav>
    </div>
  )
} 