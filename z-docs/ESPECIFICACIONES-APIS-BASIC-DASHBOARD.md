# Especificaciones de APIs Adicionales para BasicDashboard.tsx

## Resumen Ejecutivo

Este documento especifica los endpoints adicionales necesarios para completar la funcionalidad del componente `BasicDashboard.tsx`. Los APIs actuales (`GET /partner/tenants/:tenantId/loyalty/dashboard` y `GET /partner/tenants/:tenantId/loyalty/points-transactions`) no proporcionan todos los datos requeridos.

---

## 1. Extensión del Endpoint de Dashboard con Filtros Temporales

### Endpoint Actual
```
GET /partner/tenants/:tenantId/loyalty/dashboard
```

### Problema
El endpoint actual devuelve `pointsEarned` y `pointsRedeemed` como totales históricos, pero `BasicDashboard.tsx` necesita métricas del mes actual (`pointsGivenThisMonth`, `rewardsRedeemedThisMonth`).

### Solución Propuesta

#### Opción A: Agregar Parámetros de Filtro Temporal (Recomendado)
```
GET /partner/tenants/:tenantId/loyalty/dashboard?period=month&startDate=2026-01-01&endDate=2026-01-31
```

**Parámetros de Query:**
- `period` (opcional): `'all' | 'month' | 'week' | 'custom'` - Por defecto: `'all'`
- `startDate` (opcional): ISO 8601 date string - Requerido si `period='custom'`
- `endDate` (opcional): ISO 8601 date string - Requerido si `period='custom'`

**Respuesta Extendida:**
```typescript
export interface GetLoyaltyDashboardResponse {
  // ... campos existentes ...
  
  /** Total de puntos ganados en el período especificado */
  pointsEarnedInPeriod: number;
  
  /** Total de puntos canjeados en el período especificado */
  pointsRedeemedInPeriod: number;
  
  /** Total de redemptions en el período especificado */
  redemptionsInPeriod: number;
  
  /** Tasa de retorno calculada: (redemptionsInPeriod / totalCustomers) * 100 */
  returnRate: number;
  
  /** Período de tiempo usado para los cálculos */
  period: {
    startDate: string;
    endDate: string;
    type: 'all' | 'month' | 'week' | 'custom';
  };
}
```

#### Opción B: Endpoint Separado para Métricas del Mes
```
GET /partner/tenants/:tenantId/loyalty/dashboard/monthly-stats?year=2026&month=1
```

**Parámetros de Query:**
- `year` (opcional): number - Por defecto: año actual
- `month` (opcional): number (1-12) - Por defecto: mes actual

**Respuesta:**
```typescript
export interface MonthlyDashboardStatsResponse {
  /** Año del período */
  year: number;
  
  /** Mes del período (1-12) */
  month: number;
  
  /** Total de puntos otorgados en el mes */
  pointsGivenThisMonth: number;
  
  /** Total de puntos canjeados en el mes */
  pointsRedeemedThisMonth: number;
  
  /** Total de recompensas canjeadas en el mes */
  rewardsRedeemedThisMonth: number;
  
  /** Tasa de retorno del mes */
  returnRate: number;
  
  /** Comparación con el mes anterior */
  comparison: {
    pointsGivenChange: number;      // Porcentaje de cambio
    pointsRedeemedChange: number;    // Porcentaje de cambio
    rewardsRedeemedChange: number;   // Porcentaje de cambio
    returnRateChange: number;        // Porcentaje de cambio
  };
}
```

---

## 2. Endpoint para Recompensas Canjeables (Top Rewards)

### Problema
El endpoint actual devuelve `topRewards` como `TopRewardRuleDto[]` (reglas de recompensa que otorgan puntos), pero `BasicDashboard.tsx` necesita información sobre las **recompensas canjeables** más populares (rewards que los clientes canjean con sus puntos).

### Endpoint Propuesto
```
GET /partner/tenants/:tenantId/loyalty/rewards/top-redeemed?limit=5&period=month
```

**Parámetros de Query:**
- `limit` (opcional): number - Número de recompensas a devolver (default: 5)
- `period` (opcional): `'all' | 'month' | 'week'` - Período de tiempo (default: 'month')
- `startDate` (opcional): ISO 8601 date string - Si se especifica, se usa en lugar de `period`
- `endDate` (opcional): ISO 8601 date string - Si se especifica, se usa en lugar de `period`

