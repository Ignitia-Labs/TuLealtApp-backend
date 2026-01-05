import { IsOptional, IsString, MinLength, IsEmail, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar una branch
 * Todos los campos son opcionales para permitir actualización parcial (PATCH)
 */
export class UpdateBranchRequest {
  @ApiProperty({
    description: 'Nombre de la branch',
    example: 'Café Delicia - Centro',
    type: String,
    minLength: 2,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiProperty({
    description: 'Dirección de la branch',
    example: 'Calle Principal 123, Zona 1',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Ciudad de la branch',
    example: 'Guatemala City',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'País de la branch',
    example: 'Guatemala',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'Teléfono de la branch',
    example: '+502 1234-5678',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  phone?: string | null;

  @ApiProperty({
    description: 'Email de la branch',
    example: 'centro@cafedelicia.com',
    type: String,
    required: false,
    nullable: true,
  })
  @IsEmail()
  @IsOptional()
  email?: string | null;

  @ApiProperty({
    description: 'Estado de la branch',
    example: 'active',
    enum: ['active', 'inactive', 'closed'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive', 'closed'])
  status?: 'active' | 'inactive' | 'closed';
}
