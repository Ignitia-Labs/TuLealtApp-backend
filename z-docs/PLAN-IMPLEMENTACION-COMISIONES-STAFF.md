# 📋 Plan de Implementación - Sistema de Comisiones para Staff

## 🎯 Resumen Ejecutivo

Este documento detalla el plan de implementación para el sistema de comisiones de usuarios tipo STAFF asignados a partners. El sistema permitirá:

1. **Asignar usuarios STAFF a partners** con porcentajes de comisión configurables
2. **Calcular comisiones automáticamente** cuando se procesa un pago de suscripción
3. **Registrar y rastrear comisiones** acumuladas y pendientes por vendedor
4. **Consultar desembolsos** por suscripción pagada y por vendedor

**Prioridades:**
- 🔴 **ALTA**: Asignación de staff a partners y cálculo automático de comisiones (Tareas 1-2)
- 🟡 **MEDIA**: Endpoints de consulta y reportes (Tareas 3-4)
- 🟢 **BAJA**: Optimizaciones y webhooks (Tarea 5)

---

## 📐 Arquitectura y Estructura

### Estructura de Directorios Propuesta

```
libs/application/src/
├── partner-staff-assignments/          # Tarea 1
│   ├── create-partner-staff-assignment/
│   │   ├── create-partner-staff-assignment.handler.ts
│   │   ├── create-partner-staff-assignment.request.ts
│   │   └── create-partner-staff-assignment.response.ts
│   ├── update-partner-staff-assignment/
│   │   ├── update-partner-staff-assignment.handler.ts
│   │   ├── update-partner-staff-assignment.request.ts
│   │   └── update-partner-staff-assignment.response.ts
│   ├── delete-partner-staff-assignment/
│   │   ├── delete-partner-staff-assignment.handler.ts
│   │   └── delete-partner-staff-assignment.request.ts
│   ├── get-partner-staff-assignments/
│   │   ├── get-partner-staff-assignments.handler.ts
│   │   ├── get-partner-staff-assignments.request.ts
│   │   └── get-partner-staff-assignments.response.ts
│   └── partner-staff-assignment.service.ts
├── commissions/                        # Tarea 2
│   ├── calculate-commission/
│   │   └── commission-calculation.service.ts
│   ├── get-commissions/
│   │   ├── get-commissions.handler.ts
│   │   ├── get-commissions.request.ts
│   │   └── get-commissions.response.ts
│   ├── get-commission-summary/
│   │   ├── get-commission-summary.handler.ts
│   │   ├── get-commission-summary.request.ts
│   │   └── get-commission-summary.response.ts
│   └── get-payment-commissions/
│       ├── get-payment-commissions.handler.ts
│       ├── get-payment-commissions.request.ts
│       └── get-payment-commissions.response.ts

libs/domain/src/
├── entities/
│   ├── partner-staff-assignment.entity.ts
│   └── commission.entity.ts
└── repositories/
    ├── partner-staff-assignment.repository.interface.ts
    └── commission.repository.interface.ts

libs/infrastructure/src/persistence/
├── entities/
│   ├── partner-staff-assignment.entity.ts
│   └── commission.entity.ts
├── repositories/
│   ├── partner-staff-assignment.repository.ts
│   └── commission.repository.ts
└── mappers/
    ├── partner-staff-assignment.mapper.ts
    └── commission.mapper.ts

apps/admin-api/src/controllers/
├── partner-staff-assignments.controller.ts
└── commissions.controller.ts
```

---

## 🔴 FASE 1: Asignación y Cálculo de Comisiones (Prioridad Alta)

### Tarea 1: CRUD de Asignaciones Staff-Partner

#### 1.1. Crear Entidad de Dominio

**Archivo:** `libs/domain/src/entities/partner-staff-assignment.entity.ts`

