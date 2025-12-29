# Guía de Integración con Stripe

## 📚 ¿Qué es Stripe?

**Stripe** es una plataforma de pagos en línea que permite a las empresas aceptar pagos con tarjeta de crédito/débito, transferencias bancarias y otros métodos de pago de forma segura.

### ¿Por qué usar Stripe?

- ✅ **Seguridad**: Maneja todos los datos sensibles de tarjetas (PCI compliance)
- ✅ **Fácil integración**: API simple y bien documentada
- ✅ **Múltiples métodos de pago**: Tarjetas, Apple Pay, Google Pay, etc.
- ✅ **Webhooks**: Notificaciones automáticas cuando ocurren eventos
- ✅ **Internacional**: Soporta múltiples monedas y países

---

## 🏗️ Arquitectura de la Integración

### Flujo Básico de Pago con Stripe

```
┌─────────────┐
│   Frontend  │
│  (Cliente)  │
└──────┬──────┘
       │
       │ 1. Cliente quiere pagar factura
       ▼
┌─────────────────────────────────────┐
│   TuLealtApp Backend                │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ PaymentGatewayService         │  │
│  │ - createPaymentIntent()       │  │
│  └──────────┬───────────────────┘  │
│             │                        │
│             │ 2. Crea PaymentIntent │
│             ▼                        │
│  ┌──────────────────────────────┐  │
│  │ Stripe API                    │  │
│  │ (Servidor de Stripe)          │  │
│  └──────────┬───────────────────┘  │
│             │                        │
│             │ 3. Retorna clientSecret│
│             ▼                        │
│  ┌──────────────────────────────┐  │
│  │ Retorna a Frontend            │  │
│  │ { clientSecret: "pi_xxx..." } │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
       │
       │ 4. Frontend usa clientSecret
       ▼
┌─────────────────────────────────────┐
│   Stripe.js (Frontend)              │
│   - confirmPayment()                 │
└──────────┬──────────────────────────┘
           │
           │ 5. Procesa pago
           ▼
┌─────────────────────────────────────┐
│   Stripe API                        │
│   - Procesa el pago                 │
└──────────┬──────────────────────────┘
           │
           │ 6. Webhook (notificación)
           ▼
┌─────────────────────────────────────┐
│   PaymentWebhooksController         │
│   - handleStripeWebhook()           │
│   - Actualiza estados en BD          │
│   - Envía email de confirmación     │
└─────────────────────────────────────┘
```

---

## 🔧 Componentes Implementados

### 1. PaymentGatewayService

**Ubicación:** `libs/infrastructure/src/services/payment-gateway.service.ts`

**¿Qué hace?**
- Se comunica con la API de Stripe
- Crea PaymentIntents (intenciones de pago)
- Maneja webhooks (notificaciones de Stripe)
- Crea Customers (clientes) en Stripe

**Métodos principales:**

#### `createPaymentIntent()`
Crea una intención de pago en Stripe. Esto es lo que necesitas para iniciar un pago.

```typescript
// Ejemplo de uso:
const paymentIntent = await paymentGatewayService.createPaymentIntent(
  9999,           // Monto en centavos (99.99 USD)
  'usd',          // Moneda
  {
    invoiceId: '1',
    subscriptionId: '1',
    billingCycleId: '1'
  }
);

// Retorna:
// {
//   id: 'pi_1234567890',
//   client_secret: 'pi_1234567890_secret_xxx',
//   status: 'requires_payment_method',
//   ...
// }
```

**¿Qué es un PaymentIntent?**
- Es un objeto en Stripe que representa una intención de cobrar una cantidad específica
- Tiene un `client_secret` que el frontend usa para confirmar el pago
- Puede estar en diferentes estados: `requires_payment_method`, `requires_confirmation`, `succeeded`, `failed`

#### `handleWebhook()`
Valida y procesa las notificaciones que Stripe envía cuando ocurre un evento (pago exitoso, fallido, etc.)

---

### 2. PaymentWebhooksController

**Ubicación:** `apps/admin-api/src/controllers/payment-webhooks.controller.ts`

