# 📘 Guía Frontend: Payments y Billing Cycles

## 🎯 Resumen

Esta guía explica cómo usar los endpoints del backend para visualizar payments, billing cycles, invoices y el estado de cuenta de partners en el frontend. Incluye información sobre cómo interpretar los datos y qué campos usar para cada vista.

---

## 🔑 Conceptos Clave

### **Payments Originales vs Derivados**

- **Payment Original**: Es el pago real que realizó el partner (ej: $165.00 GTQ)
  - Tiene `originalPaymentId: null` y `isDerived: false`
  - Puede tener `billingCycleId: null` si aún no se ha aplicado
  - Incluye campos `appliedAmount`, `remainingAmount`, `isFullyApplied` y `summary` para ver cómo se aplicó

- **Payment Derivado**: Es un registro creado automáticamente cuando el sistema aplica parte de un payment original a un billing cycle o invoice
  - Tiene `originalPaymentId` apuntando al payment original
  - Tiene `isDerived: true`
  - Siempre tiene `billingCycleId` o `invoiceId` asignado
  - **Hereda `transactionId` y `reference` del payment original** para mantener consistencia

**Ejemplo:**
```
Payment Original (ID: 2)
├── Amount: $165.00
├── transactionId: 1001 (número autoincrementable)
├── reference: "TAC1231231231"
├── billingCycleId: null
├── originalPaymentId: null
├── isDerived: false
├── appliedAmount: 164.92 ✅ (calculado automáticamente)
├── remainingAmount: 0.08 ✅ (calculado automáticamente)
├── isFullyApplied: false ✅
└── summary: { ... } ✅ (resumen simplificado)

Payment Derivado (ID: 6)
├── Amount: $164.92
├── transactionId: 1001 ✅ (heredado del original)
├── reference: "TAC1231231231" ✅ (heredado del original)
├── billingCycleId: 7 ✅
├── originalPaymentId: 2 ✅
└── isDerived: true ✅
```

### **Campos Importantes**

- **`transactionId`**: Número autoincrementable único para agrupar payments relacionados. Los derivados heredan el mismo `transactionId` del original.
- **`reference`**: Referencia del pago (ej: número de transferencia). Los derivados heredan la misma `reference` del original.
- **`summary`**: Campo simplificado disponible solo en payments originales que agrupa toda la información de aplicación.

---

## 📡 Endpoints Disponibles

### 1. **Listar Payments de una Suscripción**

**Endpoint:** `GET /admin/payments?subscriptionId={id}`

**Query Parameters:**
- `subscriptionId` (requerido): ID de la suscripción
- `includeDerived` (opcional): `true` para incluir derivados, `false` o omitir para solo originales
- `page` (opcional): Número de página
- `limit` (opcional): Elementos por página

**Ejemplo de Request:**
```typescript
// Solo payments originales (recomendado para listado principal)
GET /admin/payments?subscriptionId=2

// Incluir payments derivados (para vista detallada)
GET /admin/payments?subscriptionId=2&includeDerived=true
```

**Ejemplo de Response:**
```json
{
  "payments": [
    {
      "id": 2,
      "subscriptionId": 2,
      "partnerId": 2,
      "amount": 165.00,
      "currency": "GTQ",
      "transactionId": 1001,
      "reference": "TAC1231231231",
      "paymentMethod": "bank_transfer",
      "status": "paid",
      "paymentDate": "2025-12-29T00:00:00.000Z",
      "billingCycleId": null,
      "invoiceId": null,
      "originalPaymentId": null,
      "isDerived": false,
      "appliedAmount": 164.92,
      "remainingAmount": 0.08,
      "isFullyApplied": false,
      "summary": {
        "totalAmount": 165.00,
        "appliedAmount": 164.92,
        "remainingAmount": 0.08,
        "isFullyApplied": false,
        "applicationsCount": 1,
        "appliedTo": [
          {
            "type": "billing_cycle",
            "id": 7,
            "amount": 164.92
          }
        ]
      },
      "applications": [
        {
          "id": 6,
          "amount": 164.92,
          "billingCycleId": 7,
          "invoiceId": null,
          "createdAt": "2025-12-29T23:16:52.000Z"
        }
      ]
    }
  ],
  "total": 1,
  "page": null,
  "limit": null
}
```

**Nota:** Si `includeDerived: true`, también verás los payments derivados en la lista.

---

### 2. **Obtener Payments de un Billing Cycle Específico**

**Endpoint:** `GET /admin/billing-cycles/{id}/payments`

**Ejemplo de Request:**
```typescript
GET /admin/billing-cycles/7/payments
```

**Ejemplo de Response:**
```json
{
  "billingCycleId": 7,
  "cycleNumber": 1,
  "totalAmount": 164.92,
  "paidAmount": 164.92,
  "remainingAmount": 0,
  "currency": "GTQ",
  "payments": [
    {
      "id": 6,
      "amount": 164.92,
      "currency": "GTQ",
      "paymentMethod": "bank_transfer",
      "paymentDate": "2025-12-29T00:00:00.000Z",
      "transactionId": 1001,
      "reference": "TAC1231231231",
      "originalPaymentId": 2,
      "isDerived": true,
      "notes": "Aplicado desde pago 2 (164.92 de 165)",
      "createdAt": "2025-12-29T22:53:44.996Z"
    }
  ],
  "totalPayments": 1
}
```

**Cómo interpretar:**
- `totalAmount`: Monto total que se debe pagar por este ciclo
- `paidAmount`: Suma de todos los payments aplicados a este ciclo
- `remainingAmount`: `totalAmount - paidAmount` (lo que falta por pagar)
- `payments`: Array de payments derivados aplicados a este ciclo (todos tienen `isDerived: true`)

---

### 3. **Obtener Estado de Cuenta del Partner**

