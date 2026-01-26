import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración para agregar el campo source a la tabla partner_requests
 * Este campo indica si la solicitud fue creada desde el API público (partner-api) o interno (admin-api)
 * Valores posibles: 'public' (partner-api) o 'internal' (admin-api)
 * Por defecto: 'internal' para mantener compatibilidad con registros existentes
 */
export class AddSourceToPartnerRequests1778000000000 implements MigrationInterface {
  name = 'AddSourceToPartnerRequests1778000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      console.warn('Table partner_requests does not exist. Skipping migration.');
      return;
    }

    // Verificar si la columna source ya existe
    const sourceColumn = table.findColumnByName('source');
    if (sourceColumn) {
      console.log('Column source already exists in partner_requests. Skipping migration.');
      return;
    }

    // Agregar la columna source
    await queryRunner.addColumn(
      'partner_requests',
      new TableColumn({
        name: 'source',
        type: 'varchar',
        length: '20',
        default: "'internal'",
        isNullable: false,
        comment:
          "Indica el origen de la solicitud: 'public' (partner-api) o 'internal' (admin-api)",
      }),
    );

    console.log('✅ Column source added to partner_requests.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      console.warn('Table partner_requests does not exist. Skipping rollback.');
      return;
    }

    // Verificar si source existe antes de eliminarla
    const sourceColumn = table.findColumnByName('source');
    if (sourceColumn) {
      await queryRunner.dropColumn('partner_requests', 'source');
      console.log('✅ Column source dropped from partner_requests.');
    } else {
      console.warn('Column source does not exist. Skipping rollback.');
    }
  }
}
