import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para asignar billingCycleId a comisiones existentes
 *
 * Esta migración es parte de la Fase 2 del plan para asociar comisiones
 * directamente a billing cycles.
 *
 * Para cada comisión existente:
 * 1. Obtiene el paymentId de la comisión
 * 2. Busca el pago correspondiente
 * 3. Si el pago tiene billingCycleId, lo asigna a la comisión
 *
 * Las comisiones de pagos sin billing cycle quedarán con billingCycleId = NULL
 * (esto es correcto para pagos directos sin facturación)
 */
export class MigrateBillingCycleIdToExistingCommissions1770510000000 implements MigrationInterface {
  name = 'MigrateBillingCycleIdToExistingCommissions1770510000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Iniciando migración de billingCycleId a comisiones existentes...');

    // Verificar que la columna billingCycleId existe
    const table = await queryRunner.getTable('commissions');
    if (!table) {
      console.log('⚠️ Tabla commissions no encontrada.');
      return;
    }

    const billingCycleIdColumn = table.findColumnByName('billingCycleId');
    if (!billingCycleIdColumn) {
      console.log(
        '⚠️ Columna billingCycleId no existe. Ejecuta primero la migración AddBillingCycleIdToCommissions.',
      );
      return;
    }

    // Contar comisiones totales
    const totalCommissionsResult = await queryRunner.query(
      'SELECT COUNT(*) as total FROM commissions',
    );
    const totalCommissions = totalCommissionsResult[0]?.total || 0;

    console.log(`📊 Total de comisiones a procesar: ${totalCommissions}`);

    if (totalCommissions === 0) {
      console.log('✅ No hay comisiones para migrar.');
      return;
    }

    // Contar comisiones que ya tienen billingCycleId
    const alreadyMigratedResult = await queryRunner.query(
      'SELECT COUNT(*) as total FROM commissions WHERE billingCycleId IS NOT NULL',
    );
    const alreadyMigrated = alreadyMigratedResult[0]?.total || 0;

    if (alreadyMigrated > 0) {
      console.log(
        `⚠️ ${alreadyMigrated} comisiones ya tienen billingCycleId asignado. Continuando con las restantes...`,
      );
    }

    // Actualizar comisiones existentes con billingCycleId basándose en paymentId
    // Solo actualizar las que tienen paymentId y el pago tiene billingCycleId
    const updateResult = await queryRunner.query(`
      UPDATE commissions c
      INNER JOIN payments p ON c.paymentId = p.id
      SET c.billingCycleId = p.billingCycleId
      WHERE c.billingCycleId IS NULL
        AND p.billingCycleId IS NOT NULL
    `);

    const affectedRows = updateResult.affectedRows || 0;

    console.log(`✅ ${affectedRows} comisiones actualizadas con billingCycleId.`);

    // Verificar comisiones que no pudieron ser migradas (pagos sin billing cycle)
    const notMigratedResult = await queryRunner.query(`
      SELECT COUNT(*) as total
      FROM commissions c
      INNER JOIN payments p ON c.paymentId = p.id
      WHERE c.billingCycleId IS NULL
        AND p.billingCycleId IS NULL
    `);
    const notMigrated = notMigratedResult[0]?.total || 0;

    if (notMigrated > 0) {
      console.log(
        `ℹ️  ${notMigrated} comisiones no pudieron ser migradas (pagos sin billing cycle asociado). Esto es normal para pagos directos sin facturación.`,
      );
    }

    // Verificar comisiones huérfanas (paymentId que no existe)
    const orphanedResult = await queryRunner.query(`
      SELECT COUNT(*) as total
      FROM commissions c
      LEFT JOIN payments p ON c.paymentId = p.id
      WHERE p.id IS NULL
    `);
    const orphaned = orphanedResult[0]?.total || 0;

    if (orphaned > 0) {
      console.log(
        `⚠️  ${orphaned} comisiones tienen paymentId que no existe en la tabla payments. Estas no pudieron ser migradas.`,
      );
    }

    // Resumen final
    const finalMigratedResult = await queryRunner.query(
      'SELECT COUNT(*) as total FROM commissions WHERE billingCycleId IS NOT NULL',
    );
    const finalMigrated = finalMigratedResult[0]?.total || 0;

    console.log('\n========================================');
    console.log('📊 Resumen de Migración');
    console.log('========================================');
    console.log(`Total de comisiones: ${totalCommissions}`);
    console.log(`Comisiones migradas: ${finalMigrated}`);
    console.log(`Comisiones sin billing cycle: ${notMigrated}`);
    if (orphaned > 0) {
      console.log(`Comisiones huérfanas: ${orphaned}`);
    }
    console.log('========================================\n');

    console.log('✅ Migración de billingCycleId completada.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Revirtiendo migración de billingCycleId...');

    // Eliminar billingCycleId de todas las comisiones (establecer a NULL)
    const result = await queryRunner.query(`
      UPDATE commissions
      SET billingCycleId = NULL
      WHERE billingCycleId IS NOT NULL
    `);

    const affectedRows = result.affectedRows || 0;
    console.log(`✅ ${affectedRows} comisiones revertidas (billingCycleId establecido a NULL).`);
  }
}
