import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure.module';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Módulo específico para el script de validación de migración
 */
@Module({
  imports: [InfrastructureModule],
})
class ValidationScriptModule {}

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

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalMemberships: number;
    totalCustomerPartners: number;
    membershipsWithPartner: number;
    membershipsWithoutPartner: number;
    duplicateAssociations: number;
    orphanedAssociations: number;
    missingTenants: number;
    missingBranches: number;
  };
}

/**
 * Script para validar la integridad de la migración de customer_partners
 *
 * Este script:
 * 1. Verifica que todas las memberships con tenant válido tengan asociación en customer_partners
 * 2. Verifica que no haya duplicados
 * 3. Verifica que no haya asociaciones huérfanas
 * 4. Verifica integridad referencial (tenants, branches)
 * 5. Genera un reporte detallado de la validación
 *
 * Uso:
 * npm run script:validate-customer-partners
 * o
 * ts-node -r tsconfig-paths/register libs/infrastructure/src/scripts/validate-customer-partners-migration.ts
 */
async function bootstrap() {
  const logger = new Logger('ValidateCustomerPartnersMigration');

  console.log('========================================');
  console.log('🔍 Validación de Migración Customer-Partners');
  console.log('========================================\n');

  try {
    // Crear aplicación NestJS para tener acceso a la inyección de dependencias
    const app = await NestFactory.createApplicationContext(ValidationScriptModule, {
      logger: ['log', 'error', 'warn'],
    });

    // Obtener DataSource para hacer queries directas
    const dataSource = app.get(DataSource);
    if (!dataSource) {
      throw new Error('No se pudo obtener el DataSource');
    }

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      stats: {
        totalMemberships: 0,
        totalCustomerPartners: 0,
        membershipsWithPartner: 0,
        membershipsWithoutPartner: 0,
        duplicateAssociations: 0,
        orphanedAssociations: 0,
        missingTenants: 0,
        missingBranches: 0,
      },
    };

    // 1. Contar total de memberships
    const membershipsCount = await dataSource.query(
      'SELECT COUNT(*) as count FROM customer_memberships',
    );
    result.stats.totalMemberships = parseInt(membershipsCount[0]?.count || '0', 10);
    console.log(`📊 Total de customer_memberships: ${result.stats.totalMemberships}`);

    // 2. Contar total de customer_partners
    const partnersCount = await dataSource.query('SELECT COUNT(*) as count FROM customer_partners');
    result.stats.totalCustomerPartners = parseInt(partnersCount[0]?.count || '0', 10);
    console.log(`📊 Total de customer_partners: ${result.stats.totalCustomerPartners}`);

    // 3. Verificar memberships que deberían tener asociación pero no la tienen
    const missingAssociations = await dataSource.query(`
      SELECT COUNT(*) as count
      FROM customer_memberships cm
      INNER JOIN tenants t ON cm.tenantId = t.id
      WHERE t.partnerId IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM customer_partners cp
          WHERE cp.userId = cm.userId
            AND cp.partnerId = t.partnerId
            AND cp.tenantId = cm.tenantId
        )
    `);
    const missingCount = parseInt(missingAssociations[0]?.count || '0', 10);
    result.stats.membershipsWithoutPartner = missingCount;

    if (missingCount > 0) {
      result.warnings.push(
        `Se encontraron ${missingCount} memberships que deberían tener asociación en customer_partners pero no la tienen`,
      );
      console.warn(`⚠️  Memberships sin asociación: ${missingCount}`);
    } else {
      console.log(`✅ Todas las memberships válidas tienen asociación en customer_partners`);
    }

    // 4. Verificar duplicados (violaciones del constraint único)
    const duplicates = await dataSource.query(`
      SELECT userId, partnerId, tenantId, COUNT(*) as count
      FROM customer_partners
      GROUP BY userId, partnerId, tenantId
      HAVING COUNT(*) > 1
    `);
    result.stats.duplicateAssociations = duplicates.length;

    if (duplicates.length > 0) {
      result.errors.push(
        `Se encontraron ${duplicates.length} combinaciones duplicadas (userId, partnerId, tenantId)`,
      );
      result.isValid = false;
      console.error(`❌ Duplicados encontrados: ${duplicates.length}`);
      duplicates.forEach((dup: any) => {
        console.error(
          `   - userId: ${dup.userId}, partnerId: ${dup.partnerId}, tenantId: ${dup.tenantId} (${dup.count} veces)`,
        );
      });
    } else {
      console.log(`✅ No se encontraron duplicados`);
    }

    // 5. Verificar asociaciones huérfanas (sin membership correspondiente)
    const orphaned = await dataSource.query(`
      SELECT COUNT(*) as count
      FROM customer_partners cp
      WHERE NOT EXISTS (
        SELECT 1
        FROM customer_memberships cm
        WHERE cm.userId = cp.userId
          AND cm.tenantId = cp.tenantId
      )
    `);
    result.stats.orphanedAssociations = parseInt(orphaned[0]?.count || '0', 10);

    if (result.stats.orphanedAssociations > 0) {
      result.warnings.push(
        `Se encontraron ${result.stats.orphanedAssociations} asociaciones sin membership correspondiente`,
      );
      console.warn(`⚠️  Asociaciones huérfanas: ${result.stats.orphanedAssociations}`);
    } else {
      console.log(`✅ No se encontraron asociaciones huérfanas`);
    }

    // 6. Verificar integridad referencial - tenants
    const missingTenants = await dataSource.query(`
      SELECT COUNT(*) as count
      FROM customer_partners cp
      WHERE NOT EXISTS (
        SELECT 1 FROM tenants t WHERE t.id = cp.tenantId
      )
    `);
    result.stats.missingTenants = parseInt(missingTenants[0]?.count || '0', 10);

    if (result.stats.missingTenants > 0) {
      result.errors.push(
        `Se encontraron ${result.stats.missingTenants} asociaciones con tenantId inválido`,
      );
      result.isValid = false;
      console.error(`❌ Tenants faltantes: ${result.stats.missingTenants}`);
    } else {
      console.log(`✅ Todas las asociaciones tienen tenant válido`);
    }

    // 7. Verificar integridad referencial - branches (pueden ser null)
    const missingBranches = await dataSource.query(`
      SELECT COUNT(*) as count
      FROM customer_partners cp
      WHERE cp.registrationBranchId IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM branches b WHERE b.id = cp.registrationBranchId
        )
    `);
    result.stats.missingBranches = parseInt(missingBranches[0]?.count || '0', 10);

    if (result.stats.missingBranches > 0) {
      result.warnings.push(
        `Se encontraron ${result.stats.missingBranches} asociaciones con registrationBranchId inválido (puede ser histórico)`,
      );
      console.warn(
        `⚠️  Branches faltantes: ${result.stats.missingBranches} (puede ser histórico si la branch fue eliminada)`,
      );
    } else {
      console.log(`✅ Todas las asociaciones tienen branch válido o null`);
    }

    // 8. Verificar integridad referencial - partners
    const missingPartners = await dataSource.query(`
      SELECT COUNT(*) as count
      FROM customer_partners cp
      WHERE NOT EXISTS (
        SELECT 1 FROM partners p WHERE p.id = cp.partnerId
      )
    `);
    const missingPartnersCount = parseInt(missingPartners[0]?.count || '0', 10);

    if (missingPartnersCount > 0) {
      result.errors.push(
        `Se encontraron ${missingPartnersCount} asociaciones con partnerId inválido`,
      );
      result.isValid = false;
      console.error(`❌ Partners faltantes: ${missingPartnersCount}`);
    } else {
      console.log(`✅ Todas las asociaciones tienen partner válido`);
    }

    // 9. Verificar integridad referencial - users
    const missingUsers = await dataSource.query(`
      SELECT COUNT(*) as count
      FROM customer_partners cp
      WHERE NOT EXISTS (
        SELECT 1 FROM users u WHERE u.id = cp.userId
      )
    `);
    const missingUsersCount = parseInt(missingUsers[0]?.count || '0', 10);

    if (missingUsersCount > 0) {
      result.errors.push(`Se encontraron ${missingUsersCount} asociaciones con userId inválido`);
      result.isValid = false;
      console.error(`❌ Users faltantes: ${missingUsersCount}`);
    } else {
      console.log(`✅ Todas las asociaciones tienen user válido`);
    }

    // 10. Estadísticas adicionales
    const membershipsWithPartner = await dataSource.query(`
      SELECT COUNT(DISTINCT cm.id) as count
      FROM customer_memberships cm
      INNER JOIN tenants t ON cm.tenantId = t.id
      WHERE t.partnerId IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM customer_partners cp
          WHERE cp.userId = cm.userId
            AND cp.partnerId = t.partnerId
            AND cp.tenantId = cm.tenantId
        )
    `);
    result.stats.membershipsWithPartner = parseInt(membershipsWithPartner[0]?.count || '0', 10);

    // Reporte final
    console.log('\n========================================');
    console.log('📋 Reporte de Validación');
    console.log('========================================\n');

    console.log('📊 Estadísticas:');
    console.log(`   - Total customer_memberships: ${result.stats.totalMemberships}`);
    console.log(`   - Total customer_partners: ${result.stats.totalCustomerPartners}`);
    console.log(`   - Memberships con asociación: ${result.stats.membershipsWithPartner}`);
    console.log(`   - Memberships sin asociación: ${result.stats.membershipsWithoutPartner}`);
    console.log(`   - Duplicados: ${result.stats.duplicateAssociations}`);
    console.log(`   - Asociaciones huérfanas: ${result.stats.orphanedAssociations}`);
    console.log(`   - Tenants faltantes: ${result.stats.missingTenants}`);
    console.log(`   - Branches faltantes: ${result.stats.missingBranches}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errores encontrados:');
      result.errors.forEach((error) => console.log(`   - ${error}`));
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Advertencias:');
      result.warnings.forEach((warning) => console.log(`   - ${warning}`));
    }

    if (result.isValid && result.warnings.length === 0) {
      console.log('\n✅ Validación exitosa: Todos los datos están correctos');
    } else if (result.isValid) {
      console.log('\n✅ Validación completada con advertencias (no críticas)');
    } else {
      console.log('\n❌ Validación fallida: Se encontraron errores críticos');
      process.exit(1);
    }

    await app.close();
  } catch (error) {
    logger.error('Error durante la validación', error);
    console.error('\n❌ Error durante la validación:', error);
    process.exit(1);
  }
}

// Ejecutar el script
bootstrap();
