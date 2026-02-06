# Guía Frontend: Ajuste Manual de Puntos

## 📋 Resumen Ejecutivo

Esta guía explica cómo implementar la funcionalidad de **ajuste manual de puntos** para customers desde el frontend del Partner Portal. Permite a los partners agregar o quitar puntos manualmente por razones como bonificaciones, correcciones, penalizaciones, etc.

**Roles autorizados**: `PARTNER`, `ADMIN`

**Endpoint**: `POST /partner/customers/:id/points/adjustment`

---

## 🎯 Casos de Uso Comunes

1. **Bonificaciones especiales**: Cumpleaños, aniversarios, promociones
2. **Correcciones**: Errores en acumulación de puntos
3. **Compensaciones**: Problemas con el servicio, gestos de buena voluntad
4. **Penalizaciones**: Violaciones de políticas, devoluciones sin comprobante
5. **Ajustes administrativos**: Migración de datos, correcciones masivas

---

## 🔐 Autenticación y Permisos

### Requisitos
- Usuario debe estar autenticado (JWT token)
- Usuario debe tener rol `PARTNER` o `ADMIN`
- El customer debe pertenecer al partner del usuario autenticado

### Headers Requeridos
```javascript
{
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}
```

---

## 📡 Especificación del Endpoint

### Request

**Método**: `POST`

**URL**: `/partner/customers/:id/points/adjustment`

**Parámetros de URL**:
- `:id` - ID de la membership (customer) - Número entero

**Body** (JSON):
```typescript
{
  pointsDelta: number;           // Obligatorio: positivo para agregar, negativo para quitar
  reasonCode: string;            // Obligatorio: código que identifica la razón
  metadata?: Record<string, any>; // Opcional: información adicional
}
```

### Response (201 Created)

```typescript
{
  transaction: {
    id: number;
    type: 'ADJUSTMENT';
    pointsDelta: number;
    reasonCode: string;
    createdBy: string;
    createdAt: string; // ISO 8601
    metadata: {
      adjustmentType: 'ADD' | 'SUBTRACT';
      previousBalance: number;
      // ... otros campos del metadata del request
    };
  };
  newBalance: number; // Balance actualizado después del ajuste
}
```

---

## 🧩 Campos del Request Detallados

### 1. `pointsDelta` (obligatorio)

**Tipo**: `number` (entero)

**Descripción**: Cantidad de puntos a ajustar

**Validaciones**:
- Debe ser un número entero
- **No puede ser 0**
- Si es positivo: agrega puntos
- Si es negativo: quita puntos (valida que no resulte en balance negativo)

**Ejemplos**:
```javascript
{ pointsDelta: 100 }   // ✅ Agrega 100 puntos
{ pointsDelta: -50 }   // ✅ Quita 50 puntos
{ pointsDelta: 0 }     // ❌ Error: no puede ser cero
```

### 2. `reasonCode` (obligatorio)

**Tipo**: `string`

**Descripción**: Código que identifica la razón del ajuste (para auditoría)

**Validaciones**:
- No puede estar vacío
- String no vacío

**Códigos Recomendados**:
- `CORRECTION` - Corrección de error
- `BONUS` - Bonificación general
- `BONUS_BIRTHDAY` - Bono de cumpleaños
- `BONUS_ANNIVERSARY` - Bono de aniversario
- `PROMOTIONAL` - Promocional
- `COMPENSATION` - Compensación
- `GOODWILL` - Gesto de buena voluntad
- `PENALTY` - Penalización
- `POLICY_VIOLATION` - Violación de política
- `REFUND_ADJUSTMENT` - Ajuste por reembolso
- `MIGRATION` - Migración de datos
- `MANUAL_CORRECTION` - Corrección manual

**Ejemplos**:
```javascript
{ reasonCode: 'BONUS_BIRTHDAY' }
{ reasonCode: 'CORRECTION' }
{ reasonCode: 'PENALTY' }
```

### 3. `metadata` (opcional)

**Tipo**: `object` (Record<string, any>)

**Descripción**: Metadatos adicionales para contexto y auditoría