**Endpoint:** `GET /admin/partners/{id}/account-balance`

**Ejemplo de Request:**
```typescript
GET /admin/partners/2/account-balance
```

**Ejemplo de Response:**
```json
{
  "partnerId": 2,
  "totalPaid": 165.00,
  "totalPending": 0,
  "creditBalance": 0.08,
  "outstandingBalance": 0,
  "availableCredit": 0.08,
  "currency": "GTQ",
  "lastPaymentDate": "2025-12-29T00:00:00.000Z",
  "lastPaymentAmount": 165.00,
  "pendingInvoices": [],
  "recentPayments": [
    {
      "id": 2,
      "amount": 165.00,
      "paymentDate": "2025-12-29T00:00:00.000Z",
      "status": "paid",
      "originalPaymentId": null,
      "isDerived": false,
      "reference": "TAC1231231231",
      "appliedAmount": 164.92,
      "remainingAmount": 0.08,
      "isFullyApplied": false
    }
  ]
}
```

**Cómo interpretar:**
- `totalPaid`: Suma de todos los payments originales con status "paid" (NO incluye derivados)
- `totalPending`: Suma de todas las facturas pendientes
- `creditBalance`: Crédito disponible en la suscripción
- `outstandingBalance`: `totalPending - creditBalance` (lo que realmente falta pagar después de aplicar créditos)
- `availableCredit`: `creditBalance - totalPending` (crédito que sobra después de pagar pendientes)
- `recentPayments`: Solo payments originales (últimos 10), incluyen información de aplicación

---

### 4. **Obtener Billing Cycles de una Suscripción**

**Endpoint:** `GET /admin/billing-cycles?subscriptionId={id}`

**Ejemplo de Request:**
```typescript
GET /admin/billing-cycles?subscriptionId=2
```

**Ejemplo de Response:**
```json
{
  "billingCycles": [
    {
      "id": 7,
      "subscriptionId": 2,
      "partnerId": 2,
      "cycleNumber": 1,
      "startDate": "2025-12-29T00:00:00.000Z",
      "endDate": "2026-01-28T23:59:59.999Z",
      "durationDays": 30,
      "billingDate": "2025-12-29T00:00:00.000Z",
      "dueDate": "2026-01-05T23:59:59.999Z",
      "totalAmount": 164.92,
      "paidAmount": 164.92,
      "remainingAmount": 0,
      "currency": "GTQ",
      "status": "paid",
      "paymentStatus": "paid",
      "invoiceId": "8",
      "invoiceNumber": "INV-2024-008"
    }
  ],
  "total": 1
}
```

**Cómo interpretar:**
- `totalAmount`: Monto total del ciclo
- `paidAmount`: Suma de todos los payments aplicados
- `remainingAmount`: `totalAmount - paidAmount`
- `status`: Estado del ciclo ('pending', 'paid', 'overdue', 'cancelled')
- `paymentStatus`: Estado del pago ('pending', 'paid', 'failed', 'refunded')
- Si `remainingAmount === 0` → Ciclo completamente pagado
- Si `remainingAmount > 0` y `dueDate < hoy` → Ciclo vencido

---

### 5. **Obtener Invoices de una Suscripción**

**Endpoint:** `GET /admin/invoices?subscriptionId={id}`

**Query Parameters:**
- `subscriptionId` (requerido): ID de la suscripción
- `status` (opcional): Filtrar por estado ('pending', 'paid', 'overdue', 'cancelled')
- `page` (opcional): Número de página
- `limit` (opcional): Elementos por página

**Ejemplo de Request:**
```typescript
GET /admin/invoices?subscriptionId=2&status=pending
```

**Ejemplo de Response:**
```json
{
  "invoices": [
    {
      "id": 8,
      "invoiceNumber": "INV-2024-008",
      "subscriptionId": 2,
      "billingCycleId": 7,
      "issueDate": "2025-12-29T00:00:00.000Z",
      "dueDate": "2026-01-05T23:59:59.999Z",
      "subtotal": 147.25,
      "taxAmount": 17.67,
      "discountAmount": 0,
      "creditApplied": 0,
      "total": 164.92,
      "paidAmount": 164.92,
      "remainingAmount": 0,
      "currency": "GTQ",
      "status": "paid"
    }
  ],
  "total": 1
}
```

**Cómo interpretar:**
- `total`: Monto total de la factura (incluye impuestos, descuentos, créditos)
- `paidAmount`: Suma de todos los payments aplicados a esta factura
- `remainingAmount`: `total - paidAmount`
- `status`: Estado de la factura ('pending', 'paid', 'overdue', 'cancelled')
- Si `remainingAmount === 0` → Factura pagada completamente
- Si `remainingAmount > 0` y `dueDate < hoy` → Factura vencida
- `billingCycleId`: Link al billing cycle asociado (si existe)

---

## 📖 Cómo Interpretar los Datos

### **1. Payments - Qué Campos Usar**

#### **Para Listado de Payments (Vista Principal)**
```typescript
// Usar estos campos para mostrar en tabla
interface PaymentListItem {
  id: number;                    // ID único del payment
  amount: number;                // Monto del payment
  currency: string;              // Moneda
  transactionId: number | null;   // Número de transacción (agrupa payments relacionados)
  reference: string | null;      // Referencia del pago (ej: número de transferencia)
  paymentDate: Date;             // Fecha del pago
  status: string;                // Estado: 'paid', 'pending', 'failed', etc.
  isDerived: boolean;            // false = original, true = derivado
  billingCycleId: number | null; // ID del ciclo si está aplicado
  invoiceId: number | null;      // ID de factura si está aplicado

  // Solo para payments originales:
  appliedAmount?: number;        // Cuánto se ha aplicado
  remainingAmount?: number;       // Cuánto queda sin aplicar
  isFullyApplied?: boolean;      // Si está completamente aplicado
  summary?: PaymentSummary;      // Resumen simplificado (ver abajo)
}
```

