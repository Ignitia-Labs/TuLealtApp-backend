import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure.module';
import {
  IProfileRepository,
  IPermissionRepository,
  IProfilePermissionRepository,
  Profile,
  Permission,
  ProfilePermission,
} from '@libs/domain';
import { ProfileEntity } from '@libs/infrastructure/entities/auth/profile.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProfileMapper } from '@libs/infrastructure/mappers/auth/profile.mapper';

/**
 * Módulo específico para el script de migración de permisos de perfiles
 * Incluye todos los repositorios necesarios
 */
@Module({
  imports: [InfrastructureModule, TypeOrmModule.forFeature([ProfileEntity])],
})
class MigrationScriptModule {}

// Cargar variables de entorno antes de inicializar la aplicación
if (process.env.NODE_ENV !== 'production') {
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envLocalPath });

  if (!process.env.DB_HOST) {
    const envPath = path.resolve(process.cwd(), '.env');
    dotenv.config({ path: envPath });
  }
} else {
  dotenv.config();
}

interface MigrationResult {
  success: boolean;
  stats: {
    totalProfiles: number;
    profilesProcessed: number;
    profilesSkipped: number;
    profilesWithErrors: number;
    totalPermissionsMigrated: number;
    permissionsNotFound: string[];
    errors: Array<{ profileId: number; profileName: string; error: string }>;
  };
}

/**
 * Script para migrar permisos de perfiles desde JSON a tabla profile_permissions
 *
 * Este script:
 * 1. Lee todos los perfiles existentes
 * 2. Para cada perfil, extrae su array permissions (JSON)
 * 3. Busca cada permiso en la tabla permissions por código
 * 4. Crea registros en profile_permissions con profileId y permissionId
 * 5. Valida que todos los permisos existan en el catálogo
 * 6. Genera reporte de migración
 *
 * Uso:
 * npm run script:migrate-profile-permissions
 * o
 * ts-node -r tsconfig-paths/register libs/infrastructure/src/scripts/migrate-profile-permissions.ts
 */
