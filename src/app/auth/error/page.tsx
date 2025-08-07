"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="border-destructive">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">
              Erro de Autenticação
            </CardTitle>
            <CardDescription>
              Ocorreu um erro durante o processo de autenticação
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-destructive/10 p-4 rounded-lg mb-4">
              <p className="text-sm">
                <strong>Erro:</strong> {error || "Erro desconhecido"}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Entre em contato com o administrador do sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
} 