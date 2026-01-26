import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { CreateUserHandler } from '../../users/create-user/create-user.handler';
import { CreateUserRequest } from '../../users/create-user/create-user.request';
import { CreateCustomerMembershipHandler } from '../../customer-memberships/create-customer-membership/create-customer-membership.handler';
import { CreateCustomerMembershipRequest } from '../../customer-memberships/create-customer-membership/create-customer-membership.request';
import { RegisterUserRequest } from './register-user.request';
import { RegisterUserResponse } from './register-user.response';
import { ITenantRepository, IBranchRepository, IInvitationCodeRepository } from '@libs/domain';
import {
  isValidTenantQuickSearchCode,
  isValidBranchQuickSearchCode,
  parseQuickSearchCode,
} from '@libs/shared';

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
        const createMembershipRequest = new CreateCustomerMembershipRequest();
        createMembershipRequest.userId = result.id;
        createMembershipRequest.tenantId = resolvedTenantId;
        createMembershipRequest.registrationBranchId = resolvedBranchId || undefined;
        createMembershipRequest.points = 0;
        createMembershipRequest.status = 'active';

        const membershipResult =
          await this.createCustomerMembershipHandler.execute(createMembershipRequest);
        membership = membershipResult.membership;
      }
    } catch (error) {
      // Si falla la creación de la membership, no fallamos el registro del usuario
      // pero registramos el error para debugging
      console.error('Error creating automatic membership:', error);
      // Podríamos lanzar el error si queremos que el registro falle si no se puede crear la membership
      // throw error;
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
}
