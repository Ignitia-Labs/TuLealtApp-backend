import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPlanIdAndBillingFrequencyToPartnerRequests1766785140000
  implements MigrationInterface
{
  name = 'AddPlanIdAndBillingFrequencyToPartnerRequests1766785140000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      return; // La tabla no existe, no hacer nada
    }

    // Verificar si planId ya existe
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
    }

    // Verificar si billingFrequency ya existe
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
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      return;
    }

    // Eliminar columna billingFrequency si existe
    const billingFrequencyColumn = table.findColumnByName('billingFrequency');
    if (billingFrequencyColumn) {
      await queryRunner.dropColumn('partner_requests', 'billingFrequency');
    }

    // Eliminar columna planId si existe
    const planIdColumn = table.findColumnByName('planId');
    if (planIdColumn) {
      await queryRunner.dropColumn('partner_requests', 'planId');
    }
  }
}
