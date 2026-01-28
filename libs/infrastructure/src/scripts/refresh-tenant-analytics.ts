/**
 * Script CLI para refrescar analytics de tenants
 * Uso: npm run script:refresh-analytics [--tenantId=1] [--all]
 */

import { NestFactory } from '@nestjs/core';
import { AdminApiModule } from '../../../../apps/admin-api/src/admin-api.module';
import { TenantAnalyticsUpdaterService } from '@libs/application';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AdminApiModule);
  const updaterService = app.get(TenantAnalyticsUpdaterService);

  const args = process.argv.slice(2);
  const tenantIdArg = args.find((arg) => arg.startsWith('--tenantId='));
  const allArg = args.includes('--all');

  if (tenantIdArg) {
    // Refresh de un tenant específico
    const tenantId = parseInt(tenantIdArg.split('=')[1], 10);
    if (isNaN(tenantId)) {
      console.error('❌ Error: tenantId debe ser un número válido');
      process.exit(1);
    }

    console.log(`🔄 Refrescando analytics del tenant ${tenantId}...`);
    try {
      await updaterService.updateTenantAnalytics(tenantId);
      console.log(`✅ Analytics del tenant ${tenantId} actualizado exitosamente`);
    } catch (error) {
      console.error(`❌ Error actualizando analytics del tenant ${tenantId}:`, error);
      process.exit(1);
    }
  } else if (allArg) {
    // Refresh de todos los tenants activos
    console.log('🔄 Refrescando analytics de todos los tenants activos...');
    const tenantRepository = app.get('ITenantRepository');
    const tenants = await tenantRepository.findAllActive();

    console.log(`📊 Encontrados ${tenants.length} tenants activos`);

    let successCount = 0;
    let errorCount = 0;

    for (const tenant of tenants) {
      try {
        console.log(`  ⏳ Procesando tenant ${tenant.id} (${tenant.name})...`);
        await updaterService.updateTenantAnalytics(tenant.id);
        successCount++;
        console.log(`  ✅ Tenant ${tenant.id} actualizado`);
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error en tenant ${tenant.id}:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log(`\n✅ Proceso completado: ${successCount} exitosos, ${errorCount} errores`);
  } else {
    console.error('❌ Error: Debes especificar --tenantId=<id> o --all');
    console.error('\nUso:');
    console.error('  npm run script:refresh-analytics -- --tenantId=1');
    console.error('  npm run script:refresh-analytics -- --all');
    process.exit(1);
  }

  await app.close();
}

bootstrap().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
