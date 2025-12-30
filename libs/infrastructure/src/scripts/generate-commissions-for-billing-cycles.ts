import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure.module';
import {
  IBillingCycleRepository,
  IPaymentRepository,
  ICommissionRepository,
} from '@libs/domain';
import { CommissionCalculationService } from '@libs/application';
import { BillingCycleEntity } from '../persistence/entities/billing-cycle.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BillingCycleMapper } from '../persistence/mappers/billing-cycle.mapper';

/**
 * Módulo específico para el script de generación de comisiones
 * Incluye todos los servicios y repositorios necesarios
 */
@Module({
  imports: [
    InfrastructureModule,
    TypeOrmModule.forFeature([BillingCycleEntity]),
  ],
  providers: [CommissionCalculationService],
  exports: [CommissionCalculationService],
})
class ScriptModule {}

// Cargar variables de entorno antes de inicializar la aplicación
if (process.env.NODE_ENV !== 'production') {
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envLocalPath });

  if (!process.env.DB_HOST) {
    const envPath = path.resolve(process.cwd(), '.env');
    dotenv.config({ path: envPath });
  }
} else {
  dotenv.config();
}

/**
 * Script para generar comisiones de billing cycles previamente creados
 *
 * Este script:
 * 1. Busca todos los billing cycles con status='paid' o paymentStatus='paid'
 * 2. Para cada billing cycle, verifica si ya tiene comisiones generadas
 * 3. Si no tiene comisiones, las genera automáticamente
 * 4. Evita duplicidades verificando que no existan comisiones previas
 *
 * Uso:
 * ts-node -r tsconfig-paths/register libs/infrastructure/src/scripts/generate-commissions-for-billing-cycles.ts
 */