**Campos Sugeridos** (todos opcionales):
```typescript
{
  reason?: string;           // Descripción textual de la razón
  notes?: string;            // Notas adicionales
  approvedBy?: string;       // Quién aprobó el ajuste
  campaign?: string;         // Nombre de campaña (si aplica)
  originalTransactionId?: string; // ID de transacción relacionada
  referenceId?: string;      // ID de referencia externa
  // ... cualquier otro campo relevante
}
```

---

## 💻 Implementación Frontend

### Ejemplo con Fetch API (JavaScript)

```javascript
/**
 * Ajusta puntos de un customer
 * @param {number} membershipId - ID de la membership del customer
 * @param {number} pointsDelta - Puntos a ajustar (positivo o negativo)
 * @param {string} reasonCode - Código de razón
 * @param {object} metadata - Metadatos opcionales
 * @returns {Promise<object>} Respuesta con transacción y nuevo balance
 */
async function adjustCustomerPoints(membershipId, pointsDelta, reasonCode, metadata = {}) {
  const token = localStorage.getItem('authToken'); // O tu método de obtener el token
  
  const response = await fetch(`/partner/customers/${membershipId}/points/adjustment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pointsDelta,
      reasonCode,
      metadata,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al ajustar puntos');
  }

  return await response.json();
}

