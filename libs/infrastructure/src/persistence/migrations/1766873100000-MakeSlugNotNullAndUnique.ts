import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

/**
 * Migración para hacer el campo slug NOT NULL y único
 * Esta migración debe ejecutarse DESPUÉS de que la seed haya generado los slugs
 */
export class MakeSlugNotNullAndUnique1766873100000 implements MigrationInterface {
  name = 'MakeSlugNotNullAndUnique1766873100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('catalogs');
    if (!table) {
      return; // La tabla no existe, no hacer nada
    }

    const slugColumn = table.findColumnByName('slug');
    if (!slugColumn) {
      return; // La columna no existe, no hacer nada
    }

    // Verificar que todos los registros tengan slug (no debería haber NULLs si la seed se ejecutó)
    const nullSlugs = await queryRunner.query(
      `SELECT COUNT(*) as count FROM catalogs WHERE slug IS NULL`,
    );
    if (nullSlugs[0]?.count > 0) {
      throw new Error(
        `Cannot make slug NOT NULL: ${nullSlugs[0].count} catalog(s) have NULL slug. Please run the catalog seed first.`,
      );
    }

    // Eliminar el índice no único existente
    const existingIndex = table.indices.find((idx) => idx.name === 'IDX_catalogs_slug');
    if (existingIndex) {
      await queryRunner.dropIndex('catalogs', existingIndex);
    }

    // Hacer el campo NOT NULL
    await queryRunner.changeColumn(
      'catalogs',
      'slug',
      new TableColumn({
        name: 'slug',
        type: 'varchar',
        length: '255',
        isNullable: false,
        comment: 'Slug único del elemento de catálogo (usado para referencias)',
      }),
    );

    // Crear índice único
    await queryRunner.createIndex(
      'catalogs',
      new TableIndex({
        name: 'IDX_catalogs_slug_unique',
        columnNames: ['slug'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('catalogs');
    if (!table) {
      return;
    }

    // Eliminar índice único
    const uniqueIndex = table.indices.find((idx) => idx.name === 'IDX_catalogs_slug_unique');
    if (uniqueIndex) {
      await queryRunner.dropIndex('catalogs', uniqueIndex);
    }

    // Hacer el campo nullable nuevamente
    await queryRunner.changeColumn(
      'catalogs',
      'slug',
      new TableColumn({
        name: 'slug',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'Slug único del elemento de catálogo (usado para referencias)',
      }),
    );

    // Recrear índice no único
    await queryRunner.createIndex(
      'catalogs',
      new TableIndex({
        name: 'IDX_catalogs_slug',
        columnNames: ['slug'],
      }),
    );
  }
}
