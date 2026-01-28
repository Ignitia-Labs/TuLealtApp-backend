import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { IPricingPlanRepository, PricingPlan } from '@libs/domain';
import { PricingPlanEntity } from '../entities/pricing-plan.entity';
import { PricingPlanMapper } from '../mappers/pricing-plan.mapper';
import { PricingPeriodEntity } from '../entities/pricing-period.entity';
import { PricingPromotionEntity } from '../entities/pricing-promotion.entity';
import { PricingFeatureEntity } from '../entities/pricing-feature.entity';
import { LegacyPromotionEntity } from '../entities/legacy-promotion.entity';
import { PricingPlanLimitsEntity } from '../entities/pricing-plan-limits.entity';

/**
 * Implementación del repositorio de planes de precios usando TypeORM
 */
@Injectable()
export class PricingPlanRepository implements IPricingPlanRepository {
  constructor(
    @InjectRepository(PricingPlanEntity)
    private readonly pricingPlanRepository: Repository<PricingPlanEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: number): Promise<PricingPlan | null> {
    const planEntity = await this.pricingPlanRepository.findOne({
      where: { id },
      relations: ['pricingPeriods', 'promotions', 'features', 'legacyPromotion', 'limits'],
    });

    if (!planEntity) {
      return null;
    }

    return PricingPlanMapper.toDomain(planEntity);
  }

  async findBySlug(slug: string): Promise<PricingPlan | null> {
    const planEntity = await this.pricingPlanRepository.findOne({
      where: { slug },
      relations: ['pricingPeriods', 'promotions', 'features', 'legacyPromotion', 'limits'],
    });

    if (!planEntity) {
      return null;
    }

    return PricingPlanMapper.toDomain(planEntity);
  }

  async findAll(includeInactive = false): Promise<PricingPlan[]> {
    const planEntities = await this.pricingPlanRepository.find({
      where: includeInactive ? {} : { status: 'active' as const },
      relations: ['pricingPeriods', 'promotions', 'features', 'legacyPromotion', 'limits'],
      order: {
        order: 'ASC',
      },
    });

    return planEntities.map((entity) => PricingPlanMapper.toDomain(entity));
  }

  async save(plan: PricingPlan): Promise<PricingPlan> {
    const planEntity = PricingPlanMapper.toPersistence(plan);
    const savedEntity = await this.pricingPlanRepository.save(planEntity);

    // Recargar con todas las relaciones para asegurar que tenemos los datos actualizados
    const reloadedEntity = await this.pricingPlanRepository.findOne({
      where: { id: savedEntity.id },
      relations: ['pricingPeriods', 'promotions', 'features', 'legacyPromotion', 'limits'],
    });

    if (!reloadedEntity) {
      throw new Error(`Failed to reload pricing plan with ID ${savedEntity.id}`);
    }

    return PricingPlanMapper.toDomain(reloadedEntity);
  }

  async update(plan: PricingPlan): Promise<PricingPlan> {
    // Usar transacción para asegurar consistencia
    return await this.dataSource.transaction(async (manager) => {
      // Cargar la entidad existente con todas sus relaciones
      const existingEntity = await manager.findOne(PricingPlanEntity, {
        where: { id: plan.id },
        relations: ['pricingPeriods', 'promotions', 'features', 'legacyPromotion', 'limits'],
      });

      if (!existingEntity) {
        throw new Error(`Pricing plan with ID ${plan.id} not found`);
      }

      // Eliminar relaciones existentes antes de crear nuevas
      if (existingEntity.pricingPeriods && existingEntity.pricingPeriods.length > 0) {
        await manager.remove(PricingPeriodEntity, existingEntity.pricingPeriods);
      }
      if (existingEntity.promotions && existingEntity.promotions.length > 0) {
        await manager.remove(PricingPromotionEntity, existingEntity.promotions);
      }
      if (existingEntity.features && existingEntity.features.length > 0) {
        await manager.remove(PricingFeatureEntity, existingEntity.features);
      }
      // Solo eliminar legacyPromotion si el nuevo valor es null
      // Si tiene valor, se actualizará en el mapper
      if (existingEntity.legacyPromotion && !plan.promotion) {
        await manager.remove(LegacyPromotionEntity, existingEntity.legacyPromotion);
        existingEntity.legacyPromotion = null;
      }
      // Solo eliminar limits si el nuevo valor es null
      // Si tiene valor, se actualizará en el mapper
      if (existingEntity.limits && !plan.limits) {
        await manager.remove(PricingPlanLimitsEntity, existingEntity.limits);
        existingEntity.limits = null;
      }

      // Actualizar la entidad existente con los nuevos datos
      const updatedEntity = PricingPlanMapper.updatePersistence(existingEntity, plan);

      // Guardar la entidad actualizada (TypeORM manejará las relaciones con cascade)
      const savedEntity = await manager.save(PricingPlanEntity, updatedEntity);

      // Recargar con todas las relaciones para asegurar que tenemos los datos actualizados
      const reloadedEntity = await manager.findOne(PricingPlanEntity, {
        where: { id: savedEntity.id },
        relations: ['pricingPeriods', 'promotions', 'features', 'legacyPromotion', 'limits'],
      });

      if (!reloadedEntity) {
        throw new Error(`Failed to reload pricing plan with ID ${savedEntity.id}`);
      }

      return PricingPlanMapper.toDomain(reloadedEntity);
    });
  }

  async delete(id: number): Promise<void> {
    await this.pricingPlanRepository.delete(id);
  }

  async count(): Promise<number> {
    return this.pricingPlanRepository.count();
  }
}
