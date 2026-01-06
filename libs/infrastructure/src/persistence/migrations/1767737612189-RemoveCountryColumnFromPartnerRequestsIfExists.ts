import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveCountryColumnFromPartnerRequestsIfExists1767737612189
  implements MigrationInterface
{
  name = 'RemoveCountryColumnFromPartnerRequestsIfExists1767737612189';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      console.warn('Table partner_requests does not exist. Skipping migration.');
      return;
    }

    // Verificar si la columna country existe
    const countryColumn = table.findColumnByName('country');
    if (countryColumn) {
      // Verificar que countryId existe antes de eliminar country
      const countryIdColumn = table.findColumnByName('countryId');
      if (!countryIdColumn) {
        console.warn(
          'Column country exists but countryId does not. Adding countryId before removing country.',
        );
        // Agregar countryId si no existe
        await queryRunner.addColumn(
          'partner_requests',
          new TableColumn({
            name: 'countryId',
            type: 'int',
            isNullable: true,
          }),
        );
        console.log('✅ Column countryId added to partner_requests.');
      }

      // Intentar migrar datos si hay registros con country pero sin countryId
      await queryRunner.query(`
        UPDATE partner_requests
        SET countryId = (
          SELECT id FROM countries
          WHERE countries.name = partner_requests.country
          LIMIT 1
        )
        WHERE country IS NOT NULL AND countryId IS NULL
      `);

      // Eliminar la columna country
      await queryRunner.dropColumn('partner_requests', 'country');
      console.log('✅ Column country removed from partner_requests.');
    } else {
      console.log('Column country does not exist in partner_requests. Skipping.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      console.warn('Table partner_requests does not exist. Skipping rollback.');
      return;
    }

    // Verificar si country existe antes de agregarla
    const countryColumn = table.findColumnByName('country');
    if (!countryColumn) {
      // Agregar columna country
      await queryRunner.addColumn(
        'partner_requests',
        new TableColumn({
          name: 'country',
          type: 'varchar',
          length: '100',
          isNullable: true,
        }),
      );
      console.log('✅ Column country added to partner_requests.');

      // Migrar datos de vuelta: obtener el nombre del país desde countries
      await queryRunner.query(`
        UPDATE partner_requests
        SET country = (
          SELECT name FROM countries
          WHERE countries.id = partner_requests.countryId
          LIMIT 1
        )
        WHERE countryId IS NOT NULL
      `);
      console.log('✅ Data migrated from countryId to country.');
    } else {
      console.warn('Column country already exists. Skipping rollback.');
    }
  }
}
