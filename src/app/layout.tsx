import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider, UnifiedThemeProvider } from '@/components/ui/theme-provider'
import { ThemeWrapper } from '@/components/ThemeWrapper'
import { ThemeLoadingProvider } from '@/components/ThemeLoadingProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'moviGo - Plataforma de Gestión',
  description: 'Tu plataforma completa para gestionar pedidos, conductores y organizaciones',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <UnifiedThemeProvider>
              <ThemeLoadingProvider>
                <ThemeWrapper>
                  {children}
                </ThemeWrapper>
              </ThemeLoadingProvider>
            </UnifiedThemeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
