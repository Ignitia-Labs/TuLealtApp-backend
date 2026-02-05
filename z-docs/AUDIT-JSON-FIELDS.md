# Auditoría de Campos JSON - Plan de Eliminación

**Fecha**: 2026-01-29
**Estado**: En progreso

## 📊 Resumen Ejecutivo

Este documento registra la auditoría completa de campos JSON en tablas operativas, identificando dependencias, consultas y casos edge para la migración a esquema relacional.

---

## 1. Tabla `reward_rules` (PRIORIDAD ALTA)

### 1.1 Campos JSON Identificados

| Campo JSON | Tipo | Nullable | Uso Actual | Prioridad |
|------------|------|----------|------------|-----------|
| `scope` | JSON | NO | Definir alcance de la regla (tenant, program, store, branch, channel, category, sku) | ALTA |
| `eligibility` | JSON | NO | Condiciones de elegibilidad (tier, status, amount, items, time, etc.) | ALTA |
| `pointsFormula` | JSON | NO | Fórmula de cálculo de puntos (fixed, rate, table, hybrid) | ALTA |
| `limits` | JSON | SÍ | Límites de frecuencia y cooldown | ALTA |
| `conflict` | JSON | NO | Configuración de conflictos y prioridad | ALTA |
| `idempotencyScope` | JSON | NO | Estrategia de idempotencia | ALTA |

### 1.2 Consultas que Usan JSON

#### JSON_EXTRACT (5 ocurrencias)
**Archivo**: `libs/infrastructure/src/persistence/repositories/reward-rule.repository.ts`

```typescript
// Líneas: 53, 84, 114, 144, 164
.orderBy('CAST(JSON_EXTRACT(rule.conflict, \'$.priorityRank\') AS UNSIGNED)', 'DESC')
```

**Uso**: Ordenar reglas por `priorityRank` dentro del campo JSON `conflict`.

**Impacto**:
- ✅ Ya existe columna `conflictGroup` extraída de `conflict.conflictGroup`
- ⚠️ Necesitamos agregar columna `conflict_priority_rank` para reemplazar el JSON_EXTRACT

### 1.3 Acceso a Campos JSON en Código

#### Mappers
- **Archivo**: `libs/infrastructure/src/persistence/mappers/reward-rule.mapper.ts`
- **Líneas**: 18-23, 48-53
- **Uso**: Cast directo de JSON a tipos del dominio (`as RewardRule['scope']`, etc.)

#### Entidades de Persistencia
- **Archivo**: `libs/infrastructure/src/persistence/entities/reward-rule.entity.ts`
- **Líneas**: 47-112
- **Uso**: Definición de tipos TypeScript para campos JSON

#### Servicios de Aplicación
- **Archivo**: `libs/application/src/loyalty/reward-rule-evaluator.service.ts`
- **Uso**: Acceso directo a propiedades de objetos JSON (ej: `rule.eligibility.minTierId`)

### 1.4 Casos Edge Identificados

1. **`limits` puede ser NULL**: Necesitamos manejar valores NULL en migración
2. **`eligibility` tiene arrays**: `membershipStatus`, `flags`, `categoryIds`, `skus`, `dayOfWeek` requieren tablas relacionadas
3. **`pointsFormula` tiene tipos complejos**:
   - `table`: Array de entradas
   - `hybrid`: Referencias a otras fórmulas y condiciones
4. **`conflict.priorityRank`**: Ya se usa para ordenamiento, necesita columna directa

---

## 2. Tabla `loyalty_programs` (PRIORIDAD ALTA)

### 2.1 Campos JSON Identificados

| Campo JSON | Tipo | Nullable | Uso Actual | Prioridad |
|------------|------|----------|------------|-----------|
| `earningDomains` | JSON Array | NO | Array de `{ domain: string }` | ALTA |
| `stacking` | JSON | NO | Política de stacking de programas | ALTA |
| `limits` | JSON | SÍ | Límites de puntos por período | ALTA |
| `expirationPolicy` | JSON | NO | Política de expiración de puntos | ALTA |

### 2.2 Consultas que Usan JSON

#### JSON_CONTAINS (1 ocurrencia)
**Archivo**: `libs/infrastructure/src/persistence/repositories/loyalty-program.repository.ts`

```typescript
// Línea: 103
.andWhere('JSON_CONTAINS(program.earningDomains, :domain)', {
  domain: JSON.stringify({ domain: earningDomain }),
})
```

**Uso**: Buscar programas que contengan un `earningDomain` específico.

**Impacto**:
- ⚠️ Necesitamos tabla relacionada `loyalty_program_earning_domains` para reemplazar JSON_CONTAINS

