import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MakeCountryNullableInPartners1767737612190 implements MigrationInterface {
  name = 'MakeCountryNullableInPartners1767737612190';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('partners');
    if (!table) {
      console.warn('Table partners does not exist. Skipping migration.');
      return;
    }

    // Verificar si la columna country existe
    const countryColumn = table.findColumnByName('country');
    if (countryColumn) {
      // Verificar si ya es nullable
      if (!countryColumn.isNullable) {
        // Hacer la columna nullable
        await queryRunner.changeColumn(
          'partners',
          'country',
          new TableColumn({
            name: 'country',
            type: 'varchar',
            length: '100',
            isNullable: true,
          }),
        );
        console.log('✅ Column country made nullable in partners.');
      } else {
        console.log('Column country is already nullable in partners. Skipping.');
      }

      // Llenar automáticamente country desde countryId para registros existentes
      await queryRunner.query(`
        UPDATE partners
        SET country = (
          SELECT name FROM countries
          WHERE countries.id = partners.countryId
          LIMIT 1
        )
        WHERE countryId IS NOT NULL AND (country IS NULL OR country = '')
      `);
      console.log('✅ Country names populated from countryId for existing records.');
    } else {
      console.log('Column country does not exist in partners. Skipping.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partners');
    if (!table) {
      console.warn('Table partners does not exist. Skipping rollback.');
      return;
    }

    const countryColumn = table.findColumnByName('country');
    if (countryColumn && countryColumn.isNullable) {
      // Hacer la columna NOT NULL (esto puede fallar si hay valores NULL)
      await queryRunner.changeColumn(
        'partners',
        'country',
        new TableColumn({
          name: 'country',
          type: 'varchar',
          length: '100',
          isNullable: false,
        }),
      );
      console.log('✅ Column country made NOT NULL in partners.');
    } else {
      console.warn('Column country does not exist or is already NOT NULL. Skipping rollback.');
    }
  }
}
