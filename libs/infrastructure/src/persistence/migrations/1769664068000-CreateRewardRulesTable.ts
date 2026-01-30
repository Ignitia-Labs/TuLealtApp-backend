import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRewardRulesTable1769664068000 implements MigrationInterface {
  name = 'CreateRewardRulesTable1769664068000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const table = await queryRunner.getTable('reward_rules');
    if (table) {
      return; // La tabla ya existe, no hacer nada
    }

    // Crear tabla reward_rules
    await queryRunner.createTable(
      new Table({
        name: 'reward_rules',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'ID único de la regla de recompensa',
          },
          {
            name: 'programId',
            type: 'int',
            isNullable: false,
            comment: 'FK a loyalty_programs - ID del programa de lealtad',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Nombre de la regla',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Descripción de la regla',
          },
          {
            name: 'trigger',
            type: 'varchar',
            length: '20',
            isNullable: false,
            comment:
              'Tipo de evento que activa la regla: VISIT, PURCHASE, REFERRAL, SUBSCRIPTION, RETENTION, CUSTOM',
          },
          {
            name: 'scope',
            type: 'json',
            isNullable: false,
            comment:
              'Alcance de la regla: tenantId, programId, storeId, branchId, channel, categoryId, sku',
          },
          {
            name: 'eligibility',
            type: 'json',
            isNullable: false,
            comment:
              'Condiciones de elegibilidad: tier, membership status, amount, items, fecha/hora, metadata',
          },
          {
            name: 'pointsFormula',
            type: 'json',
            isNullable: false,
            comment: 'Fórmula de cálculo de puntos: fixed, rate, table, hybrid',
          },
          {
            name: 'limits',
            type: 'json',
            isNullable: true,
            comment: 'Límites de la regla: frequency, cooldown, perEventCap, perPeriodCap',
          },
          {
            name: 'conflict',
            type: 'json',
            isNullable: false,
            comment:
              'Configuración de conflictos: conflictGroup, stackPolicy, priorityRank, maxAwardsPerEvent',
          },
          {
            name: 'idempotencyScope',
            type: 'json',
            isNullable: false,
            comment:
              'Estrategia de idempotencia: strategy (default/per-day/per-period/per-event), bucketTimezone, periodDays',
          },
          {
            name: 'earningDomain',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment:
              'Dominio de earning (debe ser del catálogo central): BASE_PURCHASE, BONUS_CATEGORY, etc.',
          },
          {
            name: 'conflictGroup',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment:
              'Grupo de conflicto (extraído de conflict.conflictGroup para índices): CG_PURCHASE_BASE, etc.',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'draft'",
            comment: 'Estado de la regla: active, inactive, draft',
          },
          {
            name: 'version',
            type: 'int',
            default: 1,
            comment: 'Versión de la regla (para inmutabilidad histórica)',
          },
          {
            name: 'activeFrom',
            type: 'datetime',
            isNullable: true,
            comment: 'Fecha desde la cual la regla está activa',
          },
          {
            name: 'activeTo',
            type: 'datetime',
            isNullable: true,
            comment: 'Fecha hasta la cual la regla está activa',
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Fecha de creación de la regla',
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
      'reward_rules',
      new TableIndex({
        name: 'IDX_REWARD_RULES_PROGRAM_ID',
        columnNames: ['programId'],
      }),
    );

    await queryRunner.createIndex(
      'reward_rules',
      new TableIndex({
        name: 'IDX_REWARD_RULES_TRIGGER',
        columnNames: ['trigger'],
      }),
    );

    await queryRunner.createIndex(
      'reward_rules',
      new TableIndex({
        name: 'IDX_REWARD_RULES_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'reward_rules',
      new TableIndex({
        name: 'IDX_REWARD_RULES_EARNING_DOMAIN',
        columnNames: ['earningDomain'],
      }),
    );

    await queryRunner.createIndex(
      'reward_rules',
      new TableIndex({
        name: 'IDX_REWARD_RULES_CONFLICT_GROUP',
        columnNames: ['conflictGroup'],
      }),
    );

    await queryRunner.createIndex(
      'reward_rules',
      new TableIndex({
        name: 'IDX_REWARD_RULES_PROGRAM_TRIGGER_STATUS',
        columnNames: ['programId', 'trigger', 'status'],
      }),
    );

    // Crear foreign keys
    const rewardRulesTable = await queryRunner.getTable('reward_rules');
    if (rewardRulesTable) {
      // FK: programId -> loyalty_programs.id (CASCADE delete)
      const hasProgramIdFk = rewardRulesTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('programId') !== -1,
      );
      if (!hasProgramIdFk) {
        await queryRunner.createForeignKey(
          'reward_rules',
          new TableForeignKey({
            name: 'FK_REWARD_RULES_PROGRAM_ID',
            columnNames: ['programId'],
            referencedTableName: 'loyalty_programs',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys primero
    const rewardRulesTable = await queryRunner.getTable('reward_rules');
    if (rewardRulesTable) {
      const foreignKeys = rewardRulesTable.foreignKeys || [];
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('reward_rules', fk);
      }
    }

    // Eliminar índices
    const indices = rewardRulesTable?.indices || [];
    for (const index of indices) {
      await queryRunner.dropIndex('reward_rules', index);
    }

    // Eliminar tabla
    await queryRunner.dropTable('reward_rules');
  }
}
