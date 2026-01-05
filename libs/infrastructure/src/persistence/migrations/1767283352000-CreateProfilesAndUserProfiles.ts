import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateProfilesAndUserProfiles1767283352000 implements MigrationInterface {
  name = 'CreateProfilesAndUserProfiles1767283352000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si las tablas ya existen
    const profilesTable = await queryRunner.getTable('profiles');
    const userProfilesTable = await queryRunner.getTable('user_profiles');

    // Crear tabla profiles
    if (!profilesTable) {
      await queryRunner.createTable(
        new Table({
          name: 'profiles',
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
              isNullable: false,
              comment: 'Nombre del perfil (ej: "Gerente de Tienda", "Vendedor")',
            },
            {
              name: 'description',
              type: 'text',
              isNullable: true,
              comment: 'Descripción del perfil',
            },
            {
              name: 'partnerId',
              type: 'int',
              isNullable: true,
              comment: 'ID del partner. NULL = perfil global del sistema',
            },
            {
              name: 'permissions',
              type: 'json',
              isNullable: false,
              comment: 'Array de permisos en formato ["module.resource.action", ...]',
            },
            {
              name: 'isActive',
              type: 'boolean',
              default: true,
              comment: 'Indica si el perfil está activo',
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

      // Crear índices para profiles
      await queryRunner.createIndex(
        'profiles',
        new TableIndex({
          name: 'idx_profiles_partner',
          columnNames: ['partnerId'],
        }),
      );

      await queryRunner.createIndex(
        'profiles',
        new TableIndex({
          name: 'idx_profiles_active',
          columnNames: ['isActive'],
        }),
      );

      // Crear foreign key a partners
      await queryRunner.createForeignKey(
        'profiles',
        new TableForeignKey({
          columnNames: ['partnerId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'partners',
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // Crear tabla user_profiles
    if (!userProfilesTable) {
      await queryRunner.createTable(
        new Table({
          name: 'user_profiles',
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
              comment: 'ID del usuario al que se asigna el perfil',
            },
            {
              name: 'profileId',
              type: 'int',
              isNullable: false,
              comment: 'ID del perfil asignado',
            },
            {
              name: 'assignedBy',
              type: 'int',
              isNullable: false,
              comment: 'ID del usuario que asignó el perfil',
            },
            {
              name: 'assignedAt',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
              comment: 'Fecha de asignación del perfil',
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

      // Crear índices para user_profiles
      await queryRunner.createIndex(
        'user_profiles',
        new TableIndex({
          name: 'idx_user_profiles_user',
          columnNames: ['userId'],
        }),
      );

      await queryRunner.createIndex(
        'user_profiles',
        new TableIndex({
          name: 'idx_user_profiles_profile',
          columnNames: ['profileId'],
        }),
      );

      await queryRunner.createIndex(
        'user_profiles',
        new TableIndex({
          name: 'idx_user_profiles_active',
          columnNames: ['isActive'],
        }),
      );

      // Crear foreign keys
      await queryRunner.createForeignKey(
        'user_profiles',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'user_profiles',
        new TableForeignKey({
          columnNames: ['profileId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'profiles',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'user_profiles',
        new TableForeignKey({
          columnNames: ['assignedBy'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        }),
      );

      // Crear índice único compuesto para evitar asignaciones duplicadas activas
      // Nota: TypeORM no soporta directamente UNIQUE con condición WHERE, así que usamos un índice único simple
      // La validación de lógica (solo una asignación activa) se manejará en la aplicación
      await queryRunner.createIndex(
        'user_profiles',
        new TableIndex({
          name: 'unique_user_profile_active',
          columnNames: ['userId', 'profileId', 'isActive'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tabla user_profiles primero (por las foreign keys)
    const userProfilesTable = await queryRunner.getTable('user_profiles');
    if (userProfilesTable) {
      // Eliminar foreign keys
      const foreignKeys = userProfilesTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('user_profiles', fk);
      }

      // Eliminar índices
      const indices = userProfilesTable.indices;
      for (const index of indices) {
        await queryRunner.dropIndex('user_profiles', index);
      }

      // Eliminar tabla
      await queryRunner.dropTable('user_profiles');
    }

    // Eliminar tabla profiles
    const profilesTable = await queryRunner.getTable('profiles');
    if (profilesTable) {
      // Eliminar foreign keys
      const foreignKeys = profilesTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('profiles', fk);
      }

      // Eliminar índices
      const indices = profilesTable.indices;
      for (const index of indices) {
        await queryRunner.dropIndex('profiles', index);
      }

      // Eliminar tabla
      await queryRunner.dropTable('profiles');
    }
  }
}
