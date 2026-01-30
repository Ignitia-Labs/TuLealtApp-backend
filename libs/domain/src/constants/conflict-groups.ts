/**
 * Catálogo central de Conflict Groups
 * Define "quién compite con quién" para resolución de conflictos.
 *
 * HARD RULE: Ningún tenant crea conflictGroups nuevos en runtime.
 * Si necesita uno nuevo, se agrega al catálogo central (con gobernanza).
 */

/**
 * Conflict Groups para compras (Purchase)
 */
export const PURCHASE_CONFLICT_GROUPS = {
  CG_PURCHASE_BASE: 'CG_PURCHASE_BASE', // Todo lo que sea "base points" por compra
  CG_PURCHASE_BONUS_FIXED: 'CG_PURCHASE_BONUS_FIXED', // Bono fijo por compra
  CG_PURCHASE_BONUS_RATE: 'CG_PURCHASE_BONUS_RATE', // Bono adicional por rate
  CG_PURCHASE_CATEGORY: 'CG_PURCHASE_CATEGORY', // Bono por categoría
  CG_PURCHASE_SKU: 'CG_PURCHASE_SKU', // Bono por SKU específico
  CG_PURCHASE_PROMO: 'CG_PURCHASE_PROMO', // Promos "una por compra"
} as const;

/**
 * Conflict Groups para visitas (Visit)
 */
export const VISIT_CONFLICT_GROUPS = {
  CG_VISIT_DAILY: 'CG_VISIT_DAILY', // 1 por día
  CG_VISIT_STREAK: 'CG_VISIT_STREAK', // 1 por ventana (streak)
} as const;

/**
 * Conflict Groups para suscripciones
 */
export const SUBSCRIPTION_CONFLICT_GROUPS = {
  CG_SUB_START: 'CG_SUB_START', // Inicio de suscripción
  CG_SUB_RENEW: 'CG_SUB_RENEW', // Renovación de suscripción
  CG_SUB_BONUS: 'CG_SUB_BONUS', // Bonus por suscripción
} as const;

/**
 * Conflict Groups para referidos y retención
 */
export const REFERRAL_RETENTION_CONFLICT_GROUPS = {
  CG_REFERRAL_AWARD: 'CG_REFERRAL_AWARD', // Premio por referido
  CG_RETENTION_PERIODIC: 'CG_RETENTION_PERIODIC', // Retención periódica
} as const;

/**
 * Todos los conflict groups disponibles
 */
export const CONFLICT_GROUPS = {
  ...PURCHASE_CONFLICT_GROUPS,
  ...VISIT_CONFLICT_GROUPS,
  ...SUBSCRIPTION_CONFLICT_GROUPS,
  ...REFERRAL_RETENTION_CONFLICT_GROUPS,
} as const;

export type ConflictGroup = (typeof CONFLICT_GROUPS)[keyof typeof CONFLICT_GROUPS];

/**
 * Valida que un conflict group sea válido
 */
export function isValidConflictGroup(group: string): group is ConflictGroup {
  return Object.values(CONFLICT_GROUPS).includes(group as ConflictGroup);
}

/**
 * Stack policies disponibles
 */
export const STACK_POLICIES = {
  STACK: 'STACK', // Aplicar todas, luego caps
  EXCLUSIVE: 'EXCLUSIVE', // Elegir 1 por prioridad o best value
  BEST_OF: 'BEST_OF', // Elegir la que da más puntos
  PRIORITY: 'PRIORITY', // Elegir la mayor priorityRank
} as const;

export type StackPolicy = (typeof STACK_POLICIES)[keyof typeof STACK_POLICIES];

/**
 * Valida que un stack policy sea válido
 */
export function isValidStackPolicy(policy: string): policy is StackPolicy {
  return Object.values(STACK_POLICIES).includes(policy as StackPolicy);
}
