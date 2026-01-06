import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePartnerSubscriptionUsageTable1767737612191 implements MigrationInterface {
  name = 'CreatePartnerSubscriptionUsageTable1767737612191';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const table = await queryRunner.getTable('partner_subscription_usage');
    if (table) {
      console.log('Table partner_subscription_usage already exists. Skipping migration.');
      return;
    }

    // Crear tabla partner_subscription_usage
    await queryRunner.createTable(
      new Table({
        name: 'partner_subscription_usage',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'partnerSubscriptionId',
            type: 'int',
            isUnique: true,
            isNullable: false,
            comment: 'FK a partner_subscriptions - ID de la suscripción',
          },
          {
            name: 'tenantsCount',
            type: 'int',
            default: 0,
            comment: 'Número actual de tenants',
          },
          {
            name: 'branchesCount',
            type: 'int',
            default: 0,
            comment: 'Número actual de branches',
          },
          {
            name: 'customersCount',
            type: 'int',
            default: 0,
            comment: 'Número actual de customers',
          },
          {
            name: 'rewardsCount',
            type: 'int',
            default: 0,
            comment: 'Número actual de rewards',
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

    console.log('✅ Table partner_subscription_usage created.');

    // Crear índice único en partnerSubscriptionId
    await queryRunner.createIndex(
      'partner_subscription_usage',
      new TableIndex({
        name: 'IDX_partner_subscription_usage_subscription_id',
        columnNames: ['partnerSubscriptionId'],
        isUnique: true,
      }),
    );

    console.log('✅ Index created on partnerSubscriptionId.');

    // Crear foreign key a partner_subscriptions
    const partnersTable = await queryRunner.getTable('partner_subscriptions');
    if (partnersTable) {
      await queryRunner.createForeignKey(
        'partner_subscription_usage',
        new TableForeignKey({
          columnNames: ['partnerSubscriptionId'],
          referencedTableName: 'partner_subscriptions',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
      console.log('✅ Foreign key created to partner_subscriptions.');
    } else {
      console.warn('⚠️  Table partner_subscriptions does not exist. Skipping foreign key creation.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('partner_subscription_usage');
    if (!table) {
      console.warn('Table partner_subscription_usage does not exist. Skipping rollback.');
      return;
    }

    // Eliminar foreign keys
    const foreignKeys = table.foreignKeys;
    for (const fk of foreignKeys) {
      await queryRunner.dropForeignKey('partner_subscription_usage', fk);
    }

    // Eliminar índices
    const indexes = table.indices;
    for (const index of indexes) {
      await queryRunner.dropIndex('partner_subscription_usage', index);
    }

    // Eliminar tabla
    await queryRunner.dropTable('partner_subscription_usage');
    console.log('✅ Table partner_subscription_usage dropped.');
  }
}

