import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsNumber,
  IsIn,
  IsArray,
  ArrayMinSize,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar un partner
 * Todos los campos son opcionales para permitir actualización parcial (PATCH)
 */
export class UpdatePartnerRequest {
  @ApiProperty({
    description: 'Nombre del partner',
    example: 'Grupo Comercial ABC',
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
    example: 'María González',
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
    example: 'maria@abc-comercial.com',
    type: String,
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Teléfono del partner',
    example: '+502 2345-6789',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'ID del país del partner',
    example: 1,
    type: Number,
    required: false,
    nullable: true,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  countryId?: number | null;

  @ApiProperty({
    description: 'Ciudad del partner',
    example: 'Ciudad de Guatemala',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'Plan del partner',
    example: 'conecta',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  plan?: string;

  @ApiProperty({
    description: 'Categoría del negocio',
    example: 'Retail',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'ID de la moneda',
    example: 8,
    type: Number,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  currencyId?: number;

  @ApiProperty({
    description: 'Razón social del negocio',
    example: 'Grupo Comercial ABC S.A. de C.V.',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiProperty({
    description: 'Número de identificación fiscal',
    example: 'RFC-ABC-123456',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiProperty({
    description: 'Dirección fiscal',
    example: 'Zona 10, Guatemala City, Guatemala',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  fiscalAddress?: string;

  @ApiProperty({
    description: 'Método de pago',
    example: 'Tarjeta de crédito',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({
    description: 'Email para facturación',
    example: 'facturacion@abc-comercial.com',
    type: String,
    required: false,
  })
  @IsEmail()
  @IsOptional()
  billingEmail?: string;

  @ApiProperty({
    description: 'Dominio del partner',
    example: 'abc-comercial.com',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiProperty({
    description: 'URL del logo del partner',
    example: 'https://ui-avatars.com/api/?name=Grupo+ABC&background=4f46e5&color=fff',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  logo?: string | null;

  @ApiProperty({
    description: 'URL del banner del partner',
    example: 'https://example.com/banners/partner-banner.jpg',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  banner?: string | null;

  @ApiProperty({
    description: 'Número de sucursales',
    example: 5,
    type: Number,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  branchesNumber?: number;

  @ApiProperty({
    description: 'Sitio web del partner',
    example: 'https://abc-comercial.com',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  website?: string | null;

  @ApiProperty({
    description: 'Redes sociales del partner',
    example: '@abccomercial',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  socialMedia?: string | null;

  @ApiProperty({
    description: 'Estado del partner',
    example: 'active',
    enum: ['active', 'suspended', 'inactive'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['active', 'suspended', 'inactive'])
  status?: 'active' | 'suspended' | 'inactive';
}
