import { IsInt, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type TopRedeemedRewardsPeriod = 'all' | 'month' | 'week' | 'custom';

export class GetTopRedeemedRewardsRequest {
  @ApiProperty({ example: 1, description: 'ID del tenant' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenantId: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Número de recompensas a devolver',
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    example: 'month',
    enum: ['all', 'month', 'week', 'custom'],
    description: 'Período de tiempo',
    default: 'month',
  })
  @IsOptional()
  @IsEnum(['all', 'month', 'week', 'custom'])
  period?: TopRedeemedRewardsPeriod;

  @ApiPropertyOptional({
    example: '2026-01-01T00:00:00Z',
    description: 'Fecha de inicio (ISO 8601). Si se especifica, se usa en lugar de period',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-01-31T23:59:59Z',
    description: 'Fecha de fin (ISO 8601). Si se especifica, se usa en lugar de period',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
