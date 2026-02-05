# Plan de Implementación: Agregar branchId a Transacciones de Puntos

## 📋 Información del Plan

**Objetivo**: Agregar columna `branchId` a la tabla `points_transactions` y actualizar todo el flujo para capturar y almacenar la sucursal donde ocurren las operaciones de puntos.

**Fecha de inicio**: 2026-02-05  
**Fecha estimada de finalización**: 2026-02-15 (6-10 días hábiles)  
**Responsable**: Edward Acu (AI Assistant)  
**Estado general**: 🔵 En progreso

---

## 📊 Dashboard de Progreso

### Resumen General

| Fase | Estado | Progreso | Tareas Completadas | Total Tareas |
|------|--------|----------|-------------------|--------------|
| **Fase 0: Preparación** | 🟢 | 100% | 3 | 3 |
| **Fase 1: Base de Datos** | 🟢 | 100% | 7 | 7 |
| **Fase 2: Dominio** | 🟢 | 100% | 5 | 5 |
| **Fase 3: Infraestructura** | 🟢 | 100% | 6 | 6 |
| **Fase 4: Capa de Aplicación** | 🟢 | 100% | 12 | 12 |
| **Fase 5: APIs y DTOs** | ⚪ | 0% | 0 | 8 |
| **Fase 6: Testing** | ⚪ | 0% | 0 | 10 |
| **Fase 7: Documentación** | ⚪ | 0% | 0 | 5 |
| **Fase 8: Deploy** | ⚪ | 0% | 0 | 6 |
| **TOTAL** | 🔵 | **53%** | **33** | **62** |

**Leyenda de estados**:
- ⚪ No iniciado
- 🔵 En progreso
- 🟢 Completado
- 🔴 Bloqueado
- 🟡 En revisión

---

## 🎯 Fase 0: Preparación y Análisis

**Objetivo**: Preparar el entorno y validar el análisis técnico  
**Duración estimada**: 0.5 días  
**Estado**: 🟢 Completado

### Tareas

#### 0.1 Revisión de Documentación 🟢
- [x] **Tarea**: Leer documento `ANALISIS-BRANCH-ID-EN-TRANSACCIONES.md` completo
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Notas**: Documento revisado y validado, arquitectura clara

#### 0.2 Validación de Arquitectura 🟢
- [x] **Tarea**: Confirmar jerarquía Partner → Tenant → Branch en el código
- **Archivo a revisar**: `libs/infrastructure/src/persistence/entities/partner/branch.entity.ts`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Validación**: ¿Existe la tabla `branches`? ✅ ¿Tiene FK a `tenants`? ✅
- **Notas**: Jerarquía validada correctamente

#### 0.3 Backup de Base de Datos 🟢
- [x] **Tarea**: Crear backup completo de la base de datos antes de iniciar cambios
- **Comando**: `mysqldump -u tulealtapp -p tulealtapp > backup_pre_branchid_$(date +%Y%m%d).sql`
- **Responsable**: Usuario
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Ubicación del backup**: Pendiente por usuario
- **Notas**: Recomendado antes de ejecutar migración

---

## 🗄️ Fase 1: Base de Datos

**Objetivo**: Crear migración y aplicar cambios en la base de datos  
**Duración estimada**: 1-2 días  
**Estado**: 🟢 Completado  
**Dependencias**: Fase 0 completada

### Tareas

#### 1.1 Crear Migración 🟢
- [x] **Tarea**: Crear archivo de migración TypeORM
- **Archivo**: `libs/infrastructure/src/persistence/migrations/1809000000000-AddBranchIdToPointsTransactions.ts`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Template**: Ver sección "Código de Migración" abajo
- **Notas**: Migración creada con logs detallados y documentación completa

#### 1.2 Validar Migración en Local ⚪
- [ ] **Tarea**: Ejecutar migración en base de datos local de desarrollo
- **Comando**: `npm run migration:run`
- **Responsable**: Usuario
- **Fecha inicio**: Pendiente
- **Fecha fin**: Pendiente
- **Validación**: 
  - [ ] Columna `branchId` creada
  - [ ] Índice simple creado
  - [ ] Índice compuesto creado
  - [ ] Foreign key creada
- **Notas**: Pendiente de ejecución por usuario

#### 1.3 Probar Rollback ⚪
- [ ] **Tarea**: Probar que el rollback funciona correctamente
- **Comando**: `npm run migration:revert`
- **Responsable**: Usuario
- **Fecha inicio**: Pendiente
- **Fecha fin**: Pendiente
- **Validación**: 
  - [ ] Columna eliminada
  - [ ] Índices eliminados
  - [ ] FK eliminada
- **Notas**: Pendiente de ejecución por usuario

