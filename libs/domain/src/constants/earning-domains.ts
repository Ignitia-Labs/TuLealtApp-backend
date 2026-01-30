/**
 * Catálogo central de Earning Domains
 * Estos dominios son la "gramática" que usan programas y reglas para declarar qué parte del mundo tocan.
 *
 * HARD RULE: Cada RewardRule debe declarar exactamente 1 earningDomain.
 * No se pueden inventar dominios nuevos en runtime. Si se necesita uno nuevo, se agrega al catálogo central.
 */

/**
 * Dominios base - Solo un programa PRIMARY debe tocarlos
 */
export const BASE_EARNING_DOMAINS = {
  BASE_PURCHASE: 'BASE_PURCHASE', // Puntos base por compra (rate principal)
  BASE_VISIT: 'BASE_VISIT', // Puntos base por visita
  BASE_SUBSCRIPTION: 'BASE_SUBSCRIPTION', // Puntos base por suscripción/renovación
} as const;

/**
 * Dominios de bonus - Pueden stackear con límites
 */
export const BONUS_EARNING_DOMAINS = {
  BONUS_PURCHASE_FIXED: 'BONUS_PURCHASE_FIXED', // Bono fijo por compra (ej. +50)
  BONUS_PURCHASE_RATE: 'BONUS_PURCHASE_RATE', // Bono adicional por rate (ej. +0.5 pts por moneda)
  BONUS_CATEGORY: 'BONUS_CATEGORY', // Bono por categoría
  BONUS_SKU: 'BONUS_SKU', // Bono por SKU específico
  BONUS_BUNDLE: 'BONUS_BUNDLE', // Bono por combos/paquetes
  BONUS_REFERRAL: 'BONUS_REFERRAL', // Bono por referidos
  BONUS_RETENTION: 'BONUS_RETENTION', // Bono por retención/streak
  BONUS_SUBSCRIPTION: 'BONUS_SUBSCRIPTION', // Bono extra por suscripción (además del base)
  BONUS_TIER: 'BONUS_TIER', // Bonos exclusivos por tier
} as const;

/**
 * Dominios de ajustes/negativos
 */
export const ADJUSTMENT_EARNING_DOMAINS = {
  REVERSAL_PURCHASE: 'REVERSAL_PURCHASE', // Reversiones por refund/chargeback
  EXPIRATION_POINTS: 'EXPIRATION_POINTS', // Expiración
  ADJUSTMENT_ADMIN: 'ADJUSTMENT_ADMIN', // Ajustes manuales
} as const;

/**
 * Todos los earning domains disponibles
 */
export const EARNING_DOMAINS = {
  ...BASE_EARNING_DOMAINS,
  ...BONUS_EARNING_DOMAINS,
  ...ADJUSTMENT_EARNING_DOMAINS,
} as const;

export type EarningDomain = (typeof EARNING_DOMAINS)[keyof typeof EARNING_DOMAINS];

/**
 * Valida que un dominio sea válido
 */
export function isValidEarningDomain(domain: string): domain is EarningDomain {
  return Object.values(EARNING_DOMAINS).includes(domain as EarningDomain);
}

/**
 * Obtiene todos los dominios base
 */
export function getBaseEarningDomains(): EarningDomain[] {
  return Object.values(BASE_EARNING_DOMAINS);
}

/**
 * Obtiene todos los dominios de bonus
 */
export function getBonusEarningDomains(): EarningDomain[] {
  return Object.values(BONUS_EARNING_DOMAINS);
}
