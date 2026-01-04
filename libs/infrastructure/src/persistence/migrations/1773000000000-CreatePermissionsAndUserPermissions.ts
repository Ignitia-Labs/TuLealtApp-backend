import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePermissionsAndUserPermissions1773000000000 implements MigrationInterface {
  name = 'CreatePermissionsAndUserPermissions1773000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si las tablas ya existen
    const permissionsTable = await queryRunner.getTable('permissions');
    const userPermissionsTable = await queryRunner.getTable('user_permissions');

    // Crear tabla permissions
    if (!permissionsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'permissions',
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
              length: '255',
              isNullable: false,
              isUnique: true,
              comment: 'Código del permiso (ej: "admin.users.create")',
            },
            {
              name: 'module',
              type: 'varchar',
              length: '100',
              isNullable: false,
              comment: 'Módulo (ej: "admin", "partner")',
            },
            {
              name: 'resource',
              type: 'varchar',
              length: '100',
              isNullable: false,
              comment: 'Recurso (ej: "users", "products")',
            },
            {
              name: 'action',
              type: 'varchar',
              length: '100',
              isNullable: false,
              comment: 'Acción (ej: "create", "view", "*")',
            },
            {
              name: 'description',
              type: 'text',
              isNullable: true,
              comment: 'Descripción del permiso',
            },
            {
              name: 'isActive',
              type: 'boolean',
              default: true,
              comment: 'Indica si el permiso está activo',
            },
            {
              name: 'createdAt',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
              comment: 'Fecha de creación',
            },
            {
              name: 'updatedAt',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
              onUpdate: 'CURRENT_TIMESTAMP',
              comment: 'Fecha de última actualización',
            },
          ],
        }),
        true,
      );

      // Crear índices para permissions
      await queryRunner.createIndex(
        'permissions',
        new TableIndex({
          name: 'idx_permissions_module',
          columnNames: ['module'],
        }),
      );

      await queryRunner.createIndex(
        'permissions',
        new TableIndex({
          name: 'idx_permissions_resource',
          columnNames: ['resource'],
        }),
      );

      await queryRunner.createIndex(
        'permissions',
        new TableIndex({
          name: 'idx_permissions_active',
          columnNames: ['isActive'],
        }),
      );

      await queryRunner.createIndex(
        'permissions',
        new TableIndex({
          name: 'idx_permissions_code',
          columnNames: ['code'],
        }),
      );
    }

    // Crear tabla user_permissions
    if (!userPermissionsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'user_permissions',
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
              comment: 'ID del usuario al que se asigna el permiso',
            },
            {
              name: 'permissionId',
              type: 'int',
              isNullable: false,
              comment: 'ID del permiso asignado',
            },
            {
              name: 'assignedBy',
              type: 'int',
              isNullable: false,
              comment: 'ID del usuario que asignó el permiso',
            },
            {
              name: 'assignedAt',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
              comment: 'Fecha de asignación del permiso',
            },
            {
              name: 'isActive',
              type: 'boolean',
              default: true,
              comment: 'Indica si la asignación está activa',
            },
          ],
        }),
        true,
      );

      // Crear índices para user_permissions
      await queryRunner.createIndex(
        'user_permissions',
        new TableIndex({
          name: 'idx_user_permissions_user',
          columnNames: ['userId'],
        }),
      );

      await queryRunner.createIndex(
        'user_permissions',
        new TableIndex({
          name: 'idx_user_permissions_permission',
          columnNames: ['permissionId'],
        }),
      );

      await queryRunner.createIndex(
        'user_permissions',
        new TableIndex({
          name: 'idx_user_permissions_active',
          columnNames: ['isActive'],
        }),
      );

      // Crear foreign keys
      await queryRunner.createForeignKey(
        'user_permissions',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'user_permissions',
        new TableForeignKey({
          columnNames: ['permissionId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'permissions',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'user_permissions',
        new TableForeignKey({
          columnNames: ['assignedBy'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        }),
      );

      // Crear índice único compuesto para evitar asignaciones duplicadas activas
      // Nota: La validación de lógica (solo una asignación activa) se manejará en la aplicación
      await queryRunner.createIndex(
        'user_permissions',
        new TableIndex({
          name: 'unique_user_permission_active',
          columnNames: ['userId', 'permissionId', 'isActive'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tabla user_permissions primero (por las foreign keys)
    const userPermissionsTable = await queryRunner.getTable('user_permissions');
    if (userPermissionsTable) {
      // Eliminar foreign keys
      const foreignKeys = userPermissionsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('user_permissions', fk);
      }

      // Eliminar índices
      const indices = userPermissionsTable.indices;
      for (const index of indices) {
        await queryRunner.dropIndex('user_permissions', index);
      }

      // Eliminar tabla
      await queryRunner.dropTable('user_permissions');
    }

    // Eliminar tabla permissions
    const permissionsTable = await queryRunner.getTable('permissions');
    if (permissionsTable) {
      // Eliminar índices
      const indices = permissionsTable.indices;
      for (const index of indices) {
        await queryRunner.dropIndex('permissions', index);
      }

      // Eliminar tabla
      await queryRunner.dropTable('permissions');
    }
  }
}

