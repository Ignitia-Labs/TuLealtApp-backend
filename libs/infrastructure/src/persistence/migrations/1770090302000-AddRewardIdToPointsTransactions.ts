import { MigrationInterface, QueryRunner, TableColumn, TableIndex, TableForeignKey } from 'typeorm';

export class AddRewardIdToPointsTransactions1770090302000 implements MigrationInterface {
  name = 'AddRewardIdToPointsTransactions1770090302000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar columna rewardId
    await queryRunner.addColumn(
      'points_transactions',
      new TableColumn({
        name: 'rewardId',
        type: 'int',
        isNullable: true,
        comment: 'FK a rewards.id - ID de la recompensa canjeada (solo para transacciones tipo REDEEM)',
      }),
    );

    // 2. Crear índice para consultas eficientes
    await queryRunner.createIndex(
      'points_transactions',
      new TableIndex({
        name: 'IDX_POINTS_TRANSACTIONS_REWARD_ID',
        columnNames: ['rewardId'],
      }),
    );

    // 3. Migrar datos existentes desde metadata.rewardId a rewardId
    // Solo para transacciones tipo REDEEM que tengan metadata.rewardId
    await queryRunner.query(`
      UPDATE points_transactions
      SET rewardId = CAST(JSON_EXTRACT(metadata, '$.rewardId') AS UNSIGNED)
      WHERE type = 'REDEEM'
        AND metadata IS NOT NULL
        AND JSON_EXTRACT(metadata, '$.rewardId') IS NOT NULL
        AND JSON_EXTRACT(metadata, '$.rewardId') != 'null'
    `);

    // 4. Agregar foreign key a rewards (opcional, puede ser NULL)
    await queryRunner.createForeignKey(
      'points_transactions',
      new TableForeignKey({
        columnNames: ['rewardId'],
        referencedTableName: 'rewards',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL', // Si se elimina la reward, mantener la transacción pero sin rewardId
        name: 'FK_points_transactions_rewardId',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar foreign key
    const table = await queryRunner.getTable('points_transactions');
    const foreignKey = table?.foreignKeys.find((fk) => fk.name === 'FK_points_transactions_rewardId');
    if (foreignKey) {
      await queryRunner.dropForeignKey('points_transactions', foreignKey);
    }

    // 2. Eliminar índice
    await queryRunner.dropIndex('points_transactions', 'IDX_POINTS_TRANSACTIONS_REWARD_ID');

    // 3. Eliminar columna
    await queryRunner.dropColumn('points_transactions', 'rewardId');
  }
}
