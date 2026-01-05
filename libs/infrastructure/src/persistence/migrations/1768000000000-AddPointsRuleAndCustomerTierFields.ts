import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración para agregar campos faltantes a Points Rules y Customer Tiers
 * - Points Rules: applicableHours, validFrom, validUntil
 * - Customer Tiers: icon
 */
export class AddPointsRuleAndCustomerTierFields1768000000000 implements MigrationInterface {
  name = 'AddPointsRuleAndCustomerTierFields1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // AGREGAR CAMPOS A POINTS_RULES
    // ============================================
    const pointsRulesTable = await queryRunner.getTable('points_rules');
    if (pointsRulesTable) {
      // Agregar applicableHours solo si no existe
      if (!pointsRulesTable.findColumnByName('applicableHours')) {
        await queryRunner.addColumn(
          'points_rules',
          new TableColumn({
            name: 'applicableHours',
            type: 'json',
            isNullable: true,
            comment: 'Horario aplicable: { start: "09:00", end: "18:00" }',
          }),
        );
      }

      // Agregar validFrom solo si no existe
      if (!pointsRulesTable.findColumnByName('validFrom')) {
        await queryRunner.addColumn(
          'points_rules',
          new TableColumn({
            name: 'validFrom',
            type: 'datetime',
            isNullable: true,
            comment: 'Fecha de inicio de validez de la regla',
          }),
        );
      }

      // Agregar validUntil solo si no existe
      if (!pointsRulesTable.findColumnByName('validUntil')) {
        await queryRunner.addColumn(
          'points_rules',
          new TableColumn({
            name: 'validUntil',
            type: 'datetime',
            isNullable: true,
            comment: 'Fecha de fin de validez de la regla',
          }),
        );
      }
    }

    // ============================================
    // AGREGAR CAMPOS A CUSTOMER_TIERS
    // ============================================
    const customerTiersTable = await queryRunner.getTable('customer_tiers');
    if (customerTiersTable) {
      // Agregar icon solo si no existe
      if (!customerTiersTable.findColumnByName('icon')) {
        await queryRunner.addColumn(
          'customer_tiers',
          new TableColumn({
            name: 'icon',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Nombre del icono o URL del icono del tier',
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir cambios en customer_tiers
    const customerTiersTable = await queryRunner.getTable('customer_tiers');
    if (customerTiersTable && customerTiersTable.findColumnByName('icon')) {
      await queryRunner.dropColumn('customer_tiers', 'icon');
    }

    // Revertir cambios en points_rules
    const pointsRulesTable = await queryRunner.getTable('points_rules');
    if (pointsRulesTable) {
      if (pointsRulesTable.findColumnByName('validUntil')) {
        await queryRunner.dropColumn('points_rules', 'validUntil');
      }
      if (pointsRulesTable.findColumnByName('validFrom')) {
        await queryRunner.dropColumn('points_rules', 'validFrom');
      }
      if (pointsRulesTable.findColumnByName('applicableHours')) {
        await queryRunner.dropColumn('points_rules', 'applicableHours');
      }
    }
  }
}
