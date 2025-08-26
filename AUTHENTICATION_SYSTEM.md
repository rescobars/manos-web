# Sistema de Autenticación con Query Parameters

## Overview
Este sistema implementa autenticación específica por organización usando query parameters en la URL, similar al patrón de BuildWithin.

## URL Structure

### Registro (Signup)
```
/signup?org_uuid=f329d3a5-760b-4f26-a1af-2ac4064ffb40&role=DRIVER
```

### Login (Signin)
```
/signin?org_uuid=f329d3a5-760b-4f26-a1af-2ac4064ffb40&role=DRIVER
```

### Verificación
```
/verify?org_uuid=f329d3a5-760b-4f26-a1af-2ac4064ffb40&role=DRIVER
```

## Query Parameters

### org_uuid (Required)
- **Tipo**: String (UUID)
- **Descripción**: Identificador único de la organización
- **Ejemplo**: `f329d3a5-760b-4f26-a1af-2ac4064ffb40`

### role (Optional)
- **Tipo**: String
- **Descripción**: Rol del usuario en la organización
- **Valores**: `DRIVER`, `HOST-EMPLOYER`, `ADMIN`, etc.
- **Default**: `DRIVER`

## Páginas Implementadas

### 1. `/signup` - Registro de Usuarios
- **Funcionalidad**: Registro de nuevos usuarios para una organización específica
- **Endpoint**: `/api/organization-members/public-create-with-verification`
- **Campos**:
  - `organization_uuid` (automático desde query param)
  - `email`
  - `name`
  - `title`
- **Flujo**: Registro → Verificación → Dashboard

### 2. `/signin` - Login de Usuarios
- **Funcionalidad**: Login de usuarios existentes
- **Flujo**: Email → Código de verificación → Dashboard
- **Contexto**: Mantiene `org_uuid` y `role` en toda la sesión

### 3. `/verify` - Verificación de Código
- **Funcionalidad**: Verificación del código enviado por email
- **Contexto**: Mantiene parámetros de organización
- **Redirección**: Al dashboard específico de la organización

## Ventajas del Sistema

### 1. Flexibilidad
- **URLs Limpias**: No necesitas rutas dinámicas complejas
- **Parámetros Opcionales**: Puedes agregar más parámetros fácilmente
- **SEO Friendly**: URLs más amigables para motores de búsqueda

### 2. Escalabilidad
- **White-Label**: Cada organización puede tener su propia URL
- **Roles Dinámicos**: Diferentes roles para diferentes tipos de usuarios
- **Fácil Integración**: APIs externas pueden generar URLs fácilmente

### 3. Mantenimiento
- **Código Centralizado**: Una sola página maneja todas las organizaciones
- **Menos Rutas**: No necesitas crear rutas dinámicas para cada organización
- **Debugging**: Más fácil de debuggear y testear

## Ejemplos de Uso

### Registro de Conductor
```
https://tuapp.com/signup?org_uuid=123e4567-e89b-12d3-a456-426614174000&role=DRIVER
```

### Login de Empleador
```
https://tuapp.com/signin?org_uuid=123e4567-e89b-12d3-a456-426614174000&role=HOST-EMPLOYER
```

### Verificación
```
https://tuapp.com/verify?org_uuid=123e4567-e89b-12d3-a456-426614174000&role=DRIVER
```

## Implementación Técnica

### Hook: useSearchParams
```typescript
const searchParams = useSearchParams();
const orgUuid = searchParams.get('org_uuid');
const role = searchParams.get('role');
```

### Validación de Parámetros
```typescript
useEffect(() => {
  const orgUuidParam = searchParams.get('org_uuid');
  const roleParam = searchParams.get('role');
  
  if (!orgUuidParam) {
    // Manejar error: organización requerida
  }
  
  setOrgUuid(orgUuidParam);
  setRole(roleParam);
}, [searchParams]);
```

### Redirección con Contexto
```typescript
router.push(`/dashboard?org_uuid=${orgUuid}&role=${role || 'DRIVER'}`);
```

## Flujo Completo

1. **Usuario visita**: `/signup?org_uuid=xxx&role=DRIVER`
2. **Llena formulario**: Email, nombre, cargo
3. **API crea usuario**: Con `organization_uuid` y rol específico
4. **Redirección**: A `/verify?org_uuid=xxx&role=DRIVER`
5. **Verificación**: Código por email
6. **Dashboard**: `/dashboard?org_uuid=xxx&role=DRIVER`

## Comparación con BuildWithin

Este sistema sigue el mismo patrón que [BuildWithin](https://buildwithin.io/signup?org_uuid=f329d3a5-760b-4f26-a1af-2ac4064ffb40&role=HOST-EMPLOYER):

- ✅ **Query Parameters**: `org_uuid` y `role`
- ✅ **URLs Limpias**: Sin rutas dinámicas complejas
- ✅ **Flexibilidad**: Fácil de extender con más parámetros
- ✅ **White-Label**: Cada organización tiene su contexto

## Beneficios para White-Label

1. **URLs Personalizadas**: Cada organización puede tener su propia URL de registro
2. **Contexto Persistente**: Los parámetros se mantienen en toda la sesión
3. **Roles Específicos**: Diferentes tipos de usuarios para cada organización
4. **Fácil Integración**: APIs externas pueden generar URLs de registro
5. **Analytics**: Fácil tracking de conversiones por organización
