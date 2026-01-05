import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener permisos de un perfil
 */
export class GetProfilePermissionsRequest {
  @ApiProperty({
    description: 'ID del perfil',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  profileId: number;
}
