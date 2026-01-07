import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

/**
 * Migración para agregar campos detallados de transacciones
 * Incluye información de cajero, montos, impuestos, referencias y cálculos de puntos
 */
export class AddTransactionDetailsFields1777400000000 implements MigrationInterface {
  name = 'AddTransactionDetailsFields1777400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const transactionsTable = await queryRunner.getTable('transactions');
    if (!transactionsTable) {
      throw new Error('Table transactions does not exist');
    }

    // Agregar cashierId
    const cashierIdColumn = transactionsTable.findColumnByName('cashierId');
    if (!cashierIdColumn) {
      await queryRunner.addColumn(
        'transactions',
        new TableColumn({
          name: 'cashierId',
          type: 'int',
          isNullable: true,
          comment: 'ID del cajero que procesa la transacción',
        }),
      );
    }

    // Agregar transactionDate
    const transactionDateColumn = transactionsTable.findColumnByName('transactionDate');
    if (!transactionDateColumn) {
      await queryRunner.addColumn(
        'transactions',
        new TableColumn({
          name: 'transactionDate',
          type: 'datetime',
          isNullable: true,
          comment: 'Fecha de la transacción',
        }),
      );
    }

    // Agregar transactionAmountTotal
    const transactionAmountTotalColumn =
      transactionsTable.findColumnByName('transactionAmountTotal');
    if (!transactionAmountTotalColumn) {
      await queryRunner.addColumn(
        'transactions',
        new TableColumn({
          name: 'transactionAmountTotal',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: true,
          comment: 'Monto total de la transacción (con impuestos)',
        }),
      );
    }

    // Agregar netAmount
    const netAmountColumn = transactionsTable.findColumnByName('netAmount');
    if (!netAmountColumn) {
      await queryRunner.addColumn(
        'transactions',
        new TableColumn({
          name: 'netAmount',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: true,
          comment: 'Monto neto de la transacción (sin impuestos)',
        }),
      );
    }

    // Agregar taxAmount
    const taxAmountColumn = transactionsTable.findColumnByName('taxAmount');
    if (!taxAmountColumn) {
      await queryRunner.addColumn(
        'transactions',
        new TableColumn({
          name: 'taxAmount',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: true,
          comment: 'Monto de impuestos',
        }),
      );
    }

    // Agregar itemsCount
    const itemsCountColumn = transactionsTable.findColumnByName('itemsCount');
    if (!itemsCountColumn) {
      await queryRunner.addColumn(
        'transactions',
        new TableColumn({
          name: 'itemsCount',
          type: 'int',
          isNullable: true,
          comment: 'Cantidad de items en la transacción',
        }),
      );
    }

    // Agregar transactionReference
    const transactionReferenceColumn = transactionsTable.findColumnByName('transactionReference');
    if (!transactionReferenceColumn) {
      await queryRunner.addColumn(
        'transactions',
        new TableColumn({
          name: 'transactionReference',
          type: 'varchar',
          length: '255',
          isNullable: true,
          comment: 'Referencia única de la transacción (número de factura, ticket, etc.)',
        }),
      );
    }

    // Agregar pointsEarned
    const pointsEarnedColumn = transactionsTable.findColumnByName('pointsEarned');
    if (!pointsEarnedColumn) {
      await queryRunner.addColumn(
        'transactions',
        new TableColumn({
          name: 'pointsEarned',
          type: 'int',
          isNullable: true,
          comment: 'Puntos ganados (siempre positivo para earn)',
        }),
      );
    }

    // Agregar pointsRuleId
    const pointsRuleIdColumn = transactionsTable.findColumnByName('pointsRuleId');
    if (!pointsRuleIdColumn) {
      await queryRunner.addColumn(
        'transactions',
        new TableColumn({
          name: 'pointsRuleId',
          type: 'int',
          isNullable: true,
          comment: 'ID de la regla de puntos aplicada',
        }),
      );

      // Crear índice para mejorar rendimiento en búsquedas por pointsRuleId
      await queryRunner.createIndex(
        'transactions',
        new TableIndex({
          name: 'IDX_TRANSACTIONS_POINTS_RULE_ID',
          columnNames: ['pointsRuleId'],
        }),
      );
    }

    // Agregar pointsMultiplier
    const pointsMultiplierColumn = transactionsTable.findColumnByName('pointsMultiplier');
    if (!pointsMultiplierColumn) {
      await queryRunner.addColumn(
        'transactions',
        new TableColumn({
          name: 'pointsMultiplier',
          type: 'decimal',
          precision: 5,
          scale: 2,
          isNullable: true,
          comment: 'Multiplicador de puntos aplicado (ej: promo x2)',
        }),
      );
    }

    // Agregar basePoints
    const basePointsColumn = transactionsTable.findColumnByName('basePoints');
    if (!basePointsColumn) {
      await queryRunner.addColumn(
        'transactions',
        new TableColumn({
          name: 'basePoints',
          type: 'int',
          isNullable: true,
          comment: 'Puntos base (antes de promos)',
        }),
      );
    }

    // Agregar bonusPoints
    const bonusPointsColumn = transactionsTable.findColumnByName('bonusPoints');
    if (!bonusPointsColumn) {
      await queryRunner.addColumn(
        'transactions',
        new TableColumn({
          name: 'bonusPoints',
          type: 'int',
          isNullable: true,
          comment: 'Puntos bonus (por campañas)',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const transactionsTable = await queryRunner.getTable('transactions');
    if (!transactionsTable) {
      return; // La tabla no existe, no hacer nada
    }

    // Eliminar índices primero
    const pointsRuleIdIndex = transactionsTable.indices.find(
      (idx) => idx.name === 'IDX_TRANSACTIONS_POINTS_RULE_ID',
    );
    if (pointsRuleIdIndex) {
      await queryRunner.dropIndex('transactions', pointsRuleIdIndex);
    }

    // Eliminar columnas en orden inverso
    const columnsToRemove = [
      'bonusPoints',
      'basePoints',
      'pointsMultiplier',
      'pointsRuleId',
      'pointsEarned',
      'transactionReference',
      'itemsCount',
      'taxAmount',
      'netAmount',
      'transactionAmountTotal',
      'transactionDate',
      'cashierId',
    ];

    for (const columnName of columnsToRemove) {
      const column = transactionsTable.findColumnByName(columnName);
      if (column) {
        await queryRunner.dropColumn('transactions', columnName);
      }
    }
  }
}
