"use client"

import * as React from "react"
import { Palette, Upload, Save, RotateCcw } from "lucide-react"
import { useOrganizationTheme } from "@/hooks/useOrganizationTheme"
import { useAuth } from "@/contexts/AuthContext"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { TextArea } from "@/components/ui/TextArea"
import { Card } from "@/components/ui/Card"
import { Select } from "@/components/ui/Select"
import { ThemeSelector } from "@/components/ui/theme-selector"

const availableThemes = [
  { id: "blue", name: "Azul Clásico", color: "bg-blue-500" },
  { id: "green", name: "Verde Corporativo", color: "bg-green-500" },
  { id: "purple", name: "Púrpura Moderno", color: "bg-purple-500" },
  { id: "orange", name: "Naranja Energético", color: "bg-orange-500" },
  { id: "red", name: "Rojo Intenso", color: "bg-red-500" },
  { id: "indigo", name: "Índigo Profesional", color: "bg-indigo-500" },
]

export function OrganizationThemeSettings() {
  const { currentOrganization } = useAuth()
  const { 
    organizationTheme, 
    isLoading, 
    saveOrganizationTheme, 
    applyCustomCSS, 
    updateLogo 
  } = useOrganizationTheme()

  const [formData, setFormData] = React.useState({
    theme_id: organizationTheme?.theme_id || 'blue',
    custom_logo_url: organizationTheme?.custom_logo_url || '',
    custom_favicon_url: organizationTheme?.custom_favicon_url || '',
    custom_css: organizationTheme?.custom_css || '',
  })

  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (organizationTheme) {
      setFormData({
        theme_id: organizationTheme.theme_id,
        custom_logo_url: organizationTheme.custom_logo_url || '',
        custom_favicon_url: organizationTheme.custom_favicon_url || '',
        custom_css: organizationTheme.custom_css || '',
      })
    }
  }, [organizationTheme])

  const handleSave = async () => {
    if (!currentOrganization) return

    setIsSaving(true)
    try {
      const themeConfig = {
        organization_uuid: currentOrganization.uuid,
        theme_id: formData.theme_id,
        custom_logo_url: formData.custom_logo_url,
        custom_favicon_url: formData.custom_favicon_url,
        custom_css: formData.custom_css,
        is_active: true,
      }

      await saveOrganizationTheme(themeConfig)
      
      // Aplicar cambios inmediatamente
      if (formData.custom_css) {
        applyCustomCSS(formData.custom_css)
      }
      
      if (formData.custom_logo_url) {
        updateLogo(formData.custom_logo_url)
      }
    } catch (error) {
      console.error('Error saving theme:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setFormData({
      theme_id: 'blue',
      custom_logo_url: '',
      custom_favicon_url: '',
      custom_css: '',
    })
  }

  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
            <Palette className="h-5 w-5" />
            Configuración de Tema
          </h3>
          <p className="text-sm theme-text-secondary mb-4">
            Cargando configuración del tema...
          </p>
          <div className="animate-pulse space-y-4">
            <div className="h-4 theme-bg-2 rounded w-3/4"></div>
            <div className="h-10 theme-bg-2 rounded"></div>
            <div className="h-4 theme-bg-2 rounded w-1/2"></div>
            <div className="h-10 theme-bg-2 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
          <Palette className="h-5 w-5" />
          Configuración de Tema
        </h3>
        <p className="text-sm theme-text-secondary mb-6">
          Personaliza el tema y la apariencia de tu organización
        </p>
        
        <div className="space-y-6">
          {/* Selector de Tema */}
          <div className="space-y-2">
            <Select
              label="Tema Principal"
              value={formData.theme_id}
              onChange={(value: string) => 
                setFormData(prev => ({ ...prev, theme_id: value }))
              }
              options={availableThemes.map(theme => ({
                value: theme.id,
                label: theme.name
              }))}
            />
          </div>

          {/* Logo Personalizado */}
          <div className="space-y-2">
            <label htmlFor="logo" className="block text-sm font-medium theme-text-primary">
              URL del Logo
            </label>
            <div className="flex gap-2">
              <Input
                id="logo"
                placeholder="https://ejemplo.com/logo.png"
                value={formData.custom_logo_url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData(prev => ({ ...prev, custom_logo_url: e.target.value }))
                }
              />
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Favicon Personalizado */}
          <div className="space-y-2">
            <label htmlFor="favicon" className="block text-sm font-medium theme-text-primary">
              URL del Favicon
            </label>
            <Input
              id="favicon"
              placeholder="https://ejemplo.com/favicon.ico"
              value={formData.custom_favicon_url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setFormData(prev => ({ ...prev, custom_favicon_url: e.target.value }))
              }
            />
          </div>

          {/* CSS Personalizado */}
          <div className="space-y-2">
            <label htmlFor="css" className="block text-sm font-medium theme-text-primary">
              CSS Personalizado
            </label>
            <TextArea
              id="css"
              placeholder="/* CSS personalizado para tu organización */"
              value={formData.custom_css}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                setFormData(prev => ({ ...prev, custom_css: e.target.value }))
              }
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-sm theme-text-muted">
              Puedes agregar estilos CSS personalizados para personalizar aún más la apariencia.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restablecer
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
