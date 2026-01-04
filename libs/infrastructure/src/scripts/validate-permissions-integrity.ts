import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure.module';
import {
  IProfileRepository,
  IPermissionRepository,
  IUserPermissionRepository,
} from '@libs/domain';
import { ProfileEntity } from '../persistence/entities/profile.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProfileMapper } from '../persistence/mappers/profile.mapper';

/**
 * Módulo específico para el script de validación de permisos
 * Incluye todos los repositorios necesarios
 */
@Module({
  imports: [
    InfrastructureModule,
    TypeOrmModule.forFeature([ProfileEntity]),
  ],
})
class ValidationScriptModule {}

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

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalProfiles: number;
    totalPermissionsInProfiles: number;
    uniquePermissionsInProfiles: number;
    permissionsInCatalog: number;
    missingPermissions: string[];
    orphanedUserPermissions: number;
  };
}

/**
 * Script para validar la integridad del sistema de permisos después de la migración
 *
 * Este script:
 * 1. Verifica que todos los permisos usados en perfiles existan en el catálogo
 * 2. Verifica que no haya permisos huérfanos en user_permissions
 * 3. Genera un reporte detallado de la validación
 *
 * Uso:
 * npm run script:validate-permissions
 * o
 * ts-node -r tsconfig-paths/register libs/infrastructure/src/scripts/validate-permissions-integrity.ts
 */
