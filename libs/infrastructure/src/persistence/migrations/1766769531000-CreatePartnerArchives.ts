import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePartnerArchives1766769531000 implements MigrationInterface {
  name = 'CreatePartnerArchives1766769531000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla partner_archives
    await queryRunner.createTable(
      new Table({
        name: 'partner_archives',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'originalPartnerId',
            type: 'int',
            comment: 'ID original del partner antes de ser eliminado',
          },
          {
            name: 'archivedData',
            type: 'json',
            comment: 'Datos completos del partner y todas sus relaciones en formato JSON (partner, subscription, limits, stats, tenants con features y branches)',
          },
          {
            name: 'deletedBy',
            type: 'int',
            isNullable: true,
            comment: 'ID del usuario que realizó la eliminación (para auditoría)',
          },
          {
            name: 'archivedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Fecha y hora en que se archivó el partner',
          },
        ],
      }),
      true,
    );

    // Crear índice para búsquedas por ID original del partner
    await queryRunner.createIndex(
      'partner_archives',
      new TableIndex({
        name: 'IDX_PARTNER_ARCHIVES_ORIGINAL_PARTNER_ID',
        columnNames: ['originalPartnerId'],
      }),
    );

    // Crear índice para búsquedas por fecha de archivado
    await queryRunner.createIndex(
      'partner_archives',
      new TableIndex({
        name: 'IDX_PARTNER_ARCHIVES_ARCHIVED_AT',
        columnNames: ['archivedAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.dropIndex('partner_archives', 'IDX_PARTNER_ARCHIVES_ARCHIVED_AT');
    await queryRunner.dropIndex('partner_archives', 'IDX_PARTNER_ARCHIVES_ORIGINAL_PARTNER_ID');

    // Eliminar tabla
    await queryRunner.dropTable('partner_archives');
  }
}
