import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITierPolicyRepository, TierPolicy } from '@libs/domain';
import { TierPolicyEntity } from '../entities/tier-policy.entity';
import { TierPolicyMapper } from '../mappers/tier-policy.mapper';

/**
 * Implementación del repositorio de TierPolicy usando TypeORM
 */
@Injectable()
export class TierPolicyRepository implements ITierPolicyRepository {
  constructor(
    @InjectRepository(TierPolicyEntity)
    private readonly tierPolicyRepository: Repository<TierPolicyEntity>,
  ) {}

  async findById(id: number): Promise<TierPolicy | null> {
    const entity = await this.tierPolicyRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return TierPolicyMapper.toDomain(entity);
  }

  async findActiveByTenantId(tenantId: number): Promise<TierPolicy | null> {
    const entity = await this.tierPolicyRepository.findOne({
      where: { tenantId, status: 'active' },
      order: { createdAt: 'DESC' },
    });

    if (!entity) {
      return null;
    }

    return TierPolicyMapper.toDomain(entity);
  }

  async findByTenantId(tenantId: number): Promise<TierPolicy[]> {
    const entities = await this.tierPolicyRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => TierPolicyMapper.toDomain(entity));
  }

  async save(policy: TierPolicy): Promise<TierPolicy> {
    const entity = TierPolicyMapper.toPersistence(policy);
    const savedEntity = await this.tierPolicyRepository.save(entity);
    return TierPolicyMapper.toDomain(savedEntity);
  }

  async delete(id: number): Promise<void> {
    await this.tierPolicyRepository.delete(id);
  }
}
