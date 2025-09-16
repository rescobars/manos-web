# Componentes de Seguimiento en Tiempo Real

Esta carpeta contiene los componentes para el seguimiento de conductores en tiempo real utilizando WebSocket.

## Componentes

### LiveTrackingComponent
Componente principal que maneja la visualización en tiempo real de los conductores en el mapa.

**Características:**
- ✅ Conexión WebSocket en tiempo real
- ✅ Visualización de conductores en mapa interactivo
- ✅ Filtros por organización o ruta
- ✅ Estados de conexión y autenticación
- ✅ Estadísticas en tiempo real
- ✅ Lista detallada de conductores

**Props:** Ninguna (utiliza contexto de autenticación)

## Hook Personalizado

### useWebSocket
Hook para manejar la conexión WebSocket con el backend.

**Características:**
- ✅ Conexión automática al servidor WebSocket
- ✅ Autenticación automática con credenciales del usuario
- ✅ Manejo de eventos de drivers
- ✅ Gestión de estado de conexión
- ✅ Funciones para unirse/salir de salas de rutas

**Eventos WebSocket Soportados:**
- `driver_transmission`: Transmisión general de ubicación
- `route_driver_update`: Actualización específica de ruta
- `organization_driver_update`: Actualización de organización
- `driver_status_update`: Confirmación de estado del driver

## Configuración WebSocket

### Backend Endpoint
```
http://localhost:3000
```

### Eventos de Autenticación
```javascript
// Autenticación
socket.emit('authenticate', {
  userId: 'user-uuid',
  organizationId: 'org-uuid'
});

// Unirse a ruta
socket.emit('join_route', 'route-uuid');

// Salir de ruta
socket.emit('leave_route', 'route-uuid');
```

## Uso

```tsx
import { LiveTrackingComponent } from '@/components/tracking';

function TrackingPage() {
  return (
    <div>
      <LiveTrackingComponent />
    </div>
  );
}
```

## Filtros Disponibles

### Por Organización
- Muestra todos los drivers de la organización seleccionada
- Útil para administradores que gestionan múltiples organizaciones

### Por Ruta
- Muestra solo los drivers asignados a una ruta específica
- Útil para seguimiento de entregas específicas

### Solo Activos
- Checkbox para mostrar únicamente drivers con estado "active"
- Oculta drivers offline o en otros estados

## Estados de Driver

- **active**: Driver activo y disponible (verde)
- **busy**: Driver ocupado en entrega (amarillo)
- **offline**: Driver desconectado (gris)
- **otros**: Estados personalizados (azul)

## Interfaz de Usuario

### Panel de Estado
- Indicador de conexión WebSocket
- Estado de autenticación
- Botones de conexión/desconexión
- Panel de filtros desplegable

### Estadísticas
- Total de drivers
- Drivers activos
- Drivers en ruta
- Drivers filtrados actualmente

### Mapa Interactivo
- Marcadores de drivers con colores por estado
- Popups informativos con detalles del driver
- Ajuste automático de vista para mostrar todos los drivers
- Zoom a ubicación específica al hacer clic

### Lista de Drivers
- Lista detallada con información de cada driver
- Estado visual con indicadores de color
- Información de ubicación y última actualización
- Filtrado en tiempo real

## Dependencias

- `socket.io-client`: Cliente WebSocket
- `@/components/ui/mapbox`: Componentes de mapa reutilizables
- `@/hooks/useAuth`: Hook de autenticación
- `lucide-react`: Iconos

## Estructura de Datos

### DriverTransmission
```typescript
interface DriverTransmission {
  driverId: string;
  location: {
    lat: number;
    lng: number;
  };
  status: string;
  timestamp: string;
  routeId?: string;
  organizationId: string;
}
```

## Consideraciones de Rendimiento

- Los marcadores se actualizan eficientemente usando un Map de estado
- Se limpian marcadores antiguos antes de agregar nuevos
- El mapa se ajusta automáticamente solo cuando es necesario
- Los filtros se aplican en tiempo real sin re-renderizado completo

## Próximas Mejoras

- [ ] Historial de rutas de drivers
- [ ] Alertas en tiempo real
- [ ] Estimación de tiempo de llegada
- [ ] Notificaciones push
- [ ] Exportación de datos de tracking