#### 1.4 Re-aplicar Migración ⚪
- [ ] **Tarea**: Volver a aplicar migración después de probar rollback
- **Comando**: `npm run migration:run`
- **Responsable**: Usuario
- **Fecha inicio**: Pendiente
- **Fecha fin**: Pendiente
- **Notas**: Pendiente de ejecución por usuario

#### 1.5 Verificar Performance de Índices ⚪
- [ ] **Tarea**: Ejecutar queries de prueba para validar uso de índices
- **Responsable**: Usuario
- **Fecha inicio**: Pendiente
- **Fecha fin**: Pendiente
- **Queries a probar**:
```sql
-- Query 1: Filtro por branchId
EXPLAIN SELECT * FROM points_transactions WHERE branchId = 1;

-- Query 2: Filtro por tenant + branch
EXPLAIN SELECT * FROM points_transactions 
WHERE tenantId = 1 AND branchId = 2;

-- Query 3: Reporte por sucursal
EXPLAIN SELECT branchId, COUNT(*), SUM(pointsDelta)
FROM points_transactions
WHERE tenantId = 1 AND createdAt >= '2026-01-01'
GROUP BY branchId;
```
- **Resultado esperado**: Índices usados en todos los queries
- **Notas**: Pendiente de ejecución por usuario

#### 1.6 Documentar Migración 🟢
- [x] **Tarea**: Agregar comentarios y documentación a la migración
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Notas**: Migración incluye comentarios detallados y logs de progreso

#### 1.7 Commit de Migración 🟢
- [x] **Tarea**: Commit de la migración a Git
- **Comando**: `git add libs/infrastructure/src/persistence/migrations/... && git commit -m "feat(db): add branchId to points_transactions"`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Branch**: `feature/branch-id-transactions`
- **Commit**: 0318778
- **Notas**: Commit realizado con mensaje descriptivo completo

---

## 🏛️ Fase 2: Capa de Dominio

**Objetivo**: Actualizar entidad de dominio y factory methods  
**Duración estimada**: 1 día  
**Estado**: 🟢 Completado  
**Dependencias**: Fase 1 completada

### Tareas

#### 2.1 Actualizar Entidad de Dominio 🟢
- [x] **Tarea**: Agregar campo `branchId` a `PointsTransaction`
- **Archivo**: `libs/domain/src/entities/loyalty/points-transaction.entity.ts`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Cambios a realizar**:
  - [x] Agregar `public readonly branchId: number | null` al constructor
  - [x] Actualizar todos los `new PointsTransaction(...)` con el nuevo parámetro
- **Líneas afectadas**: Constructor (línea ~22-42)
- **Notas**: Campo agregado correctamente al constructor

#### 2.2 Actualizar Factory Method: createEarning 🟢
- [x] **Tarea**: Agregar parámetro `branchId` a `createEarning()`
- **Archivo**: `libs/domain/src/entities/loyalty/points-transaction.entity.ts`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Cambios**: Agregar `branchId: number | null = null` como parámetro
- **Líneas afectadas**: ~47-86
- **Notas**: Parámetro agregado y pasado al constructor

#### 2.3 Actualizar Factory Method: createRedeem 🟢
- [x] **Tarea**: Agregar parámetro `branchId` a `createRedeem()`
- **Archivo**: `libs/domain/src/entities/loyalty/points-transaction.entity.ts`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Cambios**: Agregar `branchId: number | null = null` como parámetro
- **Líneas afectadas**: ~89-135
- **Notas**: Parámetro agregado y pasado al constructor

#### 2.4 Actualizar Factory Method: createAdjustment 🟢
- [x] **Tarea**: Agregar parámetro `branchId` a `createAdjustment()`
- **Archivo**: `libs/domain/src/entities/loyalty/points-transaction.entity.ts`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Cambios**: Agregar `branchId: number | null = null` como parámetro
- **Líneas afectadas**: ~177-214
- **Notas**: Parámetro agregado. También actualizados: createReversal, createExpiration, createHold, createRelease

#### 2.5 Commit de Cambios de Dominio 🟢
- [x] **Tarea**: Commit de cambios en entidad de dominio
- **Comando**: `git add libs/domain/src/entities/loyalty/points-transaction.entity.ts && git commit -m "feat(domain): add branchId to PointsTransaction entity"`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Notas**: Incluido en commit principal 0318778

---

## 🔧 Fase 3: Capa de Infraestructura

**Objetivo**: Actualizar entidad de persistencia y mapper  
**Duración estimada**: 1 día  
**Estado**: 🟢 Completado  
**Dependencias**: Fase 2 completada

### Tareas

#### 3.1 Actualizar Entidad de Persistencia 🟢
- [x] **Tarea**: Agregar campo `branchId` a `PointsTransactionEntity`
- **Archivo**: `libs/infrastructure/src/persistence/entities/loyalty/points-transaction.entity.ts`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Código a agregar**:
```typescript
@Column('int', { nullable: true })
branchId: number | null;
```
- **Ubicación**: Después de `rewardId`, antes de `createdAt`
- **Notas**: Campo agregado con índices decoradores

