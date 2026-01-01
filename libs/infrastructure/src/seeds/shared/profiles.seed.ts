import { Injectable, Inject } from '@nestjs/common';
import { IProfileRepository, Profile } from '@libs/domain';
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
   */
  private async createOrUpdateProfile(
    name: string,
    description: string,
    permissions: string[],
    partnerId: number | null,
  ): Promise<void> {
    try {
      const existingProfile = await this.profileRepository.findByName(name, partnerId);

      if (existingProfile) {
        // Verificar si necesita actualización
        const permissionsChanged =
          JSON.stringify(existingProfile.permissions.sort()) !== JSON.stringify(permissions.sort());
        const descriptionChanged = existingProfile.description !== description;

        if (permissionsChanged || descriptionChanged) {
          // Actualizar perfil
          let updatedProfile = existingProfile;
          if (permissionsChanged) {
            // Reemplazar todos los permisos
            updatedProfile = new Profile(
              existingProfile.id,
              existingProfile.name,
              description,
              existingProfile.partnerId,
              permissions,
              existingProfile.isActive,
              existingProfile.createdAt,
              new Date(),
            );
          } else if (descriptionChanged) {
            updatedProfile = new Profile(
              existingProfile.id,
              existingProfile.name,
              description,
              existingProfile.partnerId,
              existingProfile.permissions,
              existingProfile.isActive,
              existingProfile.createdAt,
              new Date(),
            );
          }

          await this.profileRepository.update(updatedProfile);
          this.log(
            `✓ Perfil actualizado: ${name} (ID: ${existingProfile.id}, permisos: ${permissions.length})`,
          );
        } else {
          this.log(`- Perfil ya existe: ${name} (ID: ${existingProfile.id})`);
        }
      } else {
        // Crear nuevo perfil
        const profile = Profile.create(name, permissions, description, partnerId, true);
        const savedProfile = await this.profileRepository.save(profile);
        this.log(
          `✓ Perfil creado: ${name} (ID: ${savedProfile.id}, permisos: ${permissions.length})`,
        );
      }
    } catch (error) {
      this.error(`Error al crear/actualizar perfil ${name}: ${error.message}`, error);
      throw error;
    }
  }
}
