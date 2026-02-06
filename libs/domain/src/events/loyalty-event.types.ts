/**
 * Contrato de evento para el motor de evaluación de lealtad
 * Define los tipos de eventos y la estructura estándar que debe cumplir cualquier evento
 *
 * HARD RULE: sourceEventId es obligatorio para evitar duplicados
 */

export type LoyaltyEventType =
  | 'VISIT'
  | 'PURCHASE'
  | 'REFERRAL'
  | 'SUBSCRIPTION'
  | 'RETENTION'
  | 'CUSTOM';

/**
 * Referencia a membership: puede ser membershipId directo o customerId+tenantId para resolver
 */
export interface MembershipRef {
  membershipId?: number | null;
  customerId?: number | null;
  tenantId?: number | null;
  qrCode?: string | null; // QR code para resolver membership
}

/**
 * Item de compra (para eventos PURCHASE)
 */
export interface PurchaseItem {
  sku: string;
  qty: number;
  unitPrice: number;
  categoryId?: number | null;
  categoryName?: string | null;
  productName?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * Payload para evento PURCHASE
 */
export interface PurchaseEventPayload {
  orderId: string; // ID único de la orden (obligatorio)
  netAmount: number; // Monto neto (sin impuestos/envío)
  grossAmount: number; // Monto bruto (con impuestos/envío)
  currency: string; // Código de moneda (ej: "GTQ", "USD")
  items: PurchaseItem[]; // Items de la compra
  paymentMethod?: string | null;
  paymentStatus?: 'PAID' | 'PENDING' | 'REFUNDED' | 'CANCELLED' | null;
  storeId?: number | null;
  branchId?: number | null;
  channel?: string | null; // ej: "online", "in-store", "mobile"
  metadata?: Record<string, any> | null;
}

/**
 * Payload para evento VISIT
 */
export interface VisitEventPayload {
  storeId?: number | null;
  branchId?: number | null;
  channel?: string | null; // ej: "online", "in-store", "mobile"
  visitType?: string | null; // ej: "checkin", "browse", "consultation"
  durationMinutes?: number | null;
  metadata?: Record<string, any> | null;
}

/**
 * Payload para evento REFERRAL
 */
export interface ReferralEventPayload {
  referredMembershipId: number; // ID del membership referido
  referralCode?: string | null;
  firstPurchaseCompleted?: boolean | null;
  metadata?: Record<string, any> | null;
}

/**
 * Payload para evento SUBSCRIPTION
 */
export interface SubscriptionEventPayload {
  subscriptionId: number;
  subscriptionType: 'STARTED' | 'RENEWED' | 'CANCELLED' | 'UPGRADED' | 'DOWNGRADED';
  planId?: number | null;
  planName?: string | null;
  amount?: number | null;
  currency?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * Payload para evento RETENTION
 */
export interface RetentionEventPayload {
  streakType: 'VISIT' | 'PURCHASE' | 'MIXED';
  streakCount: number; // Número de días/consecutivos
  periodStart: Date;
  periodEnd: Date;
  metadata?: Record<string, any> | null;
}

/**
 * Payload para evento CUSTOM
 */
export interface CustomEventPayload {
  customType: string; // Tipo personalizado definido por el tenant
  [key: string]: any; // Cualquier campo adicional
}

/**
 * Payload unificado para cualquier tipo de evento
 */
export type LoyaltyEventPayload =
  | PurchaseEventPayload
  | VisitEventPayload
  | ReferralEventPayload
  | SubscriptionEventPayload
  | RetentionEventPayload
  | CustomEventPayload;

/**
 * Evento de lealtad normalizado
 * Esta es la estructura estándar que debe cumplir cualquier evento antes de ser procesado
 */
export interface LoyaltyEvent {
  tenantId: number; // Obligatorio
  eventType: LoyaltyEventType; // Obligatorio
  sourceEventId: string; // Obligatorio - ID único e idempotente del evento fuente
  occurredAt: Date; // Fecha/hora en que ocurrió el evento
  membershipRef: MembershipRef; // Referencia a membership (debe resolverse a membershipId)
  payload: LoyaltyEventPayload; // Payload específico según eventType
  branchId?: number | null; // ID de la sucursal donde ocurrió el evento (extraído del payload para fácil acceso)
  correlationId?: string | null; // ID para correlacionar eventos relacionados
  createdBy?: string | null; // Usuario/sistema que creó el evento
  metadata?: Record<string, any> | null; // Metadata adicional
}

/**
 * Resultado de evaluación de una regla
 */
export interface RuleEvaluationResult {
  ruleId: number;
  programId: number;
  conflictGroup: string;
  stackPolicy: string;
  priorityRank: number;
  points: number; // Puntos calculados
  earningDomain: string;
  idempotencyKey: string; // Key generada para idempotencia
  reasonCode?: string | null; // Código de razón (ej: "BASE_PURCHASE", "BONUS_CATEGORY")
  metadata?: Record<string, any> | null;
}

/**
 * Resultado del procesamiento de un evento completo
 */
export interface ProcessLoyaltyEventResult {
  eventId: string; // sourceEventId del evento procesado
  membershipId: number;
  programsProcessed: number[]; // IDs de programas que procesaron el evento
  transactionsCreated: number[]; // IDs de transacciones creadas en el ledger
  totalPointsAwarded: number; // Total de puntos otorgados
  evaluations: RuleEvaluationResult[]; // Resultados de evaluación por regla
  skipped: Array<{
    reason: string;
    ruleId?: number;
    programId?: number;
  }>; // Reglas/programas que se saltaron y por qué
  warnings?: string[]; // Advertencias (no críticas)
}
