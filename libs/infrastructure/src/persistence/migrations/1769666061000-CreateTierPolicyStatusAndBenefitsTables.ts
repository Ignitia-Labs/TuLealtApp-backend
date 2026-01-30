import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateTierPolicyStatusAndBenefitsTables1769666061000 implements MigrationInterface {
  name = 'CreateTierPolicyStatusAndBenefitsTables1769666061000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla tier_policies
    const tierPoliciesTable = await queryRunner.getTable('tier_policies');
    if (!tierPoliciesTable) {
      await queryRunner.createTable(
        new Table({
          name: 'tier_policies',
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
              name: 'evaluationWindow',
              type: 'varchar',
              length: '20',
              isNullable: false,
              comment: 'MONTHLY, QUARTERLY, ROLLING_30, ROLLING_90',
            },
            {
              name: 'evaluationType',
              type: 'varchar',
              length: '20',
              isNullable: false,
              comment: 'FIXED, ROLLING',
            },
            {
              name: 'thresholds',
              type: 'json',
              isNullable: false,
              comment: 'JSON: { tierId: minPoints }',
            },
            {
              name: 'gracePeriodDays',
              type: 'int',
              isNullable: false,
              default: 30,
            },
            {
              name: 'minTierDuration',
              type: 'int',
              isNullable: false,
              default: 0,
              comment: 'Días mínimos en un tier antes de poder cambiar',
            },
            {
              name: 'downgradeStrategy',
              type: 'varchar',
              length: '20',
              isNullable: false,
              default: "'GRACE_PERIOD'",
              comment: 'IMMEDIATE, GRACE_PERIOD, NEVER',
            },
            {
              name: 'status',
              type: 'varchar',
              length: '20',
              isNullable: false,
              default: "'draft'",
              comment: 'active, inactive, draft',
            },
            {
              name: 'description',
              type: 'text',
              isNullable: true,
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

      // Foreign keys e índices para tier_policies
      await queryRunner.createForeignKey(
        'tier_policies',
        new TableForeignKey({
          columnNames: ['tenantId'],
          referencedTableName: 'tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'tier_policies',
        new TableIndex({
          name: 'IDX_tier_policies_tenant_status',
          columnNames: ['tenantId', 'status'],
        }),
      );
    }

    // 2. Crear tabla tier_status
    const tierStatusTable = await queryRunner.getTable('tier_status');
    if (!tierStatusTable) {
      await queryRunner.createTable(
        new Table({
          name: 'tier_status',
          columns: [
            {
              name: 'membershipId',
              type: 'int',
              isPrimary: true,
              comment: 'FK a customer_memberships - ID único de la membership',
            },
            {
              name: 'currentTierId',
              type: 'int',
              isNullable: true,
              comment: 'FK a customer_tiers - Tier actual (null = sin tier)',
            },
            {
              name: 'since',
              type: 'datetime',
              isNullable: false,
              comment: 'Fecha desde cuando está en este tier',
            },
            {
              name: 'graceUntil',
              type: 'datetime',
              isNullable: true,
              comment: 'Fecha hasta cuando está en grace period (null = no aplica)',
            },
            {
              name: 'nextEvalAt',
              type: 'datetime',
              isNullable: true,
              comment: 'Fecha de próxima evaluación (null = no programada)',
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

      // Foreign keys e índices para tier_status
      await queryRunner.createForeignKey(
        'tier_status',
        new TableForeignKey({
          columnNames: ['membershipId'],
          referencedTableName: 'customer_memberships',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'tier_status',
        new TableForeignKey({
          columnNames: ['currentTierId'],
          referencedTableName: 'customer_tiers',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );

      await queryRunner.createIndex(
        'tier_status',
        new TableIndex({
          name: 'IDX_tier_status_nextEvalAt',
          columnNames: ['nextEvalAt'],
        }),
      );

      await queryRunner.createIndex(
        'tier_status',
        new TableIndex({
          name: 'IDX_tier_status_graceUntil',
          columnNames: ['graceUntil'],
        }),
      );
    }

    // 3. Crear tabla tier_benefits
    const tierBenefitsTable = await queryRunner.getTable('tier_benefits');
    if (!tierBenefitsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'tier_benefits',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'programId',
              type: 'int',
              isNullable: false,
              comment: 'FK a loyalty_programs',
            },
            {
              name: 'tierId',
              type: 'int',
              isNullable: false,
              comment: 'FK a customer_tiers',
            },
            {
              name: 'pointsMultiplier',
              type: 'decimal',
              precision: 5,
              scale: 2,
              isNullable: true,
              comment: 'Multiplicador global de puntos (ej: 1.25 = 25% bonus)',
            },
            {
              name: 'exclusiveRewards',
              type: 'json',
              isNullable: false,
              default: "'[]'",
              comment: 'JSON array: IDs de recompensas exclusivas',
            },
            {
              name: 'higherCaps',
              type: 'json',
              isNullable: true,
              comment: 'JSON: { maxPointsPerEvent, maxPointsPerDay, maxPointsPerMonth }',
            },
            {
              name: 'cooldownReduction',
              type: 'int',
              isNullable: true,
              comment: 'Reducción de cooldown en horas',
            },
            {
              name: 'categoryBenefits',
              type: 'json',
              isNullable: true,
              comment: 'JSON: { categoryId: { pointsMultiplier, exclusiveRewards } }',
            },
            {
              name: 'status',
              type: 'varchar',
              length: '20',
              isNullable: false,
              default: "'active'",
              comment: 'active, inactive',
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

      // Foreign keys e índices para tier_benefits
      await queryRunner.createForeignKey(
        'tier_benefits',
        new TableForeignKey({
          columnNames: ['programId'],
          referencedTableName: 'loyalty_programs',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'tier_benefits',
        new TableForeignKey({
          columnNames: ['tierId'],
          referencedTableName: 'customer_tiers',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'tier_benefits',
        new TableIndex({
          name: 'IDX_tier_benefits_program_tier',
          columnNames: ['programId', 'tierId'],
          isUnique: true,
        }),
      );

      await queryRunner.createIndex(
        'tier_benefits',
        new TableIndex({
          name: 'IDX_tier_benefits_status',
          columnNames: ['status'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tablas en orden inverso (por dependencias)
    await queryRunner.dropTable('tier_benefits', true);
    await queryRunner.dropTable('tier_status', true);
    await queryRunner.dropTable('tier_policies', true);
  }
}
