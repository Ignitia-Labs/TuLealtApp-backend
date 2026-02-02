import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure.module';
import { DataSource } from 'typeorm';
import { Enrollment } from '@libs/domain';

/**
 * Módulo específico para el script de validación y corrección de enrollments BASE
 */
@Module({
  imports: [InfrastructureModule],
})
class ValidateBaseEnrollmentsScriptModule {}

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

interface MembershipEnrollmentStatus {
  membershipId: number;
  userId: number;
  tenantId: number;
  tenantName?: string;
  membershipStatus: string;
  hasBaseProgram: boolean;
  baseProgramId?: number;
  baseProgramName?: string;
  baseProgramStatus?: string;
  hasActiveEnrollment: boolean;
  enrollmentId?: number;
  enrollmentStatus?: string;
  enrollmentEffectiveFrom?: Date;
  enrollmentEffectiveTo?: Date | null;
  needsFix: boolean;
  fixAction?: 'CREATE' | 'REACTIVATE' | 'NONE';
}

interface ValidationResult {
  customerId?: number;
  totalMemberships: number;
  membershipsWithBaseEnrollment: number;
  membershipsWithoutBaseEnrollment: number;
  membershipsWithoutBaseProgram: number;
  membershipsNeedingFix: number;
  details: MembershipEnrollmentStatus[];
  fixed: number;
  errors: Array<{ membershipId: number; error: string }>;
}

/**
 * Script para validar y corregir enrollments al programa BASE
 *
 * Este script:
 * 1. Revisa las memberships de un customer específico (o todos los customers)
 * 2. Verifica que cada membership tenga un enrollment activo en el programa BASE del tenant
 * 3. Identifica memberships que necesitan corrección
 * 4. Permite actualizar automáticamente los enrollments faltantes
 *
 * Uso:
 * - Revisar todos los customers:
 *   npm run script:validate-base-enrollments
 *   o
 *   ts-node -r tsconfig-paths/register libs/infrastructure/src/scripts/validate-and-fix-base-enrollments.ts
 *
 * - Revisar un customer específico:
 *   ts-node -r tsconfig-paths/register libs/infrastructure/src/scripts/validate-and-fix-base-enrollments.ts --customerId=3
 *
 * - Revisar y corregir automáticamente:
 *   ts-node -r tsconfig-paths/register libs/infrastructure/src/scripts/validate-and-fix-base-enrollments.ts --fix
 *
 * - Revisar un customer específico y corregir:
 *   ts-node -r tsconfig-paths/register libs/infrastructure/src/scripts/validate-and-fix-base-enrollments.ts --customerId=3 --fix
 */
