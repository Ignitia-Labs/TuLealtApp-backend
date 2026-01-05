import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para asignar un perfil a un usuario
 */
export class AssignProfileToUserRequest {
  @ApiProperty({
    description: 'ID del usuario al que se asignará el perfil',
    example: 10,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: 'ID del perfil a asignar',
    example: 5,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  profileId: number;

  @ApiProperty({
    description: 'ID del usuario que realiza la asignación (del JWT)',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  assignedBy: number;
}
