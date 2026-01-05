import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para asignar un permiso directo a un usuario
 */
export class AssignPermissionToUserRequest {
  @ApiProperty({
    description: 'ID del usuario al que se asignará el permiso',
    example: 10,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: 'ID del permiso a asignar',
    example: 5,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  permissionId: number;
}
