import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCatalogs1766872709000 implements MigrationInterface {
  name = 'CreateCatalogs1766872709000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const table = await queryRunner.getTable('catalogs');
    if (table) {
      return; // La tabla ya existe, no hacer nada
    }

    // Crear tabla catalogs
    await queryRunner.createTable(
      new Table({
        name: 'catalogs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment:
              'Tipo de catálogo: BUSINESS_CATEGORIES, REWARD_TYPES, PAYMENT_METHODS, PAYMENT_CATEGORIES',
          },
          {
            name: 'value',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Valor del elemento de catálogo',
          },
          {
            name: 'displayOrder',
            type: 'int',
            default: 0,
            comment: 'Orden de visualización del elemento',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            comment: 'Indica si el elemento está activo',
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Fecha de creación',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            comment: 'Fecha de última actualización',
          },
        ],
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex(
      'catalogs',
      new TableIndex({
        name: 'IDX_catalogs_type_isActive',
        columnNames: ['type', 'isActive'],
      }),
    );

    await queryRunner.createIndex(
      'catalogs',
      new TableIndex({
        name: 'IDX_catalogs_type_displayOrder',
        columnNames: ['type', 'displayOrder'],
      }),
    );

    // Crear índice único compuesto para evitar duplicados de tipo y valor
    await queryRunner.createIndex(
      'catalogs',
      new TableIndex({
        name: 'IDX_catalogs_type_value_unique',
        columnNames: ['type', 'value'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    const table = await queryRunner.getTable('catalogs');
    if (table) {
      const indexTypeIsActive = table.indices.find(
        (idx) => idx.name === 'IDX_catalogs_type_isActive',
      );
      if (indexTypeIsActive) {
        await queryRunner.dropIndex('catalogs', indexTypeIsActive);
      }

      const indexTypeDisplayOrder = table.indices.find(
        (idx) => idx.name === 'IDX_catalogs_type_displayOrder',
      );
      if (indexTypeDisplayOrder) {
        await queryRunner.dropIndex('catalogs', indexTypeDisplayOrder);
      }

      const indexTypeValueUnique = table.indices.find(
        (idx) => idx.name === 'IDX_catalogs_type_value_unique',
      );
      if (indexTypeValueUnique) {
        await queryRunner.dropIndex('catalogs', indexTypeValueUnique);
      }

      // Eliminar tabla
      await queryRunner.dropTable('catalogs');
    }
  }
}
