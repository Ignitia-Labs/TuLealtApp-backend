import { IsNotEmpty, IsNumber, IsString, IsEmail, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar el perfil de un usuario
 */
export class UpdateUserProfileRequest {
  @ApiProperty({
    description: 'ID del usuario a actualizar',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'updated@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'John',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  firstName?: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  lastName?: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '+9876543210',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
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

