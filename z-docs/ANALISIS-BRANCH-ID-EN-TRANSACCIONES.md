# Análisis: Almacenamiento de Branch ID en Transacciones de Puntos

## 📋 Resumen Ejecutivo

Este documento analiza si el sistema actual almacena información de **branch** (sucursal) en las transacciones de puntos, y proporciona recomendaciones para mejorar la trazabilidad y analytics por sucursal.

**Fecha de análisis**: 2026-02-05

**Estado actual**: ⚠️ **PARCIAL** - Los datos de branch se almacenan SOLO en metadata (JSON), no en columnas indexables.

---

## 🏗️ Aclaración Importante: Modelo de Datos

### Jerarquía del Sistema

```
Partner (Socio/Marca)
  └── Tenant (Establecimiento/Negocio específico - ej: "Café Delicia Centro")
       └── Branch (Sucursal del tenant - ej: "Sucursal Zona 10", "Sucursal Cayalá")
```

### ⚠️ IMPORTANTE: `storeId` NO EXISTE en este sistema

Después de revisar el código, **NO existe el concepto de `store` (tienda)** en este sistema. La jerarquía es:

- **Partner** → **Tenant** → **Branch**

**Corrección**: 
- ❌ ~~`storeId`~~ - **NO EXISTE** - Este campo debe ser **ELIMINADO** del análisis
- ✅ `tenantId` - **YA EXISTE** en `points_transactions` - Identifica el establecimiento/negocio
- ✅ `branchId` - **DEBE AGREGARSE** - Identifica la sucursal específica dentro del tenant

### Definiciones

**Tenant** (`tenants` table):
- Representa un establecimiento/negocio específico
- Ejemplo: "Café Delicia - Centro", "Restaurante El Mesón", "Gym FitLife"
- Un Partner puede tener múltiples Tenants
- **YA tiene columna en `points_transactions`**: `tenantId`

**Branch** (`branches` table):
- Representa una sucursal/ubicación física de un Tenant
- Ejemplo: "Sucursal Zona 10", "Sucursal Cayalá", "Sucursal Las Américas"
- Un Tenant puede tener múltiples Branches
- **NO tiene columna en `points_transactions`**: ❌ `branchId` - **DEBE AGREGARSE**

### Relaciones

```typescript
// branches table
@Entity('branches')
export class BranchEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  tenantId: number;  // ← FK al tenant padre

  @Column('varchar', { length: 255 })
  name: string;  // ej: "Sucursal Zona 10"

  @Column('text')
  address: string;
  
  // ... otros campos
}

// customer_memberships table (para referencia)
@Entity('customer_memberships')
export class CustomerMembershipEntity {
  @Column('int')
  tenantId: number;  // ← Tenant al que pertenece la membership

  @Column('int', { nullable: true })
  registrationBranchId: number | null;  // ← Branch donde se registró el customer
}
```

---

## 🔍 Análisis del Estado Actual

### 1. Estructura de `points_transactions`

La tabla `points_transactions` actualmente **tiene `tenantId` pero NO tiene columna para `branchId`**:

```sql
CREATE TABLE points_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenantId INT NOT NULL,           -- ✅ YA EXISTE - Identifica el tenant/establecimiento
  customerId INT NOT NULL,
  membershipId INT NOT NULL,
  programId INT NULL,
  rewardRuleId INT NULL,
  rewardId INT NULL,               -- Solo para REDEEM
  type VARCHAR(20) NOT NULL,       -- EARNING, REDEEM, ADJUSTMENT, etc.
  pointsDelta INT NOT NULL,
  idempotencyKey VARCHAR(255) UNIQUE NOT NULL,
  sourceEventId VARCHAR(255) NULL,
  correlationId VARCHAR(255) NULL,
  createdBy VARCHAR(255) NULL,
  reasonCode VARCHAR(100) NULL,
  metadata JSON NULL,              -- ⚠️ Aquí se guarda branchId actualmente (si se guarda)
  reversalOfTransactionId INT NULL,
  expiresAt DATETIME NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX IDX_TENANT_ID (tenantId),  -- ✅ YA EXISTE
  INDEX IDX_MEMBERSHIP_ID (membershipId),
  INDEX IDX_PROGRAM_ID (programId),
  INDEX IDX_TYPE (type),
  INDEX IDX_CREATED_AT (createdAt),
  UNIQUE INDEX IDX_IDEMPOTENCY_KEY (idempotencyKey)
);
```

