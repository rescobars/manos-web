# Feature: Optimización de Rutas

Esta feature maneja la optimización de rutas de entrega utilizando algoritmos de IA y visualización en mapas interactivos.

## Estructura

```
src/app/features/optimization/
├── components/           # Componentes de UI
│   └── OptimizedRouteMap.tsx
├── hooks/               # Hooks personalizados
│   └── useOptimizedRouteMap.ts
├── types.ts             # Tipos e interfaces TypeScript
├── utils.ts             # Funciones utilitarias
├── index.ts             # Exportaciones principales
└── README.md            # Esta documentación
```

## Componentes

### OptimizedRouteMap
Componente principal que muestra la ruta optimizada en un mapa interactivo con:
- Visualización de la ruta en Mapbox
- Marcadores numerados para cada parada
- Métricas de optimización
- Lista detallada de paradas
- Información del algoritmo utilizado

## Hooks

### useOptimizedRouteMap
Hook personalizado que maneja toda la lógica del mapa:
- Inicialización de Mapbox
- Carga de rutas optimizadas
- Manejo de estado del mapa
- Gestión de errores

## Tipos

- `Location`: Ubicación con coordenadas y dirección
- `Order`: Pedido con información de entrega
- `OptimizedRoute`: Ruta optimizada con métricas
- `OptimizedRouteMapProps`: Props del componente

## Utilidades

- `generateStopColor`: Genera colores para marcadores de paradas
- `formatDuration`: Formatea duración en formato legible
- `createNumberedMarker`: Crea marcadores numerados para el mapa
- `createPickupMarker`: Crea marcador para ubicación de pickup

## Uso

```tsx
import { OptimizedRouteMap } from '@/app/features/optimization';

<OptimizedRouteMap
  pickupLocation={pickupLocation}
  optimizedRoute={optimizedRoute}
  showOptimizedRoute={true}
/>
```

## Dependencias

- Mapbox GL JS para visualización de mapas
- Lucide React para iconos
- Tailwind CSS para estilos
