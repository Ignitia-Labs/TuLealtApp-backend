# 🔄 Cambios en APIs - Frontend Implementation Guide

**Fecha**: 2026-02-05  
**Feature**: Registro de `branchId` en transacciones de puntos  
**Versión API**: v1  
**Breaking Changes**: ❌ No (todos los cambios son retrocompatibles)

---

## 📋 Resumen de Cambios

Se agregó el campo opcional `branchId` a todas las APIs que crean transacciones de puntos para poder rastrear en qué sucursal se realizó cada operación. **Todos los cambios son retrocompatibles** - los endpoints funcionan sin `branchId`.

### APIs Afectadas
1. ✅ **POST** `/partner/customers/:id/points/adjustment` - Ajustes manuales de puntos
2. ✅ **POST** `/partner/customers/:id/rewards/:rewardId/redeem` - Canje de recompensas
3. ✅ **POST** `/partner/loyalty/events/purchase` - Eventos de compra
4. ✅ **POST** `/partner/loyalty/events/visit` - Eventos de visita
5. ✅ **POST** `/partner/loyalty/events/custom` - Eventos personalizados

---

## 1. 🎯 Ajustes Manuales de Puntos

### Endpoint
```
POST /partner/customers/:id/points/adjustment
```

### ✨ Cambios en Request Body

**Nuevo campo opcional**:
```typescript
{
  pointsDelta: number;      // Existente: cantidad de puntos (+ agregar, - quitar)
  reasonCode: string;       // Existente: código de razón
  branchId?: number | null; // 🆕 NUEVO: ID de la sucursal (opcional)
  metadata?: object;        // Existente: datos adicionales (opcional)
}
```

### ✨ Cambios en Response

**Nuevo campo en respuesta**:
```typescript
{
  transactionId: number;    // Existente
  type: string;             // Existente
  pointsDelta: number;      // Existente
  reasonCode: string;       // Existente
  membershipId: number;     // Existente
  branchId?: number | null; // 🆕 NUEVO: ID de la sucursal registrada
  newBalance: number;       // Existente
  createdAt: string;        // Existente
}
```

### 📝 Ejemplos de Uso

#### Ejemplo 1: Agregar puntos CON sucursal
```typescript
// Request
POST /partner/customers/123/points/adjustment
{
  "pointsDelta": 100,
  "reasonCode": "BONUS_BIRTHDAY",
  "branchId": 2,  // 🆕 Registra la sucursal
  "metadata": {
    "birthdayMonth": 3,
    "appliedBy": "Store Manager"
  }
}

// Response
{
  "transactionId": 1001,
  "type": "ADJUSTMENT",
  "pointsDelta": 100,
  "reasonCode": "BONUS_BIRTHDAY",
  "membershipId": 123,
  "branchId": 2,  // 🆕 Sucursal registrada
  "newBalance": 600,
  "createdAt": "2026-02-05T10:00:00Z"
}
```

#### Ejemplo 2: Quitar puntos SIN sucursal (retrocompatible)
```typescript
// Request
POST /partner/customers/123/points/adjustment
{
  "pointsDelta": -50,
  "reasonCode": "CORRECTION"
  // branchId omitido - funciona igual que antes
}

// Response
{
  "transactionId": 1002,
  "type": "ADJUSTMENT",
  "pointsDelta": -50,
  "reasonCode": "CORRECTION",
  "membershipId": 123,
  "branchId": null,  // 🆕 null cuando no se especifica
  "newBalance": 550,
  "createdAt": "2026-02-05T10:05:00Z"
}
```

### 💡 Recomendaciones Frontend

```typescript
// Componente: Ajuste de Puntos
interface AdjustPointsForm {
  pointsDelta: number;
  reasonCode: string;
  branchId?: number | null; // 🆕 Agregar campo opcional
  metadata?: Record<string, any>;
}

// Si el usuario tiene sucursales disponibles, mostrar selector
function AdjustPointsModal() {
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const userBranches = useUserBranches(); // Hook que obtiene sucursales del usuario
  
  const handleSubmit = async (data: AdjustPointsForm) => {
    const payload = {
      ...data,
      // Solo incluir branchId si hay una sucursal seleccionada
      ...(selectedBranch && { branchId: selectedBranch })
    };
    
    await adjustPoints(customerId, payload);
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      {/* Campos existentes */}
      <Input name="pointsDelta" />
      <Input name="reasonCode" />
      
      {/* 🆕 Nuevo campo opcional */}
      {userBranches.length > 0 && (
        <Select 
          name="branchId" 
          value={selectedBranch}
          onChange={setSelectedBranch}
          optional
        >
          <option value="">Sin sucursal específica</option>
          {userBranches.map(branch => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </Select>
      )}
    </Form>
  );
}
```

