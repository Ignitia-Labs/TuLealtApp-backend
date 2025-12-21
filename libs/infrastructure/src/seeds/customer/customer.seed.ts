import { Injectable } from '@nestjs/common';
import { BaseSeed } from '../base/base-seed';

/**
 * Seed específica para el contexto de Customer API
 * Agrupa todas las seeds necesarias para el funcionamiento de customer-api
 */
@Injectable()
export class CustomerSeed extends BaseSeed {
  getName(): string {
    return 'CustomerSeed';
  }

  async run(): Promise<void> {
    this.log('Ejecutando seeds para Customer API...');

    // Aquí se pueden agregar seeds específicas de customer en el futuro
    // Ejemplo: clientes de ejemplo, categorías, configuraciones, etc.

    this.log('Seeds de Customer API completadas');
  }
}
