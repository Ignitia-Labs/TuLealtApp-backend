# Flujo Completo: Pagos, Invoices y Ciclos de Facturación

## 📋 Resumen del Sistema

Este documento explica cómo funciona el sistema de:
1. **Ciclos de Facturación (Billing Cycles)** - Representan períodos de facturación de suscripciones
2. **Facturas (Invoices)** - Documentos de facturación generados para cada ciclo
3. **Pagos (Payments)** - Registro de pagos realizados para facturas/ciclos

---

## 🏗️ Arquitectura del Sistema

### **Relaciones entre Entidades**

```
PartnerSubscription (Suscripción)
    │
    ├── BillingCycle (Ciclo de Facturación)
    │       │
    │       ├── Invoice (Factura)
    │       │       │
    │       │       └── InvoiceItem (Items de la factura)
    │       │
    │       └── Payment (Pago asociado al ciclo)
    │
    └── Payment (Pago directo a la suscripción)
```

### **Flujo de Datos**

```
1. Suscripción creada → nextBillingDate establecido
2. Cuando llega nextBillingDate → Se genera BillingCycle
3. BillingCycle generado → Se crea Invoice automáticamente
4. Invoice creada → Se registra Payment cuando se paga
5. Payment registrado → Se actualiza BillingCycle e Invoice
```

---

## 🔄 Ciclos de Facturación (Billing Cycles)

### **¿Qué es un Billing Cycle?**

Un **Billing Cycle** representa un período de facturación específico de una suscripción. Cada suscripción puede tener múltiples ciclos a lo largo del tiempo.

### **Estructura de BillingCycle**

```typescript
BillingCycle {
  id: number
  subscriptionId: number          // FK a PartnerSubscription
  partnerId: number                // FK a Partner
  cycleNumber: number              // Número secuencial del ciclo (1, 2, 3...)
  startDate: Date                 // Inicio del período facturado
  endDate: Date                   // Fin del período facturado
  durationDays: number             // Duración en días
  billingDate: Date               // Fecha en que se genera la facturación
  dueDate: Date                   // Fecha límite de pago
  amount: number                   // Monto base del ciclo
  paidAmount: number               // Monto pagado hasta el momento
  totalAmount: number              // Monto total (incluye descuentos)
  currency: string                 // Moneda (USD, EUR, etc.)
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentDate: Date | null
  paymentMethod: string | null
  invoiceId: string | null         // Referencia a la factura generada
  invoiceNumber: string | null
  invoiceStatus: 'pending' | 'paid' | 'overdue' | 'cancelled' | null
  discountApplied: number | null
  createdAt: Date
  updatedAt: Date
}
```

### **Estados del Ciclo**

- **`pending`**: Ciclo creado, esperando pago
- **`paid`**: Ciclo completamente pagado
- **`overdue`**: Ciclo vencido sin pago
- **`cancelled`**: Ciclo cancelado

### **Frecuencias de Facturación**

Las suscripciones pueden tener diferentes frecuencias:
- **`monthly`**: Mensual (30 días)
- **`quarterly`**: Trimestral (90 días)
- **`semiannual`**: Semestral (180 días)
- **`annual`**: Anual (365 días)

### **¿Cómo se Generan los Ciclos?**

**✅ SISTEMA AUTOMÁTICO IMPLEMENTADO:** El sistema cuenta con un **cron job automático** que genera los ciclos de facturación diariamente.

#### **Generación Automática (Recomendado)**

El sistema tiene implementado `BillingCycleGeneratorService` que:

1. **Se ejecuta diariamente a las 2:00 AM** mediante un cron job (`@Cron(CronExpression.EVERY_DAY_AT_2AM)`)
2. **Busca suscripciones activas** con:
   - `status = 'active'`
   - `nextBillingDate <= hoy`
   - `autoRenew = true`
3. **Para cada suscripción encontrada:**
   - Calcula las fechas del nuevo ciclo basándose en `currentPeriodEnd` y `billingFrequency`
   - Genera el `BillingCycle` con el número de ciclo secuencial
   - Crea automáticamente la `Invoice` asociada
   - Genera el PDF de la factura
   - Envía email al partner con la factura
   - Actualiza `subscription.nextBillingDate`, `currentPeriodStart` y `currentPeriodEnd`

**Ventajas del sistema automático:**
- ✅ No requiere intervención manual
- ✅ Garantiza que todas las suscripciones se facturen a tiempo
- ✅ Genera facturas y envía notificaciones automáticamente
- ✅ Actualiza correctamente los períodos de la suscripción

#### **Generación Manual (Desde UI)**

También puedes crear ciclos manualmente desde el Admin UI usando:

**Endpoint:** `POST /admin/billing-cycles`

