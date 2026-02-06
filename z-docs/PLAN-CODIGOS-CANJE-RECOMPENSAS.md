# Plan de Trabajo: Sistema de Códigos de Canje para Recompensas

## 📋 Objetivo

Implementar un sistema de códigos de canje que permita a los clientes generar códigos únicos al canjear recompensas desde Customer UI, y que los partners puedan validar estos códigos desde Partner UI para aplicar las recompensas canjeadas.

### Funcionalidades Principales

1. **Generación de Códigos**: Al canjear una recompensa, se genera automáticamente un código único de canje
2. **Validación de Códigos**: Los partners pueden validar códigos para verificar y aplicar recompensas canjeadas
3. **Consulta de Códigos**: Los clientes pueden ver sus códigos de canje generados
4. **Compatibilidad hacia atrás**: El sistema debe funcionar sin romper funcionalidad existente

---

## 🏛️ Alineación Arquitectónica

Este plan sigue estrictamente la arquitectura definida en `ARCHITECTURE.md`:

### Principios Aplicados

1. **Domain-Driven Design (DDD)**: Nueva entidad de dominio `RedemptionCode` sin dependencias externas
2. **Arquitectura Hexagonal**: Separación clara de capas (Domain → Application → Infrastructure → APIs)
3. **Inmutabilidad**: Las entidades de dominio son inmutables (readonly)
4. **Ledger como Fuente de Verdad**: Los códigos referencian transacciones REDEEM del ledger, no modifican el sistema de puntos
5. **Mappers**: Conversión entre dominio y persistencia usando mappers
6. **Repositorios**: Interfaces en Domain, implementaciones en Infrastructure

### Flujo de Dependencias

```
APIs → Application → Domain ← Infrastructure
```

- ✅ **Domain**: Nueva entidad `RedemptionCode` e interfaz `IRedemptionCodeRepository`
- ✅ **Application**: Handlers para generar, validar y consultar códigos
- ✅ **Infrastructure**: Implementación de repositorio, entidad TypeORM, mapper, migración
- ✅ **APIs**: Endpoints en Customer API y Partner API

---

## 📁 Archivos y Módulos a Crear/Modificar

### Domain Layer (`libs/domain/src/`)

#### Nuevos Archivos:
1. `entities/redemption-code.entity.ts` - Entidad de dominio RedemptionCode
2. `repositories/redemption-code.repository.interface.ts` - Interfaz del repositorio

#### Archivos a Modificar:
- `index.ts` - Exportar nuevas entidades e interfaces

### Application Layer (`libs/application/src/`)

#### Nuevos Archivos:
1. `rewards/redeem-reward/redeem-reward-code-generator.service.ts` - Servicio para generar códigos únicos
2. `rewards/validate-redemption-code/validate-redemption-code.handler.ts` - Handler para validar códigos
3. `rewards/validate-redemption-code/validate-redemption-code.request.ts` - DTO de request
4. `rewards/validate-redemption-code/validate-redemption-code.response.ts` - DTO de response
5. `rewards/get-customer-redemption-codes/get-customer-redemption-codes.handler.ts` - Handler para listar códigos del cliente
6. `rewards/get-customer-redemption-codes/get-customer-redemption-codes.request.ts` - DTO de request
7. `rewards/get-customer-redemption-codes/get-customer-redemption-codes.response.ts` - DTO de response

#### Archivos a Modificar:
1. `rewards/redeem-reward/redeem-reward.handler.ts` - Agregar generación de código después de crear transacción
2. `rewards/redeem-reward/redeem-reward.response.ts` - Agregar campo opcional `redemptionCode`

### Infrastructure Layer (`libs/infrastructure/src/persistence/`)

#### Nuevos Archivos:
1. `entities/redemption-code.entity.ts` - Entidad TypeORM para RedemptionCode
2. `mappers/redemption-code.mapper.ts` - Mapper entre dominio y persistencia
3. `repositories/redemption-code.repository.ts` - Implementación del repositorio
4. `migrations/[timestamp]-CreateRedemptionCodesTable.ts` - Migración para crear tabla

