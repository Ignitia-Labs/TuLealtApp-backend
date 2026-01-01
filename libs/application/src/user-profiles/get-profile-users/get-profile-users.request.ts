import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener los usuarios con un perfil específico
 */
export class GetProfileUsersRequest {
  @ApiProperty({
    description: 'ID del perfil',
    example: 5,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  profileId: number;
}

