import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Migración para crear la tabla rewards (recompensas canjeables)
 * Esta tabla almacena el catálogo de recompensas que los clientes pueden canjear con puntos
 */
export class CreateRewardsTable1770003669650 implements MigrationInterface {
  name = 'CreateRewardsTable1770003669650';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe (idempotente)
    const rewardsTable = await queryRunner.getTable('rewards');
    if (rewardsTable) {
      console.log('Table rewards already exists. Skipping creation.');
      return;
    }

    // Crear tabla rewards
    await queryRunner.createTable(
      new Table({
        name: 'rewards',
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
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'image',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'pointsRequired',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'stock',
            type: 'int',
            isNullable: false,
            default: 0,
          },
          {
            name: 'maxRedemptionsPerUser',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'terms',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'validUntil',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Crear foreign key hacia tenants
    await queryRunner.createForeignKey(
      'rewards',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_rewards_tenantId',
      }),
    );

    // Crear índices
    await queryRunner.createIndex(
      'rewards',
      new TableIndex({
        name: 'IDX_rewards_tenantId',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'rewards',
      new TableIndex({
        name: 'IDX_rewards_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'rewards',
      new TableIndex({
        name: 'IDX_rewards_category',
        columnNames: ['category'],
      }),
    );

    console.log('✅ Tabla rewards creada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices primero
    const rewardsTable = await queryRunner.getTable('rewards');
    if (rewardsTable) {
      // Eliminar foreign keys
      const foreignKeys = rewardsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('rewards', fk);
      }

      // Eliminar la tabla
      await queryRunner.dropTable('rewards', true);
      console.log('✅ Tabla rewards eliminada exitosamente');
    }
  }
}
