import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * Migración: Agregar columnas relacionales a customer_tiers
 *
 * Esta migración agrega nuevas tablas relacionadas para reemplazar
 * los campos JSON en customer_tiers. Los campos JSON se mantienen temporalmente
 * hasta que se migren los datos y se valide la integridad.
 *
 * Fase 4.3 del Plan de Eliminación de Tipos JSON
 */
export class AddRelationalColumnsToCustomerTiers1795000000000 implements MigrationInterface {
  name = 'AddRelationalColumnsToCustomerTiers1795000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================================
    // CREAR TABLA customer_tier_benefits (Many-to-Many entre customer_tiers y benefits)
    // ============================================================================
    const customerTierBenefitsTableExists = await queryRunner.hasTable('customer_tier_benefits');
    if (!customerTierBenefitsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'customer_tier_benefits',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
              comment: 'ID único del beneficio asignado al tier',
            },
            {
              name: 'tier_id',
              type: 'int',
              isNullable: false,
              comment: 'FK a customer_tiers',
            },
            {
              name: 'benefit',
              type: 'varchar',
              length: '255',
              isNullable: false,
              comment: 'Descripción del beneficio (ej: "Descuento 10%", "Envío gratis")',
            },
          ],
        }),
        true,
      );

      // Crear foreign key
      await queryRunner.createForeignKey(
        'customer_tier_benefits',
        new TableForeignKey({
          name: 'FK_CUSTOMER_TIER_BENEFITS_TIER_ID',
          columnNames: ['tier_id'],
          referencedTableName: 'customer_tiers',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      // Crear índices
      await queryRunner.createIndex(
        'customer_tier_benefits',
        new TableIndex({
          name: 'IDX_CUSTOMER_TIER_BENEFITS_TIER_ID',
          columnNames: ['tier_id'],
        }),
      );

      await queryRunner.createIndex(
        'customer_tier_benefits',
        new TableIndex({
          name: 'IDX_CUSTOMER_TIER_BENEFITS_BENEFIT',
          columnNames: ['benefit'],
        }),
      );

      // Crear unique constraint para (tier_id, benefit) para evitar duplicados
      await queryRunner.createIndex(
        'customer_tier_benefits',
        new TableIndex({
          name: 'UK_CUSTOMER_TIER_BENEFITS_TIER_BENEFIT',
          columnNames: ['tier_id', 'benefit'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tabla relacionada
    if (await queryRunner.hasTable('customer_tier_benefits')) {
      await queryRunner.dropTable('customer_tier_benefits');
    }
  }
}
