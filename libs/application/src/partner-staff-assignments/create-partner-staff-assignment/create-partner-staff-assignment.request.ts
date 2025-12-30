import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsNotEmpty,
  Min,
  Max,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * Request DTO para crear una asignación staff-partner
 */
export class CreatePartnerStaffAssignmentRequest {
  @ApiProperty({
    description: 'ID del partner',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  partnerId: number;

  @ApiProperty({
    description: 'ID del usuario staff',
    example: 5,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  staffUserId: number;

  @ApiProperty({
    description: 'Porcentaje de comisión (0-100)',
    example: 15.5,
    type: Number,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  commissionPercent: number;

  @ApiProperty({
    description: 'Fecha de inicio de la asignación',
    example: '2024-01-01T00:00:00Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'Fecha de fin de la asignación (opcional)',
    example: '2024-12-31T23:59:59Z',
    type: String,
    format: 'date-time',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string | null;

  @ApiProperty({
    description: 'Notas adicionales',
    example: 'Asignación inicial del vendedor',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string | null;
}