Esto es útil para:
- Casos especiales o ajustes manuales
- Testing y desarrollo
- Facturación anticipada
- Corrección de errores

### **Ejemplo de Generación Manual de Ciclo**

```typescript
// 1. Obtener la suscripción
const subscription = await subscriptionRepository.findById(subscriptionId);

// 2. Calcular fechas del nuevo ciclo
const startDate = subscription.currentPeriodEnd;
const endDate = calculateEndDate(startDate, subscription.billingFrequency);
const billingDate = new Date(); // Hoy
const dueDate = addDays(billingDate, 7); // 7 días para pagar

// 3. Obtener el último ciclo para calcular el número
const lastCycle = await billingCycleRepository.findBySubscriptionId(subscriptionId);
const cycleNumber = lastCycle.length > 0
  ? lastCycle[0].cycleNumber + 1
  : 1;

// 4. Calcular montos
const amount = subscription.nextBillingAmount;
const totalAmount = amount - (discountApplied || 0);

// 5. Crear el ciclo
const billingCycle = BillingCycle.create(
  subscriptionId,
  subscription.partnerId,
  cycleNumber,
  startDate,
  endDate,
  billingDate,
  dueDate,
  amount,
  subscription.currency,
  durationDays,
  totalAmount,
  0, // paidAmount inicial
  'pending', // status
  'pending', // paymentStatus
  null, // paymentDate
  null, // paymentMethod
  null, // invoiceId (se asignará cuando se cree la factura)
  null, // invoiceNumber
  null, // invoiceStatus
  discountApplied || null
);

// 6. Guardar el ciclo
await billingCycleRepository.save(billingCycle);
```

---

## 📄 Facturas (Invoices)

### **¿Qué es una Invoice?**

Una **Invoice** es el documento de facturación generado para un ciclo de facturación. Contiene información detallada del partner, items facturados, impuestos, descuentos, etc.

### **Estructura de Invoice**

```typescript
Invoice {
  id: number
  invoiceNumber: string            // Número único de factura (ej: "INV-2024-001")
  subscriptionId: number           // FK a PartnerSubscription
  partnerId: number                // FK a Partner
  billingCycleId: number | null    // FK a BillingCycle (opcional)
  businessName: string             // Nombre del negocio
  taxId: string                    // NIT/RFC/Tax ID
  fiscalAddress: string             // Dirección fiscal
  billingEmail: string             // Email de facturación
  issueDate: Date                  // Fecha de emisión
  dueDate: Date                    // Fecha límite de pago
  paidDate: Date | null            // Fecha de pago
  subtotal: number                 // Subtotal sin impuestos
  discountAmount: number            // Descuento aplicado
  taxAmount: number                // Impuestos
  creditApplied: number            // Créditos aplicados
  total: number                     // Total a pagar
  currency: string                 // Moneda
  items: InvoiceItem[]             // Items de la factura
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cash' | 'other' | null
  pdfUrl: string | null            // URL del PDF generado
  notes: string | null             // Notas adicionales
  createdAt: Date
  updatedAt: Date
}
```

### **Estructura de InvoiceItem**

```typescript
InvoiceItem {
  id: string                        // ID único dentro de la factura
  description: string               // Descripción del item
  quantity: number                  // Cantidad
  unitPrice: number                 // Precio unitario
  amount: number                    // amount = quantity * unitPrice
  taxRate: number                   // Porcentaje de impuesto
  taxAmount: number                 // Impuesto del item
  discountPercent?: number          // Porcentaje de descuento
  discountAmount?: number           // Monto de descuento
  total: number                     // Total del item (amount + tax - discount)
}
```

### **¿Cómo se Generan las Facturas?**

Las facturas se generan típicamente cuando se crea un `BillingCycle`. El proceso sería:

1. **Crear el BillingCycle** (como se mostró arriba)
2. **Obtener información del Partner** (businessName, taxId, fiscalAddress, billingEmail)
3. **Crear los InvoiceItems** basados en el plan de suscripción
4. **Calcular subtotales, impuestos y totales**
5. **Generar el número de factura único**
6. **Crear y guardar la Invoice**
7. **Actualizar el BillingCycle** con el `invoiceId` y `invoiceNumber`

### **Ejemplo de Generación de Factura**