---

## 2. 🎁 Canje de Recompensas

### Endpoint
```
POST /partner/customers/:id/rewards/:rewardId/redeem
```

### ✨ Cambios en Request Body

**Nuevo campo opcional**:
```typescript
{
  branchId?: number | null; // 🆕 NUEVO: ID de la sucursal donde se canjea
}
```

**Nota**: El body es completamente opcional. Si no se envía, funciona igual que antes.

### ✨ Cambios en Response

**Nuevo campo en respuesta**:
```typescript
{
  transactionId: number;    // Existente
  rewardId: number;         // Existente
  pointsUsed: number;       // Existente
  newBalance: number;       // Existente
  branchId?: number | null; // 🆕 NUEVO: ID de la sucursal registrada
  redemptionCode?: string;  // Existente (código único de canje)
}
```

### 📝 Ejemplos de Uso

#### Ejemplo 1: Canje CON sucursal
```typescript
// Request
POST /partner/customers/123/rewards/456/redeem
{
  "branchId": 2  // 🆕 Registra dónde se canjea
}

// Response
{
  "transactionId": 2001,
  "rewardId": 456,
  "pointsUsed": 100,
  "newBalance": 400,
  "branchId": 2,  // 🆕 Sucursal registrada
  "redemptionCode": "REWARD-ABC123-XYZ789"
}
```

#### Ejemplo 2: Canje SIN sucursal (retrocompatible)
```typescript
// Request - Body vacío o sin branchId
POST /partner/customers/123/rewards/456/redeem
{}

// Response
{
  "transactionId": 2002,
  "rewardId": 456,
  "pointsUsed": 100,
  "newBalance": 300,
  "branchId": null,  // 🆕 null cuando no se especifica
  "redemptionCode": "REWARD-DEF456-ABC123"
}
```

### 💡 Recomendaciones Frontend

```typescript
// Componente: Canje de Recompensa
function RedeemRewardButton({ 
  customerId, 
  rewardId, 
  currentBranch 
}: RedeemProps) {
  const handleRedeem = async () => {
    const payload = currentBranch 
      ? { branchId: currentBranch.id }  // 🆕 Incluir sucursal actual
      : {};  // O body vacío si no hay sucursal
    
    const response = await redeemReward(customerId, rewardId, payload);
    
    // Mostrar código de canje y sucursal
    showSuccessMessage({
      code: response.redemptionCode,
      branch: response.branchId ? `Sucursal #${response.branchId}` : 'Online',
      pointsUsed: response.pointsUsed
    });
  };
  
  return (
    <Button onClick={handleRedeem}>
      Canjear Recompensa
      {currentBranch && <Badge>En {currentBranch.name}</Badge>}
    </Button>
  );
}
```

---

## 3. 🛒 Eventos de Compra (Purchase)

### Endpoint
```
POST /partner/loyalty/events/purchase
```

### ✨ Cambios en Request Body

**Nuevo campo opcional**:
```typescript
{
  tenantId: number;         // Existente
  orderId: string;          // Existente
  occurredAt: string;       // Existente (ISO 8601)
  membershipRef: object;    // Existente
  netAmount: number;        // Existente
  grossAmount: number;      // Existente
  currency: string;         // Existente
  branchId?: number | null; // 🆕 NUEVO: Sucursal donde se realizó la compra
  paymentMethod?: string;   // Existente
  paymentStatus: string;    // Existente
  channel?: string;         // Existente
  items?: array;            // Existente
  metadata?: object;        // Existente
}
```

### 📝 Ejemplos de Uso

#### Ejemplo 1: Compra en sucursal física
```typescript
// Request
POST /partner/loyalty/events/purchase
{
  "tenantId": 1,
  "orderId": "FAC-00125",
  "occurredAt": "2026-02-05T10:00:00Z",
  "membershipRef": { "membershipId": 100 },
  "netAmount": 150.00,
  "grossAmount": 165.00,
  "currency": "GTQ",
  "branchId": 2,  // 🆕 Compra en sucursal #2
  "paymentMethod": "card",
  "paymentStatus": "PAID",
  "channel": "in-store"
}

