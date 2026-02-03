import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICouponRepository, Coupon } from '@libs/domain';
import { CouponEntity } from '@libs/infrastructure/entities/billing/coupon.entity';
import { CouponMapper } from '@libs/infrastructure/mappers/billing/coupon.mapper';

/**
 * Implementación del repositorio de Coupon usando TypeORM
 */
@Injectable()
export class CouponRepository implements ICouponRepository {
  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepository: Repository<CouponEntity>,
  ) {}

  async findById(id: number): Promise<Coupon | null> {
    const entity = await this.couponRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return CouponMapper.toDomain(entity);
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const entity = await this.couponRepository.findOne({
      where: { code },
    });

    if (!entity) {
      return null;
    }

    return CouponMapper.toDomain(entity);
  }

  async findActive(): Promise<Coupon[]> {
    const entities = await this.couponRepository.find({
      where: { status: 'active' },
      order: { createdAt: 'DESC' },
    });

    return entities
      .map((entity) => CouponMapper.toDomain(entity))
      .filter((coupon) => coupon.isValid());
  }

  async findValidByFrequency(
    frequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual',
  ): Promise<Coupon[]> {
    const entities = await this.couponRepository.find({
      where: { status: 'active' },
      order: { createdAt: 'DESC' },
    });

    return entities
      .map((entity) => CouponMapper.toDomain(entity))
      .filter((coupon) => coupon.isValid() && coupon.appliesToFrequency(frequency));
  }

  async save(coupon: Coupon): Promise<Coupon> {
    const entity = CouponMapper.toPersistence(coupon);
    const savedEntity = await this.couponRepository.save(entity);
    return CouponMapper.toDomain(savedEntity);
  }

  async update(coupon: Coupon): Promise<Coupon> {
    const entity = CouponMapper.toPersistence(coupon);
    const updatedEntity = await this.couponRepository.save(entity);
    return CouponMapper.toDomain(updatedEntity);
  }
}
