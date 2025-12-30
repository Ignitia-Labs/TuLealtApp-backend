import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de request para obtener estadísticas
 */
export class GetStatsRequest {
  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
  @IsString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z' })
  @IsString()
  @IsOptional()
  dateTo?: string;
}

