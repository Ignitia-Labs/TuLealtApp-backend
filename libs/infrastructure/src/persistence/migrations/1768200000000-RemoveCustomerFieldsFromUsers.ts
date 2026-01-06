import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Migración para eliminar campos obsoletos de la tabla users
 *
 * Esta migración elimina los siguientes campos que ahora se manejan en customer_memberships:
 * - tenantId
 * - branchId
 * - points
 * - tierId
 * - qrCode
 *
 * ⚠️ IMPORTANTE: Esta migración debe ejecutarse DESPUÉS de migrar los datos a customer_memberships
 */
export class RemoveCustomerFieldsFromUsers1768200000000 implements MigrationInterface {
  name = 'RemoveCustomerFieldsFromUsers1768200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');
    if (!usersTable) {
      return; // La tabla no existe, no hacer nada
    }

    // Verificar que la tabla customer_memberships existe
    const customerMembershipsTable = await queryRunner.getTable('customer_memberships');
    if (!customerMembershipsTable) {
      throw new Error(
        'La tabla customer_memberships no existe. Ejecuta primero la migración CreateCustomerMemberships y migra los datos.',
      );
    }

    // Verificar que los datos se migraron (hay al menos una membership si hay usuarios con tenantId)
    const usersWithTenant = await queryRunner.query(
      'SELECT COUNT(*) as count FROM users WHERE tenantId IS NOT NULL',
    );
    if (usersWithTenant[0].count > 0) {
      const membershipsCount = await queryRunner.query(
        'SELECT COUNT(*) as count FROM customer_memberships',
      );
      if (membershipsCount[0].count === 0) {
        throw new Error(
          'Hay usuarios con tenantId pero no hay memberships. Ejecuta primero el seed de migración de datos.',
        );
      }
    }

    // Eliminar foreign keys relacionadas primero
    const foreignKeys = usersTable.foreignKeys || [];
    const fksToRemove = ['tenantId', 'branchId', 'tierId'];
    for (const fk of foreignKeys) {
      if (fksToRemove.some((col) => fk.columnNames.includes(col))) {
        await queryRunner.dropForeignKey('users', fk);
      }
    }

    // Eliminar índices relacionados
    const indices = usersTable.indices || [];
    const indicesToRemove = ['tenantId', 'branchId', 'points', 'tierId', 'qrCode'];
    for (const index of indices) {
      if (indicesToRemove.some((col) => index.columnNames.includes(col))) {
        await queryRunner.dropIndex('users', index);
      }
    }

    // Eliminar columnas
    const columnsToRemove = ['tenantId', 'branchId', 'points', 'tierId', 'qrCode'];
    for (const columnName of columnsToRemove) {
      const column = usersTable.findColumnByName(columnName);
      if (column) {
        await queryRunner.dropColumn('users', columnName);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');
    if (!usersTable) {
      return;
    }

    // Restaurar columnas (para rollback)
    const columnsToRestore = [
      {
        name: 'tenantId',
        type: 'int',
        isNullable: true,
      },
      {
        name: 'branchId',
        type: 'int',
        isNullable: true,
      },
      {
        name: 'points',
        type: 'int',
        default: 0,
      },
      {
        name: 'tierId',
        type: 'int',
        isNullable: true,
      },
      {
        name: 'qrCode',
        type: 'varchar',
        length: '100',
        isUnique: true,
        isNullable: true,
      },
    ];

    for (const columnDef of columnsToRestore) {
      const column = usersTable.findColumnByName(columnDef.name);
      if (!column) {
        await queryRunner.addColumn('users', new TableColumn(columnDef));
      }
    }

    // Restaurar foreign keys (solo si las tablas referenciadas existen)
    const tenantsTable = await queryRunner.getTable('tenants');
    if (tenantsTable && usersTable.findColumnByName('tenantId')) {
      const hasTenantIdFk = usersTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('tenantId') !== -1,
      );
      if (!hasTenantIdFk) {
        await queryRunner.createForeignKey(
          'users',
          new TableForeignKey({
            columnNames: ['tenantId'],
            referencedTableName: 'tenants',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      }
    }

    const branchesTable = await queryRunner.getTable('branches');
    if (branchesTable && usersTable.findColumnByName('branchId')) {
      const hasBranchIdFk = usersTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('branchId') !== -1,
      );
      if (!hasBranchIdFk) {
        await queryRunner.createForeignKey(
          'users',
          new TableForeignKey({
            columnNames: ['branchId'],
            referencedTableName: 'branches',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      }
    }

    const customerTiersTable = await queryRunner.getTable('customer_tiers');
    if (customerTiersTable && usersTable.findColumnByName('tierId')) {
      const hasTierIdFk = usersTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('tierId') !== -1,
      );
      if (!hasTierIdFk) {
        await queryRunner.createForeignKey(
          'users',
          new TableForeignKey({
            columnNames: ['tierId'],
            referencedTableName: 'customer_tiers',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      }
    }
  }
}