**¿Qué hace?**
- Recibe webhooks de Stripe
- Procesa eventos automáticamente
- Actualiza el estado de pagos, facturas y ciclos en la base de datos

**Endpoint:** `POST /admin/payment-webhooks/stripe`

**Eventos que maneja:**
- `payment_intent.succeeded` - Cuando un pago es exitoso
- `payment_intent.payment_failed` - Cuando un pago falla
- `charge.refunded` - Cuando se hace un reembolso

---

## 📝 Ejemplos de Uso Completo

### Escenario 1: Cliente quiere pagar una factura

#### Paso 1: Frontend solicita crear un PaymentIntent

```typescript
// En el frontend (React, Angular, etc.)
const response = await fetch('http://localhost:3000/admin/payments/create-intent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
  },
  body: JSON.stringify({
    invoiceId: 1,
    amount: 99.99,
    currency: 'USD'
  })
});

const { clientSecret, paymentIntentId } = await response.json();
```

#### Paso 2: Backend crea el PaymentIntent

```typescript
// En el backend (nuevo endpoint que necesitarías crear)
@Post('payments/create-intent')
async createPaymentIntent(@Body() request: CreatePaymentIntentRequest) {
  const paymentIntent = await this.paymentGatewayService.createPaymentIntent(
    request.amount * 100, // Convertir a centavos
    request.currency,
    {
      invoiceId: request.invoiceId.toString(),
      subscriptionId: request.subscriptionId?.toString(),
      billingCycleId: request.billingCycleId?.toString()
    }
  );

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id
  };
}
```

#### Paso 3: Frontend confirma el pago con Stripe.js

```typescript
// En el frontend, usando Stripe.js
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_...'); // Tu clave pública de Stripe

const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement, // Elemento de tarjeta de Stripe
    billing_details: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  }
});

if (error) {
  console.error('Error:', error);
} else if (paymentIntent.status === 'succeeded') {
  console.log('¡Pago exitoso!');
  // Stripe automáticamente enviará un webhook a tu backend
}
```

#### Paso 4: Stripe envía webhook automáticamente

```typescript
// Stripe automáticamente hace POST a:
// POST http://tu-servidor.com/admin/payment-webhooks/stripe

// El PaymentWebhooksController procesa el evento:
// 1. Valida la firma del webhook
// 2. Detecta que es payment_intent.succeeded
// 3. Crea registro de pago en tu BD
// 4. Actualiza estado de factura a 'paid'
// 5. Envía email de confirmación al partner
```

---

### Escenario 2: Pago manual (sin Stripe)

Si prefieres registrar pagos manualmente (efectivo, transferencia bancaria, etc.), puedes usar el endpoint existente:

```bash
POST /admin/payments
{
  "subscriptionId": 1,
  "invoiceId": 1,
  "amount": 99.99,
  "currency": "USD",
  "paymentMethod": "cash",
  "status": "paid",
  "confirmationCode": "CASH-123456"
}
```

---

## 🔐 Configuración Necesaria

### 1. Obtener credenciales de Stripe

1. Ve a https://stripe.com y crea una cuenta
2. En el Dashboard, ve a **Developers > API keys**
3. Obtén:
   - **Secret Key** (empieza con `sk_test_` o `sk_live_`)
   - **Publishable Key** (empieza con `pk_test_` o `pk_live_`)
   - **Webhook Secret** (se genera cuando configuras un webhook)

### 2. Configurar variables de entorno

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

### 3. Configurar Webhook en Stripe Dashboard

1. Ve a **Developers > Webhooks**
2. Click en **Add endpoint**
3. URL: `https://tu-servidor.com/admin/payment-webhooks/stripe`
4. Selecciona eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copia el **Signing secret** y úsalo como `STRIPE_WEBHOOK_SECRET`

---

## 💡 Casos de Uso Comunes

### Caso 1: Partner paga su suscripción mensual

```
1. Sistema genera factura automáticamente (BillingCycleGeneratorService)
2. Email enviado al partner con factura y PDF
3. Partner hace clic en "Pagar ahora" en el email
4. Frontend crea PaymentIntent
5. Partner ingresa datos de tarjeta
6. Stripe procesa el pago
7. Webhook actualiza estado automáticamente
8. Email de confirmación enviado
```