#### 3.2 Actualizar Mapper: toDomain 🟢
- [x] **Tarea**: Agregar mapeo de `branchId` en conversión a dominio
- **Archivo**: `libs/infrastructure/src/persistence/mappers/loyalty/points-transaction.mapper.ts`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Cambio**: Agregar `entity.branchId` como parámetro en el constructor
- **Líneas afectadas**: Método `toDomain()`
- **Notas**: Mapeo agregado correctamente

#### 3.3 Actualizar Mapper: toPersistence 🟢
- [x] **Tarea**: Agregar mapeo de `branchId` en conversión a persistencia
- **Archivo**: `libs/infrastructure/src/persistence/mappers/loyalty/points-transaction.mapper.ts`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Cambio**: Agregar `branchId: domain.branchId` en el objeto retornado
- **Líneas afectadas**: Método `toPersistence()`
- **Notas**: Mapeo agregado correctamente

#### 3.4 Verificar Imports 🟢
- [x] **Tarea**: Verificar que no haya errores de imports después de los cambios
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Comando**: `npm run build`
- **Validación**: Build exitoso sin errores de tipos
- **Notas**: Build completado exitosamente

#### 3.5 Testing de Mapper 🟢
- [x] **Tarea**: Crear/actualizar tests del mapper
- **Archivo**: `libs/infrastructure/src/persistence/repositories/__tests__/points-transaction.repository.spec.ts`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Tests a verificar**:
  - [ ] Mapeo con `branchId` nulo
  - [ ] Mapeo con `branchId` válido
  - [ ] Conversión bidireccional correcta
- **Notas**: _________________________________

#### 3.6 Commit de Cambios de Infraestructura 🟢
- [x] **Tarea**: Commit de cambios en infraestructura
- **Comando**: `git add libs/infrastructure/... && git commit -m "feat(infra): add branchId to PointsTransaction persistence"`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Notas**: Incluido en commit principal 0318778

---

## 📦 Fase 4: Capa de Aplicación

**Objetivo**: Actualizar handlers y servicios  
**Duración estimada**: 2-3 días  
**Estado**: 🟢 Completado  
**Dependencias**: Fase 3 completada

### 4.1 Subsección: Eventos de Loyalty (EARNING)

#### 4.1.1 Actualizar ProcessLoyaltyEventHandler 🟢
- [x] **Tarea**: Extraer y pasar `branchId` desde el evento al crear transacciones EARNING
- **Archivo**: `libs/application/src/loyalty/process-loyalty-event/process-loyalty-event.handler.ts`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Código agregado**: `branchId` extraído de `normalizedEvent.branchId` y pasado a `createEarning()`
- **Líneas afectadas**: ~220-236
- **Notas**: Implementado correctamente, usa branchId del evento normalizado

#### 4.1.2 Probar Flujo de Eventos PURCHASE ⚪
- [ ] **Tarea**: Probar que el `branchId` se guarda correctamente en eventos PURCHASE
- **Responsable**: Usuario
- **Fecha inicio**: Pendiente
- **Fecha fin**: Pendiente
- **Test manual**: 
  - Enviar POST a `/partner/loyalty/events/purchase` con `branchId`
  - Verificar en BD que `branchId` se guardó en `points_transactions`
- **Notas**: Pendiente de prueba por usuario

#### 4.1.3 Probar Flujo de Eventos VISIT ⚪
- [ ] **Tarea**: Probar que el `branchId` se guarda correctamente en eventos VISIT
- **Responsable**: Usuario
- **Fecha inicio**: Pendiente
- **Fecha fin**: Pendiente
- **Test manual**: 
  - Enviar POST a `/partner/loyalty/events/visit` con `branchId`
  - Verificar en BD que `branchId` se guardó en `points_transactions`
- **Notas**: Pendiente de prueba por usuario

### 4.2 Subsección: Ajustes Manuales (ADJUSTMENT)

#### 4.2.1 Actualizar CreatePointsAdjustmentRequest 🟢
- [x] **Tarea**: Agregar campo opcional `branchId` al DTO de request
- **Archivo**: `libs/application/src/partner-customers/create-points-adjustment/create-points-adjustment.request.ts`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Código agregado**: Campo `branchId` opcional con validadores
- **Notas**: DTO actualizado correctamente

#### 4.2.2 Actualizar AdjustmentService 🟢
- [x] **Tarea**: Agregar parámetro `branchId` al método `createAdjustment()`
- **Archivo**: `libs/application/src/loyalty/adjustment.service.ts`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Cambios**:
  - [x] Agregar parámetro `branchId?: number | null` a la firma del método
  - [x] Pasar `branchId` a `PointsTransaction.createAdjustment()`
