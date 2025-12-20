import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './database.config';
import { UserEntity } from './entities/user.entity';
import { PricingPlanEntity } from './entities/pricing-plan.entity';
import { PricingPeriodEntity } from './entities/pricing-period.entity';
import { PricingPromotionEntity } from './entities/pricing-promotion.entity';
import { PricingFeatureEntity } from './entities/pricing-feature.entity';
import { LegacyPromotionEntity } from './entities/legacy-promotion.entity';
import { RateExchangeEntity } from './entities/rate-exchange.entity';
import { UserRepository } from './repositories/user.repository';
import { PricingPlanRepository } from './repositories/pricing-plan.repository';
import { RateExchangeRepository } from './repositories/rate-exchange.repository';
import { IUserRepository, IPricingPlanRepository, IRateExchangeRepository } from '@libs/domain';

/**
 * Módulo de base de datos
 * Configura TypeORM y provee los repositorios
 */
@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfig()),
    TypeOrmModule.forFeature([
      UserEntity,
      PricingPlanEntity,
      PricingPeriodEntity,
      PricingPromotionEntity,
      PricingFeatureEntity,
      LegacyPromotionEntity,
      RateExchangeEntity,
    ]),
  ],
  providers: [
    UserRepository,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    PricingPlanRepository,
    {
      provide: 'IPricingPlanRepository',
      useClass: PricingPlanRepository,
    },
    RateExchangeRepository,
    {
      provide: 'IRateExchangeRepository',
      useClass: RateExchangeRepository,
    },
  ],
  exports: [
    'IUserRepository',
    'IPricingPlanRepository',
    'IRateExchangeRepository',
    UserRepository,
    PricingPlanRepository,
    RateExchangeRepository,
    TypeOrmModule,
  ],
})
export class DatabaseModule {}
