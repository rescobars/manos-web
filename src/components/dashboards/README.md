# Sistema de Dashboards Modulares

Este sistema permite tener diferentes dashboards según el rol del usuario, manteniendo el layout común y facilitando la gestión de contenido específico por rol.

## Estructura

```
src/components/dashboards/
├── DefaultDashboard.tsx      # Dashboard por defecto
├── DriverDashboard.tsx       # Dashboard específico para conductores
├── OwnerDashboard.tsx        # Dashboard específico para propietarios
├── DashboardSelector.tsx     # Selector que decide qué dashboard mostrar
├── index.ts                  # Exportaciones de todos los dashboards
└── README.md                 # Esta documentación
```

## Cómo funciona

### 1. DashboardSelector
El componente `DashboardSelector` es el cerebro del sistema. Analiza el rol del usuario en la organización actual y decide qué dashboard mostrar:

- **Conductores**: Muestran `DriverDashboard`
- **Propietarios/Admins**: Muestran `OwnerDashboard`
- **Otros roles**: Muestran `DefaultDashboard`

### 2. Crear un nuevo dashboard

Para crear un nuevo dashboard específico para un rol:

1. Crea un nuevo archivo `NewRoleDashboard.tsx` en la carpeta `dashboards/`
2. Implementa el componente con la interfaz específica del rol
3. Importa el nuevo dashboard en `DashboardSelector.tsx`
4. Agrega la lógica de selección en el selector
5. Exporta el nuevo dashboard en `index.ts`

### 3. Ejemplo de implementación

```tsx
// Nuevo dashboard para managers
export default function ManagerDashboard() {
  const { currentOrganization } = useAuth();
  
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Contenido específico para managers */}
    </div>
  );
}
```

### 4. Actualizar el selector

```tsx
// En DashboardSelector.tsx
import ManagerDashboard from './ManagerDashboard';

// En la lógica de selección
if (isManager) {
  return <ManagerDashboard />;
}
```

## Ventajas del sistema

- **Modularidad**: Cada dashboard es un componente independiente
- **Mantenibilidad**: Fácil agregar, modificar o eliminar dashboards
- **Reutilización**: Los dashboards pueden compartir componentes comunes
- **Escalabilidad**: Fácil agregar nuevos roles y dashboards
- **Layout consistente**: El layout se mantiene igual, solo cambia el contenido

## Uso en páginas

```tsx
// En cualquier página que quiera mostrar un dashboard
import { DashboardSelector } from '@/components/dashboards';

export default function DashboardPage() {
  return <DashboardSelector />;
}
```

## Consideraciones

- Todos los dashboards deben usar el mismo hook `useAuth()` para acceder al contexto
- Mantener consistencia en el espaciado y estructura visual
- Los dashboards deben ser responsivos y seguir el mismo patrón de diseño
- Considerar la performance al cargar dashboards complejos
