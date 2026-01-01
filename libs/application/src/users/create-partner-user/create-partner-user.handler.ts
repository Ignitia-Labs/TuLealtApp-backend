import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { IUserRepository, IPartnerRepository, User } from '@libs/domain';
import { CreatePartnerUserRequest } from './create-partner-user.request';
import { CreatePartnerUserResponse } from './create-partner-user.response';
import * as bcrypt from 'bcrypt';

/**
 * Handler para el caso de uso de crear un usuario PARTNER
 * Crea un usuario con rol PARTNER asociado a un partner específico
 */
@Injectable()
export class CreatePartnerUserHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
  ) {}

  async execute(request: CreatePartnerUserRequest): Promise<CreatePartnerUserResponse> {
    // Validar que el partner exista
    const partner = await this.partnerRepository.findById(request.partnerId);
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${request.partnerId} not found`);
    }

    // Validar que el partner esté activo
    if (!partner.isActive()) {
      throw new ConflictException(`Partner with ID ${request.partnerId} is not active`);
    }

    // Validar que el email no exista
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generar hash de la contraseña
    const passwordHash = await bcrypt.hash(request.password, 10);

    // Crear usuario con rol PARTNER y partnerId
    const user = User.create(
      request.email,
      request.name,
      request.firstName,
      request.lastName,
      request.phone,
      passwordHash,
      ['PARTNER'], // Rol fijo para usuarios PARTNER
      request.profile || null,
      request.partnerId, // Asociar al partner
      null, // avatar
      'active', // status
    );

    // Guardar usuario
    const savedUser = await this.userRepository.save(user);

    // Retornar response DTO
    return new CreatePartnerUserResponse(
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
      savedUser.partnerId,
    );
  }
}

