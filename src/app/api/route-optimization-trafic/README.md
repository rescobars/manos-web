# API de Optimización de Rutas con TomTom

Esta API proporciona una interfaz para utilizar tu FastAPI con TomTom para resolver problemas de optimización de rutas de vehículos.

## Endpoints

### POST /api/route-optimization-trafic

Envía un problema de optimización de rutas a tu FastAPI con TomTom.

#### Request Body

```typescript
{
  "pickup_location": {
    "lat": 19.4326,
    "lng": -99.1332,
    "address": "Sucursal Centro"
  },
  "orders": [
    {
      "id": "test-1",
      "order_number": "001",
      "delivery_location": {
        "lat": 19.4500,
        "lng": -99.1500,
        "address": "Test Location 1"
      },
      "description": "Test Order 1",
      "total_amount": 100.0
    },
    {
      "id": "test-2",
      "order_number": "002",
      "delivery_location": {
        "lat": 19.4700,
        "lng": -99.1700,
        "address": "Test Location 2"
      },
      "description": "Test Order 2",
      "total_amount": 150.0
    }
  ]
}
```

#### Response

```typescript
{
  "success": true,
  "data": {
    // Respuesta de tu FastAPI con TomTom
    "optimized_route": {
      "routes": [
        {
          "vehicle": "delivery-vehicle",
          "stops": [
            {
              "type": "start",
              "location": "warehouse",
              "eta": "2024-01-01T09:00:00Z",
              "odometer": 0
            },
            {
              "type": "service",
              "location": "order-1",
              "services": ["service-1"],
              "eta": "2024-01-01T09:15:00Z",
              "odometer": 1500,
              "duration": 300
            },
            {
              "type": "end",
              "location": "warehouse",
              "eta": "2024-01-01T09:20:00Z",
              "odometer": 3000
            }
          ]
        }
      ]
    }
  },
  "message": "Ruta optimizada exitosamente con TomTom"
}
```

## Estructura de Datos

### PickupLocation

Ubicación de recogida (almacén/sucursal).

```typescript
interface PickupLocation {
  lat: number;        // Latitud
  lng: number;        // Longitud
  address: string;    // Dirección descriptiva
}
```

### Order

Pedido que debe ser entregado.

```typescript
interface Order {
  id: string;                    // ID único del pedido
  order_number: string;          // Número de pedido
  delivery_location: {           // Ubicación de entrega
    lat: number;                 // Latitud
    lng: number;                 // Longitud
    address: string;             // Dirección descriptiva
  };
  description?: string;          // Descripción opcional
  total_amount: number;          // Monto total del pedido
}
```

## Ejemplo de Uso

### 1. Enviar solicitud de optimización

```typescript
const optimizationRequest = {
  pickup_location: {
    lat: 19.4326,
    lng: -99.1332,
    address: "Sucursal Centro"
  },
  orders: [
    {
      id: "order-1",
      order_number: "001",
      delivery_location: {
        lat: 19.4500,
        lng: -99.1500,
        address: "Cliente 1"
      },
      description: "Entrega urgente",
      total_amount: 100.0
    },
    {
      id: "order-2",
      order_number: "002",
      delivery_location: {
        lat: 19.4700,
        lng: -99.1700,
        address: "Cliente 2"
      },
      description: "Entrega estándar",
      total_amount: 150.0
    }
  ]
};

const response = await fetch('/api/route-optimization-trafic', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(optimizationRequest)
});

const result = await response.json();
```

### 2. Usar el hook personalizado

```typescript
import { useTrafficOptimization } from '@/hooks/useTrafficOptimization';

const {
  isOptimizing,
  optimizationResult,
  error,
  optimizeWithTraffic,
  clearResult
} = useTrafficOptimization({
  pickupLocation,
  orders
});

// Optimizar ruta
const handleOptimize = async () => {
  const result = await optimizeWithTraffic();
  if (result) {
    console.log('Ruta optimizada:', result);
  }
};
```

## Configuración

### Variables de Entorno

```bash
FASTAPI_BASE_URL=http://localhost:8000
```

### Dependencias

- Tu FastAPI debe estar ejecutándose en la URL especificada
- El endpoint `/api/v1/routes/optimize-tomtom` debe estar disponible
- TomTom API debe estar configurado en tu FastAPI

## Validaciones

La API incluye validaciones automáticas para:

- **Coordenadas válidas**: Latitud (-90 a 90), Longitud (-180 a 180)
- **Datos requeridos**: pickup_location y orders obligatorios
- **Mínimo de pedidos**: Al menos 2 pedidos para optimización
- **Formato de datos**: Estructura correcta de la solicitud

## Manejo de Errores

### Errores Comunes

1. **Datos incompletos**: Faltan pickup_location o orders
2. **Pedidos insuficientes**: Menos de 2 pedidos
3. **Coordenadas inválidas**: Valores fuera de rango
4. **Error de FastAPI**: Problemas de conectividad o en tu API
5. **Error interno**: Problemas del servidor

### Códigos de Estado HTTP

- `200`: Operación exitosa
- `400`: Datos de entrada inválidos
- `500`: Error interno del servidor

## Diferencias con Mapbox

| Aspecto | Mapbox | TomTom (Tu FastAPI) |
|---------|--------|---------------------|
| **API** | Mapbox Optimization v2 | Tu FastAPI con TomTom |
| **Tráfico** | Sí (mapbox/driving-traffic) | Sí (TomTom Routing) |
| **Límites** | 300 req/min, 1000 locations | Según tu configuración |
| **Costo** | Según plan de Mapbox | Según tu plan de TomTom |
| **Personalización** | Limitada | Completa (tu implementación) |

## Ventajas de TomTom

1. **Control total**: Tienes control completo sobre la implementación
2. **Personalización**: Puedes ajustar algoritmos y lógica
3. **Integración**: Se integra con tu stack tecnológico existente
4. **Escalabilidad**: Puedes optimizar según tus necesidades específicas
5. **Costos**: Mejor control sobre costos de API

## Próximas Mejoras

1. **Caché**: Implementar caché de resultados de optimización
2. **Batch processing**: Procesar múltiples optimizaciones
3. **Webhooks**: Notificaciones cuando las rutas estén listas
4. **Métricas**: Estadísticas de optimización y rendimiento
5. **Historial**: Guardar optimizaciones anteriores
