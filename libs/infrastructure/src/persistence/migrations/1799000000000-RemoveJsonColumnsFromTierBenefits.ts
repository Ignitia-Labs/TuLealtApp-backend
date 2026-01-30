import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración: Remover columnas JSON antiguas de tier_benefits
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
 * Fase 4.2.2 del Plan de Eliminación de Tipos JSON
 */
export class RemoveJsonColumnsFromTierBenefits1799000000000 implements MigrationInterface {
  name = 'RemoveJsonColumnsFromTierBenefits1799000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tierBenefitsTable = await queryRunner.getTable('tier_benefits');

    if (!tierBenefitsTable) {
      throw new Error('Tabla tier_benefits no existe');
    }

    // ============================================================================
    // VALIDACIÓN PREVIA: Verificar que las columnas y tablas relacionadas tienen datos
    // ============================================================================

    const totalRecords = await queryRunner.query(
      `SELECT COUNT(*) as count FROM tier_benefits`
    );

    if (totalRecords[0].count === 0) {
      console.warn('⚠️  Advertencia: No hay registros en tier_benefits. Continuando...');
    } else {
      // Verificar que hay exclusive rewards migrados (si hay tier benefits con exclusive rewards)
      const exclusiveRewardsColumn = tierBenefitsTable.findColumnByName('exclusiveRewards');
      if (exclusiveRewardsColumn) {
        const tierBenefitsWithExclusiveRewards = await queryRunner.query(
          `SELECT COUNT(DISTINCT tb.id) as count
           FROM tier_benefits tb
           WHERE tb.\`exclusiveRewards\` IS NOT NULL
             AND JSON_LENGTH(tb.\`exclusiveRewards\`) > 0`
        );

        const migratedExclusiveRewards = await queryRunner.query(
          `SELECT COUNT(*) as count FROM tier_benefit_exclusive_rewards`
        );

        if (tierBenefitsWithExclusiveRewards[0].count > 0 && migratedExclusiveRewards[0].count === 0) {
          throw new Error(
            `No se pueden remover columnas JSON: Hay tier benefits con exclusiveRewards pero no hay datos migrados. ` +
            `Tier benefits con exclusiveRewards: ${tierBenefitsWithExclusiveRewards[0].count}, ` +
            `Exclusive rewards migrados: ${migratedExclusiveRewards[0].count}. ` +
            `Ejecutar primero el script de migración de datos.`
          );
        }
      }

      // Verificar que hay category benefits migrados (si hay tier benefits con category benefits)
      const categoryBenefitsColumn = tierBenefitsTable.findColumnByName('categoryBenefits');
      if (categoryBenefitsColumn) {
        const tierBenefitsWithCategoryBenefits = await queryRunner.query(
          `SELECT COUNT(DISTINCT tb.id) as count
           FROM tier_benefits tb
           WHERE tb.\`categoryBenefits\` IS NOT NULL
             AND JSON_LENGTH(tb.\`categoryBenefits\`) > 0`
        );

        const migratedCategoryBenefits = await queryRunner.query(
          `SELECT COUNT(*) as count FROM tier_benefit_category_benefits`
        );

        if (tierBenefitsWithCategoryBenefits[0].count > 0 && migratedCategoryBenefits[0].count === 0) {
          throw new Error(
            `No se pueden remover columnas JSON: Hay tier benefits con categoryBenefits pero no hay datos migrados. ` +
            `Tier benefits con categoryBenefits: ${tierBenefitsWithCategoryBenefits[0].count}, ` +
            `Category benefits migrados: ${migratedCategoryBenefits[0].count}. ` +
            `Ejecutar primero el script de migración de datos.`
          );
        }
      }

      // Verificar que las columnas relacionales para higherCaps tienen valores (si hay higherCaps)
      const higherCapsColumn = tierBenefitsTable.findColumnByName('higherCaps');
      if (higherCapsColumn) {
        const tierBenefitsWithHigherCaps = await queryRunner.query(
          `SELECT COUNT(*) as count
           FROM tier_benefits
           WHERE higher_caps_max_points_per_event IS NOT NULL
              OR higher_caps_max_points_per_day IS NOT NULL
              OR higher_caps_max_points_per_month IS NOT NULL`
        );

        const tierBenefitsWithHigherCapsJson = await queryRunner.query(
          `SELECT COUNT(*) as count
           FROM tier_benefits
           WHERE \`higherCaps\` IS NOT NULL
             AND JSON_LENGTH(\`higherCaps\`) > 0`
        );

        if (tierBenefitsWithHigherCapsJson[0].count > 0 && tierBenefitsWithHigherCaps[0].count === 0) {
          throw new Error(
            `No se pueden remover columnas JSON: Hay tier benefits con higherCaps pero no hay datos migrados. ` +
            `Tier benefits con higherCaps JSON: ${tierBenefitsWithHigherCapsJson[0].count}, ` +
            `Tier benefits con higherCaps relacionales: ${tierBenefitsWithHigherCaps[0].count}. ` +
            `Ejecutar primero el script de migración de datos.`
          );
        }
      }
    }

