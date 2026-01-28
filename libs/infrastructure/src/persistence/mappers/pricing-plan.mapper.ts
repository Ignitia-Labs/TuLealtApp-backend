import { PricingPlan, BillingPeriodPrice, BillingPeriodPromotions } from '@libs/domain';
import { PricingPlanEntity } from '../entities/pricing-plan.entity';
import { PricingPeriodEntity } from '../entities/pricing-period.entity';
import { PricingPromotionEntity } from '../entities/pricing-promotion.entity';
import { PricingFeatureEntity } from '../entities/pricing-feature.entity';
import { LegacyPromotionEntity } from '../entities/legacy-promotion.entity';
import { PricingPlanLimitsMapper } from './pricing-plan-limits.mapper';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia
 */
export class PricingPlanMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(persistenceEntity: PricingPlanEntity): PricingPlan {
    // Convertir pricingPeriods a BillingPeriodPrice
    const pricing: BillingPeriodPrice = {
      monthly: null,
      quarterly: null,
      semiannual: null,
      annual: null,
    };

    if (persistenceEntity.pricingPeriods && persistenceEntity.pricingPeriods.length > 0) {
      persistenceEntity.pricingPeriods.forEach((period) => {
        pricing[period.period] = period.price;
      });
    }

    // Convertir promotions a BillingPeriodPromotions
    let promotions: BillingPeriodPromotions | null = null;

    if (persistenceEntity.promotions && persistenceEntity.promotions.length > 0) {
      promotions = {
        monthly: undefined,
        quarterly: undefined,
        semiannual: undefined,
        annual: undefined,
      };
      persistenceEntity.promotions.forEach((promo) => {
        promotions![promo.period] = {
          active: promo.active,
          discountPercent: promo.discountPercent,
          label: promo.label,
          validUntil: promo.validUntil ? promo.validUntil.toISOString() : undefined,
        };
      });
    }

    // Convertir features
    const features =
      persistenceEntity.features && persistenceEntity.features.length > 0
        ? persistenceEntity.features.map((feature) => ({
            id: feature.featureId,
            text: feature.text,
            enabled: feature.enabled,
          }))
        : [];

    // Convertir legacyPromotion
    const legacyPromotion = persistenceEntity.legacyPromotion
      ? {
          active: persistenceEntity.legacyPromotion.active,
          discountPercent: persistenceEntity.legacyPromotion.discountPercent,
          label: persistenceEntity.legacyPromotion.label,
          validUntil: persistenceEntity.legacyPromotion.validUntil
            ? persistenceEntity.legacyPromotion.validUntil.toISOString()
            : undefined,
        }
      : null;

    // Convertir limits
    const limits = persistenceEntity.limits
      ? PricingPlanLimitsMapper.toDomain(persistenceEntity.limits)
      : null;