### Caso 2: Admin registra pago manual

```
1. Admin ve factura pendiente en dashboard
2. Partner paga en efectivo en sucursal
3. Admin registra pago manualmente:
   POST /admin/payments
   {
     "invoiceId": 1,
     "paymentMethod": "cash",
     "amount": 99.99,
     "status": "paid"
   }
4. Sistema actualiza estados y envía email
```

### Caso 3: Pago fallido y reintento

```
1. Partner intenta pagar pero tarjeta es rechazada
2. Stripe envía webhook payment_intent.payment_failed
3. Sistema registra el intento fallido
4. Sistema envía email al partner informando del fallo
5. Partner puede reintentar con otra tarjeta
```

---

## 🎯 Ventajas de Usar Stripe

### Para el Negocio:
- ✅ **No necesitas manejar datos de tarjetas** (muy seguro, cumple PCI)
- ✅ **Pagos internacionales** fáciles
- ✅ **Múltiples métodos** automáticamente (Apple Pay, Google Pay, etc.)
- ✅ **Reembolsos** fáciles de manejar
- ✅ **Reportes** y analytics en el dashboard de Stripe

### Para el Desarrollo:
- ✅ **API simple** y bien documentada
- ✅ **Webhooks automáticos** - no necesitas hacer polling
- ✅ **SDKs** para múltiples lenguajes
- ✅ **Testing** fácil con tarjetas de prueba

---

## 🧪 Modo de Prueba (Testing)

Stripe tiene un modo de prueba con tarjetas especiales:

```typescript
// Tarjetas de prueba:
'4242 4242 4242 4242' // Pago exitoso
'4000 0000 0000 0002' // Pago rechazado
'4000 0000 0000 9995' // Requiere autenticación 3D Secure

// Cualquier fecha futura, cualquier CVC
```

---

## 📋 Endpoints que Necesitarías Crear

Para una integración completa, podrías agregar estos endpoints:

### 1. Crear PaymentIntent
```typescript
POST /admin/payments/create-intent
{
  "invoiceId": 1,
  "amount": 99.99,
  "currency": "USD"
}

Response:
{
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx"
}
```

### 2. Verificar estado de pago
```typescript
GET /admin/payments/intent/:paymentIntentId

Response:
{
  "status": "succeeded",
  "amount": 9999,
  "currency": "usd"
}
```

---

## 🔄 Flujo Completo: De Factura a Pago Exitoso

```
1. Sistema genera factura automáticamente
   ↓
2. PDF generado y subido a S3
   ↓
3. Email enviado al partner con factura
   ↓
4. Partner hace clic en "Pagar"
   ↓
5. Frontend solicita PaymentIntent al backend
   ↓
6. Backend crea PaymentIntent en Stripe
   ↓
7. Frontend muestra formulario de pago (Stripe Elements)
   ↓
8. Partner ingresa datos de tarjeta
   ↓
9. Frontend confirma pago con Stripe.js
   ↓
10. Stripe procesa el pago
    ↓
11. Stripe envía webhook a tu backend
    ↓
12. Backend actualiza:
    - Payment.status = 'paid'
    - Invoice.status = 'paid'
    - BillingCycle.status = 'paid'
    ↓
13. Email de confirmación enviado al partner
    ↓
14. ✅ Todo completado automáticamente
```

---

## ⚠️ Importante

### Seguridad
- **NUNCA** expongas tu `STRIPE_SECRET_KEY` en el frontend
- **SIEMPRE** valida los webhooks usando `STRIPE_WEBHOOK_SECRET`
- Usa HTTPS en producción

### Costos
- Stripe cobra una comisión por transacción (típicamente 2.9% + $0.30)
- No hay costo mensual, solo por transacción
- Modo de prueba es gratis

---

## 📚 Recursos Adicionales

- [Documentación de Stripe](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe.js Reference](https://stripe.com/docs/js)

---

**¿Necesitas ayuda con algo específico de Stripe?** Puedo ayudarte a:
- Crear los endpoints faltantes
- Implementar el frontend con Stripe.js
- Configurar webhooks
- Manejar casos especiales (reembolsos, disputas, etc.)

