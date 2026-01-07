import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartnerSubscriptionUsageEntity, PartnerSubscriptionEntity } from '@libs/infrastructure';
import { SubscriptionUsageService } from './subscription-usage.service';

/**
 * Módulo para SubscriptionUsageService
 * Proporciona el servicio y las entidades de TypeORM necesarias
 */
@Module({
  imports: [TypeOrmModule.forFeature([PartnerSubscriptionUsageEntity, PartnerSubscriptionEntity])],
  providers: [SubscriptionUsageService],
  exports: [SubscriptionUsageService, TypeOrmModule],
})
export class SubscriptionUsageModule {}
