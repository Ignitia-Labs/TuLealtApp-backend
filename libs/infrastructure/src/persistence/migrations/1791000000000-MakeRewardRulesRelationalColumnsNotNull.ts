import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración: Hacer columnas relacionales NOT NULL en reward_rules
 *
 * Esta migración hace que las columnas relacionales sean NOT NULL después de
 * haber migrado y validado los datos. Solo debe ejecutarse DESPUÉS de:
 * 1. Ejecutar la migración de datos (migrate-reward-rules-json-to-relational.sql)
 * 2. Validar que todos los datos se migraron correctamente
 * 3. Verificar que no hay valores NULL en campos requeridos
 *
 * Fase 2.5.1 del Plan de Eliminación de Tipos JSON
 */
export class MakeRewardRulesRelationalColumnsNotNull1791000000000 implements MigrationInterface {
  name = 'MakeRewardRulesRelationalColumnsNotNull1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rewardRulesTable = await queryRunner.getTable('reward_rules');

    if (!rewardRulesTable) {
      throw new Error('Tabla reward_rules no existe');
    }

    // ============================================================================
    // VALIDACIÓN PREVIA: Verificar que no hay valores NULL en campos requeridos
    // ============================================================================

    const nullScopeTenantId = await queryRunner.query(
      `SELECT COUNT(*) as count FROM reward_rules WHERE scope_tenant_id IS NULL OR scope_tenant_id = 0`
    );

    if (nullScopeTenantId[0].count > 0) {
      throw new Error(
        `No se puede hacer NOT NULL: Hay ${nullScopeTenantId[0].count} registros con scope_tenant_id NULL o 0. ` +
        `Ejecutar primero el script de migración de datos.`
      );
    }

    const nullScopeProgramId = await queryRunner.query(
      `SELECT COUNT(*) as count FROM reward_rules WHERE scope_program_id IS NULL OR scope_program_id = 0`
    );

    if (nullScopeProgramId[0].count > 0) {
      throw new Error(
        `No se puede hacer NOT NULL: Hay ${nullScopeProgramId[0].count} registros con scope_program_id NULL o 0. ` +
        `Ejecutar primero el script de migración de datos.`
      );
    }

    // ============================================================================
    // HACER COLUMNAS NOT NULL
    // ============================================================================

    // Columnas de scope (requeridas)
    await queryRunner.changeColumn(
      'reward_rules',
      'scope_tenant_id',
      new TableColumn({
        name: 'scope_tenant_id',
        type: 'int',
        isNullable: false,
        comment: 'Tenant ID del alcance (extraído de scope JSON)',
      }),
    );

    await queryRunner.changeColumn(
      'reward_rules',
      'scope_program_id',
      new TableColumn({
        name: 'scope_program_id',
        type: 'int',
        isNullable: false,
        comment: 'Program ID del alcance (extraído de scope JSON)',
      }),
    );

    // Columnas de conflict (requeridas)
    await queryRunner.changeColumn(
      'reward_rules',
      'conflict_stack_policy',
      new TableColumn({
        name: 'conflict_stack_policy',
        type: 'varchar',
        length: '20',
        isNullable: false,
        default: "'EXCLUSIVE'",
        comment: 'Política de stacking de conflictos (extraído de conflict JSON)',
      }),
    );

    await queryRunner.changeColumn(
      'reward_rules',
      'conflict_priority_rank',
      new TableColumn({
        name: 'conflict_priority_rank',
        type: 'int',
        isNullable: false,
        default: 0,
        comment: 'Rank de prioridad para resolución de conflictos (extraído de conflict JSON)',
      }),
    );

    // Columnas de idempotencyScope (requeridas)
    await queryRunner.changeColumn(
      'reward_rules',
      'idempotency_strategy',
      new TableColumn({
        name: 'idempotency_strategy',
        type: 'varchar',
        length: '20',
        isNullable: false,
        default: "'default'",
        comment: 'Estrategia de idempotencia (extraído de idempotencyScope JSON)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir columnas a nullable
    const rewardRulesTable = await queryRunner.getTable('reward_rules');

    if (!rewardRulesTable) {
      return;
    }

    // Revertir scope_tenant_id a nullable
    await queryRunner.changeColumn(
      'reward_rules',
      'scope_tenant_id',
      new TableColumn({
        name: 'scope_tenant_id',
        type: 'int',
        isNullable: true,
        comment: 'Tenant ID del alcance (extraído de scope JSON)',
      }),
    );

    await queryRunner.changeColumn(
      'reward_rules',
      'scope_program_id',
      new TableColumn({
        name: 'scope_program_id',
        type: 'int',
        isNullable: true,
        comment: 'Program ID del alcance (extraído de scope JSON)',
      }),
    );

    await queryRunner.changeColumn(
      'reward_rules',
      'conflict_stack_policy',
      new TableColumn({
        name: 'conflict_stack_policy',
        type: 'varchar',
        length: '20',
        isNullable: true,
        comment: 'Política de stacking de conflictos (extraído de conflict JSON)',
      }),
    );

    await queryRunner.changeColumn(
      'reward_rules',
      'conflict_priority_rank',
      new TableColumn({
        name: 'conflict_priority_rank',
        type: 'int',
        isNullable: true,
        comment: 'Rank de prioridad para resolución de conflictos (extraído de conflict JSON)',
      }),
    );

    await queryRunner.changeColumn(
      'reward_rules',
      'idempotency_strategy',
      new TableColumn({
        name: 'idempotency_strategy',
        type: 'varchar',
        length: '20',
        isNullable: true,
        comment: 'Estrategia de idempotencia (extraído de idempotencyScope JSON)',
      }),
    );
  }
}
