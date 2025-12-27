import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { CatalogType } from '@libs/domain';

/**
 * DTO de request para obtener catálogos
 */
export class GetCatalogsRequest {
  @ApiProperty({
    description: 'Tipo de catálogo a filtrar (opcional, si no se especifica retorna todos)',
    example: 'BUSINESS_CATEGORIES',
    enum: ['BUSINESS_CATEGORIES', 'REWARD_TYPES', 'PAYMENT_METHODS'],
    required: false,
  })
  @IsEnum(['BUSINESS_CATEGORIES', 'REWARD_TYPES', 'PAYMENT_METHODS'])
  @IsOptional()
  type?: CatalogType;

  @ApiProperty({
    description: 'Si se incluyen elementos inactivos en la respuesta',
    example: false,
    type: Boolean,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean;
}
