import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para eliminar un perfil
 */
export class DeleteProfileRequest {
  @ApiProperty({
    description: 'ID único del perfil a eliminar',
    example: 1,
    type: Number,
  })
  @IsNumber()
  profileId: number;
}

