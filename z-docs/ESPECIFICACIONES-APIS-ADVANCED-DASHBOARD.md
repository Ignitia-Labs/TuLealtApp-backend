# Especificaciones de APIs para AdvancedDashboard.tsx

## Resumen Ejecutivo

Este documento analiza qué datos necesita el componente `AdvancedDashboard.tsx` (Plan Conecta - Dashboard Corporativo Multi-sucursal) y qué APIs están disponibles o faltan del backend.

**Conclusión**: Los APIs actuales **NO son suficientes** para llenar completamente `AdvancedDashboard.tsx`. Se necesitan varios endpoints nuevos específicos para funcionalidades multi-sucursal y analytics avanzados.

---

## 1. Análisis de Datos Requeridos vs APIs Disponibles

### 1.1 Métricas Corporativas Principales (`advancedMetrics`)

**Datos Necesarios:**
- `totalCustomers` - Total de clientes en toda la red
- `totalRevenue` - Revenue total de todas las sucursales
- `returnRate` - Tasa de retorno
- Comparaciones con período anterior (+12.3%, +8.5%)

**APIs Disponibles:**
- ✅ `GET /partner/tenants/:tenantId/loyalty/dashboard` - Proporciona `totalCustomers` y `returnRate`
- ❌ **FALTA**: `totalRevenue` - No hay endpoint que devuelva revenue total
- ❌ **FALTA**: Comparaciones con período anterior - No hay datos de comparación histórica

**Estado**: ⚠️ **PARCIALMENTE DISPONIBLE** - Falta revenue y comparaciones

---

### 1.2 Lista de Sucursales con Métricas (`branches`)

**Datos Necesarios por Sucursal:**
- `id`, `name`, `location` - Información básica
- `customers` - Número de clientes por sucursal
- `revenue` - Revenue por sucursal
- `rewardsRedeemed` - Recompensas canjeadas por sucursal
- `avgTicket` - Ticket promedio por sucursal
- `performance` - Score de performance (0-100)

**APIs Disponibles:**
- ✅ `GET /partner/tenants/:tenantId/branches` - Proporciona solo datos básicos:
  - `id`, `name`, `address`, `city`, `country`, `phone`, `email`, `status`
- ❌ **FALTA**: Métricas por sucursal (customers, revenue, rewardsRedeemed, avgTicket, performance)

**Estado**: ❌ **NO DISPONIBLE** - Solo datos básicos, sin métricas

---

### 1.3 Analytics de Recompensas (`advancedRewards`)

**Datos Necesarios por Recompensa:**
- `id`, `name`, `description`, `pointsCost` - Datos básicos
- `timesRedeemed` - Veces canjeadas
- `revenue` - Revenue generado por esta recompensa
- `roi` - Retorno de inversión (%)
- `efficiency` - Eficiencia (múltiplo)
- `topSegment` - Segmento que más canjea esta recompensa
- `topBranch` - Sucursal líder en canjes de esta recompensa
- `trend` - Tendencia vs mes anterior (%)

**APIs Disponibles:**
- ✅ `POST /partner/tenants/:tenantId/loyalty/rewards/top-redeemed` - Proporciona:
  - `rewardId`, `name`, `description`, `pointsCost`
  - `timesRedeemed`
  - `trend` (tendencia vs período anterior)
- ❌ **FALTA**: `revenue` generado por recompensa
- ❌ **FALTA**: `roi` (retorno de inversión)
- ❌ **FALTA**: `efficiency` (eficiencia)
- ❌ **FALTA**: `topSegment` (segmento que más canjea)
- ❌ **FALTA**: `topBranch` (sucursal líder)

**Estado**: ⚠️ **PARCIALMENTE DISPONIBLE** - Falta analytics avanzados (ROI, efficiency, segmentación, branch)

---

### 1.4 Segmentación de Clientes (`customerSegments`)

**Datos Necesarios:**
- Segmento VIP: `count`, `percentage`, `avgSpent`
- Segmento Frecuentes: `count`, `percentage`, `avgSpent`
- Segmento Ocasionales: `count`, `percentage`, `avgSpent`
- Segmento En Riesgo: `count`, `percentage`, `avgSpent`

