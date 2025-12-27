import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '@libs/domain';
import { GetAdminStaffUsersRequest } from './get-admin-staff-users.request';
import {
  GetAdminStaffUsersResponse,
  AdminStaffUserDto,
} from './get-admin-staff-users.response';

/**
 * Handler para el caso de uso de obtener usuarios con roles ADMIN o STAFF
 */
@Injectable()
export class GetAdminStaffUsersHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    request: GetAdminStaffUsersRequest,
  ): Promise<GetAdminStaffUsersResponse> {
    const skip = request.skip || 0;
    const take = request.take || 50;

    // Buscar usuarios con roles ADMIN o STAFF
    const users = await this.userRepository.findByRoles(
      ['ADMIN', 'STAFF'],
      skip,
      take,
    );

    // Mapear a DTOs
    const userDtos = users.map(
      (user) =>
        new AdminStaffUserDto(
          user.id,
          user.email,
          user.name,
          user.firstName,
          user.lastName,
          user.phone,
          user.roles,
          user.isActive,
          user.createdAt,
        ),
    );

    // Obtener el total de usuarios con roles ADMIN o STAFF
    const total = await this.userRepository.countByRoles(['ADMIN', 'STAFF']);

    return new GetAdminStaffUsersResponse(userDtos, total);
  }
}
