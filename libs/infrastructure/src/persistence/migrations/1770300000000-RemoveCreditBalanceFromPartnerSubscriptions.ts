import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración para eliminar el campo creditBalance de la tabla partner_subscriptions
 *
 * El crédito ahora se calcula dinámicamente desde los pagos reales en lugar de
 * almacenarse en la base de datos. Esto evita problemas de inconsistencia cuando
 * el valor almacenado no se actualiza correctamente.
 *
 * El cálculo dinámico se realiza mediante CreditBalanceService que suma los montos
 * restantes de los pagos originales que no se han aplicado completamente.
 */
export class RemoveCreditBalanceFromPartnerSubscriptions1770300000000
  implements MigrationInterface
{
  name = 'RemoveCreditBalanceFromPartnerSubscriptions1770300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_subscriptions');

    if (table) {
      const creditBalanceColumn = table.findColumnByName('creditBalance');

      if (creditBalanceColumn) {
        // Eliminar el campo creditBalance
        await queryRunner.dropColumn('partner_subscriptions', 'creditBalance');

        console.log(
          '✅ Campo creditBalance eliminado de partner_subscriptions. ' +
          'El crédito ahora se calcula dinámicamente desde los pagos.',
        );
      } else {
        console.log(
          '⚠️ Campo creditBalance no encontrado en partner_subscriptions. ' +
          'Puede que ya haya sido eliminado.',
        );
      }
    } else {
      console.log('⚠️ Tabla partner_subscriptions no encontrada.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_subscriptions');

    if (table) {
      const creditBalanceColumn = table.findColumnByName('creditBalance');

      if (!creditBalanceColumn) {
        // Restaurar el campo creditBalance con valor por defecto 0
        await queryRunner.addColumn(
          'partner_subscriptions',
          new TableColumn({
            name: 'creditBalance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            isNullable: false,
          }),
        );

        console.log(
          '✅ Campo creditBalance restaurado en partner_subscriptions con valor por defecto 0.',
        );
      } else {
        console.log(
          '⚠️ Campo creditBalance ya existe en partner_subscriptions.',
        );
      }
    } else {
      console.log('⚠️ Tabla partner_subscriptions no encontrada.');
    }
  }
}

