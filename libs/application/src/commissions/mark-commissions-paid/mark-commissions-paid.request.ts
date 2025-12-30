import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsString,
} from 'class-validator';

/**
 * Request DTO para marcar comisiones como pagadas
 */
export class MarkCommissionsPaidRequest {
  @ApiProperty({
    description: 'IDs de las comisiones a marcar como pagadas',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  commissionIds: number[];

  @ApiProperty({
    description: 'Fecha de pago (ISO 8601). Si no se proporciona, se usa la fecha actual',
    example: '2024-01-15T00:00:00Z',
    type: String,
    required: false,
  })
  @IsDateString()
  @IsOptional()
  paidDate?: string;

  @ApiProperty({
    description: 'Notas adicionales',
    example: 'Pago realizado mediante transferencia bancaria',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

