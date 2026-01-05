import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para remover un permiso de un perfil
 */
export class RemovePermissionFromProfileResponse {
  @ApiProperty({
    description: 'ID del perfil',
    example: 1,
    type: Number,
  })
  profileId: number;

  @ApiProperty({
    description: 'ID del permiso removido',
    example: 5,
    type: Number,
  })
  permissionId: number;

  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Permission removed from profile successfully',
    type: String,
  })
  message: string;

  constructor(profileId: number, permissionId: number, message: string) {
    this.profileId = profileId;
    this.permissionId = permissionId;
    this.message = message;
  }
}