**Resumen**:
- ✅ `tenantId` - **YA EXISTE** como columna indexada
- ❌ `branchId` - **NO EXISTE** como columna (solo en metadata JSON si se incluye manualmente)
- ❌ ~~`storeId`~~ - **NO APLICA** en este sistema (concepto no existe)

### 2. Dónde se Almacenan Actualmente los Datos de Branch

#### 2.1 Eventos de Loyalty (PURCHASE, VISIT, CUSTOM)

⚠️ **CORRECCIÓN**: Los eventos capturan `branchId` pero **NO `storeId`** (ese concepto no existe):

```typescript
// libs/domain/src/events/loyalty-event.types.ts

export interface PurchaseEventPayload {
  orderId: string;
  netAmount: number;
  grossAmount: number;
  currency: string;
  items: PurchaseItem[];
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  storeId?: number | null;      // ❌ DEBE ELIMINARSE - Concepto no existe
  branchId?: number | null;     // ✅ Capturado - Sucursal donde se hizo la compra
  channel?: string | null;
  metadata?: Record<string, any> | null;
}

export interface VisitEventPayload {
  storeId?: number | null;      // ❌ DEBE ELIMINARSE - Concepto no existe  
  branchId?: number | null;     // ✅ Capturado - Sucursal visitada
  channel?: string | null;
  visitType?: string | null;
  durationMinutes?: number | null;
  metadata?: Record<string, any> | null;
}
```

**Uso en endpoints**:

```typescript
// POST /partner/loyalty/events/purchase
{
  "orderId": "FAC-00124",
  "netAmount": 100.0,
  "grossAmount": 100.0,
  "currency": "GTQ",
  "branchId": 2,       // ✅ Se envía - Sucursal donde se hizo la compra
  "items": [...]
}

// POST /partner/loyalty/events/visit
{
  "visitId": "VISIT-001",
  "branchId": 2,       // ✅ Se envía - Sucursal visitada
  "occurredAt": "2026-02-05T10:00:00Z"
}
```

**Problema**: Este dato se pasa al motor de evaluación de reglas pero **se pierde** al crear la transacción de puntos. Solo se guardaría en `metadata` (JSON) si el evaluador de reglas lo incluye manualmente.

#### 2.2 Ajustes Manuales (ADJUSTMENT)

Los ajustes **NO capturan** `branchId`:

```typescript
// POST /partner/customers/:id/points/adjustment
{
  "pointsDelta": 100,
  "reasonCode": "BONUS_BIRTHDAY",
  "metadata": {
    // ❌ No hay campo dedicado para branchId
    // Se podría agregar manualmente en metadata pero no es estándar
    "birthdayMonth": 2
  }
}
```

**Estado**: ❌ **NO DISPONIBLE** - No se captura información de branch en ajustes.

#### 2.3 Redención de Recompensas (REDEEM)

Las redenciones **NO capturan** `branchId`:

```typescript
// POST /partner/customers/:id/rewards/:rewardId/redeem
// Request actual:
{
  "membershipId": 15,
  "rewardId": 10
}

// Handler actual (redeem-reward.handler.ts):
const transaction = PointsTransaction.createRedeem(
  membership.tenantId,
  membership.userId,
  membership.id,
  -reward.pointsRequired,
  idempotencyKey,
  reward.id,
  null, // sourceEventId
  null, // correlationId
  null, // createdBy
  'REWARD_REDEMPTION',
  null, // programId
  {
    // metadata - solo auditoría
    rewardName: reward.name,
    rewardCategory: reward.category,
    // ❌ No se guarda branchId
  },
);
```

