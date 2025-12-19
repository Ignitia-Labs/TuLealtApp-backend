import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para bloquear un usuario
 */
export class LockUserRequest {
  @ApiProperty({
    description: 'ID del usuario a bloquear',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
