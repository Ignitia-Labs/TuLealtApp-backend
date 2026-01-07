import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración para agregar el campo updatedBy a la tabla partner_requests
 * Este campo almacena el ID del usuario que realizó la última actualización
 */
export class AddUpdatedByToPartnerRequests1777500000000 implements MigrationInterface {
  name = 'AddUpdatedByToPartnerRequests1777500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      console.warn('Table partner_requests does not exist. Skipping migration.');
      return;
    }

    // Verificar si la columna updatedBy ya existe
    const updatedByColumn = table.findColumnByName('updatedBy');
    if (updatedByColumn) {
      console.log('Column updatedBy already exists in partner_requests. Skipping migration.');
      return;
    }

    // Agregar la columna updatedBy
    await queryRunner.addColumn(
      'partner_requests',
      new TableColumn({
        name: 'updatedBy',
        type: 'int',
        isNullable: true,
        comment: 'ID del usuario que realizó la última actualización',
      }),
    );

    console.log('✅ Column updatedBy added to partner_requests.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      console.warn('Table partner_requests does not exist. Skipping rollback.');
      return;
    }

    // Verificar si updatedBy existe antes de eliminarla
    const updatedByColumn = table.findColumnByName('updatedBy');
    if (updatedByColumn) {
      await queryRunner.dropColumn('partner_requests', 'updatedBy');
      console.log('✅ Column updatedBy dropped from partner_requests.');
    } else {
      console.warn('Column updatedBy does not exist. Skipping rollback.');
    }
  }
}

