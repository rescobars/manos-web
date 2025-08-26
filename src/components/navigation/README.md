# Sistema de Navegación Dinámica por Roles

Este sistema permite mostrar diferentes elementos de navegación según el rol del usuario en la organización, manteniendo una interfaz consistente y segura.

## Estructura

```
src/components/navigation/
├── NavigationSelector.tsx    # Selector de elementos de navegación por rol
├── DynamicHeader.tsx         # Header dinámico que muestra información del rol
├── index.ts                  # Exportaciones de todos los componentes
└── README.md                 # Esta documentación
```

## Cómo funciona

### 1. NavigationSelector
El componente `NavigationSelector` determina qué elementos de navegación mostrar según el rol del usuario:

- **PLATFORM_ADMIN**: Acceso completo a todas las funcionalidades de plataforma
- **OWNER**: Acceso a funcionalidades de organización + finanzas
- **ADMIN**: Acceso a funcionalidades de organización (sin finanzas)
- **DRIVER**: Solo dashboard y funcionalidades de conductor
- **USER**: Solo dashboard básico

### 2. Elementos de Navegación por Rol

#### Platform Admin
- Dashboard
- Organizaciones (gestión de todas las organizaciones)
- Plataforma (configuración global)

#### Owner
- Dashboard
- Miembros
- Conductores
- Pedidos
- Configuración
- Finanzas (exclusivo para propietarios)

#### Admin
- Dashboard
- Miembros
- Conductores
- Pedidos
- Configuración

#### Driver
- Dashboard
- Mis Entregas
- Rutas

#### User (rol básico)
- Dashboard

### 3. DynamicHeader
El `DynamicHeader` muestra información contextual según el rol:
- Nombre de la organización
- Badge del rol con icono y color distintivo
- Dominio de la organización

## Implementación

### Crear nuevos elementos de navegación

```tsx
// En NavigationSelector.tsx
const newItem: NavigationItem = {
  label: 'Nueva Funcionalidad',
  icon: NewIcon,
  href: `/${slug}/new-feature`,
  roles: ['OWNER', 'ADMIN'],
  showForOwner: true,
  showForAdmin: true,
  showForDriver: false
};
```

### Agregar nuevos roles

```tsx
// En NavigationSelector.tsx
if (userRole === 'NEW_ROLE') {
  baseItems.push(
    // Nuevos elementos para el rol
  );
}
```

## Ventajas del sistema

- **Seguridad**: Los usuarios solo ven lo que pueden acceder
- **UX consistente**: La interfaz se adapta al rol sin cambiar el layout
- **Mantenibilidad**: Fácil agregar/remover funcionalidades por rol
- **Escalabilidad**: Nuevos roles se integran fácilmente
- **Flexibilidad**: Cada rol puede tener elementos únicos

## Uso en componentes

```tsx
// En cualquier componente que necesite navegación
import { NavigationSelector } from '@/components/navigation';

const menuItems = NavigationSelector({ slug: 'org-slug' });
```

## Consideraciones de seguridad

- La navegación es solo UI, no reemplaza la validación del backend
- Los permisos deben validarse en cada endpoint de la API
- Los roles se verifican en el contexto de autenticación
- La navegación se actualiza automáticamente al cambiar de organización

## Personalización visual

- Cada rol tiene colores distintivos en el header
- Los iconos se adaptan al contexto del rol
- El layout se mantiene consistente entre roles
- Responsive design para todos los elementos
