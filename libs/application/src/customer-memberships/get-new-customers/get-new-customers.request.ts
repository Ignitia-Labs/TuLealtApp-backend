import { IsInt, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type NewCustomersGroupBy = 'day' | 'week' | 'month';

export class GetNewCustomersRequest {
  @ApiProperty({ example: 1, description: 'ID del tenant' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenantId: number;

  @ApiPropertyOptional({
    example: 'week',
    enum: ['day', 'week', 'month'],
    description: 'Agrupación temporal',
    default: 'week',
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: NewCustomersGroupBy;

  @ApiPropertyOptional({
    example: 4,
    description: 'Número de semanas a devolver (solo si groupBy="week")',
    default: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  weeks?: number;

  @ApiPropertyOptional({
    example: '2026-01-01T00:00:00Z',
    description: 'Fecha de inicio (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-01-31T23:59:59Z',
    description: 'Fecha de fin (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
