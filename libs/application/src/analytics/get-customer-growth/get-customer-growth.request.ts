import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsIn, IsNumber } from 'class-validator';

export class GetCustomerGrowthRequest {
  tenantId: number;

  @ApiProperty({
    description: 'Agrupación temporal de los datos',
    enum: ['day', 'week', 'month'],
    example: 'week',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';

  @ApiProperty({
    description: 'Número de períodos a mostrar (ej: 4 weeks, 6 months)',
    example: 4,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  periods?: number;

  @ApiProperty({
    description: 'Fecha de inicio custom (ISO 8601)',
    example: '2025-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin custom (ISO 8601)',
    example: '2026-01-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