```typescript
// 1. Obtener información del partner
const partner = await partnerRepository.findById(partnerId);

// 2. Crear items de la factura
const items: InvoiceItem[] = [
  {
    id: '1',
    description: `Suscripción ${subscription.planType} - ${subscription.billingFrequency}`,
    quantity: 1,
    unitPrice: subscription.basePrice,
    amount: subscription.basePrice,
    taxRate: subscription.taxPercent || 0,
    taxAmount: subscription.taxAmount,
    total: subscription.totalPrice,
  },
];

// 3. Generar número de factura único
const invoiceNumber = await generateInvoiceNumber(); // Ej: "INV-2024-001"

// 4. Calcular fechas
const issueDate = new Date();
const dueDate = billingCycle.dueDate;

// 5. Crear la factura
const invoice = Invoice.create(
  invoiceNumber,
  subscriptionId,
  partnerId,
  partner.businessName,
  partner.taxId,
  partner.fiscalAddress,
  partner.billingEmail,
  issueDate,
  dueDate,
  subscription.basePrice, // subtotal
  subscription.taxAmount, // taxAmount
  subscription.totalPrice, // total
  subscription.currency,
  items,
  billingCycle.id, // billingCycleId
  discountAmount || 0,
  creditApplied || 0,
  null, // paidDate
  'pending', // status
  'pending', // paymentStatus
  null, // paymentMethod
  null, // pdfUrl (se generará después)
  null // notes
);

// 6. Guardar la factura
const savedInvoice = await invoiceRepository.save(invoice);

// 7. Actualizar el BillingCycle con la información de la factura
const updatedCycle = new BillingCycle(
  billingCycle.id,
  billingCycle.subscriptionId,
  billingCycle.partnerId,
  billingCycle.cycleNumber,
  billingCycle.startDate,
  billingCycle.endDate,
  billingCycle.durationDays,
  billingCycle.billingDate,
  billingCycle.dueDate,
  billingCycle.amount,
  billingCycle.paidAmount,
  billingCycle.currency,
  billingCycle.status,
  billingCycle.paymentStatus,
  billingCycle.paymentDate,
  billingCycle.paymentMethod,
  savedInvoice.id.toString(), // invoiceId
  savedInvoice.invoiceNumber,  // invoiceNumber
  'pending', // invoiceStatus
  billingCycle.discountApplied,
  billingCycle.totalAmount,
  billingCycle.createdAt,
  new Date()
);

await billingCycleRepository.update(updatedCycle);
```

---

## 💳 Pagos (Payments)

### **¿Qué es un Payment?**

Un **Payment** representa un pago realizado para una suscripción, factura o ciclo de facturación. Puede estar asociado a una factura específica o ser un pago directo a la suscripción.

### **Estructura de Payment**

```typescript
Payment {
  id: number
  subscriptionId: number            // FK a PartnerSubscription (requerido)
  partnerId: number                 // FK a Partner (requerido)
  invoiceId: number | null          // FK a Invoice (opcional)
  billingCycleId: number | null     // FK a BillingCycle (opcional)
  amount: number                    // Monto del pago
  currency: string                  // Moneda
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cash' | 'other'
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'
  paymentDate: Date                // Fecha del pago
  processedDate: Date | null       // Fecha de procesamiento
  transactionId: string | null     // ID de transacción externa
  reference: string | null         // Referencia del pago
  confirmationCode: string | null  // Código de confirmación
  gateway: string | null           // Gateway usado (Stripe, PayPal, etc.)
  gatewayTransactionId: string | null
  cardLastFour: string | null       // Últimos 4 dígitos de tarjeta
  cardBrand: string | null         // Marca de tarjeta (Visa, Mastercard)
  cardExpiry: string | null        // Fecha de expiración
  isRetry: boolean                 // Si es un reintento de pago
  retryAttempt: number | null      // Número de intento
  notes: string | null             // Notas adicionales
  processedBy: number | null       // ID del usuario que procesó el pago
  createdAt: Date
  updatedAt: Date
}
```

### **Estados del Pago**

- **`pending`**: Pago registrado, esperando procesamiento
- **`paid`**: Pago completado exitosamente
- **`failed`**: Pago fallido
- **`refunded`**: Pago reembolsado
- **`cancelled`**: Pago cancelado

### **¿Cómo se Registran los Pagos?**

Los pagos se pueden registrar de dos formas:

#### **1. Pago asociado a una Factura/Ciclo**

```typescript
// 1. Obtener la factura y el ciclo
const invoice = await invoiceRepository.findById(invoiceId);
const billingCycle = await billingCycleRepository.findById(billingCycleId);

// 2. Crear el pago
const payment = Payment.create(
  invoice.subscriptionId,
  invoice.partnerId,
  invoice.total, // amount
  invoice.currency,
  'credit_card', // paymentMethod
  invoice.id, // invoiceId
  billingCycle.id, // billingCycleId
  new Date(), // paymentDate
  'pending' // status inicial
);

// 3. Guardar el pago
const savedPayment = await paymentRepository.save(payment);

// 4. Si el pago es exitoso, actualizar estados
if (paymentStatus === 'paid') {
  // Actualizar la factura
  const paidInvoice = invoice.markAsPaid('credit_card', new Date());
  await invoiceRepository.update(paidInvoice);

  // Actualizar el ciclo de facturación
  const updatedCycle = billingCycle.recordPayment(
    payment.amount,
    'credit_card'
  );
  await billingCycleRepository.update(updatedCycle);

  // Actualizar la suscripción
  const subscription = await subscriptionRepository.findById(invoice.subscriptionId);
  const updatedSubscription = subscription.recordPayment(
    payment.amount,
    'paid'
  );
  await subscriptionRepository.update(updatedSubscription);
}
```

