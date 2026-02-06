import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';

export class GetCustomerSegmentationRequest {
  tenantId: number;

  @ApiProperty({
    description: 'Período de tiempo para analizar la actividad de clientes',
    enum: ['all', 'month', 'week', 'custom'],
    example: 'month',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['all', 'month', 'week', 'custom'])
  period?: 'all' | 'month' | 'week' | 'custom';

  @ApiProperty({
    description: 'Fecha de inicio para período custom (ISO 8601)',
    example: '2025-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin para período custom (ISO 8601)',
    example: '2025-01-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
