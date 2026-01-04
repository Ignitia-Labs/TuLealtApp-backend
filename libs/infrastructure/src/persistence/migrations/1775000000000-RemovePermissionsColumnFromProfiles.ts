import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * ⚠️ ADVERTENCIA: Esta migración es DESTRUCTIVA
 *
 * Esta migración elimina la columna `permissions` (JSON) de la tabla `profiles`.
 * Solo ejecutar DESPUÉS de:
 * 1. Haber migrado todos los datos a la tabla `profile_permissions`
 * 2. Haber validado que todos los perfiles tienen sus permisos en `profile_permissions`
 * 3. Haber probado que la aplicación funciona correctamente sin el campo JSON
 * 4. Tener un backup completo de la base de datos
 *
 * Para validar antes de ejecutar:
 * - Ejecutar: npm run script:validate-permissions
 * - Verificar que todos los perfiles tienen relaciones en profile_permissions
 * - Probar creación/actualización/obtención de perfiles
 */
export class RemovePermissionsColumnFromProfiles1775000000000 implements MigrationInterface {
  name = 'RemovePermissionsColumnFromProfiles1775000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar que la tabla profile_permissions existe y tiene datos
    const profilePermissionsTable = await queryRunner.getTable('profile_permissions');
    if (!profilePermissionsTable) {
      throw new Error(
        'Cannot remove permissions column: profile_permissions table does not exist. Run CreateProfilePermissions migration first.',
      );
    }

    // Verificar que hay relaciones en profile_permissions
    const profilePermissionsCount = await queryRunner.query(
      'SELECT COUNT(*) as count FROM profile_permissions',
    );
    const count = parseInt(profilePermissionsCount[0]?.count || '0', 10);

    if (count === 0) {
      throw new Error(
        'Cannot remove permissions column: profile_permissions table is empty. Run migration script first.',
      );
    }

    // Verificar que todos los perfiles tienen al menos una relación en profile_permissions
    const profilesWithoutPermissions = await queryRunner.query(`
      SELECT p.id, p.name
      FROM profiles p
      LEFT JOIN profile_permissions pp ON p.id = pp.profileId
      WHERE pp.id IS NULL
    `);

    if (profilesWithoutPermissions.length > 0) {
      const profileNames = profilesWithoutPermissions.map((p: any) => `${p.name} (ID: ${p.id})`).join(', ');
      throw new Error(
        `Cannot remove permissions column: The following profiles do not have permissions in profile_permissions: ${profileNames}. Please migrate them first.`,
      );
    }

    // Si todas las validaciones pasan, eliminar la columna
    const table = await queryRunner.getTable('profiles');
    if (table) {
      const permissionsColumn = table.findColumnByName('permissions');
      if (permissionsColumn) {
        await queryRunner.dropColumn('profiles', 'permissions');
        console.log('✅ Successfully removed permissions column from profiles table');
      } else {
        console.log('⚠️  permissions column does not exist in profiles table (may have been removed already)');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Agregar la columna de vuelta (sin datos, solo estructura)
    const table = await queryRunner.getTable('profiles');
    if (table) {
      const permissionsColumn = table.findColumnByName('permissions');
      if (!permissionsColumn) {
        await queryRunner.addColumn(
          'profiles',
          new TableColumn({
            name: 'permissions',
            type: 'json',
            isNullable: true, // Nullable porque no podemos recuperar los datos originales
            comment: 'DEPRECATED: Permissions are now stored in profile_permissions table',
          }),
        );

        // Opcional: Intentar reconstruir los datos desde profile_permissions
        // Esto es una aproximación y puede no ser 100% exacto
        await queryRunner.query(`
          UPDATE profiles p
          SET permissions = (
            SELECT JSON_ARRAYAGG(perm.code)
            FROM profile_permissions pp
            INNER JOIN permissions perm ON pp.permissionId = perm.id
            WHERE pp.profileId = p.id
            AND pp.isActive = true
          )
          WHERE EXISTS (
            SELECT 1 FROM profile_permissions pp WHERE pp.profileId = p.id
          )
        `);

        console.log('✅ Successfully restored permissions column to profiles table');
        console.log('⚠️  Note: Permissions were reconstructed from profile_permissions table');
      } else {
        console.log('⚠️  permissions column already exists in profiles table');
      }
    }
  }
}

