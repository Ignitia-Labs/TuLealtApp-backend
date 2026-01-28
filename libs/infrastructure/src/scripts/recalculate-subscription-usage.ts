import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure.module';
import { SubscriptionUsageModule } from '@libs/application';
import { RecalculateSubscriptionUsageHandler } from '@libs/application';
import { RecalculateSubscriptionUsageRequest } from '@libs/application';
import { DataSource } from 'typeorm';

/**
 * Módulo específico para el script de recálculo de subscription usage
 */
@Module({
  imports: [InfrastructureModule, SubscriptionUsageModule],
})
class RecalculateSubscriptionUsageScriptModule {}

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
 * Script para recalcular el uso de suscripción desde los datos reales de la base de datos
 *
 * Este script:
 * 1. Recalcula los valores de tenantsCount y branchesCount desde la BD
 * 2. Puede recalcular un partner específico, una suscripción específica, o todos los partners activos
 * 3. Actualiza la tabla partner_subscription_usage con los valores correctos
 *
 * Uso:
 *   # Recalcular todos los partners activos
 *   npm run script:recalculate-subscription-usage
 *
 *   # Recalcular un partner específico
 *   npm run script:recalculate-subscription-usage -- --partnerId=1
 *
 *   # Recalcular una suscripción específica
 *   npm run script:recalculate-subscription-usage -- --partnerSubscriptionId=1
 */