**APIs Disponibles:**
- ❌ **FALTA**: Endpoint de segmentación de clientes

**Estado**: ❌ **NO DISPONIBLE**

---

### 1.5 Datos para Gráficos (`advancedChartData`)

#### 1.5.1 Crecimiento de Clientes (`customerGrowth`)
**Datos Necesarios:**
- Evolución de clientes últimos 5 meses: `{ month: 'Jul', customers: 2340 }`

**APIs Disponibles:**
- ✅ `GET /partner/tenants/:tenantId/loyalty/dashboard/customers/new-customers` - Proporciona nuevos clientes por período
- ❌ **FALTA**: Evolución histórica del total de clientes (no solo nuevos)

**Estado**: ⚠️ **PARCIALMENTE DISPONIBLE** - Solo nuevos clientes, no evolución total

#### 1.5.2 Revenue por Sucursal (`revenueByBranch`)
**Datos Necesarios:**
- `{ branch: 'Zona 10', revenue: 45230, target: 42000 }`

**APIs Disponibles:**
- ❌ **FALTA**: Revenue por sucursal
- ❌ **FALTA**: Targets por sucursal

**Estado**: ❌ **NO DISPONIBLE**

#### 1.5.3 ROI por Tipo de Recompensa (`rewardROI`)
**Datos Necesarios:**
- `{ name: 'Café', roi: 340, redemptions: 412 }`

**APIs Disponibles:**
- ✅ `POST /partner/tenants/:tenantId/loyalty/rewards/top-redeemed` - Proporciona `timesRedeemed`
- ❌ **FALTA**: `roi` por recompensa

**Estado**: ⚠️ **PARCIALMENTE DISPONIBLE** - Falta ROI

---

### 1.6 Insights Multi-sucursal (`crossBranchCustomers`)

**Datos Necesarios:**
- `total` - Clientes que visitan múltiples sucursales
- `percentage` - % del total de clientes
- `avgBranchesVisited` - Promedio de sucursales visitadas por cliente
- `topCombination` - Combinación más común (ej: "Zona 10 + Carretera (125 clientes)")

**APIs Disponibles:**
- ❌ **FALTA**: Endpoint de análisis multi-sucursal

**Estado**: ❌ **NO DISPONIBLE**

---

### 1.7 Transacciones Recientes Multi-sucursal (`advancedTransactions`)

**Datos Necesarios:**
- Transacciones con `branchId` y `branchName`
- Información del cliente (`customerName`, `customerId`)
- Descripción legible

**APIs Disponibles:**
- ✅ `GET /partner/tenants/:tenantId/loyalty/dashboard` - Proporciona `recentTransactions`
- ⚠️ `LoyaltyDashboardPointsTransactionDto` puede incluir `customer` (con `includeCustomer=true`)
- ❌ **FALTA**: `branchId` y `branchName` en transacciones

**Estado**: ⚠️ **PARCIALMENTE DISPONIBLE** - Falta información de sucursal en transacciones

---

## 2. Endpoints Requeridos del Backend

### 2.1 Prioridad Alta (Crítico para AdvancedDashboard)

#### 2.1.1 Endpoint de Métricas por Sucursal
```
GET /partner/tenants/:tenantId/branches/:branchId/metrics?period=month&startDate=2026-01-01&endDate=2026-01-31
```

**Parámetros:**
- `branchId` (path) - ID de la sucursal
- `period` (query, opcional) - `'all' | 'month' | 'week' | 'custom'`
- `startDate` (query, opcional) - ISO 8601 date string
- `endDate` (query, opcional) - ISO 8601 date string

**Respuesta:**
```typescript
export interface BranchMetricsResponse {
  /** ID de la sucursal */
  branchId: number;
  /** Nombre de la sucursal */
  branchName: string;
  /** Ubicación de la sucursal */
  location: string;
  /** Número de clientes únicos en esta sucursal */
  customers: number;
  /** Número de clientes activos en esta sucursal */
  activeCustomers: number;
  /** Revenue generado en esta sucursal en el período */
  revenue: number;
  /** Número de recompensas canjeadas en esta sucursal */
  rewardsRedeemed: number;
  /** Ticket promedio en esta sucursal */
  avgTicket: number;
  /** Score de performance (0-100) calculado basado en múltiples métricas */
  performance: number;
  /** Total de puntos otorgados en esta sucursal */
  pointsEarned: number;
  /** Total de puntos canjeados en esta sucursal */
  pointsRedeemed: number;
  /** Período consultado */
  period: PeriodDto;
}
```