#### **Para Vista Detallada de Payment Original**
```typescript
// Usar el campo 'summary' para mostrar información simplificada
interface PaymentSummary {
  totalAmount: number;           // Monto total del payment
  appliedAmount: number;          // Monto total aplicado
  remainingAmount: number;        // Monto restante
  isFullyApplied: boolean;       // Si está completamente aplicado
  applicationsCount: number;     // Cantidad de aplicaciones
  appliedTo: Array<{             // Dónde se aplicó
    type: 'billing_cycle' | 'invoice';
    id: number;
    amount: number;
  }>;
}

// O usar 'applications' para ver detalles completos
interface PaymentApplication {
  id: number;                    // ID del payment derivado
  amount: number;                 // Monto aplicado
  billingCycleId: number | null;  // ID del billing cycle
  invoiceId: number | null;      // ID de la factura
  createdAt: Date;               // Cuándo se aplicó
}
```

**Ejemplo de uso:**
```typescript
// Opción 1: Usar summary (más simple)
if (payment.summary) {
  console.log(`Total: ${payment.summary.totalAmount}`);
  console.log(`Aplicado: ${payment.summary.appliedAmount}`);
  console.log(`Restante: ${payment.summary.remainingAmount}`);
  payment.summary.appliedTo.forEach(app => {
    console.log(`  → ${app.type} #${app.id}: ${app.amount}`);
  });
}

// Opción 2: Usar applications (más detallado)
if (payment.applications) {
  payment.applications.forEach(app => {
    console.log(`Payment derivado #${app.id}: ${app.amount}`);
    if (app.billingCycleId) {
      console.log(`  → Billing Cycle #${app.billingCycleId}`);
    }
    if (app.invoiceId) {
      console.log(`  → Invoice #${app.invoiceId}`);
    }
  });
}
```

### **2. Billing Cycles - Qué Campos Usar**

```typescript
interface BillingCycleData {
  id: number;                    // ID del ciclo
  cycleNumber: number;           // Número de ciclo (1, 2, 3...)
  subscriptionId: number;        // ID de la suscripción
  partnerId: number;            // ID del partner
  startDate: Date;              // Inicio del período facturado
  endDate: Date;                // Fin del período facturado
  durationDays: number;         // Duración en días
  billingDate: Date;            // Fecha en que se generó
  dueDate: Date;               // Fecha límite de pago
  totalAmount: number;          // Monto total del ciclo
  paidAmount: number;           // Monto pagado (suma de payments aplicados)
  remainingAmount: number;       // Monto pendiente (totalAmount - paidAmount)
  currency: string;             // Moneda
  status: string;               // 'pending', 'paid', 'overdue', 'cancelled'
  paymentStatus: string;        // 'pending', 'paid', 'failed', 'refunded'
  invoiceId: string | null;     // ID de la factura asociada
  invoiceNumber: string | null;  // Número de factura
}
```

**Cómo calcular:**
- `remainingAmount = totalAmount - paidAmount`
- Si `remainingAmount === 0` → Ciclo completamente pagado
- Si `remainingAmount > 0` y `dueDate < hoy` → Ciclo vencido (overdue)

### **3. Invoices - Qué Campos Usar**

```typescript
interface InvoiceData {
  id: number;                    // ID de la factura
  invoiceNumber: string;         // Número de factura (ej: "INV-2024-001")
  subscriptionId: number;        // ID de la suscripción
  billingCycleId: number | null; // ID del billing cycle asociado
  issueDate: Date;              // Fecha de emisión
  dueDate: Date;                // Fecha de vencimiento
  subtotal: number;             // Subtotal (sin impuestos)
  taxAmount: number;            // Monto de impuestos
  discountAmount: number;        // Descuento aplicado
  creditApplied: number;        // Crédito aplicado
  total: number;                // Total a pagar
  paidAmount: number;           // Monto pagado
  remainingAmount: number;       // Monto pendiente (total - paidAmount)
  currency: string;             // Moneda
  status: string;               // 'pending', 'paid', 'overdue', 'cancelled'
}
```

**Cómo calcular:**
- `remainingAmount = total - paidAmount`
- Si `remainingAmount === 0` → Factura pagada completamente
- Si `remainingAmount > 0` y `dueDate < hoy` → Factura vencida

### **4. Account Balance - Qué Campos Usar**

```typescript
interface AccountBalanceData {
  partnerId: number;             // ID del partner
  totalPaid: number;             // Total pagado (solo payments originales)
  totalPending: number;          // Total pendiente (suma de facturas pendientes)
  creditBalance: number;         // Crédito disponible en suscripción
  outstandingBalance: number;    // Saldo pendiente después de aplicar créditos
  availableCredit: number;       // Crédito disponible después de pagar pendientes
  currency: string;              // Moneda
  lastPaymentDate: Date | null;  // Fecha del último pago
  lastPaymentAmount: number | null; // Monto del último pago
  pendingInvoices: InvoiceSummary[]; // Facturas pendientes (máx 10)
  recentPayments: PaymentSummary[];   // Payments recientes (máx 10, solo originales)
}
```

**Cómo calcular:**
- `outstandingBalance = Math.max(0, totalPending - creditBalance)`
- `availableCredit = Math.max(0, creditBalance - totalPending)`
- Si `outstandingBalance === 0` → No hay saldo pendiente
- Si `availableCredit > 0` → Hay crédito disponible para futuros pagos

---

## 🎨 Recomendaciones para el Frontend

### **1. Vista Principal de Payments**

**Estrategia:** Mostrar solo payments originales por defecto

```typescript
// Componente de lista de payments
async loadPayments(subscriptionId: number) {
  const response = await this.paymentsService.getPayments({
    subscriptionId,
    includeDerived: false // Solo originales
  });

  // Mostrar en tabla
  this.payments = response.payments;
}
```

**UI Sugerida:**
```
┌─────────────────────────────────────────┐
│ Payments de Suscripción #2             │
├─────────────────────────────────────────┤
│ ID  │ Monto  │ Fecha      │ Estado     │
├─────┼────────┼────────────┼────────────┤
│ 2   │ 165.00 │ 29/12/2025 │ ✅ Pagado  │
└─────────────────────────────────────────┘

