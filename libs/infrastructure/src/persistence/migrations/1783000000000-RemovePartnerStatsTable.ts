import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

/**
 * Migración para eliminar la tabla partner_stats
 *
 * Esta tabla era redundante y estaba desincronizada con partner_subscription_usage.
 * Los datos ahora se obtienen directamente desde partner_subscription_usage que está
 * vinculado a la suscripción del partner.
 *
 * IMPORTANTE: Esta migración elimina la tabla y todos sus datos.
 * Los datos pueden regenerarse desde partner_subscription_usage si es necesario.
 */
export class RemovePartnerStatsTable1783000000000 implements MigrationInterface {
  name = 'RemovePartnerStatsTable1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('partner_stats');
    if (!table) {
      console.log('Table partner_stats does not exist. Skipping migration.');
      return;
    }

    // Obtener conteo antes de eliminar (para logging)
    const countResult = await queryRunner.query('SELECT COUNT(*) as count FROM partner_stats');
    const count = parseInt(countResult[0]?.count || '0', 10);
    console.log(`📊 Total registros en partner_stats antes de eliminar: ${count}`);

    if (count > 0) {
      console.log(
        `⚠️  ADVERTENCIA: Se eliminarán ${count} registros de partner_stats. ` +
          `Los datos pueden regenerarse desde partner_subscription_usage si es necesario.`,
      );
    }

    // Eliminar foreign keys primero (si existen)
    const foreignKeys = table.foreignKeys;
    for (const fk of foreignKeys) {
      try {
        await queryRunner.dropForeignKey('partner_stats', fk);
        console.log(`✅ Foreign key ${fk.name || 'unnamed'} eliminada`);
      } catch (error) {
        console.warn(`⚠️  Error al eliminar foreign key ${fk.name || 'unnamed'}:`, error);
      }
    }

    // Eliminar la tabla (esto eliminará automáticamente índices)
    await queryRunner.dropTable('partner_stats', true);

    console.log('✅ Tabla partner_stats eliminada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const table = await queryRunner.getTable('partner_stats');
    if (table) {
      console.log('Table partner_stats already exists. Skipping rollback.');
      return;
    }

    // Recrear la tabla partner_stats
    await queryRunner.createTable(
      new Table({
        name: 'partner_stats',
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
            isNullable: false,
            comment: 'FK a partners - ID del partner',
          },
          {
            name: 'tenantsCount',
            type: 'int',
            default: 0,
            comment: 'Número de tenants del partner',
          },
          {
            name: 'branchesCount',
            type: 'int',
            default: 0,
            comment: 'Número de branches del partner',
          },
          {
            name: 'customersCount',
            type: 'int',
            default: 0,
            comment: 'Número de customers del partner',
          },
          {
            name: 'rewardsCount',
            type: 'int',
            default: 0,
            comment: 'Número de rewards del partner',
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
      }),
      true,
    );

    // Recrear foreign key
    await queryRunner.createForeignKey(
      'partner_stats',
      new TableForeignKey({
        columnNames: ['partnerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'partners',
        onDelete: 'CASCADE',
        name: 'FK_partner_stats_partnerId',
      }),
    );

    console.log('✅ Tabla partner_stats recreada exitosamente');
    console.log(
      '⚠️  NOTA: Los datos no se restauran automáticamente. ' +
        'Los datos deben regenerarse desde partner_subscription_usage si es necesario.',
    );
  }
}
