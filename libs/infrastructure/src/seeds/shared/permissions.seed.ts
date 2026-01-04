import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IProfileRepository, IPermissionRepository, Permission, Profile } from '@libs/domain';
import { ProfileEntity, ProfileMapper } from '@libs/infrastructure';
import { BaseSeed } from '../base/base-seed';

/**
 * Seed para crear el catálogo centralizado de permisos
 * Extrae permisos únicos de los perfiles existentes y los crea en el catálogo
 *
 * Este seed debe ejecutarse después de ProfilesSeed para poder extraer los permisos
 */
@Injectable()
export class PermissionsSeed extends BaseSeed {
  constructor(
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
    @InjectRepository(ProfileEntity)
    private readonly profileEntityRepository: Repository<ProfileEntity>,
  ) {
    super();
  }

  getName(): string {
    return 'PermissionsSeed';
  }

  async run(): Promise<void> {
    this.log('Iniciando seed de permisos...');

    try {
      // Obtener todos los perfiles existentes
      const allProfiles = await this.getAllProfiles();

      // Extraer todos los permisos únicos de los perfiles
      const uniquePermissions = new Set<string>();
      for (const profile of allProfiles) {
        for (const permissionCode of profile.permissions) {
          uniquePermissions.add(permissionCode);
        }
      }

      this.log(`Encontrados ${uniquePermissions.size} permisos únicos en los perfiles`);

      // Crear permisos en el catálogo
      let createdCount = 0;
      let skippedCount = 0;

      for (const permissionCode of Array.from(uniquePermissions).sort()) {
        try {
          // Verificar si el permiso ya existe
          const existingPermission = await this.permissionRepository.findByCode(permissionCode);
          if (existingPermission) {
            skippedCount++;
            continue;
          }

          // Parsear el permiso para obtener module, resource y action
          const parsed = this.parsePermissionCode(permissionCode);
          if (!parsed) {
            this.error(`No se pudo parsear el permiso: ${permissionCode}`);
            continue;
          }

          // Crear el permiso
          const permission = Permission.create(
            permissionCode,
            parsed.module,
            parsed.resource,
            parsed.action,
            this.getPermissionDescription(permissionCode),
            true,
          );

          await this.permissionRepository.save(permission);
          createdCount++;
          this.log(`✓ Permiso creado: ${permissionCode}`);
        } catch (error) {
          this.error(`Error al crear permiso ${permissionCode}: ${error.message}`, error);
        }
      }

      this.log(`✓ Seed de permisos completado: ${createdCount} creados, ${skippedCount} ya existían`);
    } catch (error) {
      this.error(`Error en seed de permisos: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Obtiene todos los perfiles del sistema
   */
  private async getAllProfiles(): Promise<Profile[]> {
    // Obtener todos los perfiles usando query directa
    const profileEntities = await this.profileEntityRepository.find({
      order: {
        partnerId: 'ASC',
        name: 'ASC',
      },
    });

    return profileEntities.map((entity) => ProfileMapper.toDomain(entity));
  }

  /**
   * Parsea un código de permiso en sus componentes
   * Soporta formato: "module.resource.action" o "module.*"
   */
  private parsePermissionCode(code: string): { module: string; resource: string; action: string } | null {
    if (!code || typeof code !== 'string') {
      return null;
    }

    // Manejar wildcards (ej: "admin.*")
    if (code.endsWith('.*')) {
      const module = code.slice(0, -2); // Remover ".*"
      if (!module || module.length === 0) {
        return null;
      }
      return {
        module,
        resource: '*',
        action: '*',
      };
    }

    // Formato estándar: module.resource.action
    const parts = code.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [module, resource, action] = parts;
    if (!module || !resource || !action) {
      return null;
    }

    return { module, resource, action };
  }

  /**
   * Genera una descripción automática para un permiso basado en su código
   */
  private getPermissionDescription(code: string): string {
    const parsed = this.parsePermissionCode(code);
    if (!parsed) {
      return `Permiso: ${code}`;
    }

    if (parsed.action === '*') {
      return `Acceso completo al módulo ${parsed.module}`;
    }

    const actionMap: Record<string, string> = {
      create: 'Crear',
      view: 'Ver',
      update: 'Actualizar',
      delete: 'Eliminar',
      manage: 'Gestionar',
      assign: 'Asignar',
      remove: 'Remover',
    };

    const resourceMap: Record<string, string> = {
      users: 'usuarios',
      partners: 'partners',
      subscriptions: 'suscripciones',
      billing: 'facturación',
      invoices: 'facturas',
      payments: 'pagos',
      profiles: 'perfiles',
      'user-profiles': 'asignaciones de perfiles',
      'user-permissions': 'asignaciones de permisos',
      permissions: 'permisos',
      catalogs: 'catálogos',
      rewards: 'recompensas',
      transactions: 'transacciones',
      notifications: 'notificaciones',
      goals: 'metas',
      commissions: 'comisiones',
      communication: 'comunicación',
      branches: 'sucursales',
      products: 'productos',
      customers: 'clientes',
      reports: 'reportes',
      staff: 'personal',
    };

    const moduleMap: Record<string, string> = {
      admin: 'administración',
      partner: 'partner',
    };

    const actionText = actionMap[parsed.action] || parsed.action;
    const resourceText = resourceMap[parsed.resource] || parsed.resource;
    const moduleText = moduleMap[parsed.module] || parsed.module;

    return `${actionText} ${resourceText} en ${moduleText}`;
  }
}

