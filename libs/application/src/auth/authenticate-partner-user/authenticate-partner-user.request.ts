import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para autenticar un usuario de partner
 * Requiere el dominio del partner para identificar la organización
 */
export class AuthenticatePartnerUserRequest {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'partner@example.com',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'SecurePass123!',
    type: String,
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description:
      'Dominio del partner al que pertenece el usuario (identificador único del partner)',
    example: 'miempresa.gt',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  partnerDomain: string;
}