#### **2. Pago directo a la Suscripción**

```typescript
// Pago sin factura asociada (pago anticipado, crédito, etc.)
const payment = Payment.create(
  subscriptionId,
  partnerId,
  amount,
  currency,
  'bank_transfer',
  null, // invoiceId
  null, // billingCycleId
  new Date(),
  'pending'
);

await paymentRepository.save(payment);
```

---

## 🔄 Flujo Completo de Facturación

### **Escenario 1: Facturación Mensual Automática**

```
Día 1 del mes:
1. Cron job detecta suscripciones con nextBillingDate = hoy
2. Para cada suscripción:
   a. Crear BillingCycle (ciclo #1)
   b. Crear Invoice con items del plan
   c. Generar PDF de la factura
   d. Enviar email al partner con la factura
   e. Actualizar subscription.nextBillingDate (próximo mes)
   f. Actualizar subscription.currentPeriodStart/End

Día 5 del mes (fecha de pago):
3. Partner realiza pago:
   a. Registrar Payment con status='pending'
   b. Procesar pago con gateway (Stripe, etc.)
   c. Si exitoso:
      - Actualizar Payment.status = 'paid'
      - Actualizar Invoice.status = 'paid'
      - Actualizar BillingCycle.status = 'paid'
      - Actualizar Subscription.lastPaymentDate
   d. Si falla:
      - Actualizar Payment.status = 'failed'
      - Incrementar Subscription.retryAttempts
      - Programar reintento (si no excede maxRetryAttempts)
```

### **Escenario 2: Facturación Manual**

```
1. Admin crea manualmente BillingCycle:
   POST /admin/billing-cycles
   {
     "subscriptionId": 1,
     "startDate": "2024-01-01",
     "endDate": "2024-01-31",
     "amount": 99.99,
     "dueDate": "2024-01-15"
   }

2. Sistema genera Invoice automáticamente

3. Partner recibe notificación

4. Partner realiza pago:
   POST /admin/payments
   {
     "invoiceId": 1,
     "billingCycleId": 1,
     "amount": 99.99,
     "paymentMethod": "credit_card",
     "gateway": "stripe",
     "gatewayTransactionId": "txn_123"
   }

5. Sistema actualiza todos los estados
```

---

## 📊 Repositorios Disponibles

### **IBillingCycleRepository**

```typescript
interface IBillingCycleRepository {
  findById(id: number): Promise<BillingCycle | null>
  findBySubscriptionId(subscriptionId: number): Promise<BillingCycle[]>
  findPendingByPartnerId(partnerId: number): Promise<BillingCycle[]>
  findCurrentBySubscriptionId(subscriptionId: number): Promise<BillingCycle | null>
  save(cycle: BillingCycle): Promise<BillingCycle>
  update(cycle: BillingCycle): Promise<BillingCycle>
}
```

### **IInvoiceRepository**

```typescript
interface IInvoiceRepository {
  findById(id: number): Promise<Invoice | null>
  findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>
  findBySubscriptionId(subscriptionId: number): Promise<Invoice[]>
  findByPartnerId(partnerId: number, skip?: number, take?: number): Promise<Invoice[]>
  findPendingByPartnerId(partnerId: number): Promise<Invoice[]>
  save(invoice: Invoice): Promise<Invoice>
  update(invoice: Invoice): Promise<Invoice>
}
```

### **IPaymentRepository**

```typescript
interface IPaymentRepository {
  findById(id: number): Promise<Payment | null>
  findBySubscriptionId(subscriptionId: number): Promise<Payment[]>
  findByPartnerId(partnerId: number, skip?: number, take?: number): Promise<Payment[]>
  findByInvoiceId(invoiceId: number): Promise<Payment[]>
  findByStatus(partnerId: number, status: PaymentStatus): Promise<Payment[]>
  save(payment: Payment): Promise<Payment>
  update(payment: Payment): Promise<Payment>
}
```

---

## ⚠️ Estado Actual del Sistema

### **✅ Lo que está implementado:**