```typescript
export class PartnerStaffAssignment {
  constructor(
    public readonly id: number,
    public readonly partnerId: number,
    public readonly staffUserId: number,
    public readonly commissionPercent: number, // 0-100
    public readonly isActive: boolean,
    public readonly startDate: Date,
    public readonly endDate: Date | null, // null = sin fecha de fin
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    partnerId: number,
    staffUserId: number,
    commissionPercent: number,
    startDate: Date,
    endDate: Date | null = null,
    notes: string | null = null,
    isActive: boolean = true,
    id?: number,
  ): PartnerStaffAssignment

  // Validar que el porcentaje esté entre 0-100
  // Validar que startDate < endDate si endDate no es null
  // Validar que no haya solapamiento con otras asignaciones activas del mismo staff
}
```

**Reglas de Negocio:**
- Un partner puede tener múltiples usuarios STAFF asignados
- Un usuario STAFF puede estar asignado a múltiples partners
- El porcentaje de comisión debe estar entre 0-100
- La suma de porcentajes de comisión para un partner no debe exceder 100%
- Solo puede haber una asignación activa por staff-partner a la vez
- Las asignaciones pueden tener fecha de inicio y fin

#### 1.2. Crear Entidad de Persistencia

**Archivo:** `libs/infrastructure/src/persistence/entities/partner-staff-assignment.entity.ts`

```typescript
@Entity('partner_staff_assignments')
@Index(['partnerId'])
@Index(['staffUserId'])
@Index(['isActive'])
export class PartnerStaffAssignmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  partnerId: number;

  @Column('int')
  staffUserId: number;

  @Column('decimal', { precision: 5, scale: 2 })
  commissionPercent: number; // 0.00 - 100.00

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('datetime')
  startDate: Date;

  @Column('datetime', { nullable: true })
  endDate: Date | null;

  @Column('text', { nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => PartnerEntity)
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'staffUserId' })
  staffUser: UserEntity;
}
```

#### 1.3. Crear Repositorio

**Interfaz:** `libs/domain/src/repositories/partner-staff-assignment.repository.interface.ts`

```typescript
export interface IPartnerStaffAssignmentRepository {
  findById(id: number): Promise<PartnerStaffAssignment | null>;
  findByPartnerId(partnerId: number, activeOnly?: boolean): Promise<PartnerStaffAssignment[]>;
  findByStaffUserId(staffUserId: number, activeOnly?: boolean): Promise<PartnerStaffAssignment[]>;
  findByPartnerAndStaff(partnerId: number, staffUserId: number): Promise<PartnerStaffAssignment | null>;
  findAll(activeOnly?: boolean): Promise<PartnerStaffAssignment[]>;
  save(assignment: PartnerStaffAssignment): Promise<PartnerStaffAssignment>;
  update(assignment: PartnerStaffAssignment): Promise<PartnerStaffAssignment>;
  delete(id: number): Promise<void>;

  // Validar suma de porcentajes para un partner
  getTotalCommissionPercent(partnerId: number, excludeId?: number): Promise<number>;

  // Buscar asignaciones activas en una fecha específica
  findActiveAssignmentsByDate(partnerId: number, date: Date): Promise<PartnerStaffAssignment[]>;
}
```

**Implementación:** `libs/infrastructure/src/persistence/repositories/partner-staff-assignment.repository.ts`

#### 1.4. Crear Handlers CRUD

**Handlers a crear:**
1. `CreatePartnerStaffAssignmentHandler`
   - Validar que el usuario sea STAFF
   - Validar que el partner exista
   - Validar que la suma de porcentajes no exceda 100%
   - Validar que no haya solapamiento de fechas
   - Crear asignación

2. `UpdatePartnerStaffAssignmentHandler`
   - Validar existencia
   - Validar reglas de negocio al actualizar porcentaje
   - Actualizar asignación

3. `DeletePartnerStaffAssignmentHandler`
   - Validar existencia
   - Soft delete o hard delete según política

4. `GetPartnerStaffAssignmentsHandler`
   - Listar asignaciones con filtros (partnerId, staffUserId, activeOnly)
   - Incluir información del partner y staff user

#### 1.5. Crear Servicio de Validación

**Archivo:** `libs/application/src/partner-staff-assignments/partner-staff-assignment.service.ts`

