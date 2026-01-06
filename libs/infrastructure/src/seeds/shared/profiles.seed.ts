import { Injectable, Inject } from '@nestjs/common';
import {
  IProfileRepository,
  Profile,
  IProfilePermissionRepository,
  IPermissionRepository,
  ProfilePermission,
} from '@libs/domain';
import { BaseSeed } from '../base/base-seed';

/**
 * Seed para crear los perfiles predefinidos del sistema
 *
 * Perfiles administrativos (globales):
 * - Super Admin: Acceso completo al sistema
 * - Admin: Gestión completa excepto configuración crítica
 * - Staff: Operaciones administrativas básicas
 *
 * Perfiles de partner (globales, disponibles para todos los partners):
 * - Partner Owner: Dueño del partner, acceso completo a su organización
 * - Gerente de Tienda: Gestión de tiendas y operaciones
 * - Vendedor: Operaciones de venta y atención al cliente
 * - Cajero: Operaciones de caja y transacciones
 * - Analista: Visualización de reportes y análisis
 */
@Injectable()
export class ProfilesSeed extends BaseSeed {
  constructor(
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
    @Inject('IProfilePermissionRepository')
    private readonly profilePermissionRepository: IProfilePermissionRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {
    super();
  }

  getName(): string {
    return 'ProfilesSeed';
  }

  async run(): Promise<void> {
    this.log('Iniciando seed de perfiles...');

    try {
      // Perfiles administrativos (globales, partnerId = null)
      const adminProfiles = [
        {
          name: 'Super Admin',
          description:
            'Acceso completo al sistema. Puede gestionar todo, incluyendo configuración crítica.',
          permissions: ['admin.*'],
        },
        {
          name: 'Admin',
          description: 'Gestión completa del sistema excepto configuración crítica.',
          permissions: [
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
        },
        {
          name: 'Staff',
          description:
            'Operaciones administrativas básicas. Puede ver y gestionar recursos pero no eliminar.',
          permissions: [
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
        },
      ];

      // Perfiles de partner (globales, disponibles para todos los partners)
      const partnerProfiles = [
        {
          name: 'Partner Owner',
          description: 'Dueño del partner. Acceso completo a su organización y configuración.',
          permissions: ['partner.*'],
        },
        {
          name: 'Gerente de Tienda',
          description: 'Gestión de tiendas, productos, recompensas y reportes.',
          permissions: [
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
        },
        {
          name: 'Vendedor',
          description: 'Operaciones de venta, atención al cliente y registro de transacciones.',
          permissions: [
            'partner.products.view',
            'partner.rewards.view',
            'partner.customers.view',
            'partner.customers.create',
            'partner.transactions.create',
            'partner.transactions.view',
          ],
        },
        {
          name: 'Cajero',
          description: 'Operaciones de caja y registro de transacciones.',
          permissions: [
            'partner.transactions.create',
            'partner.transactions.view',
            'partner.customers.view',
            'partner.rewards.view',
          ],
        },
        {
          name: 'Analista',
          description: 'Visualización de reportes y análisis. Solo lectura.',
          permissions: [
            'partner.reports.view',
            'partner.transactions.view',
            'partner.customers.view',
            'partner.products.view',
            'partner.rewards.view',
          ],
        },
      ];

      // Crear perfiles administrativos
      this.log('Creando perfiles administrativos...');
      for (const profileData of adminProfiles) {
        await this.createOrUpdateProfile(
          profileData.name,
          profileData.description,
          profileData.permissions,
          null,
        );
      }

      // Crear perfiles de partner
      this.log('Creando perfiles de partner...');
      for (const profileData of partnerProfiles) {
        await this.createOrUpdateProfile(
          profileData.name,
          profileData.description,
          profileData.permissions,
          null,
        );
      }

      this.log('✓ Seed de perfiles completado exitosamente');
    } catch (error) {
      this.error(`Error en seed de perfiles: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Crea o actualiza un perfil si ya existe
   * NOTA: Los permisos se crean con array vacío ya que la columna fue eliminada.
   * Las relaciones se crean en profile_permissions después de que los permisos existan.
   */
  private async createOrUpdateProfile(
    name: string,
    description: string,
    permissionCodes: string[],
    partnerId: number | null,
  ): Promise<void> {
    try {
      const existingProfile = await this.profileRepository.findByName(name, partnerId);

      if (existingProfile) {
        // Verificar si necesita actualización
        const descriptionChanged = existingProfile.description !== description;

        if (descriptionChanged) {
          // Actualizar solo descripción (los permisos se gestionan en profile_permissions)
          const updatedProfile = new Profile(
            existingProfile.id,
            existingProfile.name,
            description,
            existingProfile.partnerId,
            [], // Permisos vacíos - se gestionan en profile_permissions
            existingProfile.isActive,
            existingProfile.createdAt,
            new Date(),
          );

          await this.profileRepository.update(updatedProfile);
          this.log(`✓ Perfil actualizado: ${name} (ID: ${existingProfile.id})`);
        } else {
          this.log(`- Perfil ya existe: ${name} (ID: ${existingProfile.id})`);
        }

        // Sincronizar permisos en profile_permissions
        await this.syncProfilePermissions(existingProfile.id, permissionCodes);
      } else {
        // Crear nuevo perfil sin permisos (la columna fue eliminada)
        const profile = Profile.create(name, [], description, partnerId, true);
        const savedProfile = await this.profileRepository.save(profile);
        this.log(
          `✓ Perfil creado: ${name} (ID: ${savedProfile.id}, permisos a asignar: ${permissionCodes.length})`,
        );

        // Sincronizar permisos en profile_permissions
        await this.syncProfilePermissions(savedProfile.id, permissionCodes);
      }
    } catch (error) {
      this.error(`Error al crear/actualizar perfil ${name}: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Sincroniza los permisos de un perfil en la tabla profile_permissions
   * Si los permisos no existen aún, se omiten (se crearán cuando PermissionsSeed ejecute)
   */
  private async syncProfilePermissions(
    profileId: number,
    permissionCodes: string[],
  ): Promise<void> {
    try {
      // Obtener relaciones actuales
      const currentProfilePermissions =
        await this.profilePermissionRepository.findByProfileId(profileId);
      const currentPermissionIds = new Set(currentProfilePermissions.map((pp) => pp.permissionId));

      // Obtener IDs de permisos desde códigos
      const newPermissionIds: number[] = [];
      for (const permissionCode of permissionCodes) {
        const permission = await this.permissionRepository.findByCode(permissionCode);
        if (permission && permission.isActive) {
          newPermissionIds.push(permission.id);
        }
        // Si el permiso no existe aún, se omite (se creará cuando PermissionsSeed ejecute)
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
          ProfilePermission.create(profileId, permissionId),
        );
        await this.profilePermissionRepository.saveMany(newProfilePermissions);
        this.log(
          `  → ${toAdd.length} permiso(s) asignado(s) al perfil (${permissionCodes.length - toAdd.length} permisos aún no existen en el catálogo)`,
        );
      } else if (permissionCodes.length > 0) {
        this.log(
          `  → Todos los permisos ya están asignados o no existen aún en el catálogo (${permissionCodes.length} códigos)`,
        );
      }
    } catch (error) {
      // No fallar si hay error al sincronizar permisos (pueden no existir aún)
      this.log(`  ⚠️  Advertencia: No se pudieron sincronizar permisos: ${error.message}`);
    }
  }
}