1. ✅ **Entidades de dominio** (BillingCycle, Invoice, Payment)
2. ✅ **Repositorios** con métodos básicos de CRUD
3. ✅ **Mappers** para convertir entre dominio y persistencia
4. ✅ **Migraciones de base de datos** con todas las tablas
5. ✅ **Relaciones** entre entidades correctamente definidas
6. ✅ **Handlers/Use Cases:**
   - `CreateBillingCycleHandler` - Crear ciclos de facturación
   - `CreateInvoiceHandler` - Crear facturas con generación automática de número único
   - `CreatePaymentHandler` - Registrar pagos y actualizar estados automáticamente
   - `GetBillingCycleHandler` - Obtener ciclo por ID
   - `GetBillingCyclesHandler` - Listar ciclos con filtros
7. ✅ **Controladores (endpoints REST):**
   - `POST /admin/billing-cycles` - Crear ciclo manualmente
   - `GET /admin/billing-cycles/:id` - Obtener ciclo por ID
   - `GET /admin/billing-cycles?subscriptionId={id}` - Listar ciclos de suscripción
   - `GET /admin/billing-cycles?partnerId={id}` - Listar ciclos pendientes de partner
   - `POST /admin/invoices` - Crear factura manualmente
   - `POST /admin/payments` - Registrar pago
8. ✅ **Servicio de generación automática:**
   - `BillingCycleGeneratorService` con cron job diario a las 2:00 AM
   - Genera automáticamente ciclos e invoices cuando `nextBillingDate <= hoy`
9. ✅ **Generación de números de factura únicos:**
   - Formato: `INV-{YEAR}-{SEQUENCE}` (ej: `INV-2024-001`)
   - Secuencial por año con verificación de unicidad
10. ✅ **Generación de PDFs:**
    - `InvoicePdfService` genera PDFs automáticamente al crear facturas
    - Almacena PDFs en storage y actualiza `invoice.pdfUrl`
11. ✅ **Sistema de notificaciones por email:**
    - Email cuando se genera factura (`sendInvoiceGeneratedEmail`)
    - Email cuando se recibe pago (`sendPaymentReceivedEmail`)
12. ✅ **Validaciones de negocio:**
    - Verifica que no se dupliquen ciclos (validación de fechas)
    - Valida que invoice y billingCycle pertenezcan a la misma suscripción
    - Valida montos de pago vs montos de factura
    - Calcula automáticamente números de ciclo secuenciales

### **⚠️ Lo que está parcialmente implementado:**

1. ⚠️ **Actualización de suscripción al registrar pago:**
   - El `CreatePaymentHandler` actualiza Invoice y BillingCycle cuando el pago es exitoso
   - **FALTA:** Actualizar `subscription.lastPaymentDate` y `subscription.lastPaymentAmount` automáticamente
   - **Nota:** Hay un comentario en el código indicando que esto se puede implementar más adelante

### **❌ Lo que falta implementar:**

1. ❌ **Integración completa con gateways de pago:**
   - Webhooks para recibir confirmaciones automáticas de Stripe/PayPal
   - Procesamiento automático de pagos recurrentes
   - Manejo de pagos fallidos y reintentos automáticos
2. ❌ **Sistema de créditos mejorado:**
   - Aplicación automática de créditos a facturas pendientes
   - Historial de créditos aplicados
   - Transferencia de créditos entre partners
3. ❌ **Reportes y analytics:**
   - Dashboard de estado de cuenta del partner
   - Reportes de facturación y pagos
   - Análisis de pagos pendientes y vencidos
4. ❌ **Manejo de pagos excedentes:**
   - Aplicación automática de pagos excedentes a facturas pendientes
   - Sistema de crédito automático cuando hay pagos mayores a facturas

---

## 💰 Estado de Cuenta del Partner

### **¿Qué es el Estado de Cuenta?**

El **Estado de Cuenta** representa la situación financiera actual de un partner en relación con su suscripción. Incluye:
- Pagos realizados
- Facturas pendientes
- Créditos disponibles
- Saldo pendiente

### **Cómo Calcular el Estado de Cuenta**

El estado de cuenta se calcula dinámicamente basándose en:

#### **1. Pagos Totales del Partner**

```typescript
// Sumar todos los pagos exitosos del partner
const totalPayments = await paymentRepository.findByPartnerId(partnerId);
const paidAmount = totalPayments
  .filter(p => p.status === 'paid')
  .reduce((sum, p) => sum + p.amount, 0);
```

#### **2. Facturas Pendientes**

```typescript
// Sumar todas las facturas pendientes
const pendingInvoices = await invoiceRepository.findPendingByPartnerId(partnerId);
const pendingAmount = pendingInvoices
  .reduce((sum, inv) => sum + inv.total, 0);
```

#### **3. Crédito Disponible**

