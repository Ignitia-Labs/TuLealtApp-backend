import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { IUserRepository } from '@libs/domain';
import { UpdatePartnerUserPasswordRequest } from './update-partner-user-password.request';
import { UpdatePartnerUserPasswordResponse } from './update-partner-user-password.response';
import * as bcrypt from 'bcrypt';

/**
 * Handler para el caso de uso de actualizar la contraseña de un usuario de partner
 * Permite a un admin actualizar la contraseña sin requerir la contraseña actual
 */
@Injectable()
export class UpdatePartnerUserPasswordHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    request: UpdatePartnerUserPasswordRequest,
  ): Promise<UpdatePartnerUserPasswordResponse> {
    // Buscar el usuario existente
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${request.userId} not found`);
    }

    // Validar que el usuario pertenezca a un partner
    if (!user.partnerId) {
      throw new BadRequestException(
        `User with ID ${request.userId} is not associated with a partner`,
      );
    }

    // Validar que el usuario tenga rol PARTNER o PARTNER_STAFF
    const isPartnerUser = user.roles.includes('PARTNER') || user.roles.includes('PARTNER_STAFF');
    if (!isPartnerUser) {
      throw new BadRequestException(
        `User with ID ${request.userId} is not a partner user (must have role PARTNER or PARTNER_STAFF)`,
      );
    }

    // Generar hash de la nueva contraseña
    const newPasswordHash = await bcrypt.hash(request.newPassword, 10);

    // Actualizar la contraseña usando el método de dominio
    const updatedUser = user.updatePassword(newPasswordHash);

    // Guardar los cambios
    const savedUser = await this.userRepository.update(updatedUser);

    // Retornar response DTO
    return new UpdatePartnerUserPasswordResponse(savedUser.id, savedUser.email, savedUser.updatedAt);
  }
}
