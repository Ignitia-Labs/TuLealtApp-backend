import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para un perfil asignado a un usuario
 */
export class UserProfileDto {
  @ApiProperty({
    description: 'ID único de la asignación',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del perfil',
    example: 5,
    type: Number,
  })
  profileId: number;

  @ApiProperty({
    description: 'Nombre del perfil',
    example: 'Gerente de Tienda',
    type: String,
  })
  profileName: string;

  @ApiProperty({
    description: 'Descripción del perfil',
    example: 'Puede gestionar productos y ver reportes',
    type: String,
    nullable: true,
  })
  profileDescription: string | null;

  @ApiProperty({
    description: 'Array de permisos del perfil',
    example: ['admin.users.create', 'admin.users.view'],
    type: [String],
  })
  permissions: string[];

  @ApiProperty({
    description: 'ID del usuario que asignó el perfil',
    example: 1,
    type: Number,
  })
  assignedBy: number;

  @ApiProperty({
    description: 'Fecha de asignación',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  assignedAt: Date;

  @ApiProperty({
    description: 'Indica si la asignación está activa',
    example: true,
    type: Boolean,
  })
  isActive: boolean;

  constructor(
    id: number,
    profileId: number,
    profileName: string,
    profileDescription: string | null,
    permissions: string[],
    assignedBy: number,
    assignedAt: Date,
    isActive: boolean,
  ) {
    this.id = id;
    this.profileId = profileId;
    this.profileName = profileName;
    this.profileDescription = profileDescription;
    this.permissions = permissions;
    this.assignedBy = assignedBy;
    this.assignedAt = assignedAt;
    this.isActive = isActive;
  }
}

/**
 * DTO de response para obtener los perfiles de un usuario
 */
export class GetUserProfilesResponse {
  @ApiProperty({
    description: 'Lista de perfiles asignados al usuario',
    type: UserProfileDto,
    isArray: true,
  })
  profiles: UserProfileDto[];

  @ApiProperty({
    description: 'Total de perfiles asignados',
    example: 2,
    type: Number,
  })
  total: number;

  constructor(profiles: UserProfileDto[], total: number) {
    this.profiles = profiles;
    this.total = total;
  }
}
