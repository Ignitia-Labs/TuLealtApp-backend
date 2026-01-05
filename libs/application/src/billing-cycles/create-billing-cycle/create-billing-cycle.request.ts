import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsNotEmpty,
  Min,
  IsOptional,
  IsDateString,
  IsString,
  IsEnum,
} from 'class-validator';

/**
 * DTO de request para crear un ciclo de facturación
 */
export class CreateBillingCycleRequest {
  @ApiProperty({
    description: 'ID de la suscripción asociada',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  subscriptionId: number;

  @ApiProperty({
    description: 'Fecha de inicio del período facturado',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'Fecha de fin del período facturado',
    example: '2024-01-31T23:59:59.999Z',
    type: Date,
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    description: 'Fecha en que se genera la facturación',
    example: '2024-02-01T00:00:00.000Z',
    type: Date,
  })
  @IsDateString()
  @IsNotEmpty()
  billingDate: string;

  @ApiProperty({
    description: 'Fecha límite de pago',
    example: '2024-02-08T23:59:59.999Z',
    type: Date,
  })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({
    description: 'Monto base del ciclo',
    example: 99.99,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Moneda del ciclo',
    example: 'USD',
    type: String,
    required: false,
    default: 'USD',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Descuento aplicado (opcional)',
    example: 10.0,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountApplied?: number;
}
