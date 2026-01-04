import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';

/**
 * Request DTO para obtener dashboard de comisiones
 */
export class GetCommissionsDashboardRequest {
  @ApiProperty({
    description: 'Fecha de inicio del período (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
    type: String,
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin del período (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
    type: String,
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Agrupación de período para estadísticas',
    example: 'daily',
    enum: ['daily', 'weekly', 'monthly'],
    required: false,
  })
  @IsEnum(['daily', 'weekly', 'monthly'])
  @IsOptional()
  periodGroup?: 'daily' | 'weekly' | 'monthly';

  @ApiProperty({
    description: 'Número de top staff a retornar',
    example: 10,
    type: Number,
    required: false,
  })
  @IsOptional()
  topStaffLimit?: number;

  @ApiProperty({
    description: 'Número de top partners a retornar',
    example: 10,
    type: Number,
    required: false,
  })
  @IsOptional()
  topPartnersLimit?: number;
}