    // ============================================================================
    // REMOVER COLUMNAS JSON
    // ============================================================================

    console.log('🗑️  Removiendo columnas JSON antiguas de tier_benefits...');

    // Remover exclusiveRewards JSON
    if (tierBenefitsTable.findColumnByName('exclusiveRewards')) {
      await queryRunner.dropColumn('tier_benefits', 'exclusiveRewards');
      console.log('  ✓ Columna exclusiveRewards removida');
    }

    // Remover higherCaps JSON
    if (tierBenefitsTable.findColumnByName('higherCaps')) {
      await queryRunner.dropColumn('tier_benefits', 'higherCaps');
      console.log('  ✓ Columna higherCaps removida');
    }

    // Remover categoryBenefits JSON
    if (tierBenefitsTable.findColumnByName('categoryBenefits')) {
      await queryRunner.dropColumn('tier_benefits', 'categoryBenefits');
      console.log('  ✓ Columna categoryBenefits removida');
    }

    console.log('✅ Columnas JSON removidas exitosamente de tier_benefits');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ⚠️ ADVERTENCIA: Esta operación NO puede restaurar los datos JSON originales
    // Solo restaura la estructura de columnas con valores NULL/default

    const tierBenefitsTable = await queryRunner.getTable('tier_benefits');

    if (!tierBenefitsTable) {
      return;
    }

    console.log('⚠️  ADVERTENCIA: Restaurando columnas JSON (sin datos originales)');

    // Restaurar columnas JSON (sin datos)
    if (!tierBenefitsTable.findColumnByName('exclusiveRewards')) {
      await queryRunner.addColumn(
        'tier_benefits',
        new TableColumn({
          name: 'exclusiveRewards',
          type: 'json',
          isNullable: true,
          comment: 'DEPRECATED: Usar tabla tier_benefit_exclusive_rewards en su lugar',
        }),
      );
    }

    if (!tierBenefitsTable.findColumnByName('higherCaps')) {
      await queryRunner.addColumn(
        'tier_benefits',
        new TableColumn({
          name: 'higherCaps',
          type: 'json',
          isNullable: true,
          comment: 'DEPRECATED: Usar columnas higher_caps_* en su lugar',
        }),
      );
    }

    if (!tierBenefitsTable.findColumnByName('categoryBenefits')) {
      await queryRunner.addColumn(
        'tier_benefits',
        new TableColumn({
          name: 'categoryBenefits',
          type: 'json',
          isNullable: true,
          comment: 'DEPRECATED: Usar tabla tier_benefit_category_benefits en su lugar',
        }),
      );
    }

    console.log('⚠️  Columnas JSON restauradas (sin datos originales)');
    console.log('⚠️  Los datos JSON originales NO pueden ser restaurados desde esta migración');
  }
}
