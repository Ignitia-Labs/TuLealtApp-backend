import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener un perfil por ID
 */
export class GetProfileRequest {
  @ApiProperty({
    description: 'ID único del perfil',
    example: 1,
    type: Number,
  })
  @IsNumber()
  profileId: number;
}
