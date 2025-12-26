import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCountryRelations1766753860000 implements MigrationInterface {
  name = 'AddCountryRelations1766753860000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar countryId a currencies (nullable inicialmente)
    await queryRunner.addColumn(
      'currencies',
      new TableColumn({
        name: 'countryId',
        type: 'int',
        isNullable: true,
      }),
    );

    // Agregar foreign key de currencies a countries
    await queryRunner.createForeignKey(
      'currencies',
      new TableForeignKey({
        columnNames: ['countryId'],
        referencedTableName: 'countries',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    // Cambiar country en partners de varchar a countryId int
    // Primero agregamos la nueva columna countryId
    await queryRunner.addColumn(
      'partners',
      new TableColumn({
        name: 'countryId',
        type: 'int',
        isNullable: true,
      }),
    );

    // Agregar foreign key de partners a countries
    await queryRunner.createForeignKey(
      'partners',
      new TableForeignKey({
        columnNames: ['countryId'],
        referencedTableName: 'countries',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    // Nota: La columna 'country' (varchar) se mantiene temporalmente para migración de datos
    // Se puede eliminar en una migración posterior después de migrar los datos
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    const currenciesTable = await queryRunner.getTable('currencies');
    const currenciesForeignKey = currenciesTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('countryId') !== -1,
    );
    if (currenciesForeignKey) {
      await queryRunner.dropForeignKey('currencies', currenciesForeignKey);
    }

    const partnersTable = await queryRunner.getTable('partners');
    const partnersForeignKey = partnersTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('countryId') !== -1,
    );
    if (partnersForeignKey) {
      await queryRunner.dropForeignKey('partners', partnersForeignKey);
    }

    // Eliminar columnas
    await queryRunner.dropColumn('currencies', 'countryId');
    await queryRunner.dropColumn('partners', 'countryId');
  }
}

