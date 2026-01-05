import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MakeRegistrationBranchIdNullable1777100000000
  implements MigrationInterface
{
  name = 'MakeRegistrationBranchIdNullable1777100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('customer_memberships');
    if (!table) {
      console.warn(
        'Table customer_memberships does not exist. Skipping migration.',
      );
      return;
    }

    // Verificar si la columna existe
    const column = table.findColumnByName('registrationBranchId');
    if (!column) {
      console.warn(
        'Column registrationBranchId does not exist. Skipping migration.',
      );
      return;
    }

    // Modificar la columna para permitir NULL
    await queryRunner.changeColumn(
      'customer_memberships',
      'registrationBranchId',
      new TableColumn({
        name: 'registrationBranchId',
        type: 'int',
        isNullable: true,
        comment: 'FK a branches - Branch donde se registró el customer (opcional)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('customer_memberships');
    if (!table) {
      console.warn(
        'Table customer_memberships does not exist. Skipping rollback.',
      );
      return;
    }

    // Verificar si hay registros con registrationBranchId NULL
    const result = await queryRunner.query(
      `SELECT COUNT(*) as count FROM customer_memberships WHERE registrationBranchId IS NULL`,
    );
    const nullCount = parseInt(result[0]?.count || '0', 10);

    if (nullCount > 0) {
      throw new Error(
        `Cannot rollback: ${nullCount} membership(s) have NULL registrationBranchId. Please update them before rolling back.`,
      );
    }

    // Revertir la columna para no permitir NULL
    await queryRunner.changeColumn(
      'customer_memberships',
      'registrationBranchId',
      new TableColumn({
        name: 'registrationBranchId',
        type: 'int',
        isNullable: false,
        comment: 'FK a branches - Branch donde se registró el customer',
      }),
    );
  }
}

