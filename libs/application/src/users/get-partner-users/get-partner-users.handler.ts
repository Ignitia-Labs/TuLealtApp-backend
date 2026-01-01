import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository, IPartnerRepository } from '@libs/domain';
import { GetPartnerUsersRequest } from './get-partner-users.request';
import { GetPartnerUsersResponse, PartnerUserDto } from './get-partner-users.response';

/**
 * Handler para el caso de uso de obtener usuarios de un partner
 * Retorna usuarios con roles PARTNER y PARTNER_STAFF asociados al partner
 */
@Injectable()
export class GetPartnerUsersHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
  ) {}

  async execute(request: GetPartnerUsersRequest): Promise<GetPartnerUsersResponse> {
    // Validar que el partner exista
    const partner = await this.partnerRepository.findById(request.partnerId);
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${request.partnerId} not found`);
    }

    // Obtener usuarios con roles PARTNER y PARTNER_STAFF del partner específico
    const skip = request.skip || 0;
    const take = request.take || 50;
    const includeInactive = request.includeInactive !== undefined ? request.includeInactive : true;

    // Usar método optimizado del repositorio que filtra directamente en la base de datos
    const partnerUsers = await this.userRepository.findByPartnerIdAndRoles(
      request.partnerId,
      ['PARTNER', 'PARTNER_STAFF'],
      skip,
      take,
      includeInactive,
    );

    // Obtener total de usuarios del partner (para paginación)
    const total = await this.userRepository.countByPartnerIdAndRoles(
      request.partnerId,
      ['PARTNER', 'PARTNER_STAFF'],
      includeInactive,
    );

    // Mapear a DTOs
    const userDtos = partnerUsers.map(
      (user) =>
        new PartnerUserDto(
          user.id,
          user.email,
          user.name,
          user.firstName,
          user.lastName,
          user.phone,
          user.roles,
          user.partnerId,
          user.isActive,
          user.createdAt,
        ),
    );

    return new GetPartnerUsersResponse(userDtos, total);
  }
}

