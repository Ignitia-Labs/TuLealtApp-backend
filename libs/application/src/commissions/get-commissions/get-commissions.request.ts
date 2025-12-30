import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Request DTO para obtener comisiones con filtros
 */
export class GetCommissionsRequest {
  @ApiProperty({
    description: 'ID del usuario staff (opcional)',
    example: 5,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  staffUserId?: number;

  @ApiProperty({
    description: 'ID del partner (opcional)',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  partnerId?: number;

  @ApiProperty({
    description: 'Estado de la comisión',
    example: 'pending',
    enum: ['pending', 'paid', 'cancelled'],
    required: false,
  })
  @IsEnum(['pending', 'paid', 'cancelled'])
  @IsOptional()
  status?: 'pending' | 'paid' | 'cancelled';

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

  @ApiProperty({
    description: 'Número de página',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    description: 'Límite de resultados por página',
    example: 50,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

