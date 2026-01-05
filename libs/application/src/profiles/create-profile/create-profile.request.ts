import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para crear un perfil
 */
export class CreateProfileRequest {
  @ApiProperty({
    description: 'Nombre del perfil',
    example: 'Gerente de Tienda',
    type: String,
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Descripción del perfil (opcional)',
    example: 'Puede gestionar productos y ver reportes',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'ID del partner (opcional, null = perfil global)',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => o.partnerId !== null)
  partnerId?: number | null;

  @ApiProperty({
    description: 'Array de permisos en formato module.resource.action',
    example: ['admin.users.create', 'admin.users.view', 'admin.reports.view'],
    type: [String],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissions: string[];

  @ApiProperty({
    description: 'Indica si el perfil está activo',
    example: true,
    type: Boolean,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
