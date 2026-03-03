import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de body para actualizar contraseña (sin userId; el userId viene del token).
 */
export class UpdatePasswordBodyDto {
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
