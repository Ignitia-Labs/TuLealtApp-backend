/**
 * Helper functions para el módulo de Pricing
 */

import {
  PricingPlan,
  PricingPromotion,
  BillingPeriod,
} from '@libs/domain';
import { BILLING_PERIOD_MONTHS, EXCHANGE_RATE } from './pricing.constants';

/**
 * Calcula el precio con descuento aplicado
 */
export function calculateDiscountedPrice(
  basePrice: number | null,
  promotion?: PricingPromotion
): number | null {
  if (basePrice === null) return null;
  if (!promotion?.active) return basePrice;

  const discount = basePrice * (promotion.discountPercent / 100);
  return Math.round((basePrice - discount) * 100) / 100; // Round to 2 decimals
}

/**
 * Obtiene el precio para un período de facturación específico
 */
export function getPriceForPeriod(
  plan: PricingPlan,
  period: BillingPeriod
): number | null {
  return plan.pricing?.[period] ?? null;
}

/**
 * Obtiene la promoción para un período de facturación específico
 */
export function getPromotionForPeriod(
  plan: PricingPlan,
  period: BillingPeriod
): PricingPromotion | undefined {
  return plan.promotions?.[period];
}

/**
 * Calcula el precio final con descuentos aplicados
 */
export function calculateFinalPrice(
  plan: PricingPlan,
  period: BillingPeriod
): number | null {
  const basePrice = getPriceForPeriod(plan, period);
  const promotion = getPromotionForPeriod(plan, period);
  return calculateDiscountedPrice(basePrice, promotion);
}

/**
 * Calcula el equivalente mensual del precio final
 */
export function calculateMonthlyEquivalent(
  plan: PricingPlan,
  period: BillingPeriod
): number | null {
  const finalPrice = calculateFinalPrice(plan, period);
  if (finalPrice === null) return null;

  const months = BILLING_PERIOD_MONTHS[period];
  return Math.round((finalPrice / months) * 100) / 100;
}

/**
 * Formatea el precio según la moneda y aplica descuentos
 */
export function formatPrice(
  basePrice: number | null,
  currency: 'USD' | 'GTQ',
  promotion?: PricingPromotion
): string {
  if (basePrice === null) return 'Personalizado';

  const finalPrice = calculateDiscountedPrice(basePrice, promotion) || basePrice;

  if (currency === 'USD') {
    return `$${finalPrice}`;
  } else {
    const gtqPrice = Math.round(finalPrice * EXCHANGE_RATE);
    return `Q${gtqPrice}`;
  }
}

/**
 * Obtiene planes activos
 */
export function getActivePlans(plans: PricingPlan[]): PricingPlan[] {
  return plans.filter(plan => plan.status === 'active');
}

/**
 * Obtiene un plan por ID
 * @deprecated Usar repositorio IPricingPlanRepository.findById() en su lugar
 */
export function getPlanById(plans: PricingPlan[], id: number): PricingPlan | undefined {
  return plans.find(plan => plan.id === id);
}

/**
 * Obtiene un plan por slug
 * @deprecated Usar repositorio IPricingPlanRepository.findBySlug() en su lugar
 */
export function getPlanBySlug(plans: PricingPlan[], slug: string): PricingPlan | undefined {
  return plans.find(plan => plan.slug === slug);
}

/**
 * Calcula el porcentaje de ahorro entre períodos
 */
export function calculateSavingsPercent(
  plan: PricingPlan,
  fromPeriod: BillingPeriod,
  toPeriod: BillingPeriod
): number | null {
  const fromPrice = calculateMonthlyEquivalent(plan, fromPeriod);
  const toPrice = calculateMonthlyEquivalent(plan, toPeriod);

  if (fromPrice === null || toPrice === null) return null;

  const savings = ((fromPrice - toPrice) / fromPrice) * 100;
  return Math.round(savings);
}