```typescript
// Obtener crédito de la suscripción
const subscription = await subscriptionRepository.findByPartnerId(partnerId);
const creditBalance = subscription.creditBalance || 0;
```

#### **4. Saldo Pendiente**

```typescript
// Calcular saldo pendiente
const accountBalance = {
  totalPaid: paidAmount,
  totalPending: pendingAmount,
  creditBalance: creditBalance,
  outstandingBalance: pendingAmount - creditBalance, // Saldo pendiente después de aplicar créditos
  availableCredit: creditBalance > pendingAmount ? creditBalance - pendingAmount : 0, // Crédito disponible después de pagar pendientes
};
```

### **Ejemplo de Cálculo**

```
Partner tiene:
- Pagos realizados: $500.00
- Facturas pendientes: $200.00
- Crédito disponible: $50.00

Estado de cuenta:
- Total pagado: $500.00
- Total pendiente: $200.00
- Crédito aplicable: $50.00
- Saldo pendiente: $150.00 ($200 - $50)
- Crédito disponible: $0.00 (se usó todo)
```

### **Implementación Recomendada**

Para obtener el estado de cuenta completo, puedes crear un endpoint:

```typescript
GET /admin/partners/:partnerId/account-balance

Response:
{
  "partnerId": 1,
  "totalPaid": 500.00,
  "totalPending": 200.00,
  "creditBalance": 50.00,
  "outstandingBalance": 150.00,
  "availableCredit": 0.00,
  "currency": "USD",
  "lastPaymentDate": "2024-01-15T10:30:00.000Z",
  "lastPaymentAmount": 99.99,
  "pendingInvoices": [
    {
      "id": 5,
      "invoiceNumber": "INV-2024-005",
      "total": 200.00,
      "dueDate": "2024-02-15T00:00:00.000Z",
      "status": "pending"
    }
  ],
  "recentPayments": [
    {
      "id": 10,
      "amount": 99.99,
      "paymentDate": "2024-01-15T10:30:00.000Z",
      "status": "paid"
    }
  ]
}
```

---

## 💸 Manejo de Pagos Excedentes

### **¿Qué son Pagos Excedentes?**

Un **pago excedente** ocurre cuando un partner paga más de lo que debe en una factura o cuando realiza un pago sin factura asociada.

### **Escenarios de Pagos Excedentes**

#### **Escenario 1: Pago Mayor a Factura**

```
Factura pendiente: $99.99
Pago realizado: $150.00
Excedente: $50.01
```

**¿Qué hacer con el excedente?**

**Opción A: Convertir a Crédito (RECOMENDADO)**
- El excedente se convierte en `creditBalance` en la suscripción
- Se puede aplicar automáticamente a futuras facturas
- El partner puede ver su crédito disponible

**Opción B: Crear Pago Parcial**
- Registrar solo $99.99 como pago de la factura
- Registrar $50.01 como pago directo a la suscripción (sin factura)
- El sistema puede aplicar automáticamente este pago a la próxima factura

#### **Escenario 2: Pago Sin Factura Asociada**

```
Partner realiza pago de $200.00 sin especificar factura
```

**¿Qué hacer?**

**Opción A: Aplicar a Facturas Pendientes (RECOMENDADO)**
1. Buscar facturas pendientes del partner ordenadas por `dueDate`
2. Aplicar el pago a la factura más antigua primero
3. Si sobra, aplicar a la siguiente factura
4. Si aún sobra, convertir a crédito

**Opción B: Convertir Directamente a Crédito**
- Registrar el pago completo como crédito
- El sistema aplicará automáticamente este crédito cuando se generen nuevas facturas

### **Implementación Recomendada**

El sistema actual permite pagos sin factura asociada (`invoiceId = null`), pero **no aplica automáticamente** estos pagos a facturas pendientes.

**Mejora sugerida:**

```typescript
// En CreatePaymentHandler, después de guardar el pago exitoso:
if (savedPayment.status === 'paid' && !invoice) {
  // Si el pago no tiene factura asociada, intentar aplicarlo a facturas pendientes
  const pendingInvoices = await invoiceRepository.findPendingByPartnerId(partnerId);

  let remainingAmount = savedPayment.amount;

  for (const pendingInvoice of pendingInvoices.sort((a, b) =>
    a.dueDate.getTime() - b.dueDate.getTime()
  )) {
    if (remainingAmount <= 0) break;

    const amountToApply = Math.min(remainingAmount, pendingInvoice.total);

    // Crear pago asociado a esta factura
    const invoicePayment = Payment.create(
      subscriptionId,
      partnerId,
      amountToApply,
      currency,
      paymentMethod,
      pendingInvoice.id,
      pendingInvoice.billingCycleId,
      paymentDate,
      'paid'
    );

    await paymentRepository.save(invoicePayment);

    // Actualizar factura y ciclo
    const paidInvoice = pendingInvoice.markAsPaid(paymentMethod, paymentDate);
    await invoiceRepository.update(paidInvoice);

    remainingAmount -= amountToApply;
  }

  // Si sobra, convertir a crédito
  if (remainingAmount > 0) {
    const subscription = await subscriptionRepository.findById(subscriptionId);
    const updatedSubscription = subscription.addCredit(remainingAmount);
    await subscriptionRepository.update(updatedSubscription);
  }
}
```

