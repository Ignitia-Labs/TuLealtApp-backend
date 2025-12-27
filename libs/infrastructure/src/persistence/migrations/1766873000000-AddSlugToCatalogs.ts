import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddSlugToCatalogs1766873000000 implements MigrationInterface {
  name = 'AddSlugToCatalogs1766873000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('catalogs');
    if (!table) {
      return; // La tabla no existe, no hacer nada
    }

    // Verificar si la columna slug ya existe
    const slugColumn = table.findColumnByName('slug');
    if (slugColumn) {
      return; // La columna ya existe, no hacer nada
    }

    // Agregar columna slug (temporalmente nullable para permitir migración de datos existentes)
    await queryRunner.addColumn(
      'catalogs',
      new TableColumn({
        name: 'slug',
        type: 'varchar',
        length: '255',
        isNullable: true, // Temporalmente nullable para permitir migración
        comment: 'Slug único del elemento de catálogo (usado para referencias)',
      }),
    );

    // Nota: Los slugs se generarán automáticamente cuando se ejecute la seed
    // Para registros existentes, se recomienda ejecutar la seed después de la migración

    // Crear índice para slug (no único inicialmente para permitir NULL durante la migración)
    // El índice único se creará en una migración posterior después de que la seed genere los slugs
    await queryRunner.createIndex(
      'catalogs',
      new TableIndex({
        name: 'IDX_catalogs_slug',
        columnNames: ['slug'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('catalogs');
    if (!table) {
      return;
    }

    // Eliminar índice único de slug
    const slugIndex = table.indices.find((idx) => idx.name === 'IDX_catalogs_slug_unique');
    if (slugIndex) {
      await queryRunner.dropIndex('catalogs', slugIndex);
    }

    // Eliminar columna slug
    await queryRunner.dropColumn('catalogs', 'slug');
  }
}

