import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class PricingPeriodDto {
  @ApiProperty({ example: 19, nullable: true, required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  monthly?: number | null;

  @ApiProperty({ example: 54, nullable: true, required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  quarterly?: number | null;

  @ApiProperty({ example: 102, nullable: true, required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  semiannual?: number | null;

  @ApiProperty({ example: 182, nullable: true, required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  annual?: number | null;
}

class PricingPromotionDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  discountPercent: number;

  @ApiProperty({ example: '5% OFF - Ahorra pagando trimestral' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: '2025-12-31T23:59:59Z', required: false })
  @IsString()
  @IsOptional()
  validUntil?: string;
}

class BillingPeriodPromotionsDto {
  @ApiProperty({ required: false, type: PricingPromotionDto })
  @ValidateNested()
  @Type(() => PricingPromotionDto)
  @IsOptional()
  monthly?: PricingPromotionDto;

  @ApiProperty({ required: false, type: PricingPromotionDto })
  @ValidateNested()
  @Type(() => PricingPromotionDto)
  @IsOptional()
  quarterly?: PricingPromotionDto;

  @ApiProperty({ required: false, type: PricingPromotionDto })
  @ValidateNested()
  @Type(() => PricingPromotionDto)
  @IsOptional()
  semiannual?: PricingPromotionDto;

  @ApiProperty({ required: false, type: PricingPromotionDto })
  @ValidateNested()
  @Type(() => PricingPromotionDto)
  @IsOptional()
  annual?: PricingPromotionDto;
}

class PricingFeatureDto {
  @ApiProperty({ example: 'f1' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Clientes ilimitados' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean;
}

class LegacyPromotionDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  discountPercent: number;

  @ApiProperty({ example: '20% OFF - Oferta Lanzamiento' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: '2025-12-31T23:59:59Z', required: false })
  @IsString()
  @IsOptional()
  validUntil?: string;
}

class PricingPlanLimitsDto {
  @ApiProperty({
    example: 1,
    description: 'Máximo número de tenants (-1 para ilimitado)',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxTenants?: number;

  @ApiProperty({
    example: 5,
    description: 'Máximo número de branches (-1 para ilimitado)',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxBranches?: number;

  @ApiProperty({
    example: 1000,
    description: 'Máximo número de customers (-1 para ilimitado)',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxCustomers?: number;

  @ApiProperty({
    example: 50,
    description: 'Máximo número de rewards (-1 para ilimitado)',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxRewards?: number;

  @ApiProperty({
    example: 3,
    description: 'Máximo número de admins (-1 para ilimitado)',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxAdmins?: number;

  @ApiProperty({
    example: 10,
    description: 'Almacenamiento en GB (-1 para ilimitado)',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  storageGB?: number;

  @ApiProperty({
    example: 10000,
    description: 'Llamadas API por mes (-1 para ilimitado)',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  apiCallsPerMonth?: number;
}

/**
 * DTO de request para actualizar un plan de precios
 */
export class UpdatePricingPlanRequest {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  planId: number;

  @ApiProperty({ example: 'Esencia', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '🟢', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({
    example: 'esencia',
    description: 'Slug único del plan (debe ser único en la base de datos)',
    required: false,
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: 19, nullable: true, required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  basePrice?: number | null;

  @ApiProperty({ example: '/mes', required: false })
  @IsString()
  @IsOptional()
  period?: string;

  @ApiProperty({ type: PricingPeriodDto, required: false })
  @ValidateNested()
  @Type(() => PricingPeriodDto)
  @IsOptional()
  pricing?: PricingPeriodDto;

  @ApiProperty({ type: BillingPeriodPromotionsDto, required: false })
  @ValidateNested()
  @Type(() => BillingPeriodPromotionsDto)
  @IsOptional()
  promotions?: BillingPeriodPromotionsDto | null;

  @ApiProperty({ example: 'Para quienes recién comienzan a fidelizar', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [PricingFeatureDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingFeatureDto)
  @IsOptional()
  features?: PricingFeatureDto[];

  @ApiProperty({ example: 'Comenzar Ahora', required: false })
  @IsString()
  @IsOptional()
  cta?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  highlighted?: boolean;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive'], required: false })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';

  @ApiProperty({ type: LegacyPromotionDto, required: false })
  @ValidateNested()
  @Type(() => LegacyPromotionDto)
  @IsOptional()
  promotion?: LegacyPromotionDto | null;

  @ApiProperty({ example: 1, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiProperty({
    example: 14,
    description: 'Días de prueba gratuita',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  trialDays?: number;

  @ApiProperty({
    example: false,
    description: 'Indica si es el plan más popular',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  popular?: boolean;

  @ApiProperty({
    type: PricingPlanLimitsDto,
    description: 'Límites del plan de precios (si se proporciona, se actualizarán completamente)',
    required: false,
  })
  @ValidateNested()
  @Type(() => PricingPlanLimitsDto)
  @IsOptional()
  limits?: PricingPlanLimitsDto | null;
}