**Estado**: ❌ **NO DISPONIBLE** - No se captura información de branch en redenciones.

---

## 🎯 Problemas Identificados

### 1. ❌ Datos No Consultables

Los datos de `branchId` se guardan (cuando se guardan) en el campo `metadata` (JSON), lo cual:

- **No es indexable** - Queries lentos para reportes por sucursal
- **No es consultable fácilmente** - Requiere parsing de JSON en queries
- **No tiene integridad referencial** - No hay FK a la tabla `branches`
- **Viola arquitectura** - Va contra la regla documentada en `ARCHITECTURE.md`:

```markdown
# Regla: No usar JSON para datos consultables

Prohibido guardar en JSON cualquier dato que:
• se use en filtros (WHERE)
• se use en joins (JOIN)
• se use en agregaciones (GROUP BY, SUM, COUNT)
• se use para ordenamiento (ORDER BY)
• se use para reglas de negocio (tiers, rewards, eligibility, etc.)
```

### 2. ❌ Falta de Trazabilidad

Sin columnas dedicadas para branch/store:

- **No se puede filtrar** transacciones por sucursal fácilmente
- **No se pueden generar reportes** de puntos acumulados por sucursal
- **No se pueden generar reportes** de puntos canjeados por sucursal
- **No se puede analizar** qué sucursales generan más engagement
- **No se puede medir** performance por sucursal en dashboards

### 3. ❌ Inconsistencia entre Eventos y Transacciones

- Los **eventos** capturan `storeId` y `branchId` ✅
- Las **transacciones** NO los almacenan como columnas ❌
- Esta inconsistencia complica auditoría y trazabilidad

### 4. ❌ Sin Contexto en Ajustes y Redenciones

- Los ajustes manuales no permiten especificar en qué sucursal se realizó el ajuste
- Las redenciones no registran en qué sucursal se canjeó la recompensa
- Esto dificulta analytics de operaciones por sucursal

---

## 📊 Casos de Uso Afectados

### Caso 1: Dashboard por Sucursal

**Necesidad**: "Mostrar cuántos puntos se acumularon en cada sucursal este mes"

**Query actual (INVIABLE)**:
```sql
-- ❌ NO FUNCIONA - branchId está en JSON
SELECT branchId, SUM(pointsDelta)
FROM points_transactions
WHERE type = 'EARNING'
  AND createdAt >= '2026-02-01'
GROUP BY branchId;  -- ❌ ERROR: branchId no es una columna
```

**Query necesario (LENTO)**:
```sql
-- ⚠️ LENTO - requiere parsing de JSON sin índice
SELECT 
  JSON_EXTRACT(metadata, '$.branchId') as branchId,
  SUM(pointsDelta) as totalPoints
FROM points_transactions
WHERE type = 'EARNING'
  AND createdAt >= '2026-02-01'
  AND JSON_EXTRACT(metadata, '$.branchId') IS NOT NULL
GROUP BY JSON_EXTRACT(metadata, '$.branchId');
```

### Caso 2: Reportes de Redenciones por Sucursal

**Necesidad**: "¿En qué sucursales se canjean más recompensas?"

**Estado actual**: ❌ **IMPOSIBLE** - No se registra dónde se canjea la recompensa

### Caso 3: Performance de Ajustes por Sucursal

**Necesidad**: "¿Qué sucursales hacen más ajustes manuales?"

**Estado actual**: ❌ **IMPOSIBLE** - No se registra en qué sucursal se hace el ajuste

### Caso 4: Analytics Multi-sucursal (Plan Conecta)

**Necesidad**: Dashboard corporativo con métricas por sucursal:
- Puntos acumulados por sucursal
- Puntos canjeados por sucursal
- Tasa de redención por sucursal
- Clientes activos por sucursal

