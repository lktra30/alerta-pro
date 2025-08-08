"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function Toast({ title, description, variant = "default", open, onOpenChange }: ToastProps) {
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onOpenChange(false)
      }, 5000) // Auto-close after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-[100] w-auto sm:w-full sm:max-w-sm">
      <div
        className={cn(
          "relative flex w-full flex-col space-y-2 rounded-md border p-3 sm:p-4 shadow-lg",
          "animate-in slide-in-from-top sm:slide-in-from-right-full duration-300",
          variant === "destructive"
            ? "border-destructive bg-destructive text-destructive-foreground"
            : "border-border bg-background text-foreground"
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            {title && (
              <div className="text-sm font-semibold leading-none tracking-tight">
                {title}
              </div>
            )}
            {description && (
              <div className="text-sm opacity-90 whitespace-pre-line">
                {description}
              </div>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="ml-2 flex h-6 w-6 items-center justify-center rounded-sm opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook para usar toast facilmente
export function useToast() {
  const [toasts, setToasts] = React.useState<Array<{
    id: string
    title?: string
    description?: string
    variant?: "default" | "destructive"
  }>>([])

  const addToast = React.useCallback((toast: Omit<ToastProps, "open" | "onOpenChange">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return {
    toasts,
    addToast,
    removeToast
  }
} 