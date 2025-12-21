import { Injectable } from '@nestjs/common';
import { BaseSeed } from '../base/base-seed';
import { AdminUserSeed } from '../shared/admin-user.seed';
import { PricingPlanSeed } from '../shared/pricing-plan.seed';
import { CurrencySeed } from '../shared/currency.seed';

/**
 * Seed específica para el contexto de Admin API
 * Agrupa todas las seeds necesarias para el funcionamiento de admin-api
 */
@Injectable()
export class AdminSeed extends BaseSeed {
  constructor(
    private readonly adminUserSeed: AdminUserSeed,
    private readonly pricingPlanSeed: PricingPlanSeed,
    private readonly currencySeed: CurrencySeed,
  ) {
    super();
  }

  getName(): string {
    return 'AdminSeed';
  }

  async run(): Promise<void> {
    this.log('Ejecutando seeds para Admin API...');

    // Ejecutar seed de monedas primero (necesaria para partners y tenants)
    await this.currencySeed.run();

    // Ejecutar seed de usuario admin
    await this.adminUserSeed.run();

    // Ejecutar seed de planes de precios
    await this.pricingPlanSeed.run();

    // Aquí se pueden agregar más seeds específicas de admin en el futuro
    // Ejemplo: permisos, roles, configuraciones, etc.

    this.log('Seeds de Admin API completadas');
  }
}