**Estado actual**: ⚠️ **PARCIAL/LENTO** - Solo disponible para eventos EARNING/VISIT que tengan metadata

---

## ✅ Recomendaciones

### Recomendación 1: Agregar Columna Indexada para branchId (CRÍTICO)

**Prioridad**: 🔴 **ALTA** - Impacta analytics y performance

Agregar columna dedicada e indexada para `branchId` en `points_transactions`:

**NOTA IMPORTANTE**: `tenantId` **YA EXISTE** en la tabla, solo necesitamos agregar `branchId`.

```sql
-- Agregar columna branchId
ALTER TABLE points_transactions
  ADD COLUMN branchId INT NULL COMMENT 'FK a branches - Sucursal donde ocurrió la transacción';

-- Agregar índice simple
CREATE INDEX IDX_POINTS_TRANSACTIONS_BRANCH_ID ON points_transactions(branchId);

-- Índice compuesto para reportes por tenant + branch
CREATE INDEX IDX_POINTS_TRANSACTIONS_TENANT_BRANCH 
  ON points_transactions(tenantId, branchId, createdAt);

-- Agregar foreign key (opcional pero recomendado)
ALTER TABLE points_transactions
  ADD CONSTRAINT FK_POINTS_TRANSACTIONS_BRANCH_ID 
    FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE SET NULL;
```

**Beneficios**:
- ✅ Queries rápidos y eficientes
- ✅ Integridad referencial
- ✅ Reportes por sucursal sin parsing de JSON
- ✅ Compatible con arquitectura definida
- ✅ `tenantId` ya existe, solo agregamos `branchId`

### Recomendación 2: Actualizar Entidades de Dominio

**Archivo**: `libs/domain/src/entities/loyalty/points-transaction.entity.ts`

```typescript
export class PointsTransaction {
  constructor(
    public readonly id: number,
    public readonly tenantId: number,
    public readonly customerId: number,
    public readonly membershipId: number,
    public readonly programId: number | null,
    public readonly rewardRuleId: number | null,
    public readonly type: PointsTransactionType,
    public readonly pointsDelta: number,
    public readonly idempotencyKey: string,
    public readonly sourceEventId: string | null,
    public readonly correlationId: string | null,
    public readonly createdBy: string | null,
    public readonly reasonCode: string | null,
    public readonly metadata: PointsTransactionMetadata | null,
    public readonly reversalOfTransactionId: number | null,
    public readonly expiresAt: Date | null,
    public readonly rewardId: number | null,
    // ⭐ NUEVO CAMPO
    public readonly branchId: number | null,     // ⭐ AGREGAR
    public readonly createdAt: Date,
  ) {}

  // Actualizar factory methods
  static createEarning(
    tenantId: number,
    customerId: number,
    membershipId: number,
    pointsDelta: number,
    idempotencyKey: string,
    sourceEventId: string | null = null,
    correlationId: string | null = null,
    createdBy: string | null = null,
    reasonCode: string | null = null,
    programId: number | null = null,
    rewardRuleId: number | null = null,
    metadata: PointsTransactionMetadata | null = null,
    expiresAt: Date | null = null,
    branchId: number | null = null,     // ⭐ AGREGAR
    id?: number,
  ): PointsTransaction {
    // ...
  }

  static createRedeem(
    tenantId: number,
    customerId: number,
    membershipId: number,
    pointsDelta: number,
    idempotencyKey: string,
    rewardId: number,
    sourceEventId: string | null = null,
    correlationId: string | null = null,
    createdBy: string | null = null,
    reasonCode: string | null = null,
    programId: number | null = null,
    metadata: PointsTransactionMetadata | null = null,
    branchId: number | null = null,     // ⭐ AGREGAR
    id?: number,
  ): PointsTransaction {
    // ...
  }

  static createAdjustment(
    tenantId: number,
    customerId: number,
    membershipId: number,
    pointsDelta: number,
    idempotencyKey: string,
    createdBy: string,
    reasonCode: string,
    correlationId: string | null = null,
    metadata: PointsTransactionMetadata | null = null,
    branchId: number | null = null,     // ⭐ AGREGAR
    id?: number,
  ): PointsTransaction {
    // ...
  }
}
```