async function bootstrap() {
  const logger = new Logger('ValidateBaseEnrollments');

  // Parsear argumentos de línea de comandos
  const args = process.argv.slice(2);
  const customerIdArg = args.find((arg) => arg.startsWith('--customerId='));
  const customerId = customerIdArg ? parseInt(customerIdArg.split('=')[1], 10) : undefined;
  const shouldFix = args.includes('--fix');

  console.log('========================================');
  console.log('🔍 Validación de Enrollments BASE');
  console.log('========================================\n');

  if (customerId) {
    console.log(`📋 Modo: Revisar customer específico (ID: ${customerId})`);
  } else {
    console.log(`📋 Modo: Revisar todos los customers`);
  }

  if (shouldFix) {
    console.log(`🔧 Modo corrección: ACTIVADO (se crearán/reactivarán enrollments faltantes)`);
  } else {
    console.log(`🔧 Modo corrección: DESACTIVADO (solo reporte)`);
  }

  console.log('');

  try {
    // Crear aplicación NestJS para tener acceso a la inyección de dependencias
    const app = await NestFactory.createApplicationContext(ValidateBaseEnrollmentsScriptModule, {
      logger: ['log', 'error', 'warn'],
    });

    // Obtener DataSource para hacer queries directas
    const dataSource = app.get(DataSource);
    if (!dataSource) {
      throw new Error('No se pudo obtener el DataSource');
    }

    const result: ValidationResult = {
      customerId,
      totalMemberships: 0,
      membershipsWithBaseEnrollment: 0,
      membershipsWithoutBaseEnrollment: 0,
      membershipsWithoutBaseProgram: 0,
      membershipsNeedingFix: 0,
      details: [],
      fixed: 0,
      errors: [],
    };

    // 1. Obtener memberships (todas o de un customer específico)
    let membershipsQuery = `
      SELECT 
        cm.id as membershipId,
        cm.userId,
        cm.tenantId,
        cm.status as membershipStatus,
        t.name as tenantName
      FROM customer_memberships cm
      INNER JOIN tenants t ON t.id = cm.tenantId
      WHERE cm.status = 'active'
    `;

    if (customerId) {
      membershipsQuery += ` AND cm.userId = ${customerId}`;
    }

    membershipsQuery += ` ORDER BY cm.userId, cm.tenantId`;

    const memberships = await dataSource.query(membershipsQuery);
    result.totalMemberships = memberships.length;

    console.log(`📊 Total de memberships activas encontradas: ${result.totalMemberships}\n`);

    if (memberships.length === 0) {
      console.log('✅ No hay memberships activas para revisar.');
      await app.close();
      return;
    }

    // 2. Para cada membership, verificar enrollment al BASE
    for (const membership of memberships) {
      const status: MembershipEnrollmentStatus = {
        membershipId: membership.membershipId,
        userId: membership.userId,
        tenantId: membership.tenantId,
        tenantName: membership.tenantName,
        membershipStatus: membership.membershipStatus,
        hasBaseProgram: false,
        hasActiveEnrollment: false,
        needsFix: false,
      };

      // Buscar programa BASE activo del tenant
      const basePrograms = await dataSource.query(
        `
        SELECT 
          lp.id,
          lp.name,
          lp.status,
          lp.activeFrom,
          lp.activeTo
        FROM loyalty_programs lp
        WHERE lp.tenantId = ?
          AND lp.programType = 'BASE'
          AND lp.status = 'active'
          AND (lp.activeFrom IS NULL OR lp.activeFrom <= NOW())
          AND (lp.activeTo IS NULL OR lp.activeTo >= NOW())
        ORDER BY lp.priorityRank DESC, lp.createdAt ASC
        LIMIT 1
      `,
        [membership.tenantId],
      );

      if (basePrograms.length === 0) {
        status.needsFix = true;
        status.fixAction = 'NONE'; // No se puede corregir sin programa BASE
        result.membershipsWithoutBaseProgram++;
        result.details.push(status);
        continue;
      }

      const baseProgram = basePrograms[0];
      status.hasBaseProgram = true;
      status.baseProgramId = baseProgram.id;
      status.baseProgramName = baseProgram.name;
      status.baseProgramStatus = baseProgram.status;

      // Buscar enrollment activo en el programa BASE
      const enrollments = await dataSource.query(
        `
        SELECT 
          e.id,
          e.status,
          e.effectiveFrom,
          e.effectiveTo
        FROM enrollments e
        WHERE e.membershipId = ?
          AND e.programId = ?
      `,
        [membership.membershipId, baseProgram.id],
      );

      if (enrollments.length > 0) {
        const enrollment = enrollments[0];
        status.enrollmentId = enrollment.id;
        status.enrollmentStatus = enrollment.status;
        status.enrollmentEffectiveFrom = enrollment.effectiveFrom
          ? new Date(enrollment.effectiveFrom)
          : undefined;
        status.enrollmentEffectiveTo = enrollment.effectiveTo
          ? new Date(enrollment.effectiveTo)
          : null;

        // Verificar si el enrollment está activo
        const enrollmentEntity = Enrollment.create(
          membership.membershipId,
          baseProgram.id,
          status.enrollmentEffectiveFrom || new Date(),
          status.enrollmentEffectiveTo,
          null,
          enrollment.status as any,
          enrollment.id,
        );

        if (enrollmentEntity.isActive()) {
          status.hasActiveEnrollment = true;
          result.membershipsWithBaseEnrollment++;
        } else {
          // Enrollment existe pero no está activo
          status.needsFix = true;
          status.fixAction = 'REACTIVATE';
          result.membershipsWithoutBaseEnrollment++;
          result.membershipsNeedingFix++;
        }
      } else {
        // No existe enrollment
        status.needsFix = true;
        status.fixAction = 'CREATE';
        result.membershipsWithoutBaseEnrollment++;
        result.membershipsNeedingFix++;
      }

      result.details.push(status);
    }

    // 3. Mostrar reporte detallado
    console.log('========================================');
    console.log('📋 Reporte Detallado');
    console.log('========================================\n');

    console.log('📊 Estadísticas Generales:');
    console.log(`   - Total memberships revisadas: ${result.totalMemberships}`);
    console.log(`   - Con enrollment BASE activo: ${result.membershipsWithBaseEnrollment} ✅`);
    console.log(`   - Sin enrollment BASE activo: ${result.membershipsWithoutBaseEnrollment} ⚠️`);
    console.log(`   - Sin programa BASE disponible: ${result.membershipsWithoutBaseProgram} ❌`);
    console.log(`   - Necesitan corrección: ${result.membershipsNeedingFix} 🔧\n`);

    // Mostrar detalles de memberships que necesitan corrección
    const needsFix = result.details.filter((d) => d.needsFix);
    if (needsFix.length > 0) {
      console.log('⚠️  Memberships que necesitan corrección:\n');
      needsFix.forEach((status, index) => {
        console.log(`   ${index + 1}. Membership ID: ${status.membershipId}`);
        console.log(`      - Customer ID: ${status.userId}`);
        console.log(`      - Tenant ID: ${status.tenantId} (${status.tenantName || 'N/A'})`);

        if (!status.hasBaseProgram) {
          console.log(`      - ❌ PROBLEMA: No hay programa BASE activo para este tenant`);
          console.log(`      - 🔧 ACCIÓN: No se puede corregir (crear programa BASE primero)`);
        } else {
          console.log(
            `      - Programa BASE: ${status.baseProgramName} (ID: ${status.baseProgramId})`,
          );

          if (status.fixAction === 'CREATE') {
            console.log(`      - ❌ PROBLEMA: No existe enrollment al programa BASE`);
            console.log(`      - 🔧 ACCIÓN: Crear nuevo enrollment`);
          } else if (status.fixAction === 'REACTIVATE') {
            console.log(
              `      - ❌ PROBLEMA: Enrollment existe pero está ${status.enrollmentStatus}`,
            );
            console.log(`      - 🔧 ACCIÓN: Reactivar enrollment existente`);
            if (status.enrollmentEffectiveTo) {
              console.log(
                `      -   Fecha de expiración: ${status.enrollmentEffectiveTo.toISOString()}`,
              );
            }
          }
        }
        console.log('');
      });
    } else {
      console.log('✅ Todas las memberships tienen enrollment BASE activo.\n');
    }

    // 4. Corregir enrollments si está habilitado
    if (shouldFix && result.membershipsNeedingFix > 0) {
      console.log('========================================');
      console.log('🔧 Corrección Automática');
      console.log('========================================\n');

      for (const status of needsFix) {
        if (status.fixAction === 'NONE') {
          console.log(
            `⏭️  Saltando membership ${status.membershipId}: No hay programa BASE disponible`,
          );
          continue;
        }

        try {
          if (status.fixAction === 'CREATE') {
            // Crear nuevo enrollment
            await dataSource.query(
              `
              INSERT INTO enrollments (
                membershipId,
                programId,
                status,
                effectiveFrom,
                effectiveTo,
                metadata,
                createdAt,
                updatedAt
              ) VALUES (?, ?, 'ACTIVE', NOW(), NULL, NULL, NOW(), NOW())
            `,
              [status.membershipId, status.baseProgramId],
            );

            console.log(
              `✅ Enrollment creado para membership ${status.membershipId} en programa BASE ${status.baseProgramId}`,
            );
            result.fixed++;
          } else if (status.fixAction === 'REACTIVATE') {
            // Reactivar enrollment existente
            await dataSource.query(
              `
              UPDATE enrollments
              SET status = 'ACTIVE',
                  effectiveFrom = NOW(),
                  effectiveTo = NULL,
                  updatedAt = NOW()
              WHERE id = ?
            `,
              [status.enrollmentId],
            );

            console.log(
              `✅ Enrollment ${status.enrollmentId} reactivado para membership ${status.membershipId}`,
            );
            result.fixed++;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`❌ Error corrigiendo membership ${status.membershipId}: ${errorMsg}`);
          result.errors.push({
            membershipId: status.membershipId,
            error: errorMsg,
          });
        }
      }

      console.log('\n📊 Resumen de corrección:');
      console.log(`   - Enrollments corregidos: ${result.fixed} ✅`);
      if (result.errors.length > 0) {
        console.log(`   - Errores: ${result.errors.length} ❌`);
        result.errors.forEach((err) => {
          console.log(`      - Membership ${err.membershipId}: ${err.error}`);
        });
      }
    } else if (result.membershipsNeedingFix > 0) {
      console.log('💡 Para corregir automáticamente, ejecuta el script con --fix');
      console.log('   Ejemplo: npm run script:validate-base-enrollments -- --fix\n');
    }

    // 5. Resumen final
    console.log('========================================');
    console.log('✅ Validación Completada');
    console.log('========================================\n');

    if (result.membershipsNeedingFix === 0) {
      console.log('✅ Todas las memberships están correctamente enrolladas al programa BASE.');
    } else if (shouldFix && result.fixed === result.membershipsNeedingFix) {
      console.log(`✅ Se corrigieron ${result.fixed} memberships exitosamente.`);
    } else if (shouldFix) {
      console.log(
        `⚠️  Se corrigieron ${result.fixed} de ${result.membershipsNeedingFix} memberships.`,
      );
      if (result.errors.length > 0) {
        console.log(`   Revisa los errores arriba para más detalles.`);
      }
    } else {
      console.log(
        `⚠️  Se encontraron ${result.membershipsNeedingFix} memberships que necesitan corrección.`,
      );
      console.log(`   Ejecuta con --fix para corregirlas automáticamente.`);
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
