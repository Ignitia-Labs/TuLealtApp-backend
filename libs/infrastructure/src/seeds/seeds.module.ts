import { Module } from '@nestjs/common';
import { DatabaseModule } from '../persistence/database.module';
import { AdminUserSeed } from './shared/admin-user.seed';
import { PricingPlanSeed } from './shared/pricing-plan.seed';
import { CurrencySeed } from './shared/currency.seed';
import { AdminSeed } from './admin/admin.seed';
import { PartnerSeed } from './partner/partner.seed';
import { CustomerSeed } from './customer/customer.seed';

/**
 * Módulo específico para seeds
 * Este módulo SOLO debe ser usado por el seed-runner
 * NO debe importarse en los módulos de las aplicaciones
 *
 * Las seeds deben ejecutarse solo bajo demanda del usuario
 * mediante los comandos: npm run seed:*
 */
@Module({
  imports: [DatabaseModule],
  providers: [
    // Seeds compartidas
    AdminUserSeed,
    PricingPlanSeed,
    CurrencySeed,
    // Seeds por contexto
    AdminSeed,
    PartnerSeed,
    CustomerSeed,
  ],
  exports: [AdminUserSeed, PricingPlanSeed, CurrencySeed, AdminSeed, PartnerSeed, CustomerSeed],
})
export class SeedsModule {}
