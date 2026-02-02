import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración: Remover columnas JSON antiguas de reward_rules
 *
 * Esta migración elimina las columnas JSON antiguas después de:
 * 1. Ejecutar la migración de datos
 * 2. Hacer columnas NOT NULL
 * 3. Validar que todo funciona correctamente con datos relacionales
 * 4. Tener un período de gracia donde ambos sistemas coexisten
 *
 * ⚠️ ADVERTENCIA: Esta migración es IRREVERSIBLE.
 * Una vez ejecutada, los datos JSON originales se perderán.
 * Asegúrate de tener backups completos antes de ejecutar.
 *
 * Fase 2.5.2 del Plan de Eliminación de Tipos JSON
 */
export class RemoveJsonColumnsFromRewardRules1792000000000 implements MigrationInterface {
  name = 'RemoveJsonColumnsFromRewardRules1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rewardRulesTable = await queryRunner.getTable('reward_rules');

    if (!rewardRulesTable) {
      throw new Error('Tabla reward_rules no existe');
    }

    // ============================================================================
    // VALIDACIÓN PREVIA: Verificar que las columnas relacionales tienen datos
    // ============================================================================

    const totalRecords = await queryRunner.query(`SELECT COUNT(*) as count FROM reward_rules`);

    if (totalRecords[0].count === 0) {
      console.warn('⚠️  Advertencia: No hay registros en reward_rules. Continuando...');
    } else {
      // Verificar que las columnas relacionales tienen datos válidos
      const recordsWithRelationalData = await queryRunner.query(
        `SELECT COUNT(*) as count FROM reward_rules
         WHERE scope_tenant_id IS NOT NULL
           AND scope_program_id IS NOT NULL
           AND conflict_stack_policy IS NOT NULL
           AND conflict_priority_rank IS NOT NULL
           AND idempotency_strategy IS NOT NULL`,
      );

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

    console.log('🗑️  Removiendo columnas JSON antiguas...');

    // Remover scope JSON
    if (rewardRulesTable.findColumnByName('scope')) {
      await queryRunner.dropColumn('reward_rules', 'scope');
      console.log('  ✓ Columna scope removida');
    }

    // Remover eligibility JSON
    if (rewardRulesTable.findColumnByName('eligibility')) {
      await queryRunner.dropColumn('reward_rules', 'eligibility');
      console.log('  ✓ Columna eligibility removida');
    }

    // Remover pointsFormula JSON
    if (rewardRulesTable.findColumnByName('pointsFormula')) {
      await queryRunner.dropColumn('reward_rules', 'pointsFormula');
      console.log('  ✓ Columna pointsFormula removida');
    }

    // Remover limits JSON (puede ser NULL, así que verificamos si existe)
    if (rewardRulesTable.findColumnByName('limits')) {
      await queryRunner.dropColumn('reward_rules', 'limits');
      console.log('  ✓ Columna limits removida');
    }

    // Remover conflict JSON
    if (rewardRulesTable.findColumnByName('conflict')) {
      await queryRunner.dropColumn('reward_rules', 'conflict');
      console.log('  ✓ Columna conflict removida');
    }

    // Remover idempotencyScope JSON
    if (rewardRulesTable.findColumnByName('idempotencyScope')) {
      await queryRunner.dropColumn('reward_rules', 'idempotencyScope');
      console.log('  ✓ Columna idempotencyScope removida');
    }

    console.log('✅ Columnas JSON removidas exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ⚠️ ADVERTENCIA: Esta operación NO puede restaurar los datos JSON originales
    // Solo restaura la estructura de columnas con valores NULL/default

    const rewardRulesTable = await queryRunner.getTable('reward_rules');

    if (!rewardRulesTable) {
      return;
    }

    console.log('⚠️  ADVERTENCIA: Restaurando columnas JSON (sin datos originales)');

    // Restaurar columnas JSON (sin datos)
    if (!rewardRulesTable.findColumnByName('scope')) {
      await queryRunner.addColumn(
        'reward_rules',
        new TableColumn({
          name: 'scope',
          type: 'json',
          isNullable: true,
          comment: 'DEPRECATED: Usar columnas scope_* en su lugar',
        }),
      );
    }

    if (!rewardRulesTable.findColumnByName('eligibility')) {
      await queryRunner.addColumn(
        'reward_rules',
        new TableColumn({
          name: 'eligibility',
          type: 'json',
          isNullable: true,
          comment: 'DEPRECATED: Usar tabla reward_rule_eligibility en su lugar',
        }),
      );
    }

    if (!rewardRulesTable.findColumnByName('pointsFormula')) {
      await queryRunner.addColumn(
        'reward_rules',
        new TableColumn({
          name: 'pointsFormula',
          type: 'json',
          isNullable: true,
          comment: 'DEPRECATED: Usar tabla reward_rule_points_formulas en su lugar',
        }),
      );
    }

    if (!rewardRulesTable.findColumnByName('limits')) {
      await queryRunner.addColumn(
        'reward_rules',
        new TableColumn({
          name: 'limits',
          type: 'json',
          isNullable: true,
          comment: 'DEPRECATED: Usar columnas limit_* en su lugar',
        }),
      );
    }

    if (!rewardRulesTable.findColumnByName('conflict')) {
      await queryRunner.addColumn(
        'reward_rules',
        new TableColumn({
          name: 'conflict',
          type: 'json',
          isNullable: true,
          comment: 'DEPRECATED: Usar columnas conflict_* en su lugar',
        }),
      );
    }

    if (!rewardRulesTable.findColumnByName('idempotencyScope')) {
      await queryRunner.addColumn(
        'reward_rules',
        new TableColumn({
          name: 'idempotencyScope',
          type: 'json',
          isNullable: true,
          comment: 'DEPRECATED: Usar columnas idempotency_* en su lugar',
        }),
      );
    }

    console.log('⚠️  Columnas JSON restauradas (sin datos originales)');
    console.log('⚠️  Los datos JSON originales NO pueden ser restaurados desde esta migración');
  }
}