```typescript
class PartnerStaffAssignmentService {
  // Validar suma de porcentajes
  async validateTotalCommissionPercent(
    repository: IPartnerStaffAssignmentRepository,
    partnerId: number,
    newPercent: number,
    excludeId?: number
  ): Promise<void>

  // Validar solapamiento de fechas
  validateDateOverlap(
    startDate1: Date,
    endDate1: Date | null,
    startDate2: Date,
    endDate2: Date | null
  ): boolean

  // Obtener asignaciones activas para un partner en una fecha
  async getActiveAssignmentsForDate(
    repository: IPartnerStaffAssignmentRepository,
    partnerId: number,
    date: Date
  ): Promise<PartnerStaffAssignment[]>
}
```

#### 1.6. Crear Controlador

**Archivo:** `apps/admin-api/src/controllers/partner-staff-assignments.controller.ts`

**Endpoints:**
- `POST /admin/partners/:partnerId/staff-assignments` - Crear asignación
- `GET /admin/partners/:partnerId/staff-assignments` - Listar asignaciones de un partner
- `GET /admin/staff/:staffUserId/assignments` - Listar asignaciones de un staff
- `GET /admin/partner-staff-assignments` - Listar todas las asignaciones
- `PATCH /admin/partner-staff-assignments/:id` - Actualizar asignación
- `DELETE /admin/partner-staff-assignments/:id` - Eliminar asignación

---

### Tarea 2: Cálculo Automático de Comisiones

#### 2.1. Crear Entidad de Dominio de Comisión

**Archivo:** `libs/domain/src/entities/commission.entity.ts`

```typescript
export type CommissionStatus = 'pending' | 'paid' | 'cancelled';

export class Commission {
  constructor(
    public readonly id: number,
    public readonly partnerId: number,
    public readonly staffUserId: number,
    public readonly paymentId: number,
    public readonly subscriptionId: number,
    public readonly assignmentId: number, // ID de la asignación que generó esta comisión
    public readonly paymentAmount: number, // Monto total del pago
    public readonly commissionPercent: number, // Porcentaje aplicado
    public readonly commissionAmount: number, // Monto calculado de comisión
    public readonly currency: string,
    public readonly paymentDate: Date,
    public readonly status: CommissionStatus,
    public readonly paidDate: Date | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    partnerId: number,
    staffUserId: number,
    paymentId: number,
    subscriptionId: number,
    assignmentId: number,
    paymentAmount: number,
    commissionPercent: number,
    currency: string,
    paymentDate: Date,
    notes: string | null = null,
    id?: number,
  ): Commission

  markAsPaid(paidDate: Date = new Date()): Commission
  cancel(notes: string | null = null): Commission
}
```

#### 2.2. Crear Entidad de Persistencia

**Archivo:** `libs/infrastructure/src/persistence/entities/commission.entity.ts`

```typescript
@Entity('commissions')
@Index(['partnerId'])
@Index(['staffUserId'])
@Index(['paymentId'])
@Index(['status'])
export class CommissionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  partnerId: number;

  @Column('int')
  staffUserId: number;

  @Column('int')
  paymentId: number;

  @Column('int')
  subscriptionId: number;

  @Column('int')
  assignmentId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  paymentAmount: number;

  @Column('decimal', { precision: 5, scale: 2 })
  commissionPercent: number;

  @Column('decimal', { precision: 10, scale: 2 })
  commissionAmount: number;

  @Column('varchar', { length: 10 })
  currency: string;

  @Column('datetime')
  paymentDate: Date;

  @Column('varchar', { length: 20, default: 'pending' })
  status: 'pending' | 'paid' | 'cancelled';

  @Column('datetime', { nullable: true })
  paidDate: Date | null;

  @Column('text', { nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => PartnerEntity)
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'staffUserId' })
  staffUser: UserEntity;

  @ManyToOne(() => PaymentEntity)
  @JoinColumn({ name: 'paymentId' })
  payment: PaymentEntity;
}
```

#### 2.3. Crear Repositorio

