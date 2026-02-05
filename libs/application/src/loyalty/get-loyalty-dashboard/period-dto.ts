import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para información del período consultado
 */
export class PeriodDto {
  @ApiProperty({ example: '2026-01-01T00:00:00Z', description: 'Fecha de inicio del período' })
  startDate: string;

  @ApiProperty({ example: '2026-01-31T23:59:59Z', description: 'Fecha de fin del período' })
  endDate: string;

  @ApiProperty({
    example: 'month',
    enum: ['all', 'month', 'week', 'custom'],
    description: 'Tipo de período consultado',
  })
  type: 'all' | 'month' | 'week' | 'custom';

  constructor(startDate: string, endDate: string, type: 'all' | 'month' | 'week' | 'custom') {
    this.startDate = startDate;
    this.endDate = endDate;
    this.type = type;
  }
}
