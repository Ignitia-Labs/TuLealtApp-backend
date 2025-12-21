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
import { PartnerEntity } from './entities/partner.entity';
import { PartnerSubscriptionEntity } from './entities/partner-subscription.entity';
import { PartnerLimitsEntity } from './entities/partner-limits.entity';
import { PartnerStatsEntity } from './entities/partner-stats.entity';
import { TenantEntity } from './entities/tenant.entity';
import { TenantFeaturesEntity } from './entities/tenant-features.entity';
import { BranchEntity } from './entities/branch.entity';
import { CurrencyEntity } from './entities/currency.entity';
import { UserRepository } from './repositories/user.repository';
import { PricingPlanRepository } from './repositories/pricing-plan.repository';
import { RateExchangeRepository } from './repositories/rate-exchange.repository';
import { PartnerRepository } from './repositories/partner.repository';
import { TenantRepository } from './repositories/tenant.repository';
import { BranchRepository } from './repositories/branch.repository';
import { CurrencyRepository } from './repositories/currency.repository';
import {
  IUserRepository,
  IPricingPlanRepository,
  IRateExchangeRepository,
  IPartnerRepository,
  ITenantRepository,
  IBranchRepository,
  ICurrencyRepository,
} from '@libs/domain';

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
      PartnerEntity,
      PartnerSubscriptionEntity,
      PartnerLimitsEntity,
      PartnerStatsEntity,
      TenantEntity,
      TenantFeaturesEntity,
      BranchEntity,
      CurrencyEntity,
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
    PartnerRepository,
    {
      provide: 'IPartnerRepository',
      useClass: PartnerRepository,
    },
    TenantRepository,
    {
      provide: 'ITenantRepository',
      useClass: TenantRepository,
    },
    BranchRepository,
    {
      provide: 'IBranchRepository',
      useClass: BranchRepository,
    },
    CurrencyRepository,
    {
      provide: 'ICurrencyRepository',
      useClass: CurrencyRepository,
    },
  ],
  exports: [
    'IUserRepository',
    'IPricingPlanRepository',
    'IRateExchangeRepository',
    'IPartnerRepository',
    'ITenantRepository',
    'IBranchRepository',
    'ICurrencyRepository',
    UserRepository,
    PricingPlanRepository,
    RateExchangeRepository,
    PartnerRepository,
    TenantRepository,
    BranchRepository,
    CurrencyRepository,
    TypeOrmModule,
  ],
})
export class DatabaseModule {}