### **Ventajas de Aplicar Automáticamente**

- ✅ Mejora la experiencia del partner (no necesita especificar factura)
- ✅ Reduce la carga administrativa
- ✅ Garantiza que los pagos se apliquen correctamente
- ✅ Mantiene el estado de cuenta actualizado

---

## 🎯 Cuándo se Activa el Billing Cycle

### **Al Registrar una Suscripción**

Cuando un partner registra su suscripción (ya sea al crear el partner o al procesar una solicitud):

1. **Se crea la suscripción** con:
   - `startDate`: Fecha de inicio
   - `renewalDate`: Fecha de renovación
   - `nextBillingDate`: **Fecha en que se generará el primer ciclo** (normalmente igual a `renewalDate` o `startDate + billingFrequency`)
   - `currentPeriodStart`: Fecha de inicio del período actual
   - `currentPeriodEnd`: Fecha de fin del período actual

2. **NO se genera automáticamente un BillingCycle** al crear la suscripción
   - El partner tiene un período inicial (trial o período pagado) sin facturación
   - El primer ciclo se generará cuando `nextBillingDate <= hoy`

### **Cuándo se Genera el Primer Ciclo**

El primer ciclo se genera automáticamente cuando:

```
nextBillingDate <= hoy (fecha actual)
```

Esto sucede mediante el cron job diario que se ejecuta a las 2:00 AM.

### **Ejemplo de Flujo**

```
Día 1 (2024-01-01): Partner registra suscripción
- startDate: 2024-01-01
- currentPeriodStart: 2024-01-01
- currentPeriodEnd: 2024-01-31
- nextBillingDate: 2024-02-01
- Estado: Partner puede usar el servicio sin facturación

Día 32 (2024-02-01): Cron job detecta nextBillingDate = hoy
- Se genera BillingCycle #1
- Se crea Invoice #1
- Se envía email al partner
- Se actualiza:
  - currentPeriodStart: 2024-02-01
  - currentPeriodEnd: 2024-02-29
  - nextBillingDate: 2024-03-01

Día 33-60: Partner usa el servicio
- Factura pendiente de pago
- Partner puede pagar en cualquier momento

Día 61 (2024-03-01): Cron job detecta nextBillingDate = hoy
- Se genera BillingCycle #2
- Se crea Invoice #2
- ... y así sucesivamente
```

### **Mejores Prácticas**

#### **✅ RECOMENDADO: Sistema Automático**

**Ventajas:**
- ✅ No requiere intervención manual
- ✅ Garantiza facturación puntual
- ✅ Reduce errores humanos
- ✅ Escalable para muchos partners

**Cuándo usar:**
- Producción con muchos partners
- Facturación recurrente estándar
- Cuando quieres automatizar completamente

#### **⚠️ ALTERNATIVA: Generación Manual desde UI**

**Cuándo usar:**
- Casos especiales o ajustes manuales
- Facturación anticipada
- Corrección de errores
- Testing y desarrollo
- Partners con necesidades especiales

**Cómo hacerlo:**
1. Admin accede al UI
2. Selecciona la suscripción
3. Hace clic en "Generar Ciclo de Facturación"
4. El sistema genera el ciclo e invoice automáticamente

### **Recomendación Final**

**Para producción:** Usa el sistema automático (cron job) como método principal. El sistema ya está implementado y funcionando correctamente.

**Para casos especiales:** Mantén la opción de generación manual desde el UI para flexibilidad.

**Flujo recomendado:**
1. Al crear suscripción → NO generar ciclo automáticamente
2. Esperar a que `nextBillingDate` llegue
3. Cron job genera ciclo automáticamente
4. Partner recibe factura y puede pagar
5. Si hay pagos excedentes → Convertir a crédito o aplicar a facturas pendientes

---

## 🚀 Próximos Pasos Sugeridos

### **Fase 1: Mejoras al Sistema Actual (Prioridad Alta)**

1. **Implementar aplicación automática de pagos excedentes**
   - Modificar `CreatePaymentHandler` para aplicar pagos sin factura a facturas pendientes
   - Convertir excedentes a crédito automáticamente
   - Crear método `addCredit()` en `PartnerSubscription`

