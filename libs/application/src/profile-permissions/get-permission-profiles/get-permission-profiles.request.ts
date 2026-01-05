import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener perfiles que tienen un permiso específico
 */
export class GetPermissionProfilesRequest {
  @ApiProperty({
    description: 'ID del permiso',
    example: 5,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  permissionId: number;
}
