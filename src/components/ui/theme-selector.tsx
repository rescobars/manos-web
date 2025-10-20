"use client"

import * as React from "react"
import { Palette } from "lucide-react"
import { useDynamicTheme } from "@/hooks/useDynamicTheme"
import { Button } from "@/components/ui/Button"

// Temas personalizados disponibles
const customThemes = [
  { id: "blue", name: "Azul Clásico", color: "bg-blue-500" },
  { id: "green", name: "Verde Corporativo", color: "bg-green-500" },
  { id: "purple", name: "Púrpura Moderno", color: "bg-purple-500" },
  { id: "orange", name: "Naranja Energético", color: "bg-orange-500" },
  { id: "red", name: "Rojo Intenso", color: "bg-red-500" },
  { id: "indigo", name: "Índigo Profesional", color: "bg-indigo-500" },
]

export function ThemeSelector() {
  const { mode, setMode } = useDynamicTheme()
  const [mounted, setMounted] = React.useState(false)

  // Evitar hidratación incorrecta
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const currentTheme = customThemes.find(t => t.id === mode) || customThemes[0]

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        className="w-full justify-start"
        onClick={() => {
          const currentIndex = customThemes.findIndex(t => t.id === mode)
          const nextIndex = (currentIndex + 1) % customThemes.length
          setMode(customThemes[nextIndex].id as any)
        }}
      >
        <div className={`w-4 h-4 rounded-full mr-2 ${currentTheme.color}`} />
        <span>{currentTheme.name}</span>
        <Palette className="ml-auto h-4 w-4" />
      </Button>
    </div>
  )
}
