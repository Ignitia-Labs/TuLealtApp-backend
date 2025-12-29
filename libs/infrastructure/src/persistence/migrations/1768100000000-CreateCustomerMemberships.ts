import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateCustomerMemberships1768100000000 implements MigrationInterface {
  name = 'CreateCustomerMemberships1768100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const table = await queryRunner.getTable('customer_memberships');
    if (table) {
      return; // La tabla ya existe, no hacer nada
    }

    // Crear tabla customer_memberships
    await queryRunner.createTable(
      new Table({
        name: 'customer_memberships',
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
            isNullable: false,
            comment: 'FK a users - ID del usuario (customer)',
          },
          {
            name: 'tenantId',
            type: 'int',
            isNullable: false,
            comment: 'FK a tenants - ID del tenant (merchant)',
          },
          {
            name: 'registrationBranchId',
            type: 'int',
            isNullable: false,
            comment: 'FK a branches - Branch donde se registró el customer',
          },
          {
            name: 'points',
            type: 'int',
            default: 0,
            comment: 'Puntos específicos de este tenant',
          },
          {
            name: 'tierId',
            type: 'int',
            isNullable: true,
            comment: 'FK a customer_tiers - Tier actual del customer en este tenant',
          },
          {
            name: 'totalSpent',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            comment: 'Total gastado en este tenant',
          },
          {
            name: 'totalVisits',
            type: 'int',
            default: 0,
            comment: 'Total de visitas a este tenant',
          },
          {
            name: 'lastVisit',
            type: 'datetime',
            isNullable: true,
            comment: 'Fecha de la última visita',
          },
          {
            name: 'joinedDate',
            type: 'datetime',
            isNullable: false,
            comment: 'Fecha de registro en este tenant',
          },
          {
            name: 'qrCode',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: true,
            comment: 'QR code único específico por tenant',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
            comment: 'Estado de la membership: active o inactive',
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

    // Crear índices
    await queryRunner.createIndex(
      'customer_memberships',
      new TableIndex({
        name: 'IDX_CUSTOMER_MEMBERSHIPS_USER_ID',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'customer_memberships',
      new TableIndex({
        name: 'IDX_CUSTOMER_MEMBERSHIPS_TENANT_ID',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'customer_memberships',
      new TableIndex({
        name: 'IDX_CUSTOMER_MEMBERSHIPS_QR_CODE',
        columnNames: ['qrCode'],
      }),
    );

    // Crear índice único compuesto para UNIQUE(userId, tenantId)
    // MySQL/MariaDB no soporta TableUnique directamente, usar índice único
    await queryRunner.createIndex(
      'customer_memberships',
      new TableIndex({
        name: 'IDX_CUSTOMER_MEMBERSHIPS_USER_TENANT_UNIQUE',
        columnNames: ['userId', 'tenantId'],
        isUnique: true,
      }),
    );

    // Crear foreign keys
    const customerMembershipsTable = await queryRunner.getTable('customer_memberships');
    if (customerMembershipsTable) {
      // FK: userId -> users.id (CASCADE delete)
      const hasUserIdFk = customerMembershipsTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('userId') !== -1,
      );
      if (!hasUserIdFk) {
        await queryRunner.createForeignKey(
          'customer_memberships',
          new TableForeignKey({
            name: 'FK_CUSTOMER_MEMBERSHIPS_USER_ID',
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }

      // FK: tenantId -> tenants.id (CASCADE delete)
      const hasTenantIdFk = customerMembershipsTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('tenantId') !== -1,
      );
      if (!hasTenantIdFk) {
        await queryRunner.createForeignKey(
          'customer_memberships',
          new TableForeignKey({
            name: 'FK_CUSTOMER_MEMBERSHIPS_TENANT_ID',
            columnNames: ['tenantId'],
            referencedTableName: 'tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }

      // FK: registrationBranchId -> branches.id (SET NULL)
      const hasBranchIdFk = customerMembershipsTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('registrationBranchId') !== -1,
      );
      if (!hasBranchIdFk) {
        await queryRunner.createForeignKey(
          'customer_memberships',
          new TableForeignKey({
            name: 'FK_CUSTOMER_MEMBERSHIPS_REGISTRATION_BRANCH_ID',
            columnNames: ['registrationBranchId'],
            referencedTableName: 'branches',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      }

      // FK: tierId -> customer_tiers.id (SET NULL)
      const hasTierIdFk = customerMembershipsTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('tierId') !== -1,
      );
      if (!hasTierIdFk) {
        await queryRunner.createForeignKey(
          'customer_memberships',
          new TableForeignKey({
            name: 'FK_CUSTOMER_MEMBERSHIPS_TIER_ID',
            columnNames: ['tierId'],
            referencedTableName: 'customer_tiers',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys primero
    const customerMembershipsTable = await queryRunner.getTable('customer_memberships');
    if (customerMembershipsTable) {
      const foreignKeys = customerMembershipsTable.foreignKeys || [];
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('customer_memberships', fk);
      }
    }

    // Eliminar índices (incluye el índice único)
    const indices = customerMembershipsTable?.indices || [];
    for (const index of indices) {
      await queryRunner.dropIndex('customer_memberships', index);
    }

    // Eliminar tabla
    await queryRunner.dropTable('customer_memberships');
  }
}

