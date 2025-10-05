"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Provider básico de next-themes (sin UnifiedThemeProvider aquí)
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
}

// Export del provider unificado para uso directo
export { UnifiedThemeProvider } from "@/contexts/UnifiedThemeContext"
