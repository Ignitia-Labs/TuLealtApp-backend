import { IsOptional, IsString, MinLength, IsNumber, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar un tenant
 * Todos los campos son opcionales para permitir actualización parcial (PATCH)
 */
export class UpdateTenantRequest {
  @ApiProperty({
    description: 'Nombre del tenant',
    example: 'Café Delicia',
    type: String,
    minLength: 2,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiProperty({
    description: 'Categoría del tenant',
    example: 'Cafeterías',
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
  @IsNumber()
  @IsOptional()
  currencyId?: number;

  @ApiProperty({
    description: 'Color primario del tenant',
    example: '#ec4899',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiProperty({
    description: 'Color secundario del tenant',
    example: '#fbbf24',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @ApiProperty({
    description: 'Descripción del tenant',
    example: 'Cafetería gourmet con sabor artesanal',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiProperty({
    description: 'URL del logo del tenant',
    example: 'https://ui-avatars.com/api/?name=Cafe+Delicia&background=ec4899&color=fff',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  logo?: string | null;

  @ApiProperty({
    description: 'URL del banner del tenant',
    example: 'http://localhost:9000/tulealtapp-images/tenants/abc123-banner.png',
    type: String,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  banner?: string | null;

  @ApiProperty({
    description: 'Días hasta que expiren los puntos',
    example: 365,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  pointsExpireDays?: number;

  @ApiProperty({
    description: 'Puntos mínimos para canjear',
    example: 100,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  minPointsToRedeem?: number;

  @ApiProperty({
    description: 'Porcentaje de impuestos aplicable al tenant',
    example: 12.5,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  taxPercentage?: number;

  @ApiProperty({
    description: 'Estado del tenant',
    example: 'active',
    enum: ['active', 'inactive', 'suspended'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended'])
  status?: 'active' | 'inactive' | 'suspended';

  // Features
  @ApiProperty({
    description: 'Habilitar escaneo QR',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  qrScanning?: boolean;

  @ApiProperty({
    description: 'Habilitar modo offline',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  offlineMode?: boolean;

  @ApiProperty({
    description: 'Habilitar programa de referidos',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  referralProgram?: boolean;

  @ApiProperty({
    description: 'Habilitar recompensas de cumpleaños',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  birthdayRewards?: boolean;
}