// Response
{
  "eventId": "evt_abc123",
  "status": "processed",
  "pointsAwarded": 15,
  "message": "Purchase processed successfully"
}
```

#### Ejemplo 2: Compra online (sin sucursal)
```typescript
// Request
POST /partner/loyalty/events/purchase
{
  "tenantId": 1,
  "orderId": "WEB-9876",
  "occurredAt": "2026-02-05T11:00:00Z",
  "membershipRef": { "qrCode": "QR-USER-3-TENANT-1-ABC123" },
  "netAmount": 200.00,
  "grossAmount": 220.00,
  "currency": "GTQ",
  // branchId omitido - compra online
  "paymentMethod": "credit_card",
  "paymentStatus": "PAID",
  "channel": "web"
}
```

### 💡 Recomendaciones Frontend

```typescript
// Sistema POS o E-commerce
function processPurchase(order: Order, branch?: Branch) {
  const purchaseEvent = {
    tenantId: getTenantId(),
    orderId: order.id,
    occurredAt: new Date().toISOString(),
    membershipRef: { membershipId: order.customerId },
    netAmount: order.netTotal,
    grossAmount: order.grossTotal,
    currency: order.currency,
    // 🆕 Incluir branchId si es venta en sucursal física
    ...(branch && { branchId: branch.id }),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.status,
    channel: branch ? 'in-store' : 'online',
    items: order.items
  };
  
  return sendPurchaseEvent(purchaseEvent);
}
```

---

## 4. 🚶 Eventos de Visita (Visit)

### Endpoint
```
POST /partner/loyalty/events/visit
```

### ✨ Cambios en Request Body

**Nuevo campo opcional**:
```typescript
{
  tenantId: number;         // Existente
  visitId: string;          // Existente
  occurredAt: string;       // Existente (ISO 8601)
  membershipRef: object;    // Existente
  branchId?: number | null; // 🆕 NUEVO: Sucursal visitada
  channel?: string;         // Existente
  visitType?: string;       // Existente
  metadata?: object;        // Existente
}
```

### 📝 Ejemplos de Uso

#### Ejemplo: Check-in en sucursal
```typescript
// Request
POST /partner/loyalty/events/visit
{
  "tenantId": 1,
  "visitId": "VISIT-2026-02-05-001",
  "occurredAt": "2026-02-05T09:00:00Z",
  "membershipRef": { "qrCode": "QR-USER-3-TENANT-1-XYZ789" },
  "branchId": 2,  // 🆕 Check-in en sucursal #2
  "channel": "in-store",
  "visitType": "checkin"
}
```

### 💡 Recomendaciones Frontend

```typescript
// App móvil o sistema de check-in
function checkInCustomer(qrCode: string, branch: Branch) {
  const visitEvent = {
    tenantId: getTenantId(),
    visitId: `VISIT-${Date.now()}`,
    occurredAt: new Date().toISOString(),
    membershipRef: { qrCode },
    branchId: branch.id,  // 🆕 Siempre incluir en check-ins físicos
    channel: 'in-store',
    visitType: 'checkin',
    metadata: {
      deviceId: getDeviceId(),
      location: branch.location
    }
  };
  
  return sendVisitEvent(visitEvent);
}
```

---

## 5. ⚡ Eventos Personalizados (Custom)

### Endpoint
```
POST /partner/loyalty/events/custom
```

### ✨ Cambios en Request Body

**Nuevo campo opcional en payload**:
```typescript
{
  tenantId: number;         // Existente
  eventType: string;        // Existente
  occurredAt: string;       // Existente
  membershipRef: object;    // Existente
  payload: {                // Existente
    // Cualquier dato del evento
    branchId?: number | null; // 🆕 NUEVO: Puede incluirse en payload
    // ... otros campos personalizados
  }
}
```

### 📝 Ejemplo de Uso

```typescript
// Request
POST /partner/loyalty/events/custom
{
  "tenantId": 1,
  "eventType": "SOCIAL_SHARE",
  "occurredAt": "2026-02-05T12:00:00Z",
  "membershipRef": { "membershipId": 100 },
  "payload": {
    "platform": "facebook",
    "postUrl": "https://...",
    "branchId": 2  // 🆕 Si el share fue desde una sucursal específica
  }
}
```

---

## 📊 Tabla Resumen de Cambios

| Endpoint | Request Changes | Response Changes | Obligatorio | Retrocompatible |
|----------|----------------|------------------|-------------|-----------------|
| **POST** `/partner/customers/:id/points/adjustment` | `branchId?: number` | `branchId?: number` | ❌ No | ✅ Sí |
| **POST** `/partner/customers/:id/rewards/:rewardId/redeem` | `branchId?: number` | `branchId?: number` | ❌ No | ✅ Sí |
| **POST** `/partner/loyalty/events/purchase` | `branchId?: number` | - | ❌ No | ✅ Sí |
| **POST** `/partner/loyalty/events/visit` | `branchId?: number` | - | ❌ No | ✅ Sí |
| **POST** `/partner/loyalty/events/custom` | `payload.branchId?: number` | - | ❌ No | ✅ Sí |

---

## 🎨 Componentes UI Recomendados

### 1. Branch Selector Component
```typescript
interface BranchSelectorProps {
  value: number | null;
  onChange: (branchId: number | null) => void;
  optional?: boolean;
  label?: string;
}

