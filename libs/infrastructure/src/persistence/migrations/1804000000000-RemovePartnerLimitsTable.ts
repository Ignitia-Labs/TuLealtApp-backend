import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Migración para eliminar la tabla partner_limits
 * Los límites ahora se obtienen desde pricing_plan_limits a través de la suscripción del partner
 */
export class RemovePartnerLimitsTable1804000000000 implements MigrationInterface {
  name = 'RemovePartnerLimitsTable1804000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Iniciando migración: Eliminar tabla partner_limits');

    // Verificar si la tabla existe
    const tableExists = await queryRunner.hasTable('partner_limits');
    if (!tableExists) {
      console.log('⚠️  La tabla partner_limits no existe. Saltando eliminación.');
      return;
    }

    // Obtener información de la tabla
    const table = await queryRunner.getTable('partner_limits');
    if (!table) {
      console.log('⚠️  No se pudo obtener información de la tabla partner_limits.');
      return;
    }

    // Eliminar foreign keys
    console.log('📋 Eliminando foreign keys...');
    const foreignKeys = table.foreignKeys;
    for (const fk of foreignKeys) {
      try {
        await queryRunner.dropForeignKey('partner_limits', fk);
        console.log(`  ✅ Foreign key eliminada: ${fk.name}`);
      } catch (error) {
        console.error(`  ❌ Error al eliminar foreign key ${fk.name}:`, error);
      }
    }

    // Eliminar índices
    console.log('📋 Eliminando índices...');
    const indices = table.indices || [];
    for (const index of indices) {
      try {
        await queryRunner.dropIndex('partner_limits', index);
        console.log(`  ✅ Índice eliminado: ${index.name}`);
      } catch (error) {
        console.error(`  ❌ Error al eliminar índice ${index.name}:`, error);
      }
    }

    // Eliminar tabla
    console.log('📋 Eliminando tabla partner_limits...');
    try {
      await queryRunner.dropTable('partner_limits');
      console.log('✅ Tabla partner_limits eliminada exitosamente.');
    } catch (error) {
      console.error('❌ Error al eliminar tabla partner_limits:', error);
      throw error;
    }

    console.log('✅ Migración completada: Tabla partner_limits eliminada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Iniciando rollback: Recrear tabla partner_limits');

    // Recrear tabla partner_limits
    await queryRunner.createTable(
      new Table({
        name: 'partner_limits',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'partnerId',
            type: 'int',
            isUnique: true,
          },
          {
            name: 'maxTenants',
            type: 'int',
            default: -1,
          },
          {
            name: 'maxBranches',
            type: 'int',
            default: -1,
          },
          {
            name: 'maxCustomers',
            type: 'int',
            default: -1,
          },
          {
            name: 'maxRewards',
            type: 'int',
            default: -1,
          },
          {
            name: 'maxAdmins',
            type: 'int',
            default: -1,
          },
          {
            name: 'storageGB',
            type: 'int',
            default: -1,
          },
          {
            name: 'apiCallsPerMonth',
            type: 'int',
            default: -1,
          },
          {
            name: 'maxLoyaltyPrograms',
            type: 'int',
            default: -1,
          },
          {
            name: 'maxLoyaltyProgramsBase',
            type: 'int',
            default: -1,
          },
          {
            name: 'maxLoyaltyProgramsPromo',
            type: 'int',
            default: -1,
          },
          {
            name: 'maxLoyaltyProgramsPartner',
            type: 'int',
            default: -1,
          },
          {
            name: 'maxLoyaltyProgramsSubscription',
            type: 'int',
            default: -1,
          },
          {
            name: 'maxLoyaltyProgramsExperimental',
            type: 'int',
            default: -1,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['partnerId'],
            referencedTableName: 'partners',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
        indices: [
          {
            name: 'IDX_PARTNER_LIMITS_PARTNER_ID',
            columnNames: ['partnerId'],
            isUnique: true,
          },
        ],
      }),
      true,
    );

    console.log('✅ Rollback completado: Tabla partner_limits recreada');
  }
}
