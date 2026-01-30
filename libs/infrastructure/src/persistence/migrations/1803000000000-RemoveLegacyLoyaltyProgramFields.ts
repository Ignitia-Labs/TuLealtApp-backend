import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración para eliminar campos legacy de loyalty programs
 * Elimina rewardType y allowedLoyaltyProgramTypes de partners y partner_requests
 * Elimina la tabla relacional partner_allowed_loyalty_program_types
 * Los límites ahora se manejan a través de PartnerLimits.maxLoyaltyPrograms*
 */
export class RemoveLegacyLoyaltyProgramFields1803000000000 implements MigrationInterface {
  name = 'RemoveLegacyLoyaltyProgramFields1803000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // ELIMINAR TABLA RELACIONAL
    // ============================================
    const tableExists = await queryRunner.hasTable('partner_allowed_loyalty_program_types');
    if (tableExists) {
      // Eliminar foreign keys primero
      const table = await queryRunner.getTable('partner_allowed_loyalty_program_types');
      if (table) {
        const foreignKeys = table.foreignKeys;
        for (const fk of foreignKeys) {
          await queryRunner.dropForeignKey('partner_allowed_loyalty_program_types', fk);
        }
      }

      // Eliminar índices
      const indexes = table?.indices || [];
      for (const index of indexes) {
        await queryRunner.dropIndex('partner_allowed_loyalty_program_types', index);
      }

      // Eliminar tabla
      await queryRunner.dropTable('partner_allowed_loyalty_program_types');
      console.log('✅ Table partner_allowed_loyalty_program_types dropped.');
    } else {
      console.log('Table partner_allowed_loyalty_program_types does not exist. Skipping.');
    }

    // ============================================
    // ELIMINAR COLUMNA rewardType DE partners
    // ============================================
    const partnersTable = await queryRunner.getTable('partners');
    if (partnersTable) {
      const rewardTypeColumn = partnersTable.findColumnByName('rewardType');
      if (rewardTypeColumn) {
        await queryRunner.dropColumn('partners', 'rewardType');
        console.log('✅ Column rewardType dropped from partners.');
      } else {
        console.log('Column rewardType does not exist in partners. Skipping.');
      }
    } else {
      console.warn('Table partners does not exist. Skipping.');
    }

    // ============================================
    // ELIMINAR COLUMNA rewardType DE partner_requests
    // ============================================
    const partnerRequestsTable = await queryRunner.getTable('partner_requests');
    if (partnerRequestsTable) {
      const rewardTypeColumn = partnerRequestsTable.findColumnByName('rewardType');
      if (rewardTypeColumn) {
        await queryRunner.dropColumn('partner_requests', 'rewardType');
        console.log('✅ Column rewardType dropped from partner_requests.');
      } else {
        console.log('Column rewardType does not exist in partner_requests. Skipping.');
      }
    } else {
      console.warn('Table partner_requests does not exist. Skipping.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // REVERTIR: AGREGAR COLUMNA rewardType A partner_requests
    // ============================================
    const partnerRequestsTable = await queryRunner.getTable('partner_requests');
    if (partnerRequestsTable) {
      const rewardTypeColumn = partnerRequestsTable.findColumnByName('rewardType');
      if (!rewardTypeColumn) {
        await queryRunner.addColumn(
          'partner_requests',
          new TableColumn({
            name: 'rewardType',
            type: 'varchar',
            length: '255',
            isNullable: false,
            default: "''",
            comment: 'Tipo de recompensa (legacy)',
          }),
        );
        console.log('✅ Column rewardType added back to partner_requests.');
      }
    }

    // ============================================
    // REVERTIR: AGREGAR COLUMNA rewardType A partners
    // ============================================
    const partnersTable = await queryRunner.getTable('partners');
    if (partnersTable) {
      const rewardTypeColumn = partnersTable.findColumnByName('rewardType');
      if (!rewardTypeColumn) {
        await queryRunner.addColumn(
          'partners',
          new TableColumn({
            name: 'rewardType',
            type: 'varchar',
            length: '255',
            isNullable: false,
            default: "''",
            comment: 'Tipo de recompensa (legacy)',
          }),
        );
        console.log('✅ Column rewardType added back to partners.');
      }
    }

    // ============================================
    // REVERTIR: RECREAR TABLA RELACIONAL
    // ============================================
    // Nota: La recreación completa de la tabla requiere el código de la migración original
    // Por simplicidad, solo indicamos que se debe restaurar manualmente si es necesario
    console.warn(
      '⚠️  Table partner_allowed_loyalty_program_types must be recreated manually if rollback is needed.',
    );
  }
}
