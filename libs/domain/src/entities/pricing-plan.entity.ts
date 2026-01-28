/**
 * Entidades de dominio para Pricing Plans
 * Representan la estructura de planes de precios en el dominio de negocio
 * No depende de frameworks ni librerías externas
 */

import { PricingPlanLimits } from './pricing-plan-limits.entity';

export interface PricingFeature {
  id: string;
  text: string;
  enabled: boolean;
}

export interface PricingPromotion {
  active: boolean;
  discountPercent: number;
  label: string;
  validUntil?: string; // ISO date string
}

// Pricing structure for different billing periods
export interface BillingPeriodPrice {
  monthly: number | null; // USD per month
  quarterly: number | null; // USD total for 3 months
  semiannual: number | null; // USD total for 6 months
  annual: number | null; // USD total for 12 months
}

// Promotions per billing period
export interface BillingPeriodPromotions {
  monthly?: PricingPromotion;
  quarterly?: PricingPromotion;
  semiannual?: PricingPromotion;
  annual?: PricingPromotion;
}

export type BillingPeriod = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

/**
 * Entidad de dominio PricingPlan
 * Representa un plan de precios en el dominio de negocio
 */
export class PricingPlan {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly icon: string,
    public readonly slug: string,
    // Legacy support
    public readonly basePrice: number | null, // USD, null for custom (deprecated, use pricing instead)
    public readonly period: string, // deprecated, use pricing instead
    // New pricing structure
    public readonly pricing: BillingPeriodPrice,
    public readonly promotions: BillingPeriodPromotions | null,
    public readonly description: string,
    public readonly features: PricingFeature[],
    public readonly cta: string,
    public readonly highlighted: boolean,
    public readonly status: 'active' | 'inactive',
    public readonly promotion: PricingPromotion | null, // Legacy support
    public readonly order: number,
    public readonly trialDays: number, // Días de prueba gratuita
    public readonly popular: boolean, // Si es el plan más popular
    public readonly limits: PricingPlanLimits | null, // Límites del plan de precios
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo plan de precios
   * El ID es opcional porque será generado automáticamente por la base de datos
   */
  static create(
    name: string,
    icon: string,
    slug: string,
    basePrice: number | null,
    period: string,
    pricing: BillingPeriodPrice,
    promotions: BillingPeriodPromotions | null,
    description: string,
    features: PricingFeature[],
    cta: string,
    highlighted: boolean,
    status: 'active' | 'inactive',
    promotion: PricingPromotion | null,
    order: number,
    trialDays: number = 14,
    popular: boolean = false,
    limits: PricingPlanLimits | null = null,
    id?: number,
  ): PricingPlan {
    const now = new Date();
    return new PricingPlan(
      id || 0,
      name,
      icon,
      slug,
      basePrice,
      period,
      pricing,
      promotions,
      description,
      features,
      cta,
      highlighted,
      status,
      promotion,
      order,
      trialDays,
      popular,
      limits,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si el plan está activo
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Método de dominio para activar el plan
   */
  activate(): PricingPlan {
    return new PricingPlan(
      this.id,
      this.name,
      this.icon,
      this.slug,
      this.basePrice,
      this.period,
      this.pricing,
      this.promotions,
      this.description,
      this.features,
      this.cta,
      this.highlighted,
      'active',
      this.promotion,
      this.order,
      this.trialDays,
      this.popular,
      this.limits,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para desactivar el plan
   */
  deactivate(): PricingPlan {
    return new PricingPlan(
      this.id,
      this.name,
      this.icon,
      this.slug,
      this.basePrice,
      this.period,
      this.pricing,
      this.promotions,
      this.description,
      this.features,
      this.cta,
      this.highlighted,
      'inactive',
      this.promotion,
      this.order,
      this.trialDays,
      this.popular,
      this.limits,
      this.createdAt,
      new Date(),
    );
  }
}