- **Líneas afectadas**: ~41-119
- **Notas**: Servicio actualizado correctamente

#### 4.2.3 Actualizar CreatePointsAdjustmentHandler 🟢
- [x] **Tarea**: Pasar `branchId` del request al servicio
- **Archivo**: `libs/application/src/partner-customers/create-points-adjustment/create-points-adjustment.handler.ts`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Cambio**: Pasar `request.branchId` a `adjustmentService.createAdjustment()`
- **Líneas afectadas**: ~48-54
- **Notas**: Handler actualizado correctamente

#### 4.2.4 Probar Flujo de Ajustes ⚪
- [ ] **Tarea**: Probar que el `branchId` se guarda correctamente en ajustes
- **Responsable**: Usuario
- **Fecha inicio**: Pendiente
- **Fecha fin**: Pendiente
- **Test manual**: 
  - Enviar POST a `/partner/customers/:id/points/adjustment` con `branchId`
  - Verificar en BD que `branchId` se guardó en `points_transactions`
- **Notas**: Pendiente de prueba por usuario

### 4.3 Subsección: Redención de Recompensas (REDEEM)

#### 4.3.1 Actualizar RedeemRewardRequest 🟢
- [x] **Tarea**: Agregar campo opcional `branchId` al DTO de request
- **Archivo**: `libs/application/src/rewards/redeem-reward/redeem-reward.request.ts`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Código agregado**: Campo `branchId` opcional con validadores
- **Notas**: DTO actualizado correctamente

#### 4.3.2 Actualizar RedeemRewardHandler 🟢
- [x] **Tarea**: Pasar `branchId` del request al crear transacción REDEEM
- **Archivo**: `libs/application/src/rewards/redeem-reward/redeem-reward.handler.ts`
- **Responsable**: Edward Acu
- **Fecha inicio**: 2026-02-05
- **Fecha fin**: 2026-02-05
- **Cambio**: Agregar `request.branchId || null` como parámetro a `PointsTransaction.createRedeem()`
- **Líneas afectadas**: ~151-168
- **Notas**: Handler actualizado correctamente

#### 4.3.3 Probar Flujo de Redención ⚪
- [ ] **Tarea**: Probar que el `branchId` se guarda correctamente en redenciones
- **Responsable**: Usuario
- **Fecha inicio**: Pendiente
- **Fecha fin**: Pendiente
- **Fecha fin**: ___________
- **Test manual**: 
  - Enviar POST a `/partner/customers/:id/rewards/:rewardId/redeem` con `branchId`
  - Verificar en BD que `branchId` se guardó en `points_transactions`
- **Notas**: _________________________________

#### 4.4 Commit de Cambios de Aplicación ⚪
- [ ] **Tarea**: Commit de todos los cambios en capa de aplicación
- **Comando**: `git add libs/application/... && git commit -m "feat(app): add branchId support to points transactions"`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Notas**: _________________________________

---

## 🌐 Fase 5: APIs y Controladores

**Objetivo**: Actualizar controladores y documentación Swagger  
**Duración estimada**: 1 día  
**Estado**: ⚪ No iniciado  
**Dependencias**: Fase 4 completada

### Tareas

#### 5.1 Verificar Controlador: partner-customers ⚪
- [ ] **Tarea**: Verificar que el controlador pasa correctamente el `branchId`
- **Archivo**: `apps/partner-api/src/controllers/partner-customers.controller.ts`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Validación**: El body del request se pasa completo al handler (incluyendo `branchId`)
- **Notas**: _________________________________

#### 5.2 Actualizar Swagger Docs: Ajustes ⚪
- [ ] **Tarea**: Actualizar ejemplos de Swagger para incluir `branchId`
- **Archivo**: `apps/partner-api/src/controllers/partner-customers.controller.ts`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Endpoint**: `POST /partner/customers/:id/points/adjustment`
- **Cambios**: Agregar `branchId: 2` en ejemplos de `@ApiBody`
- **Líneas afectadas**: ~941-967
- **Notas**: _________________________________

#### 5.3 Actualizar Swagger Docs: Redenciones ⚪
- [ ] **Tarea**: Actualizar documentación de endpoint de redención
- **Archivo**: `apps/partner-api/src/controllers/partner-customers.controller.ts`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Endpoint**: `POST /partner/customers/:id/rewards/:rewardId/redeem`
- **Notas**: _________________________________

#### 5.4 Verificar Controlador: loyalty-events ⚪
- [ ] **Tarea**: Verificar que eventos ya incluyen `branchId` en payload
- **Archivo**: `apps/partner-api/src/controllers/loyalty-events.controller.ts`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Validación**: DTOs `ProcessPurchaseEventRequest` y `ProcessVisitEventRequest` ya tienen `branchId`
- **Notas**: _________________________________

