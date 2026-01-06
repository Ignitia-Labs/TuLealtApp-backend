import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTaxFieldsToPartnerSubscriptions1766787800000 implements MigrationInterface {
  name = 'AddTaxFieldsToPartnerSubscriptions1766787800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('partner_subscriptions');
    if (!table) {
      return; // La tabla no existe, no hacer nada
    }

    // Verificar si includeTax ya existe
    const includeTaxColumn = table.findColumnByName('includeTax');
    if (!includeTaxColumn) {
      await queryRunner.addColumn(
        'partner_subscriptions',
        new TableColumn({
          name: 'includeTax',
          type: 'boolean',
          default: false,
        }),
      );
    }

    // Verificar si taxPercent ya existe
    const taxPercentColumn = table.findColumnByName('taxPercent');
    if (!taxPercentColumn) {
      await queryRunner.addColumn(
        'partner_subscriptions',
        new TableColumn({
          name: 'taxPercent',
          type: 'decimal',
          precision: 5,
          scale: 2,
          isNullable: true,
        }),
      );
    }

    // Verificar si basePrice ya existe
    const basePriceColumn = table.findColumnByName('basePrice');
    if (!basePriceColumn) {
      await queryRunner.addColumn(
        'partner_subscriptions',
        new TableColumn({
          name: 'basePrice',
          type: 'decimal',
          precision: 10,
          scale: 2,
          default: 0,
        }),
      );

      // Migrar datos existentes: basePrice = billingAmount (solo si billingAmount existe)
      // Necesitamos refrescar la tabla después de agregar columnas
      const refreshedTable = await queryRunner.getTable('partner_subscriptions');
      const billingAmountColumn = refreshedTable?.findColumnByName('billingAmount');
      if (billingAmountColumn) {
        await queryRunner.query(`
          UPDATE partner_subscriptions
          SET basePrice = billingAmount
          WHERE basePrice = 0 OR basePrice IS NULL
        `);
      }
    }

    // Verificar si taxAmount ya existe
    const taxAmountColumn = table.findColumnByName('taxAmount');
    if (!taxAmountColumn) {
      await queryRunner.addColumn(
        'partner_subscriptions',
        new TableColumn({
          name: 'taxAmount',
          type: 'decimal',
          precision: 10,
          scale: 2,
          default: 0,
        }),
      );
    }

    // Verificar si totalPrice ya existe
    const totalPriceColumn = table.findColumnByName('totalPrice');
    if (!totalPriceColumn) {
      await queryRunner.addColumn(
        'partner_subscriptions',
        new TableColumn({
          name: 'totalPrice',
          type: 'decimal',
          precision: 10,
          scale: 2,
          default: 0,
        }),
      );

      // Migrar datos existentes: totalPrice = billingAmount (solo si billingAmount existe)
      // Necesitamos refrescar la tabla después de agregar columnas
      const refreshedTable = await queryRunner.getTable('partner_subscriptions');
      const billingAmountColumn = refreshedTable?.findColumnByName('billingAmount');
      if (billingAmountColumn) {
        await queryRunner.query(`
          UPDATE partner_subscriptions
          SET totalPrice = billingAmount
          WHERE totalPrice = 0 OR totalPrice IS NULL
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_subscriptions');
    if (!table) {
      return;
    }

    // Eliminar columna totalPrice si existe
    const totalPriceColumn = table.findColumnByName('totalPrice');
    if (totalPriceColumn) {
      await queryRunner.dropColumn('partner_subscriptions', 'totalPrice');
    }

    // Eliminar columna taxAmount si existe
    const taxAmountColumn = table.findColumnByName('taxAmount');
    if (taxAmountColumn) {
      await queryRunner.dropColumn('partner_subscriptions', 'taxAmount');
    }

    // Eliminar columna basePrice si existe
    const basePriceColumn = table.findColumnByName('basePrice');
    if (basePriceColumn) {
      await queryRunner.dropColumn('partner_subscriptions', 'basePrice');
    }

    // Eliminar columna taxPercent si existe
    const taxPercentColumn = table.findColumnByName('taxPercent');
    if (taxPercentColumn) {
      await queryRunner.dropColumn('partner_subscriptions', 'taxPercent');
    }

    // Eliminar columna includeTax si existe
    const includeTaxColumn = table.findColumnByName('includeTax');
    if (includeTaxColumn) {
      await queryRunner.dropColumn('partner_subscriptions', 'includeTax');
    }
  }
}
