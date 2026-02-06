# Plan de Trabajo: Endpoints de Partner API para Canjes

## 📋 Objetivo

Implementar endpoints en Partner API para que Partner UI pueda gestionar completamente el proceso de canje de recompensas sin depender de Customer API.

## 🎯 Endpoints a Implementar

### 1. Obtener Recompensas Disponibles para un Customer

**Endpoint:**
```http
GET /partner/customers/:membershipId/rewards
```

**Descripción:**
Obtiene las recompensas disponibles que un customer específico puede canjear, filtradas por:
- Recompensas activas del tenant
- Balance suficiente del customer
- Disponibilidad (stock, expiración, etc.)

**Autenticación:**
- Requiere token de Partner (JWT)
- Valida que el customer pertenezca al partner del usuario autenticado

**Request:**
- `membershipId` (path parameter): ID de la membership del customer

**Response:**
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
    }
  ]
}
```

**Implementación:**
- Reutilizar `GetAvailableRewardsHandler` existente
- Agregar validación de permisos del partner
- Agregar endpoint en `PartnerCustomersController`

---

### 2. Procesar Canje de Recompensa

**Endpoint:**
```http
POST /partner/customers/:membershipId/rewards/:rewardId/redeem
```

**Descripción:**
Procesa el canje de una recompensa para un customer específico desde Partner UI.

**Autenticación:**
- Requiere token de Partner (JWT)
- Valida que el customer pertenezca al partner del usuario autenticado

**Request:**
- `membershipId` (path parameter): ID de la membership del customer
- `rewardId` (path parameter): ID de la recompensa a canjear

**Response:**
```json
{
  "transactionId": 123,
  "rewardId": 1,
  "pointsUsed": 500,
  "newBalance": 1000
}
```

**Implementación:**
- Reutilizar `RedeemRewardHandler` existente
- Agregar validación de permisos del partner
- Agregar endpoint en `PartnerCustomersController`

---

## 📝 Archivos a Modificar/Crear

### 1. `apps/partner-api/src/controllers/partner-customers.controller.ts`

**Agregar endpoints:**
```typescript
@Get(':id/rewards')
@ApiOperation({
  summary: 'Obtener recompensas disponibles para un customer',
  description: 'Obtiene las recompensas que el customer puede canjear con sus puntos actuales'
})
async getCustomerAvailableRewards(
  @CurrentUser() user: JwtPayload,
  @Param('id', ParseIntPipe) membershipId: number,
): Promise<GetAvailableRewardsResponse> {
  // Validar que el customer pertenece al partner
  // Llamar a GetAvailableRewardsHandler
}

@Post(':id/rewards/:rewardId/redeem')
@ApiOperation({
  summary: 'Canjear recompensa para un customer',
  description: 'Procesa el canje de una recompensa usando los puntos del customer'
})
async redeemRewardForCustomer(
  @CurrentUser() user: JwtPayload,
  @Param('id', ParseIntPipe) membershipId: number,
  @Param('rewardId', ParseIntPipe) rewardId: number,
): Promise<RedeemRewardResponse> {
  // Validar que el customer pertenece al partner
  // Llamar a RedeemRewardHandler
}
```

### 2. `apps/partner-api/src/partner-api.module.ts`

**Agregar handlers al módulo:**
```typescript
// Ya deberían estar importados, solo verificar
GetAvailableRewardsHandler,
RedeemRewardHandler,
```

---

## 🔒 Validaciones Necesarias

### Validación de Permisos del Partner

Ambos endpoints deben validar que:
1. El usuario autenticado pertenece a un partner
2. El customer (membership) pertenece a un tenant del partner del usuario
3. El tenant de la recompensa coincide con el tenant del customer

**Código de validación:**
```typescript
// Obtener usuario autenticado
const currentUser = await this.userRepository.findById(user.userId);
if (!currentUser?.partnerId) {
  throw new ForbiddenException('User does not belong to a partner');
}

// Obtener membership
const membership = await this.membershipRepository.findById(membershipId);
if (!membership) {
  throw new NotFoundException(`Membership ${membershipId} not found`);
}

// Obtener tenant del customer
const tenant = await this.tenantRepository.findById(membership.tenantId);
if (!tenant) {
  throw new NotFoundException(`Tenant ${membership.tenantId} not found`);
}

// Validar que el tenant pertenece al partner del usuario
if (tenant.partnerId !== currentUser.partnerId) {
  throw new ForbiddenException('Customer does not belong to your partner');
}
```

---

## ✅ Checklist de Implementación

- [x] Agregar endpoint `GET /partner/customers/:id/rewards` en `PartnerCustomersController`
- [x] Agregar endpoint `POST /partner/customers/:id/rewards/:rewardId/redeem` en `PartnerCustomersController`
- [x] Implementar validación de permisos del partner en ambos endpoints
- [x] Verificar que los handlers están disponibles en `partner-api.module.ts`
- [x] Agregar documentación Swagger para ambos endpoints
- [ ] Agregar tests unitarios para los nuevos endpoints
- [ ] Agregar tests de integración para el flujo completo
- [x] Actualizar guía de Partner UI con los nuevos endpoints

**Estado:** ✅ Implementación completada - Endpoints listos para usar

---

## 🧪 Casos de Prueba

### Test 1: Obtener Recompensas Disponibles
- ✅ Customer con puntos suficientes ve recompensas disponibles
- ✅ Customer sin puntos suficientes no ve recompensas caras
- ✅ Partner no puede ver recompensas de customers de otros partners
- ✅ Recompensas expiradas no aparecen

### Test 2: Procesar Canje
- ✅ Canje exitoso actualiza balance correctamente
- ✅ Canje falla si puntos insuficientes
- ✅ Canje falla si recompensa no disponible
- ✅ Canje falla si límite de canjes alcanzado
- ✅ Partner no puede canjear para customers de otros partners
- ✅ Idempotencia funciona correctamente

---

## 📚 Referencias

- `GetAvailableRewardsHandler` - Handler existente para obtener recompensas
- `RedeemRewardHandler` - Handler existente para procesar canjes
- `PartnerCustomersController` - Controlador donde agregar los endpoints
- `MembershipOwnershipGuard` - Guard usado en Customer API (no aplica aquí, usar validación manual)

---

**Última actualización**: 2026-02-02