### Recomendación 3: Actualizar Entidad de Persistencia

**Archivo**: `libs/infrastructure/src/persistence/entities/loyalty/points-transaction.entity.ts`

```typescript
@Entity('points_transactions')
export class PointsTransactionEntity {
  // ... campos existentes ...

  // ⭐ AGREGAR NUEVO CAMPO
  @Column('int', { nullable: true })
  branchId: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
```

### Recomendación 4: Actualizar Mapper

**Archivo**: `libs/infrastructure/src/persistence/mappers/loyalty/points-transaction.mapper.ts`

```typescript
export class PointsTransactionMapper {
  static toDomain(entity: PointsTransactionEntity): PointsTransaction {
    return new PointsTransaction(
      entity.id,
      entity.tenantId,
      entity.customerId,
      entity.membershipId,
      entity.programId,
      entity.rewardRuleId,
      entity.type,
      entity.pointsDelta,
      entity.idempotencyKey,
      entity.sourceEventId,
      entity.correlationId,
      entity.createdBy,
      entity.reasonCode,
      entity.metadata,
      entity.reversalOfTransactionId,
      entity.expiresAt,
      entity.rewardId,
      entity.branchId,    // ⭐ AGREGAR
      entity.createdAt,
    );
  }

  static toPersistence(domain: PointsTransaction): Partial<PointsTransactionEntity> {
    return {
      id: domain.id || undefined,
      tenantId: domain.tenantId,
      customerId: domain.customerId,
      membershipId: domain.membershipId,
      programId: domain.programId,
      rewardRuleId: domain.rewardRuleId,
      type: domain.type,
      pointsDelta: domain.pointsDelta,
      idempotencyKey: domain.idempotencyKey,
      sourceEventId: domain.sourceEventId,
      correlationId: domain.correlationId,
      createdBy: domain.createdBy,
      reasonCode: domain.reasonCode,
      metadata: domain.metadata,
      reversalOfTransactionId: domain.reversalOfTransactionId,
      expiresAt: domain.expiresAt,
      rewardId: domain.rewardId,
      branchId: domain.branchId,   // ⭐ AGREGAR
    };
  }
}
```

### Recomendación 5: Actualizar Handlers

#### 5.1 Eventos de Loyalty (EARNING)

**Archivo**: `libs/application/src/loyalty/process-loyalty-event/process-loyalty-event.handler.ts`

```typescript
// Extraer branchId del evento
const payload = normalizedEvent.payload as any;
const branchId = payload.branchId || null;

const transaction = PointsTransaction.createEarning(
  normalizedEvent.tenantId,
  membership.userId,
  membership.id,
  evaluation.points,
  evaluation.idempotencyKey,
  normalizedEvent.sourceEventId,
  normalizedEvent.correlationId || null,
  'SYSTEM',
  evaluation.reasonCode || null,
  rule.programId,
  evaluation.ruleId,
  evaluation.metadata || null,
  expiresAt,
  branchId,     // ⭐ PASAR DESDE EVENTO
);
```

#### 5.2 Ajustes Manuales (ADJUSTMENT)

**Archivo**: `libs/application/src/partner-customers/create-points-adjustment/create-points-adjustment.request.ts`

