import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, User } from '@libs/domain';
import { CreateUserRequest } from './create-user.request';
import { CreateUserResponse } from './create-user.response';
import * as bcrypt from 'bcrypt';

/**
 * Handler para el caso de uso de crear un usuario
 * Implementa la lógica de negocio para registrar un nuevo usuario
 */
@Injectable()
export class CreateUserHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    // Validar que el email no exista
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Generar hash de la contraseña
    const passwordHash = await bcrypt.hash(request.password, 10);

    // Crear la entidad de dominio sin ID (la BD lo generará automáticamente)
    const user = User.create(
      request.email,
      request.name,
      request.firstName,
      request.lastName,
      request.phone,
      passwordHash,
      request.roles || ['customer'],
      request.profile || null,
    );

    // Guardar usando el repositorio (la BD asignará el ID automáticamente)
    const savedUser = await this.userRepository.save(user);

    // Retornar response DTO
    return new CreateUserResponse(
      savedUser.id,
      savedUser.email,
      savedUser.name,
      savedUser.firstName,
      savedUser.lastName,
      savedUser.phone,
      savedUser.profile,
      savedUser.roles,
      savedUser.isActive,
      savedUser.createdAt,
    );
  }
}
