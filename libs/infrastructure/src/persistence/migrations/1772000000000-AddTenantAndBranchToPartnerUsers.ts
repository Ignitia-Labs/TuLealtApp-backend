import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * Migración para agregar tenantId y branchId a la tabla users
 * Estos campos son opcionales y solo se usarán para usuarios PARTNER y PARTNER_STAFF
 * Los usuarios CUSTOMER usan customer_memberships para esta información
 */
export class AddTenantAndBranchToPartnerUsers1772000000000 implements MigrationInterface {
  name = 'AddTenantAndBranchToPartnerUsers1772000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');

    if (!usersTable) {
      throw new Error('Table users does not exist');
    }

    // Agregar tenantId solo si no existe
    if (!usersTable.findColumnByName('tenantId')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'tenantId',
          type: 'int',
          isNullable: true,
          comment: 'ID del tenant asociado (solo para usuarios PARTNER y PARTNER_STAFF)',
        }),
      );
    }

    // Agregar branchId solo si no existe
    if (!usersTable.findColumnByName('branchId')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'branchId',
          type: 'int',
          isNullable: true,
          comment: 'ID del branch asociado (solo para usuarios PARTNER y PARTNER_STAFF)',
        }),
      );
    }

    // Crear foreign key para tenantId
    const tenantIdFk = usersTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('tenantId') !== -1,
    );
    if (!tenantIdFk && usersTable.findColumnByName('tenantId')) {
      await queryRunner.createForeignKey(
        'users',
        new TableForeignKey({
          name: 'FK_users_tenantId',
          columnNames: ['tenantId'],
          referencedTableName: 'tenants',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // Crear foreign key para branchId
    const branchIdFk = usersTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('branchId') !== -1,
    );
    if (!branchIdFk && usersTable.findColumnByName('branchId')) {
      await queryRunner.createForeignKey(
        'users',
        new TableForeignKey({
          name: 'FK_users_branchId',
          columnNames: ['branchId'],
          referencedTableName: 'branches',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // Crear índice para tenantId
    const tenantIdIndex = usersTable.indices.find(
      (idx) => idx.name === 'IDX_users_tenantId' || idx.columnNames.indexOf('tenantId') !== -1,
    );
    if (!tenantIdIndex && usersTable.findColumnByName('tenantId')) {
      await queryRunner.createIndex(
        'users',
        new TableIndex({
          name: 'IDX_users_tenantId',
          columnNames: ['tenantId'],
        }),
      );
    }

    // Crear índice para branchId
    const branchIdIndex = usersTable.indices.find(
      (idx) => idx.name === 'IDX_users_branchId' || idx.columnNames.indexOf('branchId') !== -1,
    );
    if (!branchIdIndex && usersTable.findColumnByName('branchId')) {
      await queryRunner.createIndex(
        'users',
        new TableIndex({
          name: 'IDX_users_branchId',
          columnNames: ['branchId'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');

    if (!usersTable) {
      return;
    }

    // Eliminar índices
    const tenantIdIndex = usersTable.indices.find(
      (idx) => idx.name === 'IDX_users_tenantId' || idx.columnNames.indexOf('tenantId') !== -1,
    );
    if (tenantIdIndex) {
      await queryRunner.dropIndex('users', tenantIdIndex);
    }

    const branchIdIndex = usersTable.indices.find(
      (idx) => idx.name === 'IDX_users_branchId' || idx.columnNames.indexOf('branchId') !== -1,
    );
    if (branchIdIndex) {
      await queryRunner.dropIndex('users', branchIdIndex);
    }

    // Eliminar foreign keys
    const tenantIdFk = usersTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('tenantId') !== -1,
    );
    if (tenantIdFk) {
      await queryRunner.dropForeignKey('users', tenantIdFk);
    }

    const branchIdFk = usersTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('branchId') !== -1,
    );
    if (branchIdFk) {
      await queryRunner.dropForeignKey('users', branchIdFk);
    }

    // Eliminar columnas
    if (usersTable.findColumnByName('tenantId')) {
      await queryRunner.dropColumn('users', 'tenantId');
    }

    if (usersTable.findColumnByName('branchId')) {
      await queryRunner.dropColumn('users', 'branchId');
    }
  }
}