[Mostrar derivados] ← Botón opcional
```

---

### **2. Vista Detallada de un Payment**

**Estrategia:** Usar el campo `summary` para mostrar información simplificada

```typescript
async loadPaymentDetails(paymentId: number) {
  // 1. Obtener el payment (incluye summary y applications automáticamente)
  const payment = await this.paymentsService.getPayment(paymentId);

  // 2. Si es original, usar summary para mostrar información
  if (!payment.isDerived && payment.summary) {
    this.paymentSummary = payment.summary;
    this.applications = payment.applications || [];
  }

  // 3. Si es derivado, obtener el payment original
  if (payment.isDerived && payment.originalPaymentId) {
    this.originalPayment = await this.paymentsService.getPayment(
      payment.originalPaymentId
    );
  }
}
```

**UI Sugerida (usando summary):**
```
┌─────────────────────────────────────────────┐
│ Payment #2 - $165.00 GTQ                   │
├─────────────────────────────────────────────┤
│ Transaction ID: #1001                      │
│ Referencia: TAC1231231231                   │
│ Fecha: 29/12/2025                           │
│ Estado: ✅ Pagado                           │
│                                             │
│ 📊 Resumen:                                 │
│   • Total: $165.00                          │
│   • Aplicado: $164.92 ✅                    │
│   • Restante: $0.08 (convertido a crédito)  │
│                                             │
│ 📋 Aplicado a:                              │
│   • Billing Cycle #7: $164.92               │
│                                             │
│ [Ver detalles completos]                   │
└─────────────────────────────────────────────┘
```

**UI Alternativa (usando applications):**
```
┌─────────────────────────────────────────────┐
│ Payment #2 - $165.00 GTQ                   │
├─────────────────────────────────────────────┤
│ ... (misma info básica)                     │
│                                             │
│ 📋 Aplicaciones Detalladas:                  │
│   ┌─────────────────────────────────────┐   │
│   │ Payment Derivado #6                 │   │
│   │ Monto: $164.92                      │   │
│   │ Aplicado a: Billing Cycle #7        │   │
│   │ Fecha aplicación: 29/12/2025        │   │
│   └─────────────────────────────────────┘   │
│                                             │
│ 💳 Restante: $0.08 (convertido a crédito)   │
└─────────────────────────────────────────────┘
```

---

### **3. Vista de Billing Cycle**

**Estrategia:** Mostrar el ciclo con sus payments aplicados

```typescript
async loadBillingCycleDetails(billingCycleId: number) {
  // 1. Obtener el billing cycle
  const cycle = await this.billingCyclesService.getBillingCycle(billingCycleId);

  // 2. Obtener payments aplicados
  const payments = await this.billingCyclesService.getBillingCyclePayments(billingCycleId);

  // Combinar información
  this.billingCycle = {
    ...cycle,
    payments: payments.payments
  };
}
```

**UI Sugerida:**
```
┌─────────────────────────────────────────────┐
│ Billing Cycle #1                            │
├─────────────────────────────────────────────┤
│ Período: 01/01/2025 - 31/01/2025           │
│ Total: $164.92 GTQ                          │
│ Pagado: $164.92 GTQ ✅                      │
│                                             │
│ 💳 Payments Aplicados:                      │
│   ┌─────────────────────────────────────┐   │
│   │ Payment #6                          │   │
│   │ Monto: $164.92                      │   │
│   │ Fecha: 29/12/2025                   │   │
│   │ Desde: Payment #2                    │   │
│   │ Referencia: TAC1231231231           │   │
│   └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

### **4. Vista de Estado de Cuenta**

**Estrategia:** Mostrar resumen con opción de ver detalles

```typescript
async loadAccountBalance(partnerId: number) {
  const balance = await this.partnersService.getAccountBalance(partnerId);

  // Los payments ya vienen filtrados (solo originales)
  this.accountBalance = balance;
}
```

**UI Sugerida:**
```
┌─────────────────────────────────────────────┐
│ Estado de Cuenta - Partner #2               │
├─────────────────────────────────────────────┤
│ 💰 Total Pagado: $165.00 GTQ                │
│ 📋 Total Pendiente: $0.00 GTQ              │
│ 💳 Crédito Disponible: $0.08 GTQ            │
│                                             │
│ 📄 Facturas Pendientes: 0                   │
│                                             │
│ 💵 Últimos Pagos:                           │
│   • $165.00 - 29/12/2025                    │
│                                             │
│ [Ver todos los payments]                    │
│ [Ver billing cycles]                        │
└─────────────────────────────────────────────┘
```

---

## 🔍 Casos de Uso Comunes

### **Caso 1: Ver qué payments están aplicados a un billing cycle**

```typescript
// 1. Obtener billing cycle
const cycle = await getBillingCycle(7);

// 2. Obtener payments aplicados
const payments = await getBillingCyclePayments(7);

// 3. Mostrar en UI
payments.payments.forEach(payment => {
  console.log(`Payment ${payment.id}: $${payment.amount}`);
  if (payment.isDerived) {
    console.log(`  └─ Derivado de Payment ${payment.originalPaymentId}`);
  }
});
```

---

