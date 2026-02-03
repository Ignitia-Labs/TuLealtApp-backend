import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRedemptionCodeRepository, RedemptionCode } from '@libs/domain';
import { RedemptionCodeEntity } from '@libs/infrastructure/entities/loyalty/redemption-code.entity';
import { RedemptionCodeMapper } from '@libs/infrastructure/mappers/loyalty/redemption-code.mapper';

/**
 * Implementación del repositorio de RedemptionCode usando TypeORM
 */
@Injectable()
export class RedemptionCodeRepository implements IRedemptionCodeRepository {
  constructor(
    @InjectRepository(RedemptionCodeEntity)
    private readonly redemptionCodeRepository: Repository<RedemptionCodeEntity>,
  ) {}

  async findById(id: number): Promise<RedemptionCode | null> {
    const entity = await this.redemptionCodeRepository.findOne({ where: { id } });
    return entity ? RedemptionCodeMapper.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<RedemptionCode | null> {
    const entity = await this.redemptionCodeRepository.findOne({ where: { code } });
    return entity ? RedemptionCodeMapper.toDomain(entity) : null;
  }

  async findByTransactionId(transactionId: number): Promise<RedemptionCode | null> {
    const entity = await this.redemptionCodeRepository.findOne({
      where: { transactionId },
    });
    return entity ? RedemptionCodeMapper.toDomain(entity) : null;
  }

  async findByMembershipId(membershipId: number): Promise<RedemptionCode[]> {
    const entities = await this.redemptionCodeRepository.find({
      where: { membershipId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(RedemptionCodeMapper.toDomain);
  }

  async findByMembershipIdAndStatus(
    membershipId: number,
    status: 'pending' | 'used' | 'expired' | 'cancelled',
  ): Promise<RedemptionCode[]> {
    const entities = await this.redemptionCodeRepository.find({
      where: { membershipId, status },
      order: { createdAt: 'DESC' },
    });
    return entities.map(RedemptionCodeMapper.toDomain);
  }

  async save(code: RedemptionCode): Promise<RedemptionCode> {
    const entityData = RedemptionCodeMapper.toPersistence(code);
    const savedEntity = await this.redemptionCodeRepository.save(entityData);
    return RedemptionCodeMapper.toDomain(savedEntity);
  }

  async update(code: RedemptionCode): Promise<RedemptionCode> {
    // Verificar que existe
    const existingEntity = await this.redemptionCodeRepository.findOne({
      where: { id: code.id },
    });
    if (!existingEntity) {
      throw new Error(`RedemptionCode with ID ${code.id} not found`);
    }

    const entityData = RedemptionCodeMapper.toPersistence(code);
    const updatedEntity = await this.redemptionCodeRepository.save({
      ...existingEntity,
      ...entityData,
    });
    return RedemptionCodeMapper.toDomain(updatedEntity);
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.redemptionCodeRepository.count({ where: { code } });
    return count > 0;
  }
}
