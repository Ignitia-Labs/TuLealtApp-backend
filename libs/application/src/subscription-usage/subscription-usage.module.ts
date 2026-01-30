import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PartnerSubscriptionUsageEntity,
  PartnerSubscriptionEntity,
  TenantEntity,
  BranchEntity,
  CustomerMembershipEntity,
  LoyaltyProgramEntity,
  RewardRuleEntity,
} from '@libs/infrastructure';
import { SubscriptionUsageService } from './subscription-usage.service';
import { RecalculateSubscriptionUsageHandler } from './recalculate-subscription-usage/recalculate-subscription-usage.handler';

/**
 * Módulo para SubscriptionUsageService
 * Proporciona el servicio y las entidades de TypeORM necesarias
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PartnerSubscriptionUsageEntity,
      PartnerSubscriptionEntity,
      TenantEntity,
      BranchEntity,
      CustomerMembershipEntity,
      LoyaltyProgramEntity,
      RewardRuleEntity,
    ]),
  ],
  providers: [SubscriptionUsageService, RecalculateSubscriptionUsageHandler],
  exports: [SubscriptionUsageService, RecalculateSubscriptionUsageHandler, TypeOrmModule],
})
export class SubscriptionUsageModule {}