async function bootstrap() {
  const logger = new Logger('GenerateCommissionsScript');

  console.log('========================================');
  console.log('💰 Generando Comisiones para Billing Cycles');
  console.log('========================================\n');

  try {
    // Crear aplicación NestJS para tener acceso a la inyección de dependencias
    const app = await NestFactory.createApplicationContext(ScriptModule, {
      logger: ['log', 'error', 'warn'],
    });

    // Obtener repositorios y servicios del contenedor de dependencias
    const billingCycleRepository = app.get<IBillingCycleRepository>(
      'IBillingCycleRepository',
    );
    const paymentRepository = app.get<IPaymentRepository>('IPaymentRepository');
    const commissionRepository = app.get<ICommissionRepository>(
      'ICommissionRepository',
    );
    const commissionCalculationService = app.get(CommissionCalculationService);

    // Obtener el repositorio de TypeORM directamente para hacer queries más específicas
    let billingCycleEntityRepository: Repository<BillingCycleEntity>;
    try {
      billingCycleEntityRepository = app.get(
        getRepositoryToken(BillingCycleEntity),
      );
    } catch (error) {
      // Si no se puede obtener con el token, intentar obtenerlo del DataSource
      const dataSource = app.get(DataSource);
      if (dataSource) {
        billingCycleEntityRepository = dataSource.getRepository(BillingCycleEntity);
      } else {
        throw new Error(
          'No se pudo obtener el repositorio de BillingCycleEntity ni el DataSource.',
        );
      }
    }

    // Buscar todos los billing cycles pagados
    logger.log('Buscando billing cycles con status="paid" o paymentStatus="paid"...');
    const paidBillingCycles = await billingCycleEntityRepository
      .createQueryBuilder('bc')
      .where('bc.status = :status', { status: 'paid' })
      .orWhere('bc.paymentStatus = :paymentStatus', { paymentStatus: 'paid' })
      .orderBy('bc.id', 'ASC')
      .getMany();

    logger.log(
      `Encontrados ${paidBillingCycles.length} billing cycles pagados\n`,
    );

    if (paidBillingCycles.length === 0) {
      console.log('✅ No hay billing cycles pagados para procesar.');
      await app.close();
      process.exit(0);
    }

    // Estadísticas
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: Array<{ cycleId: number; error: string }> = [];

    // Procesar cada billing cycle
    for (const cycleEntity of paidBillingCycles) {
      const billingCycle = BillingCycleMapper.toDomain(cycleEntity);
      const cycleId = billingCycle.id;

      try {
        logger.log(
          `\n[${processedCount + skippedCount + errorCount + 1}/${paidBillingCycles.length}] Procesando Billing Cycle #${cycleId} (Partner: ${billingCycle.partnerId}, Subscription: ${billingCycle.subscriptionId}, Cycle: ${billingCycle.cycleNumber})`,
        );

        // Verificar que el billing cycle esté realmente pagado
        if (
          billingCycle.status !== 'paid' &&
          billingCycle.paymentStatus !== 'paid'
        ) {
          logger.warn(
            `  ⚠️  Billing Cycle #${cycleId} no está marcado como pagado. Status: ${billingCycle.status}, PaymentStatus: ${billingCycle.paymentStatus}. Saltando...`,
          );
          skippedCount++;
          continue;
        }

        // Verificar que tenga pagos asociados
        const cyclePayments = await paymentRepository.findByBillingCycleId(
          cycleId,
        );

        if (cyclePayments.length === 0) {
          logger.warn(
            `  ⚠️  Billing Cycle #${cycleId} no tiene pagos asociados. Saltando...`,
          );
          skippedCount++;
          continue;
        }

        // Verificar si ya existen comisiones para este billing cycle
        // Usar findByBillingCycleId para verificación directa (más eficiente)
        const existingCommissions =
          await commissionRepository.findByBillingCycleId(cycleId);

        if (existingCommissions.length > 0) {
          logger.log(
            `  ✓ Billing Cycle #${cycleId} ya tiene ${existingCommissions.length} comisión(es) generada(s). Saltando para evitar duplicidades...`,
          );
          skippedCount++;
          continue;
        }

        // Generar comisiones para este billing cycle
        logger.log(
          `  → Generando comisiones para Billing Cycle #${cycleId} (Total: ${billingCycle.totalAmount} ${billingCycle.currency})...`,
        );

        const commissions =
          await commissionCalculationService.calculateCommissionsForBillingCycle(
            billingCycle,
          );

        if (commissions.length > 0) {
          logger.log(
            `  ✅ Generadas ${commissions.length} comisión(es) para Billing Cycle #${cycleId}`,
          );
          processedCount++;
        } else {
          logger.warn(
            `  ⚠️  No se generaron comisiones para Billing Cycle #${cycleId} (posiblemente no hay asignaciones activas)`,
          );
          skippedCount++;
        }
      } catch (error) {
        errorCount++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(
          `  ❌ Error procesando Billing Cycle #${cycleId}: ${errorMessage}`,
        );
        errors.push({ cycleId, error: errorMessage });
      }
    }

    // Mostrar resumen
    console.log('\n========================================');
    console.log('📊 Resumen de Ejecución');
    console.log('========================================');
    console.log(`Total de billing cycles pagados: ${paidBillingCycles.length}`);
    console.log(`✅ Procesados exitosamente: ${processedCount}`);
    console.log(`⏭️  Omitidos (ya tienen comisiones): ${skippedCount}`);
    console.log(`❌ Errores: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n❌ Errores detallados:');
      errors.forEach(({ cycleId, error }) => {
        console.log(`  - Billing Cycle #${cycleId}: ${error}`);
      });
    }

    console.log('\n========================================');
    console.log('✅ Script completado');
    console.log('========================================');

    await app.close();
    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ Error fatal al ejecutar el script:', error);
    console.error('========================================');
    process.exit(1);
  }
}

// Solo ejecutar bootstrap si el archivo se ejecuta directamente
if (require.main === module) {
  bootstrap();
}