    return new PricingPlan(
      persistenceEntity.id,
      persistenceEntity.name,
      persistenceEntity.icon,
      persistenceEntity.slug,
      persistenceEntity.basePrice,
      persistenceEntity.period,
      pricing,
      promotions,
      persistenceEntity.description,
      features,
      persistenceEntity.cta,
      persistenceEntity.highlighted,
      persistenceEntity.status,
      legacyPromotion,
      persistenceEntity.order,
      persistenceEntity.trialDays ?? 14,
      persistenceEntity.popular ?? false,
      limits,
      persistenceEntity.createdAt,
      persistenceEntity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia
   * Si el ID es 0, no se asigna para que la BD lo genere automáticamente
   */
  static toPersistence(domainEntity: PricingPlan): PricingPlanEntity {
    const entity = new PricingPlanEntity();
    // Solo asignar ID si es mayor a 0 (plan existente)
    // Si es 0, la BD generará el ID automáticamente
    if (domainEntity.id > 0) {
      entity.id = domainEntity.id;
    }
    entity.name = domainEntity.name;
    entity.icon = domainEntity.icon;
    entity.slug = domainEntity.slug;
    entity.basePrice = domainEntity.basePrice;
    entity.period = domainEntity.period;
    entity.description = domainEntity.description;
    entity.cta = domainEntity.cta;
    entity.highlighted = domainEntity.highlighted;
    entity.status = domainEntity.status;
    entity.order = domainEntity.order;
    entity.trialDays = domainEntity.trialDays;
    entity.popular = domainEntity.popular;
    entity.createdAt = domainEntity.createdAt;
    entity.updatedAt = domainEntity.updatedAt;

    // Convertir pricing a PricingPeriodEntity[]
    entity.pricingPeriods = Object.entries(domainEntity.pricing).map(([period, price]) => {
      const periodEntity = new PricingPeriodEntity();
      periodEntity.period = period as any;
      periodEntity.price = price;
      return periodEntity;
    });

    // Convertir promotions a PricingPromotionEntity[]
    if (domainEntity.promotions) {
      entity.promotions = Object.entries(domainEntity.promotions)
        .filter(([, promo]) => promo !== undefined)
        .map(([period, promo]) => {
          const promoEntity = new PricingPromotionEntity();
          promoEntity.period = period as any;
          promoEntity.active = promo!.active;
          promoEntity.discountPercent = promo!.discountPercent;
          promoEntity.label = promo!.label;
          promoEntity.validUntil = promo!.validUntil ? new Date(promo!.validUntil) : null;
          return promoEntity;
        });
    } else {
      entity.promotions = [];
    }

    // Convertir features a PricingFeatureEntity[]
    entity.features = domainEntity.features.map((feature) => {
      const featureEntity = new PricingFeatureEntity();
      featureEntity.featureId = feature.id;
      featureEntity.text = feature.text;
      featureEntity.enabled = feature.enabled;
      return featureEntity;
    });

    // Convertir legacy promotion
    if (domainEntity.promotion) {
      const legacyPromo = new LegacyPromotionEntity();
      legacyPromo.active = domainEntity.promotion.active;
      legacyPromo.discountPercent = domainEntity.promotion.discountPercent;
      legacyPromo.label = domainEntity.promotion.label;
      legacyPromo.validUntil = domainEntity.promotion.validUntil
        ? new Date(domainEntity.promotion.validUntil)
        : null;
      entity.legacyPromotion = legacyPromo;
    } else {
      entity.legacyPromotion = null;
    }

    // Convertir limits
    // Nota: pricingPlanId se asignará automáticamente cuando se guarde el plan (TypeORM cascade)
    if (domainEntity.limits) {
      const limitsEntity = PricingPlanLimitsMapper.toPersistence(domainEntity.limits);
      // Si el plan ya tiene ID, asignarlo; si no, TypeORM lo asignará después del save
      if (domainEntity.id > 0) {
        limitsEntity.pricingPlanId = domainEntity.id;
      }
      entity.limits = limitsEntity;
    } else {
      entity.limits = null;
    }

    return entity;
  }

  /**
   * Actualiza una entidad de persistencia existente con los datos de dominio
   * Maneja correctamente las relaciones para evitar duplicados
   */
  static updatePersistence(
    existingEntity: PricingPlanEntity,
    domainEntity: PricingPlan,
  ): PricingPlanEntity {
    // Actualizar propiedades del plan principal
    existingEntity.name = domainEntity.name;
    existingEntity.icon = domainEntity.icon;
    existingEntity.slug = domainEntity.slug;
    existingEntity.basePrice = domainEntity.basePrice;
    existingEntity.period = domainEntity.period;
    existingEntity.description = domainEntity.description;
    existingEntity.cta = domainEntity.cta;
    existingEntity.highlighted = domainEntity.highlighted;
    existingEntity.status = domainEntity.status;
    existingEntity.order = domainEntity.order;
    existingEntity.trialDays = domainEntity.trialDays;
    existingEntity.popular = domainEntity.popular;
    existingEntity.updatedAt = new Date();

    // Eliminar pricingPeriods existentes y crear nuevos
    if (existingEntity.pricingPeriods) {
      existingEntity.pricingPeriods = [];
    }
    existingEntity.pricingPeriods = Object.entries(domainEntity.pricing).map(([period, price]) => {
      const periodEntity = new PricingPeriodEntity();
      periodEntity.period = period as any;
      periodEntity.price = price;
      periodEntity.pricingPlanId = existingEntity.id;
      return periodEntity;
    });

    // Eliminar promotions existentes y crear nuevas
    if (existingEntity.promotions) {
      existingEntity.promotions = [];
    }
    if (domainEntity.promotions) {
      existingEntity.promotions = Object.entries(domainEntity.promotions)
        .filter(([, promo]) => promo !== undefined)
        .map(([period, promo]) => {
          const promoEntity = new PricingPromotionEntity();
          promoEntity.period = period as any;
          promoEntity.active = promo!.active;
          promoEntity.discountPercent = promo!.discountPercent;
          promoEntity.label = promo!.label;
          promoEntity.validUntil = promo!.validUntil ? new Date(promo!.validUntil) : null;
          promoEntity.pricingPlanId = existingEntity.id;
          return promoEntity;
        });
    } else {
      existingEntity.promotions = [];
    }

    // Eliminar features existentes y crear nuevas
    if (existingEntity.features) {
      existingEntity.features = [];
    }
    existingEntity.features = domainEntity.features.map((feature) => {
      const featureEntity = new PricingFeatureEntity();
      featureEntity.featureId = feature.id;
      featureEntity.text = feature.text;
      featureEntity.enabled = feature.enabled;
      featureEntity.pricingPlanId = existingEntity.id;
      return featureEntity;
    });

    // Manejar legacyPromotion: actualizar si existe, crear si no existe, eliminar si es null
    if (domainEntity.promotion) {
      if (existingEntity.legacyPromotion) {
        // Actualizar la promoción existente
        existingEntity.legacyPromotion.active = domainEntity.promotion.active;
        existingEntity.legacyPromotion.discountPercent = domainEntity.promotion.discountPercent;
        existingEntity.legacyPromotion.label = domainEntity.promotion.label;
        existingEntity.legacyPromotion.validUntil = domainEntity.promotion.validUntil
          ? new Date(domainEntity.promotion.validUntil)
          : null;
        existingEntity.legacyPromotion.updatedAt = new Date();
      } else {
        // Crear nueva promoción
        const legacyPromo = new LegacyPromotionEntity();
        legacyPromo.pricingPlanId = existingEntity.id;
        legacyPromo.active = domainEntity.promotion.active;
        legacyPromo.discountPercent = domainEntity.promotion.discountPercent;
        legacyPromo.label = domainEntity.promotion.label;
        legacyPromo.validUntil = domainEntity.promotion.validUntil
          ? new Date(domainEntity.promotion.validUntil)
          : null;
        existingEntity.legacyPromotion = legacyPromo;
      }
    } else {
      // Eliminar promoción si es null
      existingEntity.legacyPromotion = null;
    }

    // Manejar limits: actualizar si existe, crear si no existe, eliminar si es null
    if (domainEntity.limits) {
      const limitsEntity = PricingPlanLimitsMapper.toPersistence(domainEntity.limits);
      limitsEntity.pricingPlanId = existingEntity.id;
      existingEntity.limits = limitsEntity;
    } else {
      // Eliminar limits si es null
      existingEntity.limits = null;
    }

    return existingEntity;
  }
}
