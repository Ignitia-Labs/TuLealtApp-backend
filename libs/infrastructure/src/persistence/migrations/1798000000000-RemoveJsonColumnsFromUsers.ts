import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración: Remover columnas JSON antiguas de users
 *
 * Esta migración elimina las columnas JSON antiguas después de:
 * 1. Ejecutar la migración de datos
 * 2. Validar que todo funciona correctamente con datos relacionales
 * 3. Tener un período de gracia donde ambos sistemas coexisten
 *
 * ⚠️ ADVERTENCIA: Esta migración es IRREVERSIBLE.
 * Una vez ejecutada, los datos JSON originales se perderán.
 * Asegúrate de tener backups completos antes de ejecutar.
 *
 * Fase 4.1.5 del Plan de Eliminación de Tipos JSON
 */
export class RemoveJsonColumnsFromUsers1798000000000 implements MigrationInterface {
  name = 'RemoveJsonColumnsFromUsers1798000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');

    if (!usersTable) {
      throw new Error('Tabla users no existe');
    }

    // ============================================================================
    // VALIDACIÓN PREVIA: Verificar que las tablas relacionadas tienen datos
    // ============================================================================

    const totalRecords = await queryRunner.query(`SELECT COUNT(*) as count FROM users`);

    if (totalRecords[0].count === 0) {
      console.warn('⚠️  Advertencia: No hay registros en users. Continuando...');
    } else {
      // Verificar que hay roles migrados (si hay usuarios con roles)
      const usersWithRoles = await queryRunner.query(
        `SELECT COUNT(DISTINCT u.id) as count
         FROM users u
         WHERE u.roles IS NOT NULL
           AND JSON_LENGTH(u.roles) > 0`,
      );

      const migratedRoles = await queryRunner.query(`SELECT COUNT(*) as count FROM user_roles`);

      if (usersWithRoles[0].count > 0 && migratedRoles[0].count === 0) {
        throw new Error(
          `No se pueden remover columnas JSON: Hay usuarios con roles pero no hay datos migrados. ` +
            `Usuarios con roles: ${usersWithRoles[0].count}, ` +
            `Roles migrados: ${migratedRoles[0].count}. ` +
            `Ejecutar primero el script de migración de datos.`,
        );
      }

      // Verificar que hay profile data migrado (si hay usuarios con profile)
      const usersWithProfile = await queryRunner.query(
        `SELECT COUNT(DISTINCT u.id) as count
         FROM users u
         WHERE u.profile IS NOT NULL
           AND JSON_LENGTH(u.profile) > 0`,
      );

      const migratedProfileData = await queryRunner.query(
        `SELECT COUNT(*) as count FROM user_profile_data`,
      );

      if (usersWithProfile[0].count > 0 && migratedProfileData[0].count === 0) {
        throw new Error(
          `No se pueden remover columnas JSON: Hay usuarios con profile pero no hay datos migrados. ` +
            `Usuarios con profile: ${usersWithProfile[0].count}, ` +
            `Profile data migrado: ${migratedProfileData[0].count}. ` +
            `Ejecutar primero el script de migración de datos.`,
        );
      }
    }

    // ============================================================================
    // REMOVER COLUMNAS JSON
    // ============================================================================

    console.log('🗑️  Removiendo columnas JSON antiguas de users...');

    // Remover roles JSON
    if (usersTable.findColumnByName('roles')) {
      await queryRunner.dropColumn('users', 'roles');
      console.log('  ✓ Columna roles removida');
    }

    // Remover profile JSON
    if (usersTable.findColumnByName('profile')) {
      await queryRunner.dropColumn('users', 'profile');
      console.log('  ✓ Columna profile removida');
    }

    console.log('✅ Columnas JSON removidas exitosamente de users');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ⚠️ ADVERTENCIA: Esta operación NO puede restaurar los datos JSON originales
    // Solo restaura la estructura de columnas con valores NULL/default

    const usersTable = await queryRunner.getTable('users');

    if (!usersTable) {
      return;
    }

    console.log('⚠️  ADVERTENCIA: Restaurando columnas JSON (sin datos originales)');

    // Restaurar columnas JSON (sin datos)
    if (!usersTable.findColumnByName('roles')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'roles',
          type: 'json',
          isNullable: true,
          comment: 'DEPRECATED: Usar tabla user_roles en su lugar',
        }),
      );
    }

    if (!usersTable.findColumnByName('profile')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'profile',
          type: 'json',
          isNullable: true,
          comment: 'DEPRECATED: Usar tabla user_profile_data en su lugar',
        }),
      );
    }

    console.log('⚠️  Columnas JSON restauradas (sin datos originales)');
    console.log('⚠️  Los datos JSON originales NO pueden ser restaurados desde esta migración');
  }
}
