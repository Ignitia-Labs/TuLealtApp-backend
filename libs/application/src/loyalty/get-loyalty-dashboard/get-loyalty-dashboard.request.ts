import { IsInt, Min, IsOptional, IsEnum, IsDateString, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type DashboardPeriod = 'all' | 'month' | 'week' | 'custom';

export class GetLoyaltyDashboardRequest {
  @ApiProperty({ example: 1, description: 'ID del tenant' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenantId: number;

  @ApiPropertyOptional({
    example: 'month',
    enum: ['all', 'month', 'week', 'custom'],
    description: 'Período de tiempo para las métricas. Si es "custom", se requieren startDate y endDate',
    default: 'all',
  })
  @IsOptional()
  @IsEnum(['all', 'month', 'week', 'custom'])
  period?: DashboardPeriod;

  @ApiPropertyOptional({
    example: '2026-01-01T00:00:00Z',
    description: 'Fecha de inicio (ISO 8601). Requerido si period="custom"',
  })
  @IsOptional()
  @ValidateIf((o) => o.period === 'custom')
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-01-31T23:59:59Z',
    description: 'Fecha de fin (ISO 8601). Requerido si period="custom"',
  })
  @IsOptional()
  @ValidateIf((o) => o.period === 'custom')
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Si es true, incluye información del cliente en cada transacción',
    default: false,
  })
  @IsOptional()
  includeCustomer?: boolean;
}
