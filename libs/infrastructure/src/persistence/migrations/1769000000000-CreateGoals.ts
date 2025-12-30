import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateGoals1769000000000 implements MigrationInterface {
  name = 'CreateGoals1769000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const table = await queryRunner.getTable('goals');
    if (table) {
      return; // La tabla ya existe, no hacer nada
    }

    // Crear tabla goals
    await queryRunner.createTable(
      new Table({
        name: 'goals',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Nombre de la meta',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Descripción de la meta',
          },
          {
            name: 'metric',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Métrica a medir: mrr, arr, activeSubscriptions, churnRate, retentionRate, newSubscriptions, upgrades',
          },
          {
            name: 'targetValue',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
            comment: 'Valor objetivo de la meta',
          },
          {
            name: 'periodStart',
            type: 'datetime',
            isNullable: false,
            comment: 'Fecha de inicio del período de la meta',
          },
          {
            name: 'periodEnd',
            type: 'datetime',
            isNullable: false,
            comment: 'Fecha de fin del período de la meta',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            comment: 'Indica si la meta está activa',
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Fecha de creación',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            comment: 'Fecha de última actualización',
          },
        ],
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex(
      'goals',
      new TableIndex({
        name: 'idx_metric',
        columnNames: ['metric'],
      }),
    );

    await queryRunner.createIndex(
      'goals',
      new TableIndex({
        name: 'idx_period',
        columnNames: ['periodStart', 'periodEnd'],
      }),
    );

    await queryRunner.createIndex(
      'goals',
      new TableIndex({
        name: 'idx_active',
        columnNames: ['isActive'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('goals');
    if (!table) {
      return; // La tabla no existe, no hacer nada
    }

    // Eliminar índices
    const metricIndex = table.indices.find((idx) => idx.name === 'idx_metric');
    if (metricIndex) {
      await queryRunner.dropIndex('goals', metricIndex);
    }

    const periodIndex = table.indices.find((idx) => idx.name === 'idx_period');
    if (periodIndex) {
      await queryRunner.dropIndex('goals', periodIndex);
    }

    const activeIndex = table.indices.find((idx) => idx.name === 'idx_active');
    if (activeIndex) {
      await queryRunner.dropIndex('goals', activeIndex);
    }

    // Eliminar tabla
    await queryRunner.dropTable('goals', true);
  }
}

