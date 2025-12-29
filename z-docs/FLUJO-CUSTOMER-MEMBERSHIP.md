# Flujo Completo: Crear Customer y Membership

## 📋 Resumen del Flujo

Este documento explica el flujo completo para:
1. **Registrar un usuario tipo CUSTOMER** (desde Customer API)
2. **Crear una membership** para ese customer (desde Admin API)
3. **Cómo el customer puede ver sus memberships** (desde Customer API)

---

## 🔄 Flujo Paso a Paso

### **Paso 1: Registrar un Customer (Usuario)**

**Endpoint:** `POST /customer/auth/register`
**API:** Customer API
**Autenticación:** No requerida (público)

#### Request Body (Registro básico):
```json
{
  "email": "customer@example.com",
  "name": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "password": "SecurePass123!"
}
```

#### Request Body (Registro con creación automática de membership):
```json
{
  "email": "customer@example.com",
  "name": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "tenantId": 1,
  "registrationBranchId": 5
}
```

#### Response (201 Created) - Sin membership:
```json
{
  "id": 10,
  "email": "customer@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "membership": null
}
```

#### Response (201 Created) - Con membership creada automáticamente:
```json
{
  "id": 10,
  "email": "customer@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "membership": {
    "id": 1,
    "userId": 10,
    "tenantId": 1,
    "tenantName": "Café Delicia",
    "tenantLogo": "https://example.com/logo.png",
    "tenantImage": "https://example.com/logo.png",
    "category": "restaurant",
    "primaryColor": "#FF5733",
    "registrationBranchId": 5,
    "registrationBranchName": "Café Delicia - Centro",
    "points": 0,
    "tierId": null,
    "tierName": null,
    "tierColor": null,
    "totalSpent": 0,
    "totalVisits": 0,
    "lastVisit": null,
    "joinedDate": "2024-01-15T10:30:00.000Z",
    "availableRewards": 0,
    "qrCode": "QR-USER-10-TENANT-1-A3B5C7",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### ¿Qué sucede internamente?

1. **RegisterUserHandler** recibe el request
2. **Validación:** Si se proporciona `tenantId`, también debe proporcionarse `registrationBranchId`
3. Convierte `RegisterUserRequest` a `CreateUserRequest`
4. **Asigna automáticamente el rol `['CUSTOMER']`** (en MAYÚSCULAS)
5. Crea el usuario en la base de datos usando `CreateUserHandler`
6. **Si se proporcionaron `tenantId` y `registrationBranchId`:**
   - Crea automáticamente una membership usando `CreateCustomerMembershipHandler`
   - Genera un QR code único
   - Calcula el tier inicial basándose en los puntos (0 por defecto)
   - Establece el estado como 'active'
7. Retorna la información del usuario creado y la membership (si se creó)

**Nota importante:**
- Si NO se proporcionan `tenantId` y `registrationBranchId`, solo se crea el usuario sin membership.
- Si se proporcionan ambos campos, se crea automáticamente la membership y el cliente puede usar su QR code inmediatamente.

---

### **Paso 2: Iniciar Sesión (Login)**

**Endpoint:** `POST /customer/auth/login`
**API:** Customer API
**Autenticación:** No requerida (público)

#### Request Body:
```json
{
  "email": "customer@example.com",
  "password": "SecurePass123!"
}
```

#### Response (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 10,
    "email": "customer@example.com",
    "name": "John Doe",
    "roles": ["CUSTOMER"]
  }
}
```

#### ¿Qué sucede internamente?

1. **AuthenticateUserHandler** valida las credenciales
2. Verifica que el usuario tenga rol `CUSTOMER` (o sin rol específico)
3. Genera un token JWT con la información del usuario
4. Retorna el token y la información del usuario

**El token JWT contiene:**
- `userId`: ID del usuario
- `email`: Email del usuario
- `roles`: Array de roles (ej: `['CUSTOMER']`)

---

### **Paso 3: Crear Membership (Solo Admin API)**

**Endpoint:** `POST /admin/customer-memberships`
**API:** Admin API
**Autenticación:** Requerida (JWT)
**Roles requeridos:** `ADMIN` o `STAFF`

#### Headers:
```
Authorization: Bearer {admin_token}
```

#### Request Body:
```json
{
  "userId": 10,
  "tenantId": 1,
  "registrationBranchId": 5,
  "points": 0,
  "status": "active"
}
```

