import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener los perfiles de un usuario
 */
export class GetUserProfilesRequest {
  @ApiProperty({
    description: 'ID del usuario',
    example: 10,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}

