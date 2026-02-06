import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsString, IsIn } from 'class-validator';

export class GetCrossBranchInsightsRequest {
  tenantId: number;

  @ApiProperty({
    description: 'Período de tiempo para análisis',
    enum: ['all', 'month', 'week', 'custom'],
    example: 'month',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['all', 'month', 'week', 'custom'])
  period?: 'all' | 'month' | 'week' | 'custom';

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
