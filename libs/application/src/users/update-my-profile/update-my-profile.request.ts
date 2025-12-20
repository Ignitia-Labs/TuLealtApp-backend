import { IsString, IsEmail, IsOptional, IsObject, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar el perfil del usuario autenticado
 * No requiere userId ya que se obtiene del token JWT
 */
export class UpdateMyProfileRequest {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'John Doe',
    required: false,
    minLength: 2,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'John',
    required: false,
    minLength: 2,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  firstName?: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Doe',
    required: false,
    minLength: 2,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  lastName?: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'updated@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '+9876543210',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Perfil adicional del usuario (objeto JSON)',
    example: { preferences: { language: 'en', theme: 'dark' } },
    required: false,
    nullable: true,
  })
  @IsObject()
  @IsOptional()
  profile?: Record<string, any> | null;
}

