import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IProfileRepository, Profile } from '@libs/domain';
import { ProfileEntity, ProfileMapper } from '@libs/infrastructure';
import { GetProfilesRequest } from './get-profiles.request';
import { GetProfilesResponse, ProfileDto } from './get-profiles.response';

/**
 * Handler para el caso de uso de obtener múltiples perfiles
 */
@Injectable()
export class GetProfilesHandler {
  constructor(
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
    @InjectRepository(ProfileEntity)
    private readonly profileEntityRepository: Repository<ProfileEntity>,
  ) {}

  async execute(request: GetProfilesRequest): Promise<GetProfilesResponse> {
    let profiles: Profile[];

    // Aplicar filtros según el request
    if (request.partnerId !== undefined && request.partnerId !== null) {
      // Filtrar por partnerId específico
      profiles = await this.profileRepository.findByPartnerId(request.partnerId);
    } else if (request.partnerId === null) {
      // Solo perfiles globales
      profiles = await this.profileRepository.findGlobalProfiles();
    } else {
      // Sin filtro de partnerId, obtener todos (globales + específicos)
      const where: any = {};
      if (!request.includeInactive) {
        where.isActive = true;
      }

      const profileEntities = await this.profileEntityRepository.find({
        where,
        order: {
          partnerId: 'ASC',
          name: 'ASC',
        },
      });

      profiles = profileEntities.map((entity) => ProfileMapper.toDomain(entity));
    }

    // Filtrar inactivos si no se incluyen (solo si no usamos query directa)
    if (request.partnerId === undefined && !request.includeInactive) {
      profiles = profiles.filter((profile) => profile.isActive);
    }

    // Convertir a DTOs, cargando permisos desde profile_permissions cuando estén disponibles
    const profileDtos = await Promise.all(
      profiles.map(async (profile) => {
        // Obtener permisos desde profile_permissions
        // Después de eliminar la columna permissions, siempre se cargará desde profile_permissions
        const permissionsFromTable = await this.profileRepository.findPermissionsByProfileId(
          profile.id,
        );
        // Usar permisos de tabla intermedia (después de migración, profile.permissions será array vacío)
        const finalPermissions = permissionsFromTable.length > 0 ? permissionsFromTable : [];

        return new ProfileDto(
          profile.id,
          profile.name,
          profile.description,
          profile.partnerId,
          finalPermissions,
          profile.isActive,
          profile.createdAt,
          profile.updatedAt,
        );
      }),
    );

    return new GetProfilesResponse(profileDtos, profileDtos.length);
  }
}

