import { Injectable } from '@nestjs/common';
import { CreateUserHandler } from '../../users/create-user/create-user.handler';
import { CreateUserRequest } from '../../users/create-user/create-user.request';
import { RegisterUserRequest } from './register-user.request';
import { RegisterUserResponse } from './register-user.response';

/**
 * Handler para el caso de uso de registrar un usuario
 * Reutiliza el CreateUserHandler pero con un DTO específico para registro público
 */
@Injectable()
export class RegisterUserHandler {
  constructor(private readonly createUserHandler: CreateUserHandler) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    // Convertir RegisterUserRequest a CreateUserRequest
    const createUserRequest = new CreateUserRequest();
    createUserRequest.email = request.email;
    createUserRequest.name = request.name;
    createUserRequest.password = request.password;
    createUserRequest.roles = ['customer']; // Rol por defecto para registro público

    // Delegar al handler de crear usuario
    const result = await this.createUserHandler.execute(createUserRequest);

    // Retornar response específico de registro
    return new RegisterUserResponse(result.id, result.email, result.name, result.createdAt);
  }
}
