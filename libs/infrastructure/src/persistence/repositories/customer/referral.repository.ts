import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { IReferralRepository, Referral } from '@libs/domain';
import { ReferralEntity } from '@libs/infrastructure/entities/customer/referral.entity';
import { ReferralMapper } from '@libs/infrastructure/mappers/customer/referral.mapper';

/**
 * Implementación del repositorio de Referral usando TypeORM
 */
@Injectable()
export class ReferralRepository implements IReferralRepository {
  constructor(
    @InjectRepository(ReferralEntity)
    private readonly referralRepository: Repository<ReferralEntity>,
  ) {}

  async save(referral: Referral): Promise<Referral> {
    const entity = ReferralMapper.toPersistence(referral);
    const savedEntity = await this.referralRepository.save(entity);
    return ReferralMapper.toDomain(savedEntity);
  }

  async findById(id: number): Promise<Referral | null> {
    const entity = await this.referralRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return ReferralMapper.toDomain(entity);
  }

  async findByReferrer(referrerMembershipId: number, tenantId: number): Promise<Referral[]> {
    const entities = await this.referralRepository.find({
      where: {
        referrerMembershipId,
        tenantId,
      },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => ReferralMapper.toDomain(entity));
  }

  async findByReferred(referredMembershipId: number, tenantId: number): Promise<Referral[]> {
    const entities = await this.referralRepository.find({
      where: {
        referredMembershipId,
        tenantId,
      },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => ReferralMapper.toDomain(entity));
  }

  async findByReferrerAndReferred(
    referrerMembershipId: number,
    referredMembershipId: number,
    tenantId: number,
  ): Promise<Referral | null> {
    const entity = await this.referralRepository.findOne({
      where: {
        referrerMembershipId,
        referredMembershipId,
        tenantId,
      },
    });

    if (!entity) {
      return null;
    }

    return ReferralMapper.toDomain(entity);
  }

  async findActiveByReferrerInPeriod(
    referrerMembershipId: number,
    tenantId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Referral[]> {
    const entities = await this.referralRepository.find({
      where: {
        referrerMembershipId,
        tenantId,
        status: In(['pending', 'active', 'completed']), // Incluye pending, active, completed
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => ReferralMapper.toDomain(entity));
  }

  async countActiveByReferrerInPeriod(
    referrerMembershipId: number,
    tenantId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return await this.referralRepository.count({
      where: {
        referrerMembershipId,
        tenantId,
        status: In(['pending', 'active', 'completed']),
        createdAt: Between(startDate, endDate),
      },
    });
  }

  async findPendingByReferred(referredMembershipId: number, tenantId: number): Promise<Referral[]> {
    const entities = await this.referralRepository.find({
      where: {
        referredMembershipId,
        tenantId,
        status: 'pending',
        firstPurchaseCompleted: false,
      },
      order: { createdAt: 'ASC' },
    });

    return entities.map((entity) => ReferralMapper.toDomain(entity));
  }

  async findCompletedWithoutReward(
    referrerMembershipId: number,
    tenantId: number,
  ): Promise<Referral[]> {
    const entities = await this.referralRepository.find({
      where: {
        referrerMembershipId,
        tenantId,
        firstPurchaseCompleted: true,
        rewardGranted: false,
        status: In(['active', 'completed']),
      },
      order: { firstPurchaseCompletedAt: 'ASC' },
    });

    return entities.map((entity) => ReferralMapper.toDomain(entity));
  }
}
