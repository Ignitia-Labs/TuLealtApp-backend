import { Module } from '@nestjs/common';
import { DatabaseModule } from './persistence/database.module';
import { StorageModule } from './storage/storage.module';
import { ServicesModule } from './services/services.module';

/**
 * Módulo de infraestructura que provee las implementaciones concretas
 * de los repositorios y otros servicios de infraestructura
 * Re-exporta DatabaseModule, StorageModule y ServicesModule para facilitar su uso
 *
 * ⚠️ IMPORTANTE: Las seeds NO están incluidas aquí para evitar
 * que se ejecuten automáticamente al iniciar las aplicaciones.
 * Las seeds solo deben ejecutarse bajo demanda mediante:
 * npm run seed:*
 */
@Module({
  imports: [DatabaseModule, StorageModule, ServicesModule],
  providers: [],
  exports: [DatabaseModule, StorageModule, ServicesModule],
})
export class InfrastructureModule {}
