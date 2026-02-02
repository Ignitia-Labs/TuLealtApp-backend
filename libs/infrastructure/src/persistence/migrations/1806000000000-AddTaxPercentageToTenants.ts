import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración para agregar campo taxPercentage a la tabla tenants
 * Este campo permite especificar el porcentaje de impuestos aplicable al tenant
 */
export class AddTaxPercentageToTenants1806000000000 implements MigrationInterface {
  name = 'AddTaxPercentageToTenants1806000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Iniciando migración: Agregar campo taxPercentage a tenants');

    const table = await queryRunner.getTable('tenants');
    if (!table) {
      console.warn('⚠️  La tabla tenants no existe. Saltando migración.');
      return;
    }

    // Agregar columna taxPercentage
    const hasTaxPercentage = table.findColumnByName('taxPercentage');
    if (!hasTaxPercentage) {
      await queryRunner.addColumn(
        'tenants',
        new TableColumn({
          name: 'taxPercentage',
          type: 'decimal',
          precision: 5,
          scale: 2,
          default: 0,
          comment: 'Porcentaje de impuestos aplicable al tenant (ej: 12.50 para 12.5%)',
        }),
      );
      console.log('✅ Columna taxPercentage agregada.');

      // Inicializar valores existentes en 0 (ya están en default: 0, pero por seguridad)
      await queryRunner.query(`
        UPDATE tenants
        SET taxPercentage = COALESCE(taxPercentage, 0)
        WHERE taxPercentage IS NULL
      `);
      console.log('✅ Valores existentes inicializados en 0.');
    } else {
      console.log('ℹ️  Columna taxPercentage ya existe. Saltando.');
    }

    console.log('✅ Migración completada: Campo taxPercentage agregado a tenants');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Iniciando rollback: Eliminar campo taxPercentage de tenants');

    const table = await queryRunner.getTable('tenants');
    if (!table) {
      console.warn('⚠️  La tabla tenants no existe. Saltando rollback.');
      return;
    }

    const column = table.findColumnByName('taxPercentage');
    if (column) {
      await queryRunner.dropColumn('tenants', 'taxPercentage');
      console.log('✅ Columna taxPercentage eliminada.');
    } else {
      console.log('ℹ️  Columna taxPercentage no existe. Saltando.');
    }

    console.log('✅ Rollback completado: Campo taxPercentage eliminado de tenants');
  }
}
