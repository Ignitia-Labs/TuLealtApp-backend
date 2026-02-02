import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración: Remover columnas JSON antiguas de customer_tiers
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
 * Fase 4.3.2 del Plan de Eliminación de Tipos JSON
 */
export class RemoveJsonColumnsFromCustomerTiers1800000000000 implements MigrationInterface {
  name = 'RemoveJsonColumnsFromCustomerTiers1800000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const customerTiersTable = await queryRunner.getTable('customer_tiers');

    if (!customerTiersTable) {
      throw new Error('Tabla customer_tiers no existe');
    }

    // ============================================================================
    // VALIDACIÓN PREVIA: Verificar que la tabla relacionada tiene datos
    // ============================================================================

    const totalRecords = await queryRunner.query(`SELECT COUNT(*) as count FROM customer_tiers`);

    if (totalRecords[0].count === 0) {
      console.warn('⚠️  Advertencia: No hay registros en customer_tiers. Continuando...');
    } else {
      // Verificar que hay benefits migrados (si hay customer tiers con benefits)
      const benefitsColumn = customerTiersTable.findColumnByName('benefits');
      if (benefitsColumn) {
        const customerTiersWithBenefits = await queryRunner.query(
          `SELECT COUNT(DISTINCT ct.id) as count
           FROM customer_tiers ct
           WHERE ct.\`benefits\` IS NOT NULL
             AND JSON_LENGTH(ct.\`benefits\`) > 0`,
        );

        const migratedBenefits = await queryRunner.query(
          `SELECT COUNT(*) as count FROM customer_tier_benefits`,
        );

        if (customerTiersWithBenefits[0].count > 0 && migratedBenefits[0].count === 0) {
          throw new Error(
            `No se pueden remover columnas JSON: Hay customer tiers con benefits pero no hay datos migrados. ` +
              `Customer tiers con benefits: ${customerTiersWithBenefits[0].count}, ` +
              `Benefits migrados: ${migratedBenefits[0].count}. ` +
              `Ejecutar primero el script de migración de datos.`,
          );
        }
      }
    }

    // ============================================================================
    // REMOVER COLUMNAS JSON
    // ============================================================================

    console.log('🗑️  Removiendo columnas JSON antiguas de customer_tiers...');

    // Remover benefits JSON
    if (customerTiersTable.findColumnByName('benefits')) {
      await queryRunner.dropColumn('customer_tiers', 'benefits');
      console.log('  ✓ Columna benefits removida');
    }

    console.log('✅ Columnas JSON removidas exitosamente de customer_tiers');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ⚠️ ADVERTENCIA: Esta operación NO puede restaurar los datos JSON originales
    // Solo restaura la estructura de columnas con valores NULL/default

    const customerTiersTable = await queryRunner.getTable('customer_tiers');

    if (!customerTiersTable) {
      return;
    }

    console.log('⚠️  ADVERTENCIA: Restaurando columnas JSON (sin datos originales)');

    // Restaurar columnas JSON (sin datos)
    if (!customerTiersTable.findColumnByName('benefits')) {
      await queryRunner.addColumn(
        'customer_tiers',
        new TableColumn({
          name: 'benefits',
          type: 'json',
          isNullable: true,
          comment: 'DEPRECATED: Usar tabla customer_tier_benefits en su lugar',
        }),
      );
    }

    console.log('⚠️  Columnas JSON restauradas (sin datos originales)');
    console.log('⚠️  Los datos JSON originales NO pueden ser restaurados desde esta migración');
  }
}