// Uso:
try {
  const result = await adjustCustomerPoints(
    15,                    // membershipId
    100,                   // agregar 100 puntos
    'BONUS_BIRTHDAY',      // razón
    {
      birthdayMonth: 2,
      campaign: 'February Birthdays 2026'
    }
  );
  
  console.log('Ajuste exitoso:', result);
  console.log('Nuevo balance:', result.newBalance);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Ejemplo con Axios (JavaScript)

```javascript
import axios from 'axios';

/**
 * Servicio para ajustar puntos
 */
class PointsAdjustmentService {
  constructor(baseURL, getToken) {
    this.baseURL = baseURL;
    this.getToken = getToken;
  }

  async adjustPoints(membershipId, pointsDelta, reasonCode, metadata = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}/partner/customers/${membershipId}/points/adjustment`,
        {
          pointsDelta,
          reasonCode,
          metadata,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.getToken()}`,
          },
        }
      );
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async addPoints(membershipId, points, reasonCode, metadata = {}) {
    return this.adjustPoints(membershipId, Math.abs(points), reasonCode, metadata);
  }

  async subtractPoints(membershipId, points, reasonCode, metadata = {}) {
    return this.adjustPoints(membershipId, -Math.abs(points), reasonCode, metadata);
  }
}

// Uso:
const service = new PointsAdjustmentService(
  'https://api.example.com',
  () => localStorage.getItem('authToken')
);

// Agregar puntos
const addResult = await service.addPoints(
  15,
  100,
  'BONUS_BIRTHDAY',
  { birthdayMonth: 2 }
);

// Quitar puntos
const subtractResult = await service.subtractPoints(
  15,
  50,
  'PENALTY',
  { reason: 'Policy violation' }
);
```

### Ejemplo con React + TypeScript

```typescript
import { useState } from 'react';
import axios, { AxiosError } from 'axios';

// Tipos
interface AdjustPointsRequest {
  pointsDelta: number;
  reasonCode: string;
  metadata?: Record<string, any>;
}

interface AdjustPointsResponse {
  transaction: {
    id: number;
    type: 'ADJUSTMENT';
    pointsDelta: number;
    reasonCode: string;
    createdBy: string;
    createdAt: string;
    metadata: Record<string, any>;
  };
  newBalance: number;
}

interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

// Hook personalizado
function usePointsAdjustment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adjustPoints = async (
    membershipId: number,
    data: AdjustPointsRequest
  ): Promise<AdjustPointsResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await axios.post<AdjustPointsResponse>(
        `/partner/customers/${membershipId}/points/adjustment`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      setLoading(false);
      return response.data;
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      const errorMessage = axiosError.response?.data?.message || 'Error al ajustar puntos';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  };

  return { adjustPoints, loading, error };
}

// Componente de ejemplo
function PointsAdjustmentForm({ membershipId, currentBalance, onSuccess }: {
  membershipId: number;
  currentBalance: number;
  onSuccess?: (newBalance: number) => void;
}) {
  const [pointsDelta, setPointsDelta] = useState<number>(0);
  const [reasonCode, setReasonCode] = useState<string>('BONUS');
  const [notes, setNotes] = useState<string>('');
  
  const { adjustPoints, loading, error } = usePointsAdjustment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pointsDelta === 0) {
      alert('Los puntos no pueden ser cero');
      return;
    }

    const result = await adjustPoints(membershipId, {
      pointsDelta,
      reasonCode,
      metadata: {
        notes,
        previousBalance: currentBalance,
      },
    });

    if (result) {
      alert(`Ajuste exitoso! Nuevo balance: ${result.newBalance}`);
      onSuccess?.(result.newBalance);
      // Resetear formulario
      setPointsDelta(0);
      setNotes('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Puntos a ajustar:</label>
        <input
          type="number"
          value={pointsDelta}
          onChange={(e) => setPointsDelta(parseInt(e.target.value))}
          placeholder="100 o -50"
          required
        />
        <small>Positivo para agregar, negativo para quitar</small>
      </div>

      <div>
        <label>Razón:</label>
        <select
          value={reasonCode}
          onChange={(e) => setReasonCode(e.target.value)}
          required
        >
          <option value="BONUS">Bonificación</option>
          <option value="BONUS_BIRTHDAY">Cumpleaños</option>
          <option value="CORRECTION">Corrección</option>
          <option value="COMPENSATION">Compensación</option>
          <option value="PENALTY">Penalización</option>
          <option value="PROMOTIONAL">Promocional</option>
        </select>
      </div>

      <div>
        <label>Notas (opcional):</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Descripción adicional..."
        />
      </div>

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Procesando...' : 'Ajustar Puntos'}
      </button>
    </form>
  );
}

export default PointsAdjustmentForm;
```

---

## 🎨 Flujo de UI Recomendado

### 1. Vista de Listado de Customers

```
┌─────────────────────────────────────────────────┐
│ Clientes                                        │
├─────────────────────────────────────────────────┤
│ Nombre       | Email          | Puntos | Acciones│
│ John Doe     | john@email.com | 1,500  | [Ajustar]│
│ Jane Smith   | jane@email.com |   800  | [Ajustar]│
└─────────────────────────────────────────────────┘
```

### 2. Modal/Drawer de Ajuste

```
┌─────────────────────────────────────────────────┐
│ Ajustar Puntos - John Doe                      │
├─────────────────────────────────────────────────┤
│ Balance actual: 1,500 puntos                    │
│                                                 │
│ Tipo de ajuste:                                 │
│ ○ Agregar puntos  ● Quitar puntos              │
│                                                 │
│ Cantidad de puntos: [____100____]              │
│                                                 │
│ Razón:                                          │
│ [Seleccionar razón ▼]                          │
│                                                 │
│ Notas (opcional):                               │
│ ┌─────────────────────────────────────────────┐│
│ │                                             ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ Vista previa:                                   │
│ Balance actual:  1,500 puntos                  │
│ Ajuste:         -  100 puntos                  │
│ ─────────────────────────────                  │
│ Nuevo balance:   1,400 puntos                  │
│                                                 │
│ [Cancelar]              [Confirmar Ajuste]     │
└─────────────────────────────────────────────────┘
```

### 3. Confirmación

```
┌─────────────────────────────────────────────────┐
│ ✓ Ajuste Exitoso                                │
├─────────────────────────────────────────────────┤
│ Se ajustaron -100 puntos a John Doe             │
│                                                 │
│ Nuevo balance: 1,400 puntos                     │
│                                                 │
│ [Aceptar]                                       │
└─────────────────────────────────────────────────┘
```

---

## ⚠️ Manejo de Errores

### Errores Comunes y Cómo Manejarlos

#### 1. Error 400: pointsDelta es 0

**Respuesta del servidor**:
```json
{
  "statusCode": 400,
  "message": "pointsDelta must be non-zero for adjustments",
  "error": "Bad Request"
}
```

**Manejo en frontend**:
```javascript
if (pointsDelta === 0) {
  showError('Los puntos no pueden ser cero. Ingresa una cantidad positiva o negativa.');
  return;
}
```

#### 2. Error 400: Balance negativo

**Respuesta del servidor**:
```json
{
  "statusCode": 400,
  "message": "Adjustment would result in negative balance. Current balance: 30, Adjustment: -50",
  "error": "Bad Request"
}
```

**Manejo en frontend**:
```javascript
// Validación previa
if (pointsDelta < 0 && Math.abs(pointsDelta) > currentBalance) {
  showError(`No se puede quitar ${Math.abs(pointsDelta)} puntos. Balance actual: ${currentBalance}`);
  return;
}

// Manejo de error del servidor
if (error.statusCode === 400 && error.message.includes('negative balance')) {
  showError('El ajuste resultaría en un balance negativo. Verifica la cantidad de puntos.');
}
```

#### 3. Error 400: reasonCode vacío

**Respuesta del servidor**:
```json
{
  "statusCode": 400,
  "message": "reasonCode is required for adjustments",
  "error": "Bad Request"
}
```

**Manejo en frontend**:
```javascript
if (!reasonCode || reasonCode.trim() === '') {
  showError('Debes seleccionar una razón para el ajuste');
  return;
}
```

#### 4. Error 403: Customer no pertenece al partner

**Respuesta del servidor**:
```json
{
  "statusCode": 403,
  "message": "Customer does not belong to your partner",
  "error": "Forbidden"
}
```

**Manejo en frontend**:
```javascript
if (error.statusCode === 403) {
  showError('No tienes permisos para ajustar puntos de este cliente');
  // Redireccionar o cerrar modal
}
```

#### 5. Error 404: Customer no encontrado

**Respuesta del servidor**:
```json
{
  "statusCode": 404,
  "message": "Membership with ID 999 not found",
  "error": "Not Found"
}
```

**Manejo en frontend**:
```javascript
if (error.statusCode === 404) {
  showError('Cliente no encontrado. Actualiza la lista de clientes.');
  // Refrescar lista
}
```

### Función de Manejo de Errores Centralizada

```typescript
function handleAdjustmentError(error: AxiosError<ApiError>): string {
  const statusCode = error.response?.status;
  const message = error.response?.data?.message || '';

  switch (statusCode) {
    case 400:
      if (message.includes('negative balance')) {
        return 'El ajuste resultaría en un balance negativo. Reduce la cantidad.';
      }
      if (message.includes('non-zero')) {
        return 'Los puntos no pueden ser cero.';
      }
      if (message.includes('reasonCode')) {
        return 'Debes seleccionar una razón para el ajuste.';
      }
      return message || 'Datos inválidos. Verifica la información.';
    
    case 401:
      return 'Tu sesión ha expirado. Vuelve a iniciar sesión.';
    
    case 403:
      return 'No tienes permisos para realizar este ajuste.';
    
    case 404:
      return 'Cliente no encontrado. Actualiza la lista.';
    
    case 500:
      return 'Error del servidor. Intenta nuevamente más tarde.';
    
    default:
      return 'Error inesperado. Contacta a soporte si persiste.';
  }
}

// Uso:
try {
  await adjustPoints(membershipId, data);
} catch (error) {
  const errorMessage = handleAdjustmentError(error as AxiosError<ApiError>);
  showToast(errorMessage, 'error');
}
```

---

## ✅ Validaciones del Frontend

### Validaciones Obligatorias

```javascript
function validateAdjustmentForm(data, currentBalance) {
  const errors = [];

  // 1. pointsDelta no puede ser 0
  if (data.pointsDelta === 0) {
    errors.push('Los puntos no pueden ser cero');
  }

  // 2. Si es negativo, no puede exceder balance actual
  if (data.pointsDelta < 0 && Math.abs(data.pointsDelta) > currentBalance) {
    errors.push(`No puedes quitar ${Math.abs(data.pointsDelta)} puntos. Balance actual: ${currentBalance}`);
  }

  // 3. reasonCode no puede estar vacío
  if (!data.reasonCode || data.reasonCode.trim() === '') {
    errors.push('Debes seleccionar una razón');
  }

  // 4. pointsDelta debe ser un número entero
  if (!Number.isInteger(data.pointsDelta)) {
    errors.push('Los puntos deben ser un número entero');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Uso:
const validation = validateAdjustmentForm({
  pointsDelta: -100,
  reasonCode: 'PENALTY',
}, currentBalance);

if (!validation.isValid) {
  validation.errors.forEach(error => showError(error));
  return;
}
```

### Validaciones Recomendadas

```javascript
function enhancedValidation(data, currentBalance, membershipInfo) {
  const errors = [];
  const warnings = [];

  // Validaciones obligatorias
  const basicValidation = validateAdjustmentForm(data, currentBalance);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Advertencia: ajuste muy grande
  const largeAdjustmentThreshold = 1000;
  if (Math.abs(data.pointsDelta) > largeAdjustmentThreshold) {
    warnings.push(`Estás ajustando ${Math.abs(data.pointsDelta)} puntos. ¿Estás seguro?`);
  }

  // Advertencia: dejar balance muy bajo
  if (data.pointsDelta < 0) {
    const newBalance = currentBalance + data.pointsDelta;
    if (newBalance < 50 && newBalance > 0) {
      warnings.push(`El nuevo balance será muy bajo (${newBalance} puntos)`);
    }
  }

  // Advertencia: reasonCode genérico con metadata vacío
  if (data.reasonCode === 'CORRECTION' && !data.metadata?.notes) {
    warnings.push('Considera agregar notas para explicar la corrección');
  }

  return {
    isValid: true,
    errors: [],
    warnings,
  };
}
```

---

## 📊 Ejemplos Completos de Casos de Uso

### Caso 1: Bono de Cumpleaños

```javascript
// Agregar 100 puntos por cumpleaños
const result = await adjustCustomerPoints(15, {
  pointsDelta: 100,
  reasonCode: 'BONUS_BIRTHDAY',
  metadata: {
    birthdayMonth: 2,
    campaign: 'February Birthdays 2026',
    notes: 'Bono automático por cumpleaños',
  },
});

// Respuesta esperada:
{
  "transaction": {
    "id": 1234,
    "type": "ADJUSTMENT",
    "pointsDelta": 100,
    "reasonCode": "BONUS_BIRTHDAY",
    "createdBy": "USER_42",
    "createdAt": "2026-02-05T10:30:00Z",
    "metadata": {
      "birthdayMonth": 2,
      "campaign": "February Birthdays 2026",
      "notes": "Bono automático por cumpleaños",
      "adjustmentType": "ADD",
      "previousBalance": 500
    }
  },
  "newBalance": 600
}
```

### Caso 2: Corrección de Error

```javascript
// El customer debería haber recibido 50 puntos por una compra
// pero el sistema no los otorgó correctamente
const result = await adjustCustomerPoints(23, {
  pointsDelta: 50,
  reasonCode: 'CORRECTION',
  metadata: {
    originalPurchaseId: 'FAC-001234',
    correctionReason: 'Sistema no otorgó puntos por compra',
    approvedBy: 'manager@cafe.com',
    notes: 'Compra del 2026-02-03, monto $150',
  },
});
```

### Caso 3: Compensación por Problema de Servicio

```javascript
// Compensar al customer con 200 puntos por mal servicio
const result = await adjustCustomerPoints(45, {
  pointsDelta: 200,
  reasonCode: 'COMPENSATION',
  metadata: {
    incidentId: 'INC-2026-001',
    reason: 'Demora en servicio - espera de 45 minutos',
    approvedBy: 'supervisor@cafe.com',
    notes: 'Customer muy molesto, compensación por experiencia negativa',
  },
});
```

### Caso 4: Penalización por Violación de Política

```javascript
// Quitar 100 puntos por devolución sin comprobante
const result = await adjustCustomerPoints(67, {
  pointsDelta: -100,
  reasonCode: 'POLICY_VIOLATION',
  metadata: {
    reason: 'Devolución de producto sin comprobante',
    policyReference: 'POL-RET-001',
    approvedBy: 'manager@cafe.com',
    notes: 'Tercer incidente - aplicar política de penalización',
  },
});
```

### Caso 5: Ajuste Masivo en Promoción

```javascript
// Agregar 50 puntos a múltiples customers por participar en encuesta
const customerIds = [10, 15, 23, 45, 67];

async function bulkAdjustment(customerIds, pointsDelta, reasonCode, metadata) {
  const results = [];
  
  for (const customerId of customerIds) {
    try {
      const result = await adjustCustomerPoints(customerId, {
        pointsDelta,
        reasonCode,
        metadata,
      });
      results.push({ customerId, success: true, newBalance: result.newBalance });
    } catch (error) {
      results.push({ customerId, success: false, error: error.message });
    }
  }
  
  return results;
}

const results = await bulkAdjustment(
  customerIds,
  50,
  'PROMOTIONAL',
  {
    campaign: 'Encuesta de Satisfacción Q1 2026',
    notes: 'Bonificación por completar encuesta',
  }
);

console.log('Resultados:', results);
// [
//   { customerId: 10, success: true, newBalance: 650 },
//   { customerId: 15, success: true, newBalance: 750 },
//   ...
// ]
```

---

## 🔍 Testing y Debugging

### Casos de Prueba Recomendados

```javascript
// Suite de tests para ajuste de puntos
describe('Points Adjustment', () => {
  
  test('Agregar puntos positivos', async () => {
    const result = await adjustCustomerPoints(15, {
      pointsDelta: 100,
      reasonCode: 'BONUS',
    });
    expect(result.transaction.pointsDelta).toBe(100);
    expect(result.newBalance).toBe(currentBalance + 100);
  });

  test('Quitar puntos negativos', async () => {
    const result = await adjustCustomerPoints(15, {
      pointsDelta: -50,
      reasonCode: 'PENALTY',
    });
    expect(result.transaction.pointsDelta).toBe(-50);
    expect(result.newBalance).toBe(currentBalance - 50);
  });

  test('Error: puntos en cero', async () => {
    await expect(
      adjustCustomerPoints(15, {
        pointsDelta: 0,
        reasonCode: 'BONUS',
      })
    ).rejects.toThrow('pointsDelta must be non-zero');
  });

  test('Error: balance negativo', async () => {
    // Si currentBalance es 30
    await expect(
      adjustCustomerPoints(15, {
        pointsDelta: -50,
        reasonCode: 'PENALTY',
      })
    ).rejects.toThrow('negative balance');
  });

  test('Error: reasonCode vacío', async () => {
    await expect(
      adjustCustomerPoints(15, {
        pointsDelta: 100,
        reasonCode: '',
      })
    ).rejects.toThrow('reasonCode is required');
  });

  test('Con metadata', async () => {
    const result = await adjustCustomerPoints(15, {
      pointsDelta: 100,
      reasonCode: 'BONUS_BIRTHDAY',
      metadata: {
        birthdayMonth: 2,
        campaign: 'Test Campaign',
      },
    });
    expect(result.transaction.metadata.birthdayMonth).toBe(2);
    expect(result.transaction.metadata.campaign).toBe('Test Campaign');
  });
});
```

### Debugging con Console Logs

```javascript
async function adjustPointsWithDebug(membershipId, data) {
  console.group(`🔍 Ajuste de Puntos - Customer ${membershipId}`);
  
  console.log('📋 Request:', {
    membershipId,
    pointsDelta: data.pointsDelta,
    reasonCode: data.reasonCode,
    metadata: data.metadata,
  });

  const startTime = Date.now();

  try {
    const result = await adjustCustomerPoints(membershipId, data);
    const duration = Date.now() - startTime;

    console.log('✅ Success:', {
      transactionId: result.transaction.id,
      previousBalance: result.transaction.metadata.previousBalance,
      newBalance: result.newBalance,
      duration: `${duration}ms`,
    });

    console.groupEnd();
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('❌ Error:', {
      statusCode: error.response?.status,
      message: error.response?.data?.message,
      duration: `${duration}ms`,
    });

    console.groupEnd();
    throw error;
  }
}
```

---

## 📱 Consideraciones de UX

### 1. Confirmación Antes de Ejecutar

Siempre pide confirmación al usuario antes de ajustar puntos:

```javascript
function confirmAdjustment(pointsDelta, currentBalance) {
  const action = pointsDelta > 0 ? 'agregar' : 'quitar';
  const newBalance = currentBalance + pointsDelta;
  
  return window.confirm(
    `¿Estás seguro que deseas ${action} ${Math.abs(pointsDelta)} puntos?\n\n` +
    `Balance actual: ${currentBalance} puntos\n` +
    `Nuevo balance: ${newBalance} puntos\n\n` +
    `Esta acción quedará registrada en el historial.`
  );
}
```

### 2. Feedback Visual Claro

```javascript
// Mostrar estado de carga
function showLoading() {
  // Deshabilitar botón
  // Mostrar spinner
  // Cambiar texto a "Procesando..."
}

// Mostrar éxito
function showSuccess(newBalance) {
  // Toast/notificación verde
  // Actualizar balance en la UI
  // Cerrar modal después de 2 segundos
  showToast(`✓ Puntos ajustados exitosamente. Nuevo balance: ${newBalance}`, 'success');
}

// Mostrar error
function showError(message) {
  // Toast/notificación roja
  // Mantener modal abierto
  showToast(`✗ Error: ${message}`, 'error');
}
```

### 3. Vista Previa del Ajuste

```javascript
function BalancePreview({ currentBalance, pointsDelta }) {
  const newBalance = currentBalance + pointsDelta;
  const isAdding = pointsDelta > 0;
  
  return (
    <div className="balance-preview">
      <div className="row">
        <span>Balance actual:</span>
        <span>{currentBalance.toLocaleString()} puntos</span>
      </div>
      <div className={`row ${isAdding ? 'positive' : 'negative'}`}>
        <span>Ajuste:</span>
        <span>{isAdding ? '+' : ''}{pointsDelta.toLocaleString()} puntos</span>
      </div>
      <div className="row divider">
        <hr />
      </div>
      <div className="row total">
        <span><strong>Nuevo balance:</strong></span>
        <span><strong>{newBalance.toLocaleString()} puntos</strong></span>
      </div>
    </div>
  );
}
```

### 4. Historial de Ajustes

Después de un ajuste exitoso, muestra el historial:

```javascript
// Ver endpoint: GET /partner/customers/:id/points-transactions
// con filtro type=ADJUSTMENT

async function showAdjustmentHistory(membershipId) {
  const response = await fetch(
    `/partner/customers/${membershipId}/points-transactions?type=ADJUSTMENT&limit=10`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const data = await response.json();
  
  // Renderizar tabla de historial
  return data.transactions.map(tx => ({
    fecha: new Date(tx.createdAt).toLocaleDateString(),
    puntos: tx.pointsDelta,
    razon: tx.reasonCode,
    realizadoPor: tx.createdBy,
  }));
}
```

---

## 🎯 Checklist de Implementación

### Frontend Developer Checklist

- [ ] Implementar servicio/función para llamar al endpoint
- [ ] Agregar validación de formulario (pointsDelta no cero, reasonCode obligatorio)
- [ ] Agregar validación de balance (no permitir balance negativo)
- [ ] Implementar manejo de errores con mensajes claros
- [ ] Agregar confirmación antes de ejecutar ajuste
- [ ] Mostrar vista previa del balance antes/después
- [ ] Implementar feedback visual (loading, success, error)
- [ ] Actualizar balance en UI después de ajuste exitoso
- [ ] Agregar opción para ver historial de ajustes
- [ ] Implementar permisos (solo PARTNER/ADMIN)
- [ ] Agregar logging para debugging
- [ ] Testear casos de error (balance negativo, permisos, etc.)
- [ ] Testear con diferentes reasonCodes
- [ ] Verificar que metadata se envía correctamente
- [ ] Implementar accesibilidad (ARIA labels, keyboard navigation)

---

## 📞 Soporte y Contacto

Si encuentras problemas o tienes dudas sobre la implementación:

1. **Revisar logs del servidor**: El backend registra todos los ajustes
2. **Verificar token JWT**: Asegúrate de que el token sea válido y tenga permisos
3. **Consultar historial**: Usa el endpoint de transacciones para auditar ajustes
4. **Contactar a backend team**: Para issues con validaciones o permisos

---

## 📝 Changelog

### v1.0.0 (2026-02-05)
- ✅ Documentación inicial del endpoint de ajuste de puntos
- ✅ Ejemplos de implementación en JavaScript, TypeScript y React
- ✅ Guía de manejo de errores y validaciones
- ✅ Casos de uso y mejores prácticas de UX

---

**Última actualización**: 2026-02-05
