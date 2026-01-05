import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  IUserRepository,
  IPartnerRepository,
  IUserProfileRepository,
  IProfileRepository,
  User,
  UserProfile,
} from '@libs/domain';
import { CreatePartnerStaffUserRequest } from './create-partner-staff-user.request';
import { CreatePartnerStaffUserResponse } from './create-partner-staff-user.response';
import * as bcrypt from 'bcrypt';

/**
 * Handler para el caso de uso de crear un usuario PARTNER_STAFF
 * Crea un usuario con rol PARTNER_STAFF asociado a un partner específico
 * Opcionalmente asigna perfiles al usuario
 */
@Injectable()
export class CreatePartnerStaffUserHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IUserProfileRepository')
    private readonly userProfileRepository: IUserProfileRepository,
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
  ) {}

  async execute(request: CreatePartnerStaffUserRequest): Promise<CreatePartnerStaffUserResponse> {
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

    // Validar perfiles si se proporcionan
    const assignedProfileIds: number[] = [];
    if (request.profileIds && request.profileIds.length > 0) {
      for (const profileId of request.profileIds) {
        const profile = await this.profileRepository.findById(profileId);
        if (!profile) {
          throw new NotFoundException(`Profile with ID ${profileId} not found`);
        }

        // Validar que el perfil esté activo
        if (!profile.isActive) {
          throw new BadRequestException(`Profile with ID ${profileId} is not active`);
        }

        // Validar que el perfil pertenezca al partner o sea global
        if (profile.partnerId !== null && profile.partnerId !== request.partnerId) {
          throw new BadRequestException(
            `Profile with ID ${profileId} does not belong to partner ${request.partnerId}`,
          );
        }

        assignedProfileIds.push(profileId);
      }
    }

    // Generar hash de la contraseña
    const passwordHash = await bcrypt.hash(request.password, 10);

    // Crear usuario con rol PARTNER_STAFF y partnerId
    const user = User.create(
      request.email,
      request.name,
      request.firstName,
      request.lastName,
      request.phone,
      passwordHash,
      ['PARTNER_STAFF'], // Rol fijo para usuarios PARTNER_STAFF
      request.profile || null,
      request.partnerId, // Asociar al partner
      null, // tenantId
      null, // branchId
      null, // avatar
      'active', // status
    );

    // Guardar usuario
    const savedUser = await this.userRepository.save(user);

    // Asignar perfiles si se proporcionaron
    if (assignedProfileIds.length > 0) {
      // Obtener el ID del usuario que está creando (del contexto, por ahora usamos el mismo usuario)
      // En producción, esto vendría del JWT
      const assignedBy = savedUser.id; // Temporal: debería venir del contexto de autenticación

      for (const profileId of assignedProfileIds) {
        const userProfile = UserProfile.create(savedUser.id, profileId, assignedBy, true);
        await this.userProfileRepository.save(userProfile);
      }
    }

    // Retornar response DTO
    return new CreatePartnerStaffUserResponse(
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
      assignedProfileIds,
    );
  }
}