#### Response (201 Created):
```json
{
  "membership": {
    "id": 1,
    "userId": 10,
    "tenantId": 1,
    "tenantName": "Café Delicia",
    "tenantLogo": "https://example.com/logo.png",
    "tenantImage": "https://example.com/logo.png",
    "category": "restaurant",
    "primaryColor": "#FF5733",
    "registrationBranchId": 5,
    "registrationBranchName": "Café Delicia - Centro",
    "points": 0,
    "tierId": null,
    "tierName": null,
    "tierColor": null,
    "totalSpent": 0,
    "totalVisits": 0,
    "lastVisit": null,
    "joinedDate": "2024-01-15T10:35:00.000Z",
    "availableRewards": 0,
    "qrCode": "QR-USER-10-TENANT-1-A3B5C7",
    "status": "active",
    "createdAt": "2024-01-15T10:35:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

#### ¿Qué sucede internamente?

1. **CreateCustomerMembershipHandler** recibe el request
2. **Validaciones:**
   - Verifica que el usuario existe (`userId`)
   - Verifica que el tenant existe (`tenantId`)
   - Verifica que la branch existe y pertenece al tenant (`registrationBranchId`)
   - Verifica que NO existe ya una membership para ese usuario+tenant (UNIQUE constraint)
3. **Genera QR code único:**
   - Formato: `QR-USER-{userId}-TENANT-{tenantId}-{random}`
   - Verifica unicidad en la base de datos
   - Si existe, genera uno nuevo (hasta 10 intentos)
4. **Calcula tier inicial:**
   - Usa `ICustomerTierRepository.findByPoints(tenantId, points)`
   - Si encuentra un tier, lo asigna; si no, `tierId = null`
5. **Crea la membership:**
   - `points`: 0 (o el valor proporcionado)
   - `totalSpent`: 0
   - `totalVisits`: 0
   - `lastVisit`: null
   - `joinedDate`: fecha actual
   - `status`: 'active' (o el valor proporcionado)
6. **Guarda en la base de datos**
7. **Retorna el DTO con información denormalizada** (tenant, branch, tier)

---

### **Paso 4: Customer Ve Sus Memberships**

**Endpoint:** `GET /customer/memberships`
**API:** Customer API
**Autenticación:** Requerida (JWT del customer)
**Roles requeridos:** `CUSTOMER`

#### Headers:
```
Authorization: Bearer {customer_token}
```

#### Response (200 OK):
```json
{
  "memberships": [
    {
      "id": 1,
      "userId": 10,
      "tenantId": 1,
      "tenantName": "Café Delicia",
      "tenantLogo": "https://example.com/logo.png",
      "points": 0,
      "qrCode": "QR-USER-10-TENANT-1-A3B5C7",
      "status": "active",
      "joinedDate": "2024-01-15T10:35:00.000Z",
      ...
    }
  ],
  "total": 1
}
```

#### ¿Qué sucede internamente?

1. **GetCustomerMembershipsHandler** recibe el request
2. **Obtiene el `userId` del token JWT** (automáticamente, no se puede modificar)
3. **Validación de ownership:**
   - Si el usuario es CUSTOMER, solo puede ver sus propias memberships
   - Si se proporciona `request.userId` y es diferente al del token, lanza `ForbiddenException`
4. **Obtiene las memberships:**
   - Si `activeOnly = true`, solo retorna memberships activas
   - Si `tenantId` está presente, filtra por tenant
5. **Convierte a DTOs con información denormalizada:**
   - Obtiene información del tenant (name, logo, category, primaryColor)
   - Obtiene información de la branch (name)
   - Obtiene información del tier (name, color) si existe
6. **Retorna la lista de memberships**

---

## 🎯 Escenarios de Uso Comunes

### **Escenario 1: Customer se registra y luego se une a un tenant (Flujo tradicional)**

1. Customer se registra: `POST /customer/auth/register` (sin `tenantId` y `registrationBranchId`)
2. Customer inicia sesión: `POST /customer/auth/login`
3. **Admin crea membership:** `POST /admin/customer-memberships` (con `userId` del customer)
4. Customer puede ver su membership: `GET /customer/memberships`

### **Escenario 2: Customer se registra directamente en un tenant (Flujo automático - RECOMENDADO)**

1. Customer se registra con tenant: `POST /customer/auth/register` (con `tenantId` y `registrationBranchId`)
   - El sistema crea automáticamente la membership
   - El cliente recibe su QR code inmediatamente
2. Customer inicia sesión: `POST /customer/auth/login`
3. Customer puede ver su membership: `GET /customer/memberships`
   - La membership ya está lista para usar

**Ventajas del flujo automático:**
- ✅ El cliente puede usar su QR code inmediatamente después del registro
- ✅ No requiere intervención del admin
- ✅ Ideal para registro en punto de venta (POS)
- ✅ Reduce pasos y mejora la experiencia del usuario

### **Escenario 3: Customer con múltiples memberships**

1. Customer se registra con Tenant A: `POST /customer/auth/register` (con `tenantId: 1` y `registrationBranchId: 5`)
   - Se crea automáticamente la membership para Tenant A
2. Admin crea membership en Tenant B: `POST /admin/customer-memberships` (tenantId: 2)
3. Customer puede ver todas sus memberships: `GET /customer/memberships`
   - Retorna ambas memberships con sus respectivos puntos, tiers, QR codes, etc.

---

## 🔐 Seguridad y Permisos

### **Customer API**

- **Registro:** Público (no requiere autenticación)
- **Login:** Público (no requiere autenticación)
- **Ver memberships:** Requiere autenticación + rol `CUSTOMER`
- **Ver membership específica:** Requiere autenticación + validación de ownership (solo sus propias memberships)

### **Admin API**

- **Crear membership:** Requiere autenticación + rol `ADMIN` o `STAFF`
- **Ver/Actualizar/Eliminar memberships:** Requiere autenticación + rol `ADMIN` o `STAFF`
- **Sin restricción de ownership:** Los admins pueden ver/modificar cualquier membership

---

## 📝 Validaciones Importantes

### **Al crear una membership:**

1. ✅ `userId` debe existir en la tabla `users`
2. ✅ `tenantId` debe existir en la tabla `tenants`
3. ✅ `registrationBranchId` debe existir en la tabla `branches`
4. ✅ `registrationBranchId` debe pertenecer al `tenantId` especificado
5. ✅ NO debe existir ya una membership para ese `userId` + `tenantId` (UNIQUE constraint)
6. ✅ El usuario debe tener rol `CUSTOMER` (implícito, no se valida explícitamente)

### **Al ver memberships (Customer API):**

1. ✅ Usuario debe estar autenticado (token JWT válido)
2. ✅ Usuario debe tener rol `CUSTOMER`
3. ✅ Solo puede ver sus propias memberships (validación automática por `userId` del token)

---

## 🔄 Flujo de Datos

```
┌─────────────────┐
│  Customer API   │
│                 │
│  1. Register    │──┐
│  2. Login       │  │
└─────────────────┘  │
                      │
                      ▼
              ┌───────────────┐
              │   User Table   │
              │  (rol: CUSTOMER)│
              └───────────────┘
                      │
                      │ userId
                      ▼
