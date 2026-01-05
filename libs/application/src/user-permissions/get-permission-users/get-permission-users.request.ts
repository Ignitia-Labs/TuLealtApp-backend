import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

/**
 * DTO de request para obtener usuarios con un permiso específico
 */
export class GetPermissionUsersRequest {
  @ApiProperty({
    description: 'ID único del permiso',
    example: 5,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  permissionId: number;
}
