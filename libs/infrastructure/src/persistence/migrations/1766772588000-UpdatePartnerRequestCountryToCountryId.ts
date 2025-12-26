import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class UpdatePartnerRequestCountryToCountryId1766772588000 implements MigrationInterface {
  name = 'UpdatePartnerRequestCountryToCountryId1766772588000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      return; // La tabla no existe, no hacer nada
    }

    // Verificar si la columna country existe
    const countryColumn = table.findColumnByName('country');
    if (!countryColumn) {
      // Si no existe country, verificar si ya existe countryId
      const countryIdColumn = table.findColumnByName('countryId');
      if (countryIdColumn) {
        return; // Ya está migrado
      }
      // Si no existe ninguna, crear countryId directamente
      await queryRunner.addColumn(
        'partner_requests',
        new TableColumn({
          name: 'countryId',
          type: 'int',
          isNullable: true,
        }),
      );
    } else {
      // Agregar la nueva columna countryId
      await queryRunner.addColumn(
        'partner_requests',
        new TableColumn({
          name: 'countryId',
          type: 'int',
          isNullable: true,
        }),
      );

      // Migrar datos: intentar encontrar el ID del país por nombre
      // Nota: Esto es una migración básica. Los datos existentes se establecerán como NULL
      // ya que no podemos hacer un mapeo automático confiable de nombres a IDs
      await queryRunner.query(`
        UPDATE partner_requests
        SET countryId = (
          SELECT id FROM countries
          WHERE countries.name = partner_requests.country
          LIMIT 1
        )
        WHERE country IS NOT NULL
      `);

      // Eliminar la columna country antigua
      await queryRunner.dropColumn('partner_requests', 'country');
    }

    // Crear foreign key si no existe
    const tableAfter = await queryRunner.getTable('partner_requests');
    if (tableAfter) {
      const existingFk = tableAfter.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('countryId') !== -1,
      );
      if (!existingFk) {
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
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      return;
    }

    // Eliminar foreign key si existe
    const existingFk = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('countryId') !== -1,
    );
    if (existingFk) {
      await queryRunner.dropForeignKey('partner_requests', existingFk);
    }

    // Verificar si countryId existe
    const countryIdColumn = table.findColumnByName('countryId');
    if (countryIdColumn) {
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

      // Eliminar columna countryId
      await queryRunner.dropColumn('partner_requests', 'countryId');
    }
  }
}
