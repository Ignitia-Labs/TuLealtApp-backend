import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para agregar un permiso a un perfil
 */
export class AddPermissionToProfileRequest {
  @ApiProperty({
    description: 'ID del permiso a agregar al perfil',
    example: 5,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  permissionId: number;
}
