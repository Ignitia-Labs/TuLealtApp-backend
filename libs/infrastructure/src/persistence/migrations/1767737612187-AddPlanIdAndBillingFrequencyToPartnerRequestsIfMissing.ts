import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPlanIdAndBillingFrequencyToPartnerRequestsIfMissing1767737612187
  implements MigrationInterface
{
  name = 'AddPlanIdAndBillingFrequencyToPartnerRequestsIfMissing1767737612187';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      console.warn('Table partner_requests does not exist. Skipping migration.');
      return;
    }

    // Verificar si la columna planId ya existe
    const planIdColumn = table.findColumnByName('planId');
    if (!planIdColumn) {
      await queryRunner.addColumn(
        'partner_requests',
        new TableColumn({
          name: 'planId',
          type: 'int',
          isNullable: true,
        }),
      );
      console.log('✅ Column planId added to partner_requests.');
    } else {
      console.log('Column planId already exists in partner_requests. Skipping.');
    }

    // Verificar si la columna billingFrequency ya existe
    const billingFrequencyColumn = table.findColumnByName('billingFrequency');
    if (!billingFrequencyColumn) {
      await queryRunner.addColumn(
        'partner_requests',
        new TableColumn({
          name: 'billingFrequency',
          type: 'varchar',
          length: '20',
          isNullable: true,
        }),
      );
      console.log('✅ Column billingFrequency added to partner_requests.');
    } else {
      console.log('Column billingFrequency already exists in partner_requests. Skipping.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      console.warn('Table partner_requests does not exist. Skipping rollback.');
      return;
    }

    // Verificar si billingFrequency existe antes de eliminarla
    const billingFrequencyColumn = table.findColumnByName('billingFrequency');
    if (billingFrequencyColumn) {
      await queryRunner.dropColumn('partner_requests', 'billingFrequency');
      console.log('✅ Column billingFrequency dropped from partner_requests.');
    } else {
      console.warn('Column billingFrequency does not exist. Skipping rollback.');
    }

    // Verificar si planId existe antes de eliminarla
    const planIdColumn = table.findColumnByName('planId');
    if (planIdColumn) {
      await queryRunner.dropColumn('partner_requests', 'planId');
      console.log('✅ Column planId dropped from partner_requests.');
    } else {
      console.warn('Column planId does not exist. Skipping rollback.');
    }
  }
}