#### Archivos a Modificar:
1. `database.module.ts` - Registrar nueva entidad y repositorio

### APIs Layer (`apps/`)

#### Archivos a Modificar:
1. `customer-api/src/controllers/rewards.controller.ts` - Agregar endpoint para listar códigos
2. `partner-api/src/controllers/rewards.controller.ts` - Crear controlador con endpoint de validación (o agregar a controlador existente)
3. `customer-api/src/customer-api.module.ts` - Registrar nuevos handlers
4. `partner-api/src/partner-api.module.ts` - Registrar nuevos handlers

---

## 🔧 Plan de Implementación Paso a Paso

### Fase 1: Domain Layer (Fundación)

#### Paso 1.1: Crear Entidad de Dominio `RedemptionCode`
- **Archivo**: `libs/domain/src/entities/redemption-code.entity.ts`
- **Responsabilidades**:
  - Definir estructura inmutable de RedemptionCode
  - Métodos de dominio: `markAsUsed()`, `cancel()`, `isExpired()`, `isValid()`
  - Factory method `create()` con validaciones
- **Campos principales**:
  - `id`, `code` (único), `transactionId`, `rewardId`, `membershipId`
  - `status`: 'pending' | 'used' | 'expired' | 'cancelled'
  - `expiresAt`, `usedAt`, `usedBy` (partnerId), `createdAt`

#### Paso 1.2: Crear Interfaz de Repositorio
- **Archivo**: `libs/domain/src/repositories/redemption-code.repository.interface.ts`
- **Métodos**:
  - `findById(id: number): Promise<RedemptionCode | null>`
  - `findByCode(code: string): Promise<RedemptionCode | null>`
  - `findByTransactionId(transactionId: number): Promise<RedemptionCode | null>`
  - `findByMembershipId(membershipId: number): Promise<RedemptionCode[]>`
  - `save(code: RedemptionCode): Promise<RedemptionCode>`
  - `update(code: RedemptionCode): Promise<RedemptionCode>`

#### Paso 1.3: Exportar en `index.ts`
- Agregar exports de `RedemptionCode` e `IRedemptionCodeRepository`

### Fase 2: Infrastructure Layer (Persistencia)

#### Paso 2.1: Crear Entidad de Persistencia
- **Archivo**: `libs/infrastructure/src/persistence/entities/redemption-code.entity.ts`
- **Características**:
  - Decoradores TypeORM (`@Entity`, `@Column`, etc.)
  - Índices: `code` (UNIQUE), `transactionId`, `membershipId`, `status`
  - Foreign keys: `transactionId` → `points_transactions.id`, `membershipId` → `customer_memberships.id`

#### Paso 2.2: Crear Mapper
- **Archivo**: `libs/infrastructure/src/persistence/mappers/redemption-code.mapper.ts`
- **Métodos**:
  - `toDomain(entity: RedemptionCodeEntity): RedemptionCode`
  - `toPersistence(domain: RedemptionCode): Partial<RedemptionCodeEntity>`

#### Paso 2.3: Crear Migración
- **Archivo**: `libs/infrastructure/src/persistence/migrations/[timestamp]-CreateRedemptionCodesTable.ts`
- **Tabla `redemption_codes`**:
  ```sql
  - id: INT PRIMARY KEY AUTO_INCREMENT
  - code: VARCHAR(50) UNIQUE NOT NULL
  - transaction_id: INT NOT NULL (FK → points_transactions.id)
  - reward_id: INT NOT NULL (FK → rewards.id)
  - membership_id: INT NOT NULL (FK → customer_memberships.id)
  - tenant_id: INT NOT NULL (FK → tenants.id)
  - status: VARCHAR(20) NOT NULL DEFAULT 'pending'
  - expires_at: DATETIME NULL
  - used_at: DATETIME NULL
  - used_by: INT NULL (FK → users.id, partner que validó)
  - created_at: DATETIME NOT NULL
  - updated_at: DATETIME NOT NULL

  Índices:
  - UNIQUE(code)
  - INDEX(transaction_id)
  - INDEX(membership_id)
  - INDEX(status)
  - INDEX(tenant_id)
  ```

