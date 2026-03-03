import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para actualización parcial del perfil del cliente (PATCH).
 * Todos los campos son opcionales; solo se actualizan los enviados.
 */
export class PatchCustomerProfileRequest {
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
    description: 'Teléfono del usuario',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Indica si el usuario está activo',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Identificador del avatar seleccionado (numérico o string)',
    example: '1',
    required: false,
    nullable: true,
  })
  @IsOptional()
  avatarId?: string | number | null;

  @ApiProperty({
    description: 'Gradient o color de fondo del avatar',
    example: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  avatarBackground?: string | null;
}
