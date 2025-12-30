import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
} from 'typeorm';

/**
 * Migración para hacer paymentId nullable en la tabla commissions
 *
 * Esta migración es parte de la Fase 3 del plan para asociar comisiones
 * directamente a billing cycles.
 *
 * Hace paymentId nullable para permitir comisiones asociadas solo a billing cycles
 * sin necesidad de un paymentId específico.
 *
 * NOTA: Las comisiones deben tener al menos paymentId o billingCycleId (validación a nivel de aplicación)
 */
export class MakePaymentIdNullableInCommissions1770520000000
  implements MigrationInterface
{
  name = 'MakePaymentIdNullableInCommissions1770520000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('commissions');

    if (!table) {
      console.log('⚠️ Tabla commissions no encontrada.');
      return;
    }

    const paymentIdColumn = table.findColumnByName('paymentId');
    if (!paymentIdColumn) {
      console.log('⚠️ Columna paymentId no encontrada en commissions.');
      return;
    }

    // Verificar si ya es nullable
    if (paymentIdColumn.isNullable) {
      console.log('⚠️ Columna paymentId ya es nullable en commissions.');
      return;
    }

    // Hacer paymentId nullable
    await queryRunner.changeColumn(
      'commissions',
      'paymentId',
      new TableColumn({
        name: 'paymentId',
        type: 'int',
        isNullable: true,
      }),
    );

    console.log('✅ Columna paymentId ahora es nullable en commissions.');

    // Verificar que no haya comisiones sin paymentId ni billingCycleId
    // (esto no debería pasar, pero verificamos por seguridad)
    const invalidCommissionsResult = await queryRunner.query(`
      SELECT COUNT(*) as total
      FROM commissions
      WHERE paymentId IS NULL AND billingCycleId IS NULL
    `);
    const invalidCommissions = invalidCommissionsResult[0]?.total || 0;

    if (invalidCommissions > 0) {
      console.log(
        `⚠️  ADVERTENCIA: ${invalidCommissions} comisiones no tienen ni paymentId ni billingCycleId. ` +
          `Estas comisiones son inválidas según la lógica de negocio.`,
      );
    } else {
      console.log('✅ Todas las comisiones tienen al menos paymentId o billingCycleId.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('commissions');

    if (!table) {
      console.log('⚠️ Tabla commissions no encontrada.');
      return;
    }

    const paymentIdColumn = table.findColumnByName('paymentId');
    if (!paymentIdColumn) {
      console.log('⚠️ Columna paymentId no encontrada en commissions.');
      return;
    }

    // Verificar si hay comisiones con paymentId NULL antes de hacerlo NOT NULL
    const nullPaymentIdsResult = await queryRunner.query(
      'SELECT COUNT(*) as total FROM commissions WHERE paymentId IS NULL',
    );
    const nullPaymentIds = nullPaymentIdsResult[0]?.total || 0;

    if (nullPaymentIds > 0) {
      console.log(
        `⚠️  ADVERTENCIA: ${nullPaymentIds} comisiones tienen paymentId NULL. ` +
          `No se puede hacer paymentId NOT NULL sin actualizar estas comisiones primero.`,
      );
      console.log(
        '💡 Estas comisiones deben tener billingCycleId. Considera actualizarlas antes de revertir.',
      );
      return;
    }

    // Hacer paymentId NOT NULL nuevamente
    await queryRunner.changeColumn(
      'commissions',
      'paymentId',
      new TableColumn({
        name: 'paymentId',
        type: 'int',
        isNullable: false,
      }),
    );

    console.log('✅ Columna paymentId ahora es NOT NULL en commissions.');
  }
}