#### Paso 2.4: Implementar Repositorio
- **Archivo**: `libs/infrastructure/src/persistence/repositories/redemption-code.repository.ts`
- **Características**:
  - Implementa `IRedemptionCodeRepository`
  - Usa TypeORM para acceso a datos
  - Siempre convierte usando `RedemptionCodeMapper`
  - Retorna entidades de dominio

#### Paso 2.5: Registrar en DatabaseModule
- Agregar `RedemptionCodeEntity` a `TypeOrmModule.forFeature()`
- Agregar provider y export de `IRedemptionCodeRepository`

### Fase 3: Application Layer (Lógica de Negocio)

#### Paso 3.1: Crear Servicio Generador de Códigos
- **Archivo**: `libs/application/src/rewards/redeem-reward/redeem-reward-code-generator.service.ts`
- **Responsabilidades**:
  - Generar códigos únicos con formato: `REWARD-{PREFIX}-{RANDOM}`
  - Verificar unicidad antes de generar
  - Retornar código generado
- **Formato propuesto**: `REWARD-ABC123-XYZ789` (12-16 caracteres)

#### Paso 3.2: Modificar `RedeemRewardHandler`
- **Archivo**: `libs/application/src/rewards/redeem-reward/redeem-reward.handler.ts`
- **Cambios**:
  1. Inyectar `IRedemptionCodeRepository` y `RedeemRewardCodeGeneratorService`
  2. Después de crear transacción REDEEM (paso 9), generar código:
     - Verificar si ya existe código para esta transacción (idempotencia)
     - Si no existe, generar nuevo código
     - Guardar código en transacción de BD (atomicidad)
  3. Incluir código en respuesta
- **Transacción de BD**: Usar `dataSource.transaction()` para atomicidad:
  ```typescript
  await this.dataSource.transaction(async (manager) => {
    // 1. Crear transacción REDEEM
    // 2. Generar código
    // 3. Guardar código
    // 4. Reducir stock
  });
  ```

#### Paso 3.3: Modificar `RedeemRewardResponse`
- **Archivo**: `libs/application/src/rewards/redeem-reward/redeem-reward.response.ts`
- **Cambios**:
  - Agregar campo opcional `redemptionCode?: string`
  - Documentar en Swagger como opcional

#### Paso 3.4: Crear Handler de Validación
- **Archivo**: `libs/application/src/rewards/validate-redemption-code/validate-redemption-code.handler.ts`
- **Lógica**:
  1. Buscar código por `code`
  2. Validar que existe
  3. Validar que pertenece al tenant del partner
  4. Validar estado (`pending`)
  5. Validar expiración (si aplica)
  6. Marcar como `used` con `usedBy` = partnerId
  7. Retornar información de la recompensa y transacción

#### Paso 3.5: Crear Handler de Consulta
- **Archivo**: `libs/application/src/rewards/get-customer-redemption-codes/get-customer-redemption-codes.handler.ts`
- **Lógica**:
  1. Validar que membership pertenece al usuario autenticado
  2. Buscar códigos por `membershipId`
  3. Filtrar por estado (opcional)
  4. Retornar lista paginada

### Fase 4: APIs Layer (Endpoints)

#### Paso 4.1: Endpoint Customer API - Listar Códigos
- **Archivo**: `apps/customer-api/src/controllers/rewards.controller.ts`
- **Endpoint**: `GET /customer/memberships/:membershipId/redemption-codes`
- **Características**:
  - Autenticación: JWT + `MembershipOwnershipGuard`
  - Query params: `status?`, `page?`, `limit?`
  - Response: Lista paginada de códigos