```typescript
export class CreatePointsAdjustmentRequest {
  membershipId?: number;

  @ApiProperty({
    example: 100,
    description: 'Cantidad de puntos a ajustar',
  })
  @IsInt()
  pointsDelta: number;

  @ApiProperty({
    example: 'BONUS_BIRTHDAY',
    description: 'Código de razón',
  })
  @IsString()
  @IsNotEmpty()
  reasonCode: string;

  // ⭐ AGREGAR CAMPO OPCIONAL
  @ApiPropertyOptional({
    example: 2,
    description: 'ID de la sucursal donde se realiza el ajuste (opcional)',
  })
  @IsOptional()
  @IsInt()
  branchId?: number | null;

  @ApiPropertyOptional({
    example: { birthdayMonth: 1 },
    description: 'Metadatos adicionales',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
```

**Archivo**: `libs/application/src/loyalty/adjustment.service.ts`

```typescript
async createAdjustment(
  membershipId: number,
  pointsDelta: number,
  reasonCode: string,
  createdBy: string,
  branchId?: number | null,     // ⭐ NUEVO PARÁMETRO
  metadata?: Record<string, any>,
): Promise<PointsTransaction> {
  // ... validaciones existentes ...

  const adjustmentTransaction = PointsTransaction.createAdjustment(
    membership.tenantId,
    membership.userId,
    membershipId,
    pointsDelta,
    idempotencyKey,
    createdBy,
    reasonCode,
    null, // correlationId
    {
      ...metadata,
      adjustmentType: pointsDelta > 0 ? 'ADD' : 'SUBTRACT',
      previousBalance: await this.pointsTransactionRepository.calculateBalance(membershipId),
    },
    branchId,     // ⭐ PASAR
  );

  // ... resto del código ...
}
```

#### 5.3 Redención de Recompensas (REDEEM)

**Archivo**: `libs/application/src/rewards/redeem-reward/redeem-reward.request.ts`

```typescript
export class RedeemRewardRequest {
  @ApiProperty({
    description: 'ID de la membership',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  membershipId: number;

  @ApiProperty({
    description: 'ID de la recompensa',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  rewardId: number;

  // ⭐ AGREGAR CAMPO OPCIONAL
  @ApiPropertyOptional({
    description: 'ID de la sucursal donde se canjea (opcional)',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  branchId?: number | null;
}
```

**Archivo**: `libs/application/src/rewards/redeem-reward/redeem-reward.handler.ts`

```typescript
const transaction = PointsTransaction.createRedeem(
  membership.tenantId,
  membership.userId,
  membership.id,
  -reward.pointsRequired,
  idempotencyKey,
  reward.id,
  null, // sourceEventId
  null, // correlationId
  null, // createdBy
  'REWARD_REDEMPTION',
  null, // programId
  {
    rewardName: reward.name,
    rewardCategory: reward.category,
  },
  request.branchId || null,     // ⭐ PASAR
);
```

### Recomendación 6: Crear Migración

**Archivo**: `libs/infrastructure/src/persistence/migrations/XXXX-AddBranchToPointsTransactions.ts`

```typescript
import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddBranchToPointsTransactions1769700000000 implements MigrationInterface {
  name = 'AddBranchToPointsTransactions1769700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar columna branchId
    await queryRunner.addColumn(
      'points_transactions',
      new TableColumn({
        name: 'branchId',
        type: 'int',
        isNullable: true,
        comment: 'FK a branches - Sucursal donde ocurrió la transacción',
      }),
    );

    // 2. Crear índice simple
    await queryRunner.createIndex(
      'points_transactions',
      new TableIndex({
        name: 'IDX_POINTS_TRANSACTIONS_BRANCH_ID',
        columnNames: ['branchId'],
      }),
    );

    // 3. Crear índice compuesto para reportes (tenantId ya tiene índice)
    await queryRunner.createIndex(
      'points_transactions',
      new TableIndex({
        name: 'IDX_POINTS_TRANSACTIONS_TENANT_BRANCH_DATE',
        columnNames: ['tenantId', 'branchId', 'createdAt'],
      }),
    );

    // 4. Agregar foreign key (opcional pero recomendado)
    const branchesTable = await queryRunner.getTable('branches');
    if (branchesTable) {
      await queryRunner.createForeignKey(
        'points_transactions',
        new TableForeignKey({
          name: 'FK_POINTS_TRANSACTIONS_BRANCH_ID',
          columnNames: ['branchId'],
          referencedTableName: 'branches',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign key
    const table = await queryRunner.getTable('points_transactions');
    if (table) {
      const branchFk = table.foreignKeys.find((fk) => fk.name === 'FK_POINTS_TRANSACTIONS_BRANCH_ID');
      if (branchFk) {
        await queryRunner.dropForeignKey('points_transactions', branchFk);
      }
    }

    // Eliminar índices
    await queryRunner.dropIndex('points_transactions', 'IDX_POINTS_TRANSACTIONS_TENANT_BRANCH_DATE');
    await queryRunner.dropIndex('points_transactions', 'IDX_POINTS_TRANSACTIONS_BRANCH_ID');

    // Eliminar columna
    await queryRunner.dropColumn('points_transactions', 'branchId');
  }
}
```

