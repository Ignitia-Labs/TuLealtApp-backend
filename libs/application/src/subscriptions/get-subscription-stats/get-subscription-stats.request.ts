import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetSubscriptionStatsRequest {
  @ApiProperty({
    description: 'Fecha de inicio del período (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsString()
  startDate: string;

  @ApiProperty({
    description: 'Fecha de fin del período (ISO 8601)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Agrupar resultados por período',
    enum: ['day', 'week', 'month', 'quarter', 'year'],
    example: 'month',
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'quarter', 'year'])
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}
