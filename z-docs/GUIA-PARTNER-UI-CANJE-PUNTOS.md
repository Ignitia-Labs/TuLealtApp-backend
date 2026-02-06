# Guía Partner UI: Canje de Puntos y Recompensas

Esta guía está diseñada específicamente para desarrolladores frontend que implementan la funcionalidad de canje de puntos y recompensas en **Partner UI**. Cubre dos escenarios principales de uso.

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Escenario 1: Validar Código de Canje](#escenario-1-validar-código-de-canje)
3. [Escenario 2: Canje Directo con QR](#escenario-2-canje-directo-con-qr)
4. [Endpoints Disponibles](#endpoints-disponibles)
5. [Implementación Completa](#implementación-completa)
6. [Manejo de Errores](#manejo-de-errores)
7. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Introducción

Partner UI permite a los partners gestionar canjes de recompensas para sus clientes de dos formas:

1. **Validar Código de Canje**: El cliente presenta un código generado previamente desde Customer UI
2. **Canje Directo con QR**: El partner escanea el QR del cliente y procesa el canje directamente

### Requisitos Previos

- Token de autenticación de Partner (JWT)
- Acceso a Partner API
- Permisos de `PARTNER` o `PARTNER_STAFF`

### Conceptos Clave

- **Membership**: Asociación entre cliente y tenant (incluye balance de puntos)
- **Reward**: Recompensa canjeable del catálogo
- **Redemption Code**: Código único generado al canjear (formato: `REWARD-ABC123-XYZ789`)
- **QR Code**: Código QR del cliente que identifica su membership

---

## 🔄 Escenario 1: Validar Código de Canje

### Descripción del Flujo

El cliente ha canjeado una recompensa previamente desde Customer UI y presenta el código al partner para validarlo y aplicar la recompensa.

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────┐
│  1. Cliente presenta código al partner                 │
│     Código: "REWARD-ABC123-XYZ789"                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  2. Partner ingresa código en Partner UI               │
│     Input: "REWARD-ABC123-XYZ789"                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  3. Validar código                                      │
│     POST /partner/rewards/validate-code                 │
│     Body: { "code": "REWARD-ABC123-XYZ789" }           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  4. Sistema valida y marca como usado                  │
│     ✅ Verifica pertenencia al tenant                   │
│     ✅ Verifica estado (pending)                        │
│     ✅ Verifica expiración                              │
│     ✅ Marca código como "used"                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  5. Mostrar información de recompensa                  │
│     • Nombre de recompensa                              │
│     • Categoría                                         │
│     • Puntos utilizados                                 │
│     • Estado: "used"                                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  6. Partner aplica recompensa                          │
│     (descuento, producto gratis, etc.)                  │
└─────────────────────────────────────────────────────────┘
```

### Implementación Paso a Paso

#### Paso 1: Servicio para Validar Código

```typescript
// services/redemption-code.service.ts
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export interface ValidateCodeResponse {
  redemptionCodeId: number;
  code: string;
  transactionId: number;
  rewardId: number;
  rewardName: string;
  rewardCategory: string;
  pointsUsed: number;
  membershipId: number;
  status: 'pending' | 'used' | 'expired' | 'cancelled';
  usedAt: Date | null;
}

export async function validateRedemptionCode(
  code: string,
  partnerToken: string
): Promise<ValidateCodeResponse> {
  const response = await fetch(
    `${API_BASE_URL}/partner/rewards/validate-code`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${partnerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code: code.trim().toUpperCase() })
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    if (response.status === 404) {
      throw new Error('Código no encontrado');
    }
    if (response.status === 400) {
      throw new Error(error.message || 'Código inválido, expirado o ya usado');
    }
    if (response.status === 403) {
      throw new Error('Este código no pertenece a tu partner');
    }

    throw new Error(error.message || 'Error al validar código');
  }

  return await response.json();
}
```

#### Paso 2: Componente React para Validar Código

```typescript
// components/RedemptionCodeValidator.tsx
import React, { useState } from 'react';
import { validateRedemptionCode, ValidateCodeResponse } from '../services/redemption-code.service';

interface RedemptionCodeValidatorProps {
  partnerToken: string;
  onCodeValidated?: (codeInfo: ValidateCodeResponse) => void;
}

export const RedemptionCodeValidator: React.FC<RedemptionCodeValidatorProps> = ({
  partnerToken,
  onCodeValidated
}) => {
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeInfo, setCodeInfo] = useState<ValidateCodeResponse | null>(null);

  const handleValidate = async () => {
    if (!code.trim()) {
      setError('Por favor ingresa un código');
      return;
    }

    // Normalizar código (mayúsculas, sin espacios)
    const normalizedCode = code.trim().toUpperCase().replace(/\s/g, '');

    try {
      setValidating(true);
      setError(null);
      setCodeInfo(null);

      const result = await validateRedemptionCode(normalizedCode, partnerToken);
      setCodeInfo(result);

      if (onCodeValidated) {
        onCodeValidated(result);
      }
    } catch (err: any) {
      setError(err.message || 'Error al validar código');
      setCodeInfo(null);
    } finally {
      setValidating(false);
    }
  };

  const handleReset = () => {
    setCode('');
    setError(null);
    setCodeInfo(null);
  };

  return (
    <div className="redemption-code-validator">
      <div className="validator-header">
        <h2>Validar Código de Canje</h2>
        <p>Ingresa el código que el cliente presenta</p>
      </div>

      <div className="input-group">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            // Auto-formatear a mayúsculas
            const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
            setCode(value);
            setError(null);
          }}
          placeholder="REWARD-ABC123-XYZ789"
          maxLength={50}
          disabled={validating}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !validating && code.trim()) {
              handleValidate();
            }
          }}
          className={error ? 'input-error' : ''}
        />
        <button
          onClick={handleValidate}
          disabled={validating || !code.trim()}
          className="btn-primary"
        >
          {validating ? 'Validando...' : 'Validar'}
        </button>
        {codeInfo && (
          <button onClick={handleReset} className="btn-secondary">
            Nuevo Código
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {codeInfo && (
        <div className="code-info success">
          <div className="success-header">
            <span className="success-icon">✅</span>
            <h3>Código Validado Exitosamente</h3>
          </div>

          <div className="code-details">
            <div className="detail-row">
              <span className="label">Código:</span>
              <span className="value code-value">{codeInfo.code}</span>
            </div>

            <div className="detail-row">
              <span className="label">Recompensa:</span>
              <span className="value">{codeInfo.rewardName}</span>
            </div>

            <div className="detail-row">
              <span className="label">Categoría:</span>
              <span className="value">{codeInfo.rewardCategory}</span>
            </div>

            <div className="detail-row">
              <span className="label">Puntos Utilizados:</span>
              <span className="value">{codeInfo.pointsUsed} puntos</span>
            </div>

            <div className="detail-row">
              <span className="label">Estado:</span>
              <span className={`value status status-${codeInfo.status}`}>
                {codeInfo.status === 'used' ? 'Usado' : codeInfo.status}
              </span>
            </div>

            {codeInfo.usedAt && (
              <div className="detail-row">
                <span className="label">Validado el:</span>
                <span className="value">
                  {new Date(codeInfo.usedAt).toLocaleString('es-GT')}
                </span>
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button
              onClick={() => {
                // Aquí puedes integrar con tu sistema de POS
                // para aplicar el descuento/producto
                alert(`Aplicar recompensa: ${codeInfo.rewardName}`);
              }}
              className="btn-success"
            >
              Aplicar Recompensa
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

#### Paso 3: Estilos CSS (Opcional)

```css
/* styles/RedemptionCodeValidator.css */
.redemption-code-validator {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.validator-header {
  text-align: center;
  margin-bottom: 30px;
}

.validator-header h2 {
  margin-bottom: 10px;
  color: #333;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.input-group input {
  flex: 1;
  padding: 12px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
}

.input-group input:focus {
  outline: none;
  border-color: #007bff;
}

.input-group input.input-error {
  border-color: #dc3545;
}

.btn-primary, .btn-secondary, .btn-success {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-success {
  background-color: #28a745;
  color: white;
  width: 100%;
  margin-top: 20px;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.code-info.success {
  background-color: #d4edda;
  border: 2px solid #28a745;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.success-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  color: #155724;
}

.code-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #c3e6cb;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row .label {
  font-weight: 600;
  color: #155724;
}

.detail-row .value {
  color: #155724;
}

.code-value {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  letter-spacing: 1px;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status-used {
  background-color: #28a745;
  color: white;
}
```

---

## 📱 Escenario 2: Canje Directo con QR

### Descripción del Flujo

El partner escanea el QR del cliente, muestra las recompensas disponibles y procesa el canje directamente desde Partner UI.

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────┐
│  1. Partner escanea QR del cliente                    │
│     QR Code: "MEMBERSHIP-123" o código de membership  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  2. Buscar cliente por QR                             │
│     GET /partner/customers?qrCode=MEMBERSHIP-123      │
│     ✅ Retorna información del cliente y balance       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  3. Obtener recompensas disponibles                    │
│     GET /partner/customers/:membershipId/rewards       │
│     ✅ Filtradas por puntos suficientes                 │
│     ✅ Solo recompensas activas y disponibles           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  4. Cliente selecciona recompensa                      │
│     Validar: balance >= reward.pointsRequired          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  5. Procesar canje                                     │
│     POST /partner/customers/:membershipId/             │
│          rewards/:rewardId/redeem                        │
│     ✅ Genera código automáticamente                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│  6. Mostrar confirmación                               │
│     • Transacción creada                                │
│     • Puntos descontados                                │
│     • Nuevo balance                                     │
│     • Código de canje generado                         │
│     • Opción: Aplicar recompensa inmediatamente       │
└─────────────────────────────────────────────────────────┘
```

### Implementación Paso a Paso

#### Paso 1: Servicios Necesarios

```typescript
// services/customer.service.ts
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export interface Customer {
  id: number;
  membershipId: number;
  customerName: string;
  email: string;
  points: number;
  tierName?: string;
  tenantId: number;
}

export async function findCustomerByQr(
  qrCode: string,
  partnerToken: string
): Promise<Customer> {
  const response = await fetch(
    `${API_BASE_URL}/partner/customers?qrCode=${encodeURIComponent(qrCode)}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${partnerToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 404) {
      throw new Error('Cliente no encontrado');
    }
    throw new Error(error.message || 'Error al buscar cliente');
  }

  return await response.json();
}

export async function getCustomer(
  membershipId: number,
  partnerToken: string
): Promise<Customer> {
  const response = await fetch(
    `${API_BASE_URL}/partner/customers/${membershipId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${partnerToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al obtener cliente');
  }

  return await response.json();
}
```

```typescript
// services/reward.service.ts
export interface Reward {
  id: number;
  tenantId: number;
  name: string;
  description: string | null;
  pointsRequired: number;
  rewardType?: string;
  status: string;
  isAvailable: boolean;
  maxRedemptionsPerUser: number | null;
  expiresAt: Date | null;
  category: string;
}

export interface RedeemRewardResponse {
  transactionId: number;
  rewardId: number;
  pointsUsed: number;
  newBalance: number;
  redemptionCode?: string;
}

export async function getAvailableRewards(
  membershipId: number,
  partnerToken: string
): Promise<Reward[]> {
  const response = await fetch(
    `${API_BASE_URL}/partner/customers/${membershipId}/rewards`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${partnerToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al obtener recompensas');
  }

  const data = await response.json();
  return data.rewards || [];
}

export async function redeemReward(
  membershipId: number,
  rewardId: number,
  partnerToken: string
): Promise<RedeemRewardResponse> {
  const response = await fetch(
    `${API_BASE_URL}/partner/customers/${membershipId}/rewards/${rewardId}/redeem`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${partnerToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    if (response.status === 400) {
      throw new Error(error.message || 'No se puede canjear esta recompensa');
    }
    if (response.status === 404) {
      throw new Error('Recompensa o cliente no encontrado');
    }

    throw new Error(error.message || 'Error al procesar canje');
  }

  return await response.json();
}
```

#### Paso 2: Componente de Escáner QR

```typescript
// components/QRScanner.tsx
import React, { useRef, useEffect } from 'react';

interface QRScannerProps {
  onScan: (qrCode: string) => void;
  onError?: (error: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Aquí puedes integrar una librería de escaneo QR como:
    // - html5-qrcode
    // - qr-scanner
    // - jsQR

    // Ejemplo básico con html5-qrcode:
    // import { Html5Qrcode } from 'html5-qrcode';

    // Por ahora, mostramos un input manual para desarrollo
  }, []);

  // Versión simplificada: input manual para desarrollo
  const [manualCode, setManualCode] = useState('');

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="qr-scanner">
      <h3>Escanear QR del Cliente</h3>

      {/* En producción, aquí iría el componente de escáner real */}
      <div className="scanner-placeholder">
        <p>📷 Escáner QR (Integrar librería de escaneo)</p>

        {/* Input manual para desarrollo/pruebas */}
        <div className="manual-input">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Ingresa código QR manualmente"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleManualSubmit();
              }
            }}
          />
          <button onClick={handleManualSubmit}>Buscar Cliente</button>
        </div>
      </div>
    </div>
  );
};
```

#### Paso 3: Componente Principal de Canje Directo

```typescript
// components/DirectRedemption.tsx
import React, { useState, useEffect } from 'react';
import { QRScanner } from './QRScanner';
import { findCustomerByQr, getCustomer, Customer } from '../services/customer.service';
import { getAvailableRewards, redeemReward, Reward, RedeemRewardResponse } from '../services/reward.service';

interface DirectRedemptionProps {
  partnerToken: string;
}

export const DirectRedemption: React.FC<DirectRedemptionProps> = ({
  partnerToken
}) => {
  const [step, setStep] = useState<'scan' | 'rewards' | 'confirm'>('scan');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redemptionResult, setRedemptionResult] = useState<RedeemRewardResponse | null>(null);

  const handleQRScanned = async (qrCode: string) => {
    try {
      setLoading(true);
      setError(null);

      // Buscar cliente por QR
      const customerData = await findCustomerByQr(qrCode, partnerToken);
      setCustomer(customerData);

      // Obtener recompensas disponibles
      const rewardsData = await getAvailableRewards(customerData.membershipId, partnerToken);
      setRewards(rewardsData);

      setStep('rewards');
    } catch (err: any) {
      setError(err.message || 'Error al buscar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReward = (reward: Reward) => {
    // Validar que el cliente tenga puntos suficientes
    if (customer && customer.points < reward.pointsRequired) {
      setError(`Puntos insuficientes. Se requieren ${reward.pointsRequired} puntos`);
      return;
    }

    setSelectedReward(reward);
    setStep('confirm');
  };

  const handleConfirmRedemption = async () => {
    if (!customer || !selectedReward) return;

    const confirmed = window.confirm(
      `¿Confirmar canje de "${selectedReward.name}" por ${selectedReward.pointsRequired} puntos?`
    );

    if (!confirmed) return;

    try {
      setRedeeming(true);
      setError(null);

      const result = await redeemReward(
        customer.membershipId,
        selectedReward.id,
        partnerToken
      );

      setRedemptionResult(result);

      // Actualizar balance del cliente
      const updatedCustomer = await getCustomer(customer.membershipId, partnerToken);
      setCustomer(updatedCustomer);

      // Mostrar éxito
      alert(
        `¡Canje exitoso!\n` +
        `Recompensa: ${selectedReward.name}\n` +
        `Puntos utilizados: ${result.pointsUsed}\n` +
        `Nuevo balance: ${result.newBalance} puntos\n` +
        (result.redemptionCode
          ? `\nCódigo de canje: ${result.redemptionCode}\n` +
            `Válido por 30 días`
          : '')
      );

    } catch (err: any) {
      setError(err.message || 'Error al procesar canje');
      alert(`Error: ${err.message}`);
    } finally {
      setRedeeming(false);
    }
  };

  const handleReset = () => {
    setStep('scan');
    setCustomer(null);
    setRewards([]);
    setSelectedReward(null);
    setRedemptionResult(null);
    setError(null);
  };

  if (step === 'scan') {
    return (
      <div className="direct-redemption">
        <QRScanner onScan={handleQRScanned} />
        {loading && <div className="loading">Buscando cliente...</div>}
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  if (step === 'rewards') {
    return (
      <div className="direct-redemption">
        <div className="customer-header">
          <h2>{customer?.customerName}</h2>
          <p>Balance: <strong>{customer?.points} puntos</strong></p>
          <button onClick={handleReset} className="btn-secondary">
            Escanear Otro Cliente
          </button>
        </div>

        <div className="rewards-section">
          <h3>Recompensas Disponibles</h3>

          {rewards.length === 0 ? (
            <div className="no-rewards">
              <p>No hay recompensas disponibles para este cliente</p>
            </div>
          ) : (
            <div className="rewards-grid">
              {rewards.map(reward => {
                const canRedeem = customer ? customer.points >= reward.pointsRequired : false;

                return (
                  <div
                    key={reward.id}
                    className={`reward-card ${canRedeem ? 'available' : 'unavailable'}`}
                  >
                    <div className="reward-header">
                      <h4>{reward.name}</h4>
                      <span className="points-badge">
                        {reward.pointsRequired} pts
                      </span>
                    </div>

                    {reward.description && (
                      <p className="reward-description">{reward.description}</p>
                    )}

                    <div className="reward-footer">
                      {!canRedeem && (
                        <span className="insufficient-points">
                          Puntos insuficientes
                        </span>
                      )}
                      <button
                        onClick={() => handleSelectReward(reward)}
                        disabled={!canRedeem}
                        className="btn-primary"
                      >
                        Seleccionar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'confirm' && selectedReward && customer) {
    return (
      <div className="direct-redemption">
        <div className="confirmation-section">
          <h2>Confirmar Canje</h2>

          <div className="confirmation-details">
            <div className="detail-group">
              <h3>Cliente</h3>
              <p>{customer.customerName}</p>
              <p>Balance actual: <strong>{customer.points} puntos</strong></p>
            </div>

            <div className="detail-group">
              <h3>Recompensa</h3>
              <p><strong>{selectedReward.name}</strong></p>
              {selectedReward.description && (
                <p>{selectedReward.description}</p>
              )}
              <p>Categoría: {selectedReward.category}</p>
            </div>

            <div className="detail-group highlight">
              <h3>Resumen</h3>
              <p>Puntos a utilizar: <strong>{selectedReward.pointsRequired}</strong></p>
              <p>Nuevo balance: <strong>{customer.points - selectedReward.pointsRequired} puntos</strong></p>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {redemptionResult && (
            <div className="success-message">
              <h3>✅ Canje Exitoso</h3>
              <p>Transacción ID: {redemptionResult.transactionId}</p>
              <p>Puntos utilizados: {redemptionResult.pointsUsed}</p>
              <p>Nuevo balance: {redemptionResult.newBalance} puntos</p>
              {redemptionResult.redemptionCode && (
                <div className="redemption-code-display">
                  <p><strong>Código de Canje:</strong></p>
                  <div className="code-box">
                    {redemptionResult.redemptionCode}
                  </div>
                  <p className="code-note">Válido por 30 días</p>
                </div>
              )}
            </div>
          )}

          <div className="action-buttons">
            {!redemptionResult ? (
              <>
                <button
                  onClick={() => setStep('rewards')}
                  className="btn-secondary"
                  disabled={redeeming}
                >
                  Volver
                </button>
                <button
                  onClick={handleConfirmRedemption}
                  className="btn-primary"
                  disabled={redeeming}
                >
                  {redeeming ? 'Procesando...' : 'Confirmar Canje'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    // Opcional: Validar código inmediatamente
                    if (redemptionResult.redemptionCode) {
                      // Llamar a validateRedemptionCode aquí si quieres
                    }
                  }}
                  className="btn-success"
                >
                  Aplicar Recompensa
                </button>
                <button
                  onClick={handleReset}
                  className="btn-secondary"
                >
                  Nuevo Canje
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
```

---

## 🔌 Endpoints Disponibles

### Endpoints de Partner API

#### 1. Buscar Cliente por QR

```http
GET /partner/customers?qrCode={qrCode}
Authorization: Bearer {partnerToken}
```

**Respuesta:**
```json
{
  "id": 1,
  "membershipId": 1,
  "customerName": "Juan Pérez",
  "email": "juan@example.com",
  "points": 1500,
  "tierName": "Gold",
  "tenantId": 1
}
```

#### 2. Obtener Cliente por ID

```http
GET /partner/customers/:membershipId
Authorization: Bearer {partnerToken}
```

#### 3. Obtener Recompensas Disponibles

```http
GET /partner/customers/:membershipId/rewards
Authorization: Bearer {partnerToken}
```

**Respuesta:**
```json
{
  "rewards": [
    {
      "id": 1,
      "name": "Descuento 10%",
      "description": "Descuento del 10% en tu próxima compra",
      "pointsRequired": 500,
      "category": "Descuentos",
      "status": "active",
      "isAvailable": true,
      "maxRedemptionsPerUser": null,
      "expiresAt": null
    }
  ]
}
```

#### 4. Procesar Canje

```http
POST /partner/customers/:membershipId/rewards/:rewardId/redeem
Authorization: Bearer {partnerToken}
```

**Respuesta:**
```json
{
  "transactionId": 123,
  "rewardId": 1,
  "pointsUsed": 500,
  "newBalance": 1000,
  "redemptionCode": "REWARD-ABC123-XYZ789"
}
```

#### 5. Validar Código de Canje

```http
POST /partner/rewards/validate-code
Authorization: Bearer {partnerToken}
Content-Type: application/json

{
  "code": "REWARD-ABC123-XYZ789"
}
```

**Respuesta:**
```json
{
  "redemptionCodeId": 1,
  "code": "REWARD-ABC123-XYZ789",
  "transactionId": 123,
  "rewardId": 1,
  "rewardName": "Descuento 10%",
  "rewardCategory": "Descuentos",
  "pointsUsed": 500,
  "membershipId": 1,
  "status": "used",
  "usedAt": "2026-02-02T10:30:00Z"
}
```

---

## 💻 Implementación Completa

### Página Principal de Canje

```typescript
// pages/RedemptionPage.tsx
import React, { useState } from 'react';
import { RedemptionCodeValidator } from '../components/RedemptionCodeValidator';
import { DirectRedemption } from '../components/DirectRedemption';

export const RedemptionPage: React.FC = () => {
  const [mode, setMode] = useState<'code' | 'qr'>('qr');
  const partnerToken = localStorage.getItem('partnerToken') || '';

  if (!partnerToken) {
    return <div>Por favor inicia sesión</div>;
  }

  return (
    <div className="redemption-page">
      <div className="page-header">
        <h1>Canje de Recompensas</h1>

        <div className="mode-selector">
          <button
            onClick={() => setMode('qr')}
            className={mode === 'qr' ? 'active' : ''}
          >
            📱 Escanear QR
          </button>
          <button
            onClick={() => setMode('code')}
            className={mode === 'code' ? 'active' : ''}
          >
            🎫 Validar Código
          </button>
        </div>
      </div>

      <div className="redemption-content">
        {mode === 'qr' ? (
          <DirectRedemption partnerToken={partnerToken} />
        ) : (
          <RedemptionCodeValidator
            partnerToken={partnerToken}
            onCodeValidated={(codeInfo) => {
              // Opcional: Integrar con sistema de POS
              console.log('Código validado:', codeInfo);
            }}
          />
        )}
      </div>
    </div>
  );
};
```

### Estilos CSS

```css
/* styles/RedemptionPage.css */
.redemption-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.mode-selector {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.mode-selector button {
  padding: 12px 24px;
  border: 2px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.mode-selector button.active {
  background: #007bff;
  color: white;
}

.mode-selector button:hover {
  background: #0056b3;
  color: white;
}

/* Estilos para DirectRedemption */
.direct-redemption {
  max-width: 800px;
  margin: 0 auto;
}

.customer-header {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rewards-section h3 {
  margin-bottom: 20px;
}

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.reward-card {
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
}

.reward-card.available {
  border-color: #28a745;
}

.reward-card.unavailable {
  opacity: 0.6;
  border-color: #dc3545;
}

.reward-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 10px;
}

.points-badge {
  background: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.reward-footer {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.insufficient-points {
  color: #dc3545;
  font-size: 12px;
}

.confirmation-section {
  max-width: 600px;
  margin: 0 auto;
}

.confirmation-details {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

.detail-group {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ddd;
}

.detail-group:last-child {
  border-bottom: none;
}

.detail-group.highlight {
  background: #e7f3ff;
  padding: 15px;
  border-radius: 4px;
  border: 2px solid #007bff;
}

.redemption-code-display {
  margin-top: 20px;
  text-align: center;
}

.code-box {
  background: #000;
  color: #0f0;
  padding: 15px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 2px;
  margin: 10px 0;
}

.code-note {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 30px;
}
```

---

## ⚠️ Manejo de Errores

### Errores Comunes y Soluciones

#### Error: "Cliente no encontrado"
- **Causa**: QR code inválido o cliente no pertenece al partner
- **Solución**: Verificar que el QR code sea correcto y que el cliente pertenezca al tenant del partner

#### Error: "Código no encontrado"
- **Causa**: Código ingresado incorrectamente o no existe
- **Solución**: Verificar que el código esté completo y correcto

#### Error: "Código inválido, expirado o ya usado"
- **Causa**:
  - Código ya fue usado anteriormente
  - Código expiró (más de 30 días)
  - Código pertenece a otro tenant
- **Solución**: Verificar estado del código con el cliente

#### Error: "Puntos insuficientes"
- **Causa**: Cliente no tiene suficientes puntos para la recompensa
- **Solución**: Mostrar recompensas que el cliente puede canjear

#### Error: "No tiene permisos"
- **Causa**: Token inválido o usuario sin permisos de partner
- **Solución**: Verificar autenticación y permisos del usuario

### Función de Manejo de Errores

```typescript
// utils/error-handler.ts
export function handleRedemptionError(error: any): string {
  if (error.message) {
    return error.message;
  }

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return data.message || 'Solicitud inválida';
      case 401:
        return 'No autenticado. Por favor inicia sesión';
      case 403:
        return 'No tienes permisos para realizar esta acción';
      case 404:
        return 'Recurso no encontrado';
      case 500:
        return 'Error del servidor. Por favor intenta más tarde';
      default:
        return 'Error desconocido';
    }
  }

  return 'Error de conexión. Verifica tu internet';
}
```

---

## ✅ Mejores Prácticas

### 1. Validación en Frontend

```typescript
// Validar código antes de enviar
function isValidRedemptionCode(code: string): boolean {
  // Formato: REWARD-XXXXX-XXXXX
  const pattern = /^REWARD-[A-Z0-9]{4,6}-[A-Z0-9]{6,8}$/;
  return pattern.test(code.toUpperCase());
}

// Validar puntos antes de canjear
function canRedeemReward(customerBalance: number, reward: Reward): boolean {
  return customerBalance >= reward.pointsRequired && reward.isAvailable;
}
```

### 2. Feedback Visual

- Mostrar loading states durante operaciones
- Confirmar acciones importantes (canjes)
- Mostrar mensajes de éxito/error claros
- Actualizar UI inmediatamente después de operaciones exitosas

### 3. Manejo de Estados

```typescript
// Usar estados claros
type RedemptionState =
  | 'idle'
  | 'scanning'
  | 'loading-rewards'
  | 'selecting-reward'
  | 'confirming'
  | 'processing'
  | 'success'
  | 'error';
```

### 4. Optimización de UX

- Auto-formatear códigos a mayúsculas
- Permitir Enter para enviar formularios
- Mostrar balance actualizado después de canjes
- Opción de escanear otro cliente rápidamente

### 5. Integración con POS

```typescript
// Ejemplo de integración con sistema de POS
function applyRewardToPOS(codeInfo: ValidateCodeResponse) {
  // Integrar con tu sistema de punto de venta
  switch (codeInfo.rewardCategory) {
    case 'Descuentos':
      // Aplicar descuento porcentual o fijo
      applyDiscount(codeInfo.rewardName, codeInfo.pointsUsed);
      break;
    case 'Productos':
      // Agregar producto gratis
      addFreeProduct(codeInfo.rewardName);
      break;
    default:
      // Manejar otros tipos de recompensas
      handleOtherReward(codeInfo);
  }
}
```

---

## 📊 Resumen de Flujos

### Flujo 1: Validar Código

1. Cliente presenta código → Partner ingresa código → Validar → Aplicar recompensa

**Endpoints:**
- `POST /partner/rewards/validate-code`

**Ventajas:**
- Rápido y directo
- No requiere escaneo QR
- Cliente puede canjear desde su app y usar código después

### Flujo 2: Canje Directo con QR

1. Escanear QR → Buscar cliente → Mostrar recompensas → Seleccionar → Canjear → Aplicar

**Endpoints:**
- `GET /partner/customers?qrCode=...`
- `GET /partner/customers/:id/rewards`
- `POST /partner/customers/:id/rewards/:rewardId/redeem`

**Ventajas:**
- Proceso completo en una sola sesión
- Cliente ve recompensas disponibles
- Genera código automáticamente para uso futuro

---

## 🔗 Referencias

- [Guía Completa de Canjes](./GUIA-PARTNER-UI-CANJE-PUNTOS-RECOMPENSAS.md) - Guía detallada con ambos flujos
- [Plan de Implementación](./PLAN-CODIGOS-CANJE-RECOMPENSAS.md) - Detalles técnicos de implementación
- [Arquitectura del Sistema](./ARCHITECTURE.md) - Arquitectura del backend

---

**Última actualización**: 2026-02-02