#### 2.1.2 Endpoint de Métricas Agregadas de Todas las Sucursales
```
GET /partner/tenants/:tenantId/branches/metrics?period=month&startDate=2026-01-01&endDate=2026-01-31
```

**Parámetros:**
- `period` (query, opcional) - `'all' | 'month' | 'week' | 'custom'`
- `startDate` (query, opcional) - ISO 8601 date string
- `endDate` (query, opcional) - ISO 8601 date string

**Respuesta:**
```typescript
export interface AllBranchesMetricsResponse {
  /** Lista de métricas por sucursal */
  branches: BranchMetricsResponse[];
  /** Métricas agregadas de todas las sucursales */
  totals: {
    /** Total de clientes únicos en toda la red */
    totalCustomers: number;
    /** Total de clientes activos */
    totalActiveCustomers: number;
    /** Revenue total de todas las sucursales */
    totalRevenue: number;
    /** Total de recompensas canjeadas */
    totalRewardsRedeemed: number;
    /** Ticket promedio ponderado */
    avgTicket: number;
  };
  /** Comparación con período anterior */
  comparison?: {
    /** Cambio porcentual en totalCustomers */
    totalCustomersChange: number;
    /** Cambio porcentual en totalRevenue */
    totalRevenueChange: number;
    /** Cambio porcentual en totalRewardsRedeemed */
    totalRewardsRedeemedChange: number;
  };
  /** Período consultado */
  period: PeriodDto;
}
```

#### 2.1.3 Endpoint de Analytics Avanzados de Recompensas
```
POST /partner/tenants/:tenantId/loyalty/rewards/advanced-analytics
```

**Body:**
```typescript
export interface GetAdvancedRewardAnalyticsBodyDto {
  /** Número de recompensas a devolver */
  limit?: number;
  /** Período de tiempo */
  period?: 'all' | 'month' | 'week' | 'custom';
  /** Fecha de inicio (ISO 8601). Si se especifica, se usa en lugar de period */
  startDate?: string;
  /** Fecha de fin (ISO 8601). Si se especifica, se usa en lugar de period */
  endDate?: string;
}
```

**Respuesta:**
```typescript
export interface AdvancedRewardAnalyticsResponse {
  rewards: AdvancedRewardAnalyticsDto[];
  period: PeriodDto;
}

export interface AdvancedRewardAnalyticsDto {
  /** ID de la recompensa */
  rewardId: number;
  /** Nombre de la recompensa */
  name: string;
  /** Descripción de la recompensa */
  description: string;
  /** Costo en puntos */
  pointsCost: number;
  /** Número de veces canjeada */
  timesRedeemed: number;
  /** Revenue generado por esta recompensa (estimado o real) */
  revenue: number;
  /** Retorno de inversión (%) */
  roi: number;
  /** Eficiencia (múltiplo: revenue / costo estimado) */
  efficiency: number;
  /** Segmento que más canjea esta recompensa */
  topSegment: {
    segment: 'VIP' | 'Frequent' | 'Occasional' | 'AtRisk';
    percentage: number;
  };
  /** Sucursal líder en canjes de esta recompensa */
  topBranch: {
    branchId: number;
    branchName: string;
    percentage: number;
  };
  /** Tendencia vs período anterior (%) */
  trend: number;
  /** Icono/emoji asociado */
  icon?: string;
}
```

#### 2.1.4 Endpoint de Segmentación de Clientes
```
GET /partner/tenants/:tenantId/loyalty/customers/segments?period=month
```

**Parámetros:**
- `period` (query, opcional) - `'all' | 'month' | 'week' | 'custom'`
- `startDate` (query, opcional) - ISO 8601 date string
- `endDate` (query, opcional) - ISO 8601 date string

