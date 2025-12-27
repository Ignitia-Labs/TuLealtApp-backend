import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCountryRelations1766753860000 implements MigrationInterface {
  name = 'AddCountryRelations1766753860000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla currencies existe
    const currenciesTable = await queryRunner.getTable('currencies');
    if (currenciesTable) {
      // Agregar countryId a currencies solo si no existe
      const currenciesCountryIdColumn = currenciesTable.findColumnByName('countryId');
      if (!currenciesCountryIdColumn) {
        await queryRunner.addColumn(
          'currencies',
          new TableColumn({
            name: 'countryId',
            type: 'int',
            isNullable: true,
          }),
        );
      }

      // Agregar foreign key de currencies a countries solo si no existe
      const currenciesForeignKeys = currenciesTable.foreignKeys || [];
      const currenciesHasForeignKey = currenciesForeignKeys.some(
        (fk) => fk.columnNames.indexOf('countryId') !== -1,
      );
      if (!currenciesHasForeignKey) {
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
      }
    }

    // Verificar si la tabla partners existe
    const partnersTable = await queryRunner.getTable('partners');
    if (partnersTable) {
      // Agregar countryId a partners solo si no existe
      const partnersCountryIdColumn = partnersTable.findColumnByName('countryId');
      if (!partnersCountryIdColumn) {
        await queryRunner.addColumn(
          'partners',
          new TableColumn({
            name: 'countryId',
            type: 'int',
            isNullable: true,
          }),
        );
      }

      // Agregar foreign key de partners a countries solo si no existe
      const partnersForeignKeys = partnersTable.foreignKeys || [];
      const partnersHasForeignKey = partnersForeignKeys.some(
        (fk) => fk.columnNames.indexOf('countryId') !== -1,
      );
      if (!partnersHasForeignKey) {
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
      }
    }

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
