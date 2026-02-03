import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Migración para eliminar las tablas relacionadas con puntos, recompensas y transacciones
 *
 * Tablas a eliminar (en orden correcto respetando foreign keys):
 * - transactions (primero, por posibles foreign keys)
 * - reward_tiers (tiene FK hacia rewards, debe eliminarse antes)
 * - Foreign keys que apuntan hacia rewards (desde points_transactions y redemption_codes)
 * - rewards (después de eliminar FKs que apuntan hacia ella)
 * - points_rules
 *
 * IMPORTANTE: Esta migración elimina las tablas y todos sus datos.
 * Los datos históricos se perderán permanentemente.
 */
export class RemovePointsRulesRewardsTransactionsTables1784000000000 implements MigrationInterface {
  name = 'RemovePointsRulesRewardsTransactionsTables1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // ELIMINAR TABLA TRANSACTIONS
    // ============================================
    const transactionsTable = await queryRunner.getTable('transactions');
    if (transactionsTable) {
      // Obtener conteo antes de eliminar (para logging)
      const countResult = await queryRunner.query('SELECT COUNT(*) as count FROM transactions');
      const count = parseInt(countResult[0]?.count || '0', 10);
      console.log(`📊 Total registros en transactions antes de eliminar: ${count}`);

      if (count > 0) {
        console.log(
          `⚠️  ADVERTENCIA: Se eliminarán ${count} registros de transactions. ` +
            `Los datos históricos se perderán permanentemente.`,
        );
      }

      // Eliminar foreign keys primero (si existen)
      const foreignKeys = transactionsTable.foreignKeys;
      for (const fk of foreignKeys) {
        try {
          await queryRunner.dropForeignKey('transactions', fk);
          console.log(`✅ Foreign key ${fk.name || 'unnamed'} eliminada de transactions`);
        } catch (error) {
          console.warn(
            `⚠️  Error al eliminar foreign key ${fk.name || 'unnamed'} de transactions:`,
            error,
          );
        }
      }

      // Eliminar la tabla (esto eliminará automáticamente índices)
      await queryRunner.dropTable('transactions', true);
      console.log('✅ Tabla transactions eliminada exitosamente');
    } else {
      console.log('Table transactions does not exist. Skipping.');
    }

    // ============================================
    // ELIMINAR TABLA REWARD_TIERS (PRIMERO - tiene FK hacia rewards)
    // ============================================
    const rewardTiersTable = await queryRunner.getTable('reward_tiers');
    if (rewardTiersTable) {
      // Obtener conteo antes de eliminar (para logging)
      const countResult = await queryRunner.query('SELECT COUNT(*) as count FROM reward_tiers');
      const count = parseInt(countResult[0]?.count || '0', 10);
      console.log(`📊 Total registros en reward_tiers antes de eliminar: ${count}`);

      if (count > 0) {
        console.log(
          `⚠️  ADVERTENCIA: Se eliminarán ${count} registros de reward_tiers. ` +
            `Los datos históricos se perderán permanentemente.`,
        );
      }

      // Eliminar foreign keys primero (si existen)
      const foreignKeys = rewardTiersTable.foreignKeys;
      for (const fk of foreignKeys) {
        try {
          await queryRunner.dropForeignKey('reward_tiers', fk);
          console.log(`✅ Foreign key ${fk.name || 'unnamed'} eliminada de reward_tiers`);
        } catch (error) {
          console.warn(
            `⚠️  Error al eliminar foreign key ${fk.name || 'unnamed'} de reward_tiers:`,
            error,
          );
        }
      }

      // Eliminar la tabla (esto eliminará automáticamente índices)
      await queryRunner.dropTable('reward_tiers', true);
      console.log('✅ Tabla reward_tiers eliminada exitosamente');
    } else {
      console.log('Table reward_tiers does not exist. Skipping.');
    }

    // ============================================
    // ELIMINAR FOREIGN KEYS QUE APUNTAN HACIA REWARDS
    // (debe hacerse antes de eliminar la tabla rewards)
    // ============================================

    // Eliminar FK desde points_transactions hacia rewards
    const pointsTransactionsTable = await queryRunner.getTable('points_transactions');
    if (pointsTransactionsTable) {
      const fkPointsTransactionsRewardId = pointsTransactionsTable.foreignKeys.find(
        (fk) => fk.name === 'FK_points_transactions_rewardId',
      );
      if (fkPointsTransactionsRewardId) {
        try {
          await queryRunner.dropForeignKey('points_transactions', fkPointsTransactionsRewardId);
          console.log('✅ Foreign key FK_points_transactions_rewardId eliminada de points_transactions');
        } catch (error) {
          console.warn('⚠️  Error al eliminar FK_points_transactions_rewardId:', error);
        }
      }
    }

