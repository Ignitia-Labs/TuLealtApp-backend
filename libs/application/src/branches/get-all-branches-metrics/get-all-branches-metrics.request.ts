import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';

/**
 * DTO de request para obtener métricas de todas las sucursales de un tenant
 */
export class GetAllBranchesMetricsRequest {
  /**
   * ID del tenant (se asigna desde el param de la URL)
   */
  tenantId: number;

  @ApiProperty({
    description: 'Período de tiempo para las métricas',
    example: 'month',
    required: false,
    enum: ['all', 'month', 'week', 'custom'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['all', 'month', 'week', 'custom'])
  period?: 'all' | 'month' | 'week' | 'custom';

  @ApiProperty({
    description: 'Fecha de inicio (ISO 8601) - requerido si period es "custom"',
    example: '2026-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin (ISO 8601) - requerido si period es "custom"',
    example: '2026-01-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
