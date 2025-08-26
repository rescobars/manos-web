# API Structure Documentation

## Overview
This document describes the organized API structure for the Manos Platform, following a consistent pattern for all endpoints.

## API Routes Structure

### Authentication Endpoints (`/api/auth/`)

#### Passwordless Authentication
- `POST /api/auth/passwordless/login` - Request login code
- `POST /api/auth/passwordless/verify-code` - Verify login code
- `GET /api/auth/profile` - Get user profile (authenticated)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Organization Management (`/api/organizations/`)

#### Organizations CRUD
- `GET /api/organizations` - List organizations (with filters)
- `POST /api/organizations` - Create organization
- `GET /api/organizations/[uuid]` - Get specific organization
- `PUT /api/organizations/[uuid]` - Update organization
- `DELETE /api/organizations/[uuid]` - Delete organization
- `PATCH /api/organizations/[uuid]/status` - Update organization status

### Organization Members (`/api/organization-members/`)

#### Public Registration
- `POST /api/organization-members/public-create-with-verification` - Register driver

## API Pattern

### Request Format
All API endpoints follow a consistent pattern:

```typescript
// Authentication headers (when required)
headers: {
  'Authorization': 'Bearer <access_token>',
  'Content-Type': 'application/json',
}

// Request body (for POST/PUT/PATCH)
body: JSON.stringify(data)
```

### Response Format
All endpoints return a consistent response format:

```typescript
{
  success: boolean,
  data?: any,
  error?: string,
  message?: string
}
```

### Error Handling
- **400**: Bad Request - Missing or invalid parameters
- **401**: Unauthorized - Missing or invalid authentication
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource doesn't exist
- **500**: Internal Server Error - Server error

## Environment Configuration

### Required Environment Variables
```env
API_BASE_URL=http://localhost:3000/api
```

### Configuration File
Located at `src/lib/config.ts`:
```typescript
export const config = {
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
  },
  app: {
    name: 'Manos Platform',
    version: '1.0.0',
  },
};
```

## Frontend Integration

### API Service
The frontend uses a centralized API service (`src/lib/api.ts`) that:
- Handles authentication tokens automatically
- Implements token refresh logic
- Provides consistent error handling
- Manages request/response formatting

### Usage Example
```typescript
import { apiService } from '@/lib/api';

// Login
const loginResponse = await apiService.requestPasswordlessLogin(email);

// Get organizations
const orgsResponse = await apiService.getOrganizations({
  status: 'ACTIVE',
  search: 'company'
});

// Create organization
const createResponse = await apiService.createOrganization({
  name: 'My Company',
  slug: 'my-company'
});
```

## Organization-Specific Authentication

### URL Structure
- Login: `/{orgUuid}/login`
- Register: `/{orgUuid}/register`
- Verify: `/{orgUuid}/verify`

### Flow
1. User visits organization-specific URL
2. Organization context is maintained throughout the flow
3. After verification, user is redirected to `/{orgUuid}/dashboard`

### White-Label Support
Each organization can have its own:
- Custom branding
- Specific authentication flow
- Isolated user base
- Custom redirects

## Security Considerations

### Token Management
- Access tokens are stored in localStorage
- Refresh tokens are used for automatic token renewal
- Failed requests trigger token refresh automatically
- Logout clears all tokens

### CORS and Headers
- All requests include proper Content-Type headers
- Authorization headers are required for protected endpoints
- CORS is handled by Next.js API routes

### Error Handling
- Sensitive error details are not exposed to clients
- Generic error messages are returned for security
- Detailed errors are logged server-side only