async function bootstrap() {
  const logger = new Logger('ValidatePermissionsIntegrity');

  console.log('========================================');
  console.log('🔍 Validación de Integridad de Permisos');
  console.log('========================================\n');

  try {
    // Crear aplicación NestJS para tener acceso a la inyección de dependencias
    const app = await NestFactory.createApplicationContext(ValidationScriptModule, {
      logger: ['log', 'error', 'warn'],
    });

    // Obtener repositorios del contenedor de dependencias
    const profileRepository = app.get<IProfileRepository>('IProfileRepository');
    const permissionRepository = app.get<IPermissionRepository>('IPermissionRepository');
    const userPermissionRepository = app.get<IUserPermissionRepository>(
      'IUserPermissionRepository',
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
        throw new Error(
          'No se pudo obtener el repositorio de ProfileEntity ni el DataSource.',
        );
      }
    }

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      stats: {
        totalProfiles: 0,
        totalPermissionsInProfiles: 0,
        uniquePermissionsInProfiles: 0,
        permissionsInCatalog: 0,
        missingPermissions: [],
        orphanedUserPermissions: 0,
      },
    };

    // 1. Obtener todos los perfiles
    logger.log('Obteniendo todos los perfiles...');
    const profileEntities = await profileEntityRepository.find({
      order: {
        partnerId: 'ASC',
        name: 'ASC',
      },
    });

    const profiles = profileEntities.map((entity) => ProfileMapper.toDomain(entity));
    result.stats.totalProfiles = profiles.length;
    logger.log(`Encontrados ${profiles.length} perfiles\n`);

    // 2. Extraer todos los permisos únicos de los perfiles
    logger.log('Extrayendo permisos únicos de los perfiles...');
    const uniquePermissionsInProfiles = new Set<string>();
    let totalPermissionsCount = 0;

    for (const profile of profiles) {
      for (const permissionCode of profile.permissions) {
        uniquePermissionsInProfiles.add(permissionCode);
        totalPermissionsCount++;
      }
    }

    result.stats.totalPermissionsInProfiles = totalPermissionsCount;
    result.stats.uniquePermissionsInProfiles = uniquePermissionsInProfiles.size;
    logger.log(
      `Encontrados ${uniquePermissionsInProfiles.size} permisos únicos en ${totalPermissionsCount} asignaciones totales\n`,
    );

    // 3. Obtener todos los permisos del catálogo
    logger.log('Obteniendo permisos del catálogo...');
    const catalogPermissions = await permissionRepository.findAll();
    result.stats.permissionsInCatalog = catalogPermissions.length;
    logger.log(`Encontrados ${catalogPermissions.length} permisos en el catálogo\n`);

    // 4. Verificar que todos los permisos de perfiles existan en el catálogo
    logger.log('Validando que todos los permisos de perfiles existan en el catálogo...');
    const catalogPermissionCodes = new Set(catalogPermissions.map((p) => p.code));
    const missingPermissions: string[] = [];

    for (const permissionCode of uniquePermissionsInProfiles) {
      if (!catalogPermissionCodes.has(permissionCode)) {
        missingPermissions.push(permissionCode);
        result.errors.push(
          `Permiso "${permissionCode}" usado en perfiles pero no existe en el catálogo`,
        );
      }
    }

    result.stats.missingPermissions = missingPermissions;

    if (missingPermissions.length > 0) {
      result.isValid = false;
      logger.error(`❌ Encontrados ${missingPermissions.length} permisos faltantes:`);
      missingPermissions.forEach((code) => logger.error(`  - ${code}`));
    } else {
      logger.log('✅ Todos los permisos de perfiles existen en el catálogo');
    }

    console.log('');

    // 5. Verificar permisos huérfanos en user_permissions
    logger.log('Validando asignaciones directas de permisos...');
    const allUserPermissions = await userPermissionRepository.findByUserId(0, true); // Obtener todas
    const activeUserPermissions = allUserPermissions.filter((up) => up.isActive);

    let orphanedCount = 0;
    for (const userPermission of activeUserPermissions) {
      const permission = await permissionRepository.findById(userPermission.permissionId);
      if (!permission) {
        orphanedCount++;
        result.errors.push(
          `UserPermission #${userPermission.id} referencia permiso #${userPermission.permissionId} que no existe`,
        );
      } else if (!permission.isActive) {
        result.warnings.push(
          `UserPermission #${userPermission.id} referencia permiso #${userPermission.permissionId} que está inactivo`,
        );
      }
    }

    result.stats.orphanedUserPermissions = orphanedCount;

    if (orphanedCount > 0) {
      result.isValid = false;
      logger.error(`❌ Encontradas ${orphanedCount} asignaciones huérfanas`);
    } else {
      logger.log(`✅ Todas las ${activeUserPermissions.length} asignaciones directas son válidas`);
    }

    console.log('');

    // 6. Verificar perfiles con permisos inválidos
    logger.log('Validando perfiles individuales...');
    let profilesWithInvalidPermissions = 0;

    for (const profile of profiles) {
      const invalidPermissions: string[] = [];
      for (const permissionCode of profile.permissions) {
        if (!catalogPermissionCodes.has(permissionCode)) {
          invalidPermissions.push(permissionCode);
        }
      }

      if (invalidPermissions.length > 0) {
        profilesWithInvalidPermissions++;
        result.errors.push(
          `Perfil "${profile.name}" (ID: ${profile.id}) tiene permisos inválidos: ${invalidPermissions.join(', ')}`,
        );
      }
    }

    if (profilesWithInvalidPermissions > 0) {
      result.isValid = false;
      logger.error(`❌ ${profilesWithInvalidPermissions} perfiles tienen permisos inválidos`);
    } else {
      logger.log('✅ Todos los perfiles tienen permisos válidos');
    }

    // Mostrar resumen
    console.log('\n========================================');
    console.log('📊 Reporte de Validación');
    console.log('========================================');
    console.log(`Estado: ${result.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
    console.log('');
    console.log('Estadísticas:');
    console.log(`  - Total de perfiles: ${result.stats.totalProfiles}`);
    console.log(`  - Permisos únicos en perfiles: ${result.stats.uniquePermissionsInProfiles}`);
    console.log(`  - Permisos en catálogo: ${result.stats.permissionsInCatalog}`);
    console.log(`  - Permisos faltantes: ${result.stats.missingPermissions.length}`);
    console.log(`  - Asignaciones directas huérfanas: ${result.stats.orphanedUserPermissions}`);
    console.log(`  - Perfiles con permisos inválidos: ${profilesWithInvalidPermissions}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errores encontrados:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Advertencias:');
      result.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    if (result.isValid && result.warnings.length === 0) {
      console.log('\n✅ ¡El sistema de permisos está completamente integro!');
    }

    console.log('\n========================================');
    console.log('✅ Validación completada');
    console.log('========================================');

    await app.close();
    process.exit(result.isValid ? 0 : 1);
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ Error fatal al ejecutar la validación:', error);
    console.error('========================================');
    process.exit(1);
  }
}

// Solo ejecutar bootstrap si el archivo se ejecuta directamente
if (require.main === module) {
  bootstrap();
}

