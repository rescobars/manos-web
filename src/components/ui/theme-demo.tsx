"use client"

import { ModeToggle } from "@/components/ui/mode-toggle"
import { ThemeSelector } from "@/components/ui/theme-selector"
import { OrganizationThemeSettings } from "@/components/ui/organization-theme-settings"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

export function ThemeDemo() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Sistema de Temas</h1>
        <p className="text-muted-foreground">
          Demostración del sistema de temas y white label
        </p>
      </div>

      {/* Controles de Tema */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Controles de Tema</h3>
          <p className="text-sm text-gray-600 mb-4">
            Cambia entre modo claro/oscuro y selecciona temas personalizados
          </p>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Modo</label>
                <ModeToggle />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tema Personalizado</label>
                <ThemeSelector />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Configuración de Organización */}
      <OrganizationThemeSettings />

      {/* Demostración de Componentes */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Demostración de Componentes</h3>
          <p className="text-sm text-gray-600 mb-4">
            Estos componentes se adaptan automáticamente al tema seleccionado
          </p>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>Botón Primario</Button>
              <Button variant="secondary">Botón Secundario</Button>
              <Button variant="outline">Botón Outline</Button>
              <Button variant="ghost">Botón Ghost</Button>
              <Button variant="destructive">Botón Destructivo</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <div className="p-4">
                  <h4 className="text-lg font-semibold mb-2">Tarjeta de Ejemplo</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Esta tarjeta se adapta al tema actual
                  </p>
                  <p className="text-sm text-gray-500">
                    El contenido de la tarjeta también se adapta automáticamente.
                  </p>
                </div>
              </Card>
              
              <Card>
                <div className="p-4">
                  <h4 className="text-lg font-semibold mb-2">Otra Tarjeta</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Los colores cambian según el tema
                  </p>
                  <div className="space-y-2">
                    <div className="h-2 bg-blue-500 rounded"></div>
                    <div className="h-2 bg-gray-500 rounded"></div>
                    <div className="h-2 bg-green-500 rounded"></div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