async function bootstrap() {
  const logger = new Logger('RecalculateSubscriptionUsage');

  console.log('========================================');
  console.log('🔄 Recálculo de Subscription Usage');
  console.log('========================================\n');

  try {
    // Crear aplicación NestJS para tener acceso a la inyección de dependencias
    const app = await NestFactory.createApplicationContext(
      RecalculateSubscriptionUsageScriptModule,
      {
        logger: ['log', 'error', 'warn'],
      },
    );

    // Obtener el handler
    const handler = app.get(RecalculateSubscriptionUsageHandler);
    if (!handler) {
      throw new Error('No se pudo obtener RecalculateSubscriptionUsageHandler');
    }

    // Parsear argumentos de línea de comandos
    const args = process.argv.slice(2);
    const request = new RecalculateSubscriptionUsageRequest();

    // Parsear argumentos
    for (const arg of args) {
      if (arg.startsWith('--partnerId=')) {
        const partnerId = parseInt(arg.split('=')[1], 10);
        if (isNaN(partnerId)) {
          console.error('❌ Error: partnerId debe ser un número válido');
          process.exit(1);
        }
        request.partnerId = partnerId;
        console.log(`📌 Recalculando partner específico: ${partnerId}`);
      } else if (arg.startsWith('--partnerSubscriptionId=')) {
        const subscriptionId = parseInt(arg.split('=')[1], 10);
        if (isNaN(subscriptionId)) {
          console.error('❌ Error: partnerSubscriptionId debe ser un número válido');
          process.exit(1);
        }
        request.partnerSubscriptionId = subscriptionId;
        console.log(`📌 Recalculando suscripción específica: ${subscriptionId}`);
      } else if (arg === '--help' || arg === '-h') {
        console.log(`
Uso:
  npm run script:recalculate-subscription-usage [opciones]

Opciones:
  --partnerId=<id>                    Recalcular solo el partner con el ID especificado
  --partnerSubscriptionId=<id>        Recalcular solo la suscripción con el ID especificado
  --help, -h                          Mostrar esta ayuda

Ejemplos:
  # Recalcular todos los partners activos
  npm run script:recalculate-subscription-usage

  # Recalcular un partner específico
  npm run script:recalculate-subscription-usage -- --partnerId=1

  # Recalcular una suscripción específica
  npm run script:recalculate-subscription-usage -- --partnerSubscriptionId=1
        `);
        process.exit(0);
      }
    }

    // Si no se especificó ningún parámetro, recalcular todos
    if (!request.partnerId && !request.partnerSubscriptionId) {
      console.log('📌 Recalculando todos los partners activos...\n');
    }

    // Verificar datos antes del recálculo (solo si se especifica un partner)
    if (request.partnerId) {
      const dataSource = app.get(DataSource);
      if (dataSource) {
        console.log('\n📊 Verificación previa de datos:');
        console.log('─'.repeat(80));

        // Contar tenants directamente
        const tenantsCount = await dataSource.query(
          'SELECT COUNT(*) as count FROM tenants WHERE partnerId = ?',
          [request.partnerId],
        );
        console.log(`Tenants en BD: ${tenantsCount[0]?.count || 0}`);

        // Obtener tenant IDs
        const tenants = await dataSource.query('SELECT id FROM tenants WHERE partnerId = ?', [
          request.partnerId,
        ]);
        const tenantIds = tenants.map((t: any) => t.id);
        console.log(`Tenant IDs: [${tenantIds.join(', ')}]`);

        // Contar branches por tenant
        let totalBranches = 0;
        for (const tenantId of tenantIds) {
          const branchCount = await dataSource.query(
            'SELECT COUNT(*) as count FROM branches WHERE tenantId = ?',
            [tenantId],
          );
          const count = parseInt(branchCount[0]?.count || '0', 10);
          totalBranches += count;
          console.log(`  - Tenant ${tenantId}: ${count} branches`);
        }
        console.log(`Total branches en BD: ${totalBranches}`);

        // Contar customers (customer_memberships) de todos los tenants del partner
        let totalCustomers = 0;
        if (tenantIds.length > 0) {
          const customersCount = await dataSource.query(
            'SELECT COUNT(*) as count FROM customer_memberships WHERE tenantId IN (?)',
            [tenantIds],
          );
          totalCustomers = parseInt(customersCount[0]?.count || '0', 10);

          // Mostrar customers por tenant
          for (const tenantId of tenantIds) {
            const customerCount = await dataSource.query(
              'SELECT COUNT(*) as count FROM customer_memberships WHERE tenantId = ?',
              [tenantId],
            );
            const count = parseInt(customerCount[0]?.count || '0', 10);
            console.log(`  - Tenant ${tenantId}: ${count} customers`);
          }
        }
        console.log(`Total customers en BD: ${totalCustomers}`);

        // Obtener límites del partner
        const limits = await dataSource.query('SELECT * FROM partner_limits WHERE partnerId = ?', [
          request.partnerId,
        ]);
        if (limits.length > 0) {
          const limit = limits[0];
          console.log(`\nLímites del partner:`);
          console.log(`  - maxTenants: ${limit.maxTenants}`);
          console.log(`  - maxBranches: ${limit.maxBranches}`);
          console.log(`  - maxCustomers: ${limit.maxCustomers}`);
          console.log(`  - maxRewards: ${limit.maxRewards}`);
        } else {
          console.log(`\n⚠️  No se encontraron límites para el partner ${request.partnerId}`);
        }

        // Obtener uso actual (buscar cualquier suscripción, no solo activa)
        let subscription = await dataSource.query(
          'SELECT id, status FROM partner_subscriptions WHERE partnerId = ? AND status = ? ORDER BY createdAt DESC LIMIT 1',
          [request.partnerId, 'active'],
        );

        // Si no hay activa, buscar la más reciente sin importar status
        if (!subscription || subscription.length === 0) {
          subscription = await dataSource.query(
            'SELECT id, status FROM partner_subscriptions WHERE partnerId = ? ORDER BY createdAt DESC LIMIT 1',
            [request.partnerId],
          );
        }
        if (subscription.length > 0) {
          const usage = await dataSource.query(
            'SELECT * FROM partner_subscription_usage WHERE partnerSubscriptionId = ?',
            [subscription[0].id],
          );
          if (usage.length > 0) {
            const u = usage[0];
            console.log(`\nUso actual en BD:`);
            console.log(`  - tenantsCount: ${u.tenantsCount}`);
            console.log(`  - branchesCount: ${u.branchesCount}`);
            console.log(`  - customersCount: ${u.customersCount}`);
            console.log(`  - rewardsCount: ${u.rewardsCount}`);
          }
        }

        console.log('─'.repeat(80));
        console.log('');
      }
    }

    // Ejecutar el recálculo
    console.log('⏳ Iniciando recálculo...\n');
    const startTime = Date.now();

    const result = await handler.execute(request);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Mostrar resultados
    console.log('\n========================================');
    console.log('✅ Recálculo completado exitosamente');
    console.log('========================================\n');
    console.log(`📊 Partners procesados: ${result.recalculatedCount}`);
    console.log(`⏱️  Tiempo de ejecución: ${duration}s\n`);

    if (result.results.length > 0) {
      console.log('📋 Resultados detallados:');
      console.log('─'.repeat(80));
      console.log('Partner ID | Subscription ID | Tenants | Branches | Customers | Rewards');
      console.log('─'.repeat(80));

      for (const res of result.results) {
        console.log(
          `${String(res.partnerId).padEnd(10)} | ${String(res.partnerSubscriptionId).padEnd(15)} | ${String(res.tenantsCount).padEnd(7)} | ${String(res.branchesCount).padEnd(8)} | ${String(res.customersCount).padEnd(9)} | ${res.rewardsCount}`,
        );
      }
      console.log('─'.repeat(80));
    }

    console.log(`\n✅ ${result.message}\n`);

    // Cerrar la aplicación
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante el recálculo:');
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Ejecutar el script
bootstrap();
