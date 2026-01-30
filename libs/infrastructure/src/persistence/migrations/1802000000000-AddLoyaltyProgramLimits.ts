import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración para agregar campos de límites de loyalty programs a pricing_plan_limits y partner_limits
 * Estos campos permiten limitar el número total de loyalty programs y por tipo específico
 * Valores por defecto: -1 (ilimitado) para registros existentes
 */
export class AddLoyaltyProgramLimits1802000000000 implements MigrationInterface {
  name = 'AddLoyaltyProgramLimits1802000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // AGREGAR CAMPOS A pricing_plan_limits
    // ============================================
    const pricingPlanLimitsTable = await queryRunner.getTable('pricing_plan_limits');
    if (pricingPlanLimitsTable) {
      const columnsToAdd = [
        { name: 'maxLoyaltyPrograms', comment: 'Número máximo total de loyalty programs permitidos. -1 para ilimitado.' },
        { name: 'maxLoyaltyProgramsBase', comment: 'Número máximo de loyalty programs tipo BASE permitidos. -1 para ilimitado.' },
        { name: 'maxLoyaltyProgramsPromo', comment: 'Número máximo de loyalty programs tipo PROMO permitidos. -1 para ilimitado.' },
        { name: 'maxLoyaltyProgramsPartner', comment: 'Número máximo de loyalty programs tipo PARTNER permitidos. -1 para ilimitado.' },
        { name: 'maxLoyaltyProgramsSubscription', comment: 'Número máximo de loyalty programs tipo SUBSCRIPTION permitidos. -1 para ilimitado.' },
        { name: 'maxLoyaltyProgramsExperimental', comment: 'Número máximo de loyalty programs tipo EXPERIMENTAL permitidos. -1 para ilimitado.' },
      ];

      for (const column of columnsToAdd) {
        const existingColumn = pricingPlanLimitsTable.findColumnByName(column.name);
        if (!existingColumn) {
          await queryRunner.addColumn(
            'pricing_plan_limits',
            new TableColumn({
              name: column.name,
              type: 'int',
              isNullable: false,
              default: -1,
              comment: column.comment,
            }),
          );
          console.log(`✅ Column ${column.name} added to pricing_plan_limits.`);
        } else {
          console.log(`Column ${column.name} already exists in pricing_plan_limits. Skipping.`);
        }
      }

      // Actualizar registros existentes con valores por defecto
      await queryRunner.query(`
        UPDATE pricing_plan_limits
        SET maxLoyaltyPrograms = COALESCE(maxLoyaltyPrograms, -1),
            maxLoyaltyProgramsBase = COALESCE(maxLoyaltyProgramsBase, -1),
            maxLoyaltyProgramsPromo = COALESCE(maxLoyaltyProgramsPromo, -1),
            maxLoyaltyProgramsPartner = COALESCE(maxLoyaltyProgramsPartner, -1),
            maxLoyaltyProgramsSubscription = COALESCE(maxLoyaltyProgramsSubscription, -1),
            maxLoyaltyProgramsExperimental = COALESCE(maxLoyaltyProgramsExperimental, -1)
        WHERE maxLoyaltyPrograms IS NULL
           OR maxLoyaltyProgramsBase IS NULL
           OR maxLoyaltyProgramsPromo IS NULL
           OR maxLoyaltyProgramsPartner IS NULL
           OR maxLoyaltyProgramsSubscription IS NULL
           OR maxLoyaltyProgramsExperimental IS NULL
      `);
    } else {
      console.warn('Table pricing_plan_limits does not exist. Skipping migration.');
    }