### **Caso 2: Ver el desglose completo de un payment original**

**Opción A: Usar summary (Recomendado - más simple)**
```typescript
// 1. Obtener payment original (ya incluye summary y applications)
const payment = await getPayment(2);

// 2. Usar summary para mostrar información
if (payment.summary) {
  console.log(`Total: ${payment.summary.totalAmount}`);
  console.log(`Aplicado: ${payment.summary.appliedAmount}`);
  console.log(`Restante: ${payment.summary.remainingAmount}`);
  console.log(`Completamente aplicado: ${payment.summary.isFullyApplied}`);

  // Mostrar dónde se aplicó
  payment.summary.appliedTo.forEach(app => {
    console.log(`${app.type} #${app.id}: ${app.amount}`);
  });
}
```

**Opción B: Usar applications (Más detallado)**
```typescript
// 1. Obtener payment original
const payment = await getPayment(2);

// 2. Usar applications para ver detalles completos
if (payment.applications) {
  payment.applications.forEach(app => {
    console.log(`Payment derivado #${app.id}: ${app.amount}`);
    if (app.billingCycleId) {
      console.log(`  → Billing Cycle #${app.billingCycleId}`);
    }
    if (app.invoiceId) {
      console.log(`  → Invoice #${app.invoiceId}`);
    }
    console.log(`  → Aplicado el: ${app.createdAt}`);
  });

  // Los campos appliedAmount y remainingAmount ya están calculados
  console.log(`Total aplicado: ${payment.appliedAmount}`);
  console.log(`Restante: ${payment.remainingAmount}`);
}
```

---

### **Caso 3: Mostrar timeline de payments y billing cycles**

```typescript
// 1. Obtener billing cycles ordenados por fecha
const cycles = await getBillingCycles({ subscriptionId: 2 });

// 2. Para cada ciclo, obtener sus payments
const timeline = await Promise.all(
  cycles.billingCycles.map(async (cycle) => {
    const payments = await getBillingCyclePayments(cycle.id);
    return {
      cycle,
      payments: payments.payments
    };
  })
);

// 3. Mostrar en timeline UI
timeline.forEach(item => {
  console.log(`Ciclo ${item.cycle.cycleNumber}:`);
  item.payments.forEach(p => {
    console.log(`  └─ Payment ${p.id}: $${p.amount}`);
  });
});
```

---

## 🎯 Mejores Prácticas

### ✅ **DO (Hacer)**

1. **Por defecto, mostrar solo payments originales** en listados principales
2. **Usar `isDerived` para diferenciar visualmente** los payments derivados
3. **Mostrar `originalPaymentId` como link** para navegar al payment original
4. **Agrupar payments derivados** bajo su payment original en vistas detalladas
5. **Usar el endpoint específico** `/billing-cycles/{id}/payments` para ver payments de un ciclo

### ❌ **DON'T (No hacer)**

1. **No mostrar payments derivados como si fueran pagos separados** en resúmenes
2. **No sumar payments originales + derivados** (duplicarías montos)
3. **No ocultar completamente los derivados** (son útiles para auditoría)
4. **No crear UI confusa** mezclando originales y derivados sin diferenciación

---

## 📊 Estructura de Datos Recomendada

### **Para Listado de Payments**

```typescript
interface PaymentListItem {
  id: number;
  amount: number;
  currency: string;
  transactionId: number | null;  // ← Agrupa payments relacionados
  reference: string | null;      // ← Referencia del pago
  paymentDate: Date;
  status: string;
  isDerived: boolean;            // ← Usar para estilo visual
  originalPaymentId: number | null;  // ← Link al original
  billingCycleId: number | null;      // ← Link al ciclo
  invoiceId: number | null;          // ← Link a factura

