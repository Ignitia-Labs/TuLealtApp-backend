import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * Migración para agregar membershipId a la tabla transactions
 * Permite asociar transacciones a memberships específicas
 */
export class AddMembershipIdToTransactions1768200000000 implements MigrationInterface {
  name = 'AddMembershipIdToTransactions1768200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const transactionsTable = await queryRunner.getTable('transactions');
    if (!transactionsTable) {
      throw new Error('Table transactions does not exist');
    }

    // Verificar si la columna ya existe
    const membershipIdColumn = transactionsTable.findColumnByName('membershipId');
    if (membershipIdColumn) {
      return; // La columna ya existe, no hacer nada
    }

    // Agregar columna membershipId (nullable para compatibilidad con datos existentes)
    await queryRunner.addColumn(
      'transactions',
      new TableColumn({
        name: 'membershipId',
        type: 'int',
        isNullable: true,
        comment: 'FK a customer_memberships - Membership específica asociada a esta transacción',
      }),
    );

    // Crear índice para mejorar rendimiento en búsquedas por membershipId
    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_TRANSACTIONS_MEMBERSHIP_ID',
        columnNames: ['membershipId'],
      }),
    );

    // Crear foreign key a customer_memberships
    const transactionsTableAfter = await queryRunner.getTable('transactions');
    if (transactionsTableAfter) {
      const hasMembershipIdFk = transactionsTableAfter.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('membershipId') !== -1,
      );
      if (!hasMembershipIdFk) {
        await queryRunner.createForeignKey(
          'transactions',
          new TableForeignKey({
            name: 'FK_TRANSACTIONS_MEMBERSHIP_ID',
            columnNames: ['membershipId'],
            referencedTableName: 'customer_memberships',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL', // Si se elimina la membership, mantener la transacción pero sin membershipId
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const transactionsTable = await queryRunner.getTable('transactions');
    if (!transactionsTable) {
      return; // La tabla no existe, no hacer nada
    }

    // Eliminar foreign key primero
    const membershipIdFk = transactionsTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('membershipId') !== -1,
    );
    if (membershipIdFk) {
      await queryRunner.dropForeignKey('transactions', membershipIdFk);
    }

    // Eliminar índice
    const membershipIdIndex = transactionsTable.indices.find(
      (idx) => idx.name === 'IDX_TRANSACTIONS_MEMBERSHIP_ID',
    );
    if (membershipIdIndex) {
      await queryRunner.dropIndex('transactions', membershipIdIndex);
    }

    // Eliminar columna
    const membershipIdColumn = transactionsTable.findColumnByName('membershipId');
    if (membershipIdColumn) {
      await queryRunner.dropColumn('transactions', 'membershipId');
    }
  }
}