### 2.3 Acceso a Campos JSON en Código

#### Mappers
- **Archivo**: `libs/infrastructure/src/persistence/mappers/loyalty-program.mapper.ts`
- **Líneas**: 13-15, 54-56
- **Uso**: Conversión de array JSON a array tipado

#### Entidades de Persistencia
- **Archivo**: `libs/infrastructure/src/persistence/entities/loyalty-program.entity.ts`
- **Líneas**: 44-73
- **Uso**: Definición de tipos TypeScript para campos JSON

### 2.4 Casos Edge Identificados

1. **`earningDomains` es array**: Requiere tabla relacionada `loyalty_program_earning_domains`
2. **`limits` puede ser NULL**: Necesitamos manejar valores NULL en migración
3. **`stacking` tiene campos opcionales**: Algunos campos pueden ser undefined

---

## 3. Otras Tablas (PRIORIDAD MEDIA/BAJA)

### 3.1 Tabla `users`

**Campos JSON**:
- `profile` (JSON)
- `roles` (JSON) - **Usa JSON_CONTAINS** (4 ocurrencias en `user.repository.ts`)

**Nota**: Esta tabla será migrada en Fase 4.

### 3.2 Otras Tablas Identificadas

- `tier_benefits`: Varios campos JSON
- `customer_tiers`: `metadata` (JSON)
- `tenant_analytics`: `topRewards`, `topCustomers`, `recentTransactions` (JSON)
- `points_transactions`: `metadata` (JSON)
- `enrollments`: `metadata` (JSON)

**Nota**: Estas tablas serán migradas en Fase 4 según prioridad de negocio.

---

## 4. Dependencias Identificadas

### 4.1 Repositorios que Usan JSON

1. **RewardRuleRepository**:
   - 5 consultas con `JSON_EXTRACT` para ordenamiento
   - Métodos afectados: `findActiveByProgramId`, `findActiveByProgramIdAndTrigger`, `findActiveByProgramIdAndEarningDomain`, `findActiveByProgramIdAndConflictGroup`, `findActiveByProgramIdTriggerAndEarningDomain`

2. **LoyaltyProgramRepository**:
   - 1 consulta con `JSON_CONTAINS` para búsqueda
   - Método afectado: `findByTenantIdAndEarningDomain`

### 4.2 Mappers que Acceden a JSON

1. **RewardRuleMapper**: Acceso directo a todos los campos JSON
2. **LoyaltyProgramMapper**: Acceso directo a `earningDomains`, `stacking`, `limits`, `expirationPolicy`

### 4.3 Servicios que Usan JSON

1. **RewardRuleEvaluator**: Accede a `rule.eligibility`, `rule.pointsFormula`, `rule.limits`, `rule.conflict`
2. **Handlers de Application Layer**: Acceden a objetos del dominio que contienen datos originalmente JSON

---

## 5. Plan de Migración por Campo

### 5.1 `reward_rules.scope` → Columnas Directas

**Estrategia**: Migrar a columnas directas en `reward_rules`
- `scope_tenant_id` (INT NOT NULL)
- `scope_program_id` (INT NOT NULL)
- `scope_store_id` (INT NULL)
- `scope_branch_id` (INT NULL)
- `scope_channel` (VARCHAR(50) NULL)
- `scope_category_id` (INT NULL)
- `scope_sku` (VARCHAR(255) NULL)

**Riesgo**: Bajo - Estructura simple

### 5.2 `reward_rules.eligibility` → Tabla Relacionada

**Estrategia**: Crear tabla `reward_rule_eligibility` + tablas para arrays
- Tabla principal: `reward_rule_eligibility`
- Tablas relacionadas: `reward_rule_eligibility_membership_status`, `reward_rule_eligibility_flags`, `reward_rule_eligibility_category_ids`, `reward_rule_eligibility_skus`

**Riesgo**: Medio - Estructura compleja con múltiples tablas

### 5.3 `reward_rules.pointsFormula` → Tabla Relacionada

**Estrategia**: Crear tabla `reward_rule_points_formulas` + tablas relacionadas
- Tabla principal: `reward_rule_points_formulas`
- Tablas relacionadas: `reward_rule_points_table_entries`, `reward_rule_points_formula_bonuses`

**Riesgo**: Alto - Estructura muy compleja con referencias circulares

### 5.4 `reward_rules.conflict` → Columnas Directas

**Estrategia**: Migrar a columnas directas (ya existe `conflictGroup`)
- `conflict_stack_policy` (VARCHAR(20) NOT NULL DEFAULT 'EXCLUSIVE')
- `conflict_priority_rank` (INT NOT NULL DEFAULT 0) ← **Reemplaza JSON_EXTRACT**
- `conflict_max_awards_per_event` (INT NULL)

