import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para un perfil en la lista
 */
export class ProfileDto {
  @ApiProperty({
    description: 'ID único del perfil',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Nombre del perfil',
    example: 'Gerente de Tienda',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Descripción del perfil',
    example: 'Puede gestionar productos y ver reportes',
    type: String,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'ID del partner (null = perfil global)',
    example: 1,
    type: Number,
    nullable: true,
  })
  partnerId: number | null;

  @ApiProperty({
    description: 'Array de permisos del perfil',
    example: ['admin.users.create', 'admin.users.view'],
    type: [String],
  })
  permissions: string[];

  @ApiProperty({
    description: 'Indica si el perfil está activo',
    example: true,
    type: Boolean,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación del perfil',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del perfil',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    name: string,
    description: string | null,
    partnerId: number | null,
    permissions: string[],
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.partnerId = partnerId;
    this.permissions = permissions;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

/**
 * DTO de response para obtener perfiles
 */
export class GetProfilesResponse {
  @ApiProperty({
    description: 'Lista de perfiles',
    type: ProfileDto,
    isArray: true,
  })
  profiles: ProfileDto[];

  @ApiProperty({
    description: 'Total de perfiles encontrados',
    example: 10,
    type: Number,
  })
  total: number;

  constructor(profiles: ProfileDto[], total: number) {
    this.profiles = profiles;
    this.total = total;
  }
}
