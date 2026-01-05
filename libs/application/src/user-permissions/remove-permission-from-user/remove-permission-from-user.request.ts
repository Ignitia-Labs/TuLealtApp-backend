import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

/**
 * DTO de request para remover una asignación de permiso directo a usuario
 */
export class RemovePermissionFromUserRequest {
  @ApiProperty({
    description: 'ID único de la asignación a remover',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  userPermissionId: number;
}
