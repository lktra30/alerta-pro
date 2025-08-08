import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { ToastProvider } from "@/components/ui/toast-provider";

export const metadata: Metadata = {
  title: "AlertaPro - Dashboard de Vendas",
  description: "Dashboard completo para acompanhamento de vendas, metas e performance comercial.",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        sizes: "32x32",
        type: "image/svg+xml",
      },
      {
        url: "/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
      }
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className="antialiased font-sans"
        suppressHydrationWarning
      >
        <AuthProvider>
          <ThemeProvider
            defaultTheme="system"
          >
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
