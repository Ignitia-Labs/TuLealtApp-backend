import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateUserChangeHistory1771000000000 implements MigrationInterface {
  name = 'CreateUserChangeHistory1771000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const table = await queryRunner.getTable('user_change_history');

    if (!table) {
      await queryRunner.createTable(
        new Table({
          name: 'user_change_history',
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
              comment: 'ID del usuario que fue modificado',
            },
            {
              name: 'changedBy',
              type: 'int',
              isNullable: false,
              comment: 'ID del usuario que realizó el cambio',
            },
            {
              name: 'action',
              type: 'varchar',
              length: '50',
              isNullable: false,
              comment: 'Tipo de acción realizada (created, updated, locked, unlocked, deleted, etc.)',
            },
            {
              name: 'field',
              type: 'varchar',
              length: '100',
              isNullable: true,
              comment: 'Campo que fue modificado (null si es una acción general)',
            },
            {
              name: 'oldValue',
              type: 'text',
              isNullable: true,
              comment: 'Valor anterior del campo (null si es creación)',
            },
            {
              name: 'newValue',
              type: 'text',
              isNullable: true,
              comment: 'Nuevo valor del campo (null si es eliminación)',
            },
            {
              name: 'metadata',
              type: 'json',
              isNullable: true,
              comment: 'Información adicional sobre el cambio en formato JSON',
            },
            {
              name: 'createdAt',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
              comment: 'Fecha y hora en que se registró el cambio',
            },
          ],
        }),
        true,
      );

      // Crear índices
      await queryRunner.createIndex(
        'user_change_history',
        new TableIndex({
          name: 'idx_user_change_history_user',
          columnNames: ['userId'],
        }),
      );

      await queryRunner.createIndex(
        'user_change_history',
        new TableIndex({
          name: 'idx_user_change_history_changed_by',
          columnNames: ['changedBy'],
        }),
      );

      await queryRunner.createIndex(
        'user_change_history',
        new TableIndex({
          name: 'idx_user_change_history_action',
          columnNames: ['action'],
        }),
      );

      await queryRunner.createIndex(
        'user_change_history',
        new TableIndex({
          name: 'idx_user_change_history_created_at',
          columnNames: ['createdAt'],
        }),
      );

      // Crear foreign keys
      await queryRunner.createForeignKey(
        'user_change_history',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'user_change_history',
        new TableForeignKey({
          columnNames: ['changedBy'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_change_history');
    if (table) {
      // Eliminar foreign keys
      const foreignKeys = table.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('user_change_history', fk);
      }

      // Eliminar índices
      const indices = table.indices;
      for (const index of indices) {
        await queryRunner.dropIndex('user_change_history', index);
      }

      // Eliminar tabla
      await queryRunner.dropTable('user_change_history');
    }
  }
}

