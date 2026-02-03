import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../persistence/data-source';

/**
 * Script temporal para eliminar foreign keys que apuntan hacia rewards
 * Esto debe ejecutarse antes de re-ejecutar la migración RemovePointsRulesRewardsTransactionsTables1784000000000
 */
async function fixRewardsForeignKeys() {
  const dataSource = new DataSource(dataSourceOptions);

  try {
    console.log('🔌 Conectando a la base de datos...');
    await dataSource.initialize();
    console.log('✅ Conectado exitosamente\n');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
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
          } catch (error: any) {
            console.warn('⚠️  Error al eliminar FK_points_transactions_rewardId:', error.message);
          }
        } else {
          console.log('ℹ️  FK_points_transactions_rewardId no existe (ya fue eliminada)');
        }
      } else {
        console.log('ℹ️  Tabla points_transactions no existe');
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
          } catch (error: any) {
            console.warn('⚠️  Error al eliminar FK_redemption_codes_rewardId:', error.message);
          }
        } else {
          console.log('ℹ️  FK_redemption_codes_rewardId no existe (ya fue eliminada)');
        }
      } else {
        console.log('ℹ️  Tabla redemption_codes no existe');
      }

      console.log('\n✅ Proceso completado');
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixRewardsForeignKeys()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error fatal:', error);
      process.exit(1);
    });
}

export { fixRewardsForeignKeys };
