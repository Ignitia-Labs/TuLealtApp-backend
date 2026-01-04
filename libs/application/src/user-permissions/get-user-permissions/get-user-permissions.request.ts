import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

/**
 * DTO de request para obtener permisos directos de un usuario
 */
export class GetUserPermissionsRequest {
  @ApiProperty({
    description: 'ID único del usuario',
    example: 10,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}