2. **Actualizar suscripción al registrar pago**
   - Implementar actualización de `lastPaymentDate` y `lastPaymentAmount` en `CreatePaymentHandler`
   - Crear método `updateLastPayment()` en `PartnerSubscription`

3. **Endpoint de estado de cuenta**
   - Crear `GetPartnerAccountBalanceHandler`
   - Endpoint: `GET /admin/partners/:partnerId/account-balance`
   - Retornar: pagos totales, facturas pendientes, crédito disponible, saldo pendiente

### **Fase 2: Integraciones (Prioridad Media)**

4. **Integración completa con gateway de pagos**
   - Webhooks para recibir confirmaciones automáticas de Stripe/PayPal
   - Procesamiento automático de pagos recurrentes
   - Manejo de pagos fallidos y reintentos automáticos

5. **Sistema de créditos mejorado**
   - Historial de créditos aplicados
   - Transferencia de créditos entre partners (si aplica)
   - Aplicación automática de créditos a facturas pendientes

### **Fase 3: Reportes y Analytics (Prioridad Baja)**

6. **Dashboard de estado de cuenta**
   - Vista consolidada para partners
   - Historial de pagos y facturas
   - Gráficos de tendencias

7. **Reportes de facturación**
   - Reportes mensuales/anuales
   - Análisis de pagos pendientes y vencidos
   - Exportación a Excel/PDF

---

## 📝 Ejemplo de Uso Completo

### **1. Crear Suscripción**

```bash
POST /admin/subscriptions
{
  "partnerId": 1,
  "planId": "conecta",
  "planType": "conecta",
  "billingFrequency": "monthly",
  "billingAmount": 99.99,
  "startDate": "2024-01-01",
  "renewalDate": "2025-01-01",
  "nextBillingDate": "2024-02-01"
}
```

### **2. Generar Ciclo de Facturación (Manual o Automático)**

```bash
# Manual
POST /admin/billing-cycles
{
  "subscriptionId": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "billingDate": "2024-02-01",
  "dueDate": "2024-02-08",
  "amount": 99.99
}

# Esto debería generar automáticamente:
# - BillingCycle con cycleNumber = 1
# - Invoice con número único
# - Email al partner
```

### **3. Registrar Pago**

```bash
POST /admin/payments
{
  "subscriptionId": 1,
  "invoiceId": 1,
  "billingCycleId": 1,
  "amount": 99.99,
  "paymentMethod": "credit_card",
  "gateway": "stripe",
  "gatewayTransactionId": "txn_123456",
  "status": "paid"
}

# Esto debería actualizar automáticamente:
# - Payment.status = 'paid'
# - Invoice.status = 'paid', Invoice.paidDate = ahora
# - BillingCycle.status = 'paid', BillingCycle.paidAmount = 99.99
# - Subscription.lastPaymentDate = ahora
```

### **4. Consultar Estados**

```bash
# Ver ciclos de una suscripción
GET /admin/billing-cycles?subscriptionId=1

# Ver facturas de un partner
GET /admin/invoices?partnerId=1

# Ver pagos de una factura
GET /admin/payments?invoiceId=1
```

---

---

## 📝 Resumen Ejecutivo

### **Estado Actual del Sistema**

✅ **FUNCIONANDO:**
- Generación automática de ciclos de facturación (cron job diario)
- Creación automática de facturas con números únicos
- Generación de PDFs de facturas
- Envío de emails de notificación
- Registro de pagos con actualización automática de estados
- Endpoints REST completos para gestión manual

⚠️ **MEJORAS RECOMENDADAS:**
- Aplicación automática de pagos excedentes a facturas pendientes
- Conversión automática de excedentes a crédito
- Actualización de `lastPaymentDate` en suscripción al pagar
- Endpoint de estado de cuenta del partner

### **Flujo Recomendado para Producción**

1. **Al crear suscripción:** NO generar ciclo automáticamente
2. **Cuando llega `nextBillingDate`:** Cron job genera ciclo e invoice automáticamente
3. **Partner recibe factura:** Por email con PDF adjunto
4. **Partner realiza pago:** Se registra y actualiza estados automáticamente
5. **Si hay excedente:** Se aplica a facturas pendientes o se convierte a crédito

### **Manejo de Estado de Cuenta**

El estado de cuenta se calcula dinámicamente:
- **Total pagado:** Suma de todos los pagos exitosos
- **Total pendiente:** Suma de todas las facturas pendientes
- **Saldo pendiente:** Total pendiente - crédito disponible
- **Crédito disponible:** Crédito no aplicado a facturas

---

**Última actualización:** 2025-01-20