**Respuesta:**
```typescript
export interface CustomerSegmentsResponse {
  /** Segmento VIP */
  vip: {
    count: number;
    percentage: number;
    avgSpent: number;
    avgPoints: number;
  };
  /** Segmento Frecuentes */
  frequent: {
    count: number;
    percentage: number;
    avgSpent: number;
    avgPoints: number;
  };
  /** Segmento Ocasionales */
  occasional: {
    count: number;
    percentage: number;
    avgSpent: number;
    avgPoints: number;
  };
  /** Segmento En Riesgo */
  atRisk: {
    count: number;
    percentage: number;
    avgSpent: number;
    avgPoints: number;
  };
  /** Total de clientes */
  total: number;
  /** Período consultado */
  period: PeriodDto;
}
```

**Criterios de Segmentación (sugeridos):**
- **VIP**: +1000 puntos acumulados o gasto promedio alto
- **Frecuentes**: Visitas semanales regulares
- **Ocasionales**: Visitas mensuales
- **En Riesgo**: Sin actividad +30 días

---

### 2.2 Prioridad Media (Mejora UX)

#### 2.2.1 Endpoint de Evolución Histórica de Clientes
```
GET /partner/tenants/:tenantId/loyalty/customers/growth?months=5&groupBy=month
```

**Parámetros:**
- `months` (query, opcional) - Número de meses a devolver (default: 5)
- `groupBy` (query, opcional) - `'month' | 'week' | 'day'` (default: 'month')

**Respuesta:**
```typescript
export interface CustomerGrowthResponse {
  /** Evolución del total de clientes */
  growth: CustomerGrowthPeriodDto[];
  /** Período consultado */
  period: {
    startDate: string;
    endDate: string;
    groupBy: 'month' | 'week' | 'day';
  };
}

export interface CustomerGrowthPeriodDto {
  /** Etiqueta del período (ej: "Jul", "2026-01") */
  label: string;
  /** Fecha de inicio del período */
  startDate: string;
  /** Fecha de fin del período */
  endDate: string;
  /** Total de clientes al final de este período */
  customers: number;
  /** Nuevos clientes en este período */
  newCustomers: number;
}
```

#### 2.2.2 Endpoint de Revenue por Sucursal con Targets
```
GET /partner/tenants/:tenantId/branches/revenue?period=month&includeTargets=true
```

**Parámetros:**
- `period` (query, opcional) - `'all' | 'month' | 'week' | 'custom'`
- `startDate` (query, opcional) - ISO 8601 date string
- `endDate` (query, opcional) - ISO 8601 date string
- `includeTargets` (query, opcional) - boolean - Si incluir targets (default: false)

**Respuesta:**
```typescript
export interface BranchRevenueResponse {
  /** Revenue por sucursal */
  revenueByBranch: BranchRevenueDto[];
  /** Período consultado */
  period: PeriodDto;
}

export interface BranchRevenueDto {
  /** ID de la sucursal */
  branchId: number;
  /** Nombre de la sucursal */
  branchName: string;
  /** Revenue en el período */
  revenue: number;
  /** Target de revenue (si está configurado) */
  target?: number;
  /** Porcentaje de cumplimiento del target */
  targetPercentage?: number;
}
```

#### 2.2.3 Endpoint de Insights Multi-sucursal
```
GET /partner/tenants/:tenantId/loyalty/customers/cross-branch-insights
```

**Respuesta:**
```typescript
export interface CrossBranchInsightsResponse {
  /** Total de clientes que visitan múltiples sucursales */
  total: number;
  /** Porcentaje del total de clientes */
  percentage: number;
  /** Promedio de sucursales visitadas por cliente multi-sucursal */
  avgBranchesVisited: number;
  /** Combinación más común de sucursales */
  topCombination: {
    /** IDs de las sucursales en esta combinación */
    branchIds: number[];
    /** Nombres de las sucursales */
    branchNames: string[];
    /** Número de clientes que visitan esta combinación */
    customerCount: number;
    /** Etiqueta legible (ej: "Zona 10 + Carretera") */
    label: string;
  };
  /** Top 5 combinaciones */
  topCombinations: Array<{
    branchIds: number[];
    branchNames: string[];
    customerCount: number;
    label: string;
  }>;
}
```

