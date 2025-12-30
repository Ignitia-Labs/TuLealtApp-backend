import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsDateString,
  IsString,
  IsBoolean,
} from 'class-validator';

/**
 * Request DTO para actualizar una asignación staff-partner
 */
export class UpdatePartnerStaffAssignmentRequest {
  @ApiProperty({
    description: 'Porcentaje de comisión (0-100)',
    example: 20.0,
    type: Number,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  commissionPercent?: number;

  @ApiProperty({
    description: 'Fecha de inicio de la asignación',
    example: '2024-01-01T00:00:00Z',
    type: String,
    format: 'date-time',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin de la asignación',
    example: '2024-12-31T23:59:59Z',
    type: String,
    format: 'date-time',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string | null;

  @ApiProperty({
    description: 'Indica si la asignación está activa',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Notas adicionales',
    example: 'Actualización del porcentaje de comisión',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string | null;
}