async function bootstrap() {
  const logger = new Logger('MigrateProfilePermissions');

  console.log('========================================');
  console.log('🔄 Migración de Permisos de Perfiles');
  console.log('De JSON a tabla profile_permissions');
  console.log('========================================\n');

  try {
    // Crear aplicación NestJS para tener acceso a la inyección de dependencias
    const app = await NestFactory.createApplicationContext(MigrationScriptModule, {
      logger: ['log', 'error', 'warn'],
    });

    // Obtener repositorios del contenedor de dependencias
    const profileRepository = app.get<IProfileRepository>('IProfileRepository');
    const permissionRepository = app.get<IPermissionRepository>('IPermissionRepository');
    const profilePermissionRepository = app.get<IProfilePermissionRepository>(
      'IProfilePermissionRepository',
    );

    // Obtener el repositorio de TypeORM directamente para hacer queries más específicas
    let profileEntityRepository: Repository<ProfileEntity>;
    try {
      profileEntityRepository = app.get(getRepositoryToken(ProfileEntity));
    } catch (error) {
      // Si no se puede obtener con el token, intentar obtenerlo del DataSource
      const dataSource = app.get(DataSource);
      if (dataSource) {
        profileEntityRepository = dataSource.getRepository(ProfileEntity);
      } else {
        throw new Error('No se pudo obtener el repositorio de ProfileEntity ni el DataSource.');
      }
    }

    const result: MigrationResult = {
      success: true,
      stats: {
        totalProfiles: 0,
        profilesProcessed: 0,
        profilesSkipped: 0,
        profilesWithErrors: 0,
        totalPermissionsMigrated: 0,
        permissionsNotFound: [],
        errors: [],
      },
    };

    // 1. Verificar si la columna permissions existe en la tabla
    logger.log('Verificando estructura de la tabla profiles...');
    const dataSource = app.get(DataSource);
    const table = await dataSource.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'profiles'
      AND COLUMN_NAME = 'permissions'
    `);
    const hasPermissionsColumn = table.length > 0;

    if (!hasPermissionsColumn) {
      logger.warn('⚠️  La columna permissions ya no existe en la tabla profiles.');
      logger.warn('Esto significa que la migración de limpieza ya se ejecutó.');
      logger.warn('El script verificará si los perfiles tienen permisos en profile_permissions.\n');
    }

    // 1. Obtener todos los perfiles
    logger.log('Obteniendo todos los perfiles...');
    const profileEntities = await profileEntityRepository.find({
      select: hasPermissionsColumn
        ? undefined // Seleccionar todas las columnas si permissions existe
        : ['id', 'name', 'description', 'partnerId', 'isActive', 'createdAt', 'updatedAt'], // Excluir permissions si no existe
      order: {
        partnerId: 'ASC',
        name: 'ASC',
      },
    });

    const profiles = profileEntities.map((entity) => ProfileMapper.toDomain(entity));
    result.stats.totalProfiles = profiles.length;
    logger.log(`Encontrados ${profiles.length} perfiles\n`);

    if (profiles.length === 0) {
      console.log('✅ No hay perfiles para migrar.');
      await app.close();
      process.exit(0);
    }

    // 2. Obtener todos los permisos del catálogo para mapeo rápido
    logger.log('Obteniendo catálogo de permisos...');
    const catalogPermissions = await permissionRepository.findAll();
    const permissionMap = new Map<string, Permission>();
    catalogPermissions.forEach((p) => {
      permissionMap.set(p.code, p);
    });
    logger.log(`Catálogo cargado: ${catalogPermissions.length} permisos\n`);

    // 3. Verificar si ya existen relaciones en profile_permissions
    logger.log('Verificando estado de migración...');
    const existingRelations = await profilePermissionRepository.findByProfileId(profiles[0].id);
    if (existingRelations.length > 0) {
      logger.warn(
        `⚠️  Ya existen ${existingRelations.length} relaciones en profile_permissions para el primer perfil.`,
      );
      logger.warn('Esto sugiere que la migración ya se ejecutó parcialmente.');
      logger.warn('El script continuará pero puede crear duplicados.\n');
    }

    // 4. Procesar cada perfil
    logger.log('Iniciando migración de permisos...\n');

    for (const profile of profiles) {
      try {
        logger.log(
          `[${result.stats.profilesProcessed + result.stats.profilesSkipped + result.stats.profilesWithErrors + 1}/${profiles.length}] Procesando perfil: "${profile.name}" (ID: ${profile.id})`,
        );

        // Verificar si ya tiene relaciones migradas
        const existingProfilePermissions = await profilePermissionRepository.findByProfileId(
          profile.id,
        );

        if (existingProfilePermissions.length > 0) {
          logger.log(
            `  ⏭️  Perfil ya tiene ${existingProfilePermissions.length} permisos migrados. Saltando...`,
          );
          result.stats.profilesSkipped++;
          continue;
        }

        // Extraer permisos del JSON (si la columna existe) o desde profile_permissions
        let permissionCodes: string[] = [];

        if (hasPermissionsColumn && profile.permissions && profile.permissions.length > 0) {
          // Si la columna existe y tiene datos, usar esos
          permissionCodes = profile.permissions;
        } else {
          // Si la columna no existe o está vacía, verificar si ya hay permisos en profile_permissions
          const existingPermissions = await profilePermissionRepository.findByProfileId(profile.id);
          if (existingPermissions.length > 0) {
            // Ya tiene permisos migrados, obtener códigos desde profile_permissions
            const permissionIds = existingPermissions.map((pp) => pp.permissionId);
            for (const permissionId of permissionIds) {
              const permission = await permissionRepository.findById(permissionId);
              if (permission) {
                permissionCodes.push(permission.code);
              }
            }
            logger.log(
              `  ℹ️  Perfil ya tiene ${permissionCodes.length} permisos en profile_permissions.`,
            );
          }
        }

        if (permissionCodes.length === 0) {
          logger.log(`  ⚠️  Perfil no tiene permisos. Saltando...`);
          result.stats.profilesSkipped++;
          continue;
        }

        logger.log(`  📋 Permisos encontrados: ${permissionCodes.length}`);

        // Buscar cada permiso en el catálogo y crear relaciones
        const profilePermissionsToCreate: ProfilePermission[] = [];
        const notFoundPermissions: string[] = [];

        for (const permissionCode of permissionCodes) {
          const permission = permissionMap.get(permissionCode);

          if (!permission) {
            notFoundPermissions.push(permissionCode);
            logger.warn(`    ❌ Permiso no encontrado en catálogo: "${permissionCode}"`);
            continue;
          }

          // Verificar si la relación ya existe
          const exists = await profilePermissionRepository.exists(profile.id, permission.id);
          if (exists) {
            logger.log(`    ⏭️  Relación ya existe: ${permissionCode}`);
            continue;
          }

          // Crear relación
          const profilePermission = ProfilePermission.create(profile.id, permission.id);
          profilePermissionsToCreate.push(profilePermission);
        }

        // Guardar relaciones en lote
        if (profilePermissionsToCreate.length > 0) {
          await profilePermissionRepository.saveMany(profilePermissionsToCreate);
          result.stats.totalPermissionsMigrated += profilePermissionsToCreate.length;
          logger.log(`  ✅ ${profilePermissionsToCreate.length} permisos migrados exitosamente`);
        } else {
          logger.log(`  ⏭️  No hay permisos nuevos para migrar`);
        }

        // Registrar permisos no encontrados
        if (notFoundPermissions.length > 0) {
          result.stats.permissionsNotFound.push(...notFoundPermissions);
          logger.warn(`  ⚠️  ${notFoundPermissions.length} permisos no encontrados en catálogo`);
        }

        result.stats.profilesProcessed++;
      } catch (error) {
        result.stats.profilesWithErrors++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.stats.errors.push({
          profileId: profile.id,
          profileName: profile.name,
          error: errorMessage,
        });
        logger.error(`  ❌ Error procesando perfil "${profile.name}": ${errorMessage}`);
      }
    }

    // Mostrar resumen
    console.log('\n========================================');
    console.log('📊 Reporte de Migración');
    console.log('========================================');
    console.log(
      `Estado: ${result.stats.profilesWithErrors === 0 ? '✅ ÉXITO' : '⚠️  CON ERRORES'}`,
    );
    console.log('');
    console.log('Estadísticas:');
    console.log(`  - Total de perfiles: ${result.stats.totalProfiles}`);
    console.log(`  - Perfiles procesados: ${result.stats.profilesProcessed}`);
    console.log(`  - Perfiles omitidos: ${result.stats.profilesSkipped}`);
    console.log(`  - Perfiles con errores: ${result.stats.profilesWithErrors}`);
    console.log(`  - Permisos migrados: ${result.stats.totalPermissionsMigrated}`);

    if (result.stats.permissionsNotFound.length > 0) {
      const uniqueNotFound = [...new Set(result.stats.permissionsNotFound)];
      console.log(`\n⚠️  Permisos no encontrados en catálogo (${uniqueNotFound.length} únicos):`);
      uniqueNotFound.forEach((code) => {
        console.log(`  - ${code}`);
      });
      console.log('\n💡 Acción requerida: Crear estos permisos en el catálogo antes de continuar.');
    }

    if (result.stats.errors.length > 0) {
      console.log('\n❌ Errores encontrados:');
      result.stats.errors.forEach((error, index) => {
        console.log(
          `  ${index + 1}. Perfil "${error.profileName}" (ID: ${error.profileId}): ${error.error}`,
        );
      });
    }

    if (result.stats.profilesWithErrors === 0 && result.stats.permissionsNotFound.length === 0) {
      console.log('\n✅ ¡Migración completada exitosamente!');
      console.log('💡 Próximo paso: Actualizar código de aplicación para usar profile_permissions');
    } else {
      console.log('\n⚠️  Migración completada con advertencias/errores.');
      console.log('💡 Revisa los permisos no encontrados y errores antes de continuar.');
    }

    console.log('\n========================================');
    console.log('✅ Script completado');
    console.log('========================================');

    await app.close();
    process.exit(result.stats.profilesWithErrors > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ Error fatal al ejecutar la migración:', error);
    console.error('========================================');
    process.exit(1);
  }
}

// Solo ejecutar bootstrap si el archivo se ejecuta directamente
if (require.main === module) {
  bootstrap();
}
