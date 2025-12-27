import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePartnersTenantsBranches1734567890000 implements MigrationInterface {
  name = 'CreatePartnersTenantsBranches1734567890000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla partners
    await queryRunner.createTable(
      new Table({
        name: 'partners',
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
            name: 'responsibleName',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
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
            name: 'domain',
            type: 'varchar',
            length: '255',
            isUnique: true,
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

    // Crear tabla partner_subscriptions
    await queryRunner.createTable(
      new Table({
        name: 'partner_subscriptions',
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
            name: 'planId',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'startDate',
            type: 'datetime',
          },
          {
            name: 'renewalDate',
            type: 'datetime',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'lastPaymentDate',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'lastPaymentAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'paymentStatus',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'autoRenew',
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

    // Crear tabla partner_limits
    await queryRunner.createTable(
      new Table({
        name: 'partner_limits',
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

    // Crear tabla partner_stats
    await queryRunner.createTable(
      new Table({
        name: 'partner_stats',
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
            name: 'tenantsCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'branchesCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'customersCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'rewardsCount',
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

    // Crear tabla tenants
    await queryRunner.createTable(
      new Table({
        name: 'tenants',
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
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
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
            name: 'currencyId',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'primaryColor',
            type: 'varchar',
            length: '7',
          },
          {
            name: 'secondaryColor',
            type: 'varchar',
            length: '7',
          },
          {
            name: 'pointsExpireDays',
            type: 'int',
            default: 365,
          },
          {
            name: 'minPointsToRedeem',
            type: 'int',
            default: 100,
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

    // Crear tabla tenant_features
    await queryRunner.createTable(
      new Table({
        name: 'tenant_features',
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
            name: 'qrScanning',
            type: 'boolean',
            default: true,
          },
          {
            name: 'offlineMode',
            type: 'boolean',
            default: true,
          },
          {
            name: 'referralProgram',
            type: 'boolean',
            default: true,
          },
          {
            name: 'birthdayRewards',
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

    // Crear tabla branches
    await queryRunner.createTable(
      new Table({
        name: 'branches',
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
            name: 'address',
            type: 'text',
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'country',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
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

    // Crear foreign keys para partner_subscriptions (solo si no existe)
    const partnerSubscriptionsTable = await queryRunner.getTable('partner_subscriptions');
    if (partnerSubscriptionsTable) {
      const existingFk = partnerSubscriptionsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('partnerId') !== -1,
      );
      if (!existingFk) {
        await queryRunner.createForeignKey(
          'partner_subscriptions',
          new TableForeignKey({
            columnNames: ['partnerId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'partners',
            onDelete: 'CASCADE',
          }),
        );
      }
    }

    // Crear foreign keys para partner_limits (solo si no existe)
    const partnerLimitsTable = await queryRunner.getTable('partner_limits');
    if (partnerLimitsTable) {
      const existingFk = partnerLimitsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('partnerId') !== -1,
      );
      if (!existingFk) {
        await queryRunner.createForeignKey(
          'partner_limits',
          new TableForeignKey({
            columnNames: ['partnerId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'partners',
            onDelete: 'CASCADE',
          }),
        );
      }
    }

    // Crear foreign keys para partner_stats (solo si no existe)
    const partnerStatsTable = await queryRunner.getTable('partner_stats');
    if (partnerStatsTable) {
      const existingFk = partnerStatsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('partnerId') !== -1,
      );
      if (!existingFk) {
        await queryRunner.createForeignKey(
          'partner_stats',
          new TableForeignKey({
            columnNames: ['partnerId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'partners',
            onDelete: 'CASCADE',
          }),
        );
      }
    }

    // Crear foreign keys para tenants (solo si no existe)
    const tenantsTable = await queryRunner.getTable('tenants');
    if (tenantsTable) {
      const existingFk = tenantsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('partnerId') !== -1,
      );
      if (!existingFk) {
        await queryRunner.createForeignKey(
          'tenants',
          new TableForeignKey({
            columnNames: ['partnerId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'partners',
            onDelete: 'CASCADE',
          }),
        );
      }
    }

    // Crear foreign keys para tenant_features (solo si no existe)
    const tenantFeaturesTable = await queryRunner.getTable('tenant_features');
    if (tenantFeaturesTable) {
      const existingFk = tenantFeaturesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('tenantId') !== -1,
      );
      if (!existingFk) {
        await queryRunner.createForeignKey(
          'tenant_features',
          new TableForeignKey({
            columnNames: ['tenantId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'tenants',
            onDelete: 'CASCADE',
          }),
        );
      }
    }

    // Crear foreign keys para branches (solo si no existe)
    const branchesTable = await queryRunner.getTable('branches');
    if (branchesTable) {
      const existingFk = branchesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('tenantId') !== -1,
      );
      if (!existingFk) {
        await queryRunner.createForeignKey(
          'branches',
          new TableForeignKey({
            columnNames: ['tenantId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'tenants',
            onDelete: 'CASCADE',
          }),
        );
      }
    }

    // Crear índices para mejorar el rendimiento
    await queryRunner.createIndex(
      'partners',
      new TableIndex({
        name: 'IDX_PARTNERS_EMAIL',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'partners',
      new TableIndex({
        name: 'IDX_PARTNERS_DOMAIN',
        columnNames: ['domain'],
      }),
    );

    await queryRunner.createIndex(
      'tenants',
      new TableIndex({
        name: 'IDX_TENANTS_PARTNER_ID',
        columnNames: ['partnerId'],
      }),
    );

    await queryRunner.createIndex(
      'branches',
      new TableIndex({
        name: 'IDX_BRANCHES_TENANT_ID',
        columnNames: ['tenantId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.dropIndex('branches', 'IDX_BRANCHES_TENANT_ID');
    await queryRunner.dropIndex('tenants', 'IDX_TENANTS_PARTNER_ID');
    await queryRunner.dropIndex('partners', 'IDX_PARTNERS_DOMAIN');
    await queryRunner.dropIndex('partners', 'IDX_PARTNERS_EMAIL');

    // Eliminar foreign keys
    await queryRunner.dropForeignKey('branches', 'FK_branches_tenantId');
    await queryRunner.dropForeignKey('tenant_features', 'FK_tenant_features_tenantId');
    await queryRunner.dropForeignKey('tenants', 'FK_tenants_partnerId');
    await queryRunner.dropForeignKey('partner_stats', 'FK_partner_stats_partnerId');
    await queryRunner.dropForeignKey('partner_limits', 'FK_partner_limits_partnerId');
    await queryRunner.dropForeignKey('partner_subscriptions', 'FK_partner_subscriptions_partnerId');

    // Eliminar tablas en orden inverso
    await queryRunner.dropTable('branches');
    await queryRunner.dropTable('tenant_features');
    await queryRunner.dropTable('tenants');
    await queryRunner.dropTable('partner_stats');
    await queryRunner.dropTable('partner_limits');
    await queryRunner.dropTable('partner_subscriptions');
    await queryRunner.dropTable('partners');
  }
}
