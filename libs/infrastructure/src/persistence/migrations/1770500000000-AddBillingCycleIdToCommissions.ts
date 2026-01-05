import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Migración para agregar el campo billingCycleId a la tabla commissions
 *
 * Esta migración es parte de la Fase 1 del plan para asociar comisiones
 * directamente a billing cycles en lugar de solo a pagos individuales.
 *
 * La columna es nullable para mantener compatibilidad con datos existentes
 * y permitir comisiones de pagos sin billing cycle asociado.
 *
 * FASE 1: Agregar campo opcional sin romper funcionalidad existente
 */
export class AddBillingCycleIdToCommissions1770500000000 implements MigrationInterface {
  name = 'AddBillingCycleIdToCommissions1770500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('commissions');

    if (!table) {
      console.log('⚠️ Tabla commissions no encontrada.');
      return;
    }

    // Verificar si billingCycleId ya existe
    const billingCycleIdColumn = table.findColumnByName('billingCycleId');
    if (!billingCycleIdColumn) {
      // Agregar la columna billingCycleId como nullable
      await queryRunner.addColumn(
        'commissions',
        new TableColumn({
          name: 'billingCycleId',
          type: 'int',
          isNullable: true,
        }),
      );

      console.log('✅ Columna billingCycleId agregada a commissions.');

      // Crear índice para mejorar búsquedas por billingCycleId
      await queryRunner.createIndex(
        'commissions',
        new TableIndex({
          name: 'idx_commissions_billingCycleId',
          columnNames: ['billingCycleId'],
        }),
      );

      console.log('✅ Índice idx_commissions_billingCycleId creado.');

      // Crear foreign key hacia billing_cycles
      const billingCyclesTable = await queryRunner.getTable('billing_cycles');
      if (billingCyclesTable) {
        // Verificar si la foreign key ya existe
        const existingFK = table.foreignKeys.find(
          (fk) => fk.columnNames.indexOf('billingCycleId') !== -1,
        );

        if (!existingFK) {
          await queryRunner.createForeignKey(
            'commissions',
            new TableForeignKey({
              columnNames: ['billingCycleId'],
              referencedColumnNames: ['id'],
              referencedTableName: 'billing_cycles',
              onDelete: 'SET NULL', // Si se elimina el billing cycle, mantener la comisión pero sin referencia
              onUpdate: 'CASCADE',
              name: 'FK_commissions_billingCycleId',
            }),
          );

          console.log('✅ Foreign key FK_commissions_billingCycleId creada.');
        } else {
          console.log('⚠️ Foreign key FK_commissions_billingCycleId ya existe.');
        }
      } else {
        console.log('⚠️ Tabla billing_cycles no encontrada. No se puede crear la foreign key.');
      }
    } else {
      console.log('⚠️ Columna billingCycleId ya existe en commissions.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('commissions');

    if (!table) {
      console.log('⚠️ Tabla commissions no encontrada.');
      return;
    }

    // Eliminar la foreign key si existe
    const existingFK = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('billingCycleId') !== -1,
    );

    if (existingFK) {
      await queryRunner.dropForeignKey('commissions', existingFK);
      console.log('✅ Foreign key FK_commissions_billingCycleId eliminada.');
    }

    // Eliminar el índice si existe
    const index = table.indices.find((idx) => idx.name === 'idx_commissions_billingCycleId');

    if (index) {
      await queryRunner.dropIndex('commissions', 'idx_commissions_billingCycleId');
      console.log('✅ Índice idx_commissions_billingCycleId eliminado.');
    }

    // Eliminar la columna billingCycleId si existe
    const billingCycleIdColumn = table.findColumnByName('billingCycleId');
    if (billingCycleIdColumn) {
      await queryRunner.dropColumn('commissions', 'billingCycleId');
      console.log('✅ Columna billingCycleId eliminada de commissions.');
    } else {
      console.log('⚠️ Columna billingCycleId no encontrada en commissions.');
    }
  }
}
