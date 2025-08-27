# Sistema de Pedidos (Orders)

## Descripción
Sistema completo para la gestión de pedidos en la plataforma Manos. Permite a los usuarios crear, ver, editar y eliminar pedidos para sus organizaciones.

## Características

### 🔐 Autenticación y Permisos
- **Owner/Admin de Organización**: Puede gestionar todos los pedidos de su organización
- **Admin Platform**: Puede gestionar pedidos de todas las organizaciones
- **Usuarios regulares**: Solo pueden ver pedidos de organizaciones a las que pertenecen

### 📋 Funcionalidades Principales
1. **Crear Pedido**: Formulario completo con validaciones
2. **Listar Pedidos**: Vista de todos los pedidos con filtros
3. **Editar Pedido**: Modificar detalles y estado del pedido
4. **Eliminar Pedido**: Eliminar pedidos (con confirmación)
5. **Filtros**: Por estado, búsqueda por texto
6. **Estadísticas**: Contadores de pedidos por estado

### 🚀 Endpoints de la API
- `POST /api/orders` - Crear pedido
- `GET /api/orders` - Listar todos los pedidos (solo admin platform)
- `GET /api/orders/[uuid]` - Obtener pedido específico
- `PUT /api/orders/[uuid]` - Actualizar pedido
- `DELETE /api/orders/[uuid]` - Eliminar pedido
- `GET /api/orders/organization/[uuid]` - Pedidos de una organización
- `GET /api/orders/organization/[uuid]/pending` - Pedidos pendientes
- `POST /api/orders/bulk` - Crear múltiples pedidos

## Estructura de Archivos

```
src/
├── app/
│   ├── api/orders/           # Rutas de la API (proxy al backend)
│   │   ├── route.ts         # POST /api/orders, GET /api/orders
│   │   ├── [uuid]/          # Operaciones CRUD por UUID
│   │   ├── organization/    # Pedidos por organización
│   │   └── bulk/            # Creación masiva
│   └── orders/
│       └── page.tsx         # Página principal de pedidos
├── components/ui/
│   └── OrderModal.tsx       # Modal para crear/editar pedidos
├── lib/api/
│   └── orders.ts            # Servicio de API para pedidos
└── types/
    └── index.ts             # Tipos TypeScript para pedidos
```

## Uso

### 1. Navegar a la página de pedidos
```
/orders
```

### 2. Crear un nuevo pedido
- Hacer clic en "+ Nuevo Pedido"
- Llenar el formulario con los datos requeridos
- Los campos obligatorios son:
  - Dirección de recogida
  - Dirección de entrega
  - Monto total

### 3. Editar un pedido existente
- Hacer clic en "Editar" en la fila del pedido
- Modificar los campos necesarios
- Guardar cambios

### 4. Filtrar pedidos
- Usar el campo de búsqueda para buscar por número, descripción o direcciones
- Seleccionar estado específico del dropdown
- Los filtros se aplican en tiempo real

## Estados de Pedido

| Estado | Descripción | Color |
|--------|-------------|-------|
| `PENDING` | Pendiente de asignación | 🟡 Amarillo |
| `ASSIGNED` | Asignado a conductor | 🔵 Azul |
| `COMPLETED` | Completado | 🟢 Verde |
| `CANCELLED` | Cancelado | 🔴 Rojo |

## Campos del Pedido

### Campos Requeridos
- `organization_uuid`: UUID de la organización
- `pickup_address`: Dirección de recogida
- `delivery_address`: Dirección de entrega

### Campos Opcionales
- `description`: Descripción del pedido
- `total_amount`: Monto total (debe ser > 0)
- `pickup_lat`, `pickup_lng`: Coordenadas de recogida
- `delivery_lat`, `delivery_lng`: Coordenadas de entrega
- `user_uuid`: UUID del usuario asignado

## Validaciones

### Frontend
- Direcciones no pueden estar vacías
- Monto total debe ser positivo
- Coordenadas deben ser números válidos (si se proporcionan)

### Backend
- UUIDs deben ser válidos y existir
- Validación de permisos por organización
- Generación automática de números de pedido

## Notas de Implementación

### Proxy API
Las rutas de la API en Next.js actúan como proxy al backend real:
- Autenticación básica (verificación de token)
- Redirección de requests al backend
- Manejo de errores y respuestas

### Base de Datos
La lógica de base de datos está implementada en el backend separado:
- No hay queries SQL en el frontend
- Todas las operaciones pasan por el backend
- Validaciones de permisos en el backend

### Seguridad
- Tokens JWT para autenticación
- Validación de permisos por organización
- Sanitización de inputs en el frontend
- Validación adicional en el backend

## Próximas Mejoras

- [ ] Búsqueda avanzada con filtros de fecha
- [ ] Exportación de pedidos a CSV/Excel
- [ ] Notificaciones en tiempo real
- [ ] Integración con mapas para coordenadas
- [ ] Historial de cambios de estado
- [ ] Asignación automática de conductores
- [ ] Dashboard de métricas avanzadas
