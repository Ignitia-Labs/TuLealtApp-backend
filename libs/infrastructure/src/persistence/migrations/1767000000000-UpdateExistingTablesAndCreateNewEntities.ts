import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class UpdateExistingTablesAndCreateNewEntities1767000000000 implements MigrationInterface {
  name = 'UpdateExistingTablesAndCreateNewEntities1767000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // PARTE 1: MODIFICAR TABLAS EXISTENTES
    // ============================================

    // Modificar tabla users - agregar nuevos campos
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'partnerId',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'tenantId',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'branchId',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'points',
        type: 'int',
        default: 0,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'qrCode',
        type: 'varchar',
        length: '255',
        isUnique: true,
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'avatar',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'tierId',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'status',
        type: 'varchar',
        length: '20',
        default: "'active'",
      }),
    );

    // Agregar foreign keys para users
    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['partnerId'],
        referencedTableName: 'partners',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['branchId'],
        referencedTableName: 'branches',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Modificar tabla pricing_plans - agregar trialDays y popular
    await queryRunner.addColumn(
      'pricing_plans',
      new TableColumn({
        name: 'trialDays',
        type: 'int',
        default: 14,
      }),
    );

    await queryRunner.addColumn(
      'pricing_plans',
      new TableColumn({
        name: 'popular',
        type: 'boolean',
        default: false,
      }),
    );

    // Crear tabla pricing_plan_limits
    await queryRunner.createTable(
      new Table({
        name: 'pricing_plan_limits',
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
            name: 'maxTenants',
            type: 'int',
          },
          {
            name: 'maxBranches',
            type: 'int',
          },
          {
            name: 'maxCustomers',
            type: 'int',
          },
          {
            name: 'maxRewards',
            type: 'int',
          },
          {
            name: 'maxAdmins',
            type: 'int',
          },
          {
            name: 'storageGB',
            type: 'int',
          },
          {
            name: 'apiCallsPerMonth',
            type: 'int',
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

    await queryRunner.createForeignKey(
      'pricing_plan_limits',
      new TableForeignKey({
        columnNames: ['pricingPlanId'],
        referencedTableName: 'pricing_plans',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Modificar tabla partner_subscriptions - agregar nuevos campos
    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'planType',
        type: 'varchar',
        length: '20',
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'status',
        type: 'varchar',
        length: '20',
        default: "'active'",
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'billingFrequency',
        type: 'varchar',
        length: '20',
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'billingAmount',
        type: 'decimal',
        precision: 10,
        scale: 2,
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'currency',
        type: 'varchar',
        length: '10',
        default: "'USD'",
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'nextBillingDate',
        type: 'datetime',
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'nextBillingAmount',
        type: 'decimal',
        precision: 10,
        scale: 2,
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'currentPeriodStart',
        type: 'datetime',
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'currentPeriodEnd',
        type: 'datetime',
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'trialEndDate',
        type: 'datetime',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'pausedAt',
        type: 'datetime',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'pauseReason',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'gracePeriodDays',
        type: 'int',
        default: 7,
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'retryAttempts',
        type: 'int',
        default: 0,
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'maxRetryAttempts',
        type: 'int',
        default: 3,
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'creditBalance',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'discountPercent',
        type: 'decimal',
        precision: 5,
        scale: 2,
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'partner_subscriptions',
      new TableColumn({
        name: 'discountCode',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );

    // ============================================
    // PARTE 2: CREAR NUEVAS TABLAS
    // ============================================

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
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'image',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'pointsRequired',
            type: 'int',
          },
          {
            name: 'stock',
            type: 'int',
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
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
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

    await queryRunner.createForeignKey(
      'rewards',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'rewards',
      new TableIndex({
        name: 'IDX_rewards_tenantId',
        columnNames: ['tenantId'],
      }),
    );

    // Crear tabla transactions
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'userId',
            type: 'int',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'points',
            type: 'int',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'completed'",
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

    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_transactions_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_transactions_type',
        columnNames: ['type'],
      }),
    );

    // Crear tabla points_rules
    await queryRunner.createTable(
      new Table({
        name: 'points_rules',
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
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'pointsPerUnit',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'multiplier',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'minAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'applicableDays',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'priority',
            type: 'int',
            default: 1,
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

    await queryRunner.createForeignKey(
      'points_rules',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'points_rules',
      new TableIndex({
        name: 'IDX_points_rules_tenantId',
        columnNames: ['tenantId'],
      }),
    );

    // Crear tabla customer_tiers
    await queryRunner.createTable(
      new Table({
        name: 'customer_tiers',
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
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'minPoints',
            type: 'int',
          },
          {
            name: 'maxPoints',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '7',
          },
          {
            name: 'benefits',
            type: 'json',
          },
          {
            name: 'multiplier',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'priority',
            type: 'int',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
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

    await queryRunner.createForeignKey(
      'customer_tiers',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'customer_tiers',
      new TableIndex({
        name: 'IDX_customer_tiers_tenantId',
        columnNames: ['tenantId'],
      }),
    );

    // Agregar foreign key de tierId en users
    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['tierId'],
        referencedTableName: 'customer_tiers',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Crear tabla reward_tiers (many-to-many)
    await queryRunner.createTable(
      new Table({
        name: 'reward_tiers',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'rewardId',
            type: 'int',
          },
          {
            name: 'tierId',
            type: 'int',
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

    await queryRunner.createForeignKey(
      'reward_tiers',
      new TableForeignKey({
        columnNames: ['rewardId'],
        referencedTableName: 'rewards',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'reward_tiers',
      new TableForeignKey({
        columnNames: ['tierId'],
        referencedTableName: 'customer_tiers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'reward_tiers',
      new TableIndex({
        name: 'IDX_reward_tiers_unique',
        columnNames: ['rewardId', 'tierId'],
        isUnique: true,
      }),
    );

    // Crear tabla notifications
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'userId',
            type: 'int',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'message',
            type: 'text',
          },
          {
            name: 'data',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'read',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'notifications',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_userId_read',
        columnNames: ['userId', 'read'],
      }),
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_userId_createdAt',
        columnNames: ['userId', 'createdAt'],
      }),
    );

    // Crear tabla invitation_codes
    await queryRunner.createTable(
      new Table({
        name: 'invitation_codes',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'tenantId',
            type: 'int',
          },
          {
            name: 'branchId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'maxUses',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'currentUses',
            type: 'int',
            default: 0,
          },
          {
            name: 'expiresAt',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'createdBy',
            type: 'int',
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

    await queryRunner.createForeignKey(
      'invitation_codes',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'invitation_codes',
      new TableForeignKey({
        columnNames: ['branchId'],
        referencedTableName: 'branches',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'invitation_codes',
      new TableForeignKey({
        columnNames: ['createdBy'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'invitation_codes',
      new TableIndex({
        name: 'IDX_invitation_codes_tenantId',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'invitation_codes',
      new TableIndex({
        name: 'IDX_invitation_codes_branchId',
        columnNames: ['branchId'],
      }),
    );

    // Crear tabla billing_cycles
    await queryRunner.createTable(
      new Table({
        name: 'billing_cycles',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'subscriptionId',
            type: 'int',
          },
          {
            name: 'partnerId',
            type: 'int',
          },
          {
            name: 'cycleNumber',
            type: 'int',
          },
          {
            name: 'startDate',
            type: 'datetime',
          },
          {
            name: 'endDate',
            type: 'datetime',
          },
          {
            name: 'durationDays',
            type: 'int',
          },
          {
            name: 'billingDate',
            type: 'datetime',
          },
          {
            name: 'dueDate',
            type: 'datetime',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'paidAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            default: "'USD'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'paymentStatus',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'paymentDate',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'paymentMethod',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'invoiceId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'invoiceNumber',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'invoiceStatus',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'discountApplied',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'totalAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
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

    await queryRunner.createForeignKey(
      'billing_cycles',
      new TableForeignKey({
        columnNames: ['subscriptionId'],
        referencedTableName: 'partner_subscriptions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'billing_cycles',
      new TableForeignKey({
        columnNames: ['partnerId'],
        referencedTableName: 'partners',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'billing_cycles',
      new TableIndex({
        name: 'IDX_billing_cycles_subscriptionId',
        columnNames: ['subscriptionId'],
      }),
    );

    await queryRunner.createIndex(
      'billing_cycles',
      new TableIndex({
        name: 'IDX_billing_cycles_partnerId',
        columnNames: ['partnerId'],
      }),
    );

    await queryRunner.createIndex(
      'billing_cycles',
      new TableIndex({
        name: 'IDX_billing_cycles_status',
        columnNames: ['status'],
      }),
    );

    // Crear tabla invoices
    await queryRunner.createTable(
      new Table({
        name: 'invoices',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'invoiceNumber',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'subscriptionId',
            type: 'int',
          },
          {
            name: 'partnerId',
            type: 'int',
          },
          {
            name: 'billingCycleId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'businessName',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'taxId',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'fiscalAddress',
            type: 'text',
          },
          {
            name: 'billingEmail',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'issueDate',
            type: 'datetime',
          },
          {
            name: 'dueDate',
            type: 'datetime',
          },
          {
            name: 'paidDate',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'discountAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'taxAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'creditApplied',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'total',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            default: "'USD'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'paymentStatus',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'paymentMethod',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'pdfUrl',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'notes',
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

    await queryRunner.createForeignKey(
      'invoices',
      new TableForeignKey({
        columnNames: ['subscriptionId'],
        referencedTableName: 'partner_subscriptions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'invoices',
      new TableForeignKey({
        columnNames: ['partnerId'],
        referencedTableName: 'partners',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'invoices',
      new TableForeignKey({
        columnNames: ['billingCycleId'],
        referencedTableName: 'billing_cycles',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_subscriptionId',
        columnNames: ['subscriptionId'],
      }),
    );

    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_partnerId',
        columnNames: ['partnerId'],
      }),
    );

    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_status',
        columnNames: ['status'],
      }),
    );

    // Crear tabla invoice_items
    await queryRunner.createTable(
      new Table({
        name: 'invoice_items',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'invoiceId',
            type: 'int',
          },
          {
            name: 'itemId',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'quantity',
            type: 'int',
            default: 1,
          },
          {
            name: 'unitPrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'taxRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'taxAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'discountPercent',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'discountAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'total',
            type: 'decimal',
            precision: 10,
            scale: 2,
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

    await queryRunner.createForeignKey(
      'invoice_items',
      new TableForeignKey({
        columnNames: ['invoiceId'],
        referencedTableName: 'invoices',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Crear tabla payments
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'subscriptionId',
            type: 'int',
          },
          {
            name: 'partnerId',
            type: 'int',
          },
          {
            name: 'invoiceId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'billingCycleId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            default: "'USD'",
          },
          {
            name: 'paymentMethod',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'paymentDate',
            type: 'datetime',
          },
          {
            name: 'processedDate',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'transactionId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'confirmationCode',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'gateway',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'gatewayTransactionId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'cardLastFour',
            type: 'varchar',
            length: '4',
            isNullable: true,
          },
          {
            name: 'cardBrand',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'cardExpiry',
            type: 'varchar',
            length: '7',
            isNullable: true,
          },
          {
            name: 'isRetry',
            type: 'boolean',
            default: false,
          },
          {
            name: 'retryAttempt',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'processedBy',
            type: 'int',
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

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['subscriptionId'],
        referencedTableName: 'partner_subscriptions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['partnerId'],
        referencedTableName: 'partners',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['invoiceId'],
        referencedTableName: 'invoices',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['billingCycleId'],
        referencedTableName: 'billing_cycles',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_subscriptionId',
        columnNames: ['subscriptionId'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_partnerId',
        columnNames: ['partnerId'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_invoiceId',
        columnNames: ['invoiceId'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_status',
        columnNames: ['status'],
      }),
    );

    // Crear tabla saved_payment_methods
    await queryRunner.createTable(
      new Table({
        name: 'saved_payment_methods',
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
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'cardLastFour',
            type: 'varchar',
            length: '4',
            isNullable: true,
          },
          {
            name: 'cardBrand',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'cardExpiry',
            type: 'varchar',
            length: '7',
            isNullable: true,
          },
          {
            name: 'cardHolderName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'bankName',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'accountLastFour',
            type: 'varchar',
            length: '4',
            isNullable: true,
          },
          {
            name: 'accountType',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'isDefault',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'gateway',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'gatewayCustomerId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'gatewayPaymentMethodId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'nickname',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'lastUsedAt',
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

    await queryRunner.createForeignKey(
      'saved_payment_methods',
      new TableForeignKey({
        columnNames: ['partnerId'],
        referencedTableName: 'partners',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'saved_payment_methods',
      new TableIndex({
        name: 'IDX_saved_payment_methods_partnerId',
        columnNames: ['partnerId'],
      }),
    );

    await queryRunner.createIndex(
      'saved_payment_methods',
      new TableIndex({
        name: 'IDX_saved_payment_methods_isDefault',
        columnNames: ['isDefault'],
      }),
    );

    // Crear tabla subscription_events
    await queryRunner.createTable(
      new Table({
        name: 'subscription_events',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'subscriptionId',
            type: 'int',
          },
          {
            name: 'partnerId',
            type: 'int',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'paymentId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'invoiceId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'occurredAt',
            type: 'datetime',
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'subscription_events',
      new TableForeignKey({
        columnNames: ['subscriptionId'],
        referencedTableName: 'partner_subscriptions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'subscription_events',
      new TableForeignKey({
        columnNames: ['partnerId'],
        referencedTableName: 'partners',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'subscription_events',
      new TableIndex({
        name: 'IDX_subscription_events_subscriptionId',
        columnNames: ['subscriptionId'],
      }),
    );

    await queryRunner.createIndex(
      'subscription_events',
      new TableIndex({
        name: 'IDX_subscription_events_partnerId',
        columnNames: ['partnerId'],
      }),
    );

    await queryRunner.createIndex(
      'subscription_events',
      new TableIndex({
        name: 'IDX_subscription_events_type',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'subscription_events',
      new TableIndex({
        name: 'IDX_subscription_events_occurredAt',
        columnNames: ['occurredAt'],
      }),
    );

    // Crear tabla subscription_alerts
    await queryRunner.createTable(
      new Table({
        name: 'subscription_alerts',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'subscriptionId',
            type: 'int',
          },
          {
            name: 'partnerId',
            type: 'int',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'severity',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'message',
            type: 'text',
          },
          {
            name: 'actionRequired',
            type: 'boolean',
            default: false,
          },
          {
            name: 'actionLabel',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'actionUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'notifyEmail',
            type: 'boolean',
            default: true,
          },
          {
            name: 'notifyPush',
            type: 'boolean',
            default: true,
          },
          {
            name: 'emailSentAt',
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

    await queryRunner.createForeignKey(
      'subscription_alerts',
      new TableForeignKey({
        columnNames: ['subscriptionId'],
        referencedTableName: 'partner_subscriptions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'subscription_alerts',
      new TableForeignKey({
        columnNames: ['partnerId'],
        referencedTableName: 'partners',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'subscription_alerts',
      new TableIndex({
        name: 'IDX_subscription_alerts_subscriptionId',
        columnNames: ['subscriptionId'],
      }),
    );

    await queryRunner.createIndex(
      'subscription_alerts',
      new TableIndex({
        name: 'IDX_subscription_alerts_partnerId',
        columnNames: ['partnerId'],
      }),
    );

    await queryRunner.createIndex(
      'subscription_alerts',
      new TableIndex({
        name: 'IDX_subscription_alerts_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'subscription_alerts',
      new TableIndex({
        name: 'IDX_subscription_alerts_severity',
        columnNames: ['severity'],
      }),
    );

    // Crear tabla coupons
    await queryRunner.createTable(
      new Table({
        name: 'coupons',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'discountType',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'discountValue',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'applicableFrequencies',
            type: 'json',
          },
          {
            name: 'maxUses',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'currentUses',
            type: 'int',
            default: 0,
          },
          {
            name: 'maxUsesPerPartner',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'validFrom',
            type: 'datetime',
          },
          {
            name: 'validUntil',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'createdBy',
            type: 'int',
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

    await queryRunner.createIndex(
      'coupons',
      new TableIndex({
        name: 'IDX_coupons_status',
        columnNames: ['status'],
      }),
    );

    // Crear tabla plan_changes
    await queryRunner.createTable(
      new Table({
        name: 'plan_changes',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'subscriptionId',
            type: 'int',
          },
          {
            name: 'partnerId',
            type: 'int',
          },
          {
            name: 'fromPlanId',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'fromPlanType',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'toPlanId',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'toPlanType',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'changeType',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'effectiveDate',
            type: 'datetime',
          },
          {
            name: 'proratedAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'creditIssued',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'additionalCharge',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            default: "'USD'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'processedAt',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'requestedBy',
            type: 'int',
          },
          {
            name: 'approvedBy',
            type: 'int',
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

    await queryRunner.createForeignKey(
      'plan_changes',
      new TableForeignKey({
        columnNames: ['subscriptionId'],
        referencedTableName: 'partner_subscriptions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'plan_changes',
      new TableForeignKey({
        columnNames: ['partnerId'],
        referencedTableName: 'partners',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'plan_changes',
      new TableIndex({
        name: 'IDX_plan_changes_subscriptionId',
        columnNames: ['subscriptionId'],
      }),
    );

    await queryRunner.createIndex(
      'plan_changes',
      new TableIndex({
        name: 'IDX_plan_changes_partnerId',
        columnNames: ['partnerId'],
      }),
    );

    await queryRunner.createIndex(
      'plan_changes',
      new TableIndex({
        name: 'IDX_plan_changes_status',
        columnNames: ['status'],
      }),
    );

    // Crear tabla partner_requests
    await queryRunner.createTable(
      new Table({
        name: 'partner_requests',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'submittedAt',
            type: 'datetime',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'responsibleName',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'country',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'plan',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'logo',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'branchesNumber',
            type: 'int',
            default: 0,
          },
          {
            name: 'website',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'socialMedia',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'rewardType',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'currencyId',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'businessName',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'taxId',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'fiscalAddress',
            type: 'text',
          },
          {
            name: 'paymentMethod',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'billingEmail',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'assignedTo',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'lastUpdated',
            type: 'datetime',
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

    await queryRunner.createIndex(
      'partner_requests',
      new TableIndex({
        name: 'IDX_partner_requests_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'partner_requests',
      new TableIndex({
        name: 'IDX_partner_requests_submittedAt',
        columnNames: ['submittedAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar nuevas tablas en orden inverso (respetando dependencias)
    await queryRunner.dropTable('partner_requests', true);
    await queryRunner.dropTable('plan_changes', true);
    await queryRunner.dropTable('coupons', true);
    await queryRunner.dropTable('subscription_alerts', true);
    await queryRunner.dropTable('subscription_events', true);
    await queryRunner.dropTable('saved_payment_methods', true);
    await queryRunner.dropTable('payments', true);
    await queryRunner.dropTable('invoice_items', true);
    await queryRunner.dropTable('invoices', true);
    await queryRunner.dropTable('billing_cycles', true);
    await queryRunner.dropTable('invitation_codes', true);
    await queryRunner.dropTable('notifications', true);
    await queryRunner.dropTable('reward_tiers', true);
    await queryRunner.dropTable('customer_tiers', true);
    await queryRunner.dropTable('points_rules', true);
    await queryRunner.dropTable('transactions', true);
    await queryRunner.dropTable('rewards', true);
    await queryRunner.dropTable('pricing_plan_limits', true);

    // Eliminar foreign keys de users primero
    const usersTable = await queryRunner.getTable('users');
    if (usersTable) {
      const tierIdFk = usersTable.foreignKeys.find((fk) => fk.columnNames.indexOf('tierId') !== -1);
      if (tierIdFk) {
        await queryRunner.dropForeignKey('users', tierIdFk);
      }
      const branchIdFk = usersTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('branchId') !== -1,
      );
      if (branchIdFk) {
        await queryRunner.dropForeignKey('users', branchIdFk);
      }
      const tenantIdFk = usersTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('tenantId') !== -1,
      );
      if (tenantIdFk) {
        await queryRunner.dropForeignKey('users', tenantIdFk);
      }
      const partnerIdFk = usersTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('partnerId') !== -1,
      );
      if (partnerIdFk) {
        await queryRunner.dropForeignKey('users', partnerIdFk);
      }
    }

    // Eliminar columnas agregadas a users
    await queryRunner.dropColumn('users', 'status');
    await queryRunner.dropColumn('users', 'tierId');
    await queryRunner.dropColumn('users', 'avatar');
    await queryRunner.dropColumn('users', 'qrCode');
    await queryRunner.dropColumn('users', 'points');
    await queryRunner.dropColumn('users', 'branchId');
    await queryRunner.dropColumn('users', 'tenantId');
    await queryRunner.dropColumn('users', 'partnerId');

    // Eliminar columnas agregadas a partner_subscriptions
    await queryRunner.dropColumn('partner_subscriptions', 'discountCode');
    await queryRunner.dropColumn('partner_subscriptions', 'discountPercent');
    await queryRunner.dropColumn('partner_subscriptions', 'creditBalance');
    await queryRunner.dropColumn('partner_subscriptions', 'maxRetryAttempts');
    await queryRunner.dropColumn('partner_subscriptions', 'retryAttempts');
    await queryRunner.dropColumn('partner_subscriptions', 'gracePeriodDays');
    await queryRunner.dropColumn('partner_subscriptions', 'pauseReason');
    await queryRunner.dropColumn('partner_subscriptions', 'pausedAt');
    await queryRunner.dropColumn('partner_subscriptions', 'trialEndDate');
    await queryRunner.dropColumn('partner_subscriptions', 'currentPeriodEnd');
    await queryRunner.dropColumn('partner_subscriptions', 'currentPeriodStart');
    await queryRunner.dropColumn('partner_subscriptions', 'nextBillingAmount');
    await queryRunner.dropColumn('partner_subscriptions', 'nextBillingDate');
    await queryRunner.dropColumn('partner_subscriptions', 'currency');
    await queryRunner.dropColumn('partner_subscriptions', 'billingAmount');
    await queryRunner.dropColumn('partner_subscriptions', 'billingFrequency');
    await queryRunner.dropColumn('partner_subscriptions', 'status');
    await queryRunner.dropColumn('partner_subscriptions', 'planType');

    // Eliminar columnas agregadas a pricing_plans
    await queryRunner.dropColumn('pricing_plans', 'popular');
    await queryRunner.dropColumn('pricing_plans', 'trialDays');
  }
}
