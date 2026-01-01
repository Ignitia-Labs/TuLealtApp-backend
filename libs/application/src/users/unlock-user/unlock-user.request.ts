import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para desbloquear un usuario
 */
export class UnlockUserRequest {
  @ApiProperty({
    description: 'ID del usuario a desbloquear',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}

