import {
  IsOptional,
  IsString,
  MinLength,
  IsNumber,
  IsEnum,
  Min,
  IsArray,
  ValidateIf,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar un nivel de cliente
 * Todos los campos son opcionales para permitir actualización parcial (PATCH)
 */
export class UpdateCustomerTierRequest {
  @ApiProperty({
    description: 'Nombre del tier',
    example: 'Bronce',
    type: String,
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiProperty({
    description: 'Descripción del tier',
    example: 'Nivel inicial para nuevos clientes',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiProperty({
    description: 'Puntos mínimos requeridos para este tier',
    example: 0,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => o.minPoints !== null && o.minPoints !== undefined)
  @Min(0)
  minPoints?: number;

  @ApiProperty({
    description: 'Puntos máximos para este tier (null = sin límite superior, tier más alto)',
    example: 1000,
    type: Number,
    minimum: 0,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => o.maxPoints !== null && o.maxPoints !== undefined)
  @Min(0)
  maxPoints?: number | null;

  @ApiProperty({
    description: 'Color del tier en formato hexadecimal (#RRGGBB)',
    example: '#cd7f32',
    type: String,
    pattern: '^#[0-9A-Fa-f]{6}$',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'color must be a valid hexadecimal color code (e.g., #ffd700)',
  })
  color?: string;

  @ApiProperty({
    description: 'Lista de beneficios del tier',
    example: ['Descuento del 5%', 'Envío gratis'],
    type: String,
    isArray: true,
    required: false,
    nullable: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefits?: string[] | null;

  @ApiProperty({
    description: 'Multiplicador de puntos (ej: 1.1 = 10% bonus). Debe ser >= 1.0',
    example: 1.05,
    type: Number,
    minimum: 1.0,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => o.multiplier !== null && o.multiplier !== undefined)
  @Min(1.0)
  multiplier?: number | null;

  @ApiProperty({
    description: 'Nombre del icono o URL del icono del tier',
    example: 'star',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  icon?: string | null;

  @ApiProperty({
    description: 'Prioridad del tier (menor número = más bajo, mayor número = más alto)',
    example: 1,
    type: Number,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  priority?: number;

  @ApiProperty({
    description: 'Estado del tier',
    example: 'active',
    enum: ['active', 'inactive'],
    enumName: 'CustomerTierStatus',
    required: false,
  })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';
}
