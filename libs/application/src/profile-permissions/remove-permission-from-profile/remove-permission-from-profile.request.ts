import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para remover un permiso de un perfil
 */
export class RemovePermissionFromProfileRequest {
  @ApiProperty({
    description: 'ID del permiso a remover del perfil',
    example: 5,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  permissionId: number;
}