#### Paso 4.2: Endpoint Partner API - Validar Código
- **Archivo**: `apps/partner-api/src/controllers/rewards.controller.ts` (crear si no existe)
- **Endpoint**: `POST /partner/rewards/validate-code`
- **Request Body**: `{ code: string }`
- **Características**:
  - Autenticación: JWT + `RolesGuard` (PARTNER, PARTNER_STAFF)
  - Validar que el código pertenece al tenant del partner
  - Response: Información del código, recompensa y transacción

#### Paso 4.3: Registrar Handlers en Módulos
- `customer-api.module.ts`: Registrar `GetCustomerRedemptionCodesHandler`
- `partner-api.module.ts`: Registrar `ValidateRedemptionCodeHandler`

### Fase 5: Documentación y Testing

#### Paso 5.1: Actualizar Documentación
- Actualizar `GUIA-PARTNER-UI-CANJE-PUNTOS-RECOMPENSAS.md` con nueva funcionalidad
- Documentar endpoints en Swagger

#### Paso 5.2: Testing
- Unit tests para entidad de dominio
- Unit tests para handlers
- Integration tests para flujo completo
- Tests de idempotencia

---

## ✅ Estrategia de Validación y Testing

### Tests Unitarios

1. **Domain Tests** (`libs/domain/src/entities/__tests__/redemption-code.entity.spec.ts`):
   - Crear código válido
   - Validar métodos de dominio (`markAsUsed()`, `cancel()`, `isExpired()`)
   - Validar reglas de negocio

2. **Handler Tests**:
   - `RedeemRewardHandler`: Verificar generación de código
   - `ValidateRedemptionCodeHandler`: Validar lógica de validación
   - `GetCustomerRedemptionCodesHandler`: Validar filtros y paginación

### Tests de Integración

1. **Flujo Completo de Canje con Código**:
   - Cliente canjea recompensa
   - Verificar que se genera código
   - Verificar que código está en BD
   - Partner valida código
   - Verificar que código se marca como usado

2. **Idempotencia**:
   - Llamar canje dos veces con mismo idempotencyKey
   - Verificar que se retorna mismo código

3. **Validaciones de Seguridad**:
   - Partner no puede validar código de otro tenant
   - Cliente no puede ver códigos de otro cliente

### Tests de Rendimiento

- Generación de códigos únicos bajo carga
- Consulta de códigos con paginación

---

## ⚠️ Riesgos y Efectos Secundarios

### Riesgos Identificados

1. **Idempotencia del Código**:
   - **Riesgo**: Generar código duplicado
   - **Mitigación**: Constraint UNIQUE en BD + verificación antes de generar

2. **Transacciones de BD**:
   - **Riesgo**: Código creado pero transacción REDEEM falla (inconsistencia)
   - **Mitigación**: Usar transacción de BD que incluya creación de código y transacción REDEEM

3. **Idempotencia del Canje**:
   - **Riesgo**: Múltiples códigos para misma transacción si se llama canje dos veces
   - **Mitigación**: Verificar si transacción ya tiene código antes de generar

4. **Expiración de Códigos**:
   - **Riesgo**: Códigos nunca expiran si no se implementa lógica
   - **Mitigación**: Implementar job periódico o validar expiración al validar

5. **Compatibilidad hacia atrás**:
   - **Riesgo**: Clientes existentes esperan respuesta sin `redemptionCode`
   - **Mitigación**: Campo opcional, clientes pueden ignorarlo

### Efectos Secundarios

1. **Nueva Tabla en BD**: Requiere migración
2. **Nuevos Endpoints**: Documentación Swagger actualizada
3. **Performance**: Índices necesarios para consultas eficientes
4. **Almacenamiento**: Códigos se almacenan indefinidamente (considerar política de retención)

### Plan de Rollback

Si es necesario revertir:
1. Los códigos existentes seguirán funcionando (no se eliminan)
2. Deshabilitar generación de nuevos códigos (feature flag)
3. Endpoints de validación siguen funcionando para códigos existentes