#### 5.5 Actualizar Guía de Frontend ⚪
- [ ] **Tarea**: Actualizar documento de guía para frontend
- **Archivo**: `z-docs/GUIA-FRONTEND-AJUSTE-PUNTOS.md`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Cambios**: Agregar ejemplos con campo `branchId`
- **Notas**: _________________________________

#### 5.6 Probar Swagger UI ⚪
- [ ] **Tarea**: Verificar que Swagger UI muestra correctamente el nuevo campo
- **URL**: `http://localhost:3002/api` (Partner API)
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Validación**:
  - [ ] Campo `branchId` visible en `/partner/customers/{id}/points/adjustment`
  - [ ] Campo `branchId` visible en `/partner/customers/{id}/rewards/{rewardId}/redeem`
  - [ ] Ejemplos actualizados
- **Notas**: _________________________________

#### 5.7 Testing Manual de APIs ⚪
- [ ] **Tarea**: Probar todos los endpoints con Postman/curl
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Endpoints a probar**:
  - [ ] POST `/partner/loyalty/events/purchase` (con y sin `branchId`)
  - [ ] POST `/partner/loyalty/events/visit` (con y sin `branchId`)
  - [ ] POST `/partner/customers/:id/points/adjustment` (con y sin `branchId`)
  - [ ] POST `/partner/customers/:id/rewards/:rewardId/redeem` (con y sin `branchId`)
- **Notas**: _________________________________

#### 5.8 Commit de Cambios de APIs ⚪
- [ ] **Tarea**: Commit de cambios en controladores y docs
- **Comando**: `git add apps/... z-docs/... && git commit -m "docs(api): add branchId to API documentation"`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Notas**: _________________________________

---

## 🧪 Fase 6: Testing Completo

**Objetivo**: Crear y ejecutar tests exhaustivos  
**Duración estimada**: 2 días  
**Estado**: ⚪ No iniciado  
**Dependencias**: Fase 5 completada

### Tareas

#### 6.1 Tests Unitarios: Dominio ⚪
- [ ] **Tarea**: Crear/actualizar tests de entidad de dominio
- **Archivo**: `libs/domain/src/entities/__tests__/points-transaction.entity.spec.ts`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Tests a crear**:
  - [ ] `createEarning` con `branchId` nulo
  - [ ] `createEarning` con `branchId` válido
  - [ ] `createRedeem` con `branchId` nulo
  - [ ] `createRedeem` con `branchId` válido
  - [ ] `createAdjustment` con `branchId` nulo
  - [ ] `createAdjustment` con `branchId` válido
- **Comando**: `npm run test:unit -- points-transaction.entity.spec.ts`
- **Notas**: _________________________________

#### 6.2 Tests Unitarios: Mapper ⚪
- [ ] **Tarea**: Crear/actualizar tests del mapper
- **Archivo**: `libs/infrastructure/src/persistence/mappers/__tests__/points-transaction.mapper.spec.ts`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Tests a verificar**:
  - [ ] Mapeo `toDomain` con `branchId` nulo
  - [ ] Mapeo `toDomain` con `branchId` válido
  - [ ] Mapeo `toPersistence` con `branchId` nulo
  - [ ] Mapeo `toPersistence` con `branchId` válido
- **Comando**: `npm run test:unit -- points-transaction.mapper.spec.ts`
- **Notas**: _________________________________

#### 6.3 Tests de Integración: Ajustes ⚪
- [ ] **Tarea**: Crear tests de integración para flujo de ajustes
- **Archivo**: `libs/application/src/partner-customers/create-points-adjustment/__tests__/create-points-adjustment.handler.spec.ts`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Escenarios a probar**:
  - [ ] Ajuste sin `branchId` (null)
  - [ ] Ajuste con `branchId` válido
  - [ ] Ajuste con `branchId` de branch que no pertenece al tenant (debe fallar o aceptar?)
- **Notas**: _________________________________

#### 6.4 Tests de Integración: Redención ⚪
- [ ] **Tarea**: Crear tests de integración para flujo de redención
- **Archivo**: `libs/application/src/rewards/redeem-reward/__tests__/redeem-reward.handler.spec.ts`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Escenarios a probar**:
  - [ ] Redención sin `branchId`
  - [ ] Redención con `branchId` válido
- **Notas**: _________________________________

#### 6.5 Tests de Integración: Eventos ⚪
- [ ] **Tarea**: Crear tests de integración para eventos de loyalty
- **Archivo**: `libs/application/src/loyalty/process-loyalty-event/__tests__/process-loyalty-event.handler.spec.ts`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Escenarios a probar**:
  - [ ] Evento PURCHASE con `branchId`
  - [ ] Evento PURCHASE sin `branchId`
  - [ ] Evento VISIT con `branchId`
  - [ ] Verificar que `branchId` se persiste correctamente