**Interfaz:** `libs/domain/src/repositories/commission.repository.interface.ts`

```typescript
export interface ICommissionRepository {
  findById(id: number): Promise<Commission | null>;
  findByPaymentId(paymentId: number): Promise<Commission[]>;
  findByStaffUserId(staffUserId: number, filters?: CommissionFilters): Promise<Commission[]>;
  findByPartnerId(partnerId: number, filters?: CommissionFilters): Promise<Commission[]>;
  save(commission: Commission): Promise<Commission>;
  saveMany(commissions: Commission[]): Promise<Commission[]>;
  update(commission: Commission): Promise<Commission>;
  delete(id: number): Promise<void>;

  // Métricas agregadas
  getTotalCommissionsByStaff(
    staffUserId: number,
    startDate?: Date,
    endDate?: Date,
    status?: CommissionStatus
  ): Promise<number>;

  getTotalCommissionsByPartner(
    partnerId: number,
    startDate?: Date,
    endDate?: Date,
    status?: CommissionStatus
  ): Promise<number>;
}

interface CommissionFilters {
  status?: CommissionStatus;
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  take?: number;
}
```

#### 2.4. Crear Servicio de Cálculo de Comisiones

**Archivo:** `libs/application/src/commissions/calculate-commission/commission-calculation.service.ts`

```typescript
class CommissionCalculationService {
  constructor(
    private readonly assignmentRepository: IPartnerStaffAssignmentRepository,
    private readonly commissionRepository: ICommissionRepository,
  ) {}

  /**
   * Calcular y crear comisiones para un pago
   * Se ejecuta automáticamente cuando un pago es marcado como 'paid'
   */
  async calculateCommissionsForPayment(
    payment: Payment,
    partnerId: number,
    subscriptionId: number
  ): Promise<Commission[]> {
    // 1. Obtener asignaciones activas del partner en la fecha del pago
    const assignments = await this.assignmentRepository.findActiveAssignmentsByDate(
      partnerId,
      payment.paymentDate
    );

    if (assignments.length === 0) {
      // No hay asignaciones, no se generan comisiones
      return [];
    }

    // 2. Calcular comisión para cada asignación
    const commissions: Commission[] = [];

    for (const assignment of assignments) {
      const commissionAmount = this.calculateCommissionAmount(
        payment.amount,
        assignment.commissionPercent
      );

      const commission = Commission.create(
        partnerId,
        assignment.staffUserId,
        payment.id,
        subscriptionId,
        assignment.id,
        payment.amount,
        assignment.commissionPercent,
        payment.currency,
        payment.paymentDate
      );

      commissions.push(commission);
    }

    // 3. Guardar todas las comisiones
    return await this.commissionRepository.saveMany(commissions);
  }

  private calculateCommissionAmount(
    paymentAmount: number,
    commissionPercent: number
  ): number {
    return (paymentAmount * commissionPercent) / 100;
  }
}
```

#### 2.5. Integrar con Handler de Pagos

**Modificar:** `libs/application/src/payments/create-payment/create-payment.handler.ts`

Agregar después de marcar el pago como procesado:

```typescript
// Si el pago es exitoso, calcular comisiones
if (savedPayment.status === 'paid') {
  try {
    await this.commissionCalculationService.calculateCommissionsForPayment(
      savedPayment,
      partner.id,
      subscription.id
    );
  } catch (error) {
    // Log error pero no fallar el proceso de pago
    this.logger.error('Error calculating commissions:', error);
  }
}
```

**Modificar:** `apps/admin-api/src/controllers/payment-webhooks.controller.ts`

Agregar cálculo de comisiones después de crear el pago exitoso.

---

## 🟡 FASE 2: Endpoints de Consulta y Reportes (Prioridad Media)

### Tarea 3: Endpoints de Consulta de Comisiones

#### 3.1. Endpoint: Comisiones por Pago

**Endpoint:** `GET /admin/payments/:paymentId/commissions`

**Handler:** `get-payment-commissions.handler.ts`