  // Solo para payments originales:
  appliedAmount?: number;        // ← Cuánto se aplicó
  remainingAmount?: number;       // ← Cuánto queda
  isFullyApplied?: boolean;       // ← Si está completo
  summary?: PaymentSummary;       // ← Resumen simplificado
}
```

### **Para Vista de Billing Cycle**

```typescript
interface BillingCycleWithPayments {
  id: number;
  cycleNumber: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  payments: Array<{
    id: number;
    amount: number;
    isDerived: boolean;
    originalPaymentId: number | null;
    paymentDate: Date;
    reference: string | null;
  }>;
}
```

---

## 🎨 Ejemplos de Componentes UI

### **Componente: PaymentList**

```typescript
@Component({
  template: `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Transaction ID</th>
          <th>Referencia</th>
          <th>Monto</th>
          <th>Fecha</th>
          <th>Estado</th>
          <th>Aplicado</th>
          <th>Billing Cycle</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let payment of payments"
            [class.derived]="payment.isDerived"
            [class.fully-applied]="payment.isFullyApplied">
          <td>{{ payment.id }}</td>
          <td>
            <span *ngIf="payment.transactionId">#{{ payment.transactionId }}</span>
            <span *ngIf="!payment.transactionId" class="text-muted">-</span>
          </td>
          <td>{{ payment.reference || '-' }}</td>
          <td>{{ payment.amount }} {{ payment.currency }}</td>
          <td>{{ payment.paymentDate | date }}</td>
          <td>
            <span [class]="'badge badge-' + getStatusClass(payment.status)">
              {{ payment.status }}
            </span>
          </td>
          <td>
            <span *ngIf="!payment.isDerived">
              <span *ngIf="payment.appliedAmount !== undefined">
                {{ payment.appliedAmount }} / {{ payment.amount }}
                <span *ngIf="payment.isFullyApplied" class="text-success">✅</span>
                <span *ngIf="!payment.isFullyApplied" class="text-warning">
                  ({{ payment.remainingAmount }} pendiente)
                </span>
              </span>
            </span>
            <span *ngIf="payment.isDerived" class="text-muted">-</span>
          </td>
          <td>
            <a *ngIf="payment.billingCycleId"
               [routerLink]="['/billing-cycles', payment.billingCycleId]">
              Ciclo #{{ getCycleNumber(payment.billingCycleId) }}
            </a>
            <span *ngIf="!payment.billingCycleId" class="text-muted">
              Sin asignar
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [`
    .derived {
      background-color: #f8f9fa;
      font-style: italic;
    }
    .fully-applied {
      opacity: 0.8;
    }
  `]
})
export class PaymentListComponent {
  payments: Payment[];

  async loadPayments(subscriptionId: number) {
    const response = await this.paymentsService.getPayments({
      subscriptionId,
      includeDerived: false // Solo originales por defecto
    });
    this.payments = response.payments;
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'paid': 'success',
      'pending': 'warning',
      'failed': 'danger',
      'refunded': 'info',
      'cancelled': 'secondary'
    };
    return statusMap[status] || 'secondary';
  }
}
```

---

### **Componente: BillingCycleDetails**

```typescript
@Component({
  template: `
    <div class="billing-cycle-card">
      <h3>Billing Cycle #{{ cycle.cycleNumber }}</h3>
      <div class="amounts">
        <div>Total: {{ cycle.totalAmount }} {{ cycle.currency }}</div>
        <div>Pagado: {{ cycle.paidAmount }} {{ cycle.currency }}</div>
        <div>Pendiente: {{ cycle.remainingAmount }} {{ cycle.currency }}</div>
      </div>

      <h4>Payments Aplicados:</h4>
      <div *ngFor="let payment of cycle.payments" class="payment-item">
        <div class="payment-header">
          <span>Payment #{{ payment.id }}</span>
          <span class="amount">{{ payment.amount }} {{ payment.currency }}</span>
        </div>
        <div *ngIf="payment.isDerived" class="derived-info">
          <small>
            Derivado de Payment #{{ payment.originalPaymentId }}
          </small>
        </div>
        <div class="payment-meta">
          <span>{{ payment.paymentDate | date }}</span>
          <span *ngIf="payment.reference">{{ payment.reference }}</span>
        </div>
      </div>
    </div>
  `
})
export class BillingCycleDetailsComponent {
  cycle: BillingCycleWithPayments;

  async loadCycle(billingCycleId: number) {
    const payments = await this.billingCyclesService.getBillingCyclePayments(billingCycleId);
    const cycle = await this.billingCyclesService.getBillingCycle(billingCycleId);

    this.cycle = {
      ...cycle,
      payments: payments.payments,
      remainingAmount: payments.remainingAmount
    };
  }
}
```

---

## 🔗 Navegación Recomendada

### **Flujo de Navegación:**

```
1. Estado de Cuenta
   └─> Ver Payments (solo originales)
       └─> Detalle Payment
           └─> Ver Derivados (si tiene)
               └─> Ver Billing Cycle

2. Billing Cycles
   └─> Ver Ciclo
       └─> Ver Payments Aplicados
           └─> Ver Payment Original (si es derivado)
```

---

## 📝 Resumen de Endpoints

| Endpoint | Propósito | Incluye Derivados |
|----------|-----------|-------------------|
| `GET /admin/payments?subscriptionId={id}` | Listar payments | Opcional (`includeDerived`) |
| `GET /admin/payments/{id}` | Ver payment específico | Siempre (incluye summary/applications) |
| `GET /admin/billing-cycles/{id}/payments` | Payments de un ciclo | Siempre (todos los aplicados) |
| `GET /admin/billing-cycles?subscriptionId={id}` | Listar ciclos | N/A |
| `GET /admin/invoices?subscriptionId={id}` | Listar facturas | N/A |
| `GET /admin/partners/{id}/account-balance` | Estado de cuenta | No (solo originales) |

---

## 🚀 Implementación Rápida

### **Paso 1: Servicio de Payments**

```typescript
@Injectable()
export class PaymentsService {
  constructor(private http: HttpClient) {}

  getPayments(params: {
    subscriptionId?: number;
    partnerId?: number;
    includeDerived?: boolean;
  }) {
    return this.http.get<GetPaymentsResponse>('/admin/payments', { params });
  }

  getPayment(id: number) {
    return this.http.get<GetPaymentResponse>(`/admin/payments/${id}`);
  }
}
```

### **Paso 2: Servicio de Billing Cycles**

```typescript
@Injectable()
export class BillingCyclesService {
  constructor(private http: HttpClient) {}

  getBillingCyclePayments(billingCycleId: number) {
    return this.http.get<GetBillingCyclePaymentsResponse>(
      `/admin/billing-cycles/${billingCycleId}/payments`
    );
  }

  getBillingCycles(subscriptionId: number) {
    return this.http.get<GetBillingCyclesResponse>(
      '/admin/billing-cycles',
      { params: { subscriptionId } }
    );
  }

  getBillingCycle(id: number) {
    return this.http.get<GetBillingCycleResponse>(
      `/admin/billing-cycles/${id}`
    );
  }
}
```

### **Paso 3: Servicio de Invoices**

```typescript
@Injectable()
export class InvoicesService {
  constructor(private http: HttpClient) {}

  getInvoices(params: {
    subscriptionId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    return this.http.get<GetInvoicesResponse>(
      '/admin/invoices',
      { params }
    );
  }

  getInvoice(id: number) {
    return this.http.get<GetInvoiceResponse>(
      `/admin/invoices/${id}`
    );
  }
}
```

### **Paso 4: Servicio de Partners (Account Balance)**

```typescript
@Injectable()
export class PartnersService {
  constructor(private http: HttpClient) {}

  getAccountBalance(partnerId: number) {
    return this.http.get<GetPartnerAccountBalanceResponse>(
      `/admin/partners/${partnerId}/account-balance`
    );
  }
}
```

---

## ✅ Checklist de Implementación

### **Servicios**
- [ ] Crear servicio para payments
- [ ] Crear servicio para billing cycles
- [ ] Crear servicio para invoices
- [ ] Crear servicio para partners (account balance)

### **Componentes de Payments**
- [ ] Implementar componente de lista de payments (solo originales)
- [ ] Implementar componente de detalle de payment (usar `summary`)
- [ ] Mostrar `transactionId` y `reference` para agrupar payments
- [ ] Mostrar `appliedAmount` y `remainingAmount` en listados
- [ ] Agregar indicadores visuales para payments derivados
- [ ] Implementar navegación entre payment original y derivados

### **Componentes de Billing Cycles**
- [ ] Implementar componente de lista de billing cycles
- [ ] Implementar componente de detalle de billing cycle con payments
- [ ] Mostrar `totalAmount`, `paidAmount`, `remainingAmount`
- [ ] Mostrar link a invoice asociada

### **Componentes de Invoices**
- [ ] Implementar componente de lista de invoices
- [ ] Implementar componente de detalle de invoice
- [ ] Mostrar `total`, `paidAmount`, `remainingAmount`
- [ ] Mostrar link a billing cycle asociado

### **Vista de Estado de Cuenta**
- [ ] Implementar vista de account balance
- [ ] Mostrar `totalPaid`, `totalPending`, `outstandingBalance`
- [ ] Mostrar `availableCredit` y `creditBalance`
- [ ] Mostrar lista de `recentPayments` con información de aplicación
- [ ] Mostrar lista de `pendingInvoices`

---

---

## 🔗 Relación entre Payments, Billing Cycles e Invoices

### **Flujo de Datos:**

```
1. Se crea un Billing Cycle
   └─> Genera automáticamente una Invoice
       └─> Invoice tiene billingCycleId

2. Partner realiza un Payment Original
   └─> Payment tiene billingCycleId: null (sin asignar)
       └─> Sistema crea Payments Derivados automáticamente
           ├─> Payment Derivado #1 → billingCycleId: 7
           └─> Payment Derivado #2 → invoiceId: 8 (si aplica)

3. Billing Cycle recibe Payments Derivados
   └─> paidAmount se actualiza automáticamente
       └─> remainingAmount = totalAmount - paidAmount

4. Invoice se marca como pagada
   └─> Cuando billingCycle.paidAmount >= billingCycle.totalAmount
```

### **Cómo Navegar entre Entidades:**

```typescript
// De Payment Original → Ver aplicaciones
const payment = await getPayment(2);
if (payment.summary) {
  payment.summary.appliedTo.forEach(app => {
    if (app.type === 'billing_cycle') {
      // Navegar a billing cycle
      navigateToBillingCycle(app.id);
    } else if (app.type === 'invoice') {
      // Navegar a invoice
      navigateToInvoice(app.id);
    }
  });
}

// De Billing Cycle → Ver Invoice asociada
const cycle = await getBillingCycle(7);
if (cycle.invoiceId) {
  const invoice = await getInvoice(cycle.invoiceId);
}

// De Invoice → Ver Billing Cycle asociado
const invoice = await getInvoice(8);
if (invoice.billingCycleId) {
  const cycle = await getBillingCycle(invoice.billingCycleId);
}

// De Billing Cycle → Ver Payments aplicados
const payments = await getBillingCyclePayments(7);
payments.payments.forEach(payment => {
  // Todos son derivados
  if (payment.originalPaymentId) {
    // Navegar al payment original
    navigateToPayment(payment.originalPaymentId);
  }
});
```

---

## 🎯 Guía Rápida: Qué Data Usar para Cada Vista

### **Vista de Listado de Payments**
✅ **Usar:**
- `id`, `amount`, `currency`, `paymentDate`, `status`
- `transactionId` (para agrupar payments relacionados)
- `reference` (número de referencia del pago)
- `appliedAmount`, `remainingAmount`, `isFullyApplied` (solo para originales)
- `billingCycleId` o `invoiceId` (para links)

❌ **NO usar:**
- `applications` array (demasiado detallado para lista)
- Payments derivados (filtrar con `includeDerived: false`)

### **Vista Detallada de Payment**
✅ **Usar:**
- Todos los campos básicos
- **`summary`** (recomendado - más simple) O **`applications`** (más detallado)
- `appliedAmount`, `remainingAmount`, `isFullyApplied`

❌ **NO usar:**
- Si es derivado, mejor mostrar el payment original

### **Vista de Billing Cycle**
✅ **Usar:**
- `totalAmount`, `paidAmount`, `remainingAmount`
- `startDate`, `endDate`, `dueDate`
- `status`, `paymentStatus`
- `payments` array (todos son derivados aplicados a este ciclo)

❌ **NO usar:**
- No necesitas calcular nada, todo viene calculado

### **Vista de Invoice**
✅ **Usar:**
- `total`, `paidAmount`, `remainingAmount`
- `issueDate`, `dueDate`
- `status`
- `billingCycleId` (para link al ciclo)

❌ **NO usar:**
- No necesitas calcular nada, todo viene calculado

### **Vista de Account Balance**
✅ **Usar:**
- `totalPaid` (solo payments originales - NO incluye derivados)
- `totalPending` (suma de facturas pendientes)
- `outstandingBalance` (lo que realmente falta pagar después de créditos)
- `availableCredit` (crédito disponible después de pagar pendientes)
- `recentPayments` (solo originales, incluye `appliedAmount`, `remainingAmount`, `isFullyApplied`)
- `pendingInvoices` (facturas pendientes con sus montos)

❌ **NO usar:**
- No sumar payments manualmente (ya viene calculado)
- No incluir payments derivados en cálculos
- No calcular `outstandingBalance` manualmente (ya viene calculado)

**Ejemplo de cálculo visual:**
```
Total Pagado: $165.00 (payments originales)
Total Pendiente: $0.00 (facturas pendientes)
Crédito Disponible: $0.08
─────────────────────────────────
Saldo Pendiente: $0.00 (ya aplicado crédito)
Crédito Disponible: $0.08 (sobra después de pagar pendientes)
```

---

## 📝 Resumen de Campos Clave

| Campo | Tipo | Descripción | Cuándo Usar |
|-------|------|-------------|-------------|
| `transactionId` | `number \| null` | ID único de transacción (agrupa payments relacionados) | Agrupar payments relacionados, mostrar número de transacción |
| `reference` | `string \| null` | Referencia del pago (ej: número de transferencia) | Mostrar referencia del pago, agrupar por referencia |
| `appliedAmount` | `number` | Monto aplicado (solo originales) | Mostrar progreso de aplicación |
| `remainingAmount` | `number` | Monto restante (solo originales) | Mostrar saldo pendiente |
| `isFullyApplied` | `boolean` | Si está completamente aplicado | Indicador visual de completitud |
| `summary` | `object` | Resumen simplificado (solo originales) | Vista rápida de aplicaciones |
| `applications` | `array` | Detalles de aplicaciones (solo originales) | Vista detallada de aplicaciones |
| `isDerived` | `boolean` | Si es payment derivado | Filtrar y diferenciar visualmente |

---

---

## 💡 Ejemplos Prácticos de Uso

### **Ejemplo 1: Dashboard de Payments**

```typescript
// Mostrar resumen de payments con estado de aplicación
async loadPaymentsDashboard(subscriptionId: number) {
  const payments = await this.paymentsService.getPayments({
    subscriptionId,
    includeDerived: false
  });

  // Agrupar por transactionId
  const groupedPayments = this.groupByTransactionId(payments.payments);

  // Calcular estadísticas
  const stats = {
    totalPayments: payments.payments.length,
    totalAmount: payments.payments.reduce((sum, p) => sum + p.amount, 0),
    fullyApplied: payments.payments.filter(p => p.isFullyApplied).length,
    partiallyApplied: payments.payments.filter(
      p => !p.isFullyApplied && (p.appliedAmount || 0) > 0
    ).length,
    unapplied: payments.payments.filter(
      p => !p.appliedAmount || p.appliedAmount === 0
    ).length
  };

  return { groupedPayments, stats };
}

private groupByTransactionId(payments: Payment[]): Map<number, Payment[]> {
  const grouped = new Map<number, Payment[]>();
  payments.forEach(payment => {
    if (payment.transactionId) {
      if (!grouped.has(payment.transactionId)) {
        grouped.set(payment.transactionId, []);
      }
      grouped.get(payment.transactionId)!.push(payment);
    }
  });
  return grouped;
}
```

### **Ejemplo 2: Vista de Billing Cycle con Estado de Pago**

```typescript
async loadBillingCycleWithStatus(billingCycleId: number) {
  const cycle = await this.billingCyclesService.getBillingCycle(billingCycleId);
  const payments = await this.billingCyclesService.getBillingCyclePayments(billingCycleId);

  // Determinar estado visual
  const status = {
    isPaid: cycle.remainingAmount === 0,
    isOverdue: cycle.remainingAmount > 0 && new Date(cycle.dueDate) < new Date(),
    progress: (cycle.paidAmount / cycle.totalAmount) * 100,
    canPay: cycle.remainingAmount > 0 && !this.isOverdue(cycle.dueDate)
  };

  // Agrupar payments por transactionId
  const paymentsByTransaction = this.groupPaymentsByTransaction(payments.payments);

  return {
    cycle,
    payments: payments.payments,
    paymentsByTransaction,
    status
  };
}
```

### **Ejemplo 3: Vista de Invoice con Payments Aplicados**

```typescript
async loadInvoiceWithPayments(invoiceId: number) {
  const invoice = await this.invoicesService.getInvoice(invoiceId);

  // Obtener payments aplicados a esta invoice
  const payments = await this.paymentsService.getPayments({
    invoiceId,
    includeDerived: true // Incluir derivados para ver todos los aplicados
  });

  // Calcular estado
  const status = {
    isPaid: invoice.remainingAmount === 0,
    isOverdue: invoice.remainingAmount > 0 && new Date(invoice.dueDate) < new Date(),
    progress: (invoice.paidAmount / invoice.total) * 100
  };

  return { invoice, payments: payments.payments, status };
}
```

### **Ejemplo 4: Account Balance con Desglose**

```typescript
async loadAccountBalanceWithBreakdown(partnerId: number) {
  const balance = await this.partnersService.getAccountBalance(partnerId);

  // Agrupar payments por estado de aplicación
  const paymentsBreakdown = {
    fullyApplied: balance.recentPayments.filter(p => p.isFullyApplied),
    partiallyApplied: balance.recentPayments.filter(
      p => !p.isFullyApplied && (p.appliedAmount || 0) > 0
    ),
    unapplied: balance.recentPayments.filter(
      p => !p.appliedAmount || p.appliedAmount === 0
    )
  };

  // Calcular totales por categoría
  const totals = {
    totalPaid: balance.totalPaid,
    totalPending: balance.totalPending,
    totalApplied: balance.recentPayments.reduce(
      (sum, p) => sum + (p.appliedAmount || 0), 0
    ),
    totalRemaining: balance.recentPayments.reduce(
      (sum, p) => sum + (p.remainingAmount || 0), 0
    )
  };

  return {
    balance,
    paymentsBreakdown,
    totals
  };
}
```

---

**Última actualización:** 2025-12-29
**Versión:** 2.0

