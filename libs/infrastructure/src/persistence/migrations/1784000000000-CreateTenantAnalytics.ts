import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * Migración para crear la tabla tenant_analytics
 *
 * Esta tabla almacena estadísticas pre-calculadas para el dashboard de cada tenant.
 * Las métricas se actualizan automáticamente mediante cron jobs y pueden refrescarse
 * manualmente bajo demanda.
 */
export class CreateTenantAnalytics1784000000000 implements MigrationInterface {
  name = 'CreateTenantAnalytics1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const table = await queryRunner.getTable('tenant_analytics');
    if (table) {
      console.log('Table tenant_analytics already exists. Skipping migration.');
      return;
    }

    // Crear la tabla tenant_analytics
    await queryRunner.createTable(
      new Table({
        name: 'tenant_analytics',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'tenantId',
            type: 'int',
            isNullable: false,
            comment: 'FK a tenants - ID del tenant',
          },
          // Métricas de Customers
          {
            name: 'totalCustomers',
            type: 'int',
            default: 0,
            comment: 'Total de customer memberships del tenant',
          },
          {
            name: 'activeCustomers',
            type: 'int',
            default: 0,
            comment: 'Total de customer memberships activas',
          },
          // Métricas de Puntos
          {
            name: 'totalPoints',
            type: 'bigint',
            default: 0,
            comment: 'Suma total de puntos de todas las memberships',
          },
          {
            name: 'pointsEarned',
            type: 'bigint',
            default: 0,
            comment: 'Total de puntos ganados (transacciones tipo earn)',
          },
          {
            name: 'pointsRedeemed',
            type: 'bigint',
            default: 0,
            comment: 'Total de puntos canjeados (transacciones tipo redeem)',
          },
          {
            name: 'avgPointsPerCustomer',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            comment: 'Promedio de puntos por customer',
          },
          // Métricas de Redemptions
          {
            name: 'totalRedemptions',
            type: 'int',
            default: 0,
            comment: 'Total de transacciones tipo redeem',
          },
          // Top Rewards (JSON array)
          {
            name: 'topRewards',
            type: 'json',
            default: "'[]'",
            comment:
              'Array JSON con top rewards: [{"rewardId": 1, "rewardName": "...", "redemptionsCount": 10, "pointsRequired": 100}]',
          },
          // Top Customers (JSON array)
          {
            name: 'topCustomers',
            type: 'json',
            default: "'[]'",
            comment:
              'Array JSON con top customers: [{"userId": 1, "membershipId": 1, "points": 5000, "totalRedemptions": 5}]',
          },
          // Recent Transactions (JSON array)
          {
            name: 'recentTransactions',
            type: 'json',
            default: "'[]'",
            comment:
              'Array JSON con transacciones recientes: [{"id": 1, "type": "earn", "points": 100, "description": "...", "createdAt": "..."}]',
          },
          // Metadata de actualización
          {
            name: 'lastCalculatedAt',
            type: 'datetime',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
            comment: 'Fecha y hora de la última actualización de analytics',
          },
          {
            name: 'calculationDurationMs',
            type: 'int',
            isNullable: true,
            comment: 'Duración del cálculo en milisegundos',
          },
          {
            name: 'version',
            type: 'int',
            default: 1,
            comment: 'Versión de la estructura de datos (para migraciones futuras)',
          },
          // Timestamps
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

    // Crear índice único en tenantId (un registro por tenant)
    await queryRunner.createIndex(
      'tenant_analytics',
      new TableIndex({
        name: 'UK_tenant_analytics_tenantId',
        columnNames: ['tenantId'],
        isUnique: true,
      }),
    );

    // Crear índice en lastCalculatedAt para queries de monitoreo
    await queryRunner.createIndex(
      'tenant_analytics',
      new TableIndex({
        name: 'IDX_tenant_analytics_lastCalculatedAt',
        columnNames: ['lastCalculatedAt'],
      }),
    );

    // Crear foreign key a tenants
    await queryRunner.createForeignKey(
      'tenant_analytics',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
        name: 'FK_tenant_analytics_tenant',
      }),
    );

    console.log('✅ Tabla tenant_analytics creada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('tenant_analytics');
    if (!table) {
      console.log('Table tenant_analytics does not exist. Skipping rollback.');
      return;
    }

    // Eliminar foreign keys primero
    const foreignKeys = table.foreignKeys;
    for (const fk of foreignKeys) {
      try {
        await queryRunner.dropForeignKey('tenant_analytics', fk);
        console.log(`✅ Foreign key ${fk.name || 'unnamed'} eliminada`);
      } catch (error) {
        console.warn(`⚠️  Error al eliminar foreign key ${fk.name || 'unnamed'}:`, error);
      }
    }

    // Eliminar índices
    const indexes = table.indices;
    for (const index of indexes) {
      try {
        await queryRunner.dropIndex('tenant_analytics', index);
        console.log(`✅ Índice ${index.name || 'unnamed'} eliminado`);
      } catch (error) {
        console.warn(`⚠️  Error al eliminar índice ${index.name || 'unnamed'}:`, error);
      }
    }

    // Eliminar la tabla
    await queryRunner.dropTable('tenant_analytics', true);

    console.log('✅ Tabla tenant_analytics eliminada exitosamente');
  }
}
