import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración para agregar el campo trialDays a la tabla partner_requests
 * Este campo almacena los días de prueba gratuita personalizados para el partner
 * Si es null, se usará el valor del plan de precios (pricing_plans.trialDays)
 */
export class AddTrialDaysToPartnerRequests1780000000000 implements MigrationInterface {
  name = 'AddTrialDaysToPartnerRequests1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      console.warn('Table partner_requests does not exist. Skipping migration.');
      return;
    }

    // Verificar si la columna trialDays ya existe
    const trialDaysColumn = table.findColumnByName('trialDays');
    if (trialDaysColumn) {
      console.log('Column trialDays already exists in partner_requests. Skipping migration.');
      return;
    }

    // Agregar la columna trialDays
    await queryRunner.addColumn(
      'partner_requests',
      new TableColumn({
        name: 'trialDays',
        type: 'int',
        isNullable: true,
        comment:
          'Días de prueba gratuita personalizados para el partner. Si es null, se usa el valor del plan de precios.',
      }),
    );

    console.log('✅ Column trialDays added to partner_requests.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      console.warn('Table partner_requests does not exist. Skipping rollback.');
      return;
    }

    // Verificar si trialDays existe antes de eliminarla
    const trialDaysColumn = table.findColumnByName('trialDays');
    if (trialDaysColumn) {
      await queryRunner.dropColumn('partner_requests', 'trialDays');
      console.log('✅ Column trialDays dropped from partner_requests.');
    } else {
      console.warn('Column trialDays does not exist. Skipping rollback.');
    }
  }
}