**Respuesta:**
```typescript
export interface TopRedeemedRewardsResponse {
  rewards: TopRedeemedRewardDto[];
  period: {
    startDate: string;
    endDate: string;
    type: 'all' | 'month' | 'week' | 'custom';
  };
}

export interface TopRedeemedRewardDto {
  /** ID de la recompensa */
  rewardId: number;
  
  /** Nombre de la recompensa */
  name: string;
  
  /** Descripción de la recompensa */
  description: string;
  
  /** Costo en puntos para canjear esta recompensa */
  pointsCost: number;
  
  /** Número de veces que fue canjeada en el período */
  timesRedeemed: number;
  
  /** Icono/emoji asociado a la recompensa (opcional) */
  icon?: string;
  
  /** URL de imagen de la recompensa (opcional) */
  imageUrl?: string;
  
  /** ID del programa de lealtad al que pertenece */
  programId: number;
  
  /** Nombre del programa de lealtad */
  programName: string;
  
  /** Tendencia vs período anterior (porcentaje de cambio) */
  trend?: number;
}
```

**Nota:** Este endpoint debe consultar la tabla de `redemptions` o `reward_transactions` para obtener las recompensas más canjeadas, no las reglas de recompensa.

---

## 3. Extensión de Transacciones con Información del Cliente

### Problema
Las transacciones (`LoyaltyDashboardPointsTransactionDto`) solo incluyen `membershipId`, pero `BasicDashboard.tsx` necesita `customerName` y `customerId` para mostrar información completa.

### Solución Propuesta

#### Opción A: Extender el DTO de Transacciones (Recomendado)
Modificar `LoyaltyDashboardPointsTransactionDto` para incluir información básica del cliente:

```typescript
export interface LoyaltyDashboardPointsTransactionDto {
  // ... campos existentes ...
  
  /** Información básica del cliente (incluida cuando se solicita) */
  customer?: {
    /** ID del usuario */
    userId: number;
    
    /** Nombre completo del cliente */
    customerName: string;
    
    /** Email del cliente (opcional, puede ser null por privacidad) */
    email?: string | null;
  };
  
  /** Información básica de la membership */
  membership?: {
    /** ID de la membership */
    membershipId: number;
    
    /** Estado de la membership */
    status: 'active' | 'inactive' | 'suspended';
  };
}
```

#### Opción B: Parámetro para Incluir Datos del Cliente
Agregar parámetro `includeCustomer` a los endpoints de transacciones:

```
GET /partner/tenants/:tenantId/loyalty/dashboard?includeCustomer=true
GET /partner/tenants/:tenantId/loyalty/points-transactions?includeCustomer=true
```

**Parámetros de Query:**
- `includeCustomer` (opcional): boolean - Si es `true`, incluye información del cliente en cada transacción (default: `false`)

#### Opción C: Construir Descripción en el Backend
Agregar campo `description` calculado en el backend:

```typescript
export interface LoyaltyDashboardPointsTransactionDto {
  // ... campos existentes ...
  
  /** Descripción legible de la transacción generada por el backend */
  description: string;
  
  /** Nombre del cliente (si está disponible) */
  customerName?: string | null;
}
```

**Ejemplos de descripciones:**
- `"Canjeó: Café Gratis"` (para tipo REDEEM con rewardRuleId)
- `"Compra de Q125.00"` (para tipo EARNING con reasonCode)
- `"Nuevo cliente registrado"` (para tipo EARNING con reasonCode específico)
- `"Ajuste manual de puntos"` (para tipo ADJUSTMENT)

---

## 4. Endpoint para Nuevos Clientes por Período

### Problema
`BasicDashboard.tsx` necesita un gráfico de "Nuevos Clientes" por semana, pero el endpoint actual no proporciona esta información.

### Endpoint Propuesto
```
GET /partner/tenants/:tenantId/loyalty/customers/new-customers?groupBy=week&weeks=4
```

**Parámetros de Query:**
- `groupBy` (opcional): `'day' | 'week' | 'month'` - Agrupación temporal (default: 'week')
- `weeks` (opcional): number - Número de semanas a devolver (default: 4)
- `startDate` (opcional): ISO 8601 date string - Fecha de inicio
- `endDate` (opcional): ISO 8601 date string - Fecha de fin

