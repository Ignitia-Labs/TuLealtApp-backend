import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITierBenefitRepository, TierBenefit } from '@libs/domain';
import { TierBenefitEntity } from '../entities/tier-benefit.entity';
import { TierBenefitExclusiveRewardEntity } from '../entities/tier-benefit-exclusive-reward.entity';
import { TierBenefitCategoryBenefitEntity } from '../entities/tier-benefit-category-benefit.entity';
import { TierBenefitCategoryExclusiveRewardEntity } from '../entities/tier-benefit-category-exclusive-reward.entity';
import { TierBenefitMapper } from '../mappers/tier-benefit.mapper';

/**
 * Implementación del repositorio de TierBenefit usando TypeORM
 *
 * NOTA: Actualizado para usar columnas y tablas relacionales en lugar de JSON.
 * Las relaciones (exclusiveRewards, categoryBenefits) se cargan con LEFT JOIN cuando es necesario.
 */
@Injectable()
export class TierBenefitRepository implements ITierBenefitRepository {
  constructor(
    @InjectRepository(TierBenefitEntity)
    private readonly tierBenefitRepository: Repository<TierBenefitEntity>,
  ) {}

  async findById(id: number): Promise<TierBenefit | null> {
    const entity = await this.tierBenefitRepository.findOne({
      where: { id },
      relations: [
        'exclusiveRewardsRelation',
        'categoryBenefitsRelation',
        'categoryBenefitsRelation.exclusiveRewardsRelation',
      ],
    });

    if (!entity) {
      return null;
    }

    return TierBenefitMapper.toDomain(entity);
  }

  async findByProgramIdAndTierId(programId: number, tierId: number): Promise<TierBenefit | null> {
    const entity = await this.tierBenefitRepository.findOne({
      where: { programId, tierId, status: 'active' },
      relations: [
        'exclusiveRewardsRelation',
        'categoryBenefitsRelation',
        'categoryBenefitsRelation.exclusiveRewardsRelation',
      ],
    });

    if (!entity) {
      return null;
    }

    return TierBenefitMapper.toDomain(entity);
  }

  async findActiveByProgramId(programId: number): Promise<TierBenefit[]> {
    const entities = await this.tierBenefitRepository.find({
      where: { programId, status: 'active' },
      relations: [
        'exclusiveRewardsRelation',
        'categoryBenefitsRelation',
        'categoryBenefitsRelation.exclusiveRewardsRelation',
      ],
    });

    return entities.map((entity) => TierBenefitMapper.toDomain(entity));
  }

  async findActiveByTierId(tierId: number): Promise<TierBenefit[]> {
    const entities = await this.tierBenefitRepository.find({
      where: { tierId, status: 'active' },
      relations: [
        'exclusiveRewardsRelation',
        'categoryBenefitsRelation',
        'categoryBenefitsRelation.exclusiveRewardsRelation',
      ],
    });

    return entities.map((entity) => TierBenefitMapper.toDomain(entity));
  }

  async save(benefit: TierBenefit): Promise<TierBenefit> {
    const entity = TierBenefitMapper.toPersistence(benefit);

    // Si es una actualización (id > 0), eliminar relaciones existentes solo si se están actualizando
    if (benefit.id > 0) {
      const existingEntity = await this.tierBenefitRepository.findOne({
        where: { id: benefit.id },
        relations: [
          'exclusiveRewardsRelation',
          'categoryBenefitsRelation',
          'categoryBenefitsRelation.exclusiveRewardsRelation',
        ],
      });

      if (existingEntity) {
        // 1. Eliminar exclusiveRewards antiguos si vamos a crear nuevos
        if (
          existingEntity.exclusiveRewardsRelation &&
          existingEntity.exclusiveRewardsRelation.length > 0
        ) {
          if (entity.exclusiveRewardsRelation && entity.exclusiveRewardsRelation.length > 0) {
            await this.tierBenefitRepository.manager.delete(
              TierBenefitExclusiveRewardEntity,
              existingEntity.exclusiveRewardsRelation.map((r) => r.id),
            );
          }
          // Si no vamos a crear nuevos pero existen antiguos, eliminarlos (caso de eliminación explícita)
          else if (
            !entity.exclusiveRewardsRelation ||
            entity.exclusiveRewardsRelation.length === 0
          ) {
            await this.tierBenefitRepository.manager.delete(
              TierBenefitExclusiveRewardEntity,
              existingEntity.exclusiveRewardsRelation.map((r) => r.id),
            );
          }
        }

        // 2. Eliminar categoryBenefits antiguos (y sus exclusiveRewards) si vamos a crear nuevos
        if (
          existingEntity.categoryBenefitsRelation &&
          existingEntity.categoryBenefitsRelation.length > 0
        ) {
          if (entity.categoryBenefitsRelation && entity.categoryBenefitsRelation.length > 0) {
            // Primero eliminar los exclusiveRewards de cada categoryBenefit
            for (const categoryBenefit of existingEntity.categoryBenefitsRelation) {
              if (
                categoryBenefit.exclusiveRewardsRelation &&
                categoryBenefit.exclusiveRewardsRelation.length > 0
              ) {
                await this.tierBenefitRepository.manager.delete(
                  TierBenefitCategoryExclusiveRewardEntity,
                  categoryBenefit.exclusiveRewardsRelation.map((r) => r.id),
                );
              }
            }
            // Luego eliminar los categoryBenefits
            await this.tierBenefitRepository.manager.delete(
              TierBenefitCategoryBenefitEntity,
              existingEntity.categoryBenefitsRelation.map((cb) => cb.id),
            );
          }
          // Si no vamos a crear nuevos pero existen antiguos, eliminarlos (caso de eliminación explícita)
          else if (
            !entity.categoryBenefitsRelation ||
            entity.categoryBenefitsRelation.length === 0
          ) {
            // Eliminar todos los categoryBenefits y sus exclusiveRewards
            for (const categoryBenefit of existingEntity.categoryBenefitsRelation) {
              if (
                categoryBenefit.exclusiveRewardsRelation &&
                categoryBenefit.exclusiveRewardsRelation.length > 0
              ) {
                await this.tierBenefitRepository.manager.delete(
                  TierBenefitCategoryExclusiveRewardEntity,
                  categoryBenefit.exclusiveRewardsRelation.map((r) => r.id),
                );
              }
            }
            await this.tierBenefitRepository.manager.delete(
              TierBenefitCategoryBenefitEntity,
              existingEntity.categoryBenefitsRelation.map((cb) => cb.id),
            );
          }
        }
      }
    }

    // Guardar la entidad principal con sus relaciones
    // TypeORM guardará automáticamente las relaciones OneToMany con cascade: true
    const savedEntity = await this.tierBenefitRepository.save(entity);

    // Cargar relaciones completas después de guardar para el mapper
    const entityWithRelations = await this.tierBenefitRepository.findOne({
      where: { id: savedEntity.id },
      relations: [
        'exclusiveRewardsRelation',
        'categoryBenefitsRelation',
        'categoryBenefitsRelation.exclusiveRewardsRelation',
      ],
    });

    return TierBenefitMapper.toDomain(entityWithRelations || savedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.tierBenefitRepository.delete(id);
  }
}
