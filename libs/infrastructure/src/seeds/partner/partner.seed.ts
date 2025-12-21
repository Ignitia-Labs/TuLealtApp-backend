import { Injectable } from '@nestjs/common';
import { BaseSeed } from '../base/base-seed';

/**
 * Seed específica para el contexto de Partner API
 * Agrupa todas las seeds necesarias para el funcionamiento de partner-api
 */
@Injectable()
export class PartnerSeed extends BaseSeed {
  getName(): string {
    return 'PartnerSeed';
  }

  async run(): Promise<void> {
    this.log('Ejecutando seeds para Partner API...');

    // Aquí se pueden agregar seeds específicas de partner en el futuro
    // Ejemplo: partners de ejemplo, productos, configuraciones, etc.

    this.log('Seeds de Partner API completadas');
  }
}
