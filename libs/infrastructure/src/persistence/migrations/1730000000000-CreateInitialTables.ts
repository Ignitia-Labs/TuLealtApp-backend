import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateInitialTables1730000000000 implements MigrationInterface {
  name = 'CreateInitialTables1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla users
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'firstName',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'profile',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'passwordHash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'roles',
            type: 'json',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
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

    // Crear tabla pricing_plans
    await queryRunner.createTable(
      new Table({
        name: 'pricing_plans',
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
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'basePrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'period',
            type: 'varchar',
            length: '50',
            default: "''",
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'cta',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'highlighted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'order',
            type: 'int',
            default: 0,
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

    // Crear tabla pricing_periods
    await queryRunner.createTable(
      new Table({
        name: 'pricing_periods',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'pricingPlanId',
            type: 'int',
          },
          {
            name: 'period',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
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

    // Crear tabla pricing_promotions
    await queryRunner.createTable(
      new Table({
        name: 'pricing_promotions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'pricingPlanId',
            type: 'int',
          },
          {
            name: 'period',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'discountPercent',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'label',
            type: 'varchar',
            length: '255',
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

    // Crear tabla pricing_features
    await queryRunner.createTable(
      new Table({
        name: 'pricing_features',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'pricingPlanId',
            type: 'int',
          },
          {
            name: 'featureId',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'text',
            type: 'text',
          },
          {
            name: 'enabled',
            type: 'boolean',
            default: true,
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

    // Crear tabla legacy_promotions
    await queryRunner.createTable(
      new Table({
        name: 'legacy_promotions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'pricingPlanId',
            type: 'int',
            isUnique: true,
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'discountPercent',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'label',
            type: 'varchar',
            length: '255',
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

    // Crear tabla rate_exchanges
    await queryRunner.createTable(
      new Table({
        name: 'rate_exchanges',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'rate',
            type: 'decimal',
            precision: 10,
            scale: 4,
          },
          {
            name: 'fromCurrency',
            type: 'varchar',
            length: '3',
            default: "'GTQ'",
          },
          {
            name: 'toCurrency',
            type: 'varchar',
            length: '3',
            default: "'USD'",
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

    // Crear foreign keys para pricing_periods
    await queryRunner.createForeignKey(
      'pricing_periods',
      new TableForeignKey({
        columnNames: ['pricingPlanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pricing_plans',
        onDelete: 'CASCADE',
      }),
    );

    // Crear foreign keys para pricing_promotions
    await queryRunner.createForeignKey(
      'pricing_promotions',
      new TableForeignKey({
        columnNames: ['pricingPlanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pricing_plans',
        onDelete: 'CASCADE',
      }),
    );

    // Crear foreign keys para pricing_features
    await queryRunner.createForeignKey(
      'pricing_features',
      new TableForeignKey({
        columnNames: ['pricingPlanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pricing_plans',
        onDelete: 'CASCADE',
      }),
    );

    // Crear foreign keys para legacy_promotions
    await queryRunner.createForeignKey(
      'legacy_promotions',
      new TableForeignKey({
        columnNames: ['pricingPlanId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pricing_plans',
        onDelete: 'CASCADE',
      }),
    );

    // Crear índices para mejorar el rendimiento
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_EMAIL',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'pricing_plans',
      new TableIndex({
        name: 'IDX_PRICING_PLANS_SLUG',
        columnNames: ['slug'],
      }),
    );

    await queryRunner.createIndex(
      'pricing_periods',
      new TableIndex({
        name: 'IDX_PRICING_PERIODS_PLAN_ID',
        columnNames: ['pricingPlanId'],
      }),
    );

    await queryRunner.createIndex(
      'pricing_promotions',
      new TableIndex({
        name: 'IDX_PRICING_PROMOTIONS_PLAN_ID',
        columnNames: ['pricingPlanId'],
      }),
    );

    await queryRunner.createIndex(
      'pricing_features',
      new TableIndex({
        name: 'IDX_PRICING_FEATURES_PLAN_ID',
        columnNames: ['pricingPlanId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.dropIndex('pricing_features', 'IDX_PRICING_FEATURES_PLAN_ID');
    await queryRunner.dropIndex('pricing_promotions', 'IDX_PRICING_PROMOTIONS_PLAN_ID');
    await queryRunner.dropIndex('pricing_periods', 'IDX_PRICING_PERIODS_PLAN_ID');
    await queryRunner.dropIndex('pricing_plans', 'IDX_PRICING_PLANS_SLUG');
    await queryRunner.dropIndex('users', 'IDX_USERS_EMAIL');

    // Eliminar foreign keys
    await queryRunner.dropForeignKey('legacy_promotions', 'FK_legacy_promotions_pricingPlanId');
    await queryRunner.dropForeignKey('pricing_features', 'FK_pricing_features_pricingPlanId');
    await queryRunner.dropForeignKey('pricing_promotions', 'FK_pricing_promotions_pricingPlanId');
    await queryRunner.dropForeignKey('pricing_periods', 'FK_pricing_periods_pricingPlanId');

    // Eliminar tablas en orden inverso
    await queryRunner.dropTable('rate_exchanges');
    await queryRunner.dropTable('legacy_promotions');
    await queryRunner.dropTable('pricing_features');
    await queryRunner.dropTable('pricing_promotions');
    await queryRunner.dropTable('pricing_periods');
    await queryRunner.dropTable('pricing_plans');
    await queryRunner.dropTable('users');
  }
}
