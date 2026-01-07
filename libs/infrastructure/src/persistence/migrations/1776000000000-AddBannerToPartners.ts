import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración para agregar la columna banner a la tabla partners
 * Permite almacenar la URL del banner de cada partner
 */
export class AddBannerToPartners1776000000000 implements MigrationInterface {
  name = 'AddBannerToPartners1776000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla partners existe
    const partnersTable = await queryRunner.getTable('partners');
    if (partnersTable) {
      // Agregar banner a partners solo si no existe
      const partnersBannerColumn = partnersTable.findColumnByName('banner');
      if (!partnersBannerColumn) {
        await queryRunner.addColumn(
          'partners',
          new TableColumn({
            name: 'banner',
            type: 'text',
            isNullable: true,
            comment: 'URL del banner del partner',
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla partners existe
    const partnersTable = await queryRunner.getTable('partners');
    if (partnersTable) {
      // Eliminar columna banner si existe
      const partnersBannerColumn = partnersTable.findColumnByName('banner');
      if (partnersBannerColumn) {
        await queryRunner.dropColumn('partners', 'banner');
      }
    }
  }
}
