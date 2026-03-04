import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Añade columnas opcionales avatar_id y avatar_background a users.
 * Ambas nullable, sin valor por defecto (NULL implícito).
 * No modifica registros existentes.
 */
export class AddAvatarIdAndAvatarBackgroundToUsers1811000000000 implements MigrationInterface {
  name = 'AddAvatarIdAndAvatarBackgroundToUsers1811000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    if (!table) {
      return;
    }

    if (!table.findColumnByName('avatarId')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'avatarId',
          type: 'varchar',
          length: '255',
          isNullable: true,
          comment: 'Identificador del avatar (numérico o string). Opcional.',
        }),
      );
    }

    if (!table.findColumnByName('avatarBackground')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'avatarBackground',
          type: 'varchar',
          length: '512',
          isNullable: true,
          comment: 'Gradient o color de fondo del avatar. Opcional.',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    if (!table) {
      return;
    }

    if (table.findColumnByName('avatarBackground')) {
      await queryRunner.dropColumn('users', 'avatarBackground');
    }
    if (table.findColumnByName('avatarId')) {
      await queryRunner.dropColumn('users', 'avatarId');
    }
  }
}
