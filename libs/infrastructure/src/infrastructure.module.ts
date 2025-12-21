import { Module } from '@nestjs/common';
import { DatabaseModule } from './persistence/database.module';
import { StorageModule } from './storage/storage.module';

/**
 * Módulo de infraestructura que provee las implementaciones concretas
 * de los repositorios y otros servicios de infraestructura
 * Re-exporta DatabaseModule y StorageModule para facilitar su uso
 *
 * ⚠️ IMPORTANTE: Las seeds NO están incluidas aquí para evitar
 * que se ejecuten automáticamente al iniciar las aplicaciones.
 * Las seeds solo deben ejecutarse bajo demanda mediante:
 * npm run seed:*
 */
@Module({
  imports: [DatabaseModule, StorageModule],
  providers: [],
  exports: [DatabaseModule, StorageModule],
})
export class InfrastructureModule {}
