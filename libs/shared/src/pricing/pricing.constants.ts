/**
 * Constantes para el módulo de Pricing
 */

import { BillingPeriod } from '@libs/domain';

export const EXCHANGE_RATE = 8; // Q8 por $1

// Período labels para UI
export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
};

// Duración en meses
export const BILLING_PERIOD_MONTHS: Record<BillingPeriod, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
};

