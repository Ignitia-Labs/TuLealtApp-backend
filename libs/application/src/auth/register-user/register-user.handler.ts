import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserHandler } from '../../users/create-user/create-user.handler';
import { CreateUserRequest } from '../../users/create-user/create-user.request';
import { CreateCustomerMembershipHandler } from '../../customer-memberships/create-customer-membership/create-customer-membership.handler';
import { CreateCustomerMembershipRequest } from '../../customer-memberships/create-customer-membership/create-customer-membership.request';
import { RegisterUserRequest } from './register-user.request';
import { RegisterUserResponse } from './register-user.response';

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
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    // Validar que si se proporciona tenantId, también se proporcione registrationBranchId
    if (request.tenantId && !request.registrationBranchId) {
      throw new BadRequestException(
        'registrationBranchId is required when tenantId is provided',
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

    // Si se proporcionaron tenantId y registrationBranchId, crear automáticamente la membership
    let membership = null;
    if (request.tenantId && request.registrationBranchId) {
      try {
        const createMembershipRequest = new CreateCustomerMembershipRequest();
        createMembershipRequest.userId = result.id;
        createMembershipRequest.tenantId = request.tenantId;
        createMembershipRequest.registrationBranchId = request.registrationBranchId;
        createMembershipRequest.points = 0;
        createMembershipRequest.status = 'active';

        const membershipResult = await this.createCustomerMembershipHandler.execute(
          createMembershipRequest,
        );
        membership = membershipResult.membership;
      } catch (error) {
        // Si falla la creación de la membership, no fallamos el registro del usuario
        // pero registramos el error para debugging
        console.error('Error creating automatic membership:', error);
        // Podríamos lanzar el error si queremos que el registro falle si no se puede crear la membership
        // throw error;
      }
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
