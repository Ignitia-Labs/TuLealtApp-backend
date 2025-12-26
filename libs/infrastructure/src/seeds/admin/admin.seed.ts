import { Injectable } from '@nestjs/common';
import { BaseSeed } from '../base/base-seed';
import { AdminUserSeed } from '../shared/admin-user.seed';
import { PricingPlanSeed } from '../shared/pricing-plan.seed';
import { CurrencySeed } from '../shared/currency.seed';
import { CountrySeed } from '../shared/country.seed';

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
    private readonly countrySeed: CountrySeed,
  ) {
    super();
  }

  getName(): string {
    return 'AdminSeed';
  }

  async run(): Promise<void> {
    this.log('Ejecutando seeds para Admin API...');

    // Ejecutar seed de países PRIMERO (necesaria para asociar con monedas)
    await this.countrySeed.run();

    // Ejecutar seed de monedas después (asociará cada moneda con su país)
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
