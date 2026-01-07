import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración para agregar la columna banner a la tabla tenants
 * Permite almacenar la URL del banner de cada tenant
 */
export class AddBannerToTenants1777000000000 implements MigrationInterface {
  name = 'AddBannerToTenants1777000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla tenants existe
    const tenantsTable = await queryRunner.getTable('tenants');
    if (tenantsTable) {
      // Agregar banner a tenants solo si no existe
      const tenantsBannerColumn = tenantsTable.findColumnByName('banner');
      if (!tenantsBannerColumn) {
        await queryRunner.addColumn(
          'tenants',
          new TableColumn({
            name: 'banner',
            type: 'text',
            isNullable: true,
            comment: 'URL del banner del tenant',
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla tenants existe
    const tenantsTable = await queryRunner.getTable('tenants');
    if (tenantsTable) {
      // Eliminar columna banner si existe
      const tenantsBannerColumn = tenantsTable.findColumnByName('banner');
      if (tenantsBannerColumn) {
        await queryRunner.dropColumn('tenants', 'banner');
      }
    }
  }
}