**Respuesta:**
```typescript
export interface NewCustomersResponse {
  /** Agrupación de nuevos clientes */
  newCustomers: NewCustomersGroupDto[];
  
  /** Total de nuevos clientes en el período */
  total: number;
  
  /** Período consultado */
  period: {
    startDate: string;
    endDate: string;
    groupBy: 'day' | 'week' | 'month';
  };
}

export interface NewCustomersGroupDto {
  /** Etiqueta del período (ej: "Sem 1", "2026-01-01", "Enero 2026") */
  label: string;
  
  /** Fecha de inicio del período */
  startDate: string;
  
  /** Fecha de fin del período */
  endDate: string;
  
  /** Número de nuevos clientes en este período */
  count: number;
  
  /** Número de semana (si groupBy='week') */
  weekNumber?: number;
  
  /** Nombre del mes (si groupBy='month') */
  monthName?: string;
}
```

**Ejemplo de Respuesta para `groupBy=week&weeks=4`:**
```json
{
  "newCustomers": [
    {
      "label": "Sem 1",
      "startDate": "2026-01-01",
      "endDate": "2026-01-07",
      "count": 12,
      "weekNumber": 1
    },
    {
      "label": "Sem 2",
      "startDate": "2026-01-08",
      "endDate": "2026-01-14",
      "count": 18,
      "weekNumber": 2
    },
    {
      "label": "Sem 3",
      "startDate": "2026-01-15",
      "endDate": "2026-01-21",
      "count": 15,
      "weekNumber": 3
    },
    {
      "label": "Sem 4",
      "startDate": "2026-01-22",
      "endDate": "2026-01-28",
      "count": 21,
      "weekNumber": 4
    }
  ],
  "total": 66,
  "period": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-28",
    "groupBy": "week"
  }
}
```

---

## 5. Endpoint para Revenue (Opcional)

### Problema
`BasicDashboard.tsx` tiene `totalRevenue` en los mocks, pero no se usa directamente en el componente. Sin embargo, puede ser útil para futuras funcionalidades.

### Endpoint Propuesto (Opcional)
```
GET /partner/tenants/:tenantId/loyalty/revenue?period=month
```

**Parámetros de Query:**
- `period` (opcional): `'all' | 'month' | 'week' | 'year'` - Período de tiempo (default: 'all')
- `startDate` (opcional): ISO 8601 date string
- `endDate` (opcional): ISO 8601 date string

**Respuesta:**
```typescript
export interface RevenueResponse {
  /** Revenue total en el período */
  totalRevenue: number;
  
  /** Revenue por mes (si period='year') */
  revenueByMonth?: RevenueByPeriodDto[];
  
  /** Período consultado */
  period: {
    startDate: string;
    endDate: string;
    type: 'all' | 'month' | 'week' | 'year';
  };
}

export interface RevenueByPeriodDto {
  period: string;
  revenue: number;
  transactions: number;
}
```

**Nota:** Este endpoint requiere que el sistema tenga información de revenue asociada a las transacciones. Si no está disponible, puede omitirse.

---

## 6. Resumen de Cambios Necesarios

### Cambios en Endpoints Existentes

1. **GET /partner/tenants/:tenantId/loyalty/dashboard**
   - Agregar parámetros de query: `period`, `startDate`, `endDate`
   - Agregar campos a la respuesta: `pointsEarnedInPeriod`, `pointsRedeemedInPeriod`, `redemptionsInPeriod`, `returnRate`
   - Agregar parámetro `includeCustomer` para incluir información del cliente en transacciones

### Nuevos Endpoints Requeridos

1. **GET /partner/tenants/:tenantId/loyalty/rewards/top-redeemed**
   - Obtener top recompensas canjeables (no reglas de recompensa)
   - Parámetros: `limit`, `period`, `startDate`, `endDate`

2. **GET /partner/tenants/:tenantId/loyalty/customers/new-customers**
   - Obtener nuevos clientes agrupados por período
   - Parámetros: `groupBy`, `weeks`, `startDate`, `endDate`

3. **GET /partner/tenants/:tenantId/loyalty/revenue** (Opcional)
   - Obtener revenue del tenant
   - Parámetros: `period`, `startDate`, `endDate`

### Cambios en DTOs

1. **LoyaltyDashboardPointsTransactionDto**
   - Agregar campo `customer` (opcional) con `userId` y `customerName`
   - Agregar campo `description` (string) con descripción legible

2. **GetLoyaltyDashboardResponse**
   - Agregar campos de período: `pointsEarnedInPeriod`, `pointsRedeemedInPeriod`, `redemptionsInPeriod`, `returnRate`
   - Agregar objeto `period` con información del período consultado

---

## 7. Priorización de Implementación

