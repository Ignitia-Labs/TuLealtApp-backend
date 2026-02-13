import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración para agregar columna redemptionCodeTtlMinutes a tenants
 * Esta columna almacena el TTL (Time To Live) en minutos para códigos de canje
 * generados cuando un cliente canjea una recompensa.
 * 
 * Valor por defecto: 15 minutos
 * Mínimo permitido: 15 minutos
 */
export class AddRedemptionCodeTtlToTenants1812000000000 implements MigrationInterface {
  name = 'AddRedemptionCodeTtlToTenants1812000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la columna ya existe (idempotente)
    const table = await queryRunner.getTable('tenants');
    const column = table?.findColumnByName('redemptionCodeTtlMinutes');

    if (column) {
      console.log('⚠️  Column redemptionCodeTtlMinutes already exists in tenants. Skipping creation.');
      return;
    }

    await queryRunner.addColumn(
      'tenants',
      new TableColumn({
        name: 'redemptionCodeTtlMinutes',
        type: 'int',
        default: 15, // 15 minutos por defecto
        isNullable: false,
        comment: 'TTL en minutos para códigos de canje (default: 15 minutos, mínimo: 15 minutos)',
      }),
    );

    console.log('✅ Columna redemptionCodeTtlMinutes agregada a tenants con default 15 minutos');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('tenants', 'redemptionCodeTtlMinutes');
    console.log('✅ Columna redemptionCodeTtlMinutes eliminada de tenants');
  }
}
