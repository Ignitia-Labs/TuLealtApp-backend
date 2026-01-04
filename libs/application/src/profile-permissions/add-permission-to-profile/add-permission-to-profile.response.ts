import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para agregar un permiso a un perfil
 */
export class AddPermissionToProfileResponse {
  @ApiProperty({
    description: 'ID único de la relación perfil-permiso',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID del perfil',
    example: 1,
    type: Number,
  })
  profileId: number;

  @ApiProperty({
    description: 'ID del permiso agregado',
    example: 5,
    type: Number,
  })
  permissionId: number;

  @ApiProperty({
    description: 'Código del permiso agregado',
    example: 'admin.users.create',
    type: String,
  })
  permissionCode: string;

  @ApiProperty({
    description: 'Fecha de creación de la relación',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  createdAt: Date;

  constructor(
    id: number,
    profileId: number,
    permissionId: number,
    permissionCode: string,
    createdAt: Date,
  ) {
    this.id = id;
    this.profileId = profileId;
    this.permissionId = permissionId;
    this.permissionCode = permissionCode;
    this.createdAt = createdAt;
  }
}

