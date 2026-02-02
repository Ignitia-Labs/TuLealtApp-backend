import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * Migración: Agregar columnas relacionales a tier_benefits
 *
 * Esta migración agrega nuevas columnas y tablas relacionadas para reemplazar
 * los campos JSON en tier_benefits. Los campos JSON se mantienen temporalmente
 * hasta que se migren los datos y se valide la integridad.
 *
 * Fase 4.2 del Plan de Eliminación de Tipos JSON
 */
export class AddRelationalColumnsToTierBenefits1796000000000 implements MigrationInterface {
  name = 'AddRelationalColumnsToTierBenefits1796000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tierBenefitsTable = await queryRunner.getTable('tier_benefits');

    if (tierBenefitsTable) {
      // ============================================================================
      // 1. AGREGAR COLUMNAS PARA higherCaps (JSON → Columnas directas)
      // ============================================================================
      const hasHigherCapsMaxPointsPerEvent = tierBenefitsTable.findColumnByName(
        'higher_caps_max_points_per_event',
      );
      if (!hasHigherCapsMaxPointsPerEvent) {
        await queryRunner.addColumn(
          'tier_benefits',
          new TableColumn({
            name: 'higher_caps_max_points_per_event',
            type: 'int',
            isNullable: true,
            comment: 'Máximo de puntos por evento para este tier (extraído de higherCaps JSON)',
          }),
        );

        await queryRunner.addColumn(
          'tier_benefits',
          new TableColumn({
            name: 'higher_caps_max_points_per_day',
            type: 'int',
            isNullable: true,
            comment: 'Máximo de puntos por día para este tier (extraído de higherCaps JSON)',
          }),
        );

        await queryRunner.addColumn(
          'tier_benefits',
          new TableColumn({
            name: 'higher_caps_max_points_per_month',
            type: 'int',
            isNullable: true,
            comment: 'Máximo de puntos por mes para este tier (extraído de higherCaps JSON)',
          }),
        );
      }
    }