    // ============================================
    // AGREGAR CAMPOS A partner_limits
    // ============================================
    const partnerLimitsTable = await queryRunner.getTable('partner_limits');
    if (partnerLimitsTable) {
      const columnsToAdd = [
        { name: 'maxLoyaltyPrograms', comment: 'Número máximo total de loyalty programs permitidos. -1 para ilimitado.' },
        { name: 'maxLoyaltyProgramsBase', comment: 'Número máximo de loyalty programs tipo BASE permitidos. -1 para ilimitado.' },
        { name: 'maxLoyaltyProgramsPromo', comment: 'Número máximo de loyalty programs tipo PROMO permitidos. -1 para ilimitado.' },
        { name: 'maxLoyaltyProgramsPartner', comment: 'Número máximo de loyalty programs tipo PARTNER permitidos. -1 para ilimitado.' },
        { name: 'maxLoyaltyProgramsSubscription', comment: 'Número máximo de loyalty programs tipo SUBSCRIPTION permitidos. -1 para ilimitado.' },
        { name: 'maxLoyaltyProgramsExperimental', comment: 'Número máximo de loyalty programs tipo EXPERIMENTAL permitidos. -1 para ilimitado.' },
      ];

      for (const column of columnsToAdd) {
        const existingColumn = partnerLimitsTable.findColumnByName(column.name);
        if (!existingColumn) {
          await queryRunner.addColumn(
            'partner_limits',
            new TableColumn({
              name: column.name,
              type: 'int',
              isNullable: false,
              default: -1,
              comment: column.comment,
            }),
          );
          console.log(`✅ Column ${column.name} added to partner_limits.`);
        } else {
          console.log(`Column ${column.name} already exists in partner_limits. Skipping.`);
        }
      }

      // Actualizar registros existentes con valores por defecto
      await queryRunner.query(`
        UPDATE partner_limits
        SET maxLoyaltyPrograms = COALESCE(maxLoyaltyPrograms, -1),
            maxLoyaltyProgramsBase = COALESCE(maxLoyaltyProgramsBase, -1),
            maxLoyaltyProgramsPromo = COALESCE(maxLoyaltyProgramsPromo, -1),
            maxLoyaltyProgramsPartner = COALESCE(maxLoyaltyProgramsPartner, -1),
            maxLoyaltyProgramsSubscription = COALESCE(maxLoyaltyProgramsSubscription, -1),
            maxLoyaltyProgramsExperimental = COALESCE(maxLoyaltyProgramsExperimental, -1)
        WHERE maxLoyaltyPrograms IS NULL
           OR maxLoyaltyProgramsBase IS NULL
           OR maxLoyaltyProgramsPromo IS NULL
           OR maxLoyaltyProgramsPartner IS NULL
           OR maxLoyaltyProgramsSubscription IS NULL
           OR maxLoyaltyProgramsExperimental IS NULL
      `);
    } else {
      console.warn('Table partner_limits does not exist. Skipping migration.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // ELIMINAR CAMPOS DE partner_limits
    // ============================================
    const partnerLimitsTable = await queryRunner.getTable('partner_limits');
    if (partnerLimitsTable) {
      const columnsToRemove = [
        'maxLoyaltyProgramsExperimental',
        'maxLoyaltyProgramsSubscription',
        'maxLoyaltyProgramsPartner',
        'maxLoyaltyProgramsPromo',
        'maxLoyaltyProgramsBase',
        'maxLoyaltyPrograms',
      ];

      for (const columnName of columnsToRemove) {
        const existingColumn = partnerLimitsTable.findColumnByName(columnName);
        if (existingColumn) {
          await queryRunner.dropColumn('partner_limits', columnName);
          console.log(`✅ Column ${columnName} dropped from partner_limits.`);
        } else {
          console.warn(`Column ${columnName} does not exist. Skipping rollback.`);
        }
      }
    } else {
      console.warn('Table partner_limits does not exist. Skipping rollback.');
    }

    // ============================================
    // ELIMINAR CAMPOS DE pricing_plan_limits
    // ============================================
    const pricingPlanLimitsTable = await queryRunner.getTable('pricing_plan_limits');
    if (pricingPlanLimitsTable) {
      const columnsToRemove = [
        'maxLoyaltyProgramsExperimental',
        'maxLoyaltyProgramsSubscription',
        'maxLoyaltyProgramsPartner',
        'maxLoyaltyProgramsPromo',
        'maxLoyaltyProgramsBase',
        'maxLoyaltyPrograms',
      ];

      for (const columnName of columnsToRemove) {
        const existingColumn = pricingPlanLimitsTable.findColumnByName(columnName);
        if (existingColumn) {
          await queryRunner.dropColumn('pricing_plan_limits', columnName);
          console.log(`✅ Column ${columnName} dropped from pricing_plan_limits.`);
        } else {
          console.warn(`Column ${columnName} does not exist. Skipping rollback.`);
        }
      }
    } else {
      console.warn('Table pricing_plan_limits does not exist. Skipping rollback.');
    }
  }
}
