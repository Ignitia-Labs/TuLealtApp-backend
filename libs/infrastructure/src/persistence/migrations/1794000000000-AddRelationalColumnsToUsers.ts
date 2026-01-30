import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Migración: Agregar columnas relacionales a users
 *
 * Esta migración agrega nuevas tablas relacionadas para reemplazar
 * los campos JSON en users. Los campos JSON se mantienen temporalmente
 * hasta que se migren los datos y se valide la integridad.
 *
 * Fase 4.1 del Plan de Eliminación de Tipos JSON
 */
export class AddRelationalColumnsToUsers1794000000000 implements MigrationInterface {
  name = 'AddRelationalColumnsToUsers1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================================
    // 1. CREAR TABLA user_roles (Many-to-Many entre users y roles)
    // ============================================================================
    const userRolesTableExists = await queryRunner.hasTable('user_roles');
    if (!userRolesTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'user_roles',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
              comment: 'ID único de la asignación de rol',
            },
            {
              name: 'user_id',
              type: 'int',
              isNullable: false,
              comment: 'FK a users',
            },
            {
              name: 'role',
              type: 'varchar',
              length: '50',
              isNullable: false,
              comment: 'Nombre del rol (ej: ADMIN, PARTNER, CUSTOMER, etc.)',
            },
          ],
        }),
        true,
      );

      // Crear foreign key
      await queryRunner.createForeignKey(
        'user_roles',
        new TableForeignKey({
          name: 'FK_USER_ROLES_USER_ID',
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      // Crear índices
      await queryRunner.createIndex(
        'user_roles',
        new TableIndex({
          name: 'IDX_USER_ROLES_USER_ID',
          columnNames: ['user_id'],
        }),
      );

      await queryRunner.createIndex(
        'user_roles',
        new TableIndex({
          name: 'IDX_USER_ROLES_ROLE',
          columnNames: ['role'],
        }),
      );

      // Crear unique constraint para (user_id, role) para evitar duplicados
      await queryRunner.createIndex(
        'user_roles',
        new TableIndex({
          name: 'UK_USER_ROLES_USER_ROLE',
          columnNames: ['user_id', 'role'],
          isUnique: true,
        }),
      );
    }

    // ============================================================================
    // 2. CREAR TABLA user_profile_data (para datos adicionales del profile JSON)
    // ============================================================================
    // NOTA: Como profile es Record<string, any> y puede tener estructura variable,
    // creamos una tabla clave-valor para almacenar los datos del profile.
    // Si el profile es null o vacío, no habrá registros en esta tabla.
    const userProfileDataTableExists = await queryRunner.hasTable('user_profile_data');
    if (!userProfileDataTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'user_profile_data',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
              comment: 'ID único del dato de perfil',
            },
            {
              name: 'user_id',
              type: 'int',
              isNullable: false,
              comment: 'FK a users',
            },
            {
              name: 'key',
              type: 'varchar',
              length: '100',
              isNullable: false,
              comment: 'Clave del dato (ej: preferences.language, preferences.theme)',
            },
            {
              name: 'value',
              type: 'text',
              isNullable: true,
              comment: 'Valor del dato (serializado como JSON si es complejo)',
            },
          ],
        }),
        true,
      );

      // Crear foreign key
      await queryRunner.createForeignKey(
        'user_profile_data',
        new TableForeignKey({
          name: 'FK_USER_PROFILE_DATA_USER_ID',
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      // Crear índices
      await queryRunner.createIndex(
        'user_profile_data',
        new TableIndex({
          name: 'IDX_USER_PROFILE_DATA_USER_ID',
          columnNames: ['user_id'],
        }),
      );

      await queryRunner.createIndex(
        'user_profile_data',
        new TableIndex({
          name: 'IDX_USER_PROFILE_DATA_KEY',
          columnNames: ['key'],
        }),
      );

      // Crear unique constraint para (user_id, key) para evitar duplicados
      await queryRunner.createIndex(
        'user_profile_data',
        new TableIndex({
          name: 'UK_USER_PROFILE_DATA_USER_KEY',
          columnNames: ['user_id', 'key'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tablas relacionadas primero
    if (await queryRunner.hasTable('user_profile_data')) {
      await queryRunner.dropTable('user_profile_data');
    }

    if (await queryRunner.hasTable('user_roles')) {
      await queryRunner.dropTable('user_roles');
    }
  }
}