    // ============================================================================
    // 2. CREAR TABLA tier_benefit_exclusive_rewards (para exclusiveRewards JSON array)
    // ============================================================================
    const exclusiveRewardsTableExists = await queryRunner.hasTable(
      'tier_benefit_exclusive_rewards',
    );
    if (!exclusiveRewardsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'tier_benefit_exclusive_rewards',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
              comment: 'ID único de la recompensa exclusiva',
            },
            {
              name: 'tier_benefit_id',
              type: 'int',
              isNullable: false,
              comment: 'FK a tier_benefits',
            },
            {
              name: 'reward_id',
              type: 'varchar',
              length: '255',
              isNullable: false,
              comment: 'ID de la recompensa exclusiva',
            },
          ],
        }),
        true,
      );

      // Crear foreign key
      await queryRunner.createForeignKey(
        'tier_benefit_exclusive_rewards',
        new TableForeignKey({
          name: 'FK_TIER_BENEFIT_EXCLUSIVE_REWARDS_TIER_BENEFIT_ID',
          columnNames: ['tier_benefit_id'],
          referencedTableName: 'tier_benefits',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      // Crear índices
      await queryRunner.createIndex(
        'tier_benefit_exclusive_rewards',
        new TableIndex({
          name: 'IDX_TIER_BENEFIT_EXCLUSIVE_REWARDS_TIER_BENEFIT_ID',
          columnNames: ['tier_benefit_id'],
        }),
      );

      await queryRunner.createIndex(
        'tier_benefit_exclusive_rewards',
        new TableIndex({
          name: 'IDX_TIER_BENEFIT_EXCLUSIVE_REWARDS_REWARD_ID',
          columnNames: ['reward_id'],
        }),
      );

      // Crear unique constraint para (tier_benefit_id, reward_id)
      await queryRunner.createIndex(
        'tier_benefit_exclusive_rewards',
        new TableIndex({
          name: 'UK_TIER_BENEFIT_EXCLUSIVE_REWARDS_TIER_BENEFIT_REWARD',
          columnNames: ['tier_benefit_id', 'reward_id'],
          isUnique: true,
        }),
      );
    }

    // ============================================================================
    // 3. CREAR TABLA tier_benefit_category_benefits (para categoryBenefits JSON)
    // ============================================================================
    const categoryBenefitsTableExists = await queryRunner.hasTable(
      'tier_benefit_category_benefits',
    );
    if (!categoryBenefitsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'tier_benefit_category_benefits',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
              comment: 'ID único del beneficio por categoría',
            },
            {
              name: 'tier_benefit_id',
              type: 'int',
              isNullable: false,
              comment: 'FK a tier_benefits',
            },
            {
              name: 'category_id',
              type: 'int',
              isNullable: false,
              comment: 'ID de la categoría',
            },
            {
              name: 'points_multiplier',
              type: 'decimal',
              precision: 5,
              scale: 2,
              isNullable: true,
              comment: 'Multiplicador de puntos específico para esta categoría',
            },
          ],
        }),
        true,
      );

      // Crear foreign key
      await queryRunner.createForeignKey(
        'tier_benefit_category_benefits',
        new TableForeignKey({
          name: 'FK_TIER_BENEFIT_CATEGORY_BENEFITS_TIER_BENEFIT_ID',
          columnNames: ['tier_benefit_id'],
          referencedTableName: 'tier_benefits',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      // Crear índices
      await queryRunner.createIndex(
        'tier_benefit_category_benefits',
        new TableIndex({
          name: 'IDX_TIER_BENEFIT_CATEGORY_BENEFITS_TIER_BENEFIT_ID',
          columnNames: ['tier_benefit_id'],
        }),
      );

      await queryRunner.createIndex(
        'tier_benefit_category_benefits',
        new TableIndex({
          name: 'IDX_TIER_BENEFIT_CATEGORY_BENEFITS_CATEGORY_ID',
          columnNames: ['category_id'],
        }),
      );

      // Crear unique constraint para (tier_benefit_id, category_id)
      await queryRunner.createIndex(
        'tier_benefit_category_benefits',
        new TableIndex({
          name: 'UK_TIER_BENEFIT_CATEGORY_BENEFITS_TIER_BENEFIT_CATEGORY',
          columnNames: ['tier_benefit_id', 'category_id'],
          isUnique: true,
        }),
      );
    }

    // ============================================================================
    // 4. CREAR TABLA tier_benefit_category_exclusive_rewards (para exclusiveRewards dentro de categoryBenefits)
    // ============================================================================
    const categoryExclusiveRewardsTableExists = await queryRunner.hasTable(
      'tier_benefit_category_exclusive_rewards',
    );
    if (!categoryExclusiveRewardsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'tier_benefit_category_exclusive_rewards',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
              comment: 'ID único de la recompensa exclusiva por categoría',
            },
            {
              name: 'category_benefit_id',
              type: 'int',
              isNullable: false,
              comment: 'FK a tier_benefit_category_benefits',
            },
            {
              name: 'reward_id',
              type: 'varchar',
              length: '255',
              isNullable: false,
              comment: 'ID de la recompensa exclusiva para esta categoría',
            },
          ],
        }),
        true,
      );

      // Crear foreign key
      await queryRunner.createForeignKey(
        'tier_benefit_category_exclusive_rewards',
        new TableForeignKey({
          name: 'FK_TIER_BENEFIT_CATEGORY_EXCLUSIVE_REWARDS_CATEGORY_BENEFIT_ID',
          columnNames: ['category_benefit_id'],
          referencedTableName: 'tier_benefit_category_benefits',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      // Crear índices
      await queryRunner.createIndex(
        'tier_benefit_category_exclusive_rewards',
        new TableIndex({
          name: 'IDX_TIER_BENEFIT_CATEGORY_EXCLUSIVE_REWARDS_CATEGORY_BENEFIT_ID',
          columnNames: ['category_benefit_id'],
        }),
      );

      await queryRunner.createIndex(
        'tier_benefit_category_exclusive_rewards',
        new TableIndex({
          name: 'IDX_TIER_BENEFIT_CATEGORY_EXCLUSIVE_REWARDS_REWARD_ID',
          columnNames: ['reward_id'],
        }),
      );

      // Crear unique constraint para (category_benefit_id, reward_id)
      await queryRunner.createIndex(
        'tier_benefit_category_exclusive_rewards',
        new TableIndex({
          name: 'UK_TB_CAT_EXCL_REW_CAT_BEN_REW',
          columnNames: ['category_benefit_id', 'reward_id'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tablas relacionadas primero (en orden inverso)
    if (await queryRunner.hasTable('tier_benefit_category_exclusive_rewards')) {
      await queryRunner.dropTable('tier_benefit_category_exclusive_rewards');
    }

    if (await queryRunner.hasTable('tier_benefit_category_benefits')) {
      await queryRunner.dropTable('tier_benefit_category_benefits');
    }

    if (await queryRunner.hasTable('tier_benefit_exclusive_rewards')) {
      await queryRunner.dropTable('tier_benefit_exclusive_rewards');
    }

    // Eliminar columnas de tier_benefits
    const tierBenefitsTable = await queryRunner.getTable('tier_benefits');
    if (tierBenefitsTable) {
      if (tierBenefitsTable.findColumnByName('higher_caps_max_points_per_month')) {
        await queryRunner.dropColumn('tier_benefits', 'higher_caps_max_points_per_month');
      }
      if (tierBenefitsTable.findColumnByName('higher_caps_max_points_per_day')) {
        await queryRunner.dropColumn('tier_benefits', 'higher_caps_max_points_per_day');
      }
      if (tierBenefitsTable.findColumnByName('higher_caps_max_points_per_event')) {
        await queryRunner.dropColumn('tier_benefits', 'higher_caps_max_points_per_event');
      }
    }
  }
}