### Prioridad Alta (Crítico para BasicDashboard)
1. ✅ Extensión de dashboard con filtros temporales (Opción A o B)
2. ✅ Endpoint de top recompensas canjeables
3. ✅ Extensión de transacciones con información del cliente (Opción C recomendada)

### Prioridad Media (Mejora UX)
4. ✅ Endpoint de nuevos clientes por período

### Prioridad Baja (Opcional)
5. ⚠️ Endpoint de revenue (solo si el sistema tiene esta información)

---

## 8. Ejemplo de Implementación en Frontend

Una vez implementados los endpoints, el código del frontend podría verse así:

```typescript
// Obtener dashboard con métricas del mes actual
const dashboardResponse = await api.loyaltyDashboardControllerGetLoyaltyDashboard(
  tenantId,
  { period: 'month' }
);

// Obtener top recompensas canjeables
const topRewardsResponse = await api.getTopRedeemedRewards(
  tenantId,
  { limit: 5, period: 'month' }
);

// Obtener nuevos clientes por semana
const newCustomersResponse = await api.getNewCustomers(
  tenantId,
  { groupBy: 'week', weeks: 4 }
);

// Mapear datos al formato del componente
const basicMetrics = {
  totalCustomers: dashboardResponse.totalCustomers,
  activeCustomers: dashboardResponse.activeCustomers,
  inactiveCustomers: dashboardResponse.totalCustomers - dashboardResponse.activeCustomers,
  pointsGivenThisMonth: dashboardResponse.pointsEarnedInPeriod,
  rewardsRedeemedThisMonth: dashboardResponse.redemptionsInPeriod,
  returnRate: dashboardResponse.returnRate,
  avgPointsPerCustomer: dashboardResponse.avgPointsPerCustomer,
};

const basicRewards = topRewardsResponse.rewards.map(reward => ({
  id: String(reward.rewardId),
  name: reward.name,
  description: reward.description,
  pointsCost: reward.pointsCost,
  timesRedeemed: reward.timesRedeemed,
  icon: reward.icon || '🎁',
}));

const basicTransactions = dashboardResponse.recentTransactions.map(tx => ({
  id: String(tx.id),
  customerId: String(tx.customer?.userId || tx.membershipId),
  customerName: tx.customerName || tx.customer?.customerName || 'Cliente',
  type: mapTransactionType(tx.type),
  points: tx.pointsDelta,
  description: tx.description,
  timestamp: tx.createdAt,
}));

const basicChartData = {
  newCustomers: newCustomersResponse.newCustomers.map(group => ({
    week: group.label,
    count: group.count,
  })),
};
```

---

## 9. Notas de Implementación

### Consideraciones de Performance
- Los endpoints deben estar optimizados con índices en la base de datos
- Considerar caché para métricas calculadas (especialmente para períodos comunes como "mes actual")
- El endpoint de transacciones con `includeCustomer=true` puede ser más lento, considerar paginación

### Consideraciones de Seguridad
- Validar que el `tenantId` pertenece al partner del usuario autenticado
- No exponer información sensible del cliente (emails, teléfonos) sin permisos adecuados
- Validar parámetros de fecha para evitar inyecciones

### Consideraciones de Compatibilidad
- Los nuevos campos deben ser opcionales para mantener compatibilidad con código existente
- Los parámetros nuevos deben tener valores por defecto razonables

---

## 10. Checklist de Implementación Backend

- [ ] Agregar parámetros de query a `/loyalty/dashboard`
- [ ] Implementar cálculo de métricas por período
- [ ] Agregar campo `returnRate` calculado
- [ ] Crear endpoint `/loyalty/rewards/top-redeemed`
- [ ] Extender `LoyaltyDashboardPointsTransactionDto` con `customerName` y `description`
- [ ] Crear endpoint `/loyalty/customers/new-customers`
- [ ] Agregar índices de base de datos para optimizar consultas
- [ ] Implementar caché para métricas comunes
- [ ] Agregar tests unitarios para nuevos endpoints
- [ ] Agregar tests de integración
- [ ] Actualizar documentación de API (Swagger/OpenAPI)

---

## 11. Referencias

- Archivo de componente: `src/components/dashboards/plans/BasicDashboard.tsx`
- Archivo de mocks: `src/mocks/dashboardData.ts`
- Archivo de esquemas API: `src/api/partnerAPI.schemas.ts`
- Endpoint actual dashboard: `GET /partner/tenants/:tenantId/loyalty/dashboard`
- Endpoint actual transacciones: `GET /partner/tenants/:tenantId/loyalty/points-transactions`