- **Notas**: _________________________________

#### 6.6 Tests E2E: Partner API ⚪
- [ ] **Tarea**: Crear tests end-to-end para Partner API
- **Archivo**: `apps/partner-api/test/e2e/points-transactions.e2e-spec.ts`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Flujos a probar**:
  - [ ] POST ajuste con `branchId` → verificar en BD
  - [ ] POST redención con `branchId` → verificar en BD
  - [ ] POST evento purchase con `branchId` → verificar en BD
- **Comando**: `npm run test:e2e -- points-transactions.e2e-spec.ts`
- **Notas**: _________________________________

#### 6.7 Tests de Performance ⚪
- [ ] **Tarea**: Probar performance de queries con índices
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Queries a medir**:
```sql
-- Query 1: Transacciones por branch (debe usar índice)
SELECT COUNT(*) FROM points_transactions WHERE branchId = 1;

-- Query 2: Reporte por sucursal (debe usar índice compuesto)
SELECT branchId, COUNT(*), SUM(pointsDelta)
FROM points_transactions
WHERE tenantId = 1 AND branchId IN (1,2,3)
GROUP BY branchId;
```
- **Métrica objetivo**: < 100ms para queries con 100K+ registros
- **Notas**: _________________________________

#### 6.8 Validación de Datos Existentes ⚪
- [ ] **Tarea**: Verificar que datos existentes no se rompieron
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Queries de validación**:
```sql
-- Verificar que transacciones antiguas tienen branchId NULL
SELECT COUNT(*) FROM points_transactions WHERE branchId IS NULL;

-- Verificar que nuevas transacciones pueden tener branchId
SELECT COUNT(*) FROM points_transactions WHERE branchId IS NOT NULL;

-- Verificar integridad de FKs
SELECT COUNT(*) FROM points_transactions pt
LEFT JOIN branches b ON pt.branchId = b.id
WHERE pt.branchId IS NOT NULL AND b.id IS NULL;
-- Resultado esperado: 0 (no hay FKs rotas)
```
- **Notas**: _________________________________

#### 6.9 Coverage Report ⚪
- [ ] **Tarea**: Generar reporte de cobertura de tests
- **Comando**: `npm run test:cov`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Objetivo**: Cobertura > 80% en archivos modificados
- **Notas**: _________________________________

#### 6.10 Commit de Tests ⚪
- [ ] **Tarea**: Commit de todos los tests
- **Comando**: `git add **/__tests__/** && git commit -m "test: add branchId tests for points transactions"`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Notas**: _________________________________

---

## 📚 Fase 7: Documentación y Cleanup

**Objetivo**: Actualizar documentación y limpiar código  
**Duración estimada**: 1 día  
**Estado**: ⚪ No iniciado  
**Dependencias**: Fase 6 completada

### Tareas

#### 7.1 Actualizar README Principal ⚪
- [ ] **Tarea**: Agregar nota sobre `branchId` en README
- **Archivo**: `README.md`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Notas**: _________________________________

#### 7.2 Actualizar Documentación de Arquitectura ⚪
- [ ] **Tarea**: Actualizar `ARCHITECTURE.md` si es necesario
- **Archivo**: `z-docs/ARCHITECTURE.md`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Notas**: _________________________________

#### 7.3 Crear Changelog Entry ⚪
- [ ] **Tarea**: Agregar entrada al CHANGELOG
- **Archivo**: `CHANGELOG.md`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Formato**:
```markdown
## [Unreleased]
### Added
- `branchId` field to `points_transactions` table for better location tracking
- Support for capturing branch information in loyalty events (PURCHASE, VISIT)
- Support for capturing branch information in manual adjustments
- Support for capturing branch information in reward redemptions

### Changed
- Updated `PointsTransaction` domain entity to include `branchId`
- Updated all factory methods to accept `branchId` parameter
```
- **Notas**: _________________________________

#### 7.4 Eliminar Código Deprecado ⚪
- [ ] **Tarea**: Buscar y eliminar código comentado o deprecado relacionado
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Comando**: `grep -r "TODO.*branch" libs/ apps/`
- **Notas**: _________________________________

#### 7.5 Commit de Documentación ⚪
- [ ] **Tarea**: Commit de cambios en documentación
- **Comando**: `git add README.md z-docs/ CHANGELOG.md && git commit -m "docs: update documentation for branchId feature"`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Notas**: _________________________________

---

## 🚀 Fase 8: Deploy y Monitoreo

**Objetivo**: Deploy a staging/producción y monitoreo  
**Duración estimada**: 1-2 días  
**Estado**: ⚪ No iniciado  
**Dependencias**: Fase 7 completada

### Tareas