function BranchSelector({ 
  value, 
  onChange, 
  optional = true,
  label = "Sucursal" 
}: BranchSelectorProps) {
  const { branches } = useBranches();
  
  return (
    <FormField label={label} optional={optional}>
      <Select
        value={value ?? ''}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        {optional && <option value="">Todas las sucursales</option>}
        {branches.map(branch => (
          <option key={branch.id} value={branch.id}>
            {branch.name} {branch.code && `(${branch.code})`}
          </option>
        ))}
      </Select>
    </FormField>
  );
}
```

### 2. Branch Badge Component
```typescript
function BranchBadge({ branchId }: { branchId?: number | null }) {
  const { getBranchName } = useBranches();
  
  if (!branchId) {
    return <Badge variant="neutral">Online</Badge>;
  }
  
  return (
    <Badge variant="primary">
      <MapPinIcon /> {getBranchName(branchId)}
    </Badge>
  );
}
```

---

## 🔍 Casos de Uso por Rol

### 👤 Staff de Sucursal
**Contexto**: Usuario trabaja en una sucursal específica  
**Implementación**:
```typescript
// Siempre enviar branchId del usuario actual
const currentBranch = useCurrentUserBranch();

// En todos los endpoints
const payload = {
  // ... otros campos
  branchId: currentBranch.id  // Siempre incluir
};
```

### 🏢 Gerente Multi-sucursal
**Contexto**: Usuario puede operar en múltiples sucursales  
**Implementación**:
```typescript
// Permitir seleccionar sucursal
const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

// Mostrar selector de sucursales
<BranchSelector
  value={selectedBranch?.id}
  onChange={branchId => setSelectedBranch(findBranch(branchId))}
  optional
/>
```

### 💻 Sistema Central / Online
**Contexto**: Operaciones que no están ligadas a una sucursal  
**Implementación**:
```typescript
// No enviar branchId (omitir el campo)
const payload = {
  // ... otros campos
  // branchId omitido
};
```

---

## ⚠️ Notas Importantes

### ✅ DO (Recomendado)
- ✅ **Incluir `branchId`** cuando la operación ocurre en una sucursal física
- ✅ **Omitir `branchId`** (o enviar `null`) para operaciones online/centralizadas
- ✅ **Mostrar selector de sucursales** si el usuario tiene acceso a múltiples
- ✅ **Validar en frontend** que el usuario tenga acceso a la sucursal seleccionada
- ✅ **Persistir última sucursal** seleccionada para mejor UX
- ✅ **Mostrar `branchId`** en listados/reportes para trazabilidad

### ❌ DON'T (No Recomendado)
- ❌ **NO** hacer `branchId` obligatorio si el sistema funciona sin él
- ❌ **NO** enviar `branchId` inventado o por defecto si no aplica
- ❌ **NO** asumir que todos los usuarios tienen una sola sucursal
- ❌ **NO** ignorar `branchId` en responses (puede ser útil para auditoría)

---

## 🧪 Testing en Frontend

### Casos de Prueba Recomendados

1. **Ajuste de puntos CON sucursal**
   - ✅ Enviar `branchId` válido
   - ✅ Verificar que response incluye `branchId`

2. **Ajuste de puntos SIN sucursal**
   - ✅ Omitir `branchId`
   - ✅ Verificar que funciona igual que antes

3. **Selector de sucursales**
   - ✅ Mostrar todas las sucursales del usuario
   - ✅ Permitir "Sin sucursal" como opción
   - ✅ Recordar última selección

4. **Validación de permisos**
   - ✅ Solo mostrar sucursales a las que el usuario tiene acceso
   - ✅ Validar antes de enviar

---

## 📞 Soporte

Si tienes dudas sobre la implementación:
1. Consulta el Swagger actualizado: `https://api.tuapp.com/docs`
2. Revisa ejemplos completos en: `z-docs/GUIA-FRONTEND-AJUSTE-PUNTOS.md`
3. Contacta al equipo backend para aclarar casos específicos

---

**Última actualización**: 2026-02-05  
**Autor**: Edward Acu (AI Assistant)  
**Versión**: 1.0.0