---

### 2.3 Prioridad Baja (Opcional)

#### 2.3.1 Extensión de Transacciones con Información de Sucursal
**Cambio en DTO existente:**

Modificar `LoyaltyDashboardPointsTransactionDto` para incluir información de sucursal:

```typescript
export interface LoyaltyDashboardPointsTransactionDto {
  // ... campos existentes ...
  
  /** Información de la sucursal donde ocurrió la transacción (opcional) */
  branch?: {
    /** ID de la sucursal */
    branchId: number;
    /** Nombre de la sucursal */
    branchName: string;
  };
}
```

**Parámetro adicional en endpoint:**
- `includeBranch` (query, opcional) - boolean - Si incluir información de sucursal (default: false)

---

## 3. Resumen de Estado

### ✅ APIs Disponibles (Parcialmente Útiles)
1. `GET /partner/tenants/:tenantId/loyalty/dashboard` - Métricas básicas
2. `GET /partner/tenants/:tenantId/loyalty/dashboard/customers/new-customers` - Nuevos clientes
3. `GET /partner/tenants/:tenantId/branches` - Lista básica de sucursales (sin métricas)
4. `POST /partner/tenants/:tenantId/loyalty/rewards/top-redeemed` - Top recompensas (sin analytics avanzados)

### ❌ APIs Faltantes (Críticos)
1. **Métricas por sucursal** - Revenue, customers, rewardsRedeemed, avgTicket, performance
2. **Analytics avanzados de recompensas** - ROI, efficiency, topSegment, topBranch
3. **Segmentación de clientes** - VIP, Frecuentes, Ocasionales, En Riesgo
4. **Revenue total y por sucursal** - Con targets opcionales
5. **Insights multi-sucursal** - Clientes que visitan múltiples sucursales
6. **Evolución histórica de clientes** - Crecimiento mes a mes
7. **Comparaciones con período anterior** - Para métricas principales

---

## 4. Plan de Implementación Sugerido

### Fase 1: Funcionalidad Básica Multi-sucursal (Prioridad Alta)
1. ✅ Endpoint de métricas por sucursal (`/branches/:branchId/metrics`)
2. ✅ Endpoint de métricas agregadas (`/branches/metrics`)
3. ✅ Extensión de transacciones con información de sucursal

**Resultado**: Dashboard puede mostrar métricas básicas por sucursal

### Fase 2: Analytics Avanzados (Prioridad Alta)
4. ✅ Endpoint de analytics avanzados de recompensas
5. ✅ Endpoint de segmentación de clientes

**Resultado**: Dashboard puede mostrar analytics completos de recompensas y segmentación

### Fase 3: Insights y Comparaciones (Prioridad Media)
6. ✅ Endpoint de insights multi-sucursal
7. ✅ Endpoint de evolución histórica de clientes
8. ✅ Endpoint de revenue con targets
9. ✅ Comparaciones con período anterior en endpoints existentes

**Resultado**: Dashboard completo con todos los insights y comparaciones

---

## 5. Notas de Implementación

### Consideraciones de Performance
- Los endpoints de métricas por sucursal pueden ser costosos. Considerar caché para períodos comunes (mes actual).
- El endpoint de insights multi-sucursal requiere análisis de relaciones complejas. Considerar procesamiento asíncrono si es muy pesado.

### Consideraciones de Seguridad
- Validar que el `tenantId` pertenece al partner del usuario autenticado
- Validar que el `branchId` pertenece al `tenantId` especificado
- No exponer información sensible de clientes sin permisos adecuados

### Consideraciones de Compatibilidad
- Los nuevos campos deben ser opcionales para mantener compatibilidad
- Los parámetros nuevos deben tener valores por defecto razonables

---

## 6. Referencias

- Archivo de componente: `src/components/dashboards/plans/AdvancedDashboard.tsx`
- Archivo de mocks: `src/mocks/dashboardData.ts`
- Archivo de esquemas API: `src/api/partnerAPI.schemas.ts`
- Documentación de BasicDashboard: `z-docs/ESPECIFICACIONES-APIS-BASIC-DASHBOARD.md`

---

**Última actualización**: Febrero 2026
