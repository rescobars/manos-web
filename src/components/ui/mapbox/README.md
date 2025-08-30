# Mapbox Components

Esta carpeta contiene todos los componentes relacionados con Mapbox para la aplicación.

## Componentes

### BaseMap
Componente base que maneja la inicialización y configuración del mapa de Mapbox.

**Props:**
- `center`: Coordenadas del centro del mapa `[lng, lat]`
- `zoom`: Nivel de zoom (por defecto: 12)
- `style`: Estilo del mapa (por defecto: 'mapbox://styles/mapbox/streets-v12')
- `className`: Clases CSS para el contenedor
- `onMapReady`: Callback cuando el mapa esté listo
- `children`: Componentes hijos que se renderizan cuando el mapa esté listo

**Hook:**
- `useMap()`: Hook para acceder al estado del mapa

### MapMarkers
Componente que maneja la visualización de marcadores y rutas en el mapa.

**Props:**
- `map`: Instancia del mapa de Mapbox
- `pickupLocation`: Ubicación de recogida
- `orders`: Lista de pedidos
- `selectedOrders`: IDs de pedidos seleccionados
- `onRouteLoaded`: Callback cuando las rutas se hayan cargado

## Tipos

### Location
```typescript
interface Location {
  lat: number;
  lng: number;
  address: string;
  id?: string;
}
```

### Order
```typescript
interface Order {
  id: string;
  orderNumber: string;
  deliveryLocation: Location;
  description?: string;
  totalAmount?: number;
  createdAt?: string;
}
```

## Uso

```tsx
import { BaseMap, useMap, MapMarkers } from '@/components/ui/mapbox';

function MyMapComponent() {
  const { map, isMapReady, handleMapReady } = useMap();
  
  return (
    <BaseMap
      center={[-58.3816, -34.6037]}
      zoom={12}
      onMapReady={handleMapReady}
    >
      <MapMarkers
        map={map}
        pickupLocation={pickupLocation}
        orders={orders}
        selectedOrders={selectedOrders}
        onRouteLoaded={handleRouteLoaded}
      />
    </BaseMap>
  );
}
```

## Características

- ✅ Gestión automática de marcadores y rutas
- ✅ Limpieza automática al cambiar selección
- ✅ Colores únicos para cada pedido
- ✅ Popups informativos
- ✅ Ajuste automático de vista
- ✅ Manejo de errores
- ✅ Loading states
- ✅ Responsive design
