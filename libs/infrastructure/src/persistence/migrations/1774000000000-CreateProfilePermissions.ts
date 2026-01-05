import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateProfilePermissions1774000000000 implements MigrationInterface {
  name = 'CreateProfilePermissions1774000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const profilePermissionsTable = await queryRunner.getTable('profile_permissions');

    // Crear tabla profile_permissions
    if (!profilePermissionsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'profile_permissions',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'profileId',
              type: 'int',
              isNullable: false,
              comment: 'ID del perfil',
            },
            {
              name: 'permissionId',
              type: 'int',
              isNullable: false,
              comment: 'ID del permiso',
            },
            {
              name: 'createdAt',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
              comment: 'Fecha de creación de la relación',
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

      // Crear índices para profile_permissions
      await queryRunner.createIndex(
        'profile_permissions',
        new TableIndex({
          name: 'idx_profile_permissions_profile',
          columnNames: ['profileId'],
        }),
      );

      await queryRunner.createIndex(
        'profile_permissions',
        new TableIndex({
          name: 'idx_profile_permissions_permission',
          columnNames: ['permissionId'],
        }),
      );

      // Crear foreign keys
      await queryRunner.createForeignKey(
        'profile_permissions',
        new TableForeignKey({
          columnNames: ['profileId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'profiles',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'profile_permissions',
        new TableForeignKey({
          columnNames: ['permissionId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'permissions',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );

      // Crear índice único compuesto para evitar relaciones duplicadas
      await queryRunner.createIndex(
        'profile_permissions',
        new TableIndex({
          name: 'unique_profile_permission',
          columnNames: ['profileId', 'permissionId'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tabla profile_permissions
    const profilePermissionsTable = await queryRunner.getTable('profile_permissions');
    if (profilePermissionsTable) {
      // Eliminar foreign keys
      const foreignKeys = profilePermissionsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('profile_permissions', fk);
      }

      // Eliminar índices
      const indices = profilePermissionsTable.indices;
      for (const index of indices) {
        await queryRunner.dropIndex('profile_permissions', index);
      }

      // Eliminar tabla
      await queryRunner.dropTable('profile_permissions');
    }
  }
}