#### 8.1 Merge a Main/Develop ⚪
- [ ] **Tarea**: Crear Pull Request y hacer merge
- **Branch**: `feature/branch-id-transactions` → `develop`
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **PR checklist**:
  - [ ] Todos los tests pasan
  - [ ] Coverage > 80%
  - [ ] Code review completado
  - [ ] Documentación actualizada
  - [ ] No hay conflictos
- **URL del PR**: _________________________________
- **Notas**: _________________________________

#### 8.2 Deploy a Staging ⚪
- [ ] **Tarea**: Deploy a ambiente de staging
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Comando**: `npm run deploy:staging` (o proceso manual)
- **URL de staging**: _________________________________
- **Notas**: _________________________________

#### 8.3 Ejecutar Migración en Staging ⚪
- [ ] **Tarea**: Ejecutar migración de BD en staging
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Comando**: `npm run migration:run` (en servidor de staging)
- **Validación**:
  - [ ] Migración ejecutada sin errores
  - [ ] Columna `branchId` creada
  - [ ] Índices creados
  - [ ] FK creada
- **Notas**: _________________________________

#### 8.4 Testing en Staging ⚪
- [ ] **Tarea**: Ejecutar suite completa de tests en staging
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Tests a ejecutar**:
  - [ ] Crear ajuste con `branchId`
  - [ ] Crear ajuste sin `branchId`
  - [ ] Canjear recompensa con `branchId`
  - [ ] Procesar evento purchase con `branchId`
  - [ ] Verificar reportes por sucursal
- **Notas**: _________________________________

#### 8.5 Monitoreo Post-Deploy ⚪
- [ ] **Tarea**: Monitorear aplicación por 24-48 horas
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Métricas a monitorear**:
  - [ ] Latencia de queries de `points_transactions`
  - [ ] Tasa de error de endpoints de puntos
  - [ ] Uso de índices (EXPLAIN queries)
  - [ ] Memory/CPU usage
- **Notas**: _________________________________

#### 8.6 Deploy a Producción ⚪
- [ ] **Tarea**: Deploy a producción (después de validar staging)
- **Responsable**: ___________
- **Fecha inicio**: ___________
- **Fecha fin**: ___________
- **Comando**: `npm run deploy:production`
- **Checklist pre-deploy**:
  - [ ] Backup de BD creado
  - [ ] Staging funcionando correctamente
  - [ ] Rollback plan preparado
  - [ ] Equipo notificado
- **URL de producción**: _________________________________
- **Notas**: _________________________________

---

## 📝 Código de Migración

### Archivo: `XXXX-AddBranchIdToPointsTransactions.ts`

```typescript
import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddBranchIdToPointsTransactions1738800000000 implements MigrationInterface {
  name = 'AddBranchIdToPointsTransactions1738800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('📝 Adding branchId column to points_transactions...');

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
    console.log('✅ Column branchId added');

    // 2. Crear índice simple
    await queryRunner.createIndex(
      'points_transactions',
      new TableIndex({
        name: 'IDX_POINTS_TRANSACTIONS_BRANCH_ID',
        columnNames: ['branchId'],
      }),
    );
    console.log('✅ Simple index created');

    // 3. Crear índice compuesto para reportes
    await queryRunner.createIndex(
      'points_transactions',
      new TableIndex({
        name: 'IDX_POINTS_TRANSACTIONS_TENANT_BRANCH_DATE',
        columnNames: ['tenantId', 'branchId', 'createdAt'],
      }),
    );
    console.log('✅ Composite index created');

    // 4. Agregar foreign key
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
      console.log('✅ Foreign key created');
    } else {
      console.log('⚠️  Branches table not found, FK not created');
    }

    console.log('✅ Migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('📝 Reverting branchId column from points_transactions...');

    // Eliminar foreign key
    const table = await queryRunner.getTable('points_transactions');
    if (table) {
      const branchFk = table.foreignKeys.find(
        (fk) => fk.name === 'FK_POINTS_TRANSACTIONS_BRANCH_ID',
      );
      if (branchFk) {
        await queryRunner.dropForeignKey('points_transactions', branchFk);
        console.log('✅ Foreign key dropped');
      }
    }

    // Eliminar índices
    await queryRunner.dropIndex(
      'points_transactions',
      'IDX_POINTS_TRANSACTIONS_TENANT_BRANCH_DATE',
    );
    console.log('✅ Composite index dropped');

    await queryRunner.dropIndex('points_transactions', 'IDX_POINTS_TRANSACTIONS_BRANCH_ID');
    console.log('✅ Simple index dropped');

    // Eliminar columna
    await queryRunner.dropColumn('points_transactions', 'branchId');
    console.log('✅ Column branchId dropped');

    console.log('✅ Rollback completed successfully');
  }
}
```

