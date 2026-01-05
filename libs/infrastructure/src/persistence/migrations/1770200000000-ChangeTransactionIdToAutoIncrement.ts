import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class ChangeTransactionIdToAutoIncrement1770200000000 implements MigrationInterface {
  name = 'ChangeTransactionIdToAutoIncrement1770200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('payments');
    if (!table) {
      return; // La tabla no existe, no hacer nada
    }

    const transactionIdColumn = table.findColumnByName('transactionId');
    if (!transactionIdColumn) {
      return; // La columna no existe
    }

    // Si ya es INT, no hacer nada
    if (transactionIdColumn.type === 'int' || transactionIdColumn.type === 'integer') {
      return;
    }

    // Eliminar el índice existente si existe
    try {
      const index = table.indices.find(
        (idx) => idx.name === 'IDX_transactionId' || idx.columnNames.includes('transactionId'),
      );
      if (index) {
        await queryRunner.dropIndex('payments', index.name);
      }
    } catch (error) {
      console.log('Index may not exist:', error.message);
    }

    // Cambiar la columna de VARCHAR a INT AUTO_INCREMENT
    // Primero, eliminar valores no numéricos o convertirlos
    await queryRunner
      .query(
        `
      UPDATE payments
      SET transactionId = NULL
      WHERE transactionId IS NOT NULL
      AND transactionId NOT REGEXP '^[0-9]+$'
    `,
      )
      .catch((error) => {
        console.log('Error cleaning transactionId values:', error.message);
      });

    // Cambiar el tipo de columna a INT
    await queryRunner
      .query(
        `
      ALTER TABLE payments
      MODIFY COLUMN transactionId INT NULL
    `,
      )
      .catch((error) => {
        console.log('Error modifying transactionId column:', error.message);
      });

    // Crear una secuencia/tabla temporal para auto-incremento
    // Como MySQL no soporta AUTO_INCREMENT en columnas que no son PRIMARY KEY,
    // usaremos un trigger o generaremos el valor en la aplicación
    // Por ahora, dejamos que la aplicación genere el valor secuencialmente
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('payments');
    if (!table) {
      return;
    }

    const transactionIdColumn = table.findColumnByName('transactionId');
    if (!transactionIdColumn) {
      return;
    }

    // Si ya es VARCHAR, no hacer nada
    if (transactionIdColumn.type === 'varchar' || transactionIdColumn.type === 'string') {
      return;
    }

    // Convertir valores numéricos a string antes de cambiar el tipo
    await queryRunner
      .query(
        `
      UPDATE payments
      SET transactionId = CAST(transactionId AS CHAR)
      WHERE transactionId IS NOT NULL
    `,
      )
      .catch((error) => {
        console.log('Error converting transactionId to string:', error.message);
      });

    // Cambiar el tipo de columna de vuelta a VARCHAR
    await queryRunner
      .query(
        `
      ALTER TABLE payments
      MODIFY COLUMN transactionId VARCHAR(100) NULL
    `,
      )
      .catch((error) => {
        console.log('Error reverting transactionId column:', error.message);
      });

    // Recrear el índice
    try {
      await queryRunner.createIndex(
        'payments',
        new TableIndex({
          name: 'IDX_transactionId',
          columnNames: ['transactionId'],
        }),
      );
    } catch (error) {
      console.log('Error recreating index:', error.message);
    }
  }
}
