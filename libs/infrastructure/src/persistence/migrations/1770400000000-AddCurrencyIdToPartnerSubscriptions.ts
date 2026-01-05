import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

/**
 * Migración para agregar el campo currencyId a la tabla partner_subscriptions
 *
 * Permite que las suscripciones tengan su propia moneda independiente del partner.
 * El partner puede tener una moneda configurada para su sistema, pero la suscripción
 * puede tener su propia moneda (USD o GTQ) para facturación.
 *
 * La columna es nullable para mantener compatibilidad con datos existentes.
 * Si una suscripción tiene un código de moneda (currency), se intentará encontrar
 * el currencyId correspondiente automáticamente.
 */
export class AddCurrencyIdToPartnerSubscriptions1770400000000 implements MigrationInterface {
  name = 'AddCurrencyIdToPartnerSubscriptions1770400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_subscriptions');

    if (!table) {
      console.log('⚠️ Tabla partner_subscriptions no encontrada.');
      return;
    }

    // Verificar si currencyId ya existe
    const currencyIdColumn = table.findColumnByName('currencyId');
    if (!currencyIdColumn) {
      // Agregar la columna currencyId
      await queryRunner.addColumn(
        'partner_subscriptions',
        new TableColumn({
          name: 'currencyId',
          type: 'int',
          isNullable: true,
        }),
      );

      console.log('✅ Columna currencyId agregada a partner_subscriptions.');

      // Migrar datos existentes: buscar currencyId basado en el código de moneda (currency)
      // Esto actualiza todas las suscripciones existentes que tienen un código de moneda
      const subscriptions = await queryRunner.query(
        'SELECT id, currency FROM partner_subscriptions WHERE currency IS NOT NULL AND currency != "" AND currencyId IS NULL',
      );

      let migratedCount = 0;
      let notFoundCount = 0;
      const notFoundCurrencies = new Set<string>();

      for (const subscription of subscriptions) {
        if (subscription.currency) {
          // Buscar la moneda por código (case-insensitive)
          const currency = await queryRunner.query(
            'SELECT id FROM currencies WHERE UPPER(code) = UPPER(?) LIMIT 1',
            [subscription.currency.trim()],
          );

          if (currency && currency.length > 0) {
            await queryRunner.query(
              'UPDATE partner_subscriptions SET currencyId = ? WHERE id = ?',
              [currency[0].id, subscription.id],
            );
            migratedCount++;
          } else {
            notFoundCount++;
            notFoundCurrencies.add(subscription.currency);
            console.log(
              `⚠️ No se encontró currencyId para código de moneda: ${subscription.currency} (subscription ID: ${subscription.id})`,
            );
          }
        }
      }

      console.log(
        `✅ Migrados ${migratedCount} registros: currencyId asignado basado en código de moneda (currency).`,
      );

      if (notFoundCount > 0) {
        console.log(
          `⚠️ ${notFoundCount} suscripciones no pudieron ser migradas. Códigos de moneda no encontrados: ${Array.from(notFoundCurrencies).join(', ')}`,
        );
        console.log(
          '💡 Estas suscripciones mantendrán currencyId = NULL. Puedes actualizarlas manualmente después.',
        );
      }
    } else {
      console.log('⚠️ Columna currencyId ya existe en partner_subscriptions.');
    }

    // Verificar si la foreign key ya existe
    const tableWithFK = await queryRunner.getTable('partner_subscriptions');
    if (tableWithFK) {
      const existingFK = tableWithFK.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('currencyId') !== -1,
      );

      if (!existingFK) {
        // Crear la foreign key hacia currencies
        await queryRunner.createForeignKey(
          'partner_subscriptions',
          new TableForeignKey({
            columnNames: ['currencyId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'currencies',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
            name: 'FK_partner_subscriptions_currencyId',
          }),
        );

        console.log('✅ Foreign key FK_partner_subscriptions_currencyId creada.');
      } else {
        console.log('⚠️ Foreign key FK_partner_subscriptions_currencyId ya existe.');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_subscriptions');

    if (!table) {
      console.log('⚠️ Tabla partner_subscriptions no encontrada.');
      return;
    }

    // Eliminar la foreign key si existe
    const existingFK = table.foreignKeys.find((fk) => fk.columnNames.indexOf('currencyId') !== -1);

    if (existingFK) {
      await queryRunner.dropForeignKey('partner_subscriptions', existingFK);
      console.log('✅ Foreign key FK_partner_subscriptions_currencyId eliminada.');
    }

    // Eliminar la columna currencyId si existe
    const currencyIdColumn = table.findColumnByName('currencyId');
    if (currencyIdColumn) {
      await queryRunner.dropColumn('partner_subscriptions', 'currencyId');
      console.log('✅ Columna currencyId eliminada de partner_subscriptions.');
    } else {
      console.log('⚠️ Columna currencyId no encontrada en partner_subscriptions.');
    }
  }
}
