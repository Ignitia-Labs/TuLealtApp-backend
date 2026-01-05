import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsObject,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Tipo de consulta de contacto
 */
export type ContactSubject = 'general' | 'demo' | 'pricing' | 'support' | 'partnership' | 'other';

/**
 * DTO para metadatos de la consulta
 */
class ContactMetadataDto {
  @ApiPropertyOptional({
    description: 'User agent del navegador',
    example: 'Mozilla/5.0...',
  })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'URL de origen (referrer)',
    example: 'https://example.com',
  })
  @IsString()
  @IsOptional()
  referrer?: string;

  @ApiPropertyOptional({
    description: 'Idioma del navegador',
    example: 'es',
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({
    description: 'Timestamp ISO 8601',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsString()
  @IsOptional()
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Fuente del contacto',
    example: 'landing-page',
  })
  @IsString()
  @IsOptional()
  source?: string;
}

/**
 * DTO de request para crear una consulta de contacto
 */
export class CreateContactInquiryRequest {
  @ApiProperty({
    description: 'Nombre completo del contacto',
    example: 'Juan Pérez',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Correo electrónico del contacto',
    example: 'juan.perez@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Nombre de la empresa (opcional)',
    example: 'Acme Corp',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  company?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto (opcional)',
    example: '+502 1234-5678',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({
    description: 'Mensaje del contacto',
    example: 'Me interesa conocer más sobre sus servicios.',
    minLength: 10,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  message: string;

  @ApiProperty({
    description: 'Tipo de consulta',
    enum: ['general', 'demo', 'pricing', 'support', 'partnership', 'other'],
    example: 'demo',
  })
  @IsEnum(['general', 'demo', 'pricing', 'support', 'partnership', 'other'])
  @IsNotEmpty()
  subject: ContactSubject;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales de la consulta',
    type: ContactMetadataDto,
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactMetadataDto)
  metadata?: ContactMetadataDto;
}

