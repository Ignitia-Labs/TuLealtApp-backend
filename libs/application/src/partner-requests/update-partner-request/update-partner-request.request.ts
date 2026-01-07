import {
  IsEmail,
  IsString,
  IsOptional,
  IsNumber,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar una solicitud de partner
 * Todos los campos son opcionales
 */
export class UpdatePartnerRequestRequest {
  @ApiProperty({
    description: 'ID de la solicitud a actualizar',
    example: 1,
    type: Number,
  })
  @IsNumber()
  requestId: number;

  @ApiProperty({
    description: 'Nombre del partner',
    example: 'Restaurante La Cocina del Sol',
    type: String,
    minLength: 2,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiProperty({
    description: 'Nombre del responsable',
    example: 'Roberto Méndez',
    type: String,
    minLength: 2,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  responsibleName?: string;

  @ApiProperty({
    description: 'Email del partner',
    example: 'roberto@cocinasol.gt',
    type: String,
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Teléfono del partner',
    example: '+502 3333-4444',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'ID del país del partner (referencia al catálogo de países)',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  countryId?: number | null;

  @ApiProperty({
    description: 'Ciudad del partner',
    example: 'Antigua Guatemala',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'Plan del partner (slug del plan)',
    example: 'conecta',
    enum: ['esencia', 'conecta', 'inspira'],
    required: false,
  })
  @IsString()
  @IsOptional()
  plan?: string;

  @ApiProperty({
    description:
      'ID del plan de precios (referencia a pricing_plans.id). Este es el campo principal que se usará para la suscripción.',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  planId?: number | null;

  @ApiProperty({
    description: 'Categoría del partner',
    example: 'Restaurantes',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Sitio web del partner',
    example: 'https://cocinasol.gt',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  website?: string | null;

  @ApiProperty({
    description: 'Redes sociales del partner',
    example: '@cocinadelsolgt',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  socialMedia?: string | null;
}

