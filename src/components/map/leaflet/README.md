# Leaflet Map Components

Esta carpeta contiene todos los componentes relacionados con Leaflet para la aplicación.

## Estructura

```
src/components/map/leaflet/
├── base/
│   └── BaseMap.tsx          # Componente base del mapa
├── markers/
│   ├── DriverMarkers.tsx    # Marcadores de conductores
│   └── OrderMarkers.tsx     # Marcadores de pedidos
└── index.ts                 # Exportaciones principales
```

## Componentes

### BaseMap
Componente base que maneja la inicialización y configuración del mapa de Leaflet.

**Props:**
- `center`: Coordenadas del centro del mapa `[lng, lat]`
- `zoom`: Nivel de zoom (por defecto: 12)
- `className`: Clases CSS para el contenedor
- `onMapReady`: Callback cuando el mapa esté listo
- `children`: Componentes hijos que se renderizan cuando el mapa esté listo

**Hook:**
- `useMapInstance()`: Hook para acceder al estado del mapa

### DriverMarkers
Componente que maneja la visualización de marcadores de conductores.

**Props:**
- `drivers`: Array de conductores
- `selectedDriver`: Conductor seleccionado
- `selectedRouteIds`: IDs de rutas seleccionadas para filtrado
- `onDriverClick`: Callback cuando se hace clic en un conductor

### OrderMarkers
Componente que maneja la visualización de marcadores de pedidos.

**Props:**
- `orders`: Array de pedidos
- `selectedOrders`: IDs de pedidos seleccionados
- `pickupLocation`: Ubicación de recogida
- `onOrderClick`: Callback cuando se hace clic en un pedido
- `onPickupClick`: Callback cuando se hace clic en el punto de recogida

## Características

- ✅ **Rendimiento optimizado** - Leaflet es más ligero que Mapbox
- ✅ **Marcadores personalizados** - Iconos únicos para cada tipo
- ✅ **Filtrado inteligente** - Filtrado en frontend sin recargar
- ✅ **Popups nativos** - Popups de Leaflet con contenido personalizado
- ✅ **Animaciones suaves** - Transiciones fluidas entre estados
- ✅ **Responsive** - Se adapta a diferentes tamaños de pantalla
- ✅ **TypeScript** - Tipado completo para mejor desarrollo

## Uso

```tsx
import { BaseMap, DriverMarkers, OrderMarkers } from '@/components/map/leaflet';

function MyMapComponent() {
  return (
    <BaseMap
      center={[-90.5069, 14.6349]}
      zoom={12}
      onMapReady={(map) => console.log('Map ready:', map)}
    >
      <DriverMarkers
        drivers={drivers}
        selectedDriver={selectedDriver}
        onDriverClick={handleDriverClick}
      />
      <OrderMarkers
        orders={orders}
        selectedOrders={selectedOrders}
        onOrderClick={handleOrderClick}
      />
    </BaseMap>
  );
}
```

## Ventajas sobre Mapbox

1. **Sin API Key** - No requiere clave de API
2. **Open Source** - Completamente gratuito
3. **Mejor rendimiento** - Más ligero y rápido
4. **Más control** - Mayor flexibilidad en personalización
5. **Menos dependencias** - Menos complejidad en el bundle
