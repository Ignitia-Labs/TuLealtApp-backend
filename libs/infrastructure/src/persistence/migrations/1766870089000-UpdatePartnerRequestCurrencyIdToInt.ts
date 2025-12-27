import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class UpdatePartnerRequestCurrencyIdToInt1766870089000 implements MigrationInterface {
  name = 'UpdatePartnerRequestCurrencyIdToInt1766870089000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('partner_requests');
    if (!table) {
      return; // La tabla no existe, no hacer nada
    }

    // Verificar si currencyId existe y es VARCHAR
    const currencyIdColumn = table.findColumnByName('currencyId');
    if (!currencyIdColumn) {
      // Si no existe, crear la columna como INT directamente
      await queryRunner.addColumn(
        'partner_requests',
        new TableColumn({
          name: 'currencyId',
          type: 'int',
          isNullable: false,
        }),
      );
      // Crear foreign key
      await queryRunner.createForeignKey(
        'partner_requests',
        new TableForeignKey({
          columnNames: ['currencyId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'currencies',
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
          name: 'FK_partner_requests_currencyId',
        }),
      );
      return;
    }

    // Si ya es INT, verificar si tiene la foreign key y salir
    if (currencyIdColumn.type === 'int' || currencyIdColumn.type === 'integer') {
      const tableAfter = await queryRunner.getTable('partner_requests');
      if (tableAfter) {
        const existingFk = tableAfter.foreignKeys.find(
          (fk) => fk.columnNames.indexOf('currencyId') !== -1,
        );
        if (!existingFk) {
          await queryRunner.createForeignKey(
            'partner_requests',
            new TableForeignKey({
              columnNames: ['currencyId'],
              referencedColumnNames: ['id'],
              referencedTableName: 'currencies',
              onDelete: 'RESTRICT',
              onUpdate: 'CASCADE',
              name: 'FK_partner_requests_currencyId',
            }),
          );
        }
      }
      return; // Ya está migrado
    }

    // Crear columna temporal para almacenar el ID numérico de la moneda
    await queryRunner.addColumn(
      'partner_requests',
      new TableColumn({
        name: 'currencyId_temp',
        type: 'int',
        isNullable: true,
      }),
    );

    // Obtener el ID de GTQ como valor por defecto (debe existir siempre)
    const defaultCurrencyResult = await queryRunner.query(
      "SELECT id FROM currencies WHERE code = 'GTQ' LIMIT 1",
    );
    if (!defaultCurrencyResult || defaultCurrencyResult.length === 0) {
      throw new Error(
        'No se encontró la moneda GTQ en la tabla currencies. Asegúrate de que los seeds se hayan ejecutado.',
      );
    }
    const defaultCurrencyId = defaultCurrencyResult[0].id;

    // Migrar datos: convertir currencyId string a ID numérico
    const partnerRequests = await queryRunner.query('SELECT id, currencyId FROM partner_requests');

    for (const request of partnerRequests) {
      let currencyIdNumber: number | null = null;

      if (request.currencyId) {
        // Si viene en formato 'currency-{id}', extraer el número
        if (typeof request.currencyId === 'string' && request.currencyId.startsWith('currency-')) {
          const match = request.currencyId.match(/^currency-(\d+)$/);
          if (match) {
            currencyIdNumber = parseInt(match[1], 10);
          }
        } else {
          // Si viene como número string (ej: "61"), convertir directamente
          const parsed = parseInt(request.currencyId, 10);
          if (!isNaN(parsed)) {
            currencyIdNumber = parsed;
          }
        }

        // Si tenemos un número válido, verificar que existe en currencies
        if (currencyIdNumber !== null) {
          const currency = await queryRunner.query(
            'SELECT id FROM currencies WHERE id = ? LIMIT 1',
            [currencyIdNumber],
          );
          if (!currency || currency.length === 0) {
            // Si la moneda no existe, usar el default
            currencyIdNumber = defaultCurrencyId;
          }
        } else {
          // Si no se pudo parsear, usar el default
          currencyIdNumber = defaultCurrencyId;
        }
      } else {
        // Si currencyId es NULL, usar el default
        currencyIdNumber = defaultCurrencyId;
      }

      // Actualizar la columna temporal (siempre debe tener un valor válido)
      await queryRunner.query('UPDATE partner_requests SET currencyId_temp = ? WHERE id = ?', [
        currencyIdNumber,
        request.id,
      ]);
    }

    // Verificar que no haya valores NULL en currencyId_temp antes de continuar
    const nullCheck = await queryRunner.query(
      'SELECT COUNT(*) as count FROM partner_requests WHERE currencyId_temp IS NULL',
    );
    if (nullCheck && nullCheck[0] && nullCheck[0].count > 0) {
      // Si hay NULLs, asignar el valor por defecto
      await queryRunner.query(
        'UPDATE partner_requests SET currencyId_temp = ? WHERE currencyId_temp IS NULL',
        [defaultCurrencyId],
      );
    }

    // Verificar que todos los valores existan en currencies y corregir los inválidos
    const invalidCheck = await queryRunner.query(`
      SELECT pr.id, pr.currencyId_temp
      FROM partner_requests pr
      LEFT JOIN currencies c ON c.id = pr.currencyId_temp
      WHERE c.id IS NULL
    `);
    if (invalidCheck && invalidCheck.length > 0) {
      // Si hay valores inválidos, asignar el valor por defecto a cada uno
      for (const invalid of invalidCheck) {
        await queryRunner.query('UPDATE partner_requests SET currencyId_temp = ? WHERE id = ?', [
          defaultCurrencyId,
          invalid.id,
        ]);
      }
    }

    // Eliminar la columna antigua currencyId
    await queryRunner.dropColumn('partner_requests', 'currencyId');

    // Verificación final: asegurar que todos los valores sean válidos antes de hacer NOT NULL
    const finalInvalidCheck = await queryRunner.query(`
      SELECT pr.id, pr.currencyId_temp
      FROM partner_requests pr
      LEFT JOIN currencies c ON c.id = pr.currencyId_temp
      WHERE c.id IS NULL OR pr.currencyId_temp IS NULL
    `);
    if (finalInvalidCheck && finalInvalidCheck.length > 0) {
      // Si aún hay valores inválidos o NULL, asignar el valor por defecto
      for (const invalid of finalInvalidCheck) {
        await queryRunner.query('UPDATE partner_requests SET currencyId_temp = ? WHERE id = ?', [
          defaultCurrencyId,
          invalid.id,
        ]);
      }
    }

    // Renombrar currencyId_temp a currencyId y hacerla NOT NULL
    await queryRunner.query(
      'ALTER TABLE partner_requests CHANGE currencyId_temp currencyId INT NOT NULL',
    );

    // Verificación final antes de crear la foreign key
    const preFkCheck = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM partner_requests pr
      LEFT JOIN currencies c ON c.id = pr.currencyId
      WHERE c.id IS NULL
    `);
    if (preFkCheck && preFkCheck[0] && preFkCheck[0].count > 0) {
      throw new Error(
        `No se puede crear la foreign key: hay ${preFkCheck[0].count} registros con currencyId inválido.`,
      );
    }

    // Crear foreign key
    const tableAfter = await queryRunner.getTable('partner_requests');
    if (tableAfter) {
      const existingFk = tableAfter.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('currencyId') !== -1,
      );
      if (!existingFk) {
        await queryRunner.createForeignKey(
          'partner_requests',
          new TableForeignKey({
            columnNames: ['currencyId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'currencies',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
            name: 'FK_partner_requests_currencyId',
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
    const existingFk = table.foreignKeys.find((fk) => fk.columnNames.indexOf('currencyId') !== -1);
    if (existingFk) {
      await queryRunner.dropForeignKey('partner_requests', existingFk);
    }

    // Verificar si currencyId existe y es INT
    const currencyIdColumn = table.findColumnByName('currencyId');
    if (
      currencyIdColumn &&
      (currencyIdColumn.type === 'int' || currencyIdColumn.type === 'integer')
    ) {
      // Crear columna temporal para almacenar el currencyId string
      await queryRunner.addColumn(
        'partner_requests',
        new TableColumn({
          name: 'currencyId_temp',
          type: 'varchar',
          length: '50',
          isNullable: true,
        }),
      );

      // Migrar datos: convertir ID numérico a currencyId string en formato 'currency-{id}'
      const partnerRequests = await queryRunner.query(
        'SELECT id, currencyId FROM partner_requests',
      );
      for (const request of partnerRequests) {
        if (request.currencyId) {
          const currencyIdString = `currency-${request.currencyId}`;
          await queryRunner.query('UPDATE partner_requests SET currencyId_temp = ? WHERE id = ?', [
            currencyIdString,
            request.id,
          ]);
        }
      }

      // Eliminar la columna currencyId numérica
      await queryRunner.dropColumn('partner_requests', 'currencyId');

      // Renombrar currencyId_temp a currencyId
      await queryRunner.query(
        'ALTER TABLE partner_requests CHANGE currencyId_temp currencyId VARCHAR(50) NOT NULL',
      );
    }
  }
}
