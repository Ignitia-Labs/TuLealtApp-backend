import { IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar la contraseña de un usuario
 */
export class UpdatePasswordRequest {
  @ApiProperty({
    description: 'ID del usuario que actualiza su contraseña',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: 'Contraseña actual del usuario (requerida para validación)',
    example: 'CurrentPass123!',
    type: String,
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  currentPassword: string;

  @ApiProperty({
    description: 'Nueva contraseña del usuario (mínimo 6 caracteres)',
    example: 'NewSecurePass123!',
    type: String,
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