┌─────────────────┐  │
│   Admin API     │  │
│                 │  │
│  3. Create      │──┘
│  Membership     │
└─────────────────┘
         │
         ▼
┌──────────────────────┐
│ customer_memberships  │
│  - userId (FK)        │
│  - tenantId (FK)       │
│  - points             │
│  - qrCode (unique)    │
│  - ...                │
└──────────────────────┘
         │
         │ membershipId
         ▼
┌──────────────────────┐
│    transactions      │
│  - userId (FK)       │
│  - membershipId (FK) │
│  - points            │
│  - type              │
└──────────────────────┘
```

---

## 📋 Endpoints Completos

### **Customer API**

| Método | Endpoint | Descripción | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/customer/auth/register` | Registrar nuevo customer | ❌ | - |
| POST | `/customer/auth/login` | Iniciar sesión | ❌ | - |
| GET | `/customer/auth/me` | Ver perfil propio | ✅ | CUSTOMER |
| GET | `/customer/memberships` | Ver mis memberships | ✅ | CUSTOMER |
| GET | `/customer/memberships/:id` | Ver membership específica | ✅ | CUSTOMER |
| GET | `/customer/memberships/qr/:qrCode` | Buscar por QR code | ✅ | CUSTOMER |

### **Admin API**

| Método | Endpoint | Descripción | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/customer-memberships?userId={id}` | Listar memberships de un usuario | ✅ | ADMIN, STAFF |
| GET | `/admin/customer-memberships?tenantId={id}` | Listar customers de un tenant | ✅ | ADMIN, STAFF |
| POST | `/admin/customer-memberships` | Crear membership | ✅ | ADMIN, STAFF |
| GET | `/admin/customer-memberships/:id` | Ver membership por ID | ✅ | ADMIN, STAFF |
| GET | `/admin/customer-memberships/user/:userId/tenant/:tenantId` | Ver membership específica | ✅ | ADMIN, STAFF |
| PATCH | `/admin/customer-memberships/:id` | Actualizar membership | ✅ | ADMIN, STAFF |
| DELETE | `/admin/customer-memberships/:id` | Eliminar membership | ✅ | ADMIN, STAFF |

---

## 💡 Ejemplo Completo con cURL

### 1. Registrar Customer (con creación automática de membership)

```bash
curl -X POST http://localhost:3001/customer/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "password": "SecurePass123!",
    "tenantId": 1,
    "registrationBranchId": 5
  }'
