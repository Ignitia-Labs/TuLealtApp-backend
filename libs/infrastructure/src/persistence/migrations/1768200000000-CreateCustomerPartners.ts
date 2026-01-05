import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCustomerPartners1768200000000 implements MigrationInterface {
  name = 'CreateCustomerPartners1768200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const table = await queryRunner.getTable('customer_partners');
    if (table) {
      return; // La tabla ya existe, no hacer nada
    }

    // Crear tabla customer_partners
    await queryRunner.createTable(
      new Table({
        name: 'customer_partners',
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
            name: 'partnerId',
            type: 'int',
            isNullable: false,
            comment: 'FK a partners - ID del partner',
          },
          {
            name: 'tenantId',
            type: 'int',
            isNullable: false,
            comment: 'FK a tenants - ID del tenant específico del partner',
          },
          {
            name: 'registrationBranchId',
            type: 'int',
            isNullable: true,
            comment: 'FK a branches - Branch donde se registró el customer',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
            comment: 'Estado de la asociación: active, inactive o suspended',
          },
          {
            name: 'joinedDate',
            type: 'datetime',
            isNullable: false,
            comment: 'Fecha de asociación del customer con el partner',
          },
          {
            name: 'lastActivityDate',
            type: 'datetime',
            isNullable: true,
            comment: 'Fecha de última actividad del customer con este partner',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Datos adicionales flexibles en formato JSON',
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

    // Crear índices simples para búsquedas rápidas
    await queryRunner.createIndex(
      'customer_partners',
      new TableIndex({
        name: 'IDX_customer_partners_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'customer_partners',
      new TableIndex({
        name: 'IDX_customer_partners_partnerId',
        columnNames: ['partnerId'],
      }),
    );

    await queryRunner.createIndex(
      'customer_partners',
      new TableIndex({
        name: 'IDX_customer_partners_tenantId',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'customer_partners',
      new TableIndex({
        name: 'IDX_customer_partners_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'customer_partners',
      new TableIndex({
        name: 'IDX_customer_partners_joinedDate',
        columnNames: ['joinedDate'],
      }),
    );

    // Crear índices compuestos para consultas comunes
    await queryRunner.createIndex(
      'customer_partners',
      new TableIndex({
        name: 'IDX_customer_partners_user_partner',
        columnNames: ['userId', 'partnerId'],
      }),
    );

    await queryRunner.createIndex(
      'customer_partners',
      new TableIndex({
        name: 'IDX_customer_partners_partner_status',
        columnNames: ['partnerId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'customer_partners',
      new TableIndex({
        name: 'IDX_customer_partners_user_status',
        columnNames: ['userId', 'status'],
      }),
    );

    // Crear índice único compuesto para evitar duplicados (userId, partnerId, tenantId)
    await queryRunner.createIndex(
      'customer_partners',
      new TableIndex({
        name: 'UK_customer_partner_tenant',
        columnNames: ['userId', 'partnerId', 'tenantId'],
        isUnique: true,
      }),
    );

    // Crear foreign keys
    const customerPartnersTable = await queryRunner.getTable('customer_partners');
    if (customerPartnersTable) {
      // FK: userId -> users.id (CASCADE delete)
      const hasUserIdFk = customerPartnersTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('userId') !== -1,
      );
      if (!hasUserIdFk) {
        await queryRunner.createForeignKey(
          'customer_partners',
          new TableForeignKey({
            name: 'FK_CUSTOMER_PARTNERS_USER_ID',
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }

      // FK: partnerId -> partners.id (CASCADE delete)
      const hasPartnerIdFk = customerPartnersTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('partnerId') !== -1,
      );
      if (!hasPartnerIdFk) {
        await queryRunner.createForeignKey(
          'customer_partners',
          new TableForeignKey({
            name: 'FK_CUSTOMER_PARTNERS_PARTNER_ID',
            columnNames: ['partnerId'],
            referencedTableName: 'partners',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }

      // FK: tenantId -> tenants.id (CASCADE delete)
      const hasTenantIdFk = customerPartnersTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('tenantId') !== -1,
      );
      if (!hasTenantIdFk) {
        await queryRunner.createForeignKey(
          'customer_partners',
          new TableForeignKey({
            name: 'FK_CUSTOMER_PARTNERS_TENANT_ID',
            columnNames: ['tenantId'],
            referencedTableName: 'tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }

      // FK: registrationBranchId -> branches.id (SET NULL)
      const hasBranchIdFk = customerPartnersTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('registrationBranchId') !== -1,
      );
      if (!hasBranchIdFk) {
        await queryRunner.createForeignKey(
          'customer_partners',
          new TableForeignKey({
            name: 'FK_CUSTOMER_PARTNERS_REGISTRATION_BRANCH_ID',
            columnNames: ['registrationBranchId'],
            referencedTableName: 'branches',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys primero
    const customerPartnersTable = await queryRunner.getTable('customer_partners');
    if (customerPartnersTable) {
      const foreignKeys = customerPartnersTable.foreignKeys || [];
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('customer_partners', fk);
      }
    }

    // Eliminar índices (incluye el índice único)
    const indices = customerPartnersTable?.indices || [];
    for (const index of indices) {
      await queryRunner.dropIndex('customer_partners', index);
    }

    // Eliminar tabla
    await queryRunner.dropTable('customer_partners');
  }
}
