import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCountries1766753859000 implements MigrationInterface {
  name = 'CreateCountries1766753859000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla countries
    await queryRunner.createTable(
      new Table({
        name: 'countries',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '2',
            isNullable: true,
          },
          {
            name: 'currencyCode',
            type: 'varchar',
            length: '3',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex(
      'countries',
      new TableIndex({
        name: 'IDX_countries_code',
        columnNames: ['code'],
      }),
    );

    await queryRunner.createIndex(
      'countries',
      new TableIndex({
        name: 'IDX_countries_currencyCode',
        columnNames: ['currencyCode'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('countries');
  }
}
