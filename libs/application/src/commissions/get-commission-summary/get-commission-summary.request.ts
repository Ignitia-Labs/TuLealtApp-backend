import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

/**
 * Request DTO para obtener resumen de comisiones
 */
export class GetCommissionSummaryRequest {
  @ApiProperty({
    description: 'ID del usuario staff',
    example: 5,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  staffUserId: number;

  @ApiProperty({
    description: 'Fecha de inicio (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
    type: String,
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
    type: String,
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
