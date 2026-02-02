import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para enrollar automáticamente a customers existentes en el programa BASE
 * de sus respectivos tenants.
 *
 * Esta migración es necesaria porque el enrollment automático al BASE fue implementado
 * después de que algunos customers ya estaban registrados. Sin enrollment activo,
 * estos customers no pueden acumular puntos.
 *
 * La migración:
 * 1. Encuentra todas las memberships activas sin enrollment al BASE
 * 2. Busca el programa BASE activo de cada tenant
 * 3. Crea enrollments automáticos para esas memberships
 */
export class AutoEnrollExistingCustomersInBaseProgram1807000000000
  implements MigrationInterface
{
  name = 'AutoEnrollExistingCustomersInBaseProgram1807000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(
      '🔄 Iniciando migración: Auto-enrollar customers existentes en programa BASE',
    );

    // Verificar que las tablas existan
    const membershipsTable = await queryRunner.getTable('customer_memberships');
    const enrollmentsTable = await queryRunner.getTable('enrollments');
    const programsTable = await queryRunner.getTable('loyalty_programs');

    if (!membershipsTable || !enrollmentsTable || !programsTable) {
      console.warn(
        '⚠️  Una o más tablas requeridas no existen. Saltando migración.',
      );
      return;
    }

    // Encontrar memberships activas sin enrollment al BASE
    // Para cada membership, buscar si tiene un enrollment activo en un programa BASE
    const membershipsWithoutBaseEnrollment = await queryRunner.query(`
      SELECT DISTINCT cm.id as membershipId, cm.tenantId, cm.userId
      FROM customer_memberships cm
      WHERE cm.status = 'active'
        AND NOT EXISTS (
          SELECT 1
          FROM enrollments e
          INNER JOIN loyalty_programs lp ON lp.id = e.programId
          WHERE e.membershipId = cm.id
            AND lp.programType = 'BASE'
            AND lp.status = 'active'
            AND e.status = 'ACTIVE'
            AND (lp.activeFrom IS NULL OR lp.activeFrom <= NOW())
            AND (lp.activeTo IS NULL OR lp.activeTo >= NOW())
            AND (e.effectiveFrom IS NULL OR e.effectiveFrom <= NOW())
            AND (e.effectiveTo IS NULL OR e.effectiveTo >= NOW())
        )
    `);

    console.log(
      `📊 Encontradas ${membershipsWithoutBaseEnrollment.length} memberships sin enrollment al BASE`,
    );

    if (membershipsWithoutBaseEnrollment.length === 0) {
      console.log('✅ No hay memberships que necesiten enrollment. Migración completada.');
      return;
    }

    let enrolledCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Para cada membership, encontrar su programa BASE y crear enrollment
    for (const membership of membershipsWithoutBaseEnrollment) {
      try {
        // Buscar programa BASE activo del tenant
        const basePrograms = await queryRunner.query(
          `
          SELECT lp.id, lp.name, lp.tenantId
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
          console.warn(
            `⚠️  No se encontró programa BASE activo para tenant ${membership.tenantId} (membership ${membership.membershipId}). Saltando.`,
          );
          skippedCount++;
          continue;
        }

        const baseProgram = basePrograms[0];

        // Verificar que no exista ya un enrollment (por si acaso)
        const existingEnrollments = await queryRunner.query(
          `
          SELECT id
          FROM enrollments
          WHERE membershipId = ? AND programId = ?
        `,
          [membership.membershipId, baseProgram.id],
        );

        if (existingEnrollments.length > 0) {
          // Si existe pero no está activo, actualizarlo
          const existingEnrollment = existingEnrollments[0];
          await queryRunner.query(
            `
            UPDATE enrollments
            SET status = 'ACTIVE',
                effectiveFrom = NOW(),
                effectiveTo = NULL,
                updatedAt = NOW()
            WHERE id = ?
          `,
            [existingEnrollment.id],
          );
          console.log(
            `✅ Enrollment existente reactivado para membership ${membership.membershipId} en programa BASE ${baseProgram.id}`,
          );
          enrolledCount++;
        } else {
          // Crear nuevo enrollment
          await queryRunner.query(
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
            [membership.membershipId, baseProgram.id],
          );
          console.log(
            `✅ Enrollment creado para membership ${membership.membershipId} en programa BASE ${baseProgram.id} (tenant ${membership.tenantId})`,
          );
          enrolledCount++;
        }
      } catch (error) {
        console.error(
          `❌ Error procesando membership ${membership.membershipId}:`,
          error,
        );
        errorCount++;
      }
    }

    console.log('\n📊 Resumen de la migración:');
    console.log(`   ✅ Enrollments creados/reactivados: ${enrolledCount}`);
    console.log(`   ⚠️  Saltados (sin programa BASE): ${skippedCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(
      `\n✅ Migración completada: ${enrolledCount} customers enrollados automáticamente en programa BASE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log(
      '🔄 Iniciando rollback: Eliminar enrollments automáticos al BASE creados por esta migración',
    );

    // Esta migración no tiene un rollback seguro porque no podemos distinguir
    // entre enrollments creados por esta migración y enrollments creados manualmente
    // o por el código después de la implementación del auto-enrollment.
    //
    // En su lugar, simplemente marcamos los enrollments al BASE como ENDED
    // para los que fueron creados en la fecha de esta migración.
    //
    // NOTA: Este rollback es destructivo y debe usarse con precaución.

    const enrollmentsTable = await queryRunner.getTable('enrollments');
    if (!enrollmentsTable) {
      console.warn('⚠️  La tabla enrollments no existe. Saltando rollback.');
      return;
    }

    // Marcar como ENDED los enrollments al BASE creados hoy
    // (asumiendo que esta migración se ejecuta el mismo día)
    const result = await queryRunner.query(
      `
      UPDATE enrollments e
      INNER JOIN loyalty_programs lp ON lp.id = e.programId
      SET e.status = 'ENDED',
          e.effectiveTo = NOW(),
          e.updatedAt = NOW()
      WHERE lp.programType = 'BASE'
        AND e.status = 'ACTIVE'
        AND DATE(e.createdAt) = CURDATE()
    `,
    );

    console.log(
      `✅ Rollback completado: ${result.affectedRows || 0} enrollments marcados como ENDED`,
    );
    console.log(
      '⚠️  NOTA: Este rollback afecta todos los enrollments al BASE creados hoy.',
    );
    console.log(
      '    Si necesitas un rollback más específico, debes hacerlo manualmente.',
    );
  }
}
