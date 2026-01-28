import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateUserHandler } from '../../users/create-user/create-user.handler';
import { CreateUserRequest } from '../../users/create-user/create-user.request';
import { CreateCustomerMembershipHandler } from '../../customer-memberships/create-customer-membership/create-customer-membership.handler';
import { CreateCustomerMembershipRequest } from '../../customer-memberships/create-customer-membership/create-customer-membership.request';
import { RegisterUserRequest } from './register-user.request';
import { RegisterUserResponse } from './register-user.response';
import { ITenantRepository, IBranchRepository, IInvitationCodeRepository } from '@libs/domain';
import { isValidTenantQuickSearchCode, isValidBranchQuickSearchCode } from '@libs/shared';
import { PartnerSubscriptionEntity } from '@libs/infrastructure';

/**
 * Handler para el caso de uso de registrar un usuario
 * Reutiliza el CreateUserHandler pero con un DTO específico para registro público
 * Si se proporcionan tenantId y registrationBranchId, crea automáticamente una membership
 */
@Injectable()
export class RegisterUserHandler {
  constructor(
    private readonly createUserHandler: CreateUserHandler,
    private readonly createCustomerMembershipHandler: CreateCustomerMembershipHandler,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
    @Inject('IInvitationCodeRepository')
    private readonly invitationCodeRepository: IInvitationCodeRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    // Validar que solo se proporcione uno de los métodos de registro
    const registrationMethods = [
      request.invitationCode,
      request.tenantQuickSearchCode,
      request.branchQuickSearchCode,
      request.tenantId,
    ].filter(Boolean);

    if (registrationMethods.length > 1) {
      throw new BadRequestException(
        'Solo se puede proporcionar uno de los siguientes: invitationCode, tenantQuickSearchCode, branchQuickSearchCode, o tenantId',
      );
    }

    // Convertir RegisterUserRequest a CreateUserRequest
    const createUserRequest = new CreateUserRequest();
    createUserRequest.email = request.email;
    createUserRequest.name = request.name;
    createUserRequest.firstName = request.firstName;
    createUserRequest.lastName = request.lastName;
    createUserRequest.phone = request.phone;
    createUserRequest.password = request.password;
    createUserRequest.roles = ['CUSTOMER']; // Rol por defecto para registro público (siempre en MAYÚSCULAS)

    // Delegar al handler de crear usuario
    const result = await this.createUserHandler.execute(createUserRequest);

    // Procesar códigos y crear membership si corresponde
    let membership = null;
    let resolvedTenantId: number | null = null;
    let resolvedBranchId: number | null = null;

    try {
      // Escenario 1: Código de invitación
      if (request.invitationCode) {
        const invitationCode = await this.invitationCodeRepository.findByCode(
          request.invitationCode,
        );
        if (!invitationCode) {
          throw new NotFoundException(`Invitation code ${request.invitationCode} not found`);
        }

        if (!invitationCode.isValid()) {
          throw new BadRequestException(
            `Invitation code ${request.invitationCode} is not valid (expired, disabled, or limit reached)`,
          );
        }

        resolvedTenantId = invitationCode.tenantId;
        resolvedBranchId = invitationCode.branchId || null;

        // Incrementar contador de usos del código de invitación
        const updatedCode = invitationCode.incrementUses();
        await this.invitationCodeRepository.update(updatedCode);
      }
      // Escenario 2: Código de branch (BRANCH-XXXXXX)
      else if (request.branchQuickSearchCode) {
        if (!isValidBranchQuickSearchCode(request.branchQuickSearchCode)) {
          throw new BadRequestException(
            `Invalid branch quick search code format: ${request.branchQuickSearchCode}`,
          );
        }

        const branch = await this.branchRepository.findByQuickSearchCode(
          request.branchQuickSearchCode,
        );
        if (!branch) {
          throw new NotFoundException(
            `Branch with quick search code ${request.branchQuickSearchCode} not found`,
          );
        }

        if (!branch.isActive()) {
          throw new ForbiddenException(`Branch ${branch.id} is not active`);
        }

        resolvedTenantId = branch.tenantId;
        resolvedBranchId = branch.id;
      }
      // Escenario 3: Código de tenant (TENANT-XXXXXX)
      else if (request.tenantQuickSearchCode) {
        if (!isValidTenantQuickSearchCode(request.tenantQuickSearchCode)) {
          throw new BadRequestException(
            `Invalid tenant quick search code format: ${request.tenantQuickSearchCode}`,
          );
        }

        const tenant = await this.tenantRepository.findByQuickSearchCode(
          request.tenantQuickSearchCode,
        );
        if (!tenant) {
          throw new NotFoundException(
            `Tenant with quick search code ${request.tenantQuickSearchCode} not found`,
          );
        }

        if (!tenant.isActive()) {
          throw new ForbiddenException(`Tenant ${tenant.id} is not active`);
        }

        resolvedTenantId = tenant.id;
        resolvedBranchId = null; // No hay branch específica con código de tenant
      }
      // Escenario 4: tenantId directo (comportamiento existente)
      else if (request.tenantId) {
        resolvedTenantId = request.tenantId;
        resolvedBranchId = request.registrationBranchId || null;
      }

      // Crear membership si se resolvió un tenantId
      if (resolvedTenantId) {
        // Obtener el tenant para acceder al partnerId
        const tenant = await this.tenantRepository.findById(resolvedTenantId);
        if (!tenant) {
          throw new NotFoundException(`Tenant with ID ${resolvedTenantId} not found`);
        }

        // Validar que el partner tenga una suscripción válida
        // Esta validación debe fallar el registro completo si la suscripción no es válida
        await this.validatePartnerSubscription(tenant.partnerId);

        try {
          const createMembershipRequest = new CreateCustomerMembershipRequest();
          createMembershipRequest.userId = result.id;
          createMembershipRequest.tenantId = resolvedTenantId;
          createMembershipRequest.registrationBranchId = resolvedBranchId || undefined;
          createMembershipRequest.points = 0;
          createMembershipRequest.status = 'active';

          console.log(
            `[RegisterUserHandler] Creating membership for user ${result.id}, tenant ${resolvedTenantId}, branch ${resolvedBranchId || 'none'}`,
          );

          const membershipResult =
            await this.createCustomerMembershipHandler.execute(createMembershipRequest);
          membership = membershipResult.membership;

          console.log(
            `[RegisterUserHandler] Membership created successfully: ${membership.id}. Subscription usage should be updated.`,
          );
        } catch (error) {
          // Si falla la creación de la membership, lanzar el error para que el registro falle
          // Esto asegura que el subscription usage se actualice correctamente
          console.error(
            `[RegisterUserHandler] Error creating automatic membership for user ${result.id}, tenant ${resolvedTenantId}:`,
            error,
          );
          throw error; // Lanzar error para que el registro falle si no se puede crear la membership
        }
      }
    } catch (error) {
      // Si es un error de validación de suscripción, relanzarlo para bloquear el registro
      if (error instanceof ForbiddenException && error.message.includes('suscripción')) {
        throw error;
      }
      // Para otros errores (como NotFoundException de tenant), también relanzarlos
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      // Para otros errores inesperados, registrarlos pero no bloquear el registro
      console.error('Error processing registration:', error);
    }

    // Retornar response específico de registro con información de membership si existe
    return new RegisterUserResponse(
      result.id,
      result.email,
      result.name,
      result.createdAt,
      membership,
    );
  }