**Riesgo**: Bajo - Estructura simple, ya existe `conflictGroup`

### 5.5 `reward_rules.idempotencyScope` → Columnas Directas

**Estrategia**: Migrar a columnas directas
- `idempotency_strategy` (VARCHAR(20) NOT NULL DEFAULT 'default')
- `idempotency_bucket_timezone` (VARCHAR(50) NULL)
- `idempotency_period_days` (INT NULL)

**Riesgo**: Bajo - Estructura simple

### 5.6 `reward_rules.limits` → Columnas Directas

**Estrategia**: Migrar a columnas directas (nullable)
- `limit_frequency` (VARCHAR(20) NULL)
- `limit_cooldown_hours` (INT NULL)
- `limit_per_event_cap` (INT NULL)
- `limit_per_period_cap` (INT NULL)
- `limit_period_type` (VARCHAR(20) NULL)
- `limit_period_days` (INT NULL)

**Riesgo**: Bajo - Estructura simple, puede ser NULL

### 5.7 `loyalty_programs.earningDomains` → Tabla Relacionada

**Estrategia**: Crear tabla `loyalty_program_earning_domains`
- Tabla: `loyalty_program_earning_domains` con `program_id` y `domain`
- Reemplaza `JSON_CONTAINS` con JOIN

**Riesgo**: Bajo - Estructura simple

### 5.8 `loyalty_programs.stacking` → Columnas Directas

**Estrategia**: Migrar a columnas directas
- `stacking_allowed` (BOOLEAN NOT NULL DEFAULT FALSE)
- `stacking_max_programs_per_event` (INT NULL)
- `stacking_max_programs_per_period` (INT NULL)
- `stacking_period` (ENUM('daily', 'weekly', 'monthly') NULL)
- `stacking_selection_strategy` (ENUM('BEST_VALUE', 'PRIORITY_RANK', 'FIRST_MATCH') NULL)

**Riesgo**: Bajo - Estructura simple

### 5.9 `loyalty_programs.limits` → Columnas Directas

**Estrategia**: Migrar a columnas directas (nullable)
- `limit_max_points_per_event` (INT NULL)
- `limit_max_points_per_day` (INT NULL)
- `limit_max_points_per_month` (INT NULL)
- `limit_max_points_per_year` (INT NULL)

**Riesgo**: Bajo - Estructura simple, puede ser NULL

### 5.10 `loyalty_programs.expirationPolicy` → Columnas Directas

**Estrategia**: Migrar a columnas directas
- `expiration_enabled` (BOOLEAN NOT NULL DEFAULT FALSE)
- `expiration_type` (ENUM('simple', 'bucketed') NULL)
- `expiration_days_to_expire` (INT NULL)
- `expiration_grace_period_days` (INT NULL)

**Riesgo**: Bajo - Estructura simple

---

## 6. Scripts de Backup Necesarios

### 6.1 Backup de Datos JSON

```sql
-- Crear tabla de backup para reward_rules
CREATE TABLE reward_rules_json_backup AS
SELECT
  id,
  scope,
  eligibility,
  pointsFormula,
  limits,
  conflict,
  idempotencyScope,
  NOW() as backup_date
FROM reward_rules;

-- Crear tabla de backup para loyalty_programs
CREATE TABLE loyalty_programs_json_backup AS
SELECT
  id,
  earningDomains,
  stacking,
  limits,
  expirationPolicy,
  NOW() as backup_date
FROM loyalty_programs;
```

### 6.2 Validación de Integridad

```sql
-- Contar registros antes y después de migración
SELECT COUNT(*) as total_reward_rules FROM reward_rules;
SELECT COUNT(*) as total_loyalty_programs FROM loyalty_programs;

-- Verificar que no hay datos NULL en campos requeridos
SELECT COUNT(*) as null_scope FROM reward_rules WHERE scope IS NULL;
SELECT COUNT(*) as null_eligibility FROM reward_rules WHERE eligibility IS NULL;
SELECT COUNT(*) as null_conflict FROM reward_rules WHERE conflict IS NULL;
```

---

## 7. Próximos Pasos

1. ✅ **Completado**: Auditoría de campos JSON
2. ⬜ **Pendiente**: Crear scripts de backup
3. ⬜ **Pendiente**: Crear migración para nuevas columnas y tablas
4. ⬜ **Pendiente**: Crear script de migración de datos
5. ⬜ **Pendiente**: Actualizar entidades, mappers y repositorios

---

**Última actualización**: 2026-01-29