**Response:**
```typescript
{
  paymentId: number;
  paymentAmount: number;
  currency: string;
  paymentDate: Date;
  commissions: [
    {
      id: number;
      staffUserId: number;
      staffUserName: string;
      staffUserEmail: string;
      commissionPercent: number;
      commissionAmount: number;
      status: 'pending' | 'paid' | 'cancelled';
      paidDate: Date | null;
    }
  ];
  totalCommissions: number;
}
```

#### 3.2. Endpoint: Comisiones por Staff

**Endpoint:** `GET /admin/staff/:staffUserId/commissions`

**Query Params:**
- `status?: 'pending' | 'paid' | 'cancelled'`
- `startDate?: string` (ISO 8601)
- `endDate?: string` (ISO 8601)
- `page?: number`
- `limit?: number`

**Response:**
```typescript
{
  staffUserId: number;
  staffUserName: string;
  commissions: CommissionDto[];
  summary: {
    totalPending: number;
    totalPaid: number;
    totalCancelled: number;
    totalAmount: number;
    currency: string;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

#### 3.3. Endpoint: Resumen de Comisiones por Staff

**Endpoint:** `GET /admin/staff/:staffUserId/commissions/summary`

**Query Params:**
- `startDate?: string`
- `endDate?: string`

**Response:**
```typescript
{
  staffUserId: number;
  staffUserName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalCommissions: number;
    pendingCommissions: number;
    paidCommissions: number;
    cancelledCommissions: number;
    totalAmount: number;
    pendingAmount: number;
    paidAmount: number;
    currency: string;
  };
  byPartner: [
    {
      partnerId: number;
      partnerName: string;
      totalCommissions: number;
      totalAmount: number;
    }
  ];
}
```

#### 3.4. Endpoint: Comisiones por Partner

**Endpoint:** `GET /admin/partners/:partnerId/commissions`

Similar estructura a comisiones por staff.

---

### Tarea 4: Endpoint de Desembolsos

#### 4.1. Endpoint: Desembolsos Pendientes

**Endpoint:** `GET /admin/commissions/pending-disbursements`

**Query Params:**
- `staffUserId?: number` - Filtrar por staff
- `partnerId?: number` - Filtrar por partner
- `minAmount?: number` - Monto mínimo
- `page?: number`
- `limit?: number`

**Response:**
```typescript
{
  disbursements: [
    {
      staffUserId: number;
      staffUserName: string;
      staffUserEmail: string;
      totalPendingAmount: number;
      currency: string;
      pendingCommissions: number; // Cantidad de comisiones pendientes
      partners: [
        {
          partnerId: number;
          partnerName: string;
          amount: number;
        }
      ];
    }
  ];
  summary: {
    totalStaff: number;
    totalPendingAmount: number;
    currency: string;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

#### 4.2. Endpoint: Marcar Comisiones como Pagadas

**Endpoint:** `POST /admin/commissions/mark-as-paid`

**Request:**
```typescript
{
  commissionIds: number[]; // IDs de comisiones a marcar como pagadas
  paidDate?: string; // ISO 8601, default: ahora
  notes?: string;
}
```

**Response:**
```typescript
{
  updated: number; // Cantidad de comisiones actualizadas
  commissions: CommissionDto[];
}
```

---

## 🟢 FASE 3: Optimizaciones (Prioridad Baja)

### Tarea 5: Optimizaciones y Mejoras

#### 5.1. Índices de Base de Datos

Agregar índices compuestos:
- `(partnerId, paymentDate)` en `commissions`
- `(staffUserId, status, paymentDate)` en `commissions`
- `(partnerId, isActive, startDate, endDate)` en `partner_staff_assignments`

#### 5.2. Validaciones Adicionales

- Validar que el usuario STAFF exista y esté activo al crear asignación
- Validar que el partner esté activo al crear asignación
- Validar que no se puedan crear comisiones duplicadas para el mismo pago
- Validar que las comisiones solo se calculen para pagos con status 'paid'

#### 5.3. Eventos y Notificaciones (Opcional)

- Emitir evento cuando se calcula una comisión
- Notificar al staff cuando se genera una nueva comisión
- Notificar cuando se marca una comisión como pagada

---

## 📊 Base de Datos

### Nueva Tabla: `partner_staff_assignments`

```sql
CREATE TABLE `partner_staff_assignments` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `partnerId` INT NOT NULL,
  `staffUserId` INT NOT NULL,
  `commissionPercent` DECIMAL(5,2) NOT NULL CHECK (`commissionPercent` >= 0 AND `commissionPercent` <= 100),
  `isActive` BOOLEAN DEFAULT TRUE,
  `startDate` DATETIME NOT NULL,
  `endDate` DATETIME NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_partner` (`partnerId`),
  INDEX `idx_staff` (`staffUserId`),
  INDEX `idx_active` (`isActive`),
  INDEX `idx_dates` (`startDate`, `endDate`),
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`staffUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_active_assignment` (`partnerId`, `staffUserId`, `isActive`) WHERE `isActive` = TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Nueva Tabla: `commissions`

```sql
CREATE TABLE `commissions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `partnerId` INT NOT NULL,
  `staffUserId` INT NOT NULL,
  `paymentId` INT NOT NULL,
  `subscriptionId` INT NOT NULL,
  `assignmentId` INT NOT NULL,
  `paymentAmount` DECIMAL(10,2) NOT NULL,
  `commissionPercent` DECIMAL(5,2) NOT NULL,
  `commissionAmount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `paymentDate` DATETIME NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (`status` IN ('pending', 'paid', 'cancelled')),
  `paidDate` DATETIME NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_partner` (`partnerId`),
  INDEX `idx_staff` (`staffUserId`),
  INDEX `idx_payment` (`paymentId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_payment_date` (`paymentDate`),
  INDEX `idx_partner_payment` (`partnerId`, `paymentDate`),
  INDEX `idx_staff_status_date` (`staffUserId`, `status`, `paymentDate`),
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`staffUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assignmentId`) REFERENCES `partner_staff_assignments`(`id`) ON DELETE RESTRICT,
  UNIQUE KEY `unique_payment_staff` (`paymentId`, `staffUserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔧 Consideraciones Técnicas

### Reglas de Negocio

1. **Asignaciones:**
   - Un partner puede tener múltiples staff asignados
   - Un staff puede estar asignado a múltiples partners
   - La suma de porcentajes de comisión para un partner no debe exceder 100%
   - Solo una asignación activa por staff-partner a la vez
   - Las asignaciones pueden tener fecha de inicio y fin

2. **Cálculo de Comisiones:**
   - Las comisiones se calculan automáticamente cuando un pago es marcado como 'paid'
   - Se calculan comisiones para todas las asignaciones activas en la fecha del pago
   - El monto de comisión = (monto del pago * porcentaje de comisión) / 100
   - Las comisiones se crean con status 'pending' por defecto

3. **Estados de Comisión:**
   - `pending`: Comisión calculada pero no pagada
   - `paid`: Comisión pagada al staff
   - `cancelled`: Comisión cancelada (no se pagará)

### Validaciones

**Asignaciones:**
- `commissionPercent` debe estar entre 0 y 100
- `startDate` debe ser menor que `endDate` si `endDate` no es null
- El usuario debe tener rol STAFF o ADMIN
- El usuario debe estar activo
- El partner debe existir y estar activo

**Comisiones:**
- No se pueden crear comisiones duplicadas para el mismo pago-staff
- Solo se calculan comisiones para pagos con status 'paid'
- El `commissionAmount` debe ser >= 0

### Manejo de Errores

**Códigos HTTP:**
- `200 OK` - Operación exitosa
- `400 Bad Request` - Datos inválidos (porcentaje excedido, fechas inválidas, etc.)
- `404 Not Found` - Recurso no encontrado
- `409 Conflict` - Conflicto (asignación duplicada, comisión duplicada)
- `500 Internal Server Error` - Error del servidor

---

## 🚀 Orden de Implementación Recomendado

### Sprint 1 (Crítico)
1. ✅ Tarea 1: CRUD de asignaciones staff-partner
   - Entidades de dominio y persistencia
   - Repositorios
   - Handlers CRUD
   - Servicio de validación
   - Controlador

### Sprint 2 (Crítico)
2. ✅ Tarea 2: Cálculo automático de comisiones
   - Entidades de dominio y persistencia de comisiones
   - Repositorio de comisiones
   - Servicio de cálculo
   - Integración con handler de pagos

### Sprint 3 (Importante)
3. ✅ Tarea 3: Endpoints de consulta
   - Comisiones por pago
   - Comisiones por staff
   - Resumen de comisiones
   - Comisiones por partner

4. ✅ Tarea 4: Endpoint de desembolsos
   - Desembolsos pendientes
   - Marcar comisiones como pagadas

### Sprint 4 (Opcional)
5. ✅ Tarea 5: Optimizaciones
   - Índices adicionales
   - Validaciones mejoradas
   - Eventos y notificaciones (opcional)

---

## 🧪 Testing

### Tests Unitarios

**Servicios:**
- `PartnerStaffAssignmentService` - Validaciones de porcentajes y fechas
- `CommissionCalculationService` - Cálculo de comisiones

**Handlers:**
- Tests de validación de entrada
- Tests de manejo de errores
- Tests de transformación de datos

### Tests de Integración

**Endpoints:**
- Tests de creación de asignaciones
- Tests de cálculo automático de comisiones
- Tests de consulta de comisiones
- Tests de actualización de estado de comisiones

**Escenarios:**
- Múltiples staff asignados a un partner
- Cálculo de comisiones con diferentes porcentajes
- Validación de suma de porcentajes
- Validación de solapamiento de fechas

---

## 📝 Notas Adicionales

### Performance

1. **Caché:** Considerar cachear asignaciones activas por partner
2. **Índices:** Verificar que existan índices en campos de búsqueda frecuente
3. **Paginación:** Implementar en todos los endpoints de listado
4. **Límites:** Máximo 1000 registros por página

### Mantenibilidad

1. **Servicios reutilizables:** Crear servicios que puedan ser reutilizados
2. **Validaciones:** Centralizar validaciones en servicios
3. **Documentación:** Documentar todos los endpoints con Swagger
4. **Logging:** Agregar logs importantes para auditoría

### Seguridad

1. **Autorización:** Solo usuarios ADMIN pueden gestionar asignaciones
2. **Validación:** Validar que los usuarios sean STAFF antes de asignar
3. **Auditoría:** Registrar quién crea/modifica asignaciones y comisiones

---

## ✅ Checklist de Implementación

### Fase 1: Asignación y Cálculo
- [ ] Tarea 1: CRUD de Asignaciones
  - [ ] Entidades de dominio y persistencia
  - [ ] Repositorios
  - [ ] Handlers CRUD
  - [ ] Servicio de validación
  - [ ] Controlador
  - [ ] Tests
- [ ] Tarea 2: Cálculo Automático de Comisiones
  - [ ] Entidades de dominio y persistencia
  - [ ] Repositorio de comisiones
  - [ ] Servicio de cálculo
  - [ ] Integración con handler de pagos
  - [ ] Tests

### Fase 2: Consulta y Reportes
- [ ] Tarea 3: Endpoints de Consulta
  - [ ] Comisiones por pago
  - [ ] Comisiones por staff
  - [ ] Resumen de comisiones
  - [ ] Comisiones por partner
  - [ ] Tests
- [ ] Tarea 4: Endpoint de Desembolsos
  - [ ] Desembolsos pendientes
  - [ ] Marcar comisiones como pagadas
  - [ ] Tests

### Fase 3: Optimizaciones
- [ ] Tarea 5: Optimizaciones
  - [ ] Índices adicionales
  - [ ] Validaciones mejoradas
  - [ ] Eventos y notificaciones (opcional)

---

**Última actualización:** 2024-01-XX
**Autor:** Plan de implementación generado para TuLealtApp Backend