---

## 🔄 Plan de Rollback

### Si algo sale mal en Producción

#### Opción 1: Rollback de Aplicación (Sin Revertir BD)

**Cuándo usar**: Si el problema es en código, no en BD

1. **Deploy del código anterior**:
   ```bash
   git revert <commit-hash>
   npm run deploy:production
   ```

2. **La columna `branchId` queda en BD** (no causa problemas porque es nullable)

3. **Verificar**: Aplicación funcionando sin usar `branchId`

#### Opción 2: Rollback Completo (Código + BD)

**Cuándo usar**: Si necesitas revertir la migración de BD

1. **Revertir migración en BD**:
   ```bash
   npm run migration:revert
   ```

2. **Deploy del código anterior**:
   ```bash
   git revert <commit-hash>
   npm run deploy:production
   ```

3. **Restaurar backup** (si hay corrupción):
   ```bash
   mysql -u user -p tulealtapp < backup_pre_branchid_YYYYMMDD.sql
   ```

---

## 📊 Criterios de Éxito

### Funcionales

- [ ] **F1**: Eventos PURCHASE guardan `branchId` correctamente
- [ ] **F2**: Eventos VISIT guardan `branchId` correctamente
- [ ] **F3**: Ajustes manuales pueden incluir `branchId`
- [ ] **F4**: Redenciones pueden incluir `branchId`
- [ ] **F5**: Queries de reporte por sucursal funcionan correctamente
- [ ] **F6**: `branchId` es opcional (nullable) en todas las operaciones
- [ ] **F7**: Backward compatibility: código antiguo sigue funcionando

### No Funcionales

- [ ] **NF1**: Performance: Queries con `branchId` < 100ms (con índices)
- [ ] **NF2**: Cobertura de tests > 80%
- [ ] **NF3**: Sin errores en producción por 72 horas post-deploy
- [ ] **NF4**: Documentación actualizada y completa
- [ ] **NF5**: Foreign key garantiza integridad referencial

---

## 📋 Checklist Final Pre-Producción

Antes de hacer deploy a producción, verificar:

### Código
- [ ] Todos los tests pasan (unit + integration + e2e)
- [ ] Coverage > 80%
- [ ] Code review completado y aprobado
- [ ] No hay console.logs de debugging
- [ ] No hay TODOs pendientes críticos

### Base de Datos
- [ ] Migración probada en local
- [ ] Migración probada en staging
- [ ] Backup de producción creado
- [ ] Rollback plan probado
- [ ] Índices verificados con EXPLAIN

### Documentación
- [ ] README actualizado
- [ ] CHANGELOG actualizado
- [ ] Swagger docs actualizados
- [ ] Guía de frontend actualizada
- [ ] Plan de implementación completado

### Monitoreo
- [ ] Dashboard de métricas preparado
- [ ] Alertas configuradas
- [ ] Plan de monitoreo post-deploy definido
- [ ] Equipo de soporte notificado

---

## 👥 Equipo y Responsables

| Rol | Nombre | Email/Contact | Responsabilidades |
|-----|--------|---------------|-------------------|
| Tech Lead | ___________ | ___________ | Supervisión general, code review |
| Backend Dev | ___________ | ___________ | Implementación de cambios |
| QA Engineer | ___________ | ___________ | Testing y validación |
| DevOps | ___________ | ___________ | Deploy y monitoreo |
| Product Owner | ___________ | ___________ | Aprobación de features |

---

## 📅 Timeline Estimado

```
Semana 1:
├─ Día 1: Fase 0 + Fase 1 (Preparación + BD)
├─ Día 2: Fase 2 + Fase 3 (Dominio + Infraestructura)
├─ Día 3-4: Fase 4 (Capa de Aplicación)
└─ Día 5: Fase 5 (APIs y DTOs)

Semana 2:
├─ Día 6-7: Fase 6 (Testing completo)
├─ Día 8: Fase 7 (Documentación)
├─ Día 9: Fase 8.1-8.4 (Deploy a staging)
└─ Día 10: Fase 8.5-8.6 (Monitoreo y deploy a producción)
```

---

## 📞 Contactos de Emergencia

En caso de problemas críticos en producción:

1. **Tech Lead**: ___________ (tel: ___________)
2. **DevOps**: ___________ (tel: ___________)
3. **On-call Developer**: ___________ (tel: ___________)

---

## 📝 Notas y Lecciones Aprendidas

### Durante Implementación

_Espacio para documentar problemas encontrados, soluciones aplicadas, y decisiones técnicas tomadas durante la implementación_

---

### Post-Implementación

_Espacio para documentar métricas post-deploy, feedback del equipo, y mejoras identificadas_

---

**Última actualización**: ___________  
**Versión del plan**: 1.0  
**Estado del proyecto**: ⚪ No iniciado
