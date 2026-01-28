import { IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar la contraseña de un usuario de partner (por admin)
 * No requiere la contraseña actual, solo la nueva contraseña
 */
export class UpdatePartnerUserPasswordRequest {
  @ApiProperty({
    description: 'ID del usuario de partner cuya contraseña se actualizará',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

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
