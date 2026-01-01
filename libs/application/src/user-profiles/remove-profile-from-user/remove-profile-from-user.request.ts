import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para remover una asignación de perfil a usuario
 */
export class RemoveProfileFromUserRequest {
  @ApiProperty({
    description: 'ID único de la asignación a remover',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  userProfileId: number;
}

