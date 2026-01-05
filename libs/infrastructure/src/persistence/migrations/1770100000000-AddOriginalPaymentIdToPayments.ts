import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddOriginalPaymentIdToPayments1770100000000 implements MigrationInterface {
  name = 'AddOriginalPaymentIdToPayments1770100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('payments');
    if (!table) {
      return; // La tabla no existe, no hacer nada
    }

    // Verificar si originalPaymentId ya existe
    const originalPaymentIdColumn = table.findColumnByName('originalPaymentId');
    if (!originalPaymentIdColumn) {
      // Agregar columna originalPaymentId después de processedBy
      await queryRunner.addColumn(
        'payments',
        new TableColumn({
          name: 'originalPaymentId',
          type: 'int',
          isNullable: true,
          comment: 'ID del pago original del cual este es derivado (null si es un pago original)',
        }),
      );

      // Crear índice para mejorar búsquedas de payments derivados
      await queryRunner.createIndex(
        'payments',
        new TableIndex({
          name: 'idx_original_payment',
          columnNames: ['originalPaymentId'],
        }),
      );

      // Crear foreign key constraint (opcional, pero recomendado para integridad referencial)
      // Nota: No agregamos ON DELETE CASCADE porque queremos mantener los derivados
      // aunque se elimine el original (para auditoría)
      await queryRunner
        .query(
          `
        ALTER TABLE payments
        ADD CONSTRAINT fk_payments_original_payment
        FOREIGN KEY (originalPaymentId) REFERENCES payments(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
      `,
        )
        .catch((error) => {
          // Si la foreign key ya existe o hay un error, continuar
          console.log('Foreign key constraint may already exist or error occurred:', error.message);
        });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('payments');
    if (!table) {
      return;
    }

    // Eliminar foreign key constraint si existe
    try {
      await queryRunner.query(`
        ALTER TABLE payments
        DROP FOREIGN KEY fk_payments_original_payment
      `);
    } catch (error) {
      // Si no existe, continuar
      console.log('Foreign key constraint may not exist:', error.message);
    }

    // Eliminar índice si existe
    const index = table.indices.find((idx) => idx.name === 'idx_original_payment');
    if (index) {
      await queryRunner.dropIndex('payments', 'idx_original_payment');
    }

    // Eliminar columna originalPaymentId si existe
    const originalPaymentIdColumn = table.findColumnByName('originalPaymentId');
    if (originalPaymentIdColumn) {
      await queryRunner.dropColumn('payments', 'originalPaymentId');
    }
  }
}
