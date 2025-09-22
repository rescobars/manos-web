import { ModeToggle } from '@/components/ui/mode-toggle'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Page } from '@/components/ui/Page'

export default function TestThemePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Page
          title="Prueba de Tema Global"
          subtitle="Verifica que todos los componentes respondan al tema"
          headerActions={<ModeToggle />}
        >
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Componentes con Tema
                </h2>
                
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button>Primario</Button>
                    <Button variant="secondary">Secundario</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="danger">Peligro</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      label="Nombre" 
                      placeholder="Ingresa tu nombre"
                    />
                    <Input 
                      label="Email" 
                      type="email"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300">
                      Este es un texto de ejemplo que cambia con el tema.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Instrucciones
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Haz clic en el botón de tema en la esquina superior derecha para cambiar entre modo claro, oscuro y sistema.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    <strong>Nota:</strong> El tema se aplica globalmente a toda la aplicación. 
                    También puedes usar el toggle en el sidebar de cualquier página.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Elementos que Cambian con el Tema
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Fondos</h4>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Fondo de tarjeta</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Texto</h4>
                    <div className="p-3 rounded bg-gray-100 dark:bg-gray-700">
                      <p className="text-sm text-gray-700 dark:text-gray-300">Texto secundario</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Page>
      </div>
    </div>
  )
}