  /**
   * Valida que el partner tenga una suscripción válida para permitir el registro
   * Permite: 'active', 'trialing' (si no hay active), 'past_due' (si no hay active ni trialing)
   * Bloquea: 'paused', 'suspended', 'cancelled', 'expired', o sin suscripción
   *
   * Optimizado: Usa UNA SOLA query para obtener todas las suscripciones del partner
   * y luego valida por prioridad en memoria, eliminando múltiples round-trips a la BD.
   */
  private async validatePartnerSubscription(partnerId: number): Promise<void> {
    // Obtener todas las suscripciones del partner en una sola query
    const allSubscriptions = await this.subscriptionRepository.find({
      where: { partnerId },
      order: { createdAt: 'DESC' },
    });

    // Si no hay suscripciones, bloquear registro
    if (allSubscriptions.length === 0) {
      console.warn(
        `[RegisterUserHandler] Partner ${partnerId} does not have a subscription. Registration blocked.`,
      );
      throw new ForbiddenException(
        'No se puede realizar el registro debido a que el negocio no tiene una suscripción activa',
      );
    }

    // Separar suscripciones válidas de bloqueadas
    const validStatuses = ['active', 'trialing', 'past_due'];
    const blockedStatuses = ['paused', 'suspended', 'cancelled', 'expired'];

    const validSubscriptions = allSubscriptions.filter((sub) => validStatuses.includes(sub.status));
    const blockedSubscriptions = allSubscriptions.filter((sub) =>
      blockedStatuses.includes(sub.status),
    );

    // Si hay suscripciones válidas, validar por prioridad
    if (validSubscriptions.length > 0) {
      // Prioridad: active > trialing > past_due
      const statusPriority: Record<string, number> = {
        active: 1,
        trialing: 2,
        past_due: 3,
      };

      validSubscriptions.sort((a, b) => {
        const priorityA = statusPriority[a.status] || 999;
        const priorityB = statusPriority[b.status] || 999;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        // Si tienen la misma prioridad, ordenar por fecha (más reciente primero)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      // La primera suscripción es la de mayor prioridad - permitir registro
      return;
    }

    // Si no hay suscripciones válidas pero hay bloqueadas, mostrar el estado
    if (blockedSubscriptions.length > 0) {
      const blockedStatus = blockedSubscriptions[0].status;
      throw new ForbiddenException(
        `No se puede realizar el registro debido a que el negocio ya no está activo. Estado de la suscripción: ${blockedStatus}`,
      );
    }

    // Caso edge: hay suscripciones pero con estados desconocidos
    // Esto no debería pasar, pero por seguridad bloqueamos
    throw new ForbiddenException(
      'No se puede realizar el registro debido a que el negocio no tiene una suscripción activa',
    );
  }
}
