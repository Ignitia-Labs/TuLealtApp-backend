# Guía Frontend: Canje de Puntos y Recompensas - Partner UI

Esta guía está diseñada para desarrolladores frontend que implementan la funcionalidad de canje de puntos y recompensas en la interfaz de Partner UI.

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Flujo Completo de Canje](#flujo-completo-de-canje)
3. [Endpoints Disponibles](#endpoints-disponibles)
4. [Implementación Paso a Paso](#implementación-paso-a-paso)
5. [Ejemplos de Código](#ejemplos-de-código)
6. [Manejo de Errores](#manejo-de-errores)
7. [Mejores Prácticas](#mejores-prácticas)
8. [Casos de Uso Comunes](#casos-de-uso-comunes)

---

## 🎯 Introducción

El sistema de canje permite a los partners procesar canjes de recompensas para sus clientes desde la Partner UI. Los clientes pueden canjear puntos acumulados por recompensas disponibles en el catálogo del tenant.

### ✅ Endpoints Disponibles

**Endpoints de Partner API para Canjes (Implementados):**

Los siguientes endpoints están disponibles y listos para usar en Partner UI:

- ✅ `GET /partner/customers/:id/rewards` - Obtener recompensas disponibles para un customer
- ✅ `POST /partner/customers/:id/rewards/:rewardId/redeem` - Procesar canje de recompensa
- ✅ `POST /partner/rewards/validate-code` - Validar código de canje generado por un cliente

**Endpoints de Customer API para Códigos de Canje:**

- ✅ `GET /customer/memberships/:id/rewards/redemption-codes` - Listar códigos de canje del cliente

**Características:**
- ✅ Solo requieren token de Partner (no necesitan token del cliente)
- ✅ Validación automática de permisos del partner
- ✅ Filtrado automático de recompensas por puntos suficientes
- ✅ Validación completa de disponibilidad y límites
- ✅ **NUEVO:** Generación automática de códigos únicos al canjear recompensas
- ✅ **NUEVO:** Validación de códigos desde Partner UI

**Nota:** Esta guía está orientada a Partner UI. Para Customer UI, consulta los endpoints de Customer API (`/customer/memberships/.../rewards`).

### Conceptos Clave

- **Membership**: Asociación entre un cliente y un tenant (incluye balance de puntos)
- **Reward**: Recompensa canjeable disponible en el catálogo
- **Redemption**: Proceso de canje que crea una transacción REDEEM en el ledger
- **Balance**: Puntos disponibles del cliente (proyección calculada desde el ledger)
- **Redemption Code**: Código único generado automáticamente al canjear una recompensa (formato: `REWARD-ABC123-XYZ789`)
  - Válido por 30 días desde su creación
  - Puede ser validado por el partner para aplicar la recompensa
  - Estados: `pending`, `used`, `expired`, `cancelled`

---

## 🔄 Flujo Completo de Canje

### Flujo desde Partner UI (Recomendado)

```
┌─────────────────────────────────────────────────────────┐
│  1. Partner busca cliente por QR o ID                   │
│     GET /partner/customers?qrCode=QR-XXX               │
│     O                                                      │
│     GET /partner/customers/:membershipId                │
│     ✅ Balance incluido en la respuesta                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  2. Obtener recompensas disponibles                    │
│     GET /partner/customers/:membershipId/rewards       │
│     ✅ Filtradas por puntos suficientes                 │
│     ✅ Solo requiere token de Partner                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  3. Cliente selecciona recompensa                       │
│     Validar: balance >= reward.pointsRequired           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  4. Procesar canje                                      │
│     POST /partner/customers/:membershipId/             │
│          rewards/:rewardId/redeem                       │
│     ✅ Solo requiere token de Partner                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  5. Mostrar confirmación                               │
│     • Transacción creada                                │
│     • Puntos descontados                                │
│     • Nuevo balance                                     │
│     • Código de canje generado automáticamente         │
│       (ej: REWARD-ABC123-XYZ789)                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  6. Cliente presenta código al partner                 │
│     (opcional: puede usar el código más tarde)         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  7. Partner valida código                              │
│     POST /partner/rewards/validate-code                │
│     Body: { "code": "REWARD-ABC123-XYZ789" }          │
│     ✅ Marca código como usado                          │
│     ✅ Retorna información de la recompensa             │
└─────────────────────────────────────────────────────────┘
```

### Flujo desde Customer UI (Alternativo)

```
┌─────────────────────────────────────────────────────────┐
│  1. Cliente autenticado accede a su perfil              │
│     GET /customer/memberships/:membershipId             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  2. Obtener balance de puntos                          │
│     GET /customer/memberships/:membershipId/            │
│         points/balance                                  │
│     ⚠️ Requiere token del cliente                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  3. Obtener recompensas disponibles                    │
│     GET /customer/memberships/:membershipId/rewards    │
│     ⚠️ Requiere token del cliente                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  4. Cliente selecciona recompensa                       │
│     Validar: balance >= reward.pointsRequired           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  5. Procesar canje                                      │
│     POST /customer/memberships/:membershipId/           │
│          rewards/:rewardId/redeem                       │
│     ⚠️ Requiere token del cliente                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  6. Mostrar confirmación                               │
│     • Transacción creada                                │
│     • Puntos descontados                                │
│     • Nuevo balance                                     │
└─────────────────────────────────────────────────────────┘
```

**Nota:** Para Partner UI, se recomienda usar los endpoints de Partner API ya que:
- ✅ No requiere token del cliente
- ✅ El partner tiene control completo del proceso
- ✅ Validación automática de permisos del partner
- ✅ Flujo más simple y directo

---

## 🔌 Endpoints Disponibles

### 1. Buscar Cliente por QR o ID

**Desde Partner API:**

```http
GET /partner/customers?qrCode={qrCode}
GET /partner/customers/:membershipId
```

**Respuesta:**
```json
{
  "id": 1,
  "userId": 10,
  "customerName": "Juan Pérez",
  "customerEmail": "juan@example.com",
  "points": 1500,
  "tierId": 2,
  "tierName": "Oro",
  "qrCode": "QR-USER-10-TENANT-1-A3B5C7",
  "status": "active"
}
```

### 2. Obtener Balance de Puntos

**Opción A: Desde Partner API (Recomendado para Partner UI)**

El balance ya viene incluido en la respuesta de obtener cliente:
```http
GET /partner/customers/:membershipId
Authorization: Bearer {partnerToken}
```

**Respuesta incluye:**
```json
{
  "id": 1,
  "points": 1500,  // ✅ Balance incluido
  ...
}
```

**Opción B: Desde Customer API (Solo para Customer UI)**

```http
GET /customer/memberships/:membershipId/points/balance
Authorization: Bearer {customerToken}
```

**Respuesta:**
```json
{
  "membershipId": 1,
  "balance": 1500,
  "pendingPoints": 0,
  "expiringSoon": [
    {
      "points": 100,
      "expiresAt": "2026-03-15T00:00:00.000Z"
    }
  ],
  "lastUpdated": "2026-02-01T10:30:00.000Z"
}
```

### 3. Obtener Recompensas Disponibles

**Opción A: Desde Partner API (Recomendado para Partner UI)**

```http
GET /partner/customers/:membershipId/rewards
Authorization: Bearer {partnerToken}
```

**✅ Implementado:** Este endpoint está disponible y listo para usar.

**Opción B: Desde Customer API (Alternativo)**

```http
GET /customer/memberships/:membershipId/rewards
Authorization: Bearer {customerToken}
```

**Respuesta:**
```json
{
  "rewards": [
    {
      "id": 1,
      "tenantId": 1,
      "name": "Descuento 10%",
      "description": "Descuento del 10% en tu próxima compra",
      "pointsRequired": 500,
      "rewardType": "DISCOUNT",
      "status": "active",
      "isAvailable": true,
      "maxRedemptionsPerUser": null,
      "expiresAt": null
    },
    {
      "id": 2,
      "tenantId": 1,
      "name": "Producto Gratis",
      "description": "Obtén un producto gratis",
      "pointsRequired": 1000,
      "rewardType": "PRODUCT",
      "status": "active",
      "isAvailable": true,
      "maxRedemptionsPerUser": 1,
      "expiresAt": "2026-12-31T23:59:59.000Z"
    }
  ]
}
```

### 4. Canjear Recompensa

**Opción A: Desde Partner API (Recomendado para Partner UI)**

```http
POST /partner/customers/:membershipId/rewards/:rewardId/redeem
Authorization: Bearer {partnerToken}
```

**✅ Implementado:** Este endpoint está disponible y listo para usar.

**Opción B: Desde Customer API (Alternativo)**

```http
POST /customer/memberships/:membershipId/rewards/:rewardId/redeem
Authorization: Bearer {customerToken}
```

**Respuesta Exitosa (200):**
```json
{
  "transactionId": 123,
  "rewardId": 1,
  "pointsUsed": 500,
  "newBalance": 1000,
  "redemptionCode": "REWARD-ABC123-XYZ789"
}
```

**Nota:** El campo `redemptionCode` es opcional y se genera automáticamente cuando se canjea una recompensa. Este código puede ser usado posteriormente por el cliente para validar su canje en el punto de venta.

**Errores Posibles:**
- `400 Bad Request`: No se puede canjear (puntos insuficientes, límite alcanzado, recompensa no disponible)
- `401 Unauthorized`: Token inválido o expirado
- `403 Forbidden`: No tiene permisos
- `404 Not Found`: Recompensa o membership no encontrada

### 5. Validar Código de Canje (NUEVO)

**Endpoint:**
```http
POST /partner/rewards/validate-code
Authorization: Bearer {partnerToken}
Content-Type: application/json

{
  "code": "REWARD-ABC123-XYZ789"
}
```

**✅ Implementado:** Este endpoint está disponible y listo para usar.

**Descripción:**
Valida un código de canje generado por un cliente y lo marca como usado. El código debe pertenecer al tenant del partner autenticado.

**Respuesta Exitosa (200):**
```json
{
  "redemptionCodeId": 1,
  "code": "REWARD-ABC123-XYZ789",
  "transactionId": 123,
  "rewardId": 1,
  "rewardName": "Descuento 10%",
  "rewardCategory": "Descuentos",
  "pointsUsed": 500,
  "membershipId": 1,
  "status": "used",
  "usedAt": "2026-02-02T10:30:00Z"
}
```

**Errores Posibles:**
- `400 Bad Request`: Código inválido, expirado o ya usado
- `401 Unauthorized`: Token inválido o expirado
- `403 Forbidden`: El código no pertenece a tu partner
- `404 Not Found`: Código de canje no encontrado

**Casos de Uso:**
- Cliente presenta código en punto de venta físico
- Validar código escaneado desde QR
- Verificar autenticidad de código antes de aplicar descuento

### 6. Listar Códigos de Canje del Cliente (Customer API)

**Endpoint:**
```http
GET /customer/memberships/:membershipId/rewards/redemption-codes?status=pending&page=1&limit=20
Authorization: Bearer {customerToken}
```

**✅ Implementado:** Este endpoint está disponible para Customer UI.

**Query Parameters:**
- `status` (opcional): Filtrar por estado (`pending`, `used`, `expired`, `cancelled`)
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Límite de resultados (default: 20)

**Respuesta Exitosa (200):**
```json
{
  "codes": [
    {
      "id": 1,
      "code": "REWARD-ABC123-XYZ789",
      "transactionId": 123,
      "rewardId": 1,
      "rewardName": "Descuento 10%",
      "status": "pending",
      "expiresAt": "2026-03-02T10:30:00Z",
      "usedAt": null,
      "createdAt": "2026-02-02T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

## 🛠️ Implementación Paso a Paso

### Paso 1: Buscar Cliente

```typescript
// services/customer.service.ts
async findCustomerByQr(qrCode: string) {
  const response = await fetch(
    `${API_BASE_URL}/partner/customers?qrCode=${qrCode}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${partnerToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Cliente no encontrado');
  }

  return await response.json();
}
```

### Paso 2: Obtener Recompensas Disponibles

**Desde Partner API (Recomendado para Partner UI)**

```typescript
// services/reward.service.ts
async getAvailableRewards(membershipId: number, partnerToken: string) {
  const response = await fetch(
    `${API_BASE_URL}/partner/customers/${membershipId}/rewards`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${partnerToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al obtener recompensas');
  }

  const data = await response.json();
  return data.rewards;
}
```

**Nota:** Para Customer UI, puedes usar el endpoint de Customer API (`/customer/memberships/:id/rewards`) con token del cliente.

### Paso 3: Validar Canje Antes de Procesar

```typescript
// utils/reward.utils.ts
function canRedeemReward(
  customerBalance: number,
  reward: Reward
): { canRedeem: boolean; reason?: string } {
  // Validar puntos suficientes
  if (customerBalance < reward.pointsRequired) {
    return {
      canRedeem: false,
      reason: `Puntos insuficientes. Se requieren ${reward.pointsRequired} puntos, tienes ${customerBalance}`
    };
  }

  // Validar disponibilidad
  if (!reward.isAvailable) {
    return {
      canRedeem: false,
      reason: 'Esta recompensa no está disponible actualmente'
    };
  }

  // Validar expiración
  if (reward.expiresAt && new Date(reward.expiresAt) < new Date()) {
    return {
      canRedeem: false,
      reason: 'Esta recompensa ha expirado'
    };
  }

  return { canRedeem: true };
}
```

### Paso 4: Procesar Canje

**Desde Partner API (Recomendado para Partner UI)**

```typescript
// services/reward.service.ts
async redeemReward(
  membershipId: number,
  rewardId: number,
  partnerToken: string
): Promise<RedeemRewardResponse> {
  const response = await fetch(
    `${API_BASE_URL}/partner/customers/${membershipId}/rewards/${rewardId}/redeem`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${partnerToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al procesar canje');
  }

  return await response.json();
}
```

**Nota:** Para Customer UI, puedes usar el endpoint de Customer API (`/customer/memberships/:id/rewards/:rewardId/redeem`) con token del cliente.

---

## 💻 Ejemplos de Código

### Validar Código de Canje (Partner UI)

```typescript
// services/redemption-code.service.ts
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

interface ValidateCodeResponse {
  redemptionCodeId: number;
  code: string;
  transactionId: number;
  rewardId: number;
  rewardName: string;
  rewardCategory: string;
  pointsUsed: number;
  membershipId: number;
  status: 'pending' | 'used' | 'expired' | 'cancelled';
  usedAt: Date | null;
}

async function validateRedemptionCode(
  code: string,
  partnerToken: string
): Promise<ValidateCodeResponse> {
  const response = await fetch(
    `${API_BASE_URL}/partner/rewards/validate-code`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${partnerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al validar código');
  }

  return await response.json();
}
```

### Componente React para Validar Código

```typescript
// components/RedemptionCodeValidator.tsx
import React, { useState } from 'react';
import { validateRedemptionCode } from '../services/redemption-code.service';

interface RedemptionCodeValidatorProps {
  partnerToken: string;
  onCodeValidated?: (codeInfo: any) => void;
}

export const RedemptionCodeValidator: React.FC<RedemptionCodeValidatorProps> = ({
  partnerToken,
  onCodeValidated
}) => {
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeInfo, setCodeInfo] = useState<any>(null);

  const handleValidate = async () => {
    if (!code.trim()) {
      setError('Por favor ingresa un código');
      return;
    }

    try {
      setValidating(true);
      setError(null);

      const result = await validateRedemptionCode(code.trim(), partnerToken);
      setCodeInfo(result);

      if (onCodeValidated) {
        onCodeValidated(result);
      }

      alert(
        `¡Código validado exitosamente!\n` +
        `Recompensa: ${result.rewardName}\n` +
        `Categoría: ${result.rewardCategory}\n` +
        `Puntos utilizados: ${result.pointsUsed}`
      );
    } catch (err: any) {
      setError(err.message || 'Error al validar código');
      alert(`Error: ${err.message}`);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="redemption-code-validator">
      <h3>Validar Código de Canje</h3>

      <div className="input-group">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="REWARD-ABC123-XYZ789"
          maxLength={50}
          disabled={validating}
        />
        <button
          onClick={handleValidate}
          disabled={validating || !code.trim()}
        >
          {validating ? 'Validando...' : 'Validar'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {codeInfo && (
        <div className="code-info">
          <h4>Información del Código</h4>
          <p><strong>Recompensa:</strong> {codeInfo.rewardName}</p>
          <p><strong>Categoría:</strong> {codeInfo.rewardCategory}</p>
          <p><strong>Puntos utilizados:</strong> {codeInfo.pointsUsed}</p>
          <p><strong>Estado:</strong> {codeInfo.status}</p>
          {codeInfo.usedAt && (
            <p><strong>Validado el:</strong> {new Date(codeInfo.usedAt).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
};
```

### Listar Códigos de Canje (Customer UI)

```typescript
// services/redemption-code.service.ts (Customer UI)
async function getCustomerRedemptionCodes(
  membershipId: number,
  customerToken: string,
  options?: {
    status?: 'pending' | 'used' | 'expired' | 'cancelled';
    page?: number;
    limit?: number;
  }
): Promise<GetCustomerRedemptionCodesResponse> {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const response = await fetch(
    `${API_BASE_URL}/customer/memberships/${membershipId}/rewards/redemption-codes?${params}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al obtener códigos');
  }

  return await response.json();
}
```

---

### Componente React Completo

```typescript
// components/RewardRedemption.tsx
import React, { useState, useEffect } from 'react';
import { findCustomerByQr } from '../services/customer.service';
import { getAvailableRewards, redeemReward } from '../services/reward.service';
import { canRedeemReward } from '../utils/reward.utils';

interface RewardRedemptionProps {
  qrCode: string;
  partnerToken: string;
}

export const RewardRedemption: React.FC<RewardRedemptionProps> = ({
  qrCode,
  partnerToken
}) => {
  const [customer, setCustomer] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeeming, setRedeeming] = useState(false);

  // Cargar cliente y recompensas
  useEffect(() => {
    loadCustomerAndRewards();
  }, [qrCode]);

  const loadCustomerAndRewards = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Buscar cliente
      const customerData = await findCustomerByQr(qrCode, partnerToken);
      setCustomer(customerData);

      // 2. Obtener recompensas disponibles desde Partner API
      const rewardsData = await getAvailableRewards(
        customerData.id,
        partnerToken
      );
      setRewards(rewardsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (rewardId: number) => {
    if (!customer) return;

    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;

    // Validar antes de canjear
    const validation = canRedeemReward(customer.points, reward);
    if (!validation.canRedeem) {
      alert(validation.reason);
      return;
    }

    // Confirmar canje
    const confirmed = window.confirm(
      `¿Confirmar canje de "${reward.name}" por ${reward.pointsRequired} puntos?`
    );

    if (!confirmed) return;

    try {
      setRedeeming(true);
      setError(null);

      // Procesar canje desde Partner API
      const result = await redeemReward(
        customer.id,
        rewardId,
        partnerToken
      );

      // Actualizar balance del cliente
      setCustomer({
        ...customer,
        points: result.newBalance
      });

      // Remover recompensa canjeada de la lista (si tiene límite)
      if (reward.maxRedemptionsPerUser === 1) {
        setRewards(rewards.filter(r => r.id !== rewardId));
      }

      // Mostrar éxito con código de canje
      alert(
        `¡Canje exitoso!\n` +
        `Recompensa: ${reward.name}\n` +
        `Puntos utilizados: ${result.pointsUsed}\n` +
        `Nuevo balance: ${result.newBalance} puntos\n` +
        (result.redemptionCode
          ? `Código de canje: ${result.redemptionCode}\n` +
            `Válido por 30 días`
          : '')
      );

      setSelectedReward(null);
    } catch (err) {
      setError(err.message);
      alert(`Error al procesar canje: ${err.message}`);
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!customer) {
    return <div>Cliente no encontrado</div>;
  }

  return (
    <div className="reward-redemption">
      {/* Información del Cliente */}
      <div className="customer-info">
        <h2>{customer.customerName}</h2>
        <p>Balance: <strong>{customer.points} puntos</strong></p>
        <p>Tier: {customer.tierName}</p>
      </div>

      {/* Lista de Recompensas */}
      <div className="rewards-list">
        <h3>Recompensas Disponibles</h3>
        {rewards.length === 0 ? (
          <p>No hay recompensas disponibles</p>
        ) : (
          <ul>
            {rewards.map(reward => {
              const validation = canRedeemReward(customer.points, reward);
              return (
                <li key={reward.id} className="reward-item">
                  <div className="reward-header">
                    <h4>{reward.name}</h4>
                    <span className="points-required">
                      {reward.pointsRequired} puntos
                    </span>
                  </div>
                  <p className="reward-description">{reward.description}</p>
                  {reward.maxRedemptionsPerUser && (
                    <p className="reward-limit">
                      Límite: {reward.maxRedemptionsPerUser} por cliente
                    </p>
                  )}
                  <button
                    onClick={() => handleRedeem(reward.id)}
                    disabled={!validation.canRedeem || redeeming}
                    className={validation.canRedeem ? 'btn-primary' : 'btn-disabled'}
                  >
                    {redeeming ? 'Procesando...' : 'Canjear'}
                  </button>
                  {!validation.canRedeem && (
                    <span className="validation-error">{validation.reason}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
```

### Hook Personalizado para Canjes

```typescript
// hooks/useRewardRedemption.ts
import { useState, useCallback } from 'react';
import { redeemReward } from '../services/reward.service';
import { canRedeemReward } from '../utils/reward.utils';

export const useRewardRedemption = (
  membershipId: number,
  customerBalance: number,
  customerToken: string
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const redeem = useCallback(
    async (rewardId: number, reward: Reward) => {
      // Validar antes de canjear
      const validation = canRedeemReward(customerBalance, reward);
      if (!validation.canRedeem) {
        throw new Error(validation.reason);
      }

      try {
        setLoading(true);
        setError(null);

        const result = await redeemReward(
          membershipId,
          rewardId,
          customerToken
        );

        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [membershipId, customerBalance, customerToken]
  );

  return {
    redeem,
    loading,
    error
  };
};
```

---

## ⚠️ Manejo de Errores

### Errores Comunes y Soluciones

#### 1. Puntos Insuficientes (400)

```typescript
try {
  await redeemReward(membershipId, rewardId, token);
} catch (error) {
  if (error.status === 400 && error.message.includes('insufficient')) {
    // Mostrar mensaje amigable
    showNotification(
      'Puntos insuficientes',
      `Se requieren ${reward.pointsRequired} puntos, pero el cliente tiene ${customerBalance} puntos`
    );
  }
}
```

#### 2. Recompensa No Disponible (400)

```typescript
if (error.message.includes('not available')) {
  showNotification(
    'Recompensa no disponible',
    'Esta recompensa no está disponible actualmente. Puede estar agotada o expirada.'
  );
  // Recargar lista de recompensas
  await loadRewards();
}
```

#### 3. Límite de Canjes Alcanzado (400)

```typescript
if (error.message.includes('limit')) {
  showNotification(
    'Límite alcanzado',
    'El cliente ya ha alcanzado el límite de canjes para esta recompensa.'
  );
}
```

#### 4. Token Expirado (401)

```typescript
if (error.status === 401) {
  // Redirigir a login o renovar token
  redirectToLogin();
}
```

### Función de Manejo de Errores Centralizada

```typescript
// utils/errorHandler.ts
export function handleRedemptionError(error: any): string {
  if (!error.response) {
    return 'Error de conexión. Por favor, intenta nuevamente.';
  }

  const status = error.response.status;
  const message = error.response.data?.message || error.message;

  switch (status) {
    case 400:
      if (message.includes('insufficient')) {
        return 'Puntos insuficientes para canjear esta recompensa.';
      }
      if (message.includes('not available')) {
        return 'Esta recompensa no está disponible actualmente.';
      }
      if (message.includes('limit')) {
        return 'Se ha alcanzado el límite de canjes para esta recompensa.';
      }
      return message || 'No se puede procesar el canje.';

    case 401:
      return 'Sesión expirada. Por favor, inicia sesión nuevamente.';

    case 403:
      return 'No tienes permisos para realizar esta acción.';

    case 404:
      return 'Recompensa o cliente no encontrado.';

    case 500:
      return 'Error del servidor. Por favor, intenta más tarde.';

    default:
      return 'Error inesperado. Por favor, contacta al soporte.';
  }
}
```

---

## ✅ Mejores Prácticas

### 1. Validación en el Frontend

Siempre valida antes de enviar la petición:

```typescript
// ✅ BUENO: Validar antes de canjear
const validation = canRedeemReward(customerBalance, reward);
if (!validation.canRedeem) {
  showError(validation.reason);
  return;
}

await redeemReward(membershipId, rewardId, token);
```

```typescript
// ❌ MALO: Enviar sin validar
await redeemReward(membershipId, rewardId, token);
// El servidor rechazará, pero es mejor prevenir
```

### 2. Confirmación del Usuario

Siempre pide confirmación antes de canjear:

```typescript
const confirmed = window.confirm(
  `¿Confirmar canje de "${reward.name}" por ${reward.pointsRequired} puntos?`
);

if (!confirmed) return;
```

### 3. Feedback Visual

Muestra estados de carga y éxito:

```typescript
{redeeming && <Spinner />}
{success && <SuccessMessage message="Canje exitoso" />}
{error && <ErrorMessage message={error} />}
```

### 4. Actualización Optimista

Actualiza la UI inmediatamente, luego sincroniza:

```typescript
// Actualizar balance optimísticamente
setCustomer({
  ...customer,
  points: customer.points - reward.pointsRequired
});

try {
  const result = await redeemReward(membershipId, rewardId, token);
  // Confirmar con el balance real del servidor
  setCustomer({
    ...customer,
    points: result.newBalance
  });
} catch (error) {
  // Revertir si falla
  setCustomer({
    ...customer,
    points: customer.points + reward.pointsRequired
  });
}
```

### 5. Manejo de Idempotencia

El backend garantiza idempotencia, pero puedes prevenir doble-clicks:

```typescript
const [redeeming, setRedeeming] = useState(false);

const handleRedeem = async () => {
  if (redeeming) return; // Prevenir doble-click

  setRedeeming(true);
  try {
    await redeemReward(...);
  } finally {
    setRedeeming(false);
  }
};
```

---

## 📱 Casos de Uso Comunes

### Caso 1: Canje Inmediato en Punto de Venta

**Escenario:** Cliente está en la tienda y quiere canjear puntos por un descuento.

**Flujo:**
1. Partner escanea QR del cliente
2. Partner muestra recompensas disponibles
3. Cliente selecciona recompensa
4. Partner procesa canje → Cliente recibe código
5. Partner aplica descuento inmediatamente usando el código

**Implementación:**
```typescript
// Después de procesar canje
const result = await redeemReward(membershipId, rewardId, partnerToken);

// Validar código inmediatamente
const validation = await validateRedemptionCode(
  result.redemptionCode,
  partnerToken
);

// Aplicar descuento según validation.rewardName y validation.rewardCategory
```

### Caso 2: Canje Online con Validación Posterior

**Escenario:** Cliente canjea recompensa desde su app móvil y la usa después en tienda física.

**Flujo:**
1. Cliente canjea recompensa desde Customer UI → Recibe código
2. Cliente guarda código en su app
3. Cliente visita tienda física días después
4. Cliente presenta código al partner
5. Partner valida código → Aplica recompensa

**Implementación Customer UI:**
```typescript
// Cliente canjea y guarda código
const result = await redeemReward(membershipId, rewardId, customerToken);
if (result.redemptionCode) {
  // Guardar código localmente o mostrar QR
  saveCodeLocally(result.redemptionCode);
  showQRCode(result.redemptionCode);
}
```

**Implementación Partner UI:**
```typescript
// Partner valida código presentado
const codeInfo = await validateRedemptionCode(code, partnerToken);
// Aplicar recompensa según codeInfo.rewardName
```

### Caso 3: Verificar Códigos del Cliente

**Escenario:** Cliente quiere ver todos sus códigos de canje (pendientes, usados, expirados).

**Flujo:**
1. Cliente accede a su perfil en Customer UI
2. Cliente navega a "Mis Códigos de Canje"
3. Sistema lista todos sus códigos con estado

**Implementación:**
```typescript
// Obtener códigos del cliente
const codes = await getCustomerRedemptionCodes(membershipId, customerToken, {
  status: 'pending', // opcional: filtrar por estado
  page: 1,
  limit: 20
});

// Mostrar lista de códigos
codes.codes.forEach(code => {
  console.log(`${code.code} - ${code.status} - ${code.rewardName}`);
});
```

### Caso 4: Validación de Código con Escáner QR

**Escenario:** Partner escanea código QR del cliente para validarlo rápidamente.

**Flujo:**
1. Cliente muestra código QR en su app
2. Partner escanea QR con Partner UI
3. Sistema valida código automáticamente
4. Partner aplica recompensa

**Implementación:**
```typescript
// Componente de escáner QR
import { QRScanner } from './QRScanner';

const handleQRScanned = async (scannedCode: string) => {
  // Validar código escaneado
  try {
    const codeInfo = await validateRedemptionCode(scannedCode, partnerToken);
    showSuccessMessage(`Código válido: ${codeInfo.rewardName}`);
    applyReward(codeInfo);
  } catch (error) {
    showErrorMessage('Código inválido o ya usado');
  }
};

<QRScanner onScan={handleQRScanned} />
```

### Caso 5: Canje con Código de Seguridad

**Escenario:** Cliente canjea recompensa y recibe código que debe presentar para seguridad adicional.

**Flujo:**
1. Cliente canjea recompensa → Recibe código
2. Cliente presenta código al partner
3. Partner valida código → Sistema confirma que pertenece al cliente
4. Partner aplica recompensa con seguridad adicional

**Ventajas:**
- Previene fraude (código único por canje)
- Trazabilidad completa (quién validó y cuándo)
- Validación de pertenencia al tenant correcto

---

### Caso 1: Canje desde Escaneo de QR

```typescript
// Flujo completo desde QR
async function handleQrScan(qrCode: string) {
  // 1. Buscar cliente
  const customer = await findCustomerByQr(qrCode);

  // 2. Obtener recompensas
  const rewards = await getAvailableRewards(customer.id);

  // 3. Mostrar UI de selección
  showRewardSelectionModal(customer, rewards);
}
```

### Caso 2: Canje Rápido (Recompensa Pre-seleccionada)

```typescript
// Para recompensas frecuentes (ej: descuento 10%)
async function quickRedeem(membershipId: number, rewardId: number) {
  const reward = { id: rewardId, pointsRequired: 500 };
  const customer = await getCustomer(membershipId);

  if (customer.points >= reward.pointsRequired) {
    const confirmed = confirm(`Canjear por ${reward.pointsRequired} puntos?`);
    if (confirmed) {
      await redeemReward(membershipId, rewardId);
    }
  }
}
```

### Caso 3: Historial de Canjes

```typescript
// Obtener historial de transacciones REDEEM
async function getRedemptionHistory(membershipId: number) {
  const response = await fetch(
    `${API_BASE_URL}/partner/customers/${membershipId}/points-transactions?type=REDEEM`
  );
  return await response.json();
}
```

---

## 🔐 Consideraciones de Seguridad

### 1. Autenticación

**Para Partner UI (Recomendado):**
- **Partner Token**: Requerido para todos los endpoints de Partner API
  - Buscar clientes: `GET /partner/customers`
  - Obtener recompensas: `GET /partner/customers/:id/rewards` ✅ Implementado
  - Procesar canje: `POST /partner/customers/:id/rewards/:rewardId/redeem` ✅ Implementado
  - Validar código: `POST /partner/rewards/validate-code` ✅ Implementado

**Para Customer UI (Alternativo):**
- **Customer Token**: Requerido para endpoints de Customer API
  - Obtener recompensas: `GET /customer/memberships/:id/rewards`
  - Procesar canje: `POST /customer/memberships/:id/rewards/:rewardId/redeem`
  - Listar códigos: `GET /customer/memberships/:id/rewards/redemption-codes` ✅ Implementado

**Nota Importante:**
- ✅ **Partner UI debe usar Partner API** - Los endpoints están implementados y listos para usar
- ✅ **Endpoints disponibles:**
  - `GET /partner/customers/:id/rewards` - Obtener recompensas disponibles
  - `POST /partner/customers/:id/rewards/:rewardId/redeem` - Procesar canje
  - `POST /partner/rewards/validate-code` - Validar código de canje

### 2. Validación de Permisos

El backend valida que:
- El partner tenga acceso al tenant del cliente
- El cliente tenga puntos suficientes
- La recompensa esté disponible y activa
- **NUEVO:** El código de canje pertenece al tenant del partner (al validar)

### 3. Idempotencia

El backend garantiza idempotencia mediante `idempotencyKey`. No es necesario manejarlo en el frontend, pero puedes prevenir doble-clicks.

**Para códigos de canje:**
- Si se canjea la misma recompensa dos veces, se retorna el mismo código (idempotencia)
- Un código solo puede ser usado una vez (marcado como `used` al validar)
- Los códigos tienen constraint UNIQUE en la base de datos

### 4. Seguridad de Códigos de Canje

- **Unicidad**: Cada código es único y no puede duplicarse
- **Expiración**: Códigos válidos por 30 días (configurable)
- **Validación de Tenant**: Solo el partner del tenant puede validar códigos de sus clientes
- **Estado**: Códigos usados no pueden ser reutilizados
- **Trazabilidad**: Cada código está vinculado a una transacción específica

---

## 📝 Notas Adicionales

### Estado de Implementación de Endpoints de Partner API

**✅ Endpoints Implementados:**

1. `GET /partner/customers/:membershipId/rewards`
   - Obtener recompensas disponibles para un customer
   - ✅ Disponible y listo para usar
   - Solo requiere token de Partner

2. `POST /partner/customers/:membershipId/rewards/:rewardId/redeem`
   - Procesar canje de recompensa desde Partner UI
   - ✅ Disponible y listo para usar
   - Solo requiere token de Partner
   - **NUEVO:** Genera automáticamente un código único de canje

3. `POST /partner/rewards/validate-code`
   - Validar código de canje generado por un cliente
   - ✅ Disponible y listo para usar
   - Solo requiere token de Partner
   - Marca el código como usado al validarlo
   - Retorna información completa de la recompensa canjeada

**Endpoints de Customer API para Códigos:**

4. `GET /customer/memberships/:membershipId/rewards/redemption-codes`
   - Listar códigos de canje del cliente
   - ✅ Disponible y listo para usar
   - Requiere token de Customer
   - Soporta filtrado por estado y paginación

**Beneficios de estos endpoints:**
- ✅ Canjes sin requerir token del cliente
- ✅ Validación automática de permisos del partner
- ✅ Mejor integración con Partner UI
- ✅ Flujo más simple y directo

**Validaciones Implementadas:**
- Verifica que el usuario pertenece a un partner
- Verifica que el customer pertenece al partner del usuario
- Valida puntos suficientes, disponibilidad y límites de canje
- Manejo completo de errores con códigos HTTP apropiados
- **NUEVO:** Validación de códigos de canje (estado, expiración, pertenencia al tenant)
- **NUEVO:** Generación automática de códigos únicos al canjear
- **NUEVO:** Prevención de reutilización de códigos (marcado como usado)

### Actualización de Balance

El balance se actualiza automáticamente después del canje mediante el sistema de ledger. No es necesario refrescar manualmente, pero puedes hacerlo para mostrar el balance actualizado:

```typescript
// Después de un canje exitoso
const updatedCustomer = await getCustomer(membershipId);
setCustomer(updatedCustomer);
```

---

## 🚀 Ejemplo Completo de Integración

```typescript
// pages/RewardRedemptionPage.tsx
import React, { useState } from 'react';
import { RewardRedemption } from '../components/RewardRedemption';
import { QRScanner } from '../components/QRScanner';

export const RewardRedemptionPage: React.FC = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const partnerToken = localStorage.getItem('partnerToken');

  const handleQrScanned = async (scannedQr: string) => {
    setQrCode(scannedQr);
    // Aquí podrías obtener el token del cliente si está autenticado
    // o usar un token compartido si el sistema lo permite
  };

  if (!qrCode) {
    return <QRScanner onScan={handleQrScanned} />;
  }

  return (
    <RewardRedemption
      qrCode={qrCode}
      partnerToken={partnerToken}
    />
  );
};
```

---

## 📊 Resumen: Endpoints por Caso de Uso

### Para Partner UI (Recomendado)

| Acción | Endpoint | Estado | Token Requerido |
|--------|----------|--------|-----------------|
| Buscar cliente | `GET /partner/customers?qrCode=...` | ✅ Implementado | Partner |
| Obtener cliente | `GET /partner/customers/:id` | ✅ Implementado | Partner |
| Obtener recompensas | `GET /partner/customers/:id/rewards` | ✅ Implementado | Partner |
| Procesar canje | `POST /partner/customers/:id/rewards/:rewardId/redeem` | ✅ Implementado | Partner |
| Validar código | `POST /partner/rewards/validate-code` | ✅ Implementado | Partner |

**Ventajas:**
- ✅ No requiere token del cliente
- ✅ Validación automática de permisos
- ✅ Flujo más simple

### Para Customer UI (Alternativo)

| Acción | Endpoint | Estado | Token Requerido |
|--------|----------|--------|-----------------|
| Obtener balance | `GET /customer/memberships/:id/points/balance` | ✅ Implementado | Customer |
| Obtener recompensas | `GET /customer/memberships/:id/rewards` | ✅ Implementado | Customer |
| Procesar canje | `POST /customer/memberships/:id/rewards/:rewardId/redeem` | ✅ Implementado | Customer |
| Listar códigos | `GET /customer/memberships/:id/rewards/redemption-codes` | ✅ Implementado | Customer |

**Cuándo usar:**
- Cuando el cliente gestiona sus propios canjes desde su app móvil/web
- Cuando el cliente está autenticado en su propia sesión

---

## 📚 Referencias

- [Plan de Endpoints de Partner API](./PLAN-ENDPOINTS-PARTNER-API-CANJES.md) - Detalles de implementación
- [Flujo Completo de Canje](./FLUJO-CUSTOMER-SUSCRIPCION-ACUMULACION-CANJE.md)
- [Arquitectura del Sistema](./ARCHITECTURE.md)
- [API Guidelines](./API-GUIDELINE.md)

---

---

## 🎫 Sistema de Códigos de Canje

### ¿Qué son los Códigos de Canje?

Cuando un cliente canjea una recompensa desde Customer UI, el sistema genera automáticamente un código único de canje (formato: `REWARD-ABC123-XYZ789`). Este código puede ser usado posteriormente por el cliente para validar su canje en el punto de venta físico.

### Características

- **Generación Automática**: Se genera automáticamente al canjear una recompensa
- **Formato Único**: `REWARD-{PREFIX}-{RANDOM}` (12-16 caracteres alfanuméricos)
- **Validez**: 30 días desde su creación (configurable)
- **Estados**: `pending`, `used`, `expired`, `cancelled`
- **Idempotencia**: Si se canjea la misma recompensa dos veces, se retorna el mismo código

### Flujo de Uso

#### Desde Customer UI:
1. Cliente canjea recompensa → Recibe código automáticamente
2. Cliente puede ver sus códigos: `GET /customer/memberships/:id/rewards/redemption-codes`
3. Cliente presenta código al partner (físico o digital)

#### Desde Partner UI:
1. Cliente presenta código al partner
2. Partner valida código: `POST /partner/rewards/validate-code`
3. Sistema marca código como usado y retorna información de la recompensa
4. Partner aplica la recompensa (descuento, producto gratis, etc.)

### Ejemplo de Flujo Completo

```
Cliente (Customer UI):
1. Canjea "Descuento 10%" por 500 puntos
2. Recibe código: "REWARD-ABC123-XYZ789"
3. Guarda código en su app

Cliente en Tienda Física:
4. Presenta código al partner

Partner (Partner UI):
5. Ingresa código en sistema
6. Valida código → Sistema confirma y marca como usado
7. Aplica descuento del 10% a la compra
```

### Consideraciones Importantes

- **Un código por transacción**: Cada canje genera un código único
- **No reutilizable**: Una vez usado, el código no puede ser usado nuevamente
- **Expiración**: Los códigos expiran después de 30 días (no se pueden validar después)
- **Seguridad**: Solo el partner del tenant puede validar códigos de sus clientes
- **Trazabilidad**: Cada código está vinculado a una transacción REDEEM específica

---

**Última actualización**: 2026-02-02
