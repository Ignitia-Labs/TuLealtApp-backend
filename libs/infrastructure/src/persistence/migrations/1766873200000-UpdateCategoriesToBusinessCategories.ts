import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para actualizar el tipo CATEGORIES a BUSINESS_CATEGORIES
 * Esta migración actualiza los registros existentes que tengan el tipo antiguo
 */
export class UpdateCategoriesToBusinessCategories1766873200000 implements MigrationInterface {
  name = 'UpdateCategoriesToBusinessCategories1766873200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('catalogs');
    if (!table) {
      return; // La tabla no existe, no hacer nada
    }

    // Actualizar todos los registros que tengan type = 'CATEGORIES' a 'BUSINESS_CATEGORIES'
    await queryRunner.query(`
      UPDATE catalogs
      SET type = 'BUSINESS_CATEGORIES'
      WHERE type = 'CATEGORIES'
    `);

    console.log('✓ Actualizados registros de CATEGORIES a BUSINESS_CATEGORIES');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('catalogs');
    if (!table) {
      return;
    }

    // Revertir: actualizar BUSINESS_CATEGORIES de vuelta a CATEGORIES
    await queryRunner.query(`
      UPDATE catalogs
      SET type = 'CATEGORIES'
      WHERE type = 'BUSINESS_CATEGORIES'
    `);

    console.log('✓ Revertidos registros de BUSINESS_CATEGORIES a CATEGORIES');
  }
}