```

**Response:**
```json
{
  "id": 10,
  "email": "john.doe@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "membership": {
    "id": 1,
    "userId": 10,
    "tenantId": 1,
    "tenantName": "Café Delicia",
    "points": 0,
    "qrCode": "QR-USER-10-TENANT-1-A3B5C7",
    "status": "active",
    "joinedDate": "2024-01-15T10:30:00.000Z",
    ...
  }
}
```

**Nota:** Si no se proporcionan `tenantId` y `registrationBranchId`, el registro funciona igual pero `membership` será `null`.

### 2. Login

```bash
curl -X POST http://localhost:3001/customer/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 10,
    "email": "john.doe@example.com",
    "name": "John Doe",
    "roles": ["CUSTOMER"]
  }
}
```

### 3. Admin crea Membership (requiere token de admin) - Solo si no se creó automáticamente

**Nota:** Este paso solo es necesario si el cliente se registró sin `tenantId` y `registrationBranchId`. Si se usó el flujo automático, este paso se omite.

```bash
curl -X POST http://localhost:3000/admin/customer-memberships \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {admin_token}" \
  -d '{
    "userId": 10,
    "tenantId": 1,
    "registrationBranchId": 5,
    "points": 0,
    "status": "active"
  }'
```

**Response:**
```json
{
  "membership": {
    "id": 1,
    "userId": 10,
    "tenantId": 1,
    "tenantName": "Café Delicia",
    "points": 0,
    "qrCode": "QR-USER-10-TENANT-1-A3B5C7",
    "status": "active",
    ...
  }
}
```

### 4. Customer ve sus Memberships

```bash
curl -X GET http://localhost:3001/customer/memberships \
  -H "Authorization: Bearer {customer_token}"
```

**Response:**
```json
{
  "memberships": [
    {
      "id": 1,
      "userId": 10,
      "tenantId": 1,
      "tenantName": "Café Delicia",
      "points": 0,
      "qrCode": "QR-USER-10-TENANT-1-A3B5C7",
      ...
    }
  ],
  "total": 1
}
```

---

## ⚠️ Consideraciones Importantes

### **1. Separación de Responsabilidades**

- **Customer API:** Solo permite registro y visualización de datos propios
- **Admin API:** Permite crear/modificar/eliminar memberships

### **2. Un Customer puede tener múltiples Memberships**

- Un usuario puede tener una membership por cada tenant
- Cada membership tiene sus propios puntos, tier, estadísticas
- El constraint `UNIQUE(userId, tenantId)` previene duplicados

### **3. QR Code Único**

- Se genera automáticamente al crear la membership
- Formato: `QR-USER-{userId}-TENANT-{tenantId}-{random}`
- Es único en toda la tabla `customer_memberships`

### **4. Cálculo Automático de Tier**

- Al crear/actualizar membership, se calcula el tier basándose en los puntos
- Usa `ICustomerTierRepository.findByPoints(tenantId, points)`
- Si no hay tier para esos puntos, `tierId = null`

### **5. Transacciones Asociadas**

- Las transacciones pueden asociarse a una membership específica mediante `membershipId`
- Esto permite rastrear puntos por tenant
- `membershipId` es opcional (nullable) para compatibilidad con transacciones existentes

---

## 🚀 Próximos Pasos Sugeridos

1. ✅ **Automatizar creación de membership:** ✅ IMPLEMENTADO - El registro ahora acepta `tenantId` y `registrationBranchId` para crear automáticamente la membership
2. ✅ **Endpoint de registro en tenant:** ✅ IMPLEMENTADO - El mismo endpoint de registro ahora soporta ambos flujos
3. **Validación de email único:** Ya implementada en `CreateUserHandler`
4. **Notificaciones:** Enviar notificación cuando se crea una membership automáticamente
5. **Tests:** Crear tests de integración para validar todo el flujo (incluyendo creación automática)
6. **Manejo de errores mejorado:** Si falla la creación de membership, decidir si fallar el registro completo o solo registrar el usuario

---

**Última actualización:** 2025-01-20

