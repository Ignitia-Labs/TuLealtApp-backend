import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSubscriptionCurrencyIdToPartnerRequestsIfMissing1767737612188
  implements MigrationInterface
{
  name = 'AddSubscriptionCurrencyIdToPartnerRequestsIfMissing1767737612188';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      console.warn('Table partner_requests does not exist. Skipping migration.');
      return;
    }

    // Verificar si la columna subscriptionCurrencyId ya existe
    const subscriptionCurrencyIdColumn = table.findColumnByName('subscriptionCurrencyId');
    if (!subscriptionCurrencyIdColumn) {
      await queryRunner.addColumn(
        'partner_requests',
        new TableColumn({
          name: 'subscriptionCurrencyId',
          type: 'int',
          isNullable: true,
        }),
      );
      console.log('✅ Column subscriptionCurrencyId added to partner_requests.');
    } else {
      console.log('Column subscriptionCurrencyId already exists in partner_requests. Skipping.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      console.warn('Table partner_requests does not exist. Skipping rollback.');
      return;
    }

    // Verificar si subscriptionCurrencyId existe antes de eliminarla
    const subscriptionCurrencyIdColumn = table.findColumnByName('subscriptionCurrencyId');
    if (subscriptionCurrencyIdColumn) {
      await queryRunner.dropColumn('partner_requests', 'subscriptionCurrencyId');
      console.log('✅ Column subscriptionCurrencyId dropped from partner_requests.');
    } else {
      console.warn('Column subscriptionCurrencyId does not exist. Skipping rollback.');
    }
  }
}

