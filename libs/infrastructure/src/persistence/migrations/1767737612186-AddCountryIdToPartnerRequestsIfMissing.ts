import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCountryIdToPartnerRequestsIfMissing1767737612186 implements MigrationInterface {
  name = 'AddCountryIdToPartnerRequestsIfMissing1767737612186';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      console.warn('Table partner_requests does not exist. Skipping migration.');
      return;
    }

    // Verificar si la columna countryId ya existe
    const countryIdColumn = table.findColumnByName('countryId');
    if (countryIdColumn) {
      console.log('Column countryId already exists in partner_requests. Skipping migration.');
      return;
    }

    // Agregar la columna countryId
    await queryRunner.addColumn(
      'partner_requests',
      new TableColumn({
        name: 'countryId',
        type: 'int',
        isNullable: true,
      }),
    );

    console.log('✅ Column countryId added to partner_requests.');

    // Crear foreign key si no existe
    const tableAfter = await queryRunner.getTable('partner_requests');
    if (tableAfter) {
      const existingFk = tableAfter.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('countryId') !== -1,
      );
      if (!existingFk) {
        // Verificar que la tabla countries existe antes de crear la FK
        const countriesTable = await queryRunner.getTable('countries');
        if (countriesTable) {
          await queryRunner.createForeignKey(
            'partner_requests',
            new TableForeignKey({
              columnNames: ['countryId'],
              referencedColumnNames: ['id'],
              referencedTableName: 'countries',
              onDelete: 'SET NULL',
              onUpdate: 'CASCADE',
            }),
          );
          console.log('✅ Foreign key created for countryId -> countries.id');
        } else {
          console.warn('⚠️  Table countries does not exist. Skipping foreign key creation.');
        }
      } else {
        console.log('Foreign key for countryId already exists. Skipping.');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      console.warn('Table partner_requests does not exist. Skipping rollback.');
      return;
    }

    // Eliminar foreign key si existe
    const existingFk = table.foreignKeys.find((fk) => fk.columnNames.indexOf('countryId') !== -1);
    if (existingFk) {
      await queryRunner.dropForeignKey('partner_requests', existingFk);
      console.log('✅ Foreign key dropped.');
    }

    // Verificar si countryId existe antes de eliminarla
    const countryIdColumn = table.findColumnByName('countryId');
    if (countryIdColumn) {
      await queryRunner.dropColumn('partner_requests', 'countryId');
      console.log('✅ Column countryId dropped from partner_requests.');
    } else {
      console.warn('Column countryId does not exist. Skipping rollback.');
    }
  }
}