---

## 📈 Impacto de los Cambios

### Beneficios

1. **Performance** ⚡
   - Queries hasta **100x más rápidos** (columnas indexadas vs parsing JSON)
   - Reportes de sucursal en tiempo real
   - Dashboards corporativos sin lag

2. **Analytics** 📊
   - Reportes detallados por sucursal
   - Comparativas entre sucursales
   - KPIs por ubicación geográfica
   - Identificación de sucursales más rentables

3. **Trazabilidad** 🔍
   - Auditoría completa: "¿Dónde se hizo este ajuste?"
   - Seguimiento: "¿Dónde canjean más los clientes?"
   - Compliance: Registro detallado de operaciones

4. **Integridad** ✅
   - Foreign keys garantizan datos válidos
   - Validación a nivel de base de datos
   - Migración de datos inconsistentes detecta errores

### Riesgos y Mitigaciones

1. **Migración de Datos Existentes** ⚠️
   - **Riesgo**: Datos históricos sin `branchId`/`storeId`
   - **Mitigación**: Dejar como `NULL` - es información opcional
   - **Nota**: Datos futuros tendrán esta información

2. **Cambios en APIs** ⚠️
   - **Riesgo**: Breaking changes en endpoints
   - **Mitigación**: Hacer campos opcionales (backward compatible)
   - **Fase 1**: Agregar campos opcionales
   - **Fase 2**: Deprecar metadata (próxima versión)

3. **Testing** ⚠️
   - **Riesgo**: Bugs en flujos existentes
   - **Mitigación**: 
     - Tests unitarios para cada factory method actualizado
     - Tests de integración para endpoints
     - Validación en staging antes de producción

---

## 🗓️ Plan de Implementación

### Fase 1: Base de Datos (1-2 días)

1. ✅ Crear migración
2. ✅ Aplicar en desarrollo
3. ✅ Validar índices
4. ✅ Testing de performance

### Fase 2: Dominio e Infraestructura (2-3 días)

1. ✅ Actualizar entidad de dominio
2. ✅ Actualizar factory methods
3. ✅ Actualizar entidad de persistencia
4. ✅ Actualizar mapper
5. ✅ Tests unitarios

### Fase 3: Capa de Aplicación (3-4 días)

1. ✅ Actualizar handler de eventos (EARNING)
2. ✅ Actualizar handler de ajustes (ADJUSTMENT)
3. ✅ Actualizar handler de redención (REDEEM)
4. ✅ Actualizar DTOs de request
5. ✅ Tests de integración

### Fase 4: APIs y Documentación (1-2 días)

1. ✅ Actualizar controladores
2. ✅ Actualizar Swagger docs
3. ✅ Actualizar guía de frontend
4. ✅ Tests de endpoints

### Fase 5: Deploy y Monitoreo (1 día)

1. ✅ Deploy a staging
2. ✅ Validación QA
3. ✅ Deploy a producción
4. ✅ Monitoreo de queries

**Tiempo total estimado**: 8-12 días de desarrollo

---

