# Análisis de APIs de Loyalty Events y Multiplicadores de Puntos

**Fecha**: 2026-02-12  
**Objetivo**: Analizar los endpoints de eventos de loyalty y verificar la correcta aplicación de multiplicadores (multiplier) para bonus de puntos.

---

## 📋 Tabla de Contenidos

1. [Endpoints Analizados](#endpoints-analizados)
2. [Flujo de Procesamiento de Eventos](#flujo-de-procesamiento-de-eventos)
3. [Cálculo de Puntos y Reglas](#cálculo-de-puntos-y-reglas)
4. [Multiplicadores de Puntos](#multiplicadores-de-puntos)
5. [Hallazgos y Problemas Identificados](#hallazgos-y-problemas-identificados)
6. [Recomendaciones](#recomendaciones)

---

## 📡 Endpoints Analizados

### 1. POST `/partner/loyalty/events/purchase`

**Archivo**: `apps/partner-api/src/controllers/loyalty-events.controller.ts` (líneas 662-706)

**Propósito**: Procesa eventos de compra y otorga puntos según las reglas de recompensa activas.

**Request DTO**: `ProcessPurchaseEventRequest`
- `tenantId`: ID del tenant
- `orderId`: ID único de la orden (sourceEventId) - **idempotencia**
- `occurredAt`: Fecha y hora del evento
- `membershipRef`: Referencia a la membresía (membershipId, customerId, tenantId, o qrCode)
- `netAmount`: Monto neto (sin impuestos/envío) - **usado para cálculo de puntos**
- `grossAmount`: Monto bruto (con impuestos/envío)
- `currency`: Código de moneda (ISO 4217)
- `items`: Array de items (opcional, requerido para reglas BONUS_CATEGORY/BONUS_SKU)
- `branchId`: ID de sucursal (opcional)
- Otros campos opcionales

**Eventos generados**: `eventType: 'PURCHASE'`

---

### 2. POST `/partner/loyalty/events/visit`

**Archivo**: `apps/partner-api/src/controllers/loyalty-events.controller.ts` (líneas 790-826)

**Propósito**: Procesa eventos de visita a tienda y otorga puntos según las reglas activas.

**Request DTO**: `ProcessVisitEventRequest`
- `tenantId`: ID del tenant
- `visitId`: ID único de la visita (sourceEventId) - **idempotencia**
- `occurredAt`: Fecha y hora del evento
- `membershipRef`: Referencia a la membresía
- `branchId`: ID de sucursal (opcional)
- Otros campos opcionales (storeId, channel, visitType, durationMinutes)

**Eventos generados**: `eventType: 'VISIT'`

**Nota**: Después de crear transacciones exitosas, incrementa `totalVisits` y actualiza `lastVisit` en la membresía (líneas 324-329 de `process-loyalty-event.handler.ts`).

---

### 3. POST `/partner/loyalty/events/custom`

**Archivo**: `apps/partner-api/src/controllers/loyalty-events.controller.ts` (líneas 860-901)

**Propósito**: Procesa eventos personalizados (ej: cumpleaños, aniversario) y otorga puntos según las reglas activas.

**Request DTO**: `ProcessCustomEventRequest`
- `tenantId`: ID del tenant
- `eventId`: ID único del evento (sourceEventId) - **idempotencia**
- `eventType`: Tipo de evento personalizado (ej: "BIRTHDAY", "ANNIVERSARY")
- `occurredAt`: Fecha y hora del evento
- `membershipRef`: Referencia a la membresía
- `amount`: Monto opcional para eventos con valor
- `currency`: Código de moneda (opcional)
- `branchId`: ID de sucursal (opcional)
- Otros campos opcionales

**Eventos generados**: `eventType: 'CUSTOM'` con `payload.customEventType` definiendo el tipo específico.

---

## 🔄 Flujo de Procesamiento de Eventos

Todos los endpoints siguen el mismo flujo orquestado por `ProcessLoyaltyEventHandler`:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Controller recibe request y construye LoyaltyEvent          │
│    - Valida campos requeridos                                   │
│    - Extrae branchId del payload si existe                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. EventNormalizer.normalize()                                  │
│    - Normaliza el evento a formato estándar                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. MembershipResolver.resolveActive()                           │
│    - Resuelve membresía usando membershipRef                    │
│    - Valida que la membresía esté activa                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. ProgramCompatibilityResolver.resolveCompatiblePrograms()    │
│    - Obtiene enrollments activos de la membresía               │
│    - Filtra programas compatibles según scope y compatibility  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Cargar CustomerTier actual (si existe)                      │
│    - tierRepository.findById(membership.tierId)                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. OPTIMIZACIÓN: Batch loading de reglas                       │
│    - Cargar TODAS las reglas de TODOS los programas en batch   │
│    - ruleRepository.findActiveByProgramIdsAndTrigger()          │
│    - Evita N queries (una por programa)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Loop por cada programa compatible                           │
│    ┌───────────────────────────────────────────────────────┐   │
│    │ 7.1. RewardRuleEvaluator.evaluateRules()             │   │
│    │      - Filtra reglas activas por trigger             │   │
│    │      - Verifica eligibility (tier, status, amounts)  │   │
│    │      - Verifica frequency limits y cooldowns         │   │
│    │      - Calcula puntos base según fórmula             │   │
│    │      - ✅ Aplica TierBenefit.pointsMultiplier       │   │
│    │      - ✅ Aplica CustomerTier.multiplier            │   │
│    │      - Genera RuleEvaluationResult[]                 │   │
│    └───────────────────────────────────────────────────────┘   │
│    │                                                             │
│    └─→ IdempotencyKeyGenerator.generateKey()                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. ConflictResolver.resolveConflicts()                          │
│    - Resuelve colisiones entre reglas según stackPolicy        │
│    - Aplica caps por evento/día/mes si están definidos         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. OPTIMIZACIÓN: Batch loading de datos para transacciones     │
│    - Verificar idempotencia en batch (findByIdempotencyKeys)   │
│    - Cargar reglas en batch (findByIds)                        │
│    - Cargar programas en batch (findByIds)                     │
│    - Cargar tenant una sola vez                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. Loop por cada evaluación (crear transacciones)             │
│     - Verificar idempotencia (desde Map precargado)            │
│     - Calcular expiresAt según ExpirationCalculator            │
│     - Crear PointsTransaction.createEarning()                  │
│     - Guardar transacción en ledger (inmutable)                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 11. Actualizar membership según evento                         │
│     - VISIT: membership.recordVisit() → totalVisits++          │
│     - PURCHASE: membership.recordPurchase() → totalSpent++     │
│     - PURCHASE: Procesar referidos si es primera compra        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 12. BalanceSyncService.syncAfterTransaction()                  │
│     - Recalcula balance desde ledger (SUM pointsDelta)         │
│     - Actualiza customer_memberships.points (proyección)       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 13. TierChangeService.evaluateAndApplyTierChange()             │
│     - Evalúa si el usuario debe cambiar de tier               │
│     - Aplica cambio de tier si corresponde                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 14. Retornar ProcessLoyaltyEventResult                         │
│     - eventId, membershipId, programsProcessed                 │
│     - transactionsCreated, totalPointsAwarded                  │
│     - evaluations, skipped                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧮 Cálculo de Puntos y Reglas

### Archivo: `reward-rule-evaluator.service.ts`

#### Método Principal: `evaluateRules()`

**Responsabilidades**:
1. Obtener reglas activas del programa que coincidan con el trigger (eventType)
2. Filtrar reglas por eligibility (tier, status, amounts, categories, etc.)
3. Filtrar reglas por límites de frecuencia y cooldown
4. Calcular puntos base según la fórmula de la regla
5. **Aplicar multiplicadores de tier (TierBenefit y CustomerTier)**
6. Generar `RuleEvaluationResult[]` con puntos finales

#### Fórmulas de Puntos Soportadas

**1. Fixed (Puntos Fijos)**
```typescript
// Líneas 503-504
case 'fixed':
  basePoints = rule.pointsFormula.points;
  break;
```

**2. Rate (Tasa/Porcentaje)**
```typescript
// Líneas 507-549
case 'rate':
  if (event.eventType === 'PURCHASE' && 'orderId' in event.payload) {
    const payload = event.payload as any;
    
    // BONUS_CATEGORY o BONUS_SKU: calcular por items específicos
    if (rule.earningDomain === 'BONUS_CATEGORY' || rule.earningDomain === 'BONUS_SKU') {
      basePoints = this.calculatePointsByCategoryOrSku(rule, payload);
    } else {
      // Cálculo normal por monto total
      const amount = rule.pointsFormula.amountField === 'netAmount'
        ? payload.netAmount
        : payload.grossAmount;
      const rawPoints = amount * rule.pointsFormula.rate;
      
      // Redondeo: floor, ceil, nearest
      // Min/Max points
    }
  }
  break;
```

**3. Table (Tabla de Rangos)**
```typescript
// Líneas 552-568
case 'table':
  if (event.eventType === 'PURCHASE' && 'orderId' in event.payload) {
    const payload = event.payload as any;
    const amount = rule.pointsFormula.amountField === 'netAmount'
      ? payload.netAmount
      : payload.grossAmount;
    
    // Buscar en la tabla
    for (const row of rule.pointsFormula.table) {
      if (amount >= row.min && (row.max === null || amount <= row.max)) {
        basePoints = row.points;
        break;
      }
    }
  }
  break;
```

**4. Hybrid (Base + Bonuses)**
```typescript
// Líneas 570-601
case 'hybrid':
  // Calcular base (fixed o rate)
  if (rule.pointsFormula.base.type === 'fixed') {
    basePoints = rule.pointsFormula.base.points;
  } else if (rule.pointsFormula.base.type === 'rate') {
    // Similar a rate pero sin min/max aquí
  }
  
  // Aplicar bonos si aplican
  for (const bonus of rule.pointsFormula.bonuses) {
    if (bonus.bonus.type === 'fixed') {
      basePoints += bonus.bonus.points;
    } else if (bonus.bonus.type === 'rate') {
      // Calcular bonus por rate
    }
  }
  break;
```

#### Cálculo por Categoría o SKU

**Método**: `calculatePointsByCategoryOrSku()` (líneas 941-1014)

**Solo aplica a reglas con earningDomain**:
- `BONUS_CATEGORY`: Calcular puntos solo para items de una categoría específica
- `BONUS_SKU`: Calcular puntos solo para items con un SKU específico

**Lógica**:
```typescript
for (const item of payload.items) {
  if (itemMatches) { // Verifica si el item coincide con scope de la regla
    if (rule.pointsFormula.type === 'rate') {
      const itemAmount = item.unitPrice * item.qty;
      const rawPoints = itemAmount * rule.pointsFormula.rate;
      // Redondeo y min/max por item
      totalPoints += itemPoints;
    } else if (rule.pointsFormula.type === 'fixed') {
      // Puntos fijos por item que coincida
      totalPoints += rule.pointsFormula.points * item.qty;
    }
  }
}
```

**✅ Correcto**: Este método calcula puntos item por item, lo que permite aplicar tasas diferentes a productos específicos.

---

## 🎯 Multiplicadores de Puntos

### 1. TierBenefit.pointsMultiplier

**Archivo**: `libs/domain/src/entities/tier/tier-benefit.entity.ts`

**Definición**:
```typescript
public readonly pointsMultiplier: number | null // Multiplicador global (ej: 1.25 = 25% bonus)
```

**Método de Aplicación**:
```typescript
// Líneas 114-119
applyMultiplier(basePoints: number): number {
  if (!this.pointsMultiplier) {
    return basePoints;
  }
  return Math.floor(basePoints * this.pointsMultiplier);
}
```

**✅ Aplicación en RewardRuleEvaluator** (líneas 149-156):
```typescript
// Aplicar TierBenefits si existe
if (tierBenefit && tierBenefit.isActive()) {
  const beforeMultiplier = points;
  points = tierBenefit.applyMultiplier(points);
  console.log(
    `[RULE_EVAL] Rule ${rule.id} - Tier benefit applied: ${beforeMultiplier} -> ${points} (multiplier: ${tierBenefit.pointsMultiplier})`,
  );
}
```

**Contexto**:
- Se obtiene en el handler principal (líneas 133-136 de `reward-rule-evaluator.service.ts`)
- Se busca por `programId` y `tierId`: `tierBenefitRepository.findByProgramIdAndTierId(programId, tier.id)`
- Solo aplica si el tier tiene un `TierBenefit` configurado para el programa específico

**Ejemplo**:
```
Base points: 100
TierBenefit.pointsMultiplier: 1.25
Resultado: Math.floor(100 * 1.25) = 125 puntos
```

---

### 2. CustomerTier.multiplier

**Archivo**: `libs/domain/src/entities/customer/customer-tier.entity.ts`

**Definición**:
```typescript
public readonly multiplier: number | null // Multiplicador de puntos (ej: 1.05 = 5% bonus)
```

**Método de Aplicación**:
```typescript
// Líneas 86-91
applyMultiplier(basePoints: number): number {
  if (this.multiplier === null) {
    return basePoints;
  }
  return Math.floor(basePoints * this.multiplier);
}
```

**✅ Aplicación en RewardRuleEvaluator** (líneas 712-715):
```typescript
// Aplicar multiplicador de tier si existe
if (tier && tier.multiplier) {
  basePoints = Math.round(basePoints * tier.multiplier);
}
```

**Contexto**:
- Se aplica **dentro del método `calculatePoints()`**, **DESPUÉS** de calcular los puntos base según la fórmula
- Se aplica **ANTES** de aplicar el `TierBenefit.pointsMultiplier`

**Ejemplo**:
```
Base points (según fórmula): 100
CustomerTier.multiplier: 1.05
Resultado: Math.round(100 * 1.05) = 105 puntos
```

---

### 3. Orden de Aplicación de Multiplicadores

**Secuencia completa** (según código en `reward-rule-evaluator.service.ts`):

```typescript
// 1. Calcular puntos base según fórmula (líneas 502-710)
let basePoints = 0;
switch (rule.pointsFormula.type) {
  case 'fixed': basePoints = rule.pointsFormula.points; break;
  case 'rate': basePoints = amount * rule.pointsFormula.rate; break;
  case 'table': /* buscar en tabla */ break;
  case 'hybrid': /* calcular base + bonuses */ break;
}

// 2. Aplicar multiplicador de CustomerTier (líneas 712-715)
if (tier && tier.multiplier) {
  basePoints = Math.round(basePoints * tier.multiplier);
}

// 3. Asignar a variable `points` para aplicar TierBenefit (línea 147)
let points = basePoints;

// 4. Aplicar multiplicador de TierBenefit (líneas 149-156)
if (tierBenefit && tierBenefit.isActive()) {
  const beforeMultiplier = points;
  points = tierBenefit.applyMultiplier(points);
  console.log(
    `[RULE_EVAL] Rule ${rule.id} - Tier benefit applied: ${beforeMultiplier} -> ${points} (multiplier: ${tierBenefit.pointsMultiplier})`,
  );
}
```

**Orden correcto**:
1. **Puntos base** (según fórmula: fixed, rate, table, hybrid)
2. **CustomerTier.multiplier** (si existe)
3. **TierBenefit.pointsMultiplier** (si existe)

**Ejemplo completo**:
```
Evento: Compra de $100
Regla: rate = 0.01 (1 punto por $1)

1. Base points: 100 * 0.01 = 100 puntos
2. CustomerTier.multiplier: 1.05 → 100 * 1.05 = 105 puntos
3. TierBenefit.pointsMultiplier: 1.25 → 105 * 1.25 = 131.25 → Math.floor = 131 puntos

Puntos finales: 131
```

---

## 🔍 Hallazgos y Problemas Identificados

### ✅ **CORRECTO: Multiplicadores se están aplicando correctamente**

Los tres endpoints (`/purchase`, `/visit`, `/custom`) **SÍ están aplicando correctamente** los multiplicadores de puntos. El flujo es:

1. **Controller** → construye `LoyaltyEvent` con `eventType` y `payload`
2. **ProcessLoyaltyEventHandler** → orquesta todo el flujo
3. **RewardRuleEvaluator.evaluateRules()** → calcula puntos y aplica multiplicadores:
   - Línea 142: Calcula `basePoints` usando `calculatePoints()`
   - Línea 147: Asigna `let points = basePoints`
   - Líneas 149-156: Aplica `TierBenefit.pointsMultiplier` si existe
4. **CustomerTier.multiplier** se aplica **dentro de `calculatePoints()`** (líneas 712-715)

### ⚠️ **ADVERTENCIA: Orden de aplicación de multiplicadores**

**Problema identificado**:

El `CustomerTier.multiplier` se aplica **DENTRO** del método `calculatePoints()` (línea 712-715), **ANTES** de que se aplique el `TierBenefit.pointsMultiplier` (líneas 149-156).

Sin embargo, **esto podría no ser el comportamiento deseado** dependiendo de la lógica de negocio:

**Opción A (Actual)**:
```
Base → CustomerTier.multiplier → TierBenefit.pointsMultiplier
100 → 105 → 131 puntos
```

**Opción B (Alternativa)**:
```
Base → TierBenefit.pointsMultiplier → CustomerTier.multiplier
100 → 125 → 131 puntos (mismo resultado si se multiplican en cualquier orden)
```

**Nota matemática**: Dado que la multiplicación es conmutativa, el orden **NO afecta el resultado final** si ambos multiplicadores se aplican:
```
100 * 1.05 * 1.25 = 100 * 1.25 * 1.05 = 131.25
```

**Problema real**: El `CustomerTier.multiplier` está **dentro** de `calculatePoints()`, lo que significa que se aplica **durante el cálculo base**, no como un paso separado. Esto puede causar confusión al leer el código.

**Recomendación**: Mover la aplicación de `CustomerTier.multiplier` **fuera** de `calculatePoints()`, al mismo nivel que `TierBenefit.pointsMultiplier`, para mayor claridad y consistencia.

---

### ⚠️ **ADVERTENCIA: Inconsistencia en redondeo**

**Problema**:
- `TierBenefit.applyMultiplier()` usa `Math.floor()` (línea 118)
- `CustomerTier.multiplier` usa `Math.round()` (línea 714)

**Ejemplo**:
```
Base: 100
CustomerTier.multiplier: 1.05 → Math.round(105) = 105 ✅
TierBenefit.pointsMultiplier: 1.25 → Math.floor(131.25) = 131 ✅

vs.

Base: 100
TierBenefit.pointsMultiplier: 1.25 → Math.floor(125) = 125 ✅
CustomerTier.multiplier: 1.05 → Math.round(131.25) = 131 ✅
```

En este caso no hay diferencia, pero con valores más pequeños podría haber discrepancias:

```
Base: 9
CustomerTier.multiplier: 1.05 → Math.round(9.45) = 9 (pierde 0.45)
TierBenefit.pointsMultiplier: 1.25 → Math.floor(11.25) = 11 puntos finales

vs.

Base: 9
TierBenefit.pointsMultiplier: 1.25 → Math.floor(11.25) = 11
CustomerTier.multiplier: 1.05 → Math.round(11.55) = 12 puntos finales
```

**Recomendación**: Usar la misma estrategia de redondeo en ambos multiplicadores:
- **Opción 1**: `Math.floor()` para ambos (siempre redondea hacia abajo, más conservador)
- **Opción 2**: `Math.round()` para ambos (redondea al más cercano, más justo)

---

### ✅ **CORRECTO: Idempotencia garantizada**

Los tres endpoints garantizan idempotencia mediante:

1. **sourceEventId único por endpoint**:
   - `PURCHASE`: `orderId` (línea 683)
   - `VISIT`: `visitId` (línea 808)
   - `CUSTOM`: `eventId` (línea 881)

2. **IdempotencyKeyGenerator** genera keys únicas (líneas 172-177 de `process-loyalty-event.handler.ts`)

3. **Verificación en batch** antes de insertar transacciones (líneas 197-200)

4. **Índice UNIQUE en BD** en `points_transactions.idempotency_key`

---

### ✅ **CORRECTO: Cálculo por categoría/SKU**

El método `calculatePointsByCategoryOrSku()` (líneas 941-1014) calcula correctamente puntos para items específicos:

- **BONUS_CATEGORY**: Solo suma puntos de items de una categoría específica
- **BONUS_SKU**: Solo suma puntos de items con un SKU específico

Esto permite, por ejemplo:
```
Regla 1: BASE_PURCHASE → 1% del total (100 puntos por $100)
Regla 2: BONUS_CATEGORY (Electrónica) → 5% adicional solo para items de electrónica (50 puntos por $50 en electrónica)
Total: 150 puntos
```

---

### ⚠️ **ADVERTENCIA: Logs de debugging en producción**

Hay múltiples `console.log()` en el código de producción:

**Ejemplos**:
- `process-loyalty-event.handler.ts`: líneas 125, 132, 139, 155, 160, 165
- `reward-rule-evaluator.service.ts`: líneas 39, 49, 60, 78, 92, 110, 138, 143, 153, 176, 181, 186, 296

**Problema**: Los `console.log()` en producción pueden:
- Generar mucho volumen de logs
- Afectar performance (I/O es costoso)
- Dificultar la búsqueda de errores reales

**Recomendación**: Reemplazar `console.log()` por:
- `this.logger.debug()` para logs de debugging (se pueden desactivar en producción)
- `this.logger.log()` solo para eventos importantes
- `this.logger.warn()` para advertencias
- `this.logger.error()` para errores

---

### ✅ **CORRECTO: Optimizaciones de batch loading**

El handler implementa correctamente optimizaciones para evitar N+1 queries:

1. **Batch loading de reglas** (líneas 103-118):
   ```typescript
   const allRules = await this.ruleRepository.findActiveByProgramIdsAndTrigger(
     allProgramIds,
     normalizedEvent.eventType,
   );
   ```

2. **Batch verification de idempotencia** (líneas 197-200):
   ```typescript
   const existingTransactionsMap = await this.pointsTransactionRepository.findByIdempotencyKeys(
     idempotencyKeys,
   );
   ```

3. **Batch loading de reglas, programas, y tenant** (líneas 202-234)

Esto reduce significativamente las queries a la base de datos.

---

## 📋 Recomendaciones

### 1. **Refactorizar aplicación de CustomerTier.multiplier**

**Problema**: El `CustomerTier.multiplier` se aplica **dentro** de `calculatePoints()`, lo que:
- Dificulta el mantenimiento
- Hace menos obvio el orden de aplicación
- Mezcla cálculo de puntos base con aplicación de bonos de tier

**Solución**: Mover la aplicación de `CustomerTier.multiplier` al mismo nivel que `TierBenefit.pointsMultiplier`.

**Código propuesto**:

```typescript
// reward-rule-evaluator.service.ts - Método evaluateRules()

for (const rule of rulesPassingLimits) {
  try {
    // 1. Calcular puntos base (SIN aplicar CustomerTier.multiplier aquí)
    const basePoints = this.calculatePoints(rule, event, null); // ← Pasar null para tier
    console.log(
      `[RULE_EVAL] Rule ${rule.id} (${rule.name}) - Base points: ${basePoints}, Formula: ${rule.pointsFormula.type}`,
    );

    let points = basePoints;

    // 2. Aplicar CustomerTier.multiplier si existe
    if (tier && tier.multiplier) {
      const beforeTierMultiplier = points;
      points = tier.applyMultiplier(points);
      console.log(
        `[RULE_EVAL] Rule ${rule.id} - CustomerTier multiplier applied: ${beforeTierMultiplier} -> ${points} (multiplier: ${tier.multiplier})`,
      );
    }

    // 3. Aplicar TierBenefit.pointsMultiplier si existe
    if (tierBenefit && tierBenefit.isActive()) {
      const beforeBenefitMultiplier = points;
      points = tierBenefit.applyMultiplier(points);
      console.log(
        `[RULE_EVAL] Rule ${rule.id} - TierBenefit multiplier applied: ${beforeBenefitMultiplier} -> ${points} (multiplier: ${tierBenefit.pointsMultiplier})`,
      );
    }

    // ... resto del código
  }
}
```

**Y remover la aplicación de `CustomerTier.multiplier` de `calculatePoints()`**:

```typescript
// reward-rule-evaluator.service.ts - Método calculatePoints()

private calculatePoints(
  rule: RewardRule,
  event: LoyaltyEvent,
  tier: CustomerTier | null, // ← Ya no se usa aquí
): number {
  let basePoints = 0;

  // Calcular puntos base según fórmula
  switch (rule.pointsFormula.type) {
    // ... todo el código de cálculo ...
  }

  // ❌ REMOVER ESTAS LÍNEAS:
  // if (tier && tier.multiplier) {
  //   basePoints = Math.round(basePoints * tier.multiplier);
  // }

  return Math.max(0, basePoints); // Asegurar que no sea negativo
}
```

**Beneficios**:
- ✅ Código más claro y fácil de mantener
- ✅ Orden de aplicación más obvio
- ✅ Separación de responsabilidades (cálculo base vs. bonos de tier)
- ✅ Consistencia con la aplicación de `TierBenefit.pointsMultiplier`

---

### 2. **Estandarizar estrategia de redondeo**

**Problema**: `TierBenefit` usa `Math.floor()` y `CustomerTier` usa `Math.round()`.

**Solución**: Elegir una estrategia y aplicarla consistentemente.

**Opción A - Usar `Math.floor()` (más conservador)**:
```typescript
// customer-tier.entity.ts
applyMultiplier(basePoints: number): number {
  if (this.multiplier === null) {
    return basePoints;
  }
  return Math.floor(basePoints * this.multiplier); // ← Cambiar de Math.round
}
```

**Opción B - Usar `Math.round()` (más justo)**:
```typescript
// tier-benefit.entity.ts
applyMultiplier(basePoints: number): number {
  if (!this.pointsMultiplier) {
    return basePoints;
  }
  return Math.round(basePoints * this.pointsMultiplier); // ← Cambiar de Math.floor
}
```

**Recomendación**: Usar `Math.floor()` para ser consistente con la mayoría de las fórmulas de puntos que ya usan `Math.floor()` en el código.

---

### 3. **Reemplazar console.log() por logger**

**Problema**: Múltiples `console.log()` en código de producción.

**Solución**: Usar el logger de NestJS con niveles apropiados.

**Ejemplo**:

```typescript
// reward-rule-evaluator.service.ts

// ❌ Antes:
console.log(
  `[RULE_EVAL] Starting evaluation - programId: ${programId}, eventType: ${event.eventType}`,
);

// ✅ Después:
this.logger.debug(
  `Starting evaluation - programId: ${programId}, eventType: ${event.eventType}`,
  { programId, eventType: event.eventType, membershipId: membership.id },
);
```

**Configurar logger** en `process-loyalty-event.handler.ts` ya tiene un logger, solo falta agregarlo al evaluator:

```typescript
@Injectable()
export class RewardRuleEvaluator {
  private readonly logger = new Logger(RewardRuleEvaluator.name); // ← Agregar

  constructor(
    // ... dependencies
  ) {}

  async evaluateRules(...) {
    this.logger.debug('Starting rule evaluation', { programId, eventType }); // ← Usar
    // ...
  }
}
```

**Niveles de log recomendados**:
- `debug`: Logs de debugging (se pueden desactivar en producción)
- `log`: Eventos importantes del flujo
- `warn`: Advertencias (skipped rules, limits reached)
- `error`: Errores críticos

---

### 4. **Documentar orden de multiplicadores en código**

**Agregar comentarios claros** en el código sobre el orden de aplicación:

```typescript
// reward-rule-evaluator.service.ts - Método evaluateRules()

/**
 * Orden de aplicación de multiplicadores:
 * 1. Calcular puntos base según fórmula (fixed, rate, table, hybrid)
 * 2. Aplicar CustomerTier.multiplier (si existe) - Bonus de tier global
 * 3. Aplicar TierBenefit.pointsMultiplier (si existe) - Bonus de tier por programa
 * 
 * Ejemplo:
 * Base: 100 puntos
 * CustomerTier.multiplier: 1.05 → 105 puntos
 * TierBenefit.pointsMultiplier: 1.25 → 131 puntos (Math.floor(105 * 1.25))
 */
for (const rule of rulesPassingLimits) {
  // ... código
}
```

---

### 5. **Agregar tests unitarios para multiplicadores**

**Problema**: No se verificó si existen tests que validen el orden de aplicación de multiplicadores.

**Solución**: Agregar tests que verifiquen:

```typescript
// reward-rule-evaluator.service.spec.ts

describe('RewardRuleEvaluator - Multipliers', () => {
  it('should apply CustomerTier.multiplier before TierBenefit.pointsMultiplier', async () => {
    // Arrange
    const rule = createMockRule({ pointsFormula: { type: 'fixed', points: 100 } });
    const tier = createMockTier({ multiplier: 1.05 });
    const tierBenefit = createMockTierBenefit({ pointsMultiplier: 1.25 });
    const event = createMockPurchaseEvent();
    const membership = createMockMembership();

    mockRuleRepository.findActiveByProgramIdAndTrigger.mockResolvedValue([rule]);
    mockTierBenefitRepository.findByProgramIdAndTierId.mockResolvedValue(tierBenefit);

    // Act
    const results = await evaluator.evaluateRules(1, event, membership, tier);

    // Assert
    expect(results).toHaveLength(1);
    expect(results[0].points).toBe(131); // 100 * 1.05 * 1.25 = 131.25 → Math.floor = 131
  });

  it('should apply only CustomerTier.multiplier if TierBenefit does not exist', async () => {
    // Arrange
    const rule = createMockRule({ pointsFormula: { type: 'fixed', points: 100 } });
    const tier = createMockTier({ multiplier: 1.05 });
    const event = createMockPurchaseEvent();
    const membership = createMockMembership();

    mockRuleRepository.findActiveByProgramIdAndTrigger.mockResolvedValue([rule]);
    mockTierBenefitRepository.findByProgramIdAndTierId.mockResolvedValue(null);

    // Act
    const results = await evaluator.evaluateRules(1, event, membership, tier);

    // Assert
    expect(results).toHaveLength(1);
    expect(results[0].points).toBe(105); // 100 * 1.05 = 105
  });

  it('should apply only TierBenefit.pointsMultiplier if CustomerTier.multiplier is null', async () => {
    // Arrange
    const rule = createMockRule({ pointsFormula: { type: 'fixed', points: 100 } });
    const tier = createMockTier({ multiplier: null });
    const tierBenefit = createMockTierBenefit({ pointsMultiplier: 1.25 });
    const event = createMockPurchaseEvent();
    const membership = createMockMembership();

    mockRuleRepository.findActiveByProgramIdAndTrigger.mockResolvedValue([rule]);
    mockTierBenefitRepository.findByProgramIdAndTierId.mockResolvedValue(tierBenefit);

    // Act
    const results = await evaluator.evaluateRules(1, event, membership, tier);

    // Assert
    expect(results).toHaveLength(1);
    expect(results[0].points).toBe(125); // 100 * 1.25 = 125
  });
});
```

---

## 📊 Resumen Ejecutivo

### ✅ Lo que está funcionando correctamente

1. **Aplicación de multiplicadores**: Tanto `TierBenefit.pointsMultiplier` como `CustomerTier.multiplier` **SÍ se están aplicando correctamente** en los tres endpoints (`/purchase`, `/visit`, `/custom`).

2. **Cálculo de puntos por fórmulas**: Las 4 fórmulas (fixed, rate, table, hybrid) funcionan correctamente.

3. **Cálculo por categoría/SKU**: El método `calculatePointsByCategoryOrSku()` calcula correctamente puntos para items específicos.

4. **Idempotencia**: Los tres endpoints garantizan idempotencia mediante `sourceEventId` único y verificación en batch.

5. **Optimizaciones de performance**: Batch loading de reglas, idempotencia, y otros datos reduce queries a la BD.

### ⚠️ Problemas identificados

1. **Ubicación de `CustomerTier.multiplier`**: Se aplica **dentro** de `calculatePoints()` en lugar de al mismo nivel que `TierBenefit.pointsMultiplier`, lo que dificulta el mantenimiento.

2. **Inconsistencia en redondeo**: `TierBenefit` usa `Math.floor()` y `CustomerTier` usa `Math.round()`.

3. **Logs de debugging en producción**: Múltiples `console.log()` en código de producción.

### 📋 Acciones recomendadas

| Prioridad | Acción | Impacto |
|-----------|--------|---------|
| **ALTA** | Refactorizar aplicación de `CustomerTier.multiplier` fuera de `calculatePoints()` | Mejora mantenibilidad y claridad |
| **MEDIA** | Estandarizar estrategia de redondeo (`Math.floor()` vs. `Math.round()`) | Evita inconsistencias futuras |
| **MEDIA** | Reemplazar `console.log()` por `logger.debug/log/warn/error()` | Mejora performance y gestión de logs |
| **BAJA** | Documentar orden de multiplicadores en código | Mejora comprensión para futuros desarrolladores |
| **BAJA** | Agregar tests unitarios para multiplicadores | Evita regresiones en el futuro |

---

## 🎯 Conclusión

Los APIs de loyalty events (`/purchase`, `/visit`, `/custom`) **SÍ están aplicando correctamente** los multiplicadores de puntos (`TierBenefit.pointsMultiplier` y `CustomerTier.multiplier`). El flujo de cálculo de puntos y las reglas funcionan según lo esperado.

Sin embargo, se identificaron **oportunidades de mejora** relacionadas con:
- Ubicación y claridad del código de multiplicadores
- Consistencia en estrategias de redondeo
- Gestión de logs de debugging

Implementar las recomendaciones mejorará la mantenibilidad, claridad, y robustez del código sin cambiar su comportamiento funcional.

---

**Autor**: Análisis generado por Claude Sonnet 4.5  
**Fecha**: 2026-02-12  
**Versión**: 1.0
