# Feature: Optimización de Rutas con Tráfico

Esta feature maneja la optimización de rutas de entrega considerando el tráfico en tiempo real, utilizando la API de TomTom y visualización en mapas interactivos.

## Estructura

```
src/app/features/optimization/
├── README.md            # Esta documentación
```

## Nota

La optimización de rutas normal ha sido eliminada. Solo se mantiene la optimización con tráfico que se encuentra en:

- `src/components/ui/TrafficOptimizedRouteMap.tsx` - Componente principal
- `src/hooks/useTrafficOptimization.ts` - Hook para la API
- `src/app/api/route-optimization-trafic/route.ts` - Endpoint del backend

## Funcionalidad

La optimización con tráfico incluye:
- Análisis de tráfico en tiempo real
- Múltiples rutas alternativas
- Métricas de tiempo y distancia considerando tráfico
- Visualización en mapas interactivos
- Integración con la API de TomTom

## Dependencias

- API de TomTom para datos de tráfico
- Mapbox GL JS para visualización de mapas
- Lucide React para iconos
- Tailwind CSS para estilos