## 📝 Ejemplos de Uso Post-Implementación

### Ejemplo 1: Ajuste con Branch

```typescript
// POST /partner/customers/15/points/adjustment
{
  "pointsDelta": 100,
  "reasonCode": "BONUS_BIRTHDAY",
  "branchId": 5,        // ⭐ NUEVO - Sucursal donde se realiza el ajuste
  "metadata": {
    "birthdayMonth": 2
  }
}
```

### Ejemplo 2: Redención con Branch

```typescript
// POST /partner/customers/15/rewards/10/redeem
{
  "branchId": 5         // ⭐ NUEVO - Sucursal donde se canjea
}
```

### Ejemplo 3: Query de Reporte por Sucursal

```sql
-- Puntos acumulados por sucursal este mes
SELECT 
  b.id as branchId,
  b.name as branchName,
  COUNT(*) as totalTransactions,
  SUM(pt.pointsDelta) as totalPointsAwarded
FROM points_transactions pt
INNER JOIN branches b ON pt.branchId = b.id
WHERE pt.type = 'EARNING'
  AND pt.createdAt >= '2026-02-01'
  AND pt.tenantId = 1
GROUP BY b.id, b.name
ORDER BY totalPointsAwarded DESC;
```

### Ejemplo 4: Top Sucursales por Redenciones

```sql
-- Sucursales con más redenciones
SELECT 
  b.id as branchId,
  b.name as branchName,
  COUNT(*) as totalRedemptions,
  SUM(ABS(pt.pointsDelta)) as totalPointsRedeemed
FROM points_transactions pt
INNER JOIN branches b ON pt.branchId = b.id
WHERE pt.type = 'REDEEM'
  AND pt.createdAt >= '2026-01-01'
  AND pt.tenantId = 1
GROUP BY b.id, b.name
ORDER BY totalRedemptions DESC
LIMIT 10;
```

### Ejemplo 5: Evento de Purchase con Branch

```typescript
// POST /partner/loyalty/events/purchase
{
  "orderId": "FAC-00124",
  "netAmount": 100.0,
  "grossAmount": 100.0,
  "currency": "GTQ",
  "branchId": 5,        // ⭐ Sucursal donde se hizo la compra
  "items": [
    {
      "sku": "PROD-001",
      "qty": 2,
      "unitPrice": 50.0
    }
  ]
}
// El branchId se propagará automáticamente a la transacción EARNING
```

---

## 🎯 Conclusión

### Estado Actual
- ✅ **`tenantId` existe**: Identifica el establecimiento/negocio
- ⚠️ **`branchId` PARCIAL**: Se captura en eventos pero se **pierde** en transacciones
- ❌ **NO CONSULTABLE**: Datos en JSON impiden reportes eficientes
- ❌ **VIOLA ARQUITECTURA**: Usar JSON para datos consultables va contra reglas documentadas
- ⚠️ **CORRECCIÓN**: `storeId` NO EXISTE en este sistema - debe eliminarse de eventos

### Recomendación Final

**🔴 IMPLEMENTAR CAMBIOS - PRIORIDAD ALTA**

Los cambios propuestos son:
- ✅ **Necesarios** para analytics por sucursal
- ✅ **Alineados** con arquitectura del proyecto
- ✅ **Backward compatible** (campo opcional)
- ✅ **Mejoran performance** significativamente
- ✅ **Habilitan dashboards** corporativos (Plan Conecta)
- ✅ **Simples**: Solo agregar `branchId` (no `storeId` que no existe)

**Beneficio vs Esfuerzo**: ⭐⭐⭐⭐⭐ (Muy alto)

**Tiempo estimado**: 6-10 días de desarrollo (reducido porque solo es `branchId`)

---

**Documentado por**: Sistema de Análisis Técnico  
**Fecha**: 2026-02-05  
**Versión**: 1.1 - Corregido para eliminar concepto inexistente de `storeId`  
**Versión**: 1.0
