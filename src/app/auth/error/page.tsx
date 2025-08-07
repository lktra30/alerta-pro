"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, FileText, Settings } from "lucide-react"

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-destructive">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">
              Erro de Configuração
            </CardTitle>
            <CardDescription>
              O sistema de autenticação não está configurado corretamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-destructive/10 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Erro:</strong> {error || "Configuration"}
              </p>
              <p className="text-sm mt-2">
                As variáveis de ambiente do NextAuth não foram encontradas.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Como corrigir:
              </h3>
              
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Pare o servidor (Ctrl+C no terminal)</li>
                <li>Crie um arquivo <code className="bg-muted px-1 rounded">.env</code> na raiz do projeto</li>
                <li>Adicione as variáveis necessárias (veja abaixo)</li>
                <li>Reinicie o servidor com <code className="bg-muted px-1 rounded">npm run dev</code></li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Conteúdo do arquivo .env:
              </h4>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-xs">
{`NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_secret_forte_aqui_32_caracteres
ENCRYPTO_KEY=ce4ff14e89a62f0664eb7db4126ea495598ba47d1084eeabfea6f8c08802a0b2`}
                </pre>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                💡 Dica para gerar NEXTAUTH_SECRET:
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                No terminal, execute: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">openssl rand -base64 32</code>
              </p>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Após corrigir a configuração, recarregue esta página
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 