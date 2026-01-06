import { Injectable, Inject } from '@nestjs/common';
import {
  IPermissionRepository,
  Permission,
  IProfilePermissionRepository,
  ProfilePermission,
  IProfileRepository,
} from '@libs/domain';
import { BaseSeed } from '../base/base-seed';

/**
 * Seed para crear el catálogo centralizado de permisos
 * Crea todos los permisos definidos en los perfiles del sistema
 *
 * Este seed debe ejecutarse después de ProfilesSeed para poder vincular los permisos a los perfiles
 */
@Injectable()
export class PermissionsSeed extends BaseSeed {
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
    @Inject('IProfilePermissionRepository')
    private readonly profilePermissionRepository: IProfilePermissionRepository,
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
  ) {
    super();
  }

  getName(): string {
    return 'PermissionsSeed';
  }

  /**
   * Obtiene todos los códigos de permisos definidos en los perfiles del sistema
   * Estos son los permisos hardcodeados en ProfilesSeed
   */
  private getAllPermissionCodes(): string[] {
    return [
      // Permisos administrativos
      'admin.*',
      'admin.users.*',
      'admin.users.view',
      'admin.users.create',
      'admin.users.update',
      'admin.partners.*',
      'admin.partners.view',
      'admin.partners.create',
      'admin.partners.update',
      'admin.subscriptions.*',
      'admin.subscriptions.view',
      'admin.subscriptions.create',
      'admin.subscriptions.update',
      'admin.billing.*',
      'admin.billing.view',
      'admin.invoices.*',
      'admin.invoices.view',
      'admin.invoices.create',
      'admin.payments.*',
      'admin.payments.view',
      'admin.payments.create',
      'admin.profiles.*',
      'admin.profiles.view',
      'admin.user-profiles.*',
      'admin.user-profiles.view',
      'admin.user-profiles.assign',
      'admin.catalogs.*',
      'admin.catalogs.view',
      'admin.catalogs.create',
      'admin.catalogs.update',
      'admin.rewards.*',
      'admin.rewards.view',
      'admin.rewards.create',
      'admin.rewards.update',
      'admin.transactions.*',
      'admin.transactions.view',
      'admin.notifications.*',
      'admin.notifications.view',
      'admin.goals.*',
      'admin.goals.view',
      'admin.goals.create',
      'admin.goals.update',
      'admin.commissions.*',
      'admin.commissions.view',
      'admin.communication.*',
      'admin.communication.view',
      'admin.communication.create',
      // Permisos de partner
      'partner.*',
      'partner.branches.*',
      'partner.products.*',
      'partner.rewards.*',
      'partner.customers.*',
      'partner.customers.view',
      'partner.customers.create',
      'partner.transactions.*',
      'partner.transactions.view',
      'partner.transactions.create',
      'partner.reports.*',
      'partner.reports.view',
      'partner.staff.*',
      'partner.staff.view',
      'partner.staff.manage',
      'partner.profiles.*',
      'partner.profiles.view',
      'partner.profiles.create',
      'partner.profiles.update',
    ];
  }

  async run(): Promise<void> {
    this.log('Iniciando seed de permisos...');

    try {
      // Obtener todos los códigos de permisos definidos
      const allPermissionCodes = this.getAllPermissionCodes();
      const uniquePermissions = new Set(allPermissionCodes);

      this.log(`Creando ${uniquePermissions.size} permisos únicos...`);

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

      this.log(
        `✓ Seed de permisos completado: ${createdCount} creados, ${skippedCount} ya existían`,
      );

      // Después de crear los permisos, vincularlos a los perfiles
      this.log('\nVinculando permisos a perfiles...');
      await this.linkPermissionsToProfiles();
    } catch (error) {
      this.error(`Error en seed de permisos: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Vincula los permisos creados a los perfiles correspondientes
   * Usa los mismos datos hardcodeados que ProfilesSeed
   */
  private async linkPermissionsToProfiles(): Promise<void> {
    try {
      // Definir los perfiles y sus permisos (mismo formato que ProfilesSeed)
      const profilePermissionsMap: Record<string, string[]> = {
        'Super Admin': ['admin.*'],
        Admin: [
          'admin.users.*',
          'admin.partners.*',
          'admin.subscriptions.*',
          'admin.billing.*',
          'admin.invoices.*',
          'admin.payments.*',
          'admin.profiles.*',
          'admin.user-profiles.*',
          'admin.catalogs.*',
          'admin.rewards.*',
          'admin.transactions.*',
          'admin.notifications.*',
          'admin.goals.*',
          'admin.commissions.*',
          'admin.communication.*',
        ],
        Staff: [
          'admin.users.view',
          'admin.users.create',
          'admin.users.update',
          'admin.partners.view',
          'admin.partners.create',
          'admin.partners.update',
          'admin.subscriptions.view',
          'admin.subscriptions.create',
          'admin.subscriptions.update',
          'admin.billing.view',
          'admin.invoices.view',
          'admin.invoices.create',
          'admin.payments.view',
          'admin.payments.create',
          'admin.profiles.view',
          'admin.user-profiles.view',
          'admin.user-profiles.assign',
          'admin.catalogs.view',
          'admin.catalogs.create',
          'admin.catalogs.update',
          'admin.rewards.view',
          'admin.rewards.create',
          'admin.rewards.update',
          'admin.transactions.view',
          'admin.notifications.view',
          'admin.goals.view',
          'admin.goals.create',
          'admin.goals.update',
          'admin.commissions.view',
          'admin.communication.view',
          'admin.communication.create',
        ],
        'Partner Owner': ['partner.*'],
        'Gerente de Tienda': [
          'partner.branches.*',
          'partner.products.*',
          'partner.rewards.*',
          'partner.customers.view',
          'partner.transactions.view',
          'partner.reports.view',
          'partner.staff.view',
          'partner.staff.manage',
          'partner.profiles.view',
          'partner.profiles.create',
          'partner.profiles.update',
        ],
        Vendedor: [
          'partner.products.view',
          'partner.rewards.view',
          'partner.customers.view',
          'partner.customers.create',
          'partner.transactions.create',
          'partner.transactions.view',
        ],
        Cajero: [
          'partner.transactions.create',
          'partner.transactions.view',
          'partner.customers.view',
          'partner.rewards.view',
        ],
        Analista: [
          'partner.reports.view',
          'partner.transactions.view',
          'partner.customers.view',
          'partner.products.view',
          'partner.rewards.view',
        ],
      };

      let linkedCount = 0;
      let skippedCount = 0;

      for (const [profileName, permissionCodes] of Object.entries(profilePermissionsMap)) {
        // Buscar el perfil por nombre
        const profile = await this.profileRepository.findByName(profileName, null);
        if (!profile) {
          this.log(`  ⚠️  Perfil "${profileName}" no encontrado, omitiendo...`);
          continue;
        }

        // Obtener relaciones actuales
        const currentProfilePermissions = await this.profilePermissionRepository.findByProfileId(
          profile.id,
        );
        const currentPermissionIds = new Set(
          currentProfilePermissions.map((pp) => pp.permissionId),
        );

        // Obtener IDs de permisos desde códigos
        const newPermissionIds: number[] = [];
        for (const permissionCode of permissionCodes) {
          const permission = await this.permissionRepository.findByCode(permissionCode);
          if (permission && permission.isActive) {
            newPermissionIds.push(permission.id);
          }
        }

        // Determinar qué agregar
        const toAdd: number[] = [];
        for (const permissionId of newPermissionIds) {
          if (!currentPermissionIds.has(permissionId)) {
            toAdd.push(permissionId);
          }
        }

        // Agregar nuevas relaciones
        if (toAdd.length > 0) {
          const newProfilePermissions = toAdd.map((permissionId) =>
            ProfilePermission.create(profile.id, permissionId),
          );
          await this.profilePermissionRepository.saveMany(newProfilePermissions);
          linkedCount += toAdd.length;
          this.log(`  ✓ ${profileName}: ${toAdd.length} permiso(s) vinculado(s)`);
        } else {
          skippedCount += permissionCodes.length;
          this.log(`  - ${profileName}: todos los permisos ya están vinculados`);
        }
      }

      this.log(
        `✓ Vinculación completada: ${linkedCount} permisos vinculados, ${skippedCount} ya existían`,
      );
    } catch (error) {
      this.log(`  ⚠️  Advertencia al vincular permisos: ${error.message}`);
      // No fallar si hay error al vincular (puede ser que los perfiles no existan aún)
    }
  }

  /**
   * Parsea un código de permiso en sus componentes
   * Soporta formato: "module.resource.action" o "module.*"
   */
  private parsePermissionCode(
    code: string,
  ): { module: string; resource: string; action: string } | null {
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