    // Eliminar FK desde redemption_codes hacia rewards
    const redemptionCodesTable = await queryRunner.getTable('redemption_codes');
    if (redemptionCodesTable) {
      const fkRedemptionCodesRewardId = redemptionCodesTable.foreignKeys.find(
        (fk) => fk.name === 'FK_redemption_codes_rewardId',
      );
      if (fkRedemptionCodesRewardId) {
        try {
          await queryRunner.dropForeignKey('redemption_codes', fkRedemptionCodesRewardId);
          console.log('✅ Foreign key FK_redemption_codes_rewardId eliminada de redemption_codes');
        } catch (error) {
          console.warn('⚠️  Error al eliminar FK_redemption_codes_rewardId:', error);
        }
      }
    }

    // ============================================
    // ELIMINAR TABLA REWARDS (después de eliminar FKs que apuntan hacia ella)
    // ============================================
    const rewardsTable = await queryRunner.getTable('rewards');
    if (rewardsTable) {
      // Obtener conteo antes de eliminar (para logging)
      const countResult = await queryRunner.query('SELECT COUNT(*) as count FROM rewards');
      const count = parseInt(countResult[0]?.count || '0', 10);
      console.log(`📊 Total registros en rewards antes de eliminar: ${count}`);

      if (count > 0) {
        console.log(
          `⚠️  ADVERTENCIA: Se eliminarán ${count} registros de rewards. ` +
            `Los datos históricos se perderán permanentemente.`,
        );
      }

      // Eliminar foreign keys primero (si existen) - estas son las FKs que salen desde rewards
      const foreignKeys = rewardsTable.foreignKeys;
      for (const fk of foreignKeys) {
        try {
          await queryRunner.dropForeignKey('rewards', fk);
          console.log(`✅ Foreign key ${fk.name || 'unnamed'} eliminada de rewards`);
        } catch (error) {
          console.warn(
            `⚠️  Error al eliminar foreign key ${fk.name || 'unnamed'} de rewards:`,
            error,
          );
        }
      }

      // Eliminar la tabla (esto eliminará automáticamente índices)
      await queryRunner.dropTable('rewards', true);
      console.log('✅ Tabla rewards eliminada exitosamente');
    } else {
      console.log('Table rewards does not exist. Skipping.');
    }

    // ============================================
    // ELIMINAR TABLA POINTS_RULES
    // ============================================
    const pointsRulesTable = await queryRunner.getTable('points_rules');
    if (pointsRulesTable) {
      // Obtener conteo antes de eliminar (para logging)
      const countResult = await queryRunner.query('SELECT COUNT(*) as count FROM points_rules');
      const count = parseInt(countResult[0]?.count || '0', 10);
      console.log(`📊 Total registros en points_rules antes de eliminar: ${count}`);

      if (count > 0) {
        console.log(
          `⚠️  ADVERTENCIA: Se eliminarán ${count} registros de points_rules. ` +
            `Los datos históricos se perderán permanentemente.`,
        );
      }

      // Eliminar foreign keys primero (si existen)
      const foreignKeys = pointsRulesTable.foreignKeys;
      for (const fk of foreignKeys) {
        try {
          await queryRunner.dropForeignKey('points_rules', fk);
          console.log(`✅ Foreign key ${fk.name || 'unnamed'} eliminada de points_rules`);
        } catch (error) {
          console.warn(
            `⚠️  Error al eliminar foreign key ${fk.name || 'unnamed'} de points_rules:`,
            error,
          );
        }
      }

      // Eliminar la tabla (esto eliminará automáticamente índices)
      await queryRunner.dropTable('points_rules', true);
      console.log('✅ Tabla points_rules eliminada exitosamente');
    } else {
      console.log('Table points_rules does not exist. Skipping.');
    }

    console.log('✅ Migración completada: Todas las tablas relacionadas eliminadas');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log(
      '⚠️  ROLLBACK: Esta migración no puede revertirse automáticamente. ' +
        'Las tablas y datos eliminados no pueden restaurarse.',
    );
    console.log(
      'Si necesitas restaurar estas tablas, debes recrearlas manualmente usando las migraciones originales.',
    );
    throw new Error(
      'Rollback no soportado: Las tablas eliminadas no pueden restaurarse automáticamente. ' +
        'Los datos se perdieron permanentemente.',
    );
  }
}
