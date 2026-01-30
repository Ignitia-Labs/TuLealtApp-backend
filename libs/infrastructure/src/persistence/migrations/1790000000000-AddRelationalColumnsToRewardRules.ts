import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Migración: Agregar columnas relacionales a reward_rules
 *
 * Esta migración agrega nuevas columnas y tablas relacionadas para reemplazar
 * los campos JSON en reward_rules. Las columnas JSON se mantienen temporalmente
 * hasta que se migren los datos y se valide la integridad.
 *
 * Fase 2.1 del Plan de Eliminación de Tipos JSON
 */
export class AddRelationalColumnsToRewardRules1790000000000 implements MigrationInterface {
  name = 'AddRelationalColumnsToRewardRules1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================================
    // 1. AGREGAR COLUMNAS PARA scope (JSON → Columnas directas)
    // ============================================================================
    const rewardRulesTable = await queryRunner.getTable('reward_rules');

    if (rewardRulesTable) {
      // Verificar si las columnas ya existen antes de agregarlas
      const hasScopeTenantId = rewardRulesTable.findColumnByName('scope_tenant_id');
      if (!hasScopeTenantId) {
        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'scope_tenant_id',
            type: 'int',
            isNullable: false,
            default: 0, // Temporal, se actualizará con datos reales en migración de datos
            comment: 'Tenant ID del alcance (extraído de scope JSON)',
          }),
        );

        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'scope_program_id',
            type: 'int',
            isNullable: false,
            default: 0, // Temporal, se actualizará con datos reales
            comment: 'Program ID del alcance (extraído de scope JSON)',
          }),
        );

        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'scope_store_id',
            type: 'int',
            isNullable: true,
            comment: 'Store ID del alcance (extraído de scope JSON)',
          }),
        );

        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'scope_branch_id',
            type: 'int',
            isNullable: true,
            comment: 'Branch ID del alcance (extraído de scope JSON)',
          }),
        );

        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'scope_channel',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Channel del alcance (extraído de scope JSON)',
          }),
        );

        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'scope_category_id',
            type: 'int',
            isNullable: true,
            comment: 'Category ID del alcance (extraído de scope JSON)',
          }),
        );

        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'scope_sku',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'SKU del alcance (extraído de scope JSON)',
          }),
        );
      }

      // ============================================================================
      // 2. AGREGAR COLUMNAS PARA conflict (JSON → Columnas directas)
      // ============================================================================
      const hasConflictStackPolicy = rewardRulesTable.findColumnByName('conflict_stack_policy');
      if (!hasConflictStackPolicy) {
        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'conflict_stack_policy',
            type: 'varchar',
            length: '20',
            isNullable: false,
            default: "'EXCLUSIVE'",
            comment: 'Política de stacking de conflictos (extraído de conflict JSON)',
          }),
        );

        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'conflict_priority_rank',
            type: 'int',
            isNullable: false,
            default: 0,
            comment: 'Rank de prioridad para resolución de conflictos (extraído de conflict JSON)',
          }),
        );

        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'conflict_max_awards_per_event',
            type: 'int',
            isNullable: true,
            comment: 'Máximo de premios por evento (extraído de conflict JSON)',
          }),
        );

        // Crear índice para conflict_priority_rank (usado frecuentemente en ORDER BY)
        await queryRunner.createIndex(
          'reward_rules',
          new TableIndex({
            name: 'IDX_REWARD_RULES_CONFLICT_PRIORITY_RANK',
            columnNames: ['conflict_priority_rank'],
          }),
        );
      }

      // ============================================================================
      // 3. AGREGAR COLUMNAS PARA idempotencyScope (JSON → Columnas directas)
      // ============================================================================
      const hasIdempotencyStrategy = rewardRulesTable.findColumnByName('idempotency_strategy');
      if (!hasIdempotencyStrategy) {
        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'idempotency_strategy',
            type: 'varchar',
            length: '20',
            isNullable: false,
            default: "'default'",
            comment: 'Estrategia de idempotencia (extraído de idempotencyScope JSON)',
          }),
        );

        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'idempotency_bucket_timezone',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Timezone para buckets de idempotencia (extraído de idempotencyScope JSON)',
          }),
        );

        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'idempotency_period_days',
            type: 'int',
            isNullable: true,
            comment: 'Días del período de idempotencia (extraído de idempotencyScope JSON)',
          }),
        );
      }

      // ============================================================================
      // 4. AGREGAR COLUMNAS PARA limits (JSON → Columnas directas)
      // ============================================================================
      const hasLimitFrequency = rewardRulesTable.findColumnByName('limit_frequency');
      if (!hasLimitFrequency) {
        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'limit_frequency',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'Frecuencia del límite (extraído de limits JSON)',
          }),
        );

        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'limit_cooldown_hours',
            type: 'int',
            isNullable: true,
            comment: 'Horas de cooldown (extraído de limits JSON)',
          }),
        );

        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'limit_per_event_cap',
            type: 'int',
            isNullable: true,
            comment: 'Límite por evento (extraído de limits JSON)',
          }),
        );

        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'limit_per_period_cap',
            type: 'int',
            isNullable: true,
            comment: 'Límite por período (extraído de limits JSON)',
          }),
        );

        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'limit_period_type',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'Tipo de período (rolling/calendar) (extraído de limits JSON)',
          }),
        );

        await queryRunner.addColumn(
          'reward_rules',
          new TableColumn({
            name: 'limit_period_days',
            type: 'int',
            isNullable: true,
            comment: 'Días del período (extraído de limits JSON)',
          }),
        );
      }
    }

    // ============================================================================
    // 5. CREAR TABLA reward_rule_eligibility
    // ============================================================================
    const eligibilityTableExists = await queryRunner.hasTable('reward_rule_eligibility');
    if (!eligibilityTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'reward_rule_eligibility',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
              comment: 'ID único de la condición de elegibilidad',
            },
            {
              name: 'reward_rule_id',
              type: 'int',
              isNullable: false,
              comment: 'FK a reward_rules',
            },
            {
              name: 'min_tier_id',
              type: 'int',
              isNullable: true,
              comment: 'Tier mínimo requerido',
            },
            {
              name: 'max_tier_id',
              type: 'int',
              isNullable: true,
              comment: 'Tier máximo permitido',
            },
            {
              name: 'min_membership_age_days',
              type: 'int',
              isNullable: true,
              comment: 'Edad mínima de membresía en días',
            },
            {
              name: 'min_amount',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
              comment: 'Monto mínimo requerido',
            },
            {
              name: 'max_amount',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
              comment: 'Monto máximo permitido',
            },
            {
              name: 'min_items',
              type: 'int',
              isNullable: true,
              comment: 'Cantidad mínima de items',
            },
            {
              name: 'day_of_week',
              type: 'json',
              isNullable: true,
              comment: 'Array de días de la semana [0-6] (mantenemos JSON para arrays simples)',
            },
            {
              name: 'time_range_start',
              type: 'time',
              isNullable: true,
              comment: 'Hora de inicio del rango de tiempo',
            },
            {
              name: 'time_range_end',
              type: 'time',
              isNullable: true,
              comment: 'Hora de fin del rango de tiempo',
            },
            {
              name: 'metadata',
              type: 'text',
              isNullable: true,
              comment: 'Metadata flexible (JSON solo para metadata)',
            },
          ],
        }),
        true,
      );

      // Crear foreign key
      await queryRunner.createForeignKey(
        'reward_rule_eligibility',
        new TableForeignKey({
          name: 'FK_REWARD_RULE_ELIGIBILITY_REWARD_RULE_ID',
          columnNames: ['reward_rule_id'],
          referencedTableName: 'reward_rules',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      // Crear índices
      await queryRunner.createIndex(
        'reward_rule_eligibility',
        new TableIndex({
          name: 'IDX_REWARD_RULE_ELIGIBILITY_REWARD_RULE_ID',
          columnNames: ['reward_rule_id'],
        }),
      );
    }

    // ============================================================================
    // 6. CREAR TABLAS RELACIONADAS PARA ARRAYS DE eligibility
    // ============================================================================

    // 6.1 reward_rule_eligibility_membership_status
    const membershipStatusTableExists = await queryRunner.hasTable('reward_rule_eligibility_membership_status');
    if (!membershipStatusTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'reward_rule_eligibility_membership_status',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'eligibility_id',
              type: 'int',
              isNullable: false,
              comment: 'FK a reward_rule_eligibility',
            },
            {
              name: 'status',
              type: 'enum',
              enum: ['active', 'inactive'],
              isNullable: false,
              comment: 'Estado de membresía requerido',
            },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'reward_rule_eligibility_membership_status',
        new TableForeignKey({
          name: 'FK_ELIGIBILITY_MEMBERSHIP_STATUS_ELIGIBILITY_ID',
          columnNames: ['eligibility_id'],
          referencedTableName: 'reward_rule_eligibility',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'reward_rule_eligibility_membership_status',
        new TableIndex({
          name: 'IDX_ELIGIBILITY_MEMBERSHIP_STATUS_ELIGIBILITY_ID',
          columnNames: ['eligibility_id'],
        }),
      );
    }

    // 6.2 reward_rule_eligibility_flags
    const flagsTableExists = await queryRunner.hasTable('reward_rule_eligibility_flags');
    if (!flagsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'reward_rule_eligibility_flags',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'eligibility_id',
              type: 'int',
              isNullable: false,
              comment: 'FK a reward_rule_eligibility',
            },
            {
              name: 'flag',
              type: 'varchar',
              length: '100',
              isNullable: false,
              comment: 'Flag requerido',
            },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'reward_rule_eligibility_flags',
        new TableForeignKey({
          name: 'FK_ELIGIBILITY_FLAGS_ELIGIBILITY_ID',
          columnNames: ['eligibility_id'],
          referencedTableName: 'reward_rule_eligibility',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'reward_rule_eligibility_flags',
        new TableIndex({
          name: 'IDX_ELIGIBILITY_FLAGS_ELIGIBILITY_ID',
          columnNames: ['eligibility_id'],
        }),
      );
    }

    // 6.3 reward_rule_eligibility_category_ids
    const categoryIdsTableExists = await queryRunner.hasTable('reward_rule_eligibility_category_ids');
    if (!categoryIdsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'reward_rule_eligibility_category_ids',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'eligibility_id',
              type: 'int',
              isNullable: false,
              comment: 'FK a reward_rule_eligibility',
            },
            {
              name: 'category_id',
              type: 'int',
              isNullable: false,
              comment: 'ID de categoría requerida',
            },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'reward_rule_eligibility_category_ids',
        new TableForeignKey({
          name: 'FK_ELIGIBILITY_CATEGORY_IDS_ELIGIBILITY_ID',
          columnNames: ['eligibility_id'],
          referencedTableName: 'reward_rule_eligibility',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'reward_rule_eligibility_category_ids',
        new TableIndex({
          name: 'IDX_ELIGIBILITY_CATEGORY_IDS_ELIGIBILITY_ID',
          columnNames: ['eligibility_id'],
        }),
      );

      await queryRunner.createIndex(
        'reward_rule_eligibility_category_ids',
        new TableIndex({
          name: 'IDX_ELIGIBILITY_CATEGORY_IDS_CATEGORY_ID',
          columnNames: ['category_id'],
        }),
      );
    }

    // 6.4 reward_rule_eligibility_skus
    const skusTableExists = await queryRunner.hasTable('reward_rule_eligibility_skus');
    if (!skusTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'reward_rule_eligibility_skus',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'eligibility_id',
              type: 'int',
              isNullable: false,
              comment: 'FK a reward_rule_eligibility',
            },
            {
              name: 'sku',
              type: 'varchar',
              length: '255',
              isNullable: false,
              comment: 'SKU requerido',
            },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'reward_rule_eligibility_skus',
        new TableForeignKey({
          name: 'FK_ELIGIBILITY_SKUS_ELIGIBILITY_ID',
          columnNames: ['eligibility_id'],
          referencedTableName: 'reward_rule_eligibility',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'reward_rule_eligibility_skus',
        new TableIndex({
          name: 'IDX_ELIGIBILITY_SKUS_ELIGIBILITY_ID',
          columnNames: ['eligibility_id'],
        }),
      );

      await queryRunner.createIndex(
        'reward_rule_eligibility_skus',
        new TableIndex({
          name: 'IDX_ELIGIBILITY_SKUS_SKU',
          columnNames: ['sku'],
        }),
      );
    }

    // ============================================================================
    // 7. CREAR TABLA reward_rule_points_formulas
    // ============================================================================
    const formulasTableExists = await queryRunner.hasTable('reward_rule_points_formulas');
    if (!formulasTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'reward_rule_points_formulas',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
              comment: 'ID único de la fórmula de puntos',
            },
            {
              name: 'reward_rule_id',
              type: 'int',
              isNullable: false,
              comment: 'FK a reward_rules',
            },
            {
              name: 'formula_type',
              type: 'enum',
              enum: ['fixed', 'rate', 'table', 'hybrid'],
              isNullable: false,
              comment: 'Tipo de fórmula',
            },
            // Campos para tipo 'fixed'
            {
              name: 'fixed_points',
              type: 'int',
              isNullable: true,
              comment: 'Puntos fijos (para tipo fixed)',
            },
            // Campos para tipo 'rate'
            {
              name: 'rate_rate',
              type: 'decimal',
              precision: 10,
              scale: 4,
              isNullable: true,
              comment: 'Tasa de puntos (para tipo rate)',
            },
            {
              name: 'rate_amount_field',
              type: 'enum',
              enum: ['netAmount', 'grossAmount'],
              isNullable: true,
              comment: 'Campo de monto a usar (para tipo rate)',
            },
            {
              name: 'rate_rounding_policy',
              type: 'enum',
              enum: ['floor', 'ceil', 'nearest'],
              isNullable: true,
              comment: 'Política de redondeo (para tipo rate)',
            },
            {
              name: 'rate_min_points',
              type: 'int',
              isNullable: true,
              comment: 'Puntos mínimos (para tipo rate)',
            },
            {
              name: 'rate_max_points',
              type: 'int',
              isNullable: true,
              comment: 'Puntos máximos (para tipo rate)',
            },
            // Campos para tipo 'table' y 'hybrid'
            {
              name: 'table_data',
              type: 'json',
              isNullable: true,
              comment: 'Datos de tabla complejos (solo para arrays complejos de tabla)',
            },
            {
              name: 'hybrid_base_formula_id',
              type: 'int',
              isNullable: true,
              comment: 'FK a otra fórmula (para tipo hybrid)',
            },
          ],
        }),
        true,
      );

      // Crear foreign keys
      await queryRunner.createForeignKey(
        'reward_rule_points_formulas',
        new TableForeignKey({
          name: 'FK_REWARD_RULE_POINTS_FORMULAS_REWARD_RULE_ID',
          columnNames: ['reward_rule_id'],
          referencedTableName: 'reward_rules',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'reward_rule_points_formulas',
        new TableForeignKey({
          name: 'FK_REWARD_RULE_POINTS_FORMULAS_HYBRID_BASE_FORMULA_ID',
          columnNames: ['hybrid_base_formula_id'],
          referencedTableName: 'reward_rule_points_formulas',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );

      // Crear índices
      await queryRunner.createIndex(
        'reward_rule_points_formulas',
        new TableIndex({
          name: 'IDX_REWARD_RULE_POINTS_FORMULAS_REWARD_RULE_ID',
          columnNames: ['reward_rule_id'],
        }),
      );

      await queryRunner.createIndex(
        'reward_rule_points_formulas',
        new TableIndex({
          name: 'IDX_REWARD_RULE_POINTS_FORMULAS_FORMULA_TYPE',
          columnNames: ['formula_type'],
        }),
      );
    }

    // ============================================================================
    // 8. CREAR TABLA reward_rule_points_table_entries
    // ============================================================================
    const tableEntriesExists = await queryRunner.hasTable('reward_rule_points_table_entries');
    if (!tableEntriesExists) {
      await queryRunner.createTable(
        new Table({
          name: 'reward_rule_points_table_entries',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'formula_id',
              type: 'int',
              isNullable: false,
              comment: 'FK a reward_rule_points_formulas',
            },
            {
              name: 'min_value',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: false,
              comment: 'Valor mínimo del rango',
            },
            {
              name: 'max_value',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
              comment: 'Valor máximo del rango (NULL = sin límite)',
            },
            {
              name: 'points',
              type: 'int',
              isNullable: false,
              comment: 'Puntos para este rango',
            },
            {
              name: 'sort_order',
              type: 'int',
              isNullable: false,
              default: 0,
              comment: 'Orden de la entrada en la tabla',
            },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'reward_rule_points_table_entries',
        new TableForeignKey({
          name: 'FK_REWARD_RULE_POINTS_TABLE_ENTRIES_FORMULA_ID',
          columnNames: ['formula_id'],
          referencedTableName: 'reward_rule_points_formulas',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'reward_rule_points_table_entries',
        new TableIndex({
          name: 'IDX_REWARD_RULE_POINTS_TABLE_ENTRIES_FORMULA_ID',
          columnNames: ['formula_id'],
        }),
      );
    }

    // ============================================================================
    // 9. CREAR TABLA reward_rule_points_formula_bonuses
    // ============================================================================
    const bonusesTableExists = await queryRunner.hasTable('reward_rule_points_formula_bonuses');
    if (!bonusesTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'reward_rule_points_formula_bonuses',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'formula_id',
              type: 'int',
              isNullable: false,
              comment: 'FK a reward_rule_points_formulas (fórmula híbrida)',
            },
            {
              name: 'bonus_formula_id',
              type: 'int',
              isNullable: false,
              comment: 'FK a reward_rule_points_formulas (fórmula de bono)',
            },
            {
              name: 'eligibility_id',
              type: 'int',
              isNullable: true,
              comment: 'FK a reward_rule_eligibility (condición para aplicar bono)',
            },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'reward_rule_points_formula_bonuses',
        new TableForeignKey({
          name: 'FK_REWARD_RULE_POINTS_FORMULA_BONUSES_FORMULA_ID',
          columnNames: ['formula_id'],
          referencedTableName: 'reward_rule_points_formulas',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'reward_rule_points_formula_bonuses',
        new TableForeignKey({
          name: 'FK_REWARD_RULE_POINTS_FORMULA_BONUSES_BONUS_FORMULA_ID',
          columnNames: ['bonus_formula_id'],
          referencedTableName: 'reward_rule_points_formulas',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'reward_rule_points_formula_bonuses',
        new TableForeignKey({
          name: 'FK_REWARD_RULE_POINTS_FORMULA_BONUSES_ELIGIBILITY_ID',
          columnNames: ['eligibility_id'],
          referencedTableName: 'reward_rule_eligibility',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );

      await queryRunner.createIndex(
        'reward_rule_points_formula_bonuses',
        new TableIndex({
          name: 'IDX_REWARD_RULE_POINTS_FORMULA_BONUSES_FORMULA_ID',
          columnNames: ['formula_id'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tablas relacionadas primero (en orden inverso de creación)

    // 9. Eliminar reward_rule_points_formula_bonuses
    if (await queryRunner.hasTable('reward_rule_points_formula_bonuses')) {
      await queryRunner.dropTable('reward_rule_points_formula_bonuses');
    }

    // 8. Eliminar reward_rule_points_table_entries
    if (await queryRunner.hasTable('reward_rule_points_table_entries')) {
      await queryRunner.dropTable('reward_rule_points_table_entries');
    }

    // 7. Eliminar reward_rule_points_formulas
    if (await queryRunner.hasTable('reward_rule_points_formulas')) {
      await queryRunner.dropTable('reward_rule_points_formulas');
    }

    // 6. Eliminar tablas de arrays de eligibility
    if (await queryRunner.hasTable('reward_rule_eligibility_skus')) {
      await queryRunner.dropTable('reward_rule_eligibility_skus');
    }
    if (await queryRunner.hasTable('reward_rule_eligibility_category_ids')) {
      await queryRunner.dropTable('reward_rule_eligibility_category_ids');
    }
    if (await queryRunner.hasTable('reward_rule_eligibility_flags')) {
      await queryRunner.dropTable('reward_rule_eligibility_flags');
    }
    if (await queryRunner.hasTable('reward_rule_eligibility_membership_status')) {
      await queryRunner.dropTable('reward_rule_eligibility_membership_status');
    }

    // 5. Eliminar reward_rule_eligibility
    if (await queryRunner.hasTable('reward_rule_eligibility')) {
      await queryRunner.dropTable('reward_rule_eligibility');
    }

    // Eliminar columnas de reward_rules (en orden inverso)
    const rewardRulesTable = await queryRunner.getTable('reward_rules');
    if (rewardRulesTable) {
      // Eliminar índices primero
      const conflictPriorityRankIndex = rewardRulesTable.indices.find(
        (idx) => idx.name === 'IDX_REWARD_RULES_CONFLICT_PRIORITY_RANK',
      );
      if (conflictPriorityRankIndex) {
        await queryRunner.dropIndex('reward_rules', conflictPriorityRankIndex);
      }

      // Eliminar columnas de limits
      if (rewardRulesTable.findColumnByName('limit_period_days')) {
        await queryRunner.dropColumn('reward_rules', 'limit_period_days');
      }
      if (rewardRulesTable.findColumnByName('limit_period_type')) {
        await queryRunner.dropColumn('reward_rules', 'limit_period_type');
      }
      if (rewardRulesTable.findColumnByName('limit_per_period_cap')) {
        await queryRunner.dropColumn('reward_rules', 'limit_per_period_cap');
      }
      if (rewardRulesTable.findColumnByName('limit_per_event_cap')) {
        await queryRunner.dropColumn('reward_rules', 'limit_per_event_cap');
      }
      if (rewardRulesTable.findColumnByName('limit_cooldown_hours')) {
        await queryRunner.dropColumn('reward_rules', 'limit_cooldown_hours');
      }
      if (rewardRulesTable.findColumnByName('limit_frequency')) {
        await queryRunner.dropColumn('reward_rules', 'limit_frequency');
      }

      // Eliminar columnas de idempotencyScope
      if (rewardRulesTable.findColumnByName('idempotency_period_days')) {
        await queryRunner.dropColumn('reward_rules', 'idempotency_period_days');
      }
      if (rewardRulesTable.findColumnByName('idempotency_bucket_timezone')) {
        await queryRunner.dropColumn('reward_rules', 'idempotency_bucket_timezone');
      }
      if (rewardRulesTable.findColumnByName('idempotency_strategy')) {
        await queryRunner.dropColumn('reward_rules', 'idempotency_strategy');
      }

      // Eliminar columnas de conflict
      if (rewardRulesTable.findColumnByName('conflict_max_awards_per_event')) {
        await queryRunner.dropColumn('reward_rules', 'conflict_max_awards_per_event');
      }
      if (rewardRulesTable.findColumnByName('conflict_priority_rank')) {
        await queryRunner.dropColumn('reward_rules', 'conflict_priority_rank');
      }
      if (rewardRulesTable.findColumnByName('conflict_stack_policy')) {
        await queryRunner.dropColumn('reward_rules', 'conflict_stack_policy');
      }

      // Eliminar columnas de scope
      if (rewardRulesTable.findColumnByName('scope_sku')) {
        await queryRunner.dropColumn('reward_rules', 'scope_sku');
      }
      if (rewardRulesTable.findColumnByName('scope_category_id')) {
        await queryRunner.dropColumn('reward_rules', 'scope_category_id');
      }
      if (rewardRulesTable.findColumnByName('scope_channel')) {
        await queryRunner.dropColumn('reward_rules', 'scope_channel');
      }
      if (rewardRulesTable.findColumnByName('scope_branch_id')) {
        await queryRunner.dropColumn('reward_rules', 'scope_branch_id');
      }
      if (rewardRulesTable.findColumnByName('scope_store_id')) {
        await queryRunner.dropColumn('reward_rules', 'scope_store_id');
      }
      if (rewardRulesTable.findColumnByName('scope_program_id')) {
        await queryRunner.dropColumn('reward_rules', 'scope_program_id');
      }
      if (rewardRulesTable.findColumnByName('scope_tenant_id')) {
        await queryRunner.dropColumn('reward_rules', 'scope_tenant_id');
      }
    }
  }
}
