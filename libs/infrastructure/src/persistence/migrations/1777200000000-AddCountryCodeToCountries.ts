import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCountryCodeToCountries1777200000000 implements MigrationInterface {
  name = 'AddCountryCodeToCountries1777200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('countries');
    if (!table) {
      console.warn('Table countries does not exist. Skipping migration.');
      return;
    }

    // Verificar si la columna ya existe
    const column = table.findColumnByName('countryCode');
    if (column) {
      console.warn('Column countryCode already exists. Skipping migration.');
      return;
    }

    // Agregar la columna countryCode
    await queryRunner.addColumn(
      'countries',
      new TableColumn({
        name: 'countryCode',
        type: 'varchar',
        length: '10',
        isNullable: true,
        comment: 'Código telefónico internacional del país (ej: +502, +1, +52)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('countries');
    if (!table) {
      console.warn('Table countries does not exist. Skipping rollback.');
      return;
    }

    // Verificar si la columna existe
    const column = table.findColumnByName('countryCode');
    if (!column) {
      console.warn('Column countryCode does not exist. Skipping rollback.');
      return;
    }

    // Eliminar la columna countryCode
    await queryRunner.dropColumn('countries', 'countryCode');
  }
}

