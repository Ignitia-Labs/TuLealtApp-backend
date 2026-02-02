import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración: Remover columnas JSON antiguas de loyalty_programs
 *
 * Esta migración elimina las columnas JSON antiguas después de:
 * 1. Ejecutar la migración de datos
 * 2. Validar que todo funciona correctamente con datos relacionales
 * 3. Tener un período de gracia donde ambos sistemas coexisten
 *
 * ⚠️ ADVERTENCIA: Esta migración es IRREVERSIBLE.
 * Una vez ejecutada, los datos JSON originales se perderán.
 * Asegúrate de tener backups completos antes de ejecutar.
 *
 * Fase 3.5.2 del Plan de Eliminación de Tipos JSON
 */
export class RemoveJsonColumnsFromLoyaltyPrograms1797000000000 implements MigrationInterface {
  name = 'RemoveJsonColumnsFromLoyaltyPrograms1797000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const loyaltyProgramsTable = await queryRunner.getTable('loyalty_programs');

    if (!loyaltyProgramsTable) {
      throw new Error('Tabla loyalty_programs no existe');
    }

    // ============================================================================
    // VALIDACIÓN PREVIA: Verificar que las columnas relacionales tienen datos
    // ============================================================================

    const totalRecords = await queryRunner.query(`SELECT COUNT(*) as count FROM loyalty_programs`);

    if (totalRecords[0].count === 0) {
      console.warn('⚠️  Advertencia: No hay registros en loyalty_programs. Continuando...');
    } else {
      // Verificar que las columnas relacionales tienen datos válidos
      const recordsWithRelationalData = await queryRunner.query(
        `SELECT COUNT(*) as count FROM loyalty_programs
         WHERE stacking_allowed IS NOT NULL
           AND expiration_enabled IS NOT NULL`,
      );

      // Verificar que hay earning domains migrados (si hay programas con earning domains)
      // Primero verificar si la columna JSON existe antes de consultarla
      const earningDomainsColumn = loyaltyProgramsTable.findColumnByName('earningDomains');
      if (earningDomainsColumn) {
        const programsWithEarningDomains = await queryRunner.query(
          `SELECT COUNT(DISTINCT lp.id) as count
           FROM loyalty_programs lp
           WHERE lp.\`earningDomains\` IS NOT NULL
             AND JSON_LENGTH(lp.\`earningDomains\`) > 0`,
        );

        const migratedEarningDomains = await queryRunner.query(
          `SELECT COUNT(*) as count FROM loyalty_program_earning_domains`,
        );

        if (programsWithEarningDomains[0].count > 0 && migratedEarningDomains[0].count === 0) {
          throw new Error(
            `No se pueden remover columnas JSON: Hay programas con earningDomains pero no hay datos migrados. ` +
              `Programas con earningDomains: ${programsWithEarningDomains[0].count}, ` +
              `Earning domains migrados: ${migratedEarningDomains[0].count}. ` +
              `Ejecutar primero el script de migración de datos.`,
          );
        }
      }

      if (recordsWithRelationalData[0].count < totalRecords[0].count) {
        throw new Error(
          `No se pueden remover columnas JSON: Hay registros sin datos relacionales completos. ` +
            `Total: ${totalRecords[0].count}, Con datos relacionales: ${recordsWithRelationalData[0].count}. ` +
            `Ejecutar primero el script de migración de datos.`,
        );
      }
    }

    // ============================================================================
    // REMOVER COLUMNAS JSON
    // ============================================================================

    console.log('🗑️  Removiendo columnas JSON antiguas de loyalty_programs...');

    // Remover earningDomains JSON
    if (loyaltyProgramsTable.findColumnByName('earningDomains')) {
      await queryRunner.dropColumn('loyalty_programs', 'earningDomains');
      console.log('  ✓ Columna earningDomains removida');
    }

    // Remover stacking JSON
    if (loyaltyProgramsTable.findColumnByName('stacking')) {
      await queryRunner.dropColumn('loyalty_programs', 'stacking');
      console.log('  ✓ Columna stacking removida');
    }

    // Remover limits JSON
    if (loyaltyProgramsTable.findColumnByName('limits')) {
      await queryRunner.dropColumn('loyalty_programs', 'limits');
      console.log('  ✓ Columna limits removida');
    }

    // Remover expirationPolicy JSON
    if (loyaltyProgramsTable.findColumnByName('expirationPolicy')) {
      await queryRunner.dropColumn('loyalty_programs', 'expirationPolicy');
      console.log('  ✓ Columna expirationPolicy removida');
    }

    console.log('✅ Columnas JSON removidas exitosamente de loyalty_programs');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ⚠️ ADVERTENCIA: Esta operación NO puede restaurar los datos JSON originales
    // Solo restaura la estructura de columnas con valores NULL/default

    const loyaltyProgramsTable = await queryRunner.getTable('loyalty_programs');

    if (!loyaltyProgramsTable) {
      return;
    }

    console.log('⚠️  ADVERTENCIA: Restaurando columnas JSON (sin datos originales)');

    // Restaurar columnas JSON (sin datos)
    if (!loyaltyProgramsTable.findColumnByName('earningDomains')) {
      await queryRunner.addColumn(
        'loyalty_programs',
        new TableColumn({
          name: 'earningDomains',
          type: 'json',
          isNullable: true,
          comment: 'DEPRECATED: Usar tabla loyalty_program_earning_domains en su lugar',
        }),
      );
    }

    if (!loyaltyProgramsTable.findColumnByName('stacking')) {
      await queryRunner.addColumn(
        'loyalty_programs',
        new TableColumn({
          name: 'stacking',
          type: 'json',
          isNullable: true,
          comment: 'DEPRECATED: Usar columnas stacking_* en su lugar',
        }),
      );
    }

    if (!loyaltyProgramsTable.findColumnByName('limits')) {
      await queryRunner.addColumn(
        'loyalty_programs',
        new TableColumn({
          name: 'limits',
          type: 'json',
          isNullable: true,
          comment: 'DEPRECATED: Usar columnas limit_* en su lugar',
        }),
      );
    }

    if (!loyaltyProgramsTable.findColumnByName('expirationPolicy')) {
      await queryRunner.addColumn(
        'loyalty_programs',
        new TableColumn({
          name: 'expirationPolicy',
          type: 'json',
          isNullable: true,
          comment: 'DEPRECATED: Usar columnas expiration_* en su lugar',
        }),
      );
    }

    console.log('⚠️  Columnas JSON restauradas (sin datos originales)');
    console.log('⚠️  Los datos JSON originales NO pueden ser restaurados desde esta migración');
  }
}
