import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para eliminar un usuario
 */
export class DeleteUserRequest {
  @ApiProperty({
    description: 'ID del usuario a eliminar',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}

