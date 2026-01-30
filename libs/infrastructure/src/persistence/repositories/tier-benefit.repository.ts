import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITierBenefitRepository, TierBenefit } from '@libs/domain';
import { TierBenefitEntity } from '../entities/tier-benefit.entity';
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
    const savedEntity = await this.tierBenefitRepository.save(entity);

    // Cargar relaciones después de guardar para el mapper
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