---

## 📊 Checklist de Implementación

### Domain Layer
- [ ] Crear `RedemptionCode` entity
- [ ] Crear `IRedemptionCodeRepository` interface
- [ ] Exportar en `index.ts`

### Infrastructure Layer
- [ ] Crear `RedemptionCodeEntity` (TypeORM)
- [ ] Crear `RedemptionCodeMapper`
- [ ] Crear migración `CreateRedemptionCodesTable`
- [ ] Implementar `RedemptionCodeRepository`
- [ ] Registrar en `DatabaseModule`

### Application Layer
- [ ] Crear `RedeemRewardCodeGeneratorService`
- [ ] Modificar `RedeemRewardHandler` (generación de código)
- [ ] Modificar `RedeemRewardResponse` (campo opcional)
- [ ] Crear `ValidateRedemptionCodeHandler`
- [ ] Crear `GetCustomerRedemptionCodesHandler`

### APIs Layer
- [ ] Endpoint Customer API: `GET /redemption-codes`
- [ ] Endpoint Partner API: `POST /rewards/validate-code`
- [ ] Registrar handlers en módulos
- [ ] Documentación Swagger

### Testing
- [ ] Unit tests dominio
- [ ] Unit tests handlers
- [ ] Integration tests flujo completo
- [ ] Tests idempotencia

### Documentación
- [ ] Actualizar guía Partner UI
- [ ] Documentar endpoints en Swagger
- [ ] Actualizar README si aplica

---

## 🔄 Consideraciones de Idempotencia

### Problema Actual
El `idempotencyKey` en `RedeemRewardHandler` usa `Date.now()`, lo que hace que cada llamada genere una key diferente.

### Solución Propuesta
1. **Opción A (Recomendada)**: Mejorar idempotencyKey para usar hash o UUID
2. **Opción B**: Verificar si transacción ya tiene código antes de generar

**Implementación Opción B** (más simple, compatible):
```typescript
// En RedeemRewardHandler, después de crear transacción:
const existingCode = await this.redemptionCodeRepository.findByTransactionId(transaction.id);
if (existingCode) {
  // Ya existe código para esta transacción (idempotencia)
  return new RedeemRewardResponse({
    ...,
    redemptionCode: existingCode.code
  });
}

// Generar nuevo código solo si no existe
const code = await this.codeGenerator.generateUniqueCode();
const redemptionCode = RedemptionCode.create(...);
await this.redemptionCodeRepository.save(redemptionCode);
```

---

## 📝 Notas de Implementación

### Generación de Códigos Únicos

**Formato**: `REWARD-{PREFIX}-{RANDOM}`
- `PREFIX`: 3-4 caracteres alfanuméricos (puede ser hash de tenantId)
- `RANDOM`: 6-8 caracteres alfanuméricos aleatorios
- **Total**: 12-16 caracteres

**Algoritmo**:
1. Generar código candidato
2. Verificar unicidad en BD
3. Si existe, generar otro
4. Repetir hasta encontrar único (máximo 5 intentos)

### Política de Expiración

**Configuración propuesta**:
- Por defecto: 30 días desde creación
- Configurable por tenant (futuro)
- Validar en `ValidateRedemptionCodeHandler`

### Estados del Código

- `pending`: Generado, no usado
- `used`: Validado por partner
- `expired`: Expirado (no se puede usar)
- `cancelled`: Cancelado (si se revierte canje)

---

## 🎯 Criterios de Éxito

1. ✅ Cliente puede canjear recompensa y recibir código
2. ✅ Partner puede validar código y ver información de recompensa
3. ✅ Cliente puede listar sus códigos generados
4. ✅ Idempotencia funciona correctamente
5. ✅ Validaciones de seguridad funcionan
6. ✅ Compatibilidad hacia atrás mantenida
7. ✅ Tests pasan
8. ✅ Documentación actualizada

---

**Última actualización**: 2026-02-02
**Estado**: Pendiente de aprobación
