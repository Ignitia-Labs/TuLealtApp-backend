import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración para agregar los campos maxAdmins, storageGB y apiCallsPerMonth a la tabla partner_limits
 * Estos campos deben coincidir con los campos de pricing_plan_limits para mantener consistencia
 * Valores por defecto: -1 (ilimitado) para registros existentes
 */
export class AddNewFieldsToPartnerLimits1782000000000 implements MigrationInterface {
  name = 'AddNewFieldsToPartnerLimits1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('partner_limits');
    if (!table) {
      console.warn('Table partner_limits does not exist. Skipping migration.');
      return;
    }

    // Agregar maxAdmins si no existe
    const maxAdminsColumn = table.findColumnByName('maxAdmins');
    if (!maxAdminsColumn) {
      await queryRunner.addColumn(
        'partner_limits',
        new TableColumn({
          name: 'maxAdmins',
          type: 'int',
          isNullable: false,
          default: -1,
          comment: 'Número máximo de administradores permitidos. -1 para ilimitado.',
        }),
      );
      console.log('✅ Column maxAdmins added to partner_limits.');
    } else {
      console.log('Column maxAdmins already exists in partner_limits. Skipping.');
    }

    // Agregar storageGB si no existe
    const storageGBColumn = table.findColumnByName('storageGB');
    if (!storageGBColumn) {
      await queryRunner.addColumn(
        'partner_limits',
        new TableColumn({
          name: 'storageGB',
          type: 'int',
          isNullable: false,
          default: -1,
          comment: 'Almacenamiento en GB permitido. -1 para ilimitado.',
        }),
      );
      console.log('✅ Column storageGB added to partner_limits.');
    } else {
      console.log('Column storageGB already exists in partner_limits. Skipping.');
    }

    // Agregar apiCallsPerMonth si no existe
    const apiCallsPerMonthColumn = table.findColumnByName('apiCallsPerMonth');
    if (!apiCallsPerMonthColumn) {
      await queryRunner.addColumn(
        'partner_limits',
        new TableColumn({
          name: 'apiCallsPerMonth',
          type: 'int',
          isNullable: false,
          default: -1,
          comment: 'Número máximo de llamadas API por mes permitidas. -1 para ilimitado.',
        }),
      );
      console.log('✅ Column apiCallsPerMonth added to partner_limits.');
    } else {
      console.log('Column apiCallsPerMonth already exists in partner_limits. Skipping.');
    }

    // Actualizar registros existentes con valores por defecto si es necesario
    // (Los valores por defecto ya se aplican automáticamente, pero podemos asegurarnos)
    await queryRunner.query(`
      UPDATE partner_limits 
      SET maxAdmins = COALESCE(maxAdmins, -1),
          storageGB = COALESCE(storageGB, -1),
          apiCallsPerMonth = COALESCE(apiCallsPerMonth, -1)
      WHERE maxAdmins IS NULL OR storageGB IS NULL OR apiCallsPerMonth IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_limits');
    if (!table) {
      console.warn('Table partner_limits does not exist. Skipping rollback.');
      return;
    }

    // Eliminar apiCallsPerMonth si existe
    const apiCallsPerMonthColumn = table.findColumnByName('apiCallsPerMonth');
    if (apiCallsPerMonthColumn) {
      await queryRunner.dropColumn('partner_limits', 'apiCallsPerMonth');
      console.log('✅ Column apiCallsPerMonth dropped from partner_limits.');
    } else {
      console.warn('Column apiCallsPerMonth does not exist. Skipping rollback.');
    }

    // Eliminar storageGB si existe
    const storageGBColumn = table.findColumnByName('storageGB');
    if (storageGBColumn) {
      await queryRunner.dropColumn('partner_limits', 'storageGB');
      console.log('✅ Column storageGB dropped from partner_limits.');
    } else {
      console.warn('Column storageGB does not exist. Skipping rollback.');
    }

    // Eliminar maxAdmins si existe
    const maxAdminsColumn = table.findColumnByName('maxAdmins');
    if (maxAdminsColumn) {
      await queryRunner.dropColumn('partner_limits', 'maxAdmins');
      console.log('✅ Column maxAdmins dropped from partner_limits.');
    } else {
      console.warn('Column maxAdmins does not exist. Skipping rollback.');
    }
  }
}
